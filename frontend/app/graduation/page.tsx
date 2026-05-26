"use client";

import Link from "next/link";
import { useToast } from "@/components/Toast";

const RECENT = [
  { sym: "DYN", name: "Dynaverse", when: "8m ago", lp: "71.4 devSOL", av: "D", bg: "#FFB627", fg: "#0A0908" },
  { sym: "NTR", name: "Nitro", when: "41m ago", lp: "85.0 devSOL", av: "N", bg: "#E8E2D5", fg: "#0A0908" },
  { sym: "TRIG", name: "Trigger", when: "2h ago", lp: "85.0 devSOL", av: "T", bg: "#B81A0F", fg: "#FFF6E8" },
];

export default function GraduationPage() {
  const toast = useToast();

  function trigger() {
    toast.runTx({
      pending: { title: "Triggering graduation…", sub: "migrating curve → LP" },
      success: { title: "PEPED graduated 🎓", sub: "LP open · curve closed · LP locked 7d" },
      errorTitle: "Graduation failed",
    });
  }

  return (
    <main className="rmain">
      <div className="rwrap">
        <div className="r-head">
          <div className="eyebrow">● GRADUATION · BONDING CURVE → LP</div>
          <h1>One fuse from <em>liftoff.</em></h1>
          <p>When a curve crosses 85 devSOL the bonding phase closes: all curve SOL pairs into a Raydium-style LP, leftover tokens burn, and LP tokens lock for 7 days.</p>
        </div>

        <div className="curve-card" style={{ marginBottom: 20 }}>
          <h3>Pepe Detonator <span className="pct">96.9%</span> <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--tnt-red)", marginLeft: "auto", letterSpacing: "0.14em", fontWeight: 500 }}>● IMMINENT</span></h3>
          <div className="meter"><div className="fill" style={{ width: "96.9%" }} /></div>
          <div className="meter-row"><span>Curve balance</span><span><b>82.4</b> / 85 devSOL</span></div>
          <p className="blurb">The next <b style={{ color: "var(--fuse-amber)" }}>2.6 devSOL</b> of buys trips graduation. Anyone can trigger it once the threshold is crossed.</p>
        </div>

        <div className="grad-grid">
          <div className="card">
            <div className="card-head"><h3>Bonding curve · now</h3><span className="sub">x · y = k</span></div>
            <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="rr-row"><span className="k">Virtual SOL reserve</span><span className="v">30.0</span></div>
              <div className="rr-row"><span className="k">Real SOL reserve</span><span className="v">82.4</span></div>
              <div className="rr-row"><span className="k">Tokens in curve</span><span className="v">272.8M</span></div>
              <div className="rr-row"><span className="k">Price</span><span className="v">0.000412</span></div>
            </div>
          </div>
          <div className="card">
            <div className="card-head"><h3>Liquidity pool · after</h3><span className="sub">projected</span></div>
            <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="rr-row"><span className="k">LP SOL</span><span className="v up">82.4</span></div>
              <div className="rr-row"><span className="k">LP tokens paired</span><span className="v up">200.0M</span></div>
              <div className="rr-row"><span className="k">Tokens burned</span><span className="v" style={{ color: "var(--fuse-amber)" }}>72.8M</span></div>
              <div className="rr-row"><span className="k">LP lock</span><span className="v">7 days</span></div>
            </div>
          </div>
        </div>

        <button className="btn btn-primary btn-lg" onClick={trigger} style={{ width: "100%", justifyContent: "center", margin: "20px 0 8px" }}>⚡ Trigger graduation → open LP</button>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--concrete)", textAlign: "center" }}>Permissionless · anyone can call check_graduation</div>

        <div className="r-history-section">
          <h2>Recently graduated</h2>
          <div className="holder-list">
            {RECENT.map((r) => (
              <Link key={r.sym} href={`/token/${r.sym.toLowerCase()}`} className="grad-row" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="who"><span className="av" style={{ background: r.bg, color: r.fg, display: "grid", placeItems: "center", fontWeight: 700 }}>{r.av}</span><span style={{ fontWeight: 600 }}>{r.name} <span style={{ color: "var(--concrete)", fontFamily: "var(--font-mono)", fontSize: 12 }}>${r.sym}</span></span></div>
                <span className="num" style={{ color: "var(--concrete)" }}>{r.when}</span>
                <span className="num up">LP {r.lp}</span>
                <span className="tag-pill done">GRADUATED</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
