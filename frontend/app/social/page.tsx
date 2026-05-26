"use client";

import Link from "next/link";
import { useToast } from "@/components/Toast";

const CREW = [
  { rk: "01", addr: "7XnZ…q9kF", tag: "DEV", pnl: "+412", win: "71%", av: undefined as string | undefined },
  { rk: "02", addr: "3Bq…n2R", tag: "🐋", pnl: "+186", win: "64%", av: "linear-gradient(135deg,#FFB627,#FF2D1F)" },
  { rk: "03", addr: "2Wd…f7K", tag: "", pnl: "+96", win: "58%", av: "linear-gradient(135deg,#14F195,#9945FF)" },
  { rk: "04", addr: "9zL…k8X", tag: "", pnl: "+74", win: "55%", av: undefined },
  { rk: "05", addr: "8Yr…s1T", tag: "", pnl: "+41", win: "52%", av: "linear-gradient(135deg,#FF2D1F,#FFB627)" },
];

export default function SocialPage() {
  const toast = useToast();
  function follow(addr: string) {
    toast.push("success", "Following", `${addr} added to your crew`);
  }

  return (
    <main className="rmain">
      <div className="rwrap">
        <div className="r-head" style={{ textAlign: "left", margin: "0 0 24px" }}>
          <div className="eyebrow">SOCIAL · CREW + WHALE FLOW</div>
          <h1 style={{ textAlign: "left" }}>Trade with the <em>crew.</em></h1>
          <p style={{ margin: 0 }}>Follow the wallets that actually print. Crew picks surface in your Floor; whale flow shows the big moves in real time.</p>
        </div>

        <div className="grad-grid">
          <div className="card">
            <div className="card-head"><h3>Crew leaderboard</h3><span className="sub">30d PnL</span></div>
            <div className="holder-list">
              {CREW.map((c) => (
                <div className="grad-row" key={c.rk}>
                  <div className="who"><span className="rk" style={{ color: "var(--concrete)", fontFamily: "var(--font-mono)" }}>{c.rk}</span><span className="av" style={c.av ? { background: c.av } : undefined} /><span className="addr">{c.addr}</span>{c.tag ? <span className="tag">{c.tag}</span> : null}</div>
                  <span className="num up">{c.pnl} SOL</span>
                  <span className="num" style={{ color: "var(--concrete)" }}>win {c.win}</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => follow(c.addr)}>Follow</button>
                </div>
              ))}
            </div>
          </div>

          <div className="rail-section" style={{ background: "var(--soot)", border: "1px solid var(--ash)", borderRadius: "var(--r-md)", padding: 18 }}>
            <h4>● WHALE FLOW</h4>
            <div className="live-tx">
              <div className="tx-line buy"><span className="meta"><b>BUY</b> <span className="addr">3Bq…n2R</span> · PEPED</span><span className="amt">+12.0</span></div>
              <div className="tx-line buy"><span className="meta"><b>BUY</b> <span className="addr">7XnZ…q9kF</span> · FUSE</span><span className="amt">+4.8</span></div>
              <div className="tx-line sell"><span className="meta"><b>SELL</b> <span className="addr">8Yr…s1T</span> · NTR</span><span className="amt">−8.1</span></div>
              <div className="tx-line buy"><span className="meta"><b>BUY</b> <span className="addr">2Wd…f7K</span> · BOOM</span><span className="amt">+2.4</span></div>
              <div className="tx-line buy"><span className="meta"><b>BUY</b> <span className="addr">9zL…k8X</span> · DYN</span><span className="amt">+6.2</span></div>
            </div>
            <h4 style={{ marginTop: 18 }}>CREW PICKS</h4>
            <div className="spark-list">
              <Link href="/token/peped" className="sp-row" style={{ textDecoration: "none", color: "inherit" }}><div className="sp-av" style={{ background: "linear-gradient(135deg,#FF2D1F,#FFB627)" }} /><div className="sp-info"><div className="nm">Pepe Detonator <span className="sym">$PEPED</span></div><div className="age">5 of your crew hold</div></div><span className="sp-pct">+184%</span></Link>
              <Link href="/token/fuse" className="sp-row" style={{ textDecoration: "none", color: "inherit" }}><div className="sp-av" style={{ background: "linear-gradient(135deg,#9945FF,#14F195)" }} /><div className="sp-info"><div className="nm">Fuse Coin <span className="sym">$FUSE</span></div><div className="age">3 of your crew hold</div></div><span className="sp-pct">+67%</span></Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
