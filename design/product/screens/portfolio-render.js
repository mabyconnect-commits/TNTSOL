// TNTSOL — Portfolio renderer

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
    <a class="nav-tab active">Portfolio <span class="badge">3</span></a>
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

function bucketHero() {
  const r = 80, C = 2 * Math.PI * r;
  const wlPct = 73;
  const wlLen = (wlPct / 100) * C;
  const blLen = C - wlLen;
  return `
  <div class="bucket-hero">
    <div class="bh-row">
      <div class="bh-left">
        <h3>NET WORTH · DEVNET</h3>
        <div class="bh-total"><div class="v">14.82<small>devSOL</small></div></div>
        <div class="bh-pnl">+3.41 devSOL · +29.9% <small>30d</small></div>
        <p class="bh-sub">Of your bag, <b style="color:var(--whitelist);">10.81 devSOL is whitelisted</b> — already activated and ready to redeem for mainnet SOL at any time. The rest needs a 1% activation fee on its next trade.</p>

        <div class="bucket-legend">
          <div class="bl-card white">
            <div class="k">WHITELIST · LIVE</div>
            <div class="v">10.81<small>devSOL</small></div>
            <div class="note">↳ Redeems at 0.8% → 8.65 SOL</div>
          </div>
          <div class="bl-card black">
            <div class="k">BLACKLIST · LOCKED</div>
            <div class="v">4.01<small>devSOL</small></div>
            <div class="note">↳ Trade once to activate (1% fee)</div>
          </div>
        </div>
      </div>

      <div>
        <div class="bucket-donut">
          <svg viewBox="0 0 200 200">
            <circle cx="100" cy="100" r="80" fill="none" stroke="#25221F" stroke-width="22"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="#14F195" stroke-width="22"
                    stroke-dasharray="${wlLen} ${C}"/>
            <circle cx="100" cy="100" r="80" fill="none" stroke="#FFB627" stroke-width="22"
                    stroke-dasharray="${blLen} ${C}"
                    stroke-dashoffset="${-wlLen}"/>
          </svg>
          <div class="center">
            <div class="lbl">REDEEMABLE</div>
            <div class="pct" style="color: var(--whitelist);">73%</div>
            <div class="sub">10.81 / 14.82 devSOL</div>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}

function statsStrip() {
  return `
  <div class="stats-strip">
    <div class="stat-card">
      <div class="k">Token positions</div>
      <div class="v">8</div>
      <div class="delta">3 whitelist · 5 blacklist</div>
    </div>
    <div class="stat-card">
      <div class="k">24h PnL</div>
      <div class="v" style="color: var(--whitelist);">+1.24</div>
      <div class="delta">+9.1% on 8 positions</div>
    </div>
    <div class="stat-card">
      <div class="k">All-time PnL</div>
      <div class="v" style="color: var(--whitelist);">+8.42</div>
      <div class="delta">274 trades · win rate 64%</div>
    </div>
    <div class="stat-card">
      <div class="k">Available to redeem</div>
      <div class="v">8.65<small>SOL</small></div>
      <div class="delta" style="color: var(--fuse-amber);">0.8% fee on next redemption</div>
    </div>
  </div>`;
}

function activationBanner() {
  return `
  <div class="act-banner">
    <div>
      <h4>⚡ Activate <b>4.01 devSOL</b> in blacklist holdings</h4>
      <p>Light the fuse on any trade and pay a one-time 1% activation fee. Your devSOL becomes whitelist forever, redeemable at any time.</p>
    </div>
    <div class="right">
      <div class="num">−0.040</div>
      <div class="lbl">FEE AT CURRENT BALANCE</div>
      <button class="btn btn-primary btn-sm" style="margin-top:6px;">Activate now</button>
    </div>
  </div>`;
}

function holdingsTable() {
  const rows = [
    { sym: 'PEPED', name: 'Pepe Detonator', av: 'P', bg: '#FF2D1F', fg: '#FFF6E8', bucket: 'white', balance: '12,400', value: '5.10', avg: '0.000218', pnl: '+2.41', pct: '+88.9', up: true },
    { sym: 'FUSE',  name: 'Fuse Coin',      av: 'F', bg: '#9945FF', fg: '#FFF6E8', bucket: 'white', balance: '24,180', value: '2.85', avg: '0.000098', pnl: '+0.48', pct: '+20.4', up: true },
    { sym: 'NTR',   name: 'Nitro',          av: 'N', bg: '#E8E2D5', fg: '#0A0908', bucket: 'white', balance: '1,840',  value: '1.42', avg: '0.00084',  pnl: '−0.12', pct: '−7.8',  up: false },
    { sym: 'BOOM',  name: 'Boom Town',      av: 'B', bg: '#14F195', fg: '#0A0908', bucket: 'black', balance: '184k',   value: '1.62', avg: '0.0000056',pnl: '+0.79', pct: '+95.4', up: true },
    { sym: 'KERO',  name: 'Kerosene',       av: 'K', bg: '#FF5436', fg: '#FFF6E8', bucket: 'black', balance: '21,400', value: '0.88', avg: '0.000048', pnl: '−0.14', pct: '−13.7', up: false },
    { sym: 'DET',   name: 'Detonate',       av: 'D', bg: '#5C2BB0', fg: '#FFF6E8', bucket: 'black', balance: '8,200',  value: '0.62', avg: '0.000064', pnl: '+0.10', pct: '+19.2', up: true },
    { sym: 'WICK',  name: 'Wick',           av: 'W', bg: '#FFB627', fg: '#0A0908', bucket: 'black', balance: '4,800',  value: '0.42', avg: '0.000071', pnl: '+0.08', pct: '+23.5', up: true },
    { sym: 'SPRK',  name: 'Sparkler',       av: 'S', bg: '#FF2D1F', fg: '#FFF6E8', bucket: 'black', balance: '12,800', value: '0.18', avg: '0.000018', pnl: '−0.02', pct: '−10.0', up: false },
  ];
  return `
  <div class="holdings">
    <div class="h-head">
      <span>Token</span><span>Balance</span><span>Avg entry</span><span>Value</span><span>PnL</span><span>Bucket</span><span></span>
    </div>
    ${rows.map(r => `
      <div class="h-row">
        <div class="h-cell">
          <div class="av" style="background:${r.bg}; color:${r.fg};">${r.av}</div>
          <div class="info">
            <div class="nm">${r.name} <span class="sym">$${r.sym}</span></div>
            <div class="meta">${r.balance} ${r.sym}</div>
          </div>
        </div>
        <span class="num">${r.balance}</span>
        <span class="num">${r.avg}</span>
        <span class="num">${r.value} <small style="color:var(--concrete); font-weight:500;">devSOL</small></span>
        <span class="num pnl ${r.up ? 'up' : 'down'}">${r.pnl}<br/><span style="font-size: 11px; font-weight: 500;">${r.pct}%</span></span>
        <span><span class="bucket ${r.bucket}"><span class="dot"></span>${r.bucket === 'white' ? 'WL' : 'BL'}</span></span>
        <div class="actions-cell">
          <button class="btn btn-secondary btn-sm">Trade</button>
        </div>
      </div>
    `).join('')}
  </div>`;
}

function bottomGrid() {
  return `
  <div class="tw-grid">
    <div class="curve-mini">
      <h3>📈 Graduation watch</h3>
      <div class="curve-rows">
        <div class="curve-line">
          <div class="nm"><span class="dot" style="background:var(--tnt-red); box-shadow: 0 0 8px var(--tnt-red);"></span>Pepe Detonator <span style="color:var(--concrete);">$PEPED</span></div>
          <div>
            <div class="pct"><b>96.9%</b> · 82.4 / 85</div>
            <div class="bar"><div class="fill" style="width: 96.9%;"></div></div>
          </div>
          <button class="btn btn-primary btn-sm" style="justify-self: end;">Detonate</button>
        </div>
        <div class="curve-line">
          <div class="nm"><span class="dot" style="background:var(--fuse-amber); box-shadow: 0 0 8px var(--fuse-amber);"></span>Dynaverse <span style="color:var(--concrete);">$DYN</span></div>
          <div>
            <div class="pct"><b>84%</b> · 71.4 / 85</div>
            <div class="bar"><div class="fill" style="width: 84%;"></div></div>
          </div>
          <button class="btn btn-secondary btn-sm" style="justify-self: end;">Watch</button>
        </div>
        <div class="curve-line">
          <div class="nm"><span class="dot" style="background:var(--whitelist);"></span>Nitro <span style="color:var(--concrete);">$NTR</span></div>
          <div>
            <div class="pct"><b>80%</b> · 68.4 / 85</div>
            <div class="bar"><div class="fill" style="width: 80%;"></div></div>
          </div>
          <button class="btn btn-secondary btn-sm" style="justify-self: end;">Watch</button>
        </div>
      </div>
    </div>

    <div class="treasury-card">
      <h3>🏦 Redemption</h3>
      <div class="t-row"><span class="k">Whitelist balance</span><span class="v">10.81 devSOL</span></div>
      <div class="t-row"><span class="k">Redeem rate</span><span class="v">1 : 0.80</span></div>
      <div class="t-row"><span class="k">Redemption fee</span><span class="v">0.8%</span></div>
      <div class="t-row"><span class="k">You'd receive</span><span class="v up">8.65 SOL</span></div>
      <div class="t-row"><span class="k">Treasury TVL</span><span class="v">1,284.2 SOL</span></div>
      <a class="btn btn-success" href="Redeem.html" style="justify-content: center; margin-top: 4px;">Redeem to mainnet →</a>
    </div>
  </div>`;
}

document.getElementById('nav').innerHTML = topnav();
document.getElementById('main').innerHTML = `
  <div class="p-header">
    <div>
      <h1>Portfolio</h1>
      <div class="sub">7XnZ…q9kF · synced 4s ago · all positions accounted</div>
    </div>
    <div class="actions">
      <button class="btn btn-ghost btn-sm">⤴ Export CSV</button>
      <button class="btn btn-secondary btn-sm">Deposit</button>
      <a class="btn btn-primary btn-sm" href="Redeem.html">Redeem</a>
    </div>
  </div>

  ${bucketHero()}
  ${statsStrip()}
  ${activationBanner()}

  <div class="section-head">
    <h2>Holdings</h2>
  </div>
  <div class="section-tabs">
    <div class="s-tab active">All <span class="ct">8</span></div>
    <div class="s-tab">Whitelist <span class="ct">3</span></div>
    <div class="s-tab">Blacklist <span class="ct">5</span></div>
    <div class="s-tab">Watchlist <span class="ct">23</span></div>
    <div class="s-tab">Launched <span class="ct">2</span></div>
  </div>
  ${holdingsTable()}

  ${bottomGrid()}
`;
