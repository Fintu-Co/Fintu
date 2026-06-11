import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

// ─── ASSETS ──────────────────────────────────────────────────────────────────
import imgCardsFan    from '../assets/images/cards-fan.jpg';
import imgCardFloat   from '../assets/images/card-floating.jpg';
import imgCardsTower  from '../assets/images/cards-tower.jpg';

// ─── FEATURE SVG ICONS ───────────────────────────────────────────────────────
const FeatIcCard = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2"/>
    <line x1="1" y1="10" x2="23" y2="10"/>
    <line x1="5" y1="15" x2="9" y2="15"/>
    <line x1="13" y1="15" x2="15" y2="15"/>
  </svg>
);
const FeatIcChart = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const FeatIcCal = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/>
    <line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8"  y1="2" x2="8"  y2="6"/>
    <line x1="3"  y1="10" x2="21" y2="10"/>
    <circle cx="8"  cy="15" r="1.2" fill={color} stroke="none"/>
    <circle cx="12" cy="15" r="1.2" fill={color} stroke="none"/>
    <circle cx="16" cy="15" r="1.2" fill={color} stroke="none"/>
  </svg>
);
const FeatIcPercent = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19"/>
    <circle cx="6.5"  cy="6.5"  r="2.5"/>
    <circle cx="17.5" cy="17.5" r="2.5"/>
  </svg>
);
const FeatIcTarget = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);
const FeatIcGauge = ({ color }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 0 1 7.39 16.76M12 2A10 10 0 0 0 4.61 18.76"/>
    <line x1="12" y1="12" x2="15.5" y2="8.5"/>
    <circle cx="12" cy="12" r="2" fill={color} stroke="none" opacity="0.7"/>
  </svg>
);

// ─── TRUST SVG ICONS ─────────────────────────────────────────────────────────
const TrustShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const TrustInfinity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="15" height="15">
    <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"/>
    <path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/>
  </svg>
);
const TrustPin = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);

// ─── DATA ────────────────────────────────────────────────────────────────────
const FEATURES = [
  { icon: FeatIcCard,    titulo: 'Hasta 4 tarjetas',     desc: 'Gestiona todas tus tarjetas en un solo dashboard premium.',      color: '#d4a574' },
  { icon: FeatIcChart,   titulo: 'Historial visual',      desc: 'Gráficos de gastos, pagos y evolución de deuda por período.',    color: '#06b6d4' },
  { icon: FeatIcCal,     titulo: 'Calendario de ciclos',  desc: 'Fechas de inicio, cierre y pago calculadas automáticamente.',    color: '#8b5cf6' },
  { icon: FeatIcPercent, titulo: 'Calculadora intereses', desc: 'Descubre cuánto pagas de más si solo abonas el mínimo.',         color: '#22c55e' },
  { icon: FeatIcTarget,  titulo: 'Metas financieras',     desc: 'Define objetivos de ahorro o reducción de deuda.',               color: '#f59e0b' },
  { icon: FeatIcGauge,   titulo: 'Score financiero',      desc: 'Evalúa en tiempo real la salud de tu crédito.',                  color: '#d4a574' },
];

const STEPS = [
  { num: '01', titulo: 'Crea tu cuenta',      desc: 'Regístrate y realiza el pago único de $4 vía PayPal en menos de 2 minutos.' },
  { num: '02', titulo: 'Agrega tus tarjetas', desc: 'Ingresa tu banco, línea de crédito y fechas de ciclo. Sin datos bancarios.' },
  { num: '03', titulo: 'Toma el control',     desc: 'Registra gastos, monitorea fechas críticas y mejora tus hábitos.' },
];

const FAQS = [
  { q: '¿Es seguro ingresar mis datos?',              a: 'Sí. No almacenamos datos bancarios ni números de tarjeta. Solo registras montos y fechas de ciclo.' },
  { q: '¿El pago de $4 es único o mensual?',          a: 'Es un pago único de por vida. Pagas una sola vez y accedes a todas las funciones para siempre.' },
  { q: '¿Funciona para todas las tarjetas peruanas?', a: 'Sí. Puedes agregar cualquier tarjeta de cualquier banco peruano.' },
  { q: '¿Qué pasa si olvido mi contraseña?',          a: 'Puedes recuperarla desde la pantalla de inicio ingresando tu email registrado.' },
];

const TESTIMONIALS = [
  { name: 'María G.',  city: 'Lima',     text: 'Finalmente entiendo mis intereses. En un mes ahorré S/200 evitando hacer solo el pago mínimo.', stars: 5, tag: 'Ahorro' },
  { name: 'Carlos R.', city: 'Arequipa', text: 'Tenía 3 tarjetas y vivía perdido. Ahora veo todo en un dashboard limpio. Vale cada centavo de los $4.', stars: 5, tag: 'Control' },
  { name: 'Ana P.',    city: 'Trujillo', text: 'El score financiero cambió mis hábitos. En dos meses pasé de zona roja a verde.', stars: 5, tag: 'Score' },
];

const MARQUEE_TEXT = [
  'CONTROLA TUS TARJETAS', 'CONOCE TUS INTERESES', 'MEJORA TU SCORE',
  'GESTIONA TU DEUDA', 'HECHO PARA PERÚ', 'ACCESO DE POR VIDA',
];

// ─── ICONS ───────────────────────────────────────────────────────────────────
function Arr() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
      <path d="M5 12h14M12 5l7 7-7 7"/>
    </svg>
  );
}

function StarIc() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" width="13" height="13">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>
  );
}

function CardLogoIc() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}

// ─── TILT HANDLERS ───────────────────────────────────────────────────────────
const onTiltMove = (e, maxDeg = 12) => {
  const el = e.currentTarget;
  const r  = el.getBoundingClientRect();
  const x  = ((e.clientX - r.left)  / r.width  - 0.5) * maxDeg * 2;
  const y  = ((e.clientY - r.top)   / r.height - 0.5) * -maxDeg * 2;
  el.style.transform = `perspective(700px) rotateX(${y}deg) rotateY(${x}deg) translateY(-4px)`;
};
const onTiltLeave = (e) => { e.currentTarget.style.transform = ''; };

// ─── HERO FLOATING WIDGETS ───────────────────────────────────────────────────
function HeroMetricCard() {
  return (
    <div className="lp-hero-metric">
      <div className="lp-hm-header">
        <div className="lp-hm-dot" />
        <span>Ahorro estimado</span>
      </div>
      <div className="lp-hm-value">S/ 340</div>
      <div className="lp-hm-label">vs. pago mínimo mensual</div>
      <div className="lp-hm-bar">
        <div className="lp-hm-fill" />
      </div>
      <div className="lp-hm-foot">
        <span className="lp-hm-stat">+S/28 este mes</span>
        <span className="lp-hm-up">↑ 12%</span>
      </div>
    </div>
  );
}

function HeroScoreBadge() {
  return (
    <div className="lp-hero-score">
      <div className="lp-hs-label">Score</div>
      <div className="lp-hs-number">82</div>
      <div className="lp-hs-status">Muy bueno</div>
    </div>
  );
}

// ─── 3D CREDIT CARD ──────────────────────────────────────────────────────────
function CreditCard3D() {
  const frontRef = useRef(null);
  const sceneRef = useRef(null);

  const handleMove = useCallback((e) => {
    const scene = sceneRef.current;
    const front = frontRef.current;
    if (!scene || !front) return;
    const r  = scene.getBoundingClientRect();
    const nx = (e.clientX - r.left) / r.width;
    const ny = (e.clientY - r.top)  / r.height;
    const rx = (ny - 0.5) * -26;
    const ry = (nx - 0.5) *  26;
    front.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
    const shine = front.querySelector('.lp-c1-shine');
    if (shine) {
      shine.style.background = `radial-gradient(ellipse at ${nx * 100}% ${ny * 100}%, rgba(255,255,255,0.22) 0%, transparent 68%)`;
    }
  }, []);

  const handleLeave = useCallback(() => {
    const front = frontRef.current;
    if (!front) return;
    front.style.transform = '';
    const shine = front.querySelector('.lp-c1-shine');
    if (shine) shine.style.background = '';
  }, []);

  return (
    <div className="lp-card3d-scene" ref={sceneRef}
      onMouseMove={handleMove} onMouseLeave={handleLeave}>
      <div className="lp-card3d lp-c3"><div className="lp-c3-stripe" /></div>
      <div className="lp-card3d lp-c2" />
      <div className="lp-card3d lp-c1" ref={frontRef}>
        <div className="lp-c1-top">
          <span className="lp-c1-bank">Fintú &amp; Co.</span>
          <span className="lp-c1-network">VISA</span>
        </div>
        <div className="lp-c1-chip">
          <div className="lp-chip-h" />
          <div className="lp-chip-h" />
          <div className="lp-chip-v" />
        </div>
        <div className="lp-c1-num">•••• &nbsp;•••• &nbsp;•••• &nbsp;4892</div>
        <div className="lp-c1-bottom">
          <div>
            <div className="lp-c1-lbl">TITULAR</div>
            <div className="lp-c1-val">CARLOS GARCÍA</div>
          </div>
          <div className="lp-c1-right">
            <div className="lp-c1-lbl">VENCE</div>
            <div className="lp-c1-val">12/28</div>
          </div>
        </div>
        <div className="lp-c1-shine" />
        <div className="lp-c1-glow" />
        <div className="lp-c1-topbar" />
      </div>
      <div className="lp-card3d-orb lp-orb-1" />
      <div className="lp-card3d-orb lp-orb-2" />
      <div className="lp-card3d-orb lp-orb-3" />
    </div>
  );
}

// ─── HERO BACKGROUND CANVAS ──────────────────────────────────────────────────
function HeroCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

    const PALETTE = [
      [212, 165, 116],  // gold
      [139,  92, 246],  // violet
      [  6, 182, 212],  // cyan
      [212, 165, 116],  // gold (heavier weight)
    ];

    const NODES = Array.from({ length: 65 }, () => ({
      x:     Math.random(),
      y:     Math.random(),
      vx:    (Math.random() - 0.5) * 0.00025,
      vy:    (Math.random() - 0.5) * 0.00025,
      size:  Math.random() * 1.8 + 0.8,
      col:   PALETTE[Math.floor(Math.random() * PALETTE.length)],
      phase: Math.random() * Math.PI * 2,
      op:    Math.random() * 0.35 + 0.15,
    }));

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    function draw() {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      // Draw connecting lines (gold only, very subtle)
      const maxD = Math.min(W, H) * 0.20;
      for (let i = 0; i < NODES.length; i++) {
        for (let j = i + 1; j < NODES.length; j++) {
          const a = NODES[i], b = NODES[j];
          const dx = (a.x - b.x) * W, dy = (a.y - b.y) * H;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < maxD) {
            ctx.beginPath();
            ctx.moveTo(a.x * W, a.y * H);
            ctx.lineTo(b.x * W, b.y * H);
            ctx.strokeStyle = `rgba(212,165,116,${(1 - d / maxD) * 0.10})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      // Draw nodes
      NODES.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.phase += 0.014;
        if (n.x < 0.02) n.vx =  Math.abs(n.vx);
        if (n.x > 0.98) n.vx = -Math.abs(n.vx);
        if (n.y < 0.02) n.vy =  Math.abs(n.vy);
        if (n.y > 0.98) n.vy = -Math.abs(n.vy);

        const px  = n.x * W, py = n.y * H;
        const sz  = n.size * (0.82 + 0.18 * Math.sin(n.phase));
        const al  = n.op   * (0.75 + 0.25 * Math.sin(n.phase + 1));
        const [r, g, b] = n.col;

        // Soft glow
        const grd = ctx.createRadialGradient(px, py, 0, px, py, sz * 10);
        grd.addColorStop(0,   `rgba(${r},${g},${b},${al * 0.55})`);
        grd.addColorStop(0.5, `rgba(${r},${g},${b},${al * 0.08})`);
        grd.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(px, py, sz * 10, 0, Math.PI * 2);
        ctx.fillStyle = grd; ctx.fill();

        // Core
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${al})`; ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="lp-hero-canvas" />;
}

// ─── CONSTELLATION CANVAS ────────────────────────────────────────────────────
function ConstellationCanvas() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    const NODES = Array.from({ length: 42 }, () => ({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.00022,
      vy: (Math.random() - 0.5) * 0.00022,
      size: Math.random() * 5 + 2.5,
      yellow: Math.random() > 0.65,
      phase: Math.random() * Math.PI * 2,
    }));
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width  = canvas.offsetWidth  * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    function draw() {
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      NODES.forEach(n => {
        n.x += n.vx; n.y += n.vy; n.phase += 0.022;
        if (n.x < 0.03) n.vx =  Math.abs(n.vx);
        if (n.x > 0.97) n.vx = -Math.abs(n.vx);
        if (n.y < 0.03) n.vy =  Math.abs(n.vy);
        if (n.y > 0.97) n.vy = -Math.abs(n.vy);
      });
      const maxD = Math.min(W, H) * 0.28;
      for (let i = 0; i < NODES.length; i++) {
        for (let j = i + 1; j < NODES.length; j++) {
          const a = NODES[i], b = NODES[j];
          const dx = (a.x - b.x) * W, dy = (a.y - b.y) * H;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < maxD) {
            ctx.beginPath();
            ctx.moveTo(a.x * W, a.y * H);
            ctx.lineTo(b.x * W, b.y * H);
            ctx.strokeStyle = `rgba(74,222,128,${(1 - dist / maxD) * 0.45})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }
      NODES.forEach(n => {
        const px = n.x * W, py = n.y * H;
        const sz  = n.size * (0.82 + 0.18 * Math.sin(n.phase));
        const col = n.yellow ? '218,195,48' : '52,218,82';
        const g = ctx.createRadialGradient(px, py, 0, px, py, sz * 5);
        g.addColorStop(0,   `rgba(${col},0.9)`);
        g.addColorStop(0.4, `rgba(${col},0.2)`);
        g.addColorStop(1,   'rgba(0,0,0,0)');
        ctx.beginPath(); ctx.arc(px, py, sz * 5, 0, Math.PI * 2);
        ctx.fillStyle = g; ctx.fill();
        ctx.beginPath(); ctx.arc(px, py, sz, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${col},1)`; ctx.fill();
      });
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, []);
  return <canvas ref={canvasRef} className="lp-constell-canvas" />;
}

// ─── INTERSECTION OBSERVER ───────────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      }),
      { threshold: 0.05, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ─── PARALLAX SCROLL ─────────────────────────────────────────────────────────
function useParallax() {
  useEffect(() => {
    let ticking = false;
    const update = () => {
      const scrollY = window.scrollY;
      const vh      = window.innerHeight;
      document.querySelectorAll('.lp-img-sec').forEach(sec => {
        const img = sec.querySelector('.lp-img-bg');
        if (!img) return;
        const rect = sec.getBoundingClientRect();
        if (rect.bottom < -80 || rect.top > vh + 80) return;
        const offset = Math.max(-vh * 0.20, Math.min(vh * 0.20, rect.top * 0.16));
        img.style.transform = `translateY(${offset}px)`;
      });
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function Landing() {
  const navigate    = useNavigate();
  const [openFaq,      setOpenFaq]      = useState(null);
  const [scene,        setScene]        = useState(0);
  const [scrolled,     setScrolled]     = useState(false);
  const [navScrolled,  setNavScrolled]  = useState(false);
  const [visibleFaqs,  setVisibleFaqs]  = useState(new Set());
  const spacerRef   = useRef(null);
  const sceneRef    = useRef(0);
  const cursorDot   = useRef(null);
  const cursorRing  = useRef(null);

  useReveal();
  useParallax();

  // ── Nav scroll state ──────────────────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ── Custom cursor ─────────────────────────────────────────────────────────
  useEffect(() => {
    const dot  = cursorDot.current;
    const ring = cursorRing.current;
    if (!dot || !ring) return;

    const move = (e) => {
      dot.style.left  = e.clientX + 'px';
      dot.style.top   = e.clientY + 'px';
      setTimeout(() => {
        ring.style.left = e.clientX + 'px';
        ring.style.top  = e.clientY + 'px';
      }, 80);
    };

    const grow = () => {
      dot.style.width  = '14px'; dot.style.height = '14px';
      ring.style.width = '50px'; ring.style.height = '50px';
    };
    const shrink = () => {
      dot.style.width  = '8px';  dot.style.height = '8px';
      ring.style.width = '36px'; ring.style.height = '36px';
    };

    document.addEventListener('mousemove', move);
    const hoverEls = document.querySelectorAll('a, button, .lp-feat-card, .lp-faq-item, .lp-testi-card');
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', grow);
      el.addEventListener('mouseleave', shrink);
    });

    return () => {
      document.removeEventListener('mousemove', move);
      hoverEls.forEach(el => {
        el.removeEventListener('mouseenter', grow);
        el.removeEventListener('mouseleave', shrink);
      });
    };
  }, []);

  // ── FAQ visibility ────────────────────────────────────────────────────────
  useEffect(() => {
    const items = document.querySelectorAll('[data-faq-idx]');
    if (!items.length) return;
    const io = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          const idx = parseInt(e.target.dataset.faqIdx, 10);
          setVisibleFaqs(prev => new Set([...prev, idx]));
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.05, rootMargin: '0px 0px -30px 0px' }
    );
    items.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  // ── Hero scene scroll ─────────────────────────────────────────────────────
  const onScroll = useCallback(() => {
    const el = spacerRef.current;
    if (!el) return;
    const rect       = el.getBoundingClientRect();
    const scrollable = el.offsetHeight - window.innerHeight;
    if (scrollable <= 0) return;
    const p = Math.max(0, Math.min(1, -rect.top / scrollable));
    const s = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
    if (s !== sceneRef.current) { sceneRef.current = s; setScene(s); }
    if (p > 0.01 && !scrolled) setScrolled(true);
  }, [scrolled]);

  useEffect(() => {
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [onScroll]);

  const SCENES = [
    { badge: 'Control total', t1: 'CONTROLA',  t2: 'TUS TARJETAS.',  sub: 'La herramienta peruana para gestionar, organizar y optimizar tus tarjetas de crédito.' },
    { badge: 'Sin sorpresas', t1: 'CONOCE',    t2: 'TUS INTERESES.', sub: 'Descubre cuánto pagas de más y toma decisiones financieras más inteligentes.' },
    { badge: 'Tu futuro',     t1: 'MEJORA',    t2: 'TU SCORE.',      sub: 'Evalúa tu salud financiera en tiempo real y construye hábitos saludables.' },
  ];

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="lp">

      {/* ─── CUSTOM CURSOR ─── */}
      <div className="lp-cursor-dot"  ref={cursorDot}  aria-hidden="true" />
      <div className="lp-cursor-ring" ref={cursorRing} aria-hidden="true" />

      {/* ─── AURORA ─── */}
      <div className="lp-aurora" aria-hidden="true">
        <div className="lp-aorb lp-aorb-1" />
        <div className="lp-aorb lp-aorb-2" />
        <div className="lp-aorb lp-aorb-3" />
        <div className="lp-aorb lp-aorb-4" />
      </div>

      {/* ─── NAV ─── */}
      <nav className={`lp-nav${navScrolled ? ' lp-nav--scrolled' : ''}`}>
        <div className="lp-nav-in">
          <div className="lp-logo">
            <div className="lp-logo-ico"><CardLogoIc /></div>
            <span>Fintú &amp; Co.</span>
          </div>
          <div className="lp-nav-links">
            <a href="#sec-features">Funciones</a>
            <a href="#sec-steps">Cómo funciona</a>
            <a href="#sec-pricing">Precio</a>
            <a href="#sec-faq">FAQ</a>
          </div>
          <div className="lp-nav-btns">
            <button className="btn-ghost" onClick={() => navigate('/login')}>Iniciar sesión</button>
            <button className="btn-gold"  onClick={() => navigate('/registro')}>Comenzar <Arr /></button>
          </div>
        </div>
      </nav>

      {/* ─── HERO (scroll-pinned) ─── */}
      <div className="lp-spacer" ref={spacerRef}>
        <div className="lp-sticky">
          <div className="lp-hero-bg">
            <HeroCanvas />
            <div className="lp-hero-bg-ov" />
          </div>
          <div className="lp-hero-in">
            <div className="lp-hero-left hero-anim">
              <div className="lp-scenes">
                {SCENES.map((s, i) => (
                  <div key={i} className={`lp-scene ${scene === i ? 'on' : ''}`}>
                    <div className="lp-badge"><span className="lp-pulse" />{s.badge}</div>
                    <h1 className="lp-title">
                      {s.t1}<br />
                      <span className="lp-gold">{s.t2}</span>
                    </h1>
                    <p className="lp-sub">{s.sub}</p>
                  </div>
                ))}
              </div>
              <div className="lp-cta">
                <button className="btn-gold btn-hero" onClick={() => navigate('/registro')}>
                  Acceder por $4 USD <Arr />
                </button>
                <button className="btn-outline" onClick={() => navigate('/login')}>
                  Ya tengo cuenta
                </button>
              </div>
              <div className="lp-trust">
                <span className="lp-trust-item"><TrustShield />Sin datos bancarios</span>
                <i />
                <span className="lp-trust-item"><TrustInfinity />Acceso de por vida</span>
                <i />
                <span className="lp-trust-item"><TrustPin />Hecho para Perú</span>
              </div>
            </div>
            <div className="lp-hero-right hero-anim" style={{ animationDelay: '0.7s' }}>
              <div className="lp-card-zone">
                <CreditCard3D />
                <HeroMetricCard />
                <HeroScoreBadge />
              </div>
            </div>
          </div>
          <div className="lp-dots">
            {SCENES.map((_, i) => (
              <div key={i} className={`lp-dot ${scene === i ? 'on' : ''}`} />
            ))}
          </div>
          <div className={`lp-scroll-ind ${scrolled ? 'hide' : ''}`}>
            <div className="lp-scroll-line" />
            <span>scroll</span>
          </div>
          <div className="lp-stats hero-anim" style={{ animationDelay: '1.1s' }}>
            <div className="lp-stat"><span className="n">4</span><span className="l">Tarjetas</span></div>
            <div className="lp-stat-div" />
            <div className="lp-stat"><span className="n">$4</span><span className="l">Pago único</span></div>
            <div className="lp-stat-div" />
            <div className="lp-stat"><span className="n">100%</span><span className="l">Para Perú</span></div>
          </div>
        </div>
      </div>

      {/* ─── IMG SEC 1 — Fan ─── */}
      <section id="sec-fan" className="lp-img-sec">
        <div className="lp-img-bg-wrap">
          <img src={imgCardsFan} alt="" className="lp-img-bg" />
          <div className="lp-img-ov lp-ov-left" />
        </div>
        <div className="lp-img-body lp-body-left">
          <div className="lp-sec-label reveal">Premium</div>
          <h2 className="lp-img-title reveal delay-1">TODAS TUS<br /><span>TARJETAS.</span></h2>
          <p className="lp-img-sub reveal delay-2">Gestiona hasta 4 tarjetas en un solo lugar, sin importar el banco y sin ingresar datos sensibles.</p>
          <button className="btn-gold btn-sec reveal delay-3" onClick={() => navigate('/registro')}>Agregar mis tarjetas <Arr /></button>
        </div>
      </section>

      {/* ─── IMG SEC 2 — Floating card ─── */}
      <section id="sec-float" className="lp-img-sec">
        <div className="lp-img-bg-wrap">
          <img src={imgCardFloat} alt="" className="lp-img-bg" />
          <div className="lp-img-ov lp-ov-right" />
        </div>
        <div className="lp-img-body lp-body-right">
          <div className="lp-sec-label reveal">Sin límites</div>
          <h2 className="lp-img-title reveal delay-1">TOMA EL<br /><span>CONTROL.</span></h2>
          <p className="lp-img-sub reveal delay-2">Cada fecha de corte, cada interés, cada deuda — organizada con precisión absoluta.</p>
          <button className="btn-gold btn-sec reveal delay-3" onClick={() => navigate('/registro')}>Empezar ahora <Arr /></button>
        </div>
      </section>

      {/* ─── IMG SEC 3 — Tower ─── */}
      <section id="sec-tower" className="lp-img-sec">
        <div className="lp-img-bg-wrap">
          <img src={imgCardsTower} alt="" className="lp-img-bg" />
          <div className="lp-img-ov lp-ov-left" />
        </div>
        <div className="lp-img-body lp-body-left">
          <div className="lp-sec-label reveal">Tu futuro</div>
          <h2 className="lp-img-title reveal delay-1">MEJORA TU<br /><span>SCORE.</span></h2>
          <p className="lp-img-sub reveal delay-2">Evalúa tu salud financiera en tiempo real y construye hábitos que te lleven más lejos.</p>
          <button className="btn-outline btn-sec reveal delay-3" onClick={() => navigate('/registro')}>Ver mi score</button>
        </div>
      </section>

      {/* ─── MARQUEE TICKER ─── */}
      <div className="lp-marquee" aria-hidden="true">
        <div className="lp-marquee-track">
          {[...MARQUEE_TEXT, ...MARQUEE_TEXT].map((item, i) => (
            <span key={i} className="lp-marquee-item">
              <span className="lp-marquee-gem" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ─── FEATURES ─── */}
      <section id="sec-features" className="lp-std-sec">
        <div className="lp-std-head reveal">
          <div className="lp-sec-label">Funciones</div>
          <h2 className="lp-sec-title">Todo lo que incluye</h2>
          <p className="lp-sec-sub">Un ecosistema completo para el manejo inteligente de tus tarjetas.</p>
        </div>
        <div className="lp-feat-grid">
          {FEATURES.map((f, i) => (
            <div
              className="lp-feat-card reveal"
              key={i}
              style={{ '--acc': f.color, transitionDelay: `${i * 0.08}s` }}
              onMouseMove={(e) => onTiltMove(e, 8)}
              onMouseLeave={onTiltLeave}
            >
              <div className="lp-feat-ico"><f.icon color={f.color} /></div>
              <h3>{f.titulo}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── STEPS ─── */}
      <section id="sec-steps" className="lp-std-sec">
        <div className="lp-std-head reveal">
          <div className="lp-sec-label">Proceso</div>
          <h2 className="lp-sec-title">Tres pasos para empezar</h2>
        </div>
        <div className="lp-steps-grid">
          {STEPS.map((s, i) => (
            <div className="lp-step reveal" key={s.num} style={{ transitionDelay: `${i * 0.13}s` }}>
              <div className="lp-step-num">{s.num}</div>
              <div className="lp-step-bar" />
              <h3>{s.titulo}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section id="sec-testimonials" className="lp-std-sec lp-testi-sec">
        <div className="lp-std-head reveal">
          <div className="lp-sec-label">Testimonios</div>
          <h2 className="lp-sec-title">Lo que dicen nuestros usuarios</h2>
          <p className="lp-sec-sub">Peruanos que ya tomaron el control de sus finanzas.</p>
        </div>
        <div className="lp-testi-grid">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className="lp-testi-card reveal"
              style={{ transitionDelay: `${i * 0.12}s` }}
              onMouseMove={(e) => onTiltMove(e, 6)}
              onMouseLeave={onTiltLeave}
            >
              <div className="lp-testi-top">
                <div className="lp-testi-stars">
                  {Array.from({ length: t.stars }).map((_, j) => <StarIc key={j} />)}
                </div>
                <span className="lp-testi-tag">{t.tag}</span>
              </div>
              <p className="lp-testi-text">"{t.text}"</p>
              <div className="lp-testi-author">
                <div className="lp-testi-avatar">{t.name[0]}</div>
                <div>
                  <div className="lp-testi-name">{t.name}</div>
                  <div className="lp-testi-city">{t.city}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="sec-pricing" className="lp-pricing-sec">
        <div className="lp-pricing-glow" />
        <div className="lp-std-head reveal">
          <div className="lp-sec-label">Precio</div>
          <h2 className="lp-sec-title">Un pago. Para siempre.</h2>
        </div>
        <div
          className="lp-price-card reveal"
          onMouseMove={(e) => onTiltMove(e, 6)}
          onMouseLeave={onTiltLeave}
        >
          <div className="lp-price-topbar" />
          <div className="lp-price-badge">Acceso completo</div>
          <div className="lp-price-amount">
            <span className="curr">$</span>
            <span className="num">4</span>
            <div className="meta"><span>USD</span><span>pago único</span></div>
          </div>
          <p className="lp-price-tag">Paga una vez. Usa para siempre.</p>
          <ul className="lp-price-list">
            {['Todas las funciones incluidas','Hasta 4 tarjetas simultáneas','Actualizaciones futuras sin costo','Sin publicidad ni suscripciones','Soporte personalizado incluido','Sin datos bancarios requeridos'].map((t, i) => (
              <li key={i}><span className="lp-check">✓</span>{t}</li>
            ))}
          </ul>
          <div className="lp-price-guarantee">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
            Acceso garantizado de por vida — sin sorpresas
          </div>
          <button className="btn-gold btn-full" onClick={() => navigate('/registro')}>
            Crear mi cuenta ahora <Arr />
          </button>
          <div className="lp-price-paypal">
            <span>Pago seguro vía</span>
            <span className="lp-paypal-logo">
              <span className="p1">Pay</span><span className="p2">Pal</span>
            </span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12" style={{ opacity: 0.55 }}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <p className="lp-price-login">¿Ya tienes cuenta? <span onClick={() => navigate('/login')}>Inicia sesión</span></p>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="sec-faq" className="lp-std-sec lp-faq-sec">
        <div className="lp-std-head reveal">
          <div className="lp-sec-label">FAQ</div>
          <h2 className="lp-sec-title">Preguntas frecuentes</h2>
        </div>
        <div className="lp-faq-list">
          {FAQS.map((f, i) => (
            <div
              className={`lp-faq-item ${visibleFaqs.has(i) ? 'faq-visible' : 'faq-hidden'} ${openFaq === i ? 'open' : ''}`}
              key={i}
              data-faq-idx={i}
              style={{ transitionDelay: `${i * 0.07}s` }}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className="lp-faq-q"><span>{f.q}</span><span className="lp-faq-arr">›</span></div>
              <div className="lp-faq-a"><p>{f.a}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER — 4 columnas ─── */}
      <footer className="lp-footer">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <div className="lp-logo lp-footer-logo">
              <div className="lp-logo-ico"><CardLogoIc /></div>
              <span>Fintú &amp; Co.</span>
            </div>
            <p className="lp-footer-tagline">
              La herramienta peruana para gestionar, organizar y optimizar tus tarjetas de crédito. Sin bancos, sin sorpresas.
            </p>
          </div>
          <div className="lp-footer-col">
            <h4>Producto</h4>
            <ul>
              <li onClick={() => navigate('/registro')}>Crear cuenta</li>
              <li onClick={() => navigate('/login')}>Iniciar sesión</li>
              <li onClick={() => scrollTo('sec-pricing')}>Ver precio</li>
              <li onClick={() => scrollTo('sec-faq')}>Preguntas frecuentes</li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Funciones</h4>
            <ul>
              <li>Hasta 4 tarjetas</li>
              <li>Historial visual</li>
              <li>Calculadora de intereses</li>
              <li>Score financiero</li>
              <li>Metas de ahorro</li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Contacto</h4>
            <ul>
              <li>soporte@fintu.pe</li>
              <li>WhatsApp</li>
              <li>Instagram</li>
              <li>Facebook</li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-trust">
          <div className="lp-ft-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
            Sin datos bancarios
          </div>
          <div className="lp-ft-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <rect x="3" y="11" width="18" height="11" rx="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
            Pago seguro PayPal
          </div>
          <div className="lp-ft-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <path d="M12 12c-2-2.5-4-4-6-4a4 4 0 0 0 0 8c2 0 4-1.5 6-4z"/>
              <path d="M12 12c2 2.5 4 4 6 4a4 4 0 0 0 0-8c-2 0-4 1.5-6 4z"/>
            </svg>
            Acceso de por vida
          </div>
          <div className="lp-ft-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Hecho para Perú
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p className="lp-footer-copy">© 2025 Fintú &amp; Co. PE. Todos los derechos reservados.</p>
          <div className="lp-footer-social">
            <span>Instagram</span>
            <span>WhatsApp</span>
            <span>Facebook</span>
          </div>
        </div>
      </footer>

      {/* ─── MOBILE STICKY CTA ─── */}
      <div className="lp-mobile-cta" aria-label="Acción rápida">
        <div className="lp-mobile-cta-in">
          <div className="lp-mca-left">
            <span className="lp-mca-label">Acceso de por vida</span>
            <span className="lp-mca-price">Solo <strong>$4 USD</strong> — pago único</span>
          </div>
          <button className="lp-mca-btn" onClick={() => navigate('/registro')}>
            Empezar <Arr />
          </button>
        </div>
      </div>

    </div>
  );
}
