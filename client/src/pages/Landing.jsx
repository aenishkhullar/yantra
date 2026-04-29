import React, { useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart2, Wallet, TrendingUp, Zap } from 'lucide-react';

// --- BorderGlow Helper Functions ---
function parseHSL(hslStr) {
  const match = hslStr.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/);
  if (!match) return { h: 40, s: 80, l: 80 };
  return { h: parseFloat(match[1]), s: parseFloat(match[2]), l: parseFloat(match[3]) };
}

function buildGlowVars(glowColor, intensity) {
  const { h, s, l } = parseHSL(glowColor);
  const base = `${h}deg ${s}% ${l}%`;
  const opacities = [100, 60, 50, 40, 30, 20, 10];
  const keys = ['', '-60', '-50', '-40', '-30', '-20', '-10'];
  const vars = {};
  for (let i = 0; i < opacities.length; i++) {
    vars[`--glow-color${keys[i]}`] = `hsl(${base} / ${Math.min(opacities[i] * intensity, 100)}%)`;
  }
  return vars;
}

const GRADIENT_POSITIONS = ['80% 55%', '69% 34%', '8% 6%', '41% 38%', '86% 85%', '82% 18%', '51% 4%'];
const GRADIENT_KEYS = ['--gradient-one', '--gradient-two', '--gradient-three', '--gradient-four', '--gradient-five', '--gradient-six', '--gradient-seven'];
const COLOR_MAP = [0, 1, 2, 0, 1, 2, 1];

function buildGradientVars(colors) {
  const vars = {};
  for (let i = 0; i < 7; i++) {
    const c = colors[Math.min(COLOR_MAP[i], colors.length - 1)];
    vars[GRADIENT_KEYS[i]] = `radial-gradient(at ${GRADIENT_POSITIONS[i]}, ${c} 0px, transparent 50%)`;
  }
  vars['--gradient-base'] = `linear-gradient(${colors[0]} 0 100%)`;
  return vars;
}

function easeOutCubic(x) { return 1 - Math.pow(1 - x, 3); }
function easeInCubic(x) { return x * x * x; }

function animateValue({ start = 0, end = 100, duration = 1000, delay = 0, ease = easeOutCubic, onUpdate, onEnd }) {
  const t0 = performance.now() + delay;
  function tick() {
    const elapsed = performance.now() - t0;
    const t = Math.min(elapsed / duration, 1);
    onUpdate(start + (end - start) * ease(t));
    if (t < 1) requestAnimationFrame(tick);
    else if (onEnd) onEnd();
  }
  setTimeout(() => requestAnimationFrame(tick), delay);
}

const BorderGlow = ({
  children,
  className = '',
  edgeSensitivity = 30,
  glowColor = '40 80 80',
  backgroundColor = '#000000',
  borderRadius = 24,
  glowRadius = 40,
  glowIntensity = 3.0,
  coneSpread = 25,
  animated = false,
  colors = ['#FF801F', '#3B9EFF', '#A1A4A5'],
  fillOpacity = 0.1,
}) => {
  const cardRef = useRef(null);

  const getCenterOfElement = useCallback((el) => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }, []);

  const getEdgeProximity = useCallback((el, x, y) => {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    let kx = Infinity;
    let ky = Infinity;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (absDx !== 0) kx = cx / absDx;
    if (absDy !== 0) ky = cy / absDy;
    return Math.min(1, Math.max(0, 1 / Math.min(kx, ky)));
  }, [getCenterOfElement]);

  const getCursorAngle = useCallback((el, x, y) => {
    const [cx, cy] = getCenterOfElement(el);
    const dx = x - cx;
    const dy = y - cy;
    if (dx === 0 && dy === 0) return 0;
    const radians = Math.atan2(dy, dx);
    let degrees = radians * (180 / Math.PI) + 90;
    if (degrees < 0) degrees += 360;
    return degrees;
  }, [getCenterOfElement]);

  const handlePointerMove = useCallback((e) => {
    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const edge = getEdgeProximity(card, x, y);
    const angle = getCursorAngle(card, x, y);

    card.style.setProperty('--edge-proximity', `${(edge * 100).toFixed(3)}`);
    card.style.setProperty('--cursor-angle', `${angle.toFixed(3)}deg`);
  }, [getEdgeProximity, getCursorAngle]);

  const handlePointerLeave = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.style.setProperty('--edge-proximity', '0');
  }, []);

  useEffect(() => {
    if (!animated || !cardRef.current) return;
    const card = cardRef.current;
    const angleStart = 110;
    const angleEnd = 465;
    card.classList.add('sweep-active');
    card.style.setProperty('--cursor-angle', `${angleStart}deg`);

    animateValue({ duration: 500, onUpdate: v => card.style.setProperty('--edge-proximity', v) });
    animateValue({ ease: easeInCubic, duration: 1500, end: 50, onUpdate: v => {
      card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
    }});
    animateValue({ ease: easeOutCubic, delay: 1500, duration: 2250, start: 50, end: 100, onUpdate: v => {
      card.style.setProperty('--cursor-angle', `${(angleEnd - angleStart) * (v / 100) + angleStart}deg`);
    }});
    animateValue({ ease: easeInCubic, delay: 2500, duration: 1500, start: 100, end: 0,
      onUpdate: v => card.style.setProperty('--edge-proximity', v),
      onEnd: () => card.classList.remove('sweep-active'),
    });
  }, [animated]);

  const glowVars = buildGlowVars(glowColor, glowIntensity);

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className={`border-glow-card ${className}`}
      style={{
        '--card-bg': backgroundColor,
        '--edge-sensitivity': edgeSensitivity,
        '--border-radius': `${borderRadius}px`,
        '--glow-padding': `${glowRadius}px`,
        '--cone-spread': `${coneSpread}deg`,
        '--fill-opacity': fillOpacity,
        '--cursor-angle': '0deg',
        '--edge-proximity': '0',
        ...glowVars,
        ...buildGradientVars(colors),
      }}
    >
      <div className="edge-light" />
      <div className="border-glow-inner">
        {children}
      </div>
    </div>
  );
};

const tickerItems = [
  { sym: 'AAPL', price: '$267.61', change: '↑1.2%', pos: true },
  { sym: 'MSFT', price: '$424.82', change: '↑0.05%', pos: true },
  { sym: 'TSLA', price: '$378.67', change: '↑0.63%', pos: true },
  { sym: 'NVDA', price: '$216.61', change: '↑4.00%', pos: true },
  { sym: 'GOOGL', price: '$350.34', change: '↑1.72%', pos: true },
  { sym: 'META', price: '$678.62', change: '↑0.53%', pos: true },
  { sym: 'AMZN', price: '$261.12', change: '↓1.09%', pos: false },
  { sym: 'NFLX', price: '$91.37', change: '↓1.16%', pos: false },
  { sym: 'AMD', price: '$164.23', change: '↑2.1%', pos: true },
  { sym: 'UBER', price: '$82.45', change: '↑0.8%', pos: true }
];

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#f0f0f0', fontFamily: "'Inter', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Commit+Mono&family=Inter:wght@400;500;600;700;800&display=swap');

        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }

        html {
          scroll-behavior: smooth;
        }

        body {
          background-color: #000000;
        }

        @keyframes fadeUp {
          from { 
            opacity: 0; 
            transform: translateY(16px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }

        .fade-up {
          animation: fadeUp 500ms ease-out both;
        }

        .frost-border {
          border: 1px solid rgba(214, 235, 253, 0.19);
        }

        .nav-link {
          font-size: 13px;
          font-weight: 400;
          color: #a1a4a5;
          text-decoration: none;
          transition: color 0.15s ease;
          cursor: pointer;
        }

        .nav-link:hover {
          color: #f0f0f0;
        }

        .primary-btn {
          background-color: #ffffff;
          color: #000000;
          border-radius: 9999px;
          padding: 12px 28px;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: opacity 0.2s;
        }

        .primary-btn:hover {
          opacity: 0.9;
        }

        .secondary-btn {
          background-color: transparent;
          border: 1px solid rgba(214, 235, 253, 0.19);
          color: #f0f0f0;
          border-radius: 9999px;
          padding: 12px 28px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .secondary-btn:hover {
          background-color: rgba(214, 235, 253, 0.05);
        }

        .cta-btn-sm {
          padding: 7px 18px;
          font-size: 13px;
        }

        .orange-btn {
          background-color: #ff801f;
          color: #000000;
          border-radius: 9999px;
          padding: 7px 18px;
          font-size: 13px;
          font-weight: 600;
          border: none;
          cursor: pointer;
        }

        /* --- Border Glow Styles --- */
        .border-glow-card {
          position: relative;
          border-radius: var(--border-radius);
          background: var(--card-bg);
          overflow: hidden;
          transition: transform 0.2s ease, border-color 0.2s ease;
          border: 2px solid rgba(214, 235, 253, 0.19);
        }

        .border-glow-card:hover {
          transform: translateY(-2px);
          border-color: rgba(214, 235, 253, 0.35);
        }

        .border-glow-inner {
          position: relative;
          z-index: 2;
          background: var(--card-bg);
          margin: 1px;
          border-radius: calc(var(--border-radius) - 1px);
          height: calc(100% - 2px);
          width: calc(100% - 2px);
        }

        .edge-light {
          position: absolute;
          inset: -2px;
          z-index: 1;
          pointer-events: none;
          background: conic-gradient(
            from var(--cursor-angle) at 50% 50%,
            transparent 0deg,
            var(--glow-color) calc(180deg - var(--cone-spread)),
            var(--glow-color) 180deg,
            var(--glow-color) calc(180deg + var(--cone-spread)),
            transparent 360deg
          );
          opacity: calc(var(--edge-proximity) / 100);
          transition: opacity 0.3s ease;
          border-radius: var(--border-radius);
        }

        .border-glow-card::before {
          content: '';
          position: absolute;
          inset: 0;
          z-index: 0;
          background: var(--gradient-base);
          opacity: 0.1;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          background-color: transparent;
        }

        .feature-card {
          background-color: #000000;
          padding: 32px 28px;
          height: 100%;
          border-radius: inherit;
        }

        .icon-container {
          width: 36px;
          height: 36px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }

        .step-connector {
          position: absolute;
          top: 20px;
          left: calc(16.66% + 20px);
          right: calc(16.66% + 20px);
          height: 1px;
          background-color: rgba(214, 235, 253, 0.19);
          z-index: 0;
        }

        .number-circle {
          width: 40px;
          height: 40px;
          border-radius: 9999px;
          background-color: #000000;
          border: 1px solid rgba(214, 235, 253, 0.19);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 20px;
          transition: box-shadow 0.2s ease;
        }

        .number-circle:hover {
          box-shadow: 0 0 12px rgba(59,158,255,0.15);
        }

        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }

        .ticker-strip {
          margin-top: 48px;
          overflow: hidden;
          width: 100%;
        }

        .ticker-inner {
          display: flex;
          gap: 32px;
          white-space: nowrap;
          animation: ticker 30s linear infinite;
        }

        .ticker-item {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid rgba(214, 235, 253, 0.19);
          background: rgba(255, 255, 255, 0.02);
        }

        @media (max-width: 768px) {
          .nav-links-center {
            display: none !important;
          }
          
          .hero-section {
            padding: 80px 24px 60px !important;
          }

          .hero-headline {
            font-size: 42px !important;
          }

          .feature-grid {
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .how-it-works-steps {
            flex-direction: column !important;
            gap: 40px !important;
          }

          .step-connector {
            display: none;
          }

          .section-padding {
            padding-left: 24px !important;
            padding-right: 24px !important;
          }
        }
      `}</style>

      {/* SECTION 1 — NAVBAR */}
      <nav style={{
        width: '100%',
        height: '56px',
        padding: '0 48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(214, 235, 253, 0.19)'
      }} className="section-padding">
        {/* Left — Logo */}
        <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <span style={{ 
            fontSize: '18px', 
            fontWeight: 700, 
            color: '#f0f0f0', 
            letterSpacing: '-0.5px' 
          }}>yantra</span>
        </div>

        {/* Center — Nav links */}
        <div className="nav-links-center" style={{ display: 'flex', gap: '32px' }}>
          <span className="nav-link">Home</span>
          <span className="nav-link">About</span>
          <span className="nav-link">Contact</span>
        </div>

        {/* Right — CTAs */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="primary-btn cta-btn-sm" 
            onClick={() => navigate('/register')}
          >
            Get Started
          </button>
          <button 
            className="secondary-btn cta-btn-sm" 
            onClick={() => navigate('/login')}
          >
            Login
          </button>
        </div>
      </nav>

      {/* SECTION 2 — HERO */}
      <section className="hero-section section-padding" style={{
        padding: '120px 48px 100px',
        textAlign: 'center',
        backgroundColor: '#000000',
        position: 'relative'
      }}>
        {/* Glow behind headline */}
        <div style={{
          position: 'absolute',
          width: '600px',
          height: '400px',
          borderRadius: '9999px',
          background: 'radial-gradient(circle, rgba(59,158,255,0.06) 0%, transparent 70%)',
          zIndex: 0,
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none'
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 className="hero-headline fade-up" style={{
            fontSize: '72px',
            fontWeight: 800,
            color: '#f0f0f0',
            lineHeight: 1.05,
            letterSpacing: '-2px',
            maxWidth: '800px',
            margin: '0 auto',
            animationDelay: '0ms'
          }}>
            Trade without the risk.
          </h1>
          <p className="fade-up" style={{
            fontSize: '18px',
            fontWeight: 400,
            color: '#a1a4a5',
            lineHeight: 1.5,
            maxWidth: '480px',
            margin: '20px auto 0',
            animationDelay: '100ms'
          }}>
            A real-market simulator. Virtual capital. Zero consequences.
          </p>
          <div className="fade-up" style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: '40px',
            animationDelay: '200ms'
          }}>
            <button className="primary-btn" style={{ backgroundColor: '#FF801F' }} onClick={() => navigate('/register')}>Connect Wallet</button>
            <button className="secondary-btn" onClick={() => navigate('/register')}>Place Trade</button>
          </div>
        </div>

        {/* Ticker Strip */}
        <div className="ticker-strip">
          <div className="ticker-inner">
            {[...tickerItems, ...tickerItems].map((item, i) => (
              <div key={i} className="ticker-item">
                <span style={{ fontFamily: 'Inter', fontSize: '12px', color: '#464a4d' }}>{item.sym}</span>
                <span style={{ fontFamily: "'Commit Mono', monospace", fontSize: '12px', color: '#a1a4a5' }}>{item.price}</span>
                <span style={{ fontFamily: "'Commit Mono', monospace", fontSize: '12px', color: item.pos ? '#11ff99' : '#ff2047' }}>{item.change}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3 — FEATURE CARDS */}
      <section className="section-padding" style={{ padding: '80px 48px' }}>
        <div className="feature-grid">
          {[
            {
              title: 'Live Market Data',
              desc: 'Experience real-time price feeds and order book depth exactly as they appear in live trading environments.',
              icon: <BarChart2 size={18} color="#ff801f" />,
              bg: 'rgba(255,128,31,0.15)',
              glow: '24 100 56',
              delay: 300
            },
            {
              title: 'INR 1 Lakh Virtual Capital',
              desc: 'Start with a substantial simulated portfolio to test complex strategies across multiple asset classes.',
              icon: <Wallet size={18} color="#ff801f" />,
              bg: 'rgba(255,128,31,0.15)',
              glow: '24 100 56',
              delay: 350
            },
            {
              title: 'Performance Analytics',
              desc: 'Detailed post-trade analysis and P&L tracking to refine your edge before committing real funds.',
              icon: <TrendingUp size={18} color="#3b9eff" />,
              bg: 'rgba(59,158,255,0.15)',
              glow: '210 100 62',
              delay: 400
            },
            {
              title: 'Low Latency Execution',
              desc: 'Simulated matching engine mimics the speed and slippage of high-performance institutional platforms.',
              icon: <Zap size={18} color="#11ff99" />,
              bg: 'rgba(17,255,153,0.15)',
              glow: '154 100 53',
              delay: 450
            }
          ].map((feature, i) => (
            <div key={i} className="fade-up" style={{ animationDelay: `${feature.delay}ms` }}>
              <BorderGlow glowColor={feature.glow} animated={true}>
                <div className="feature-card">
                  <div className="icon-container" style={{ backgroundColor: feature.bg }}>
                    {feature.icon}
                  </div>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#f0f0f0', marginBottom: '10px' }}>
                    {feature.title}
                  </h3>
                  <p style={{ fontSize: '14px', fontWeight: 400, color: '#a1a4a5', lineHeight: 1.6 }}>
                    {feature.desc}
                  </p>
                </div>
              </BorderGlow>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 3.5 — STATS */}
      <section className="section-padding" style={{
        padding: '80px 48px',
        textAlign: 'center',
        backgroundColor: 'rgba(255,255,255,0.01)',
        borderTop: '1px solid rgba(214, 235, 253, 0.19)',
        borderBottom: '1px solid rgba(214, 235, 253, 0.19)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '80px', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontFamily: 'Inter', fontSize: '48px', fontWeight: 700, color: '#f0f0f0', letterSpacing: '-2px' }}>$100,000</div>
            <div style={{ fontFamily: 'Inter', fontSize: '14px', color: '#a1a4a5', marginTop: '8px' }}>Starting virtual capital</div>
          </div>
          <div>
            <div style={{ fontFamily: 'Inter', fontSize: '48px', fontWeight: 700, color: '#f0f0f0', letterSpacing: '-2px' }}>15+</div>
            <div style={{ fontFamily: 'Inter', fontSize: '14px', color: '#a1a4a5', marginTop: '8px' }}>Stocks to trade</div>
          </div>
          <div>
            <div style={{ fontFamily: 'Inter', fontSize: '48px', fontWeight: 700, color: '#f0f0f0', letterSpacing: '-2px' }}>Real-time</div>
            <div style={{ fontFamily: 'Inter', fontSize: '14px', color: '#a1a4a5', marginTop: '8px' }}>Live market prices</div>
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS */}
      <section className="section-padding" style={{ padding: '100px 48px', textAlign: 'center', position: 'relative' }}>
        <h2 style={{
          fontSize: '48px',
          fontWeight: 700,
          color: '#f0f0f0',
          letterSpacing: '-1.5px',
          marginBottom: '64px'
        }}>
          How it works
        </h2>

        <div className="how-it-works-steps" style={{ display: 'flex', position: 'relative' }}>
          <div className="step-connector"></div>
          {[
            {
              id: '01',
              title: 'Create Account',
              desc: 'Sign up instantly and receive your initial virtual funding balance.'
            },
            {
              id: '02',
              title: 'Execute Strategies',
              desc: 'Place limit, market, and stop orders using the Yantra Terminal interface.'
            },
            {
              id: '03',
              title: 'Analyze Results',
              desc: 'Review comprehensive trade history and risk metrics to improve performance.'
            }
          ].map((step, i) => (
            <div key={i} style={{ flex: 1, position: 'relative', zIndex: 1 }}>
              <div style={{ 
                fontSize: '10px', 
                color: '#464a4d', 
                textTransform: 'uppercase', 
                letterSpacing: '0.14em', 
                marginBottom: '8px' 
              }}>
                {step.id}
              </div>
              <div className="number-circle">
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#a1a4a5' }}>
                  {i + 1}
                </span>
              </div>
              <h4 style={{ fontSize: '16px', fontWeight: 600, color: '#f0f0f0', marginBottom: '8px' }}>
                {step.title}
              </h4>
              <p style={{ 
                fontSize: '14px', 
                color: '#a1a4a5', 
                lineHeight: 1.6, 
                maxWidth: '200px', 
                margin: '0 auto' 
              }}>
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5 — FOOTER */}
      <footer className="section-padding" style={{
        padding: '32px 48px',
        borderTop: '1px solid rgba(214, 235, 253, 0.19)',
        backgroundColor: '#000000'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '18px', fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.5px' }}>yantra</span>
            <span style={{ fontSize: '13px', color: '#464a4d', fontFamily: 'Inter' }}>यंत्र</span>
          </div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <span className="nav-link" style={{ fontSize: '12px' }}>Privacy Policy</span>
            <span className="nav-link" style={{ fontSize: '12px' }}>Terms of Service</span>
            <span className="nav-link" style={{ fontSize: '12px' }}>Contact</span>
          </div>
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          fontSize: '11px',
          color: '#464a4d',
          textAlign: 'center'
        }}>
          © 2025 Yantra. For educational purposes only. Not financial advice.
        </div>
      </footer>
    </div>
  );
};

export default Landing;