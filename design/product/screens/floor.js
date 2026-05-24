// TNTSOL — Floor screen renderer
// Renders nav, sidebar, main, and right-rail into the prepared shell.

const TOKENS = [
  { rank: '01', sym: 'PEPED', name: 'Pepe Detonator', av: 'P', avBg: '#FF2D1F', avFg: '#FFF6E8',
    price: '0.000412', m5: '+12.4%', h1: '+184%', mcap: '82.4k', grad: 96, bucket: 'white', holders: '1,284', spark: true },
  { rank: '02', sym: 'FUSE', name: 'Fuse Coin', av: 'F', avBg: '#9945FF', avFg: '#FFF6E8',
    price: '0.000118', m5: '+4.2%', h1: '+67%', mcap: '48.1k', grad: 56, bucket: 'white', holders: '612' },
  { rank: '03', sym: 'BOOM', name: 'Boom Town', av: 'B', avBg: '#14F195', avFg: '#0A0908',
    price: '0.0000088', m5: '+42%', h1: '+128%', mcap: '3.2k', grad: 4, bucket: 'black', holders: '89' },
  { rank: '04', sym: 'DYN', name: 'Dynaverse', av: 'D', avBg: '#FFB627', avFg: '#0A0908',
    price: '0.00214', m5: '−2.1%', h1: '+18.4%', mcap: '71.8k', grad: 84, bucket: 'white', holders: '2,041', m5down: true },
  { rank: '05', sym: 'KERO', name: 'Kerosene', av: 'K', avBg: '#FF5436', avFg: '#FFF6E8',
    price: '0.000041', m5: '−8.4%', h1: '+24%', mcap: '22.6k', grad: 26, bucket: 'white', holders: '418', m5down: true },
  { rank: '06', sym: 'MAG', name: 'Magma', av: 'M', avBg: '#5C2BB0', avFg: '#FFF6E8',
    price: '0.0000412', m5: '+1.2%', h1: '+9%', mcap: '8.4k', grad: 10, bucket: 'black', holders: '156' },
  { rank: '07', sym: 'NTR', name: 'Nitro', av: 'N', avBg: '#E8E2D5', avFg: '#0A0908',
    price: '0.00811', m5: '+0.8%', h1: '−4.2%', mcap: '68.4k', grad: 80, bucket: 'white', holders: '3,418', h1down: true },
  { rank: '08', sym: 'SPRK', name: 'Sparkler', av: 'S', avBg: '#FFB627', avFg: '#0A0908',
    price: '0.000018', m5: '+8%', h1: '+44%', mcap: '5.6k', grad: 7, bucket: 'black', holders: '142' },
  { rank: '09', sym: 'TRIG', name: 'Trigger', av: 'T', avBg: '#B81A0F', avFg: '#FFF6E8',
    price: '0.00128', m5: '+3.4%', h1: '+22%', mcap: '38.2k', grad: 45, bucket: 'white', holders: '824' },
];

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
    <a class="nav-tab active">Floor</a>
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
    <button class="btn btn-primary btn-sm">Light a fuse</button>
    <div class="wallet-pill">
      <span class="av"></span>
      <span class="addr">7XnZ…q9kF</span>
      <span class="bal">2.41<small>devSOL</small></span>
    </div>
  </div>`;
}

function sidebar() {
  return `
  <div class="side-h">DISCOVER</div>
  <div class="side-item active"><span>🔥</span><span class="lbl">Live floor</span><span class="ct">1,284</span></div>
  <div class="side-item"><span>⚡</span><span class="lbl">Sparks · 1h</span><span class="ct">312</span></div>
  <div class="side-item"><span>📈</span><span class="lbl">Climbing</span><span class="ct">48</span></div>
  <div class="side-item"><span>🎓</span><span class="lbl">Graduating</span><span class="ct">7</span></div>
  <div class="side-item"><span>💀</span><span class="lbl">Dust</span><span class="ct">9.2k</span></div>

  <div class="side-h">YOUR BAGS</div>
  <div class="side-item"><span>💼</span><span class="lbl">Holdings</span><span class="ct">12</span></div>
  <div class="side-item"><span>👀</span><span class="lbl">Watchlist</span><span class="ct">23</span></div>
  <div class="side-item"><span>🚀</span><span class="lbl">Launched</span><span class="ct">2</span></div>

  <div class="side-h">SOCIAL</div>
  <div class="side-item"><span>🧬</span><span class="lbl">Crew picks</span><span class="ct">18</span></div>
  <div class="side-item"><span>🐋</span><span class="lbl">Whale flow</span></div>

  <div class="feed-stats">
    <div class="r"><span>Floor TVL</span><b>4,812 devSOL</b></div>
    <div class="r"><span>Vol · 24h</span><b>22.4k</b></div>
    <div class="r"><span>Launches · 24h</span><b>1,029</b></div>
    <div class="r"><span>Activations</span><b>+318</b></div>
  </div>`;
}

function heroStrip() {
  return `
  <div class="hero-strip">
    <div class="hero-card primary">
      <div class="htop"><div class="lbl">● GRADUATING NOW</div><div class="ago">2m ago</div></div>
      <div class="name">Pepe Detonator <span class="sym">$PEPED</span></div>
      <div class="stats">
        <div><div class="k">Price</div><div class="v">0.000412</div></div>
        <div><div class="k">24h</div><div class="v up">+184.2%</div></div>
        <div><div class="k">Mcap</div><div class="v">82.4k</div></div>
        <div><div class="k">Holders</div><div class="v">1,284</div></div>
      </div>
      <div class="grad-meter"><div class="fill" style="width: 96%;"></div></div>
      <div class="grad-line"><span>Graduation</span><span><b>82.4</b> / 85 devSOL</span></div>
    </div>
    <div class="hero-card">
      <div class="htop"><div class="lbl" style="color: var(--fuse-amber);">⚡ FRESH SPARK</div><div class="ago">12s ago</div></div>
      <div class="name">Boom Town <span class="sym">$BOOM</span></div>
      <div class="stats">
        <div><div class="k">Price</div><div class="v">0.0000088</div></div>
        <div><div class="k">5m</div><div class="v up">+42%</div></div>
        <div><div class="k">Mcap</div><div class="v">3.2k</div></div>
      </div>
      <div class="grad-meter"><div class="fill" style="width: 4%;"></div></div>
      <div class="grad-line"><span>Graduation</span><span><b>3.2</b> / 85</span></div>
    </div>
    <div class="hero-card">
      <div class="htop"><div class="lbl" style="color: var(--whitelist);">📈 CLIMBING</div><div class="ago">17m ago</div></div>
      <div class="name">Fuse Coin <span class="sym">$FUSE</span></div>
      <div class="stats">
        <div><div class="k">Price</div><div class="v">0.000118</div></div>
        <div><div class="k">1h</div><div class="v up">+67%</div></div>
        <div><div class="k">Mcap</div><div class="v">48.1k</div></div>
      </div>
      <div class="grad-meter"><div class="fill" style="width: 56%;"></div></div>
      <div class="grad-line"><span>Graduation</span><span><b>48.1</b> / 85</span></div>
    </div>
  </div>`;
}

function feedRow(t) {
  const m5cls = t.m5down ? 'num-down' : 'num-up';
  const h1cls = t.h1down ? 'num-down' : 'num-up';
  return `
  <div class="feed-row ${t.spark ? 'spark' : ''}">
    <div class="tk-rank">${t.spark ? `<b>${t.rank}</b>` : t.rank}</div>
    <div class="tk-cell">
      <div class="tk-av" style="background:${t.avBg}; color:${t.avFg};">${t.av}</div>
      <div class="tk-info">
        <div class="tk-name">${t.name} <span class="sym">$${t.sym}</span></div>
        <div class="tk-meta"><span class="bucket ${t.bucket}"><span class="dot"></span>${t.bucket === 'white' ? 'WHITELIST' : 'BLACKLIST'}</span><span>${t.holders} holders</span></div>
      </div>
    </div>
    <div class="num">${t.price}</div>
    <div class="num ${m5cls}">${t.m5}</div>
    <div class="num ${h1cls}">${t.h1}</div>
    <div class="num">${t.mcap}</div>
    <div class="grad-cell"><div class="grad-bar"><div class="gf" style="width:${t.grad}%"></div></div><div class="gtxt">${t.grad}% · ${(t.grad * 0.85).toFixed(1)}/85</div></div>
    <button class="btn ${t.spark ? 'btn-primary' : 'btn-secondary'} btn-sm">Buy</button>
  </div>`;
}

function main() {
  return `
  <div class="topbar-row">
    <h1>The Floor <small>● LIVE · 1,284 tokens</small></h1>
    <div class="filter-row">
      <span class="pill active"><span class="dot" style="background:var(--tnt-red);"></span>All</span>
      <span class="pill"><span class="dot" style="background:var(--fuse-amber);"></span>Sparks</span>
      <span class="pill"><span class="dot" style="background:var(--whitelist);"></span>Climbing</span>
      <span class="pill">Graduating</span>
      <span class="pill">Sort: <b style="color:var(--bone); margin-left:4px;">Heat</b> ↓</span>
    </div>
  </div>
  ${heroStrip()}
  <div class="feed">
    <div class="feed-head">
      <span>#</span><span>Token</span><span>Price (SOL)</span><span>5m</span><span>1h</span><span>Mcap</span><span>Curve</span><span></span>
    </div>
    ${TOKENS.map(feedRow).join('')}
  </div>`;
}

function rail() {
  return `
  <div class="grad-imminent">
    <div class="hdr"><span class="ping"></span>GRADUATION IMMINENT</div>
    <div class="name">Pepe Detonator <span class="sym">$PEPED</span></div>
    <div style="font-size: 13px; color: var(--bone); opacity: 0.78; margin-top: 8px; line-height: 1.5;">2.6 devSOL until LP opens. The next 9 buys could trigger it.</div>
    <div class="progress"><span>Curve</span><span><b>82.4</b> / 85 devSOL</span></div>
    <button class="btn btn-primary btn-sm" style="width:100%; justify-content:center; margin-top: 12px;">Detonate buy →</button>
  </div>

  <div class="rail-section">
    <h4>● LIVE TRADES</h4>
    <div class="live-tx">
      <div class="tx-line buy"><span class="meta"><b>BUY</b> <span class="addr">7Hk…m2P</span> · PEPED</span><span class="amt">+0.412</span></div>
      <div class="tx-line buy"><span class="meta"><b>BUY</b> <span class="addr">9zL…k8X</span> · FUSE</span><span class="amt">+0.118</span></div>
      <div class="tx-line sell"><span class="meta"><b>SELL</b> <span class="addr">3Ny…q4F</span> · NTR</span><span class="amt">−0.81</span></div>
      <div class="tx-line buy"><span class="meta"><b>BUY</b> <span class="addr">5Bq…n2R</span> · PEPED</span><span class="amt">+1.20</span></div>
      <div class="tx-line buy"><span class="meta"><b>BUY</b> <span class="addr">2Wd…f7K</span> · BOOM</span><span class="amt">+0.008</span></div>
      <div class="tx-line sell"><span class="meta"><b>SELL</b> <span class="addr">8Yr…s1T</span> · KERO</span><span class="amt">−0.040</span></div>
    </div>
  </div>

  <div class="rail-section">
    <h4>FRESH SPARKS</h4>
    <div class="spark-list">
      <div class="sp-row"><div class="sp-av" style="background:linear-gradient(135deg,#14F195,#FFB627);"></div><div class="sp-info"><div class="nm">Boom Town <span class="sym">$BOOM</span></div><div class="age">launched 12s ago</div></div><span class="sp-pct">+42%</span></div>
      <div class="sp-row"><div class="sp-av" style="background:linear-gradient(135deg,#FFB627,#FF2D1F);"></div><div class="sp-info"><div class="nm">Sparkler <span class="sym">$SPRK</span></div><div class="age">48s ago</div></div><span class="sp-pct">+8%</span></div>
      <div class="sp-row"><div class="sp-av" style="background:linear-gradient(135deg,#9945FF,#FF2D1F);"></div><div class="sp-info"><div class="nm">Detonate <span class="sym">$DET</span></div><div class="age">2m ago</div></div><span class="sp-pct">+18%</span></div>
      <div class="sp-row"><div class="sp-av" style="background:linear-gradient(135deg,#FF5436,#FFB627);"></div><div class="sp-info"><div class="nm">Wick <span class="sym">$WICK</span></div><div class="age">4m ago</div></div><span class="sp-pct">+3%</span></div>
    </div>
  </div>`;
}

document.getElementById('nav').innerHTML = topnav();
document.getElementById('side').innerHTML = sidebar();
document.getElementById('main').innerHTML = main();
document.getElementById('rail').innerHTML = rail();
