import * as anchor from "@coral-xyz/anchor";
import type { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { expect } from "chai";
import * as fs from "fs";

// `import { BN }` isn't reliably resolvable when the file loads as ESM over the
// CJS anchor package — grab it off the namespace (named or under .default).
const BN: typeof anchor.BN = (anchor as any).BN ?? (anchor as any).default?.BN;

// Loaded at runtime (cwd = onchain workspace root under `anchor test`) to avoid
// JSON import-attribute requirements across CJS/ESM.
const platformIdl = JSON.parse(fs.readFileSync("target/idl/platform.json", "utf8"));

// Integration tests for the platform program against a local validator
// (anchor test). Covers the I1 (grant) / I2 (burn) flow and its guards.
describe("platform", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = new anchor.Program(platformIdl as anchor.Idl, provider) as Program<anchor.Idl>;

  const authority = Keypair.generate();
  const user = Keypair.generate();

  const pda = (seeds: (Buffer | Uint8Array)[]) => PublicKey.findProgramAddressSync(seeds, program.programId)[0];
  const config = pda([Buffer.from("config")]);
  const supply = pda([Buffer.from("supply")]);
  const wl = pda([Buffer.from("wl"), user.publicKey.toBuffer()]);
  const grant = (id: string) => pda([Buffer.from("grant"), Buffer.from(id)]);
  const burn = (id: string) => pda([Buffer.from("burn"), Buffer.from(id)]);

  const m = program.methods as any;
  const acct = program.account as any;

  before(async () => {
    const sig = await provider.connection.requestAirdrop(user.publicKey, 2 * LAMPORTS_PER_SOL);
    await provider.connection.confirmTransaction(sig, "confirmed");
  });

  it("initializes config + supply", async () => {
    await m
      .initialize(authority.publicKey, false)
      .accounts({ config, supply, payer: provider.wallet.publicKey, systemProgram: SystemProgram.programId })
      .rpc();
    expect((await acct.supplyState.fetch(supply)).totalWhitelisted.toNumber()).to.equal(0);
    expect((await acct.config.fetch(config)).whitelistAuthority.toBase58()).to.equal(authority.publicKey.toBase58());
  });

  it("grants whitelist (I1) and bumps total_whitelisted", async () => {
    await m
      .grantWhitelist("act-1", new BN(1000))
      .accounts({ config, whitelistAuthority: authority.publicKey, user: user.publicKey, whitelist: wl, supply, grantReceipt: grant("act-1"), payer: provider.wallet.publicKey, systemProgram: SystemProgram.programId })
      .signers([authority])
      .rpc();
    expect((await acct.whitelistBalance.fetch(wl)).amount.toNumber()).to.equal(1000);
    expect((await acct.supplyState.fetch(supply)).totalWhitelisted.toNumber()).to.equal(1000);
  });

  it("rejects a grant from a non-authority", async () => {
    const rogue = Keypair.generate();
    let failed = false;
    try {
      await m
        .grantWhitelist("act-rogue", new BN(500))
        .accounts({ config, whitelistAuthority: rogue.publicKey, user: user.publicKey, whitelist: wl, supply, grantReceipt: grant("act-rogue"), payer: provider.wallet.publicKey, systemProgram: SystemProgram.programId })
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
        .accounts({ config, whitelistAuthority: authority.publicKey, user: user.publicKey, whitelist: wl, supply, grantReceipt: grant("act-1"), payer: provider.wallet.publicKey, systemProgram: SystemProgram.programId })
        .signers([authority])
        .rpc();
    } catch {
      failed = true;
    }
    expect(failed, "expected replayed activation_id to fail").to.be.true;
  });

  it("burns for redemption (I2) and decrements supply", async () => {
    await m
      .burnForRedemption("red-1", new BN(400))
      .accounts({ whitelist: wl, supply, receipt: burn("red-1"), user: user.publicKey, systemProgram: SystemProgram.programId })
      .signers([user])
      .rpc();
    expect((await acct.whitelistBalance.fetch(wl)).amount.toNumber()).to.equal(600);
    expect((await acct.supplyState.fetch(supply)).totalWhitelisted.toNumber()).to.equal(600);
  });

  it("rejects a burn over the whitelist balance", async () => {
    let failed = false;
    try {
      await m
        .burnForRedemption("red-over", new BN(10_000))
        .accounts({ whitelist: wl, supply, receipt: burn("red-over"), user: user.publicKey, systemProgram: SystemProgram.programId })
        .signers([user])
        .rpc();
    } catch {
      failed = true;
    }
    expect(failed, "expected over-balance burn to fail").to.be.true;
  });
});
