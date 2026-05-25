import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import * as fs from "fs";
import { whitelistAuthority, ensurePlatformInit, configPda, supplyPda, wlPda, totalWhitelisted } from "./shared";

const BN: typeof anchor.BN = (anchor as any).BN ?? (anchor as any).default?.BN;
const platformIdl = JSON.parse(fs.readFileSync("target/idl/platform.json", "utf8"));

// Integration tests for the platform program against a local validator.
// Covers the I1 (grant) / I2 (burn) flow and its guards. total_whitelisted is a
// global counter shared with the curve suite, so we assert on deltas.
describe("platform", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = new anchor.Program(platformIdl as anchor.Idl, provider) as Program<anchor.Idl>;
  const m = program.methods as any;
  const acct = program.account as any;

  const authority = whitelistAuthority;
  const user = Keypair.generate();
  const wl = wlPda(user.publicKey);
  const grant = (id: string) => PublicKey.findProgramAddressSync([Buffer.from("grant"), Buffer.from(id)], program.programId)[0];
  const burn = (id: string) => PublicKey.findProgramAddressSync([Buffer.from("burn"), Buffer.from(id)], program.programId)[0];

  before(async () => {
    const sig = await provider.connection.requestAirdrop(user.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig, "confirmed");
    await ensurePlatformInit(provider);
  });

  it("config is initialized with the whitelist authority", async () => {
    expect((await acct.config.fetch(configPda)).whitelistAuthority.toBase58()).to.equal(authority.publicKey.toBase58());
  });

  it("grants whitelist (I1) and bumps total_whitelisted", async () => {
    const before = await totalWhitelisted(provider);
    await m
      .grantWhitelist("act-1", new BN(1000))
      .accountsPartial({ config: configPda, whitelistAuthority: authority.publicKey, user: user.publicKey, whitelist: wl, supply: supplyPda, grantReceipt: grant("act-1"), payer: provider.wallet.publicKey, systemProgram: SystemProgram.programId })
      .signers([authority])
      .rpc();
    expect((await acct.whitelistBalance.fetch(wl)).whitelisted.toNumber()).to.equal(1000);
    expect((await totalWhitelisted(provider)) - before).to.equal(1000);
  });

  it("rejects a grant from a non-authority", async () => {
    const rogue = Keypair.generate();
    let failed = false;
    try {
      await m
        .grantWhitelist("act-rogue", new BN(500))
        .accountsPartial({ config: configPda, whitelistAuthority: rogue.publicKey, user: user.publicKey, whitelist: wl, supply: supplyPda, grantReceipt: grant("act-rogue"), payer: provider.wallet.publicKey, systemProgram: SystemProgram.programId })
        .signers([rogue])
        .rpc();
    } catch {
      failed = true;
    }
    expect(failed, "expected non-authority grant to fail").to.be.true;
  });

  it("is idempotent on activation_id (replay fails)", async () => {
    let failed = false;
    try {
      await m
        .grantWhitelist("act-1", new BN(1000))
        .accountsPartial({ config: configPda, whitelistAuthority: authority.publicKey, user: user.publicKey, whitelist: wl, supply: supplyPda, grantReceipt: grant("act-1"), payer: provider.wallet.publicKey, systemProgram: SystemProgram.programId })
        .signers([authority])
        .rpc();
    } catch {
      failed = true;
    }
    expect(failed, "expected replayed activation_id to fail").to.be.true;
  });

  it("burns for redemption (I2) and decrements supply", async () => {
    const before = await totalWhitelisted(provider);
    await m
      .burnForRedemption("red-1", new BN(400))
      .accountsPartial({ whitelist: wl, supply: supplyPda, receipt: burn("red-1"), user: user.publicKey, systemProgram: SystemProgram.programId })
      .signers([user])
      .rpc();
    expect((await acct.whitelistBalance.fetch(wl)).whitelisted.toNumber()).to.equal(600);
    expect(before - (await totalWhitelisted(provider))).to.equal(400);
  });

  it("deposit adds to the blacklisted bucket", async () => {
    const d = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(d.publicKey, LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig, "confirmed");
    const dWl = wlPda(d.publicKey);
    await m
      .deposit(new BN(5000))
      .accountsPartial({ whitelist: dWl, user: d.publicKey, systemProgram: SystemProgram.programId })
      .signers([d])
      .rpc();
    const b = await acct.whitelistBalance.fetch(dWl);
    expect(b.blacklisted.toNumber()).to.equal(5000);
    expect(b.whitelisted.toNumber()).to.equal(0);
  });

  it("rejects a burn over the whitelist balance", async () => {
    let failed = false;
    try {
      await m
        .burnForRedemption("red-over", new BN(10_000))
        .accountsPartial({ whitelist: wl, supply: supplyPda, receipt: burn("red-over"), user: user.publicKey, systemProgram: SystemProgram.programId })
        .signers([user])
        .rpc();
    } catch {
      failed = true;
    }
    expect(failed, "expected over-balance burn to fail").to.be.true;
  });
});
