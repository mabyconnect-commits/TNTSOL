import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";

const platformIdl = JSON.parse(fs.readFileSync("target/idl/platform.json", "utf8"));
const curveIdl = JSON.parse(fs.readFileSync("target/idl/curve.json", "utf8"));

export const PLATFORM_ID = new PublicKey(platformIdl.address);
export const CURVE_ID = new PublicKey(curveIdl.address);

// One shared whitelist authority (the relayer stand-in) so the platform config
// is initialized once and both suites can use it.
export const whitelistAuthority = Keypair.generate();

const pda = (seeds: (Buffer | Uint8Array)[], pid: PublicKey) => PublicKey.findProgramAddressSync(seeds, pid)[0];
export const configPda = pda([Buffer.from("config")], PLATFORM_ID);
export const supplyPda = pda([Buffer.from("supply")], PLATFORM_ID);
// Curve's CPI signer PDA — registered as the platform's program_authority.
export const curveAuthority = pda([Buffer.from("cpi_authority")], CURVE_ID);
export const wlPda = (user: PublicKey) => pda([Buffer.from("wl"), user.toBuffer()], PLATFORM_ID);

let done = false;
export async function ensurePlatformInit(provider: anchor.AnchorProvider) {
  if (done) return;
  done = true;
  const program = new anchor.Program(platformIdl as anchor.Idl, provider);
  try {
    await (program.methods as any)
      .initialize(whitelistAuthority.publicKey, curveAuthority, 100, false)
      .accountsPartial({ config: configPda, supply: supplyPda, payer: provider.wallet.publicKey, systemProgram: SystemProgram.programId })
      .rpc();
  } catch {
    // already initialized by the other suite in this run
  }
}

export async function totalWhitelisted(provider: anchor.AnchorProvider): Promise<number> {
  const program = new anchor.Program(platformIdl as anchor.Idl, provider);
  return (await (program.account as any).supplyState.fetch(supplyPda)).totalWhitelisted.toNumber();
}
