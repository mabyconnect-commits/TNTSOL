// TNTSOL — Graduation animation scene
// Stage size 1920x1080, duration 6s

const W = 1920, H = 1080;

// ── Background grid + radial glow ──────────────────────────────────
const Background = () => {
  const t = useTime();
  // glow ramps up during detonation
  const glow = interpolate([0, 2.0, 2.4, 3.5, 6], [0, 0.05, 0.85, 0.55, 0.45])(t);
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0A0908', overflow: 'hidden' }}>
      {/* grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
      }} />
      {/* radial glow center */}
      <div style={{
        position: 'absolute', left: '50%', top: '50%',
        width: 1800, height: 1800,
        transform: `translate(-50%, -50%)`,
        background: `radial-gradient(circle, rgba(255,45,31,${glow * 0.7}), rgba(255,182,39,${glow * 0.3}) 30%, transparent 60%)`,
        pointerEvents: 'none',
      }} />
    </div>
  );
};

// ── Status pill (top left) — phases ──────────────────────────────
const StatusPill = () => {
  const t = useTime();
  const phase = t < 1.5 ? 'IMMINENT' : t < 2.2 ? 'IGNITING' : t < 3.5 ? 'DETONATING' : 'GRADUATED';
  const color = t < 1.5 ? '#FF2D1F' : t < 2.2 ? '#FFB627' : t < 3.5 ? '#FF2D1F' : '#14F195';
  return (
    <div style={{ position: 'absolute', top: 48, left: 48, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, boxShadow: `0 0 16px ${color}` }} />
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color, letterSpacing: '0.2em', fontWeight: 700 }}>● {phase}</div>
    </div>
  );
};

// ── Wallet pill (top right) ─────────────────────────────────────
const WalletPill = () => (
  <div style={{
    position: 'absolute', top: 40, right: 48,
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '10px 16px', borderRadius: 999,
    background: '#121110', border: '1px solid #25221F',
    fontFamily: 'JetBrains Mono, monospace', fontSize: 14, color: '#E8E2D5',
  }}>
    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'linear-gradient(135deg, #9945FF, #14F195)' }} />
    <span style={{ color: '#5C544D' }}>7XnZ…q9kF</span>
    <span style={{ color: '#14F195', fontWeight: 700 }}>2.41 devSOL</span>
  </div>
);

// ── Brand mark (top center) ─────────────────────────────────────
const BrandMark = () => (
  <div style={{
    position: 'absolute', top: 48, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', alignItems: 'center', gap: 12,
  }}>
    <svg width="22" height="30" viewBox="0 0 80 110">
      <path d="M40 28 C 40 14, 60 14, 68 4" fill="none" stroke="#FFB627" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="68" cy="4" r="4" fill="#FFB627"/>
      <rect x="11" y="25" width="58" height="9" rx="2" fill="#0A0908"/>
      <rect x="11" y="33" width="58" height="68" rx="5" fill="#FF2D1F"/>
      <text x="40" y="74" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight="700" fontSize="15" fill="#FFF6E8" letterSpacing="0.05em">TNT</text>
    </svg>
    <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 22, letterSpacing: '-0.04em' }}>
      TNT<span style={{ color: '#FF2D1F' }}>SOL</span>
    </div>
  </div>
);

// ── PHASE 1: Curve panel (visible 0 - 2.4s) ─────────────────────
const CurvePanel = () => {
  const t = useTime();
  // curve fills from 96.9% to 100% during 0-2.0s
  const curveFill = interpolate([0, 1.5, 2.0], [96.9, 99.4, 100], Easing.easeInExpo)(t);
  // shake intensifies leading to detonation
  const shake = t > 1.4 && t < 2.2 ? Math.sin(t * 80) * (t - 1.4) * 8 : 0;
  // panel scale, fades/collapses after detonation
  const opacity = interpolate([0, 2.0, 2.3], [1, 1, 0])(t);
  const scale = interpolate([0, 2.0, 2.3], [1, 1.05, 1.4], Easing.easeInQuart)(t);
  // heartbeat scale
  const heart = 1 + Math.sin(t * 8) * 0.012;

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: `translate(-50%, -50%) translate(${shake}px, ${shake * 0.4}px) scale(${scale * heart})`,
      width: 720, opacity,
      padding: 36, borderRadius: 24,
      background: 'radial-gradient(ellipse at 0% 0%, rgba(255,45,31,0.18), transparent 60%), #121110',
      border: '1px solid rgba(255,45,31,0.4)',
      boxShadow: `0 40px 80px -20px rgba(0,0,0,0.6), 0 0 ${40 + curveFill}px rgba(255,45,31,${(curveFill - 96) / 8})`,
    }}>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#FF2D1F', letterSpacing: '0.2em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FF2D1F', boxShadow: '0 0 12px #FF2D1F' }}/>
        GRADUATION IMMINENT
      </div>
      <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 56, letterSpacing: '-0.025em', margin: '20px 0 8px', display: 'flex', alignItems: 'baseline', gap: 14 }}>
        Pepe Detonator
        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 22, color: '#5C544D', fontWeight: 500 }}>$PEPED</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 16, color: '#5C544D', marginBottom: 14 }}>
        <span>Curve balance</span>
        <span><b style={{ color: '#FF2D1F', fontFamily: 'Space Grotesk, sans-serif', fontSize: 28, letterSpacing: '-0.01em' }}>{curveFill.toFixed(1)}</b> <span style={{ color: '#3A3531' }}>/ 85 devSOL</span></span>
      </div>
      {/* progress bar */}
      <div style={{ height: 22, background: '#0A0908', borderRadius: 11, overflow: 'hidden', border: '1px solid #25221F', position: 'relative' }}>
        <div style={{
          height: '100%', width: (curveFill / 100) * 100 + '%',
          background: 'linear-gradient(90deg, #FF2D1F, #FFB627)',
          borderRadius: 11, position: 'relative',
          transition: 'none',
          boxShadow: '0 0 24px rgba(255,182,39,0.6)',
        }}>
          <div style={{
            position: 'absolute', right: -8, top: -4, width: 16, height: 30,
            background: '#FFB627', borderRadius: 4,
            boxShadow: '0 0 30px #FFB627',
          }}/>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#5C544D', marginTop: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        <span>Holders <b style={{ color: '#E8E2D5' }}>1,284</b></span>
        <span>Mcap <b style={{ color: '#E8E2D5' }}>82.4k devSOL</b></span>
        <span>24H <b style={{ color: '#14F195' }}>+184%</b></span>
      </div>
    </div>
  );
};

// ── PHASE 2: Detonation flash (2.2 - 3.5s) ──────────────────────
const Flash = () => {
  const t = useTime();
  const op = interpolate([2.0, 2.25, 2.6, 3.5], [0, 1, 0.4, 0], Easing.easeOutCubic)(t);
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'radial-gradient(circle at 50% 50%, rgba(255,246,232,0.95), rgba(255,182,39,0.5) 20%, rgba(255,45,31,0.2) 40%, transparent 70%)',
      opacity: op, pointerEvents: 'none',
      mixBlendMode: 'screen',
    }}/>
  );
};

// ── PHASE 3: Particle burst (radial dynamite chunks) ──────────────
const Particles = () => {
  const t = useTime();
  const start = 2.15;
  if (t < start) return null;
  const local = t - start;
  // 32 particles
  const particles = [];
  for (let i = 0; i < 32; i++) {
    const angle = (i / 32) * Math.PI * 2;
    // each particle has its own distance / size
    const dist = 200 + (i % 5) * 80 + Math.sin(i * 7.3) * 60;
    const finalDist = dist + local * 280;
    const x = Math.cos(angle) * finalDist;
    const y = Math.sin(angle) * finalDist + local * 30 * local; // slight gravity
    const op = interpolate([0, 0.3, 1.5], [1, 1, 0], Easing.easeOutQuad)(local);
    const sz = interpolate([0, 0.2, 1.5], [4, 14, 2], Easing.easeOutQuad)(local);
    const palette = ['#FF2D1F', '#FFB627', '#FFF6E8', '#FF5436'];
    const color = palette[i % 4];
    particles.push(
      <div key={i} style={{
        position: 'absolute', left: '50%', top: '50%',
        width: sz, height: sz, borderRadius: '50%',
        background: color, boxShadow: `0 0 ${sz * 2}px ${color}`,
        transform: `translate(${x - sz/2}px, ${y - sz/2}px)`,
        opacity: op, pointerEvents: 'none',
      }}/>
    );
  }
  // Big TNT chunk rings — 3 concentric expanding circles
  const rings = [0, 0.08, 0.16].map((delay, idx) => {
    const lt = local - delay;
    if (lt < 0) return null;
    const r = lt * 700;
    const op = interpolate([0, 0.05, 1.0], [0.6, 0.9, 0], Easing.easeOutCubic)(lt);
    const sw = interpolate([0, 0.2, 1.0], [12, 4, 0])(lt);
    return (
      <div key={'r' + idx} style={{
        position: 'absolute', left: '50%', top: '50%',
        width: r * 2, height: r * 2, borderRadius: '50%',
        border: `${sw}px solid ${idx === 0 ? '#FFB627' : idx === 1 ? '#FF2D1F' : '#FFF6E8'}`,
        transform: 'translate(-50%, -50%)',
        opacity: op, pointerEvents: 'none',
      }}/>
    );
  });
  return <>{rings}{particles}</>;
};

// ── PHASE 4: Graduation reveal ──────────────────────────────────
const GraduatedReveal = () => {
  const t = useTime();
  const start = 2.5;
  if (t < start) return null;
  const local = t - start;
  // mark bloom
  const markScale = interpolate([0, 0.4, 0.7, 3.5], [0, 1.15, 1, 1], Easing.easeOutBack)(local);
  const markOp = interpolate([0, 0.2, 3.5], [0, 1, 1])(local);
  // text reveals
  const titleY = interpolate([0.5, 1.2], [60, 0], Easing.easeOutCubic)(local);
  const titleOp = interpolate([0.5, 1.2], [0, 1])(local);
  const subOp = interpolate([1.0, 1.8], [0, 1])(local);
  const statsOp = interpolate([1.5, 2.4], [0, 1])(local);
  const statsY = interpolate([1.5, 2.4], [40, 0], Easing.easeOutCubic)(local);

  return (
    <div style={{
      position: 'absolute', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
      width: 1100, textAlign: 'center',
    }}>
      {/* The mark, blooming */}
      <div style={{ transform: `scale(${markScale})`, opacity: markOp, transformOrigin: 'center' }}>
        <svg width="120" height="170" viewBox="0 0 80 110">
          <defs>
            <radialGradient id="glow" cx="50%" cy="60%" r="50%">
              <stop offset="0%" stopColor="#FFF6E8" stopOpacity="0.8"/>
              <stop offset="100%" stopColor="#FFB627" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="40" cy="65" r="60" fill="url(#glow)"/>
          <path d="M40 28 C 40 14, 60 14, 68 4" fill="none" stroke="#FFB627" strokeWidth="3" strokeLinecap="round"/>
          <circle cx="68" cy="4" r="6" fill="#FFB627"/>
          <circle cx="68" cy="4" r="14" fill="#FFB627" opacity="0.3"/>
          <rect x="11" y="25" width="58" height="9" rx="2" fill="#0A0908"/>
          <rect x="11" y="33" width="58" height="68" rx="5" fill="#FF2D1F"/>
          <text x="40" y="74" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontWeight="700" fontSize="15" fill="#FFF6E8" letterSpacing="0.05em">TNT</text>
        </svg>
      </div>

      {/* eyebrow */}
      <div style={{
        opacity: titleOp, transform: `translateY(${titleY * 0.4}px)`,
        fontFamily: 'JetBrains Mono, monospace', fontSize: 16,
        color: '#14F195', letterSpacing: '0.32em', textTransform: 'uppercase',
        display: 'inline-flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#14F195', boxShadow: '0 0 14px #14F195' }}/>
        LP OPENED · CURVE CLOSED · GRADUATED
      </div>

      {/* big title */}
      <div style={{
        opacity: titleOp, transform: `translateY(${titleY}px)`,
        fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700,
        fontSize: 192, letterSpacing: '-0.05em', lineHeight: 0.92,
        color: '#E8E2D5',
        marginTop: -8,
      }}>
        <span style={{ color: '#FF2D1F' }}>$PEPED</span> just<br/>
        <span style={{ color: '#FFB627' }}>graduated.</span>
      </div>

      {/* subtitle */}
      <div style={{
        opacity: subOp, marginTop: -8,
        fontFamily: 'Space Grotesk, sans-serif', fontSize: 22, color: '#E8E2D5',
        opacity: subOp * 0.78, lineHeight: 1.5, maxWidth: 760,
      }}>
        85 devSOL on the curve. Liquidity has migrated to a Raydium LP.<br/>
        The fuse worked.
      </div>

      {/* stats */}
      <div style={{
        marginTop: 16, opacity: statsOp, transform: `translateY(${statsY}px)`,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1,
        background: '#25221F', border: '1px solid #25221F', borderRadius: 14,
        overflow: 'hidden', width: 900,
      }}>
        {[
          ['Final curve', '85.00', 'devSOL'],
          ['LP seeded', '170k', 'PEPED'],
          ['Holders', '1,284', ''],
          ['Time on curve', '4h 12m', ''],
        ].map(([k, v, u]) => (
          <div key={k} style={{ background: '#121110', padding: '20px 24px', textAlign: 'left' }}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#5C544D', letterSpacing: '0.14em', textTransform: 'uppercase' }}>{k}</div>
            <div style={{ fontFamily: 'Space Grotesk, sans-serif', fontWeight: 700, fontSize: 32, letterSpacing: '-0.02em', marginTop: 4 }}>
              {v}{u && <span style={{ fontSize: 14, color: '#5C544D', fontWeight: 500, fontFamily: 'JetBrains Mono, monospace', marginLeft: 6 }}>{u}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Scene ───────────────────────────────────────────────────────
const Scene = () => (
  <>
    <Background />
    <BrandMark />
    <StatusPill />
    <WalletPill />
    <CurvePanel />
    <Particles />
    <Flash />
    <GraduatedReveal />
  </>
);

ReactDOM.createRoot(document.getElementById('stage')).render(
  <Stage width={W} height={H} duration={6} background="#0A0908" autoplay loop>
    <Scene />
  </Stage>
);
