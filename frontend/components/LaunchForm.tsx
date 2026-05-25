"use client";

import { useState } from "react";
import { useWallet } from "./WalletProvider";
import { useToast } from "./Toast";

export default function LaunchForm() {
  const wallet = useWallet();
  const toast = useToast();
  const who = wallet.address || "your wallet";
  const [name, setName] = useState("Pepe Detonator");
  const [ticker, setTicker] = useState("PEPED");
  const [desc, setDesc] = useState("A frog with a fuse. Liquidity until graduation. No promises, no roadmap — just curve.");
  const [initialBuy, setInitialBuy] = useState("0.10");

  const buy = parseFloat(initialBuy) || 0;
  const activation = buy * 0.01;
  const total = 0.02 + buy + activation; // curve init + initial buy + activation fee
  const avatar = (name.trim()[0] || "P").toUpperCase();
  const gradPct = Math.min((buy / 85) * 100, 100);

  function launch() {
    if (!wallet.connected) {
      wallet.openModal();
      return;
    }
    toast.runTx({
      pending: { title: "Lighting the fuse…", sub: `Minting $${ticker || "TOKEN"} + opening curve` },
      success: { title: `$${ticker || "TOKEN"} launched`, sub: "Curve open · see Portfolio → Launched" },
      errorTitle: "Launch failed",
    });
  }

  return (
    <div className="lwrap">
      <div className="l-side">
        <div className="l-title-row">
          <div className="eyebrow">● NEW LAUNCH · BONDING CURVE</div>
          <h1>Light the <em>fuse.</em></h1>
          <p>Launch a token on TNTSOL. It opens on a constant-product bonding curve from <b>0 → 85 devSOL</b>. Hit the threshold and liquidity migrates to a Raydium-style LP — your job is just to ship the fuse.</p>
        </div>

        <div className="form">
          <div className="l-section-h">01 · Identity</div>

          <div className="avatar-upload">
            <div className="avatar-drop">{avatar}<div className="edit">✎</div></div>
            <div className="avatar-meta">
              <div className="name">Token avatar</div>
              <div className="help">PNG · SVG · 1024×1024 · Drop or click to upload — or use the auto-generated mark.</div>
            </div>
          </div>

          <div className="input-row">
            <div className="field">
              <label>Token name</label>
              <input className="input" value={name} maxLength={32} onChange={(e) => setName(e.target.value)} />
              <div className="desc">e.g. &quot;Pepe Detonator&quot; · max 32 chars</div>
            </div>
            <div className="field">
              <label>Ticker</label>
              <div className="input-prefix">
                <span className="px">$</span>
                <input value={ticker} maxLength={6} onChange={(e) => setTicker(e.target.value.toUpperCase())} />
              </div>
              <div className="desc">3–6 letters · all caps · must be unique</div>
            </div>
          </div>

          <div className="field">
            <label>Description</label>
            <textarea className="input" rows={3} maxLength={280} value={desc} onChange={(e) => setDesc(e.target.value)} />
            <div className="desc">Shown on the token detail page. Up to 280 characters.</div>
          </div>

          <div className="l-section-h">02 · Socials (optional)</div>
          <div className="socials">
            <div className="s-input filled">𝕏 @pepedetonator</div>
            <div className="s-input filled">⌘ pepe-det.xyz</div>
            <div className="s-input">⌑ Telegram</div>
          </div>

          <div className="l-section-h">03 · Curve parameters</div>

          <div className="input-row">
            <div className="field">
              <label>Starting price</label>
              <input className="input" defaultValue="0.0000004 SOL" />
              <div className="desc">First-buyer price on the curve</div>
            </div>
            <div className="field">
              <label>Graduation</label>
              <input className="input" value="85 devSOL" disabled style={{ opacity: 0.6 }} readOnly />
              <div className="desc">Fixed by protocol</div>
            </div>
          </div>

          <div className="input-row">
            <div className="field">
              <label>Initial buy (optional)</label>
              <div className="input-prefix">
                <input value={initialBuy} inputMode="decimal" onChange={(e) => setInitialBuy(e.target.value)} />
                <span className="px">devSOL</span>
              </div>
              <div className="desc">Buy in at launch to seed momentum</div>
            </div>
            <div className="field">
              <label>Supply</label>
              <input className="input" value="1,000,000,000" disabled style={{ opacity: 0.6 }} readOnly />
              <div className="desc">Fixed at 1B tokens</div>
            </div>
          </div>
        </div>
      </div>

      <aside className="l-preview">
        <div className="preview-card">
          <h3>● LIVE PREVIEW</h3>
          <div className="tk-preview">
            <div className="row1">
              <div className="av">{avatar}</div>
              <div>
                <div className="nm">{name || "Untitled"} <span style={{ fontFamily: "var(--font-mono)", color: "var(--concrete)", fontWeight: 500, fontSize: 13 }}>${ticker || "TICKER"}</span></div>
                <div className="sm">launched by {who} · just now</div>
              </div>
            </div>
            <div className="bio">{desc}</div>
            <div className="meter"><div className="fill" style={{ width: `${Math.max(gradPct, 0.1)}%` }} /></div>
            <div className="meter-row"><span>Graduation</span><span><b style={{ color: "var(--bone)" }}>{buy.toFixed(2)}</b> / 85 devSOL</span></div>
          </div>

          <div className="cost-card">
            <div className="cost-row"><span className="k">Network fee · Solana</span><span className="v">0.000005 SOL</span></div>
            <div className="cost-row"><span className="k">Curve init</span><span className="v">0.020 SOL</span></div>
            <div className="cost-row"><span className="k">Initial buy</span><span className="v">{buy.toFixed(3)} devSOL</span></div>
            <div className="cost-row"><span className="k">Activation fee · 1%</span><span className="v amber">{activation.toFixed(3)} devSOL</span></div>
            <div className="cost-row total"><span className="k">Total cost</span><span className="v">{total.toFixed(3)} SOL</span></div>
          </div>

          <div className="fuse-banner">
            <div className="ic">🧨</div>
            <h4>Ready to light it?</h4>
            <p>Your token is mintable in 1 click. Curve opens at slot+1.</p>
          </div>

          <button className="btn-light" onClick={launch}>{wallet.connected ? "⚡ Light the fuse" : "Connect wallet to launch"}</button>

          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--concrete)", textAlign: "center", lineHeight: 1.5 }}>
            Signed with <b style={{ color: "var(--bone)" }}>{who}</b><br />
            <span style={{ color: "var(--gravel)" }}>Tx will appear in &apos;Portfolio → Launched&apos;</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
