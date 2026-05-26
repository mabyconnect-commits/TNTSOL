import { REDEMPTIONS } from "@/lib/data";
import RedeemPanel from "@/components/RedeemPanel";

export default function RedeemPage() {
  return (
    <main className="rmain">
      <div className="rwrap">
        <div className="r-head">
          <div className="eyebrow">REDEMPTION · DEVNET → MAINNET</div>
          <h1>Cash out your <em>whitelist.</em></h1>
          <p>Convert your activated devSOL into real mainnet SOL at the current redemption rate. Pays a 0.8% fee, settles in a single transaction. Blacklist holdings need to be activated first.</p>
        </div>

        <div className="r-steps">
          <div className="r-step done"><div className="num">✓</div><div className="lbl">Activated</div></div>
          <div className="r-step active"><div className="num">2</div><div className="lbl">Pick amount</div></div>
          <div className="r-step"><div className="num">3</div><div className="lbl">Confirm</div></div>
          <div className="r-step"><div className="num">4</div><div className="lbl">Settled</div></div>
        </div>

        <RedeemPanel />

        <div className="r-treasury">
          <div className="r-tcell"><div className="k">Treasury</div><div className="v">1,284<small>SOL</small></div><div className="note">↳ on Solana mainnet</div></div>
          <div className="r-tcell"><div className="k">Activated devSOL</div><div className="v">12,840<small>devSOL</small></div><div className="note">↳ across 4,128 wallets</div></div>
          <div className="r-tcell"><div className="k">Reserve ratio</div><div className="v" style={{ color: "var(--whitelist)" }}>120%</div><div className="note">↳ healthy · over-collateralized</div></div>
          <div className="r-tcell"><div className="k">Redemptions · 24h</div><div className="v">38</div><div className="note">↳ 184 SOL out</div></div>
        </div>

        <div className="r-history-section">
          <h2>Recent redemptions</h2>
          <div className="r-history">
            <div className="r-h-head">
              <span>Time</span><span>From</span><span>devSOL</span><span>SOL</span><span>Status</span><span />
            </div>
            {REDEMPTIONS.map((r, i) => (
              <div className="r-h-row" key={i}>
                <span className="num">{r.time}</span>
                <span className="num" style={{ color: "var(--bone)" }}>{r.from}</span>
                <span className="num">{r.dev}</span>
                <span className="num" style={{ color: "var(--whitelist)" }}>{r.sol}</span>
                <span><span className="tag-pill done">SETTLED</span></span>
                <span className="arrow" style={{ textAlign: "right" }}>↗</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
