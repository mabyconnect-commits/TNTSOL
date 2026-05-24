import { promises as fs } from "node:fs";
import { Connection, Keypair } from "@solana/web3.js";

export function makeConnection(url: string): Connection {
  return new Connection(url, "confirmed");
}

// Loads a solana CLI id.json keypair (a JSON array of secret-key bytes).
export async function loadKeypair(path: string): Promise<Keypair> {
  const raw = await fs.readFile(path, "utf8");
  const bytes = JSON.parse(raw) as number[];
  return Keypair.fromSecretKey(Uint8Array.from(bytes));
}
