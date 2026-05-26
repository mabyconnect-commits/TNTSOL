import Link from "next/link";
import { HOLDINGS } from "@/lib/data";

function BucketHero() {
  const r = 80;
  const C = 2 * Math.PI * r;
  const wlPct = 73;
  const wlLen = (wlPct / 100) * C;
  const blLen = C - wlLen;
  return (
    <div className="bucket-hero">
      <div className="bh-row">
        <div className="bh-left">
          <h3>NET WORTH · DEVNET</h3>
          <div className="bh-total"><div className="v">14.82<small>devSOL</small></div></div>
          <div className="bh-pnl">+3.41 devSOL · +29.9% <small>30d</small></div>
          <p className="bh-sub">Of your bag, <b style={{ color: "var(--whitelist)" }}>10.81 devSOL is whitelisted</b> — already activated and ready to redeem for mainnet SOL at any time. The rest needs a 1% activation fee on its next trade.</p>

          <div className="bucket-legend">
            <div className="bl-card white">
              <div className="k">WHITELIST · LIVE</div>
              <div className="v">10.81<small>devSOL</small></div>
              <div className="note">↳ Redeems at 0.8% → 8.65 SOL</div>
            </div>
            <div className="bl-card black">
              <div className="k">BLACKLIST · LOCKED</div>
              <div className="v">4.01<small>devSOL</small></div>
              <div className="note">↳ Trade once to activate (1% fee)</div>
            </div>
          </div>
        </div>

        <div>
          <div className="bucket-donut">
            <svg viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="80" fill="none" stroke="#25221F" strokeWidth="22" />
              <circle cx="100" cy="100" r="80" fill="none" stroke="#14F195" strokeWidth="22" strokeDasharray={`${wlLen} ${C}`} />
              <circle cx="100" cy="100" r="80" fill="none" stroke="#FFB627" strokeWidth="22" strokeDasharray={`${blLen} ${C}`} strokeDashoffset={-wlLen} />
            </svg>
            <div className="center">
              <div className="lbl">REDEEMABLE</div>
              <div className="pct" style={{ color: "var(--whitelist)" }}>73%</div>
              <div className="sub">10.81 / 14.82 devSOL</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PortfolioPage() {
  return (
    <main className="pmain">
      <div className="p-header">
        <div>
          <h1>Portfolio</h1>
          <div className="sub">7XnZ…q9kF · synced 4s ago · all positions accounted</div>
        </div>
        <div className="actions">
          <button className="btn btn-ghost btn-sm">⤴ Export CSV</button>
          <button className="btn btn-secondary btn-sm">Deposit</button>
          <Link className="btn btn-primary btn-sm" href="/redeem">Redeem</Link>
        </div>
      </div>

      <BucketHero />

      <div className="stats-strip">
        <div className="stat-card"><div className="k">Token positions</div><div className="v">8</div><div className="delta">3 whitelist · 5 blacklist</div></div>
        <div className="stat-card"><div className="k">24h PnL</div><div className="v" style={{ color: "var(--whitelist)" }}>+1.24</div><div className="delta">+9.1% on 8 positions</div></div>
        <div className="stat-card"><div className="k">All-time PnL</div><div className="v" style={{ color: "var(--whitelist)" }}>+8.42</div><div className="delta">274 trades · win rate 64%</div></div>
        <div className="stat-card"><div className="k">Available to redeem</div><div className="v">8.65<small>SOL</small></div><div className="delta" style={{ color: "var(--fuse-amber)" }}>0.8% fee on next redemption</div></div>
      </div>

      <div className="act-banner">
        <div>
          <h4>⚡ Activate <b>4.01 devSOL</b> in blacklist holdings</h4>
          <p>Light the fuse on any trade and pay a one-time 1% activation fee. Your devSOL becomes whitelist forever, redeemable at any time.</p>
        </div>
        <div className="right">
          <div className="num">−0.040</div>
          <div className="lbl">FEE AT CURRENT BALANCE</div>
          <button className="btn btn-primary btn-sm" style={{ marginTop: 6 }}>Activate now</button>
        </div>
      </div>

      <div className="section-head"><h2>Holdings</h2></div>
      <div className="section-tabs">
        <div className="s-tab active">All <span className="ct">8</span></div>
        <div className="s-tab">Whitelist <span className="ct">3</span></div>
        <div className="s-tab">Blacklist <span className="ct">5</span></div>
        <div className="s-tab">Watchlist <span className="ct">23</span></div>
        <div className="s-tab">Launched <span className="ct">2</span></div>
      </div>

      <div className="holdings">
        <div className="h-head">
          <span>Token</span><span>Balance</span><span>Avg entry</span><span>Value</span><span>PnL</span><span>Bucket</span><span />
        </div>
        {HOLDINGS.map((r) => (
          <div className="h-row" key={r.sym}>
            <div className="h-cell">
              <div className="av" style={{ background: r.bg, color: r.fg }}>{r.av}</div>
              <div className="info"><div className="nm">{r.name} <span className="sym">${r.sym}</span></div><div className="meta">{r.balance} {r.sym}</div></div>
            </div>
            <span className="num">{r.balance}</span>
            <span className="num">{r.avg}</span>
            <span className="num">{r.value} <small style={{ color: "var(--concrete)", fontWeight: 500 }}>devSOL</small></span>
            <span className={`num pnl ${r.up ? "up" : "down"}`}>{r.pnl}<br /><span style={{ fontSize: 11, fontWeight: 500 }}>{r.pct}%</span></span>
            <span><span className={`bucket ${r.bucket}`}><span className="dot" />{r.bucket === "white" ? "WL" : "BL"}</span></span>
            <div className="actions-cell"><button className="btn btn-secondary btn-sm">Trade</button></div>
          </div>
        ))}
      </div>

      <div className="tw-grid">
        <div className="curve-mini">
          <h3>📈 Graduation watch</h3>
          <div className="curve-rows">
            <div className="curve-line">
              <div className="nm"><span className="dot" style={{ background: "var(--tnt-red)", boxShadow: "0 0 8px var(--tnt-red)" }} />Pepe Detonator <span style={{ color: "var(--concrete)" }}>$PEPED</span></div>
              <div><div className="pct"><b>96.9%</b> · 82.4 / 85</div><div className="bar"><div className="fill" style={{ width: "96.9%" }} /></div></div>
              <button className="btn btn-primary btn-sm" style={{ justifySelf: "end" }}>Detonate</button>
            </div>
            <div className="curve-line">
              <div className="nm"><span className="dot" style={{ background: "var(--fuse-amber)", boxShadow: "0 0 8px var(--fuse-amber)" }} />Dynaverse <span style={{ color: "var(--concrete)" }}>$DYN</span></div>
              <div><div className="pct"><b>84%</b> · 71.4 / 85</div><div className="bar"><div className="fill" style={{ width: "84%" }} /></div></div>
              <button className="btn btn-secondary btn-sm" style={{ justifySelf: "end" }}>Watch</button>
            </div>
            <div className="curve-line">
              <div className="nm"><span className="dot" style={{ background: "var(--whitelist)" }} />Nitro <span style={{ color: "var(--concrete)" }}>$NTR</span></div>
              <div><div className="pct"><b>80%</b> · 68.4 / 85</div><div className="bar"><div className="fill" style={{ width: "80%" }} /></div></div>
              <button className="btn btn-secondary btn-sm" style={{ justifySelf: "end" }}>Watch</button>
            </div>
          </div>
        </div>

        <div className="treasury-card">
          <h3>🏦 Redemption</h3>
          <div className="t-row"><span className="k">Whitelist balance</span><span className="v">10.81 devSOL</span></div>
          <div className="t-row"><span className="k">Redeem rate</span><span className="v">1 : 0.80</span></div>
          <div className="t-row"><span className="k">Redemption fee</span><span className="v">0.8%</span></div>
          <div className="t-row"><span className="k">You&apos;d receive</span><span className="v up">8.65 SOL</span></div>
          <div className="t-row"><span className="k">Treasury TVL</span><span className="v">1,284.2 SOL</span></div>
          <Link className="btn btn-success" href="/redeem" style={{ justifyContent: "center", marginTop: 4 }}>Redeem to mainnet →</Link>
        </div>
      </div>
    </main>
  );
}
