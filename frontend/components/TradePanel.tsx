"use client";

import { useMemo, useState } from "react";
import { Token } from "@/lib/data";
import { buyTokensOut, sellSolOut, fmt } from "@/lib/format";
import { useWallet } from "./WalletProvider";
import { useToast } from "./Toast";

export default function TradePanel({ token }: { token: Token }) {
  const wallet = useWallet();
  const toast = useToast();
  const [mode, setMode] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("0.5");
  const tokenBalance = 12400; // mock position
  const bal = wallet.devBalance ?? 0;

  const amt = parseFloat(amount) || 0;

  const calc = useMemo(() => {
    if (mode === "buy") {
      const out = buyTokensOut(amt, token.virtualSol, token.realToken);
      const activation = amt * 0.01;
      const platform = amt * 0.004;
      return { out, outLabel: token.sym, payLabel: "devSOL", activation, platform };
    }
    const out = sellSolOut(amt, token.virtualSol, token.realToken);
    const platform = out * 0.004;
    return { out, outLabel: "devSOL", payLabel: token.sym, activation: 0, platform };
  }, [mode, amt, token]);

  const presets = mode === "buy" ? ["0.1", "0.5", "1", "MAX"] : ["25%", "50%", "75%", "MAX"];

  function applyPreset(p: string) {
    if (mode === "buy") {
      if (p === "MAX") setAmount(String(bal));
      else setAmount(p);
    } else {
      if (p === "MAX") setAmount(String(tokenBalance));
      else setAmount(String(Math.round((tokenBalance * parseInt(p)) / 100)));
    }
  }

  function submit() {
    if (!wallet.connected) {
      wallet.openModal();
      return;
    }
    const buying = mode === "buy";
    toast.runTx({
      pending: { title: `${buying ? "Buying" : "Selling"} ${token.sym}…`, sub: `${fmt(amt, 4)} ${calc.payLabel} · curve` },
      success: {
        title: `${buying ? "Bought" : "Sold"} ${token.sym}`,
        sub: `+${fmt(calc.out, buying ? 2 : 4)} ${calc.outLabel}`,
      },
      errorTitle: "Trade failed",
    });
  }

  return (
    <>
      <div className="tinfo-card">
        <div className="label">YOUR POSITION</div>
        <div className="tinfo-row"><span className="k">Balance</span><span className="v">12,400 {token.sym}</span></div>
        <div className="tinfo-row"><span className="k">Avg entry</span><span className="v">0.000218</span></div>
        <div className="tinfo-row"><span className="k">PnL</span><span className="v" style={{ color: "var(--whitelist)" }}>+2.41 devSOL · +88.9%</span></div>
        <div className="tinfo-row"><span className="k">Bucket</span><span className="v"><span className="bucket white"><span className="dot" />WL · REDEEMABLE</span></span></div>
      </div>

      <div className="trade-panel">
        <div className="trade-tabs">
          <button className={mode === "buy" ? "buy active" : "buy"} onClick={() => setMode("buy")}>Buy</button>
          <button className={mode === "sell" ? "sell active" : "sell"} onClick={() => setMode("sell")}>Sell</button>
        </div>

        <div className="amount-row">
          <div className="amount-input">
            <input type="text" inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <div className="currency"><span className="badge" />{calc.payLabel}</div>
          </div>
          <div className="amount-meta">
            <span>≈ {fmt(calc.out, 2)} {calc.outLabel}</span>
            <span className="max">{mode === "buy" ? `MAX · ${bal.toFixed(2)}` : `MAX · ${fmt(tokenBalance, 0)}`}</span>
          </div>
          <div className="preset-row">
            {presets.map((p) => (
              <button key={p} className="preset" onClick={() => applyPreset(p)}>{p}</button>
            ))}
          </div>
        </div>

        {mode === "buy" && (
          <div className="activation-notice">
            <div className="ic">⚡</div>
            <div className="body">
              Activating <b>{fmt(amt, 4)} devSOL</b> for redemption.
              <span className="small">First trade pays a 1% activation fee ({fmt(calc.activation, 4)} devSOL) — once paid, your devSOL is redeemable for real SOL forever.</span>
            </div>
          </div>
        )}

        <div className="receipt">
          <div className="r"><span className="k">You pay</span><span className="v">{fmt(amt, 4)} {calc.payLabel}</span></div>
          {mode === "buy" && (
            <div className="r"><span className="k">Activation fee · 1%</span><span className="v" style={{ color: "var(--fuse-amber)" }}>−{fmt(calc.activation, 4)}</span></div>
          )}
          <div className="r"><span className="k">Platform fee · 0.4%</span><span className="v">−{fmt(calc.platform, 4)}</span></div>
          <div className="r"><span className="k">Price impact</span><span className="v">+0.31%</span></div>
          <div className="r"><span className="k">Slippage</span><span className="v">0.5%</span></div>
          <div className="divider" />
          <div className="r total"><span className="k">You receive</span><span className="v">+{fmt(calc.out, 2)} {calc.outLabel}</span></div>
        </div>

        <button className="btn-detonate" onClick={submit}>
          {wallet.connected ? `⚡ Light the fuse → ${mode === "buy" ? "Buy" : "Sell"} ${token.sym}` : "Connect wallet to trade"}
        </button>

        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--concrete)", textAlign: "center", lineHeight: 1.5 }}>
          Powered by curve · 1 click → tx in &lt;400ms<br />
          <span style={{ color: "var(--gravel)" }}>Slot 312_440_812 · network fee 0.000005 SOL</span>
        </div>
      </div>
    </>
  );
}
