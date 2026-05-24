import Link from "next/link";
import { TOKENS, Token, GRADUATION_SOL } from "@/lib/data";

function Sidebar() {
  return (
    <aside className="side">
      <div className="side-h">DISCOVER</div>
      <div className="side-item active"><span>🔥</span><span className="lbl">Live floor</span><span className="ct">1,284</span></div>
      <div className="side-item"><span>⚡</span><span className="lbl">Sparks · 1h</span><span className="ct">312</span></div>
      <div className="side-item"><span>📈</span><span className="lbl">Climbing</span><span className="ct">48</span></div>
      <div className="side-item"><span>🎓</span><span className="lbl">Graduating</span><span className="ct">7</span></div>
      <div className="side-item"><span>💀</span><span className="lbl">Dust</span><span className="ct">9.2k</span></div>

      <div className="side-h">YOUR BAGS</div>
      <div className="side-item"><span>💼</span><span className="lbl">Holdings</span><span className="ct">12</span></div>
      <div className="side-item"><span>👀</span><span className="lbl">Watchlist</span><span className="ct">23</span></div>
      <div className="side-item"><span>🚀</span><span className="lbl">Launched</span><span className="ct">2</span></div>

      <div className="side-h">SOCIAL</div>
      <div className="side-item"><span>🧬</span><span className="lbl">Crew picks</span><span className="ct">18</span></div>
      <div className="side-item"><span>🐋</span><span className="lbl">Whale flow</span></div>

      <div className="feed-stats">
        <div className="r"><span>Floor TVL</span><b>4,812 devSOL</b></div>
        <div className="r"><span>Vol · 24h</span><b>22.4k</b></div>
        <div className="r"><span>Launches · 24h</span><b>1,029</b></div>
        <div className="r"><span>Activations</span><b>+318</b></div>
      </div>
    </aside>
  );
}

function HeroStrip() {
  return (
    <div className="hero-strip">
      <div className="hero-card primary">
        <div className="htop"><div className="lbl">● GRADUATING NOW</div><div className="ago">2m ago</div></div>
        <div className="name">Pepe Detonator <span className="sym">$PEPED</span></div>
        <div className="stats">
          <div><div className="k">Price</div><div className="v">0.000412</div></div>
          <div><div className="k">24h</div><div className="v up">+184.2%</div></div>
          <div><div className="k">Mcap</div><div className="v">82.4k</div></div>
          <div><div className="k">Holders</div><div className="v">1,284</div></div>
        </div>
        <div className="grad-meter"><div className="fill" style={{ width: "96%" }} /></div>
        <div className="grad-line"><span>Graduation</span><span><b>82.4</b> / 85 devSOL</span></div>
      </div>
      <div className="hero-card">
        <div className="htop"><div className="lbl" style={{ color: "var(--fuse-amber)" }}>⚡ FRESH SPARK</div><div className="ago">12s ago</div></div>
        <div className="name">Boom Town <span className="sym">$BOOM</span></div>
        <div className="stats">
          <div><div className="k">Price</div><div className="v">0.0000088</div></div>
          <div><div className="k">5m</div><div className="v up">+42%</div></div>
          <div><div className="k">Mcap</div><div className="v">3.2k</div></div>
        </div>
        <div className="grad-meter"><div className="fill" style={{ width: "4%" }} /></div>
        <div className="grad-line"><span>Graduation</span><span><b>3.2</b> / 85</span></div>
      </div>
      <div className="hero-card">
        <div className="htop"><div className="lbl" style={{ color: "var(--whitelist)" }}>📈 CLIMBING</div><div className="ago">17m ago</div></div>
        <div className="name">Fuse Coin <span className="sym">$FUSE</span></div>
        <div className="stats">
          <div><div className="k">Price</div><div className="v">0.000118</div></div>
          <div><div className="k">1h</div><div className="v up">+67%</div></div>
          <div><div className="k">Mcap</div><div className="v">48.1k</div></div>
        </div>
        <div className="grad-meter"><div className="fill" style={{ width: "56%" }} /></div>
        <div className="grad-line"><span>Graduation</span><span><b>48.1</b> / 85</span></div>
      </div>
    </div>
  );
}

function FeedRow({ t }: { t: Token }) {
  return (
    <Link href={`/token/${t.id}`} className={`feed-row${t.spark ? " spark" : ""}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="tk-rank">{t.spark ? <b>{t.rank}</b> : t.rank}</div>
      <div className="tk-cell">
        <div className="tk-av" style={{ background: t.avBg, color: t.avFg }}>{t.av}</div>
        <div className="tk-info">
          <div className="tk-name">{t.name} <span className="sym">${t.sym}</span></div>
          <div className="tk-meta">
            <span className={`bucket ${t.bucket}`}><span className="dot" />{t.bucket === "white" ? "WHITELIST" : "BLACKLIST"}</span>
            <span>{t.holders} holders</span>
          </div>
        </div>
      </div>
      <div className="num">{t.price}</div>
      <div className={`num ${t.m5down ? "num-down" : "num-up"}`}>{t.m5}</div>
      <div className={`num ${t.h1down ? "num-down" : "num-up"}`}>{t.h1}</div>
      <div className="num">{t.mcap}</div>
      <div className="grad-cell">
        <div className="grad-bar"><div className="gf" style={{ width: `${t.grad}%` }} /></div>
        <div className="gtxt">{t.grad}% · {(t.grad * GRADUATION_SOL / 100).toFixed(1)}/85</div>
      </div>
      <span className={`btn ${t.spark ? "btn-primary" : "btn-secondary"} btn-sm`}>Buy</span>
    </Link>
  );
}

function Rail() {
  const sparks = [
    { nm: "Boom Town", sym: "BOOM", age: "launched 12s ago", pct: "+42%", bg: "linear-gradient(135deg,#14F195,#FFB627)" },
    { nm: "Sparkler", sym: "SPRK", age: "48s ago", pct: "+8%", bg: "linear-gradient(135deg,#FFB627,#FF2D1F)" },
    { nm: "Detonate", sym: "DET", age: "2m ago", pct: "+18%", bg: "linear-gradient(135deg,#9945FF,#FF2D1F)" },
    { nm: "Wick", sym: "WICK", age: "4m ago", pct: "+3%", bg: "linear-gradient(135deg,#FF5436,#FFB627)" },
  ];
  return (
    <aside className="right-rail">
      <div className="grad-imminent">
        <div className="hdr"><span className="ping" />GRADUATION IMMINENT</div>
        <div className="name">Pepe Detonator <span className="sym">$PEPED</span></div>
        <div style={{ fontSize: 13, color: "var(--bone)", opacity: 0.78, marginTop: 8, lineHeight: 1.5 }}>2.6 devSOL until LP opens. The next 9 buys could trigger it.</div>
        <div className="progress"><span>Curve</span><span><b>82.4</b> / 85 devSOL</span></div>
        <Link href="/token/peped" className="btn btn-primary btn-sm" style={{ width: "100%", justifyContent: "center", marginTop: 12 }}>Detonate buy →</Link>
      </div>

      <div className="rail-section">
        <h4>● LIVE TRADES</h4>
        <div className="live-tx">
          <div className="tx-line buy"><span className="meta"><b>BUY</b> <span className="addr">7Hk…m2P</span> · PEPED</span><span className="amt">+0.412</span></div>
          <div className="tx-line buy"><span className="meta"><b>BUY</b> <span className="addr">9zL…k8X</span> · FUSE</span><span className="amt">+0.118</span></div>
          <div className="tx-line sell"><span className="meta"><b>SELL</b> <span className="addr">3Ny…q4F</span> · NTR</span><span className="amt">−0.81</span></div>
          <div className="tx-line buy"><span className="meta"><b>BUY</b> <span className="addr">5Bq…n2R</span> · PEPED</span><span className="amt">+1.20</span></div>
          <div className="tx-line buy"><span className="meta"><b>BUY</b> <span className="addr">2Wd…f7K</span> · BOOM</span><span className="amt">+0.008</span></div>
          <div className="tx-line sell"><span className="meta"><b>SELL</b> <span className="addr">8Yr…s1T</span> · KERO</span><span className="amt">−0.040</span></div>
        </div>
      </div>

      <div className="rail-section">
        <h4>FRESH SPARKS</h4>
        <div className="spark-list">
          {sparks.map((s) => (
            <div className="sp-row" key={s.sym}>
              <div className="sp-av" style={{ background: s.bg }} />
              <div className="sp-info"><div className="nm">{s.nm} <span className="sym">${s.sym}</span></div><div className="age">{s.age}</div></div>
              <span className="sp-pct">{s.pct}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

export default function FloorPage() {
  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <div className="topbar-row">
          <h1>The Floor <small>● LIVE · 1,284 tokens</small></h1>
          <div className="filter-row">
            <span className="pill active"><span className="dot" style={{ background: "var(--tnt-red)" }} />All</span>
            <span className="pill"><span className="dot" style={{ background: "var(--fuse-amber)" }} />Sparks</span>
            <span className="pill"><span className="dot" style={{ background: "var(--whitelist)" }} />Climbing</span>
            <span className="pill">Graduating</span>
            <span className="pill">Sort: <b style={{ color: "var(--bone)", marginLeft: 4 }}>Heat</b> ↓</span>
          </div>
        </div>
        <HeroStrip />
        <div className="feed">
          <div className="feed-head">
            <span>#</span><span>Token</span><span>Price (SOL)</span><span>5m</span><span>1h</span><span>Mcap</span><span>Curve</span><span />
          </div>
          {TOKENS.map((t) => <FeedRow key={t.id} t={t} />)}
        </div>
      </main>
      <Rail />
    </div>
  );
}
