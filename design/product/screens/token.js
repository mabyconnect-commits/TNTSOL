// TNTSOL — Token detail page renderer

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

function chart() {
  // Build a candlestick-ish path going up to graduation
  // Sample points trending up with a few dips
  const points = [
    [0, 80], [8, 78], [16, 75], [24, 78], [32, 70], [40, 72], [48, 68],
    [56, 62], [64, 65], [72, 58], [80, 55], [88, 50], [96, 52], [104, 45],
    [112, 42], [120, 36], [128, 34], [136, 38], [144, 30], [152, 28],
    [160, 22], [168, 24], [176, 18], [184, 16], [192, 12], [200, 10]
  ];
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0]} ${p[1]}`).join(' ');
  const areaD = pathD + ` L 200 100 L 0 100 Z`;
  return `
  <svg viewBox="0 0 200 100" preserveAspectRatio="none" style="height:100%; width:100%;">
    <defs>
      <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#FF2D1F" stop-opacity="0.4"/>
        <stop offset="100%" stop-color="#FF2D1F" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <!-- grid -->
    <g stroke="#1A1817" stroke-width="0.3" fill="none">
      <line x1="0" y1="20" x2="200" y2="20"/>
      <line x1="0" y1="40" x2="200" y2="40"/>
      <line x1="0" y1="60" x2="200" y2="60"/>
      <line x1="0" y1="80" x2="200" y2="80"/>
    </g>
    <!-- area -->
    <path d="${areaD}" fill="url(#ag)"/>
    <!-- line -->
    <path d="${pathD}" stroke="#FF2D1F" stroke-width="0.8" fill="none" stroke-linejoin="round" stroke-linecap="round"/>
    <!-- last point -->
    <circle cx="200" cy="10" r="1.5" fill="#FFB627"/>
    <circle cx="200" cy="10" r="3.5" fill="none" stroke="#FFB627" stroke-width="0.5" opacity="0.5"/>
    <!-- graduation marker -->
    <line x1="0" y1="6" x2="200" y2="6" stroke="#14F195" stroke-width="0.3" stroke-dasharray="2 2"/>
    <text x="2" y="4" font-family="JetBrains Mono, monospace" font-size="3" fill="#14F195">GRADUATION 85 devSOL</text>
  </svg>`;
}

function main() {
  return `
  <div class="crumb"><a href="Floor.html">Floor</a><span class="sep">/</span>Whitelist<span class="sep">/</span><span style="color:var(--bone);">Pepe Detonator</span></div>

  <div class="token-header">
    <div class="th-av">P</div>
    <div class="th-meta">
      <div class="name">Pepe Detonator <span class="sym">$PEPED</span> <span class="bucket white"><span class="dot"></span>WHITELIST</span></div>
      <div class="sub">
        <span class="mint">So11…X4kP</span>
        <span>·</span>
        <span>Launched 4h 12m ago by 7XnZ…q9kF</span>
        <span>·</span>
        <span>1,284 holders · 38 in crew</span>
      </div>
    </div>
    <div class="th-actions">
      <button class="btn btn-ghost btn-sm">☆ Watch</button>
      <button class="btn btn-ghost btn-sm">⤴ Share</button>
    </div>
  </div>

  <!-- Stats hero -->
  <div class="price-hero">
    <div class="ph-cell">
      <div class="k">Price</div>
      <div class="v">0.000412<small>SOL</small></div>
      <div class="change up">+12.4% · 5m</div>
    </div>
    <div class="ph-cell">
      <div class="k">Market cap</div>
      <div class="v">82.4k<small>devSOL</small></div>
      <div class="change up">+184% · 24h</div>
    </div>
    <div class="ph-cell">
      <div class="k">Volume · 24h</div>
      <div class="v">14.2k<small>devSOL</small></div>
      <div class="change">412 trades</div>
    </div>
    <div class="ph-cell">
      <div class="k">Holders</div>
      <div class="v">1,284</div>
      <div class="change up">+128 · 1h</div>
    </div>
  </div>

  <!-- Chart card -->
  <div class="chart-card">
    <div class="chart-controls">
      <div class="chart-tabs">
        <span class="chart-tab active">Price</span>
        <span class="chart-tab">Curve</span>
        <span class="chart-tab">Holders</span>
        <span class="chart-tab">Volume</span>
      </div>
      <div class="ranges">
        <button>1m</button>
        <button>5m</button>
        <button class="active">15m</button>
        <button>1h</button>
        <button>4h</button>
        <button>1d</button>
        <button>All</button>
      </div>
    </div>
    <div class="chart-area">${chart()}</div>
  </div>

  <!-- Graduation card -->
  <div class="curve-card">
    <h3>Graduation <span class="pct">96.9%</span> <span style="font-family: var(--font-mono); font-size: 11px; color: var(--tnt-red); margin-left: auto; letter-spacing: 0.14em; font-weight: 500;">● IMMINENT</span></h3>
    <div class="meter"><div class="fill" style="width: 96.9%;"></div></div>
    <div class="meter-row"><span>Curve balance</span><span><b>82.4</b> / 85 devSOL</span></div>
    <p class="blurb">When the curve hits <b style="color:var(--fuse-amber);">85 devSOL</b>, the bonding curve closes and liquidity migrates to a full Raydium-style LP. The next <b>2.6 devSOL</b> of buys could trigger graduation — buyers in that window get the final curve price and unlock free LP trading.</p>
  </div>

  <!-- Holders / trades / comments tabs -->
  <div class="tabs">
    <span class="tab active">Holders <span class="ct">1,284</span></span>
    <span class="tab">Trades <span class="ct">412</span></span>
    <span class="tab">Crew <span class="ct">38</span></span>
    <span class="tab">Comments <span class="ct">62</span></span>
  </div>

  <div class="holder-list">
    <div class="holder-row" style="background: var(--smoke); border-bottom: 1px solid var(--ash); font-family: var(--font-mono); font-size: 10px; color: var(--concrete); letter-spacing: 0.1em; text-transform: uppercase;">
      <span>#</span><span>Wallet</span><span>Balance</span><span>% Supply</span><span>PnL</span><span>Bucket</span>
    </div>
    <div class="holder-row">
      <span class="rk">01</span>
      <div class="who"><span class="av"></span><span class="addr">7XnZ…q9kF</span><span class="tag">DEV</span></div>
      <span class="num">120.4M</span>
      <span class="num">12.0%</span>
      <span class="num pnl up">+412 SOL</span>
      <div class="bk"><span class="bucket white"><span class="dot"></span>WL</span></div>
    </div>
    <div class="holder-row">
      <span class="rk">02</span>
      <div class="who"><span class="av" style="background: linear-gradient(135deg,#FFB627,#FF2D1F);"></span><span class="addr">3Bq…n2R</span><span class="tag">🐋</span></div>
      <span class="num">84.2M</span>
      <span class="num">8.4%</span>
      <span class="num pnl up">+186 SOL</span>
      <div class="bk"><span class="bucket white"><span class="dot"></span>WL</span></div>
    </div>
    <div class="holder-row">
      <span class="rk">03</span>
      <div class="who"><span class="av"></span><span class="addr">9zL…k8X</span></div>
      <span class="num">42.1M</span>
      <span class="num">4.2%</span>
      <span class="num pnl up">+74 SOL</span>
      <div class="bk"><span class="bucket black"><span class="dot"></span>BL</span></div>
    </div>
    <div class="holder-row">
      <span class="rk">04</span>
      <div class="who"><span class="av" style="background: linear-gradient(135deg,#14F195,#9945FF);"></span><span class="addr">2Wd…f7K</span></div>
      <span class="num">28.6M</span>
      <span class="num">2.8%</span>
      <span class="num pnl up">+41 SOL</span>
      <div class="bk"><span class="bucket white"><span class="dot"></span>WL</span></div>
    </div>
    <div class="holder-row">
      <span class="rk">05</span>
      <div class="who"><span class="av"></span><span class="addr">5Hk…m2P</span></div>
      <span class="num">21.2M</span>
      <span class="num">2.1%</span>
      <span class="num pnl down">−4 SOL</span>
      <div class="bk"><span class="bucket black"><span class="dot"></span>BL</span></div>
    </div>
    <div class="holder-row">
      <span class="rk">06</span>
      <div class="who"><span class="av" style="background: linear-gradient(135deg,#FF2D1F,#FFB627);"></span><span class="addr">8Yr…s1T</span></div>
      <span class="num">18.4M</span>
      <span class="num">1.8%</span>
      <span class="num pnl up">+32 SOL</span>
      <div class="bk"><span class="bucket white"><span class="dot"></span>WL</span></div>
    </div>
  </div>`;
}

function tradePanel() {
  return `
  <div class="tinfo-card">
    <div class="label">YOUR POSITION</div>
    <div class="tinfo-row"><span class="k">Balance</span><span class="v">12,400 PEPED</span></div>
    <div class="tinfo-row"><span class="k">Avg entry</span><span class="v">0.000218</span></div>
    <div class="tinfo-row"><span class="k">PnL</span><span class="v" style="color: var(--whitelist);">+2.41 devSOL · +88.9%</span></div>
    <div class="tinfo-row"><span class="k">Bucket</span><span class="v"><span class="bucket white"><span class="dot"></span>WL · REDEEMABLE</span></span></div>
  </div>

  <div class="trade-panel">
    <div class="trade-tabs">
      <button class="buy active">Buy</button>
      <button class="sell">Sell</button>
    </div>

    <div class="amount-row">
      <div class="amount-input">
        <input type="text" value="0.5" />
        <div class="currency"><span class="badge"></span>devSOL</div>
      </div>
      <div class="amount-meta">
        <span>≈ 1,214.07 PEPED</span>
        <span class="max">MAX · 2.41</span>
      </div>
      <div class="preset-row">
        <button class="preset">0.1</button>
        <button class="preset">0.5</button>
        <button class="preset">1</button>
        <button class="preset">MAX</button>
      </div>
    </div>

    <div class="activation-notice">
      <div class="ic">⚡</div>
      <div class="body">
        Activating <b>0.5 devSOL</b> for redemption.
        <span class="small">First trade pays a 1% activation fee (0.005 devSOL) — once paid, your devSOL is redeemable for real SOL forever.</span>
      </div>
    </div>

    <div class="receipt">
      <div class="r"><span class="k">You pay</span><span class="v">0.5000 devSOL</span></div>
      <div class="r"><span class="k">Activation fee · 1%</span><span class="v" style="color:var(--fuse-amber);">−0.0050</span></div>
      <div class="r"><span class="k">Platform fee · 0.4%</span><span class="v">−0.0020</span></div>
      <div class="r"><span class="k">Price impact</span><span class="v">+0.31%</span></div>
      <div class="r"><span class="k">Slippage</span><span class="v">0.5%</span></div>
      <div class="divider"></div>
      <div class="r total"><span class="k">You receive</span><span class="v">+1,214.07 PEPED</span></div>
    </div>

    <button class="btn-detonate">⚡ Light the fuse → Buy PEPED</button>

    <div style="font-family: var(--font-mono); font-size: 11px; color: var(--concrete); text-align: center; line-height: 1.5;">
      Powered by curve · 1 click → tx in &lt;400ms<br/>
      <span style="color: var(--gravel);">Slot 312_440_812 · network fee 0.000005 SOL</span>
    </div>
  </div>`;
}

document.getElementById('nav').innerHTML = topnav();
document.getElementById('main').innerHTML = main();
document.getElementById('side').innerHTML = tradePanel();
