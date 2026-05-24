import Link from "next/link";
import { notFound } from "next/navigation";
import { TOKENS, getToken } from "@/lib/data";
import TradePanel from "@/components/TradePanel";

export function generateStaticParams() {
  return TOKENS.map((t) => ({ id: t.id }));
}

function Chart() {
  const points: [number, number][] = [
    [0, 80], [8, 78], [16, 75], [24, 78], [32, 70], [40, 72], [48, 68],
    [56, 62], [64, 65], [72, 58], [80, 55], [88, 50], [96, 52], [104, 45],
    [112, 42], [120, 36], [128, 34], [136, 38], [144, 30], [152, 28],
    [160, 22], [168, 24], [176, 18], [184, 16], [192, 12], [200, 10],
  ];
  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const areaD = pathD + " L 200 100 L 0 100 Z";
  return (
    <svg viewBox="0 0 200 100" preserveAspectRatio="none" style={{ height: "100%", width: "100%" }}>
      <defs>
        <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FF2D1F" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#FF2D1F" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="#1A1817" strokeWidth="0.3" fill="none">
        <line x1="0" y1="20" x2="200" y2="20" /><line x1="0" y1="40" x2="200" y2="40" />
        <line x1="0" y1="60" x2="200" y2="60" /><line x1="0" y1="80" x2="200" y2="80" />
      </g>
      <path d={areaD} fill="url(#ag)" />
      <path d={pathD} stroke="#FF2D1F" strokeWidth="0.8" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx="200" cy="10" r="1.5" fill="#FFB627" />
      <circle cx="200" cy="10" r="3.5" fill="none" stroke="#FFB627" strokeWidth="0.5" opacity="0.5" />
      <line x1="0" y1="6" x2="200" y2="6" stroke="#14F195" strokeWidth="0.3" strokeDasharray="2 2" />
      <text x="2" y="4" fontFamily="JetBrains Mono, monospace" fontSize="3" fill="#14F195">GRADUATION 85 devSOL</text>
    </svg>
  );
}

const HOLDERS = [
  { rk: "01", addr: "7XnZ…q9kF", tag: "DEV", bal: "120.4M", pct: "12.0%", pnl: "+412 SOL", up: true, bucket: "white", av: undefined as string | undefined },
  { rk: "02", addr: "3Bq…n2R", tag: "🐋", bal: "84.2M", pct: "8.4%", pnl: "+186 SOL", up: true, bucket: "white", av: "linear-gradient(135deg,#FFB627,#FF2D1F)" },
  { rk: "03", addr: "9zL…k8X", tag: "", bal: "42.1M", pct: "4.2%", pnl: "+74 SOL", up: true, bucket: "black", av: undefined },
  { rk: "04", addr: "2Wd…f7K", tag: "", bal: "28.6M", pct: "2.8%", pnl: "+41 SOL", up: true, bucket: "white", av: "linear-gradient(135deg,#14F195,#9945FF)" },
  { rk: "05", addr: "5Hk…m2P", tag: "", bal: "21.2M", pct: "2.1%", pnl: "−4 SOL", up: false, bucket: "black", av: undefined },
  { rk: "06", addr: "8Yr…s1T", tag: "", bal: "18.4M", pct: "1.8%", pnl: "+32 SOL", up: true, bucket: "white", av: "linear-gradient(135deg,#FF2D1F,#FFB627)" },
];

export default async function TokenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = getToken(id);
  if (!token) notFound();

  return (
    <div className="tlayout">
      <main className="tmain">
        <div className="crumb"><Link href="/">Floor</Link><span className="sep">/</span>Whitelist<span className="sep">/</span><span style={{ color: "var(--bone)" }}>{token.name}</span></div>

        <div className="token-header">
          <div className="th-av" style={{ background: token.avBg, color: token.avFg }}>{token.av}</div>
          <div className="th-meta">
            <div className="name">{token.name} <span className="sym">${token.sym}</span> <span className={`bucket ${token.bucket}`}><span className="dot" />{token.bucket === "white" ? "WHITELIST" : "BLACKLIST"}</span></div>
            <div className="sub">
              <span className="mint">So11…X4kP</span><span>·</span>
              <span>Launched 4h 12m ago by 7XnZ…q9kF</span><span>·</span>
              <span>{token.holders} holders · 38 in crew</span>
            </div>
          </div>
          <div className="th-actions">
            <button className="btn btn-ghost btn-sm">☆ Watch</button>
            <button className="btn btn-ghost btn-sm">⤴ Share</button>
          </div>
        </div>

        <div className="price-hero">
          <div className="ph-cell"><div className="k">Price</div><div className="v">{token.price}<small>SOL</small></div><div className="change up">{token.m5} · 5m</div></div>
          <div className="ph-cell"><div className="k">Market cap</div><div className="v">{token.mcap}<small>devSOL</small></div><div className="change up">{token.h1} · 24h</div></div>
          <div className="ph-cell"><div className="k">Volume · 24h</div><div className="v">14.2k<small>devSOL</small></div><div className="change">412 trades</div></div>
          <div className="ph-cell"><div className="k">Holders</div><div className="v">{token.holders}</div><div className="change up">+128 · 1h</div></div>
        </div>

        <div className="chart-card">
          <div className="chart-controls">
            <div className="chart-tabs">
              <span className="chart-tab active">Price</span><span className="chart-tab">Curve</span><span className="chart-tab">Holders</span><span className="chart-tab">Volume</span>
            </div>
            <div className="ranges">
              <button>1m</button><button>5m</button><button className="active">15m</button><button>1h</button><button>4h</button><button>1d</button><button>All</button>
            </div>
          </div>
          <div className="chart-area"><Chart /></div>
        </div>

        <div className="curve-card">
          <h3>Graduation <span className="pct">{token.grad}%</span> <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--tnt-red)", marginLeft: "auto", letterSpacing: "0.14em", fontWeight: 500 }}>● IMMINENT</span></h3>
          <div className="meter"><div className="fill" style={{ width: `${token.grad}%` }} /></div>
          <div className="meter-row"><span>Curve balance</span><span><b>{(token.grad * 0.85).toFixed(1)}</b> / 85 devSOL</span></div>
          <p className="blurb">When the curve hits <b style={{ color: "var(--fuse-amber)" }}>85 devSOL</b>, the bonding curve closes and liquidity migrates to a full Raydium-style LP. The next buys could trigger graduation — buyers in that window get the final curve price and unlock free LP trading.</p>
        </div>

        <div className="tabs">
          <span className="tab active">Holders <span className="ct">{token.holders}</span></span>
          <span className="tab">Trades <span className="ct">412</span></span>
          <span className="tab">Crew <span className="ct">38</span></span>
          <span className="tab">Comments <span className="ct">62</span></span>
        </div>

        <div className="holder-list">
          <div className="holder-row" style={{ background: "var(--smoke)", borderBottom: "1px solid var(--ash)", fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--concrete)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
            <span>#</span><span>Wallet</span><span>Balance</span><span>% Supply</span><span>PnL</span><span>Bucket</span>
          </div>
          {HOLDERS.map((h) => (
            <div className="holder-row" key={h.rk}>
              <span className="rk">{h.rk}</span>
              <div className="who"><span className="av" style={h.av ? { background: h.av } : undefined} />
                <span className="addr">{h.addr}</span>{h.tag ? <span className="tag">{h.tag}</span> : null}</div>
              <span className="num">{h.bal}</span>
              <span className="num">{h.pct}</span>
              <span className={`num pnl ${h.up ? "up" : "down"}`}>{h.pnl}</span>
              <div className="bk"><span className={`bucket ${h.bucket}`}><span className="dot" />{h.bucket === "white" ? "WL" : "BL"}</span></div>
            </div>
          ))}
        </div>
      </main>

      <aside className="tside">
        <TradePanel token={token} />
      </aside>
    </div>
  );
}
