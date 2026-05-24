// TNTSOL — Mobile screens
// Each screen is rendered inside an IOSDevice frame.

const TNTLogo = ({ size = 22 }) => (
  <svg width={size * 0.7} height={size} viewBox="0 0 80 110">
    <path d="M40 28 C 40 14, 60 14, 68 4" fill="none" stroke="#FFB627" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="68" cy="4" r="4" fill="#FFB627"/>
    <rect x="11" y="25" width="58" height="9" rx="2" fill="#0A0908"/>
    <rect x="11" y="33" width="58" height="68" rx="5" fill="#FF2D1F"/>
    <text x="40" y="74" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight="700" fontSize="15" fill="#FFF6E8" letterSpacing="0.05em">TNT</text>
  </svg>
);

const TopBar = () => (
  <div className="m-topbar">
    <div className="m-brand">
      <TNTLogo size={22} />
      <span className="m-brand-text">TNT<span className="r">SOL</span></span>
      <span className="m-net">● DEVNET</span>
    </div>
    <div className="m-wallet"><span className="av"></span><b>2.41</b></div>
  </div>
);

const TabBar = ({ active }) => (
  <div className="m-tabbar">
    <div className={`m-tab ${active === 'floor' ? 'active' : ''}`}>
      <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M3 17l6-6 4 4 8-9"/><path d="M14 6h7v7"/></svg>
      FLOOR
    </div>
    <div className={`m-tab ${active === 'portfolio' ? 'active' : ''}`}>
      <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      BAGS
    </div>
    <div className="m-fab">＋</div>
    <div className={`m-tab ${active === 'redeem' ? 'active' : ''}`}>
      <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M12 3v18M5 8l7-5 7 5"/></svg>
      REDEEM
    </div>
    <div className={`m-tab ${active === 'profile' ? 'active' : ''}`}>
      <svg className="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-7 8-7s8 3 8 7"/></svg>
      ME
    </div>
  </div>
);

const Token = ({ av, bg, fg, name, sym, bucket, grad, price, pct, down, hot }) => (
  <div className={`m-tk ${hot ? 'hot' : ''}`}>
    <div className="av" style={{ background: bg, color: fg }}>{av}</div>
    <div className="info">
      <div className="nm">{name} <span className="sym">${sym}</span></div>
      <div className="meta">
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 9, padding: '2px 5px', borderRadius: 3,
          background: bucket === 'white' ? 'var(--whitelist-bg)' : 'var(--blacklist-bg)',
          color: bucket === 'white' ? 'var(--whitelist)' : 'var(--blacklist)',
          letterSpacing: '0.08em', fontWeight: 600,
        }}>{bucket === 'white' ? 'WL' : 'BL'}</span>
        <span>{grad}%</span>
      </div>
      <div className="grad-bar"><div className="fill" style={{ width: grad + '%' }}></div></div>
    </div>
    <div className="right">
      <div className="price">{price}</div>
      <div className={`pct ${down ? 'down' : ''}`}>{pct}</div>
    </div>
  </div>
);

const FloorScreen = () => (
  <div className="m-screen">
    <TopBar />
    <div className="m-content">
      <div className="m-hero">
        <div className="lbl">GRADUATING NOW</div>
        <div className="nm">Pepe Detonator <span className="sym">$PEPED</span></div>
        <div className="grad-line"><span>Curve</span><span><b>82.4</b> / 85 devSOL</span></div>
        <div className="bar"><div className="fill" style={{ width: '96%' }}></div></div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--bone)', opacity: 0.78, marginTop: 10, lineHeight: 1.5 }}>
          2.6 devSOL left until LP opens.
        </div>
      </div>

      <div className="m-filter-row">
        <span className="m-chip active">● ALL</span>
        <span className="m-chip">⚡ SPARKS</span>
        <span className="m-chip">📈 CLIMBING</span>
        <span className="m-chip">🎓 GRADUATING</span>
      </div>

      <div className="m-section-h"><span>● LIVE FLOOR</span><span className="more">1,284 →</span></div>

      <div className="m-tk-list">
        <Token av="P" bg="#FF2D1F" fg="#FFF6E8" name="Pepe Det." sym="PEPED" bucket="white" grad={96} price="0.000412" pct="+184%" hot />
        <Token av="F" bg="#9945FF" fg="#FFF6E8" name="Fuse Coin" sym="FUSE" bucket="white" grad={56} price="0.000118" pct="+67%" />
        <Token av="B" bg="#14F195" fg="#0A0908" name="Boom Town" sym="BOOM" bucket="black" grad={4} price="0.0000088" pct="+42%" />
        <Token av="D" bg="#FFB627" fg="#0A0908" name="Dynaverse" sym="DYN" bucket="white" grad={84} price="0.00214" pct="−2.1%" down />
        <Token av="K" bg="#FF5436" fg="#FFF6E8" name="Kerosene" sym="KERO" bucket="white" grad={26} price="0.000041" pct="+24%" />
        <Token av="N" bg="#E8E2D5" fg="#0A0908" name="Nitro" sym="NTR" bucket="white" grad={80} price="0.00811" pct="−4.2%" down />
      </div>
    </div>
    <TabBar active="floor" />
  </div>
);

const chart = (
  <svg viewBox="0 0 200 80" preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
    <defs>
      <linearGradient id="ag2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF2D1F" stopOpacity="0.4"/>
        <stop offset="100%" stopColor="#FF2D1F" stopOpacity="0"/>
      </linearGradient>
    </defs>
    <path d="M 0 60 L 16 58 L 32 52 L 48 56 L 64 42 L 80 46 L 96 32 L 112 36 L 128 24 L 144 28 L 160 16 L 176 18 L 200 6 L 200 80 L 0 80 Z" fill="url(#ag2)"/>
    <path d="M 0 60 L 16 58 L 32 52 L 48 56 L 64 42 L 80 46 L 96 32 L 112 36 L 128 24 L 144 28 L 160 16 L 176 18 L 200 6" stroke="#FF2D1F" strokeWidth="1.2" fill="none" strokeLinejoin="round"/>
    <circle cx="200" cy="6" r="2" fill="#FFB627"/>
  </svg>
);

const TokenScreen = () => (
  <div className="m-screen">
    <TopBar />
    <div className="m-content">
      <div className="m-td-head">
        <div className="av">P</div>
        <div className="info">
          <div className="nm">Pepe Detonator <span className="sym">$PEPED</span></div>
          <div className="meta">So11…X4kP · 1,284 holders</div>
        </div>
      </div>

      <div className="m-stats">
        <div className="m-stat"><div className="k">PRICE</div><div className="v">0.000412<small>SOL</small></div></div>
        <div className="m-stat"><div className="k">5M</div><div className="v up">+12.4%</div></div>
        <div className="m-stat"><div className="k">MCAP</div><div className="v">82.4k<small>devSOL</small></div></div>
        <div className="m-stat"><div className="k">24H</div><div className="v up">+184%</div></div>
      </div>

      <div className="m-chart">{chart}</div>

      <div className="m-grad-card">
        <div className="lbl">● GRADUATION IMMINENT</div>
        <div className="pct" style={{ color: 'var(--tnt-red)' }}>96.9%</div>
        <div className="bar"><div className="fill" style={{ width: '96.9%' }}></div></div>
        <div className="desc">2.6 devSOL until LP opens. The next 9 buys could trigger it.</div>
      </div>

      <div className="m-section-h"><span>YOUR POSITION</span></div>
      <div style={{ margin: '0 16px', padding: '14px 16px', background: 'var(--soot)', border: '1px solid var(--ash)', borderRadius: 12, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'var(--concrete)' }}>Balance</span>
          <span style={{ color: 'var(--bone)', fontWeight: 700 }}>12,400 PEPED</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: 'var(--concrete)' }}>PnL</span>
          <span style={{ color: 'var(--whitelist)', fontWeight: 700 }}>+2.41 · +88.9%</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span style={{ color: 'var(--concrete)' }}>Bucket</span>
          <span style={{ color: 'var(--whitelist)', fontWeight: 700 }}>● WL · REDEEMABLE</span>
        </div>
      </div>
    </div>
    <div className="m-buy-bar">
      <button className="sell">Sell</button>
      <button className="buy">⚡ Buy</button>
    </div>
    <TabBar active="floor" />
  </div>
);

const PortfolioScreen = () => (
  <div className="m-screen">
    <TopBar />
    <div className="m-content">
      <div className="m-portfolio-hero">
        <div className="lbl">NET WORTH · DEVNET</div>
        <div className="v">14.82<small>devSOL</small></div>
        <div className="pnl">+3.41 · +29.9% <span style={{ color: 'var(--concrete)', fontWeight: 500 }}>30d</span></div>

        <div className="m-bucket-bar">
          <div className="w" style={{ width: '73%' }}></div>
          <div className="b" style={{ width: '27%' }}></div>
        </div>

        <div className="m-bucket-legend">
          <div className="m-bl wl">
            <div className="k">WHITELIST · 73%</div>
            <div className="v">10.81<small>devSOL</small></div>
          </div>
          <div className="m-bl bl">
            <div className="k">BLACKLIST · 27%</div>
            <div className="v">4.01<small>devSOL</small></div>
          </div>
        </div>
      </div>

      <div style={{ margin: '0 16px 16px', padding: '14px 16px', background: 'linear-gradient(135deg, rgba(255,182,39,0.10), rgba(255,182,39,0.02))', border: '1px solid var(--blacklist-soft)', borderRadius: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--fuse-amber)', color: 'var(--carbon)', display: 'grid', placeItems: 'center', fontSize: 18 }}>⚡</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 13 }}>Activate <span style={{ color: 'var(--fuse-amber)' }}>4.01</span> devSOL</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--concrete)', marginTop: 2 }}>One trade, 1% fee. Becomes redeemable forever.</div>
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--whitelist)', fontWeight: 700 }}>→</div>
        </div>
      </div>

      <div className="m-section-h"><span>HOLDINGS · 8</span><span className="more">Sort ↓</span></div>

      <div className="m-tk-list">
        <Token av="P" bg="#FF2D1F" fg="#FFF6E8" name="Pepe Det." sym="PEPED" bucket="white" grad={96} price="5.10 devSOL" pct="+88.9%" />
        <Token av="F" bg="#9945FF" fg="#FFF6E8" name="Fuse Coin" sym="FUSE" bucket="white" grad={56} price="2.85 devSOL" pct="+20.4%" />
        <Token av="B" bg="#14F195" fg="#0A0908" name="Boom Town" sym="BOOM" bucket="black" grad={4} price="1.62 devSOL" pct="+95.4%" />
        <Token av="N" bg="#E8E2D5" fg="#0A0908" name="Nitro" sym="NTR" bucket="white" grad={80} price="1.42 devSOL" pct="−7.8%" down />
        <Token av="K" bg="#FF5436" fg="#FFF6E8" name="Kerosene" sym="KERO" bucket="black" grad={26} price="0.88 devSOL" pct="−13.7%" down />
      </div>
    </div>
    <TabBar active="portfolio" />
  </div>
);

const WalletConnect = () => (
  <div className="m-screen" style={{ position: 'relative' }}>
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at 50% 30%, rgba(255,45,31,0.25), transparent 60%), var(--carbon)',
    }}></div>
    <div style={{ position: 'absolute', top: 14, left: 0, right: 0, height: 44, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '0 20px', zIndex: 2 }}>
      <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--ash)', display: 'grid', placeItems: 'center', color: 'var(--bone)' }}>×</span>
    </div>
    <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '120px 20px 40px' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ display: 'inline-block', marginBottom: 18 }}>
          <svg width="92" height="124" viewBox="0 0 80 110">
            <path d="M40 28 C 40 14, 60 14, 68 4" fill="none" stroke="#FFB627" strokeWidth="3" strokeLinecap="round"/>
            <circle cx="68" cy="4" r="5" fill="#FFB627"/>
            <circle cx="68" cy="4" r="12" fill="#FFB627" opacity="0.25"/>
            <rect x="11" y="25" width="58" height="9" rx="2" fill="#0A0908"/>
            <rect x="11" y="33" width="58" height="68" rx="5" fill="#FF2D1F"/>
            <text x="40" y="74" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight="700" fontSize="15" fill="#FFF6E8" letterSpacing="0.05em">TNT</text>
          </svg>
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 30, letterSpacing: '-0.025em', lineHeight: 1, marginBottom: 8 }}>
          Light the fuse.
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--bone)', opacity: 0.78, lineHeight: 1.55, maxWidth: 280, margin: '0 auto' }}>
          Connect your Solana wallet to start trading. Devnet only — your real funds stay safe.
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
        {[
          { name: 'Phantom', bg: 'linear-gradient(135deg, #AB9FF2, #6A5BF0)', avtxt: '👻' },
          { name: 'Backpack', bg: 'linear-gradient(135deg, #E33E3E, #C92121)', avtxt: '🎒' },
          { name: 'Solflare', bg: 'linear-gradient(135deg, #FFC10B, #FE6B00)', avtxt: '☀' },
          { name: 'WalletConnect', bg: 'linear-gradient(135deg, #3B99FC, #1976D2)', avtxt: '⌘' },
        ].map(w => (
          <div key={w.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--soot)', border: '1px solid var(--ash)', borderRadius: 14 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: w.bg, display: 'grid', placeItems: 'center', fontSize: 16 }}>{w.avtxt}</div>
            <div style={{ flex: 1, fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 16 }}>{w.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--concrete)' }}>→</div>
          </div>
        ))}
      </div>

      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--concrete)', textAlign: 'center', lineHeight: 1.5 }}>
        By connecting you accept our <b style={{ color: 'var(--bone)' }}>terms</b> and acknowledge that<br/>
        devnet trades carry no mainnet risk.
      </div>
    </div>
  </div>
);

const ActivateModal = () => (
  <div className="m-screen" style={{ position: 'relative' }}>
    <FloorScreen />
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}></div>
    <div style={{
      position: 'absolute', left: 12, right: 12, top: '50%', transform: 'translateY(-50%)',
      background: 'var(--soot)', border: '1px solid var(--ash)', borderRadius: 22, padding: 24,
      boxShadow: '0 40px 80px -20px rgba(0,0,0,0.8)',
    }}>
      <div style={{ display: 'grid', placeItems: 'center', marginBottom: 16 }}>
        <div style={{ width: 72, height: 72, borderRadius: 18, background: 'linear-gradient(135deg, #FFB627, #FF2D1F)', display: 'grid', placeItems: 'center', fontSize: 36, boxShadow: '0 16px 32px -8px rgba(255,45,31,0.6)' }}>⚡</div>
      </div>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 22, letterSpacing: '-0.015em', marginBottom: 6 }}>
          Activate <span style={{ color: 'var(--fuse-amber)' }}>0.5 devSOL</span>?
        </div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, color: 'var(--bone)', opacity: 0.8, lineHeight: 1.5 }}>
          One-time 1% fee. Your devSOL becomes whitelist forever — redeemable for real SOL.
        </div>
      </div>
      <div style={{ background: 'var(--carbon)', border: '1px solid var(--ash)', borderRadius: 12, padding: 14, marginBottom: 14, fontFamily: 'var(--font-mono)', fontSize: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'var(--concrete)' }}>Trade amount</span>
          <span style={{ color: 'var(--bone)', fontWeight: 600 }}>0.5000 devSOL</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: 'var(--concrete)' }}>Activation fee · 1%</span>
          <span style={{ color: 'var(--fuse-amber)', fontWeight: 600 }}>−0.0050</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid var(--ash)' }}>
          <span style={{ color: 'var(--bone)' }}>Becomes redeemable</span>
          <span style={{ color: 'var(--whitelist)', fontWeight: 700 }}>+0.4950 devSOL</span>
        </div>
      </div>
      <button style={{ width: '100%', padding: 16, background: 'var(--tnt-red)', color: 'var(--carbon)', border: 0, borderRadius: 12, fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16 }}>
        ⚡ Light the fuse
      </button>
      <button style={{ width: '100%', padding: 12, marginTop: 8, background: 'transparent', color: 'var(--concrete)', border: 0, fontFamily: 'var(--font-display)', fontSize: 14 }}>
        Cancel
      </button>
    </div>
  </div>
);

// === RENDER ===
const Devices = () => (
  <>
    <div className="device-wrap">
      <IOSDevice dark width={390} height={780}><FloorScreen /></IOSDevice>
      <div className="device-label"><b>01 · Floor</b>Discovery feed</div>
      <div className="device-desc">Live token discovery with bucket badges, graduation meters, and 4-chip filter rail.</div>
    </div>
    <div className="device-wrap">
      <IOSDevice dark width={390} height={780}><TokenScreen /></IOSDevice>
      <div className="device-label"><b>02 · Token</b>Detail + trade</div>
      <div className="device-desc">Token detail with chart, graduation meter, and persistent buy/sell bar.</div>
    </div>
    <div className="device-wrap">
      <IOSDevice dark width={390} height={780}><PortfolioScreen /></IOSDevice>
      <div className="device-label"><b>03 · Bags</b>Portfolio</div>
      <div className="device-desc">Net worth with WL/BL bucket breakdown and one-tap activation prompt.</div>
    </div>
    <div className="device-wrap">
      <IOSDevice dark width={390} height={780}><WalletConnect /></IOSDevice>
      <div className="device-label"><b>04 · Connect</b>Onboarding</div>
      <div className="device-desc">First-run wallet connect — Phantom, Backpack, Solflare, WalletConnect.</div>
    </div>
    <div className="device-wrap">
      <IOSDevice dark width={390} height={780}><ActivateModal /></IOSDevice>
      <div className="device-label"><b>05 · Activate</b>Bucket conversion</div>
      <div className="device-desc">The moment a user pays the 1% fee to convert blacklist → whitelist devSOL.</div>
    </div>
  </>
);

ReactDOM.createRoot(document.getElementById('devices')).render(<Devices />);
