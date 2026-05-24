import { promises as fs } from "node:fs";
import type { ActivationRecord, Lamports, RedemptionRecord } from "../types";

type CursorKind = "activation" | "redemption";

interface StoreData {
  totalWhitelistedDevnet: Lamports;
  cursors: Record<CursorKind, string | null>;
  activations: Record<string, ActivationRecord>;
  redemptions: Record<string, RedemptionRecord>;
}

// bigint is not valid JSON, so tag it on the way out and revive on the way in.
function replacer(_key: string, value: unknown): unknown {
  return typeof value === "bigint" ? { $bigint: value.toString() } : value;
}

function reviver(_key: string, value: unknown): unknown {
  if (
    value !== null &&
    typeof value === "object" &&
    "$bigint" in value &&
    typeof (value as { $bigint: unknown }).$bigint === "string"
  ) {
    return BigInt((value as { $bigint: string }).$bigint);
  }
  return value;
}

function emptyData(): StoreData {
  return {
    totalWhitelistedDevnet: 0n,
    cursors: { activation: null, redemption: null },
    activations: {},
    redemptions: {},
  };
}

// File-backed, crash-tolerant ledger. Writes go to a temp file and are renamed
// atomically, so a crash mid-write never corrupts the live file. The whole
// state lives in memory; persistence is whole-file (fine at relayer scale).
export class LedgerStore {
  private constructor(
    private readonly filePath: string,
    private data: StoreData,
  ) {}

  static async open(filePath: string): Promise<LedgerStore> {
    let data: StoreData;
    try {
      const raw = await fs.readFile(filePath, "utf8");
      data = JSON.parse(raw, reviver) as StoreData;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "ENOENT") throw e;
      data = emptyData();
    }
    return new LedgerStore(filePath, data);
  }

  private async flush(): Promise<void> {
    const tmp = `${this.filePath}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(this.data, replacer, 2));
    await fs.rename(tmp, this.filePath);
  }

  getTotalWhitelisted(): Lamports {
    return this.data.totalWhitelistedDevnet;
  }

  async addWhitelisted(amount: Lamports): Promise<void> {
    this.data.totalWhitelistedDevnet += amount;
    await this.flush();
  }

  async subWhitelisted(amount: Lamports): Promise<void> {
    const next = this.data.totalWhitelistedDevnet - amount;
    this.data.totalWhitelistedDevnet = next < 0n ? 0n : next;
    await this.flush();
  }

  getCursor(kind: CursorKind): string | null {
    return this.data.cursors[kind];
  }

  async setCursor(kind: CursorKind, value: string | null): Promise<void> {
    this.data.cursors[kind] = value;
    await this.flush();
  }

  getActivation(id: string): ActivationRecord | undefined {
    return this.data.activations[id];
  }

  async putActivation(rec: ActivationRecord): Promise<void> {
    this.data.activations[rec.id] = rec;
    await this.flush();
  }

  listActivations(): ActivationRecord[] {
    return Object.values(this.data.activations);
  }

  getRedemption(id: string): RedemptionRecord | undefined {
    return this.data.redemptions[id];
  }

  async putRedemption(rec: RedemptionRecord): Promise<void> {
    this.data.redemptions[rec.id] = rec;
    await this.flush();
  }

  listRedemptions(): RedemptionRecord[] {
    return Object.values(this.data.redemptions);
  }
}
