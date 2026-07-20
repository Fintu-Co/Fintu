import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Landing.css';

import BrandLogo from '@/shared/components/BrandLogo';
import imgCardsFan from '@/assets/images/cards-fan.jpg';

/* ════════════════════════════════════════════════════════════
   INTRO — saludo multiidioma estilo Apple
   Navy + gold, se reproduce 1 vez por sesión, clic para saltar.
════════════════════════════════════════════════════════════ */
const GREETINGS = [
  'Hola',
  'Hello',
  'Bonjour',
  'Olá',
  'Ciao',
  'Hallo',
  '안녕하세요',
  'こんにちは',
  'Hola.',
];

function IntroGreeting({ onDone }) {
  const [idx, setIdx] = useState(0);
  const [leaving, setLeaving] = useState(false);

  // Avance de palabras: la primera respira más, las demás van rápido,
  // la última ("Hola.") se queda un momento antes de salir.
  useEffect(() => {
    if (leaving) return;
    if (idx < GREETINGS.length - 1) {
      const t = setTimeout(() => setIdx((i) => i + 1), idx === 0 ? 820 : 340);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setLeaving(true), 1050);
    return () => clearTimeout(t);
  }, [idx, leaving]);

  // Cuando termina la animación de salida, desmontar
  useEffect(() => {
    if (!leaving) return;
    const t = setTimeout(onDone, 880);
    return () => clearTimeout(t);
  }, [leaving, onDone]);

  return (
    <div
      className={`lp-intro${leaving ? ' lp-intro--leave' : ''}`}
      onClick={() => setLeaving(true)}
      role="presentation"
    >
      <div className="lp-intro-center">
        <div className="lp-intro-word" key={idx}>{GREETINGS[idx]}</div>
      </div>
      <div className="lp-intro-brand">
        <span className="lp-intro-brand-line" />
        Fintú &amp; Co.
        <span className="lp-intro-brand-line" />
      </div>
      <div className="lp-intro-skip">toca para continuar</div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   LEGAL — Términos y Privacidad
   Plantilla de referencia; revisar con un abogado antes de operar.
════════════════════════════════════════════════════════════ */
const LEGAL = {
  terminos: {
    title: 'Términos y Condiciones',
    updated: 'Julio 2026',
    sections: [
      { h: '1. El servicio', p: [
        'Fintú & Co. es una herramienta de organización financiera personal. No somos una entidad financiera, no otorgamos créditos ni nos conectamos a tu banco. La app te permite registrar y visualizar manualmente la información de tus tarjetas de crédito.',
      ]},
      { h: '2. Acceso y pago', p: [
        'El acceso se obtiene mediante un pago único de $4 USD procesado por PayPal. La licencia es personal, intransferible y válida durante toda la vida del servicio. No existen suscripciones ni cobros recurrentes.',
      ]},
      { h: '3. Tu cuenta', p: [
        'Eres responsable de mantener la confidencialidad de tu contraseña y de la veracidad de los datos que registras. Una cuenta corresponde a una sola persona.',
      ]},
      { h: '4. Información referencial', p: [
        'Los cálculos que muestra la app (intereses, ciclos, score de salud financiera y similares) son estimaciones referenciales basadas en los datos que tú ingresas. No constituyen asesoría financiera, contable ni legal. Las decisiones que tomes con esta información son tu responsabilidad.',
      ]},
      { h: '5. Reembolsos', p: [
        'Por la naturaleza digital del producto, no se realizan reembolsos una vez activado el acceso, salvo error de cobro demostrable.',
      ]},
      { h: '6. Propiedad intelectual', p: [
        'La marca Fintú & Co., el diseño, el código, los textos y todos los contenidos de la plataforma son propiedad exclusiva de Fintú & Co. Queda prohibida su copia, reproducción, distribución, modificación o ingeniería inversa, total o parcial, sin autorización escrita.',
      ]},
      { h: '7. Marcas de terceros y tasas de referencia', p: [
        'Los nombres y marcas de bancos, financieras y emisoras de tarjetas mencionados en la plataforma pertenecen a sus respectivos titulares y se usan únicamente con fines de identificación y comparación informativa. Fintú & Co. no está afiliada, patrocinada ni respaldada por ninguna de ellas, ni actúa como intermediaria o promotora de sus productos.',
        'Las tasas (TEA) que muestra el comparador son referenciales, se basan en información pública de la SBS y pueden variar en cualquier momento. La tasa aplicable a cada persona depende de su perfil crediticio y del producto contratado. Verifica siempre las condiciones vigentes directamente con la entidad financiera antes de tomar una decisión.',
      ]},
      { h: '8. Cambios', p: [
        'Podemos actualizar el servicio y estos términos para mejorarlos. Los cambios relevantes se comunicarán dentro de la app.',
      ]},
      { h: '9. Ley aplicable', p: [
        'Estos términos se rigen por las leyes de la República del Perú.',
      ]},
    ],
  },
  privacidad: {
    title: 'Política de Privacidad',
    updated: 'Junio 2026',
    sections: [
      { h: '1. Datos que recopilamos', p: [
        'Para crear tu cuenta solo pedimos: nombre, apellido, email y una contraseña (que guardamos cifrada). Al pagar, registramos el identificador de la transacción que nos entrega PayPal.',
        'Nunca pedimos ni almacenamos números de tarjeta, CVV, claves bancarias ni credenciales de banca por internet.',
      ]},
      { h: '2. Datos que tú registras', p: [
        'Los montos, fechas de ciclo y movimientos que ingresas en la app son datos que tú decides registrar manualmente. Se usan únicamente para mostrarte tu propia información y cálculos.',
      ]},
      { h: '3. Para qué usamos tus datos', p: [
        'Autenticarte, operar las funciones de la app, enviarte el código de recuperación de contraseña a tu email y brindarte soporte. Nada más.',
      ]},
      { h: '4. Con quién compartimos', p: [
        'Con nadie. No vendemos ni cedemos tus datos a terceros. El pago lo procesa PayPal bajo sus propios términos y nosotros solo recibimos la confirmación.',
      ]},
      { h: '5. Seguridad', p: [
        'Contraseñas cifradas con bcrypt, acceso autenticado mediante token y comunicación restringida a tu propia cuenta.',
      ]},
      { h: '6. Tus derechos (Ley N° 29733)', p: [
        'Conforme a la Ley de Protección de Datos Personales del Perú, puedes ejercer tus derechos de acceso, rectificación, cancelación y oposición escribiendo a soporte@fintu.pe.',
      ]},
      { h: '7. Almacenamiento local', p: [
        'La app guarda tu sesión (token) en el almacenamiento local de tu navegador para mantenerte conectado. Se elimina al cerrar sesión.',
      ]},
    ],
  },
};

function LegalModal({ doc, onClose }) {
  const data = LEGAL[doc];
  if (!data) return null;
  return (
    <div className="lp-legal-ov" onClick={onClose} role="presentation">
      <div className="lp-legal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={data.title}>
        <div className="lp-legal-head">
          <div>
            <h3>{data.title}</h3>
            <span>Última actualización: {data.updated}</span>
          </div>
          <button className="lp-legal-x" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="lp-legal-body">
          {data.sections.map((s) => (
            <section key={s.h}>
              <h4>{s.h}</h4>
              {s.p.map((t, i) => <p key={i}>{t}</p>)}
            </section>
          ))}
          <p className="lp-legal-contact">¿Dudas? Escríbenos a soporte@fintu.pe</p>
        </div>
        <div className="lp-legal-foot">
          <button className="lp-btn-gold" onClick={onClose}>Entendido</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════
   ICONOS
════════════════════════════════════════════════════════════ */
const Arr = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="14" height="14">
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

const IcCard = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" />
    <line x1="5" y1="15" x2="9" y2="15" /><line x1="13" y1="15" x2="15" y2="15" />
  </svg>
);
const IcChart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const IcCal = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IcPercent = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="5" x2="5" y2="19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
);
const IcTarget = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" />
  </svg>
);
const IcGauge = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 0 1 7.39 16.76M12 2A10 10 0 0 0 4.61 18.76" />
    <line x1="12" y1="12" x2="15.5" y2="8.5" />
  </svg>
);
const IcCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="13" height="13">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IcLock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
    <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

/* ════════════════════════════════════════════════════════════
   DATA
════════════════════════════════════════════════════════════ */
const FEATURES = [
  { Icon: IcCard,    titulo: 'Hasta 4 tarjetas',          desc: 'Todas tus tarjetas de cualquier banco peruano, en un solo dashboard.' },
  { Icon: IcCal,     titulo: 'Ciclos automáticos',         desc: 'Fechas de inicio, cierre y pago calculadas solas. Nunca más una mora.' },
  { Icon: IcChart,   titulo: 'Historial visual',           desc: 'Gastos, pagos y evolución de tu deuda en gráficos claros.' },
  { Icon: IcTarget,  titulo: 'Metas de ahorro',            desc: 'Define objetivos vinculados a tu deuda y rastrea tu progreso mes a mes.' },
];

const STEPS = [
  { num: '01', titulo: 'Crea tu cuenta',      desc: 'Regístrate y paga $4 una sola vez vía PayPal. Toma 2 minutos.' },
  { num: '02', titulo: 'Agrega tus tarjetas', desc: 'Banco, línea de crédito y fechas de ciclo. Sin datos sensibles.' },
  { num: '03', titulo: 'Toma el control',     desc: 'Registra movimientos, cuida tus fechas y mejora tu score.' },
];

const FAQS = [
  { q: '¿Es seguro ingresar mis datos?',              a: 'Sí. No almacenamos datos bancarios ni números de tarjeta. Solo registras montos y fechas de ciclo.' },
  { q: '¿El pago de $4 es único o mensual?',          a: 'Es un pago único de por vida. Pagas una sola vez y accedes a todas las funciones para siempre.' },
  { q: '¿Funciona para todas las tarjetas?', a: 'Sí. Puedes agregar cualquier tarjeta de cualquier banco.' },
  { q: '¿Qué pasa si olvido mi contraseña?',          a: 'Puedes recuperarla desde la pantalla de inicio ingresando tu email registrado.' },
];

const PRICE_INCLUDES = [
  'Todas las funciones incluidas',
  'Hasta 4 tarjetas simultáneas',
  'Actualizaciones futuras sin costo',
  'Sin publicidad ni suscripciones',
  'Sin datos bancarios requeridos',
  'Soporte personalizado',
];

/* ════════════════════════════════════════════════════════════
   VIDEO AMBIENTE — autoplay silencioso en loop.
   Con prefers-reduced-motion se congela en un frame (sin loop).
════════════════════════════════════════════════════════════ */
function AmbientVideo({ src, poster, className }) {
  const ref = useRef(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    if (reduced) {
      v.autoplay = false;
      const freeze = () => { v.pause(); try { v.currentTime = 0.05; } catch { /* noop */ } };
      if (v.readyState >= 1) freeze();
      else v.addEventListener('loadedmetadata', freeze, { once: true });
      return;
    }
    // Algunos navegadores ignoran el atributo autoplay en una SPA: forzamos play.
    const p = v.play?.();
    if (p && typeof p.catch === 'function') p.catch(() => { /* autoplay bloqueado, queda en poster */ });
  }, []);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  );
}

/* ════════════════════════════════════════════════════════════
   REVEAL ON SCROLL
════════════════════════════════════════════════════════════ */
function useReveal(active) {
  useEffect(() => {
    if (!active) return;
    const els = document.querySelectorAll('.reveal');
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      }),
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [active]);
}

/* ════════════════════════════════════════════════════════════
   LANDING
════════════════════════════════════════════════════════════ */
export default function Landing() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [navScrolled, setNavScrolled] = useState(false);
  const [navMobileOpen, setNavMobileOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(null); // null | 'terminos' | 'privacidad'

  // Intro: solo una vez por sesión y nunca con reduced-motion
  const [showIntro, setShowIntro] = useState(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    return !reduced && !sessionStorage.getItem('fintu_intro_seen');
  });

  const handleIntroDone = useCallback(() => {
    sessionStorage.setItem('fintu_intro_seen', '1');
    setShowIntro(false);
  }, []);

  // Bloquear scroll mientras corre el intro, hay modal legal o menú móvil abierto
  useEffect(() => {
    document.body.style.overflow = (showIntro || legalOpen || navMobileOpen) ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showIntro, legalOpen, navMobileOpen]);

  // Cerrar modal legal con Escape
  useEffect(() => {
    if (!legalOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') setLegalOpen(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [legalOpen]);

  useReveal(!showIntro);

  useEffect(() => {
    const onScroll = () => setNavScrolled(window.scrollY > 50);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div className="lp">

      {showIntro && <IntroGreeting onDone={handleIntroDone} />}
      {legalOpen && <LegalModal doc={legalOpen} onClose={() => setLegalOpen(null)} />}

      {/* ─── NAV ─── */}
      <nav className={`lp-nav${navScrolled ? ' lp-nav--scrolled' : ''}`}>
        <div className="lp-nav-in">
          <BrandLogo
            size="sm"
            className="lp-brand"
            role="button"
            tabIndex={0}
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          />
          <div className="lp-nav-links">
            <a href="#sec-features" onClick={(e) => { e.preventDefault(); scrollTo('sec-features'); }}>Funciones</a>
            <a href="#sec-steps" onClick={(e) => { e.preventDefault(); scrollTo('sec-steps'); }}>Cómo funciona</a>
            <a href="#sec-pricing" onClick={(e) => { e.preventDefault(); scrollTo('sec-pricing'); }}>Precio</a>
            <a href="#sec-faq" onClick={(e) => { e.preventDefault(); scrollTo('sec-faq'); }}>FAQ</a>
          </div>
          <div className="lp-nav-btns">
            <button
              className="lp-hamburger"
              onClick={() => setNavMobileOpen(!navMobileOpen)}
              aria-label={navMobileOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={navMobileOpen}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {navMobileOpen
                  ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                  : <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="15" y2="18"/></>
                }
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* ─── MOBILE NAV DROPDOWN ─── */}
      {navMobileOpen && (
        <div className="lp-mobile-nav" role="dialog" aria-label="Navegación">
          {[
            { label: 'Funciones',     id: 'sec-features' },
            { label: 'Cómo funciona', id: 'sec-steps'    },
            { label: 'Precio',        id: 'sec-pricing'  },
            { label: 'FAQ',           id: 'sec-faq'      },
          ].map(({ label, id }) => (
            <a
              key={id}
              href={`#${id}`}
              onClick={(e) => { e.preventDefault(); setNavMobileOpen(false); scrollTo(id); }}
            >
              {label}
            </a>
          ))}
          <div className="lp-mobile-nav-btns">
            <button className="lp-btn-ghost" onClick={() => { setNavMobileOpen(false); navigate('/login'); }}>Iniciar sesión</button>
            <button className="lp-btn-gold" onClick={() => { setNavMobileOpen(false); navigate('/registro'); }}>Comenzar <Arr /></button>
          </div>
        </div>
      )}

      {/* ─── HERO (showcase split · mensaje | figura | ficha) ─── */}
      <header className={`lp-hero lp-hero--split${showIntro ? '' : ' lp-hero--in'}`}>
        <div className="lp-hero-glow" aria-hidden="true" />
        <div className="lp-hero-split">

          {/* ── IZQUIERDA · mensaje ── */}
          <div className="lp-hero-msg">
            <div className="lp-hero-eyebrow">Toma el control · desde $4</div>
            <h1 className="lp-hero-title">
              Tus tarjetas,
              <br />
              <span className="lp-hero-gold">bajo control.</span>
            </h1>
            <p className="lp-hero-sub">
              La app web que organiza tus tarjetas, evita intereses de más
              y hace crecer tu salud financiera.
            </p>
            <div className="lp-hero-cta">
              <button className="lp-btn-gold lp-btn-hero" onClick={() => navigate('/registro')}>
                Empezar por $4 <Arr />
              </button>
              <button className="lp-btn-text" onClick={() => scrollTo('sec-features')}>
                Explorar funciones <Arr />
              </button>
            </div>
            <div className="lp-hero-swatch">
              <div className="lp-hero-swatch-item">
                <span className="lp-sw-dot lp-sw-1" />
                <small>Sin datos<br />bancarios</small>
              </div>
              <div className="lp-hero-swatch-item">
                <span className="lp-sw-dot lp-sw-2" />
                <small>Pago único<br />de por vida</small>
              </div>
              <div className="lp-hero-swatch-item">
                <span className="lp-sw-dot lp-sw-3" />
                <small>100%<br />peruano</small>
              </div>
            </div>
          </div>

          {/* ── CENTRO · figura ── */}
          <div className="lp-hero-figure-col" aria-hidden="true">
            <BrandLogo tagline={false} className="lp-hero-backdrop" aria-hidden="true" />
            <div className="lp-hero-stage-halo" />
            <div className="lp-hero-figure">
              <img
                src="/images/hero-persona.jpg"
                alt=""
                className="lp-hero-figure-img"
                onLoad={(e) => e.currentTarget.closest('.lp-hero-figure').classList.add('has-img')}
              />
              <div className="lp-hero-figure-ph">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="30" height="30">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                </svg>
                <span>Tu foto aquí</span>
                <small>fondo blanco · se funde solo</small>
              </div>
            </div>

            {/* Anotaciones que señalan a la persona (estilo "Moisture Absorber") */}
            <div className="lp-hero-note lp-note-score">
              <span className="lp-note-line" />
              <span className="lp-chip-label">Tu score</span>
              <span className="lp-chip-num">82<small>/100</small></span>
            </div>
            <div className="lp-hero-note lp-note-growth">
              <span className="lp-note-line" />
              <span className="lp-chip-label">Tu progreso</span>
              <div className="lp-chip-spark">
                <svg viewBox="0 0 64 26" fill="none" preserveAspectRatio="none" aria-hidden="true">
                  <polyline points="0,22 13,17 26,19 38,11 51,8 64,2" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="lp-chip-trend">+18%</span>
              </div>
            </div>
          </div>

          {/* ── DERECHA · ficha ── */}
          <div className="lp-hero-detail">
            <div className="lp-hero-rank">
              <span className="lp-hero-rank-label">Valoración</span>
              <span className="lp-hero-rank-stars">4.9 <b>★★★★★</b></span>
            </div>
            <h3 className="lp-hero-detail-title">Fintú Score</h3>
            <p className="lp-hero-detail-desc">
              Mira, entiende y mejora la salud de todas tus tarjetas: ciclos, intereses y metas en un tablero claro.
            </p>
            <div className="lp-hero-ministats">
              <div><b>6</b><small>Herramientas</small></div>
              <div><b>0</b><small>Datos bancarios</small></div>
              <div><b>100%</b><small>Peruano</small></div>
            </div>
            <div className="lp-hero-pricerow">
              <div className="lp-hero-price">
                <small>Hoy · pago único</small>
                <b>$4</b>
              </div>
              <button className="lp-btn-dark lp-hero-buy" onClick={() => navigate('/login')}>
                Iniciar sesión <Arr />
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* ─── FUNCIONES (tarjetas numeradas, estilo ficha) ─── */}
      <section id="sec-features" className="lp-feat">
        <div className="lp-feat-in">
          <div className="lp-feat-head reveal">
            <div className="lp-feat-head-l">
              <div className="lp-feat-eyebrow">Lo que incluye</div>
              <h2 className="lp-feat-title">
                Todo lo que <span className="lp-hero-gold">necesitas.</span>
              </h2>
            </div>
            <p className="lp-feat-intro">
              Cuatro herramientas para ver, entender y dominar todas tus tarjetas
              de crédito desde un solo lugar.
            </p>
          </div>
          <div className="lp-feat-grid">
            {FEATURES.map((f, i) => (
              <div className="lp-feat-card reveal" key={f.titulo} style={{ transitionDelay: `${i * 0.07}s` }}>
                <div className="lp-feat-ico"><f.Icon /></div>
                <h3>{f.titulo}</h3>
                <p>{f.desc}</p>
                <span className="lp-feat-num" aria-hidden="true">{String(i + 1).padStart(2, '0')}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── VISUAL BREAK (video de fondo) ─── */}
      <section className="lp-visual">
        <AmbientVideo src="/videos/Tarjetas.mp4" poster={imgCardsFan} className="lp-visual-media" />
        <div className="lp-visual-ov" />
        <div className="lp-visual-body">
          <h2 className="reveal">Diseñado para sentirse <span>premium.</span></h2>
          <p className="reveal delay-1">La experiencia de una app de banca privada, al precio de un café.</p>
        </div>
      </section>

      {/* ─── PASOS ─── */}
      <section id="sec-steps" className="lp-sec">
        <div className="lp-sec-head reveal">
          <h2 className="lp-sec-title">Empieza en tres pasos</h2>
        </div>
        <div className="lp-steps-grid">
          {STEPS.map((s, i) => (
            <div className="lp-step reveal" key={s.num} style={{ transitionDelay: `${i * 0.1}s` }}>
              <div className="lp-step-num">{s.num}</div>
              <h3>{s.titulo}</h3>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─── PRECIO (navy, el momento de la página) ─── */}
      <section id="sec-pricing" className="lp-pricing">
        <div className="lp-pricing-aura" aria-hidden="true" />
        <div className="lp-pricing-in">
          <div className="lp-pricing-copy reveal">
            <h2>Un pago.<br /><span>Para siempre.</span></h2>
            <p>
              Sin suscripciones, sin renovaciones, sin letra pequeña.
              Pagas una vez y la app es tuya de por vida.
            </p>
            <div className="lp-pricing-secure">
              <IcLock /> Pago procesado de forma segura por PayPal
            </div>
          </div>

          <div className="lp-price-card reveal delay-1">
            <div className="lp-price-badge">Acceso completo</div>
            <div className="lp-price-amount">
              <span className="curr">$</span>
              <span className="num">4</span>
              <span className="meta">USD<br />pago único</span>
            </div>
            <ul className="lp-price-list">
              {PRICE_INCLUDES.map((t) => (
                <li key={t}><span className="lp-check"><IcCheck /></span>{t}</li>
              ))}
            </ul>
            <button className="lp-btn-gold lp-btn-full" onClick={() => navigate('/registro')}>
              Crear mi cuenta <Arr />
            </button>
            <p className="lp-price-terms">
              Al crear tu cuenta aceptas los <span onClick={() => setLegalOpen('terminos')}>Términos</span> y
              la <span onClick={() => setLegalOpen('privacidad')}>Política de Privacidad</span>.
            </p>
            <p className="lp-price-login">
              ¿Ya tienes cuenta? <span onClick={() => navigate('/login')}>Inicia sesión</span>
            </p>
          </div>
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section id="sec-faq" className="lp-sec lp-sec-faq">
        <div className="lp-sec-head reveal">
          <h2 className="lp-sec-title">Preguntas frecuentes</h2>
        </div>
        {/* El reveal va en el contenedor: si fuera en cada item, React borraría
            la clase `visible` (agregada por el observer) al re-renderizar con `open` */}
        <div className="lp-faq-list reveal">
          {FAQS.map((f, i) => (
            <div
              className={`lp-faq-item${openFaq === i ? ' open' : ''}`}
              key={f.q}
              onClick={() => setOpenFaq(openFaq === i ? null : i)}
            >
              <div className="lp-faq-q">
                <span>{f.q}</span>
                <span className="lp-faq-arr">›</span>
              </div>
              <div className="lp-faq-a"><p>{f.a}</p></div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="lp-footer">
        <div className="lp-footer-grid">
          <div className="lp-footer-brand">
            <BrandLogo size="md" tagline className="lp-footer-logo" />
            <p className="lp-footer-tagline">
              La app peruana para gestionar, organizar y optimizar tus tarjetas de crédito.
            </p>
          </div>
          <div className="lp-footer-col">
            <h4>Producto</h4>
            <ul>
              <li onClick={() => navigate('/registro')}>Crear cuenta</li>
              <li onClick={() => navigate('/login')}>Iniciar sesión</li>
              <li onClick={() => scrollTo('sec-pricing')}>Precio</li>
              <li onClick={() => scrollTo('sec-faq')}>Preguntas frecuentes</li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Legal</h4>
            <ul>
              <li onClick={() => setLegalOpen('terminos')}>Términos y Condiciones</li>
              <li onClick={() => setLegalOpen('privacidad')}>Política de Privacidad</li>
            </ul>
          </div>
          <div className="lp-footer-col">
            <h4>Contacto</h4>
            <ul>
              <li><a href="mailto:soporte@fintu.pe">soporte@fintu.pe</a></li>
            </ul>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <p>© {new Date().getFullYear()} Fintú &amp; Co. · Perú 🇵🇪 · Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* ─── MOBILE STICKY CTA ─── */}
      <div className="lp-mobile-cta">
        <div className="lp-mca-left">
          <span className="lp-mca-label">Acceso de por vida</span>
          <span className="lp-mca-price"><strong>$4 USD</strong> pago único</span>
        </div>
        <button className="lp-btn-gold" onClick={() => navigate('/registro')}>
          Empezar <Arr />
        </button>
      </div>

    </div>
  );
}
