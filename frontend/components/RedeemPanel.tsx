"use client";

import { useState } from "react";
import { WHITELIST_BALANCE } from "@/lib/data";
import { useWallet } from "./WalletProvider";
import { useToast } from "./Toast";

const RATE = 0.8; // 1 devSOL -> 0.80 SOL gross
const FEE = 0.008; // 0.8% redemption fee
const NETWORK = 0.000005;

export default function RedeemPanel() {
  const wallet = useWallet();
  const toast = useToast();
  const [amount, setAmount] = useState(WHITELIST_BALANCE.toFixed(2));
  const amt = Math.min(parseFloat(amount) || 0, WHITELIST_BALANCE);

  const gross = amt * RATE;
  const fee = gross * FEE;
  const net = Math.max(gross - fee - NETWORK, 0);

  const presets = ["25%", "50%", "75%", "MAX"];
  function applyPreset(p: string) {
    const pct = p === "MAX" ? 100 : parseInt(p);
    setAmount(((WHITELIST_BALANCE * pct) / 100).toFixed(2));
  }

  function confirm() {
    if (!wallet.connected) {
      wallet.openModal();
      return;
    }
    toast.runTx({
      pending: { title: "Redeeming to mainnet…", sub: `${amt.toFixed(2)} devSOL → SOL` },
      success: { title: "Redemption settled", sub: `+${net.toFixed(4)} SOL` },
      errorTitle: "Redemption failed",
    });
  }

  return (
    <div className="r-card">
      <div className="r-left">
        <h3>YOU REDEEM</h3>
        <div className="r-amount">
          <input value={amount} inputMode="decimal" onChange={(e) => setAmount(e.target.value)} />
          <div className="from"><span className="b" />devSOL</div>
        </div>
        <div className="r-presets">
          {presets.map((p) => (
            <span key={p} className={`r-preset${p === "MAX" ? " active" : ""}`} onClick={() => applyPreset(p)} role="button">{p}</span>
          ))}
          <span className="r-preset">Custom</span>
        </div>
        <div className="r-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 5v14M5 12l7 7 7-7" /></svg></div>
        <h3>YOU RECEIVE</h3>
        <div className="r-receive">
          <input value={net.toFixed(4)} readOnly />
          <div className="to"><span className="b" />SOL · mainnet</div>
        </div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--concrete)", marginTop: 12, display: "flex", justifyContent: "space-between" }}>
          <span>Whitelist available: <b style={{ color: "var(--bone)" }}>{WHITELIST_BALANCE} devSOL</b></span>
          <span>Mainnet wallet: <b style={{ color: "var(--bone)" }}>{wallet.address || "Connect wallet"}</b></span>
        </div>
      </div>

      <div className="r-right">
        <h3>RECEIPT</h3>
        <div className="r-receipt">
          <div className="rr-row"><span className="k">Whitelisted devSOL</span><span className="v">{amt.toFixed(5)}</span></div>
          <div className="rr-row"><span className="k">Redemption rate</span><span className="v">1 : 0.80</span></div>
          <div className="rr-row"><span className="k">Gross SOL</span><span className="v">{gross.toFixed(5)}</span></div>
          <div className="rr-row"><span className="k">Redemption fee · 0.8%</span><span className="v warn">−{fee.toFixed(5)}</span></div>
          <div className="rr-row"><span className="k">Network fee · Solana</span><span className="v">−0.000005</span></div>
          <div className="rr-divider" />
          <div className="rr-row total"><span className="k">Settles to mainnet</span><span className="v up">+{net.toFixed(4)} SOL</span></div>
        </div>

        <div className="r-action">
          <button className="btn-r" onClick={confirm} disabled={amt <= 0}>
            {wallet.connected ? "✓ Confirm redemption" : "Connect wallet to redeem"}
          </button>
          <div className="r-info">
            Treasury reserves <b>1,284 SOL</b> · ~149× this amount<br />
            <span style={{ color: "var(--gravel)" }}>Settles in 1 transaction · est. 412ms</span>
          </div>
        </div>
      </div>
    </div>
  );
}
