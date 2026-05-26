import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import * as fs from "fs";
import { PLATFORM_ID, configPda, supplyPda, curveAuthority, wlPda, ensurePlatformInit, totalWhitelisted, whitelistAuthority } from "./shared";

const BN: typeof anchor.BN = (anchor as any).BN ?? (anchor as any).default?.BN;
const curveIdl = JSON.parse(fs.readFileSync("target/idl/curve.json", "utf8"));
const platformIdl = JSON.parse(fs.readFileSync("target/idl/platform.json", "utf8"));

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ATA_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

// Integration tests for the bonding-curve AMM against a local validator,
// including the cross-program CPI that whitelists the buyer's SOL in the platform.
describe("curve", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = new anchor.Program(curveIdl as anchor.Idl, provider) as Program<anchor.Idl>;
  const platform = new anchor.Program(platformIdl as anchor.Idl, provider);
  const m = program.methods as any;
  const acct = program.account as any;

  before(async () => {
    await ensurePlatformInit(provider);
  });

  const mint = Keypair.generate();
  const pid = program.programId;
  const curve = PublicKey.findProgramAddressSync([Buffer.from("curve"), mint.publicKey.toBuffer()], pid)[0];
  const ata = (owner: PublicKey) =>
    PublicKey.findProgramAddressSync([owner.toBuffer(), TOKEN_PROGRAM.toBuffer(), mint.publicKey.toBuffer()], ATA_PROGRAM)[0];
  const vault = ata(curve);
  const me = provider.wallet.publicKey;
  const myAta = ata(me);

  const VSOL = new BN(30 * LAMPORTS_PER_SOL);
  const SUPPLY = new BN("1000000000000000"); // 1e15 (1B @ 6 decimals)
  const THRESH = new BN(2 * LAMPORTS_PER_SOL);

  it("launches a token + curve and mints supply to the vault", async () => {
    await m
      .launch(VSOL, SUPPLY, THRESH)
      .accountsPartial({
        creator: me,
        mint: mint.publicKey,
        curve,
        vault,
        tokenProgram: TOKEN_PROGRAM,
        associatedTokenProgram: ATA_PROGRAM,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([mint])
      .rpc();
    const c = await acct.bondingCurve.fetch(curve);
    expect(c.tokenReserve.toString()).to.equal(SUPPLY.toString());
    expect(c.realSol.toNumber()).to.equal(0);
    const vb = await provider.connection.getTokenAccountBalance(vault);
    expect(vb.value.amount).to.equal(SUPPLY.toString());
  });

  const buyAccounts = {
    buyer: me,
    mint: mint.publicKey,
    curve,
    vault,
    buyerAta: myAta,
    curveAuthority,
    platformProgram: PLATFORM_ID,
    platformConfig: configPda,
    platformSupply: supplyPda,
    userWhitelist: wlPda(me),
    tokenProgram: TOKEN_PROGRAM,
    associatedTokenProgram: ATA_PROGRAM,
    systemProgram: SystemProgram.programId,
  };

  const grantPda = (id: string) => PublicKey.findProgramAddressSync([Buffer.from("grant"), Buffer.from(id)], PLATFORM_ID)[0];

  it("buy reserves the blacklisted portion into pending via CPI (not yet whitelisted)", async () => {
    // Fund the buyer's blacklisted bucket (faucet-origin devSOL), then buy.
    await (platform.methods as any)
      .deposit(new BN(LAMPORTS_PER_SOL))
      .accountsPartial({ whitelist: wlPda(me), user: me, systemProgram: SystemProgram.programId })
      .rpc();

    const before = await totalWhitelisted(provider);
    await m.buy(new BN(LAMPORTS_PER_SOL), new BN(0)).accountsPartial(buyAccounts).rpc();

    expect((await acct.bondingCurve.fetch(curve)).realSol.toNumber()).to.equal(LAMPORTS_PER_SOL);
    expect(Number((await provider.connection.getTokenAccountBalance(myAta)).value.amount)).to.be.greaterThan(0);
    // Reserved into pending; whitelisted + the solvency counter are untouched
    // until the relayer collects the fee and finalizes (fee-first).
    const b = await (platform.account as any).whitelistBalance.fetch(wlPda(me));
    expect(b.pending.toNumber()).to.equal(LAMPORTS_PER_SOL);
    expect(b.whitelisted.toNumber()).to.equal(0);
    expect(b.blacklisted.toNumber()).to.equal(0);
    expect((await totalWhitelisted(provider)) - before).to.equal(0);
  });

  it("relayer finalize moves pending -> whitelisted (after the fee)", async () => {
    const before = await totalWhitelisted(provider);
    await (platform.methods as any)
      .finalizeActivation("curve-act-1", new BN(LAMPORTS_PER_SOL))
      .accountsPartial({
        config: configPda,
        whitelistAuthority: whitelistAuthority.publicKey,
        user: me,
        whitelist: wlPda(me),
        supply: supplyPda,
        grantReceipt: grantPda("curve-act-1"),
        payer: provider.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .signers([whitelistAuthority])
      .rpc();
    const b = await (platform.account as any).whitelistBalance.fetch(wlPda(me));
    expect(b.pending.toNumber()).to.equal(0);
    expect(b.whitelisted.toNumber()).to.equal(LAMPORTS_PER_SOL);
    expect((await totalWhitelisted(provider)) - before).to.equal(LAMPORTS_PER_SOL);
  });

  it("buy covered by whitelisted balance is fee-free (no new pending)", async () => {
    await m.buy(new BN(LAMPORTS_PER_SOL / 2), new BN(0)).accountsPartial(buyAccounts).rpc();
    // Trade is within the whitelisted balance, so nothing is reserved.
    const b = await (platform.account as any).whitelistBalance.fetch(wlPda(me));
    expect(b.pending.toNumber()).to.equal(0);
    expect(b.whitelisted.toNumber()).to.equal(LAMPORTS_PER_SOL);
  });

  it("rejects graduation below the threshold", async () => {
    let failed = false;
    try {
      await m.graduate().accountsPartial({ mint: mint.publicKey, curve }).rpc();
    } catch {
      failed = true;
    }
    expect(failed, "graduation should fail below threshold").to.be.true;
  });

  it("sells everything back: vault restored and curve stays solvent", async () => {
    const held = (await provider.connection.getTokenAccountBalance(myAta)).value.amount;
    await m
      .sell(new BN(held), new BN(0))
      .accountsPartial({
        seller: me,
        mint: mint.publicKey,
        curve,
        vault,
        sellerAta: myAta,
        tokenProgram: TOKEN_PROGRAM,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const c = await acct.bondingCurve.fetch(curve);
    // All tokens returned to the vault; the curve never pays out more SOL than it
    // took in (rounding favors the curve), so a lone round trip can't profit —
    // wash-trade resistance comes from the activation fee, not the curve itself.
    expect(c.tokenReserve.toString()).to.equal(SUPPLY.toString());
    expect(c.realSol.toNumber()).to.be.at.most(LAMPORTS_PER_SOL);
  });
});
