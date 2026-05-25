import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import * as fs from "fs";

const BN: typeof anchor.BN = (anchor as any).BN ?? (anchor as any).default?.BN;
const curveIdl = JSON.parse(fs.readFileSync("target/idl/curve.json", "utf8"));

const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ATA_PROGRAM = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

// Integration tests for the bonding-curve AMM against a local validator.
describe("curve", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = new anchor.Program(curveIdl as anchor.Idl, provider) as Program<anchor.Idl>;
  const m = program.methods as any;
  const acct = program.account as any;

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

  it("buys tokens: real SOL rises and the buyer receives tokens", async () => {
    await m
      .buy(new BN(LAMPORTS_PER_SOL), new BN(0))
      .accountsPartial({
        buyer: me,
        mint: mint.publicKey,
        curve,
        vault,
        buyerAta: myAta,
        tokenProgram: TOKEN_PROGRAM,
        associatedTokenProgram: ATA_PROGRAM,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
    const c = await acct.bondingCurve.fetch(curve);
    expect(c.realSol.toNumber()).to.equal(LAMPORTS_PER_SOL);
    const bal = await provider.connection.getTokenAccountBalance(myAta);
    expect(Number(bal.value.amount)).to.be.greaterThan(0);
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
