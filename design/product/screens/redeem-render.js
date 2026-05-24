// TNTSOL — Redeem renderer

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
    <a class="nav-tab" href="Launch.html">Light the fuse</a>
    <a class="nav-tab active">Redeem</a>
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
<div class="rwrap">

  <div class="r-head">
    <div class="eyebrow">REDEMPTION · DEVNET → MAINNET</div>
    <h1>Cash out your <em>whitelist.</em></h1>
    <p>Convert your activated devSOL into real mainnet SOL at the current redemption rate. Pays a 0.8% fee, settles in a single transaction. Blacklist holdings need to be activated first.</p>
  </div>

  <div class="r-steps">
    <div class="r-step done"><div class="num">✓</div><div class="lbl">Activated</div></div>
    <div class="r-step active"><div class="num">2</div><div class="lbl">Pick amount</div></div>
    <div class="r-step"><div class="num">3</div><div class="lbl">Confirm</div></div>
    <div class="r-step"><div class="num">4</div><div class="lbl">Settled</div></div>
  </div>

  <div class="r-card">
    <!-- LEFT -->
    <div class="r-left">
      <h3>YOU REDEEM</h3>
      <div class="r-amount">
        <input value="10.81" />
        <div class="from"><span class="b"></span>devSOL</div>
      </div>
      <div class="r-presets">
        <span class="r-preset">25%</span>
        <span class="r-preset">50%</span>
        <span class="r-preset">75%</span>
        <span class="r-preset active">MAX</span>
        <span class="r-preset">Custom</span>
      </div>
      <div class="r-arrow"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M12 5v14M5 12l7 7 7-7"/></svg></div>
      <h3>YOU RECEIVE</h3>
      <div class="r-receive">
        <input value="8.6480" readonly />
        <div class="to"><span class="b"></span>SOL · mainnet</div>
      </div>
      <div style="font-family: var(--font-mono); font-size: 11px; color: var(--concrete); margin-top: 12px; display: flex; justify-content: space-between;">
        <span>Whitelist available: <b style="color: var(--bone);">10.81 devSOL</b></span>
        <span>Mainnet wallet: <b style="color: var(--bone);">7XnZ…q9kF</b></span>
      </div>
    </div>

    <!-- RIGHT -->
    <div class="r-right">
      <h3>RECEIPT</h3>
      <div class="r-receipt">
        <div class="rr-row"><span class="k">Whitelisted devSOL</span><span class="v">10.81000</span></div>
        <div class="rr-row"><span class="k">Redemption rate</span><span class="v">1 : 0.80</span></div>
        <div class="rr-row"><span class="k">Gross SOL</span><span class="v">8.71200</span></div>
        <div class="rr-row"><span class="k">Redemption fee · 0.8%</span><span class="v warn">−0.06400</span></div>
        <div class="rr-row"><span class="k">Network fee · Solana</span><span class="v">−0.000005</span></div>
        <div class="rr-divider"></div>
        <div class="rr-row total"><span class="k">Settles to mainnet</span><span class="v up">+8.6480 SOL</span></div>
      </div>

      <div class="r-action">
        <button class="btn-r">✓ Confirm redemption</button>
        <div class="r-info">
          Treasury reserves <b>1,284 SOL</b> · ~149× this amount<br/>
          <span style="color: var(--gravel);">Settles in 1 transaction · est. 412ms</span>
        </div>
      </div>
    </div>
  </div>

  <!-- Treasury -->
  <div class="r-treasury">
    <div class="r-tcell">
      <div class="k">Treasury</div>
      <div class="v">1,284<small>SOL</small></div>
      <div class="note">↳ on Solana mainnet</div>
    </div>
    <div class="r-tcell">
      <div class="k">Activated devSOL</div>
      <div class="v">12,840<small>devSOL</small></div>
      <div class="note">↳ across 4,128 wallets</div>
    </div>
    <div class="r-tcell">
      <div class="k">Reserve ratio</div>
      <div class="v" style="color: var(--whitelist);">120%</div>
      <div class="note">↳ healthy · over-collateralized</div>
    </div>
    <div class="r-tcell">
      <div class="k">Redemptions · 24h</div>
      <div class="v">38</div>
      <div class="note">↳ 184 SOL out</div>
    </div>
  </div>

  <!-- History -->
  <div class="r-history-section">
    <h2>Recent redemptions</h2>
    <div class="r-history">
      <div class="r-h-head">
        <span>Time</span>
        <span>From</span>
        <span>devSOL</span>
        <span>SOL</span>
        <span>Status</span>
        <span></span>
      </div>
      <div class="r-h-row">
        <span class="num">2m ago</span>
        <span class="num" style="color:var(--bone);">7XnZ…q9kF</span>
        <span class="num">2.412</span>
        <span class="num" style="color: var(--whitelist);">+1.930</span>
        <span><span class="tag-pill done">SETTLED</span></span>
        <span class="arrow" style="text-align:right;">↗</span>
      </div>
      <div class="r-h-row">
        <span class="num">14m ago</span>
        <span class="num" style="color:var(--bone);">3Bq…n2R</span>
        <span class="num">8.000</span>
        <span class="num" style="color: var(--whitelist);">+6.400</span>
        <span><span class="tag-pill done">SETTLED</span></span>
        <span class="arrow" style="text-align:right;">↗</span>
      </div>
      <div class="r-h-row">
        <span class="num">22m ago</span>
        <span class="num" style="color:var(--bone);">9zL…k8X</span>
        <span class="num">1.250</span>
        <span class="num" style="color: var(--whitelist);">+1.000</span>
        <span><span class="tag-pill done">SETTLED</span></span>
        <span class="arrow" style="text-align:right;">↗</span>
      </div>
      <div class="r-h-row">
        <span class="num">1h ago</span>
        <span class="num" style="color:var(--bone);">5Hk…m2P</span>
        <span class="num">0.640</span>
        <span class="num" style="color: var(--whitelist);">+0.512</span>
        <span><span class="tag-pill done">SETTLED</span></span>
        <span class="arrow" style="text-align:right;">↗</span>
      </div>
    </div>
  </div>
</div>
`;
