import { useState, useEffect } from 'react';
import './FirstCardGuideModal.css';

/**
 * MODO GUIADO: "Mi Primera Tarjeta"
 *
 * Wizard para quien recién empieza con tarjetas de crédito.
 * Paso 0: elegir nivel (se guarda en localStorage y adapta las lecciones).
 *   - principiante → 5 lecciones completas
 *   - intermedio   → 3 lecciones clave
 *   - avanzado     → directo al resumen y herramientas
 */

const NIVEL_KEY = 'fintu_nivel';

const NIVELES = [
  {
    id: 'principiante',
    titulo: 'Principiante',
    desc: 'Es mi primera tarjeta o todavía no la entiendo bien',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22V8" /><path d="M12 8C12 5 9 3 5 3c0 4 3 6 7 5z" /><path d="M12 11c0-3 3-5 7-5c0 4-3 6-7 5z" />
      </svg>
    ),
  },
  {
    id: 'intermedio',
    titulo: 'Intermedio',
    desc: 'Conozco lo básico pero quiero dejar de pagar intereses',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
  },
  {
    id: 'avanzado',
    titulo: 'Avanzado',
    desc: 'Domino mis fechas, vengo por las herramientas',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
];

const LESSONS = {
  'que-es': {
    cat: 'Lo esencial',
    titulo: 'Una tarjeta no es dinero extra',
    parrafos: [
      'Es un préstamo rotativo: el banco te presta hasta tu línea de crédito y tú devuelves lo que usaste.',
      'Si devuelves todo a tiempo, no pagas nada extra. Si no, el banco cobra intereses (la TEA).',
    ],
    tip: 'Piensa en la línea como un techo de seguridad, no como una meta de gasto.',
  },
  'cierre-pago': {
    cat: 'Fechas clave',
    titulo: 'Cierre y pago no son lo mismo',
    parrafos: [
      'El día de CIERRE el banco suma todo lo que gastaste en el mes: esa es tu deuda del período.',
      'La fecha de PAGO es el último día para pagar esa suma sin mora ni intereses.',
    ],
    visual: 'timeline',
    tip: 'Truco: compra al día siguiente del cierre y tendrás casi 50 días para pagar sin intereses.',
  },
  'pago-minimo': {
    cat: 'La trampa',
    titulo: 'El pago mínimo no es tu amigo',
    parrafos: [
      'El mínimo solo evita la mora. Todo lo que no pagas sigue generando intereses cada día.',
      'Pagando solo el mínimo, una deuda pequeña puede tomar años en desaparecer.',
    ],
    visual: 'minimo',
    tip: 'El mínimo es para emergencias reales, no para todos los meses.',
  },
  'evitar-intereses': {
    cat: 'La regla de oro',
    titulo: 'Cómo no pagar intereses jamás',
    parrafos: [
      'Paga el TOTAL facturado antes de tu fecha de pago. Con eso la TEA nunca se aplica.',
      'Así tu tarjeta se vuelve una herramienta gratuita: acumulas historial sin costo alguno.',
    ],
    visual: 'regla',
    tip: 'Fintú te muestra tus fechas y cuánto debes pagar para lograr exactamente esto.',
  },
  'score': {
    cat: 'Tu reputación',
    titulo: 'El score se construye solo con hábitos',
    parrafos: [
      'Las centrales de riesgo (Sentinel, Infocorp) miran dos cosas: si pagas a tiempo y cuánto usas de tu línea.',
      'Mantén el uso debajo del 30% y paga puntual: tu score sube mes a mes sin trucos.',
    ],
    visual: 'uso',
    tip: 'Línea de S/ 1,000 significa intentar no deber más de S/ 300 al cierre.',
  },
};

const PLAN = {
  principiante: ['que-es', 'cierre-pago', 'pago-minimo', 'evitar-intereses', 'score'],
  intermedio: ['cierre-pago', 'evitar-intereses', 'score'],
  avanzado: [],
};

const CHECKLIST = [
  'Sé qué día cierra mi tarjeta y qué día debo pagar',
  'Entiendo por qué el pago mínimo genera intereses',
  'Mi meta: pagar el total antes de la fecha de pago',
  'Mantendré mi uso debajo del 30% de la línea',
];

/* ── Visuales por lección ── */
function LessonVisual({ tipo }) {
  if (tipo === 'timeline') {
    return (
      <div className="fcg-visual">
        <div className="fcg-timeline">
          <div className="fcg-tl-track"><div className="fcg-tl-fill" /></div>
          <div className="fcg-tl-points">
            <div className="fcg-tl-pt">
              <span className="fcg-tl-dot start" />
              <strong>Inicio</strong><small>empiezas a comprar</small>
            </div>
            <div className="fcg-tl-pt">
              <span className="fcg-tl-dot close" />
              <strong>Cierre</strong><small>se suma tu deuda</small>
            </div>
            <div className="fcg-tl-pt">
              <span className="fcg-tl-dot pay" />
              <strong>Pago</strong><small>límite sin mora</small>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (tipo === 'minimo') {
    return (
      <div className="fcg-visual">
        <div className="fcg-minimo">
          <div className="fcg-min-row"><span>Tu deuda del mes</span><strong>S/ 1,000</strong></div>
          <div className="fcg-min-row danger"><span>Pagas solo el mínimo</span><strong>S/ 50</strong></div>
          <div className="fcg-min-row warn"><span>Queda generando TEA</span><strong>S/ 950</strong></div>
        </div>
      </div>
    );
  }
  if (tipo === 'regla') {
    return (
      <div className="fcg-visual">
        <div className="fcg-regla">
          <span className="fcg-regla-eq">Pago total antes de la fecha</span>
          <span className="fcg-regla-arrow">=</span>
          <span className="fcg-regla-res">S/ 0 en intereses</span>
        </div>
      </div>
    );
  }
  if (tipo === 'uso') {
    return (
      <div className="fcg-visual">
        <div className="fcg-uso">
          <div className="fcg-uso-bar">
            <div className="fcg-uso-ideal" />
            <span className="fcg-uso-mark">30%</span>
          </div>
          <div className="fcg-uso-labels"><span>Zona saludable</span><span>Zona de riesgo</span></div>
        </div>
      </div>
    );
  }
  return null;
}

function FirstCardGuideModal({ onClose, onAddCard }) {
  const [nivel, setNivel] = useState(() => localStorage.getItem(NIVEL_KEY) || null);
  const [phase, setPhase] = useState('nivel'); // 'nivel' | 'lesson' | 'final'
  const [idx, setIdx] = useState(0);

  const plan = nivel ? PLAN[nivel] : [];
  const totalSteps = plan.length + 1; // lecciones + resumen
  const currentStep = phase === 'nivel' ? 0 : phase === 'lesson' ? idx + 1 : totalSteps;
  const progress = phase === 'nivel' ? 0 : Math.round((currentStep / totalSteps) * 100);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const elegirNivel = (id) => {
    localStorage.setItem(NIVEL_KEY, id);
    setNivel(id);
    setIdx(0);
    setPhase(PLAN[id].length === 0 ? 'final' : 'lesson');
  };

  const siguiente = () => {
    if (idx < plan.length - 1) setIdx(idx + 1);
    else setPhase('final');
  };

  const anterior = () => {
    if (phase === 'final') {
      if (plan.length === 0) setPhase('nivel');
      else { setPhase('lesson'); setIdx(plan.length - 1); }
    } else if (idx > 0) {
      setIdx(idx - 1);
    } else {
      setPhase('nivel');
    }
  };

  const lesson = phase === 'lesson' ? LESSONS[plan[idx]] : null;

  return (
    <div className="fcg-overlay" onClick={onClose} role="presentation">
      <div className="fcg-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Guía: mi primera tarjeta">

        {/* Header navy */}
        <div className="fcg-head">
          <div className="fcg-head-left">
            <div className="fcg-head-ico">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="4" width="22" height="16" rx="3" /><line x1="1" y1="10" x2="23" y2="10" />
                <line x1="5" y1="15" x2="9" y2="15" />
              </svg>
            </div>
            <div>
              <h3>Mi Primera Tarjeta</h3>
              <span>
                {phase === 'nivel' ? 'Modo guiado · elige tu nivel'
                  : phase === 'final' ? 'Resumen final'
                  : `Lección ${idx + 1} de ${plan.length}`}
              </span>
            </div>
          </div>
          <button className="fcg-x" onClick={onClose} aria-label="Cerrar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" width="14" height="14">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Barra de progreso */}
        {phase !== 'nivel' && (
          <div className="fcg-progress"><div className="fcg-progress-fill" style={{ width: `${progress}%` }} /></div>
        )}

        {/* Cuerpo */}
        <div className="fcg-body">

          {phase === 'nivel' && (
            <div className="fcg-step" key="nivel">
              <h4 className="fcg-q">¿Cuánto sabes de tarjetas de crédito?</h4>
              <p className="fcg-q-sub">Con esto adaptamos la guía a tu ritmo. Puedes cambiarlo cuando quieras.</p>
              <div className="fcg-niveles">
                {NIVELES.map((n) => (
                  <button
                    key={n.id}
                    className={`fcg-nivel${nivel === n.id ? ' selected' : ''}`}
                    onClick={() => elegirNivel(n.id)}
                  >
                    <span className="fcg-nivel-ico">{n.icon}</span>
                    <span className="fcg-nivel-tit">{n.titulo}</span>
                    <span className="fcg-nivel-desc">{n.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {phase === 'lesson' && lesson && (
            <div className="fcg-step" key={plan[idx]}>
              <span className="fcg-cat">{lesson.cat}</span>
              <h4 className="fcg-title">{lesson.titulo}</h4>
              {lesson.parrafos.map((p, i) => <p className="fcg-text" key={i}>{p}</p>)}
              {lesson.visual && <LessonVisual tipo={lesson.visual} />}
              <div className="fcg-tip">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" width="14" height="14">
                  <line x1="9" y1="18" x2="15" y2="18" /><line x1="10" y1="22" x2="14" y2="22" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0018 8 6 6 0 006 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 018.91 14" />
                </svg>
                <p>{lesson.tip}</p>
              </div>
            </div>
          )}

          {phase === 'final' && (
            <div className="fcg-step" key="final">
              <span className="fcg-cat">Listo para empezar</span>
              <h4 className="fcg-title">Tu plan en 4 puntos</h4>
              <ul className="fcg-checklist">
                {CHECKLIST.map((c) => (
                  <li key={c}>
                    <span className="fcg-check">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" width="12" height="12">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </span>
                    {c}
                  </li>
                ))}
              </ul>
              <p className="fcg-text">
                El siguiente paso es registrar tu tarjeta: Fintú calculará tus fechas
                y te avisará qué pagar y cuándo, para que esta guía se vuelva hábito.
              </p>
            </div>
          )}

        </div>

        {/* Footer de navegación */}
        <div className="fcg-foot">
          {phase !== 'nivel' ? (
            <button className="fcg-btn-ghost" onClick={anterior}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="13" height="13"><polyline points="15 18 9 12 15 6" /></svg>
              Anterior
            </button>
          ) : <span />}

          {phase === 'lesson' && (
            <button className="fcg-btn-gold" onClick={siguiente}>
              Siguiente
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="13" height="13"><polyline points="9 18 15 12 9 6" /></svg>
            </button>
          )}

          {phase === 'final' && (
            <div className="fcg-final-btns">
              <button className="fcg-btn-ghost" onClick={onClose}>Explorar la app</button>
              <button className="fcg-btn-gold" onClick={() => { onClose(); onAddCard?.(); }}>
                Agregar mi primera tarjeta
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" width="13" height="13"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default FirstCardGuideModal;
