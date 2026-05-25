"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";

export default function AdminPage() {
  const toast = useToast();
  const [activationBps, setActivationBps] = useState("100");
  const [redemptionBps, setRedemptionBps] = useState("80");
  const [teamSplitBps, setTeamSplitBps] = useState("2000");
  const [paused, setPaused] = useState(false);

  function save() {
    toast.runTx({
      pending: { title: "Updating platform config…", sub: "signing admin instruction" },
      success: { title: "Config updated", sub: `fee ${activationBps}bps · redeem ${redemptionBps}bps` },
      errorTitle: "Update failed",
    });
  }

  function togglePause() {
    const next = !paused;
    setPaused(next);
    toast.runTx({
      pending: { title: next ? "Pausing platform…" : "Resuming platform…" },
      success: { title: next ? "Platform paused" : "Platform live", sub: next ? "redemptions + trades halted" : "all instructions enabled" },
    });
  }

  return (
    <main className="rmain">
      <div className="rwrap">
        <div className="r-head" style={{ textAlign: "left", margin: "0 0 24px" }}>
          <div className="eyebrow">PLATFORM · ADMIN</div>
          <h1 style={{ textAlign: "left" }}>Control room.</h1>
          <p style={{ margin: 0 }}>Live platform parameters, treasury health, and the solvency invariant. Writes here are admin-only on-chain instructions.</p>
        </div>

        <div className="stats-strip">
          <div className="stat-card"><div className="k">Whitelisted devSOL</div><div className="v">12,840</div><div className="delta">global counter</div></div>
          <div className="stat-card"><div className="k">Treasury reserves</div><div className="v">1,284<small>SOL</small></div><div className="delta">on mainnet PDA</div></div>
          <div className="stat-card"><div className="k">Reserve ratio</div><div className="v" style={{ color: "var(--whitelist)" }}>120%</div><div className="delta">invariant ≥ 100%</div></div>
          <div className="stat-card"><div className="k">Status</div><div className="v" style={{ color: paused ? "var(--fuse-amber)" : "var(--whitelist)" }}>{paused ? "PAUSED" : "LIVE"}</div><div className="delta">{paused ? "instructions halted" : "accepting trades"}</div></div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head"><h3>Fee parameters</h3><span className="sub">Platform account</span></div>
          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="admin-field">
              <label>Activation fee (bps)</label>
              <input className="input" value={activationBps} inputMode="numeric" onChange={(e) => setActivationBps(e.target.value)} />
              <span className="admin-unit">{(Number(activationBps) / 100).toFixed(2)}% on first use</span>
            </div>
            <div className="admin-field">
              <label>Redemption rate (bps)</label>
              <input className="input" value={redemptionBps} inputMode="numeric" onChange={(e) => setRedemptionBps(e.target.value)} />
              <span className="admin-unit">{(Number(redemptionBps) / 100).toFixed(2)}% paid out</span>
            </div>
            <div className="admin-field">
              <label>Team split (bps)</label>
              <input className="input" value={teamSplitBps} inputMode="numeric" onChange={(e) => setTeamSplitBps(e.target.value)} />
              <span className="admin-unit">{(Number(teamSplitBps) / 100).toFixed(0)}% to team wallet</span>
            </div>
            <button className="btn btn-primary" onClick={save} style={{ alignSelf: "flex-start" }}>Save parameters</button>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head"><h3>Wallets</h3><span className="sub">PDAs</span></div>
          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="rr-row"><span className="k">Treasury PDA</span><span className="v">7gReserveTreasuryPDAxxxx…4kP</span></div>
            <div className="rr-row"><span className="k">Team wallet</span><span className="v">3BqTeamWalletxxxxxxxxx…n2R</span></div>
            <div className="rr-row"><span className="k">Admin</span><span className="v">7XnZ…q9kF</span></div>
          </div>
        </div>

        <div className="act-banner">
          <div>
            <h4>{paused ? "▶ Resume the platform" : "⏸ Emergency pause"}</h4>
            <p>{paused ? "Re-enable trades, launches, and redemptions." : "Halt all trades, launches, and redemptions in one instruction. Use only if the solvency invariant is at risk."}</p>
          </div>
          <div className="right">
            <button className={`btn ${paused ? "btn-success" : "btn-secondary"} btn-sm`} onClick={togglePause}>
              {paused ? "Resume platform" : "Pause platform"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
