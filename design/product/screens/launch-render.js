// TNTSOL — Launch a token

function topnav() {
  return `
  <div class="brand">
    <svg class="mark" viewBox="0 0 80 110">
      <path d="M40 28 C 40 14, 60 14, 68 4" fill="none" stroke="#FFB627" stroke-width="3" stroke-linecap="round"/>
      <circle cx="68" cy="4" r="4" fill="#FFB627"/>
      <rect x="11" y="25" width="58" height="9" rx="2" fill="#0A0908"/>
      <rect x="11" y="33" width="58" height="68" rx="5" fill="#FF2D1F"/>
      <text x="40" y="74" text-anchor="middle" font-family="JetBrains Mono, monospace" font-weight="700" font-size="15" fill="#FFF6E8" letter-spacing="0.05em">TNT</text>
    </svg>
    <div class="name">TNT<span class="red">SOL</span></div>
    <div class="net">● DEVNET</div>
  </div>
  <nav class="nav-tabs">
    <a class="nav-tab" href="Floor.html">Floor</a>
    <a class="nav-tab" href="Portfolio.html">Portfolio <span class="badge">3</span></a>
    <a class="nav-tab active">Light the fuse</a>
    <a class="nav-tab" href="Redeem.html">Redeem</a>
    <a class="nav-tab">Docs</a>
  </nav>
  <div class="nav-right">
    <div class="search-box">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M16 16l5 5"/></svg>
      <span>Find a token, ticker, or wallet</span>
      <kbd>⌘K</kbd>
    </div>
    <div class="wallet-pill">
      <span class="av"></span>
      <span class="addr">7XnZ…q9kF</span>
      <span class="bal">2.41<small>devSOL</small></span>
    </div>
  </div>`;
}

document.getElementById('nav').innerHTML = topnav();
document.getElementById('main').innerHTML = `
<div class="lwrap">
  <div class="l-side">
    <div class="l-title-row">
      <div class="eyebrow">● NEW LAUNCH · BONDING CURVE</div>
      <h1>Light the <em>fuse.</em></h1>
      <p>Launch a token on TNTSOL. It opens on a constant-product bonding curve from <b>0 → 85 devSOL</b>. Hit the threshold and liquidity migrates to a Raydium-style LP — your job is just to ship the fuse.</p>
    </div>

    <div class="form">
      <div class="l-section-h">01 · Identity</div>

      <div class="avatar-upload">
        <div class="avatar-drop">P<div class="edit">✎</div></div>
        <div class="avatar-meta">
          <div class="name">Token avatar</div>
          <div class="help">PNG · SVG · 1024×1024 · Drop or click to upload — or use the auto-generated mark.</div>
        </div>
      </div>

      <div class="input-row">
        <div class="field">
          <label>Token name</label>
          <input class="input" value="Pepe Detonator" />
          <div class="desc">e.g. "Pepe Detonator" · max 32 chars</div>
        </div>
        <div class="field">
          <label>Ticker</label>
          <div class="input-prefix">
            <span class="px">$</span>
            <input value="PEPED" />
          </div>
          <div class="desc">3–6 letters · all caps · must be unique</div>
        </div>
      </div>

      <div class="field">
        <label>Description</label>
        <textarea class="input" rows="3">A frog with a fuse. Liquidity until graduation. No promises, no roadmap — just curve.</textarea>
        <div class="desc">Shown on the token detail page. Up to 280 characters.</div>
      </div>

      <div class="l-section-h">02 · Socials (optional)</div>
      <div class="socials">
        <div class="s-input filled">𝕏 @pepedetonator</div>
        <div class="s-input filled">⌘ pepe-det.xyz</div>
        <div class="s-input">⌑ Telegram</div>
      </div>

      <div class="l-section-h">03 · Curve parameters</div>

      <div class="input-row">
        <div class="field">
          <label>Starting price</label>
          <input class="input" value="0.0000004 SOL" />
          <div class="desc">First-buyer price on the curve</div>
        </div>
        <div class="field">
          <label>Graduation</label>
          <input class="input" value="85 devSOL" disabled style="opacity: 0.6;" />
          <div class="desc">Fixed by protocol</div>
        </div>
      </div>

      <div class="input-row">
        <div class="field">
          <label>Initial buy (optional)</label>
          <div class="input-prefix">
            <input value="0.10" />
            <span class="px">devSOL</span>
          </div>
          <div class="desc">Buy in at launch to seed momentum</div>
        </div>
        <div class="field">
          <label>Supply</label>
          <input class="input" value="1,000,000,000" disabled style="opacity: 0.6;" />
          <div class="desc">Fixed at 1B tokens</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Right preview -->
  <aside class="l-preview">
    <div class="preview-card">
      <h3>● LIVE PREVIEW</h3>
      <div class="tk-preview">
        <div class="row1">
          <div class="av">P</div>
          <div>
            <div class="nm">Pepe Detonator <span style="font-family:var(--font-mono); color:var(--concrete); font-weight:500; font-size:13px;">$PEPED</span></div>
            <div class="sm">launched by 7XnZ…q9kF · just now</div>
          </div>
        </div>
        <div class="bio">A frog with a fuse. Liquidity until graduation. No promises, no roadmap — just curve.</div>
        <div class="meter"><div class="fill" style="width: 0.1%;"></div></div>
        <div class="meter-row"><span>Graduation</span><span><b style="color:var(--bone);">0.10</b> / 85 devSOL</span></div>
      </div>

      <div class="cost-card">
        <div class="cost-row"><span class="k">Network fee · Solana</span><span class="v">0.000005 SOL</span></div>
        <div class="cost-row"><span class="k">Curve init</span><span class="v">0.020 SOL</span></div>
        <div class="cost-row"><span class="k">Initial buy</span><span class="v">0.100 devSOL</span></div>
        <div class="cost-row"><span class="k">Activation fee · 1%</span><span class="v amber">0.001 devSOL</span></div>
        <div class="cost-row total"><span class="k">Total cost</span><span class="v">0.121 SOL</span></div>
      </div>

      <div class="fuse-banner">
        <div class="ic">🧨</div>
        <h4>Ready to light it?</h4>
        <p>Your token is mintable in 1 click. Curve opens at slot+1.</p>
      </div>

      <button class="btn-light">⚡ Light the fuse</button>

      <div style="font-family: var(--font-mono); font-size: 11px; color: var(--concrete); text-align: center; line-height: 1.5;">
        Signed with <b style="color: var(--bone);">7XnZ…q9kF</b><br/>
        <span style="color: var(--gravel);">Tx will appear in 'Portfolio → Launched'</span>
      </div>
    </div>
  </aside>
</div>
`;
