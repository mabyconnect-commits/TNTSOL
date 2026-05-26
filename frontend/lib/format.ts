// Display helpers + constant-product curve preview (x * y = k).

export function fmt(n: number, max = 4): string {
  return n.toLocaleString("en-US", { maximumFractionDigits: max });
}

export function fmtCompact(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return fmt(n);
}

// Tokens out when buying with `solIn` against virtual SOL / token reserves.
export function buyTokensOut(solIn: number, virtualSol: number, realToken: number): number {
  if (solIn <= 0) return 0;
  const k = virtualSol * realToken;
  const newToken = k / (virtualSol + solIn);
  return realToken - newToken;
}

// SOL out when selling `tokensIn` back into the curve.
export function sellSolOut(tokensIn: number, virtualSol: number, realToken: number): number {
  if (tokensIn <= 0) return 0;
  const k = virtualSol * realToken;
  const newSol = k / (realToken + tokensIn);
  return virtualSol - newSol;
}
