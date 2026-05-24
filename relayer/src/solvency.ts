import type { Lamports } from "./types";

const BPS_DENOM = 10000n;

// Mainnet lamports the treasury must hold to back all outstanding whitelisted
// devnet supply: required = totalWhitelisted * redemptionRate.
export function requiredReserves(totalWhitelistedDevnet: Lamports, redemptionRateBps: number): Lamports {
  return (totalWhitelistedDevnet * BigInt(redemptionRateBps)) / BPS_DENOM;
}

// Split an activation fee into the team slice and the treasury slice.
// total = devnetAmount * activationFee ; team = total * teamSplit ; treasury = total - team.
export function feeBreakdown(
  devnetAmount: Lamports,
  activationFeeBps: number,
  teamSplitBps: number,
): { total: Lamports; team: Lamports; treasury: Lamports } {
  const total = (devnetAmount * BigInt(activationFeeBps)) / BPS_DENOM;
  const team = (total * BigInt(teamSplitBps)) / BPS_DENOM;
  const treasury = total - team;
  return { total, team, treasury };
}

export function redemptionPayout(whitelistedDevnetAmount: Lamports, redemptionRateBps: number): Lamports {
  return (whitelistedDevnetAmount * BigInt(redemptionRateBps)) / BPS_DENOM;
}

export interface SolvencyView {
  treasury: Lamports;
  totalWhitelistedDevnet: Lamports;
  required: Lamports;
  solvent: boolean;
}

export function solvencyView(
  treasury: Lamports,
  totalWhitelistedDevnet: Lamports,
  redemptionRateBps: number,
): SolvencyView {
  const required = requiredReserves(totalWhitelistedDevnet, redemptionRateBps);
  return { treasury, totalWhitelistedDevnet, required, solvent: treasury >= required };
}

// Gate a single payout: after paying, the treasury must still fully back every
// remaining whitelisted unit. (whitelistedAfterBurn already excludes this
// redemption, since the on-chain burn has happened.)
export function canPayRedemption(
  treasury: Lamports,
  whitelistedAfterBurn: Lamports,
  payout: Lamports,
  redemptionRateBps: number,
): boolean {
  const treasuryAfter = treasury - payout;
  if (treasuryAfter < 0n) return false;
  return treasuryAfter >= requiredReserves(whitelistedAfterBurn, redemptionRateBps);
}
