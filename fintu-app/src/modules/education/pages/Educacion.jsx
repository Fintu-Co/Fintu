import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import Sidebar from '@/shared/components/Sidebar';
/* Armazón compartido (layout + sidebar) — ver nota en Comparador.jsx. */
import '@/modules/cards/pages/Dashboard.css';
import './learn.css';

/* Secciones de la página. Los ids viejos de pestañas (?tab=…) siguen
   funcionando: se mapean a la sección que ahora contiene ese tema. */
const SECCIONES = [
  { id: 'costo',  label: 'Cuánto cuesta' },
  { id: 'tcea',   label: 'TEA o TCEA' },
  { id: 'pagos',  label: 'Cuánto pagar' },
  { id: 'regla',  label: 'Tu score' },
  { id: 'experiencias', label: 'Más línea' },
  { id: 'resumen', label: 'Resumen' },
];
const TAB_A_SECCION = { tea: 'costo', intereses: 'costo', tcea: 'tcea', pagos: 'pagos', regla: 'regla', experiencias: 'experiencias', reglas: 'resumen' };

/* Experiencias reales compartidas por usuarios. Se cuentan como vivencias,
   no como promesas: cada banco evalúa distinto. Sin nombres de bancos
   (publicidad comparativa, INDECOPI). */
const EXPERIENCIAS = [
  {
    titulo: 'De cliente “de bajo riesgo” a más línea',
    perfil: 'Paga sus tarjetas a tiempo y concentró sus productos en un banco',
    pasos: [
      'Por su buen historial, el banco calificó su perfil como de bajo riesgo y le ofreció un crédito hipotecario preaprobado.',
      'Contrató un seguro oncológico con ese mismo banco.',
      'Al mes, le subieron la línea de su tarjeta. Le comentaron que podría haber otro aumento pronto.',
      'Le dijeron que podría acceder a una mejor tarjeta si presentaba ingresos fijos o activos estables.',
    ],
    resultado: 'Más línea en un mes y la puerta abierta a una tarjeta mejor.',
  },
  {
    titulo: 'De tarjeta con garantía a S/ 10,000 sin garantía',
    perfil: 'Trabaja de forma independiente: emite recibos por honorarios y declara sus ingresos en SUNAT. Tiene cuentas mancomunadas.',
    pasos: [
      'Empezó con una tarjeta con garantía y la usó bien durante 6 meses.',
      'Otro banco le ofreció otra tarjeta con garantía, así que dio de baja la primera.',
      'Poco después, una entidad de la competencia le ofreció una tarjeta sin garantía de S/ 10,000 de línea.',
    ],
    resultado: 'Pasó de dejar un depósito a tener S/ 10,000 de línea sin garantía.',
  },
];

/* Mínimo típico: intereses del mes + 5% del capital (varía por banco). */
const simular = (deuda, tea) => {
  const im = Math.pow(1 + tea / 100, 1 / 12) - 1;
  const interesMes = deuda * im;
  const pagoMinimo = interesMes + deuda * 0.05;
  let saldo = deuda, intereses = 0, meses = 0;
  while (saldo > 0.01 && meses < 600) {
    const interes = saldo * im;
    intereses += interes;
    saldo -= Math.min(pagoMinimo - interes, saldo);
    meses++;
  }
  return { tasaMensual: im * 100, interesMes, pagoMinimo, meses, intereses };
};
const fmt0 = (n) => Math.round(n).toLocaleString('es-PE');
const plazo = (m) => (m >= 24 ? `${(m / 12).toFixed(1).replace('.0', '')} años` : `${m} meses`);

const IcMenu  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></svg>);
const IcCheck = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="20 6 9 17 4 12" /></svg>);
const IcX     = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const IcArrow = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);

function Educacion() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tea, setTea] = useState(85);
  const [deuda, setDeuda] = useState(1000);

  /* Enlaces viejos (?tab=regla, etc.) llevan a su sección */
  useEffect(() => {
    const destino = TAB_A_SECCION[searchParams.get('tab')];
    if (destino && destino !== 'costo') {
      setTimeout(() => document.getElementById(destino)?.scrollIntoView({ block: 'start' }), 80);
    }
  }, [searchParams]);

  if (!user) return <div className="loading-screen"><div className="spinner"></div></div>;

  const sim = simular(deuda, tea);
  const ir = (id) => (e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <div className="dashboard-dark">
      <Sidebar active="educacion" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-layout">
        <main className="lr">

          <header className="lr-top">
            <button className="lr-icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><IcMenu /></button>
            <div className="lr-title">
              <h1>Educación financiera</h1>
              <p>Lo justo para no pagar intereses de más. Cinco minutos de lectura.</p>
            </div>
          </header>

          <nav className="lr-index" aria-label="En esta página">
            {SECCIONES.map(s => <a key={s.id} href={`#${s.id}`} onClick={ir(s.id)}>{s.label}</a>)}
          </nav>

          {/* ── 1. CUÁNTO CUESTA DEBER (simulador) ── */}
          <section className="lr-hero" id="costo" aria-labelledby="costo-t">
            <div className="lr-hero-msg">
              <span className="lr-hero-tag">La TEA, en soles</span>
              <h2 id="costo-t">¿Cuánto te cuesta deber?</h2>
              <p>
                La <b>TEA</b> (Tasa Efectiva Anual) es lo que el banco te cobra por dejar deuda.
                Solo se aplica si <b>no pagas el total</b>. Mueve los valores y mira lo que significa.
              </p>

              <div className="lr-sliders">
                <label className="lr-slider">
                  <span>Tu deuda <b>S/ {fmt0(deuda)}</b></span>
                  <input type="range" min="100" max="10000" step="100" value={deuda} onChange={e => setDeuda(Number(e.target.value))} aria-label="Deuda en soles" />
                </label>
                <label className="lr-slider">
                  <span>TEA de tu tarjeta <b>{tea}%</b></span>
                  <input type="range" min="20" max="150" value={tea} onChange={e => setTea(Number(e.target.value))} aria-label="TEA anual en porcentaje" />
                </label>
              </div>
            </div>

            <div className="lr-results" aria-live="polite">
              <div className="lr-result">
                <span>Interés de un solo mes</span>
                <strong>S/ {fmt0(sim.interesMes)}</strong>
                <small>{sim.tasaMensual.toFixed(2)}% mensual</small>
              </div>
              <div className="lr-result is-bad">
                <span>Pagando solo el mínimo</span>
                <strong>{plazo(sim.meses)}</strong>
                <small>y S/ {fmt0(sim.intereses)} extra en intereses</small>
              </div>
              <div className="lr-result is-good">
                <span>Pagando el total</span>
                <strong>S/ 0</strong>
                <small>de intereses. Por eso es lo ideal.</small>
              </div>
            </div>
          </section>

          {/* ── 2. TEA O TCEA ── */}
          <section className="lr-sec" id="tcea" aria-labelledby="tcea-t">
            <div className="lr-sec-head">
              <span className="lr-tag">Comparar tarjetas</span>
              <h2 id="tcea-t">¿TEA o TCEA?</h2>
              <p>Se parecen, pero para comparar tarjetas usa siempre la TCEA.</p>
            </div>
            <div className="lr-grid-2">
              <article className="lr-card">
                <span className="lr-pill">TEA</span>
                <h3>Solo los intereses</h3>
                <ul className="lr-checks">
                  <li><IcCheck /> Intereses</li>
                  <li className="is-no"><IcX /> Comisiones</li>
                  <li className="is-no"><IcX /> Seguros</li>
                  <li className="is-no"><IcX /> Membresía</li>
                </ul>
              </article>
              <article className="lr-card lr-card--accent">
                <span className="lr-pill">TCEA</span>
                <h3>Todo lo que pagas</h3>
                <ul className="lr-checks">
                  <li><IcCheck /> Intereses</li>
                  <li><IcCheck /> Comisiones</li>
                  <li><IcCheck /> Seguros</li>
                  <li><IcCheck /> Membresía</li>
                </ul>
              </article>
            </div>
            <p className="lr-note">
              En Perú, la SBS obliga a los bancos a informarte la TCEA antes de contratar. Dos tarjetas con la misma TEA pueden costar muy distinto.
            </p>
          </section>

          {/* ── 3. CUÁNTO PAGAR ── */}
          <section className="lr-sec" id="pagos" aria-labelledby="pagos-t">
            <div className="lr-sec-head">
              <span className="lr-tag">Cada mes</span>
              <h2 id="pagos-t">¿Cuánto pagar cada mes?</h2>
              <p>Lo que decides pagar define cuánto terminas pagando.</p>
            </div>
            <div className="lr-grid-3">
              <article className="lr-card">
                <span className="lr-status is-good">Lo ideal</span>
                <h3>Pago total</h3>
                <p>Pagas todo antes de la fecha límite. Cero intereses: usas la tarjeta gratis.</p>
              </article>
              <article className="lr-card">
                <span className="lr-status is-warn">Aceptable</span>
                <h3>Pago parcial</h3>
                <p>Más que el mínimo, menos que el total. Pagas intereses, pero sobre menos deuda.</p>
              </article>
              <article className="lr-card">
                <span className="lr-status is-bad">Solo emergencias</span>
                <h3>Pago mínimo</h3>
                <p>Evita la mora, pero casi todo se va en intereses. Suele ser el interés del mes + ~5% de la deuda.</p>
              </article>
            </div>
          </section>

          {/* ── 4. TU SCORE ── */}
          <section className="lr-sec" id="regla" aria-labelledby="regla-t">
            <div className="lr-sec-head">
              <span className="lr-tag">Historial crediticio</span>
              <h2 id="regla-t">¿Cómo cuidar tu score?</h2>
              <p>Tres hábitos. Son lo que miran los bancos antes de darte más crédito.</p>
            </div>
            <div className="lr-grid-3">
              <article className="lr-card">
                <span className="lr-big">30%</span>
                <h3>Usa menos del 30% de tu línea</h3>
                <p>Con S/ 5,000 de línea, intenta no deber más de S/ 1,500 al cierre.</p>
                <div className="lr-meter" aria-hidden="true"><div /><i /></div>
              </article>
              <article className="lr-card">
                <span className="lr-big">Corte</span>
                <h3>Paga antes del cierre</h3>
                <p>El saldo del día de cierre es el que se reporta a las centrales. Si pagas antes, reportas menos.</p>
              </article>
              <article className="lr-card">
                <span className="lr-big">0</span>
                <h3>Cero atrasos</h3>
                <p>Un pago tarde se reporta por años. La puntualidad es lo que más pesa en tu historial.</p>
              </article>
            </div>
          </section>

          {/* ── 5. EXPERIENCIAS: MÁS LÍNEA Y SALIR DE LA GARANTÍA ── */}
          <section className="lr-sec" id="experiencias" aria-labelledby="exp-t">
            <div className="lr-sec-head">
              <span className="lr-tag">Experiencias de usuarios</span>
              <h2 id="exp-t">¿Cómo subir tu línea o dejar la garantía?</h2>
              <p>Dos historias reales de personas que lo lograron. No son una receta, pero muestran qué les abrió puertas.</p>
            </div>

            <div className="lr-grid-2">
              {EXPERIENCIAS.map((e, i) => (
                <article className="lr-story" key={e.titulo}>
                  <span className="lr-story-n" aria-hidden="true">{i + 1}</span>
                  <h3>{e.titulo}</h3>
                  <p className="lr-story-who">{e.perfil}</p>
                  <ol className="lr-steps">
                    {e.pasos.map(p => <li key={p}>{p}</li>)}
                  </ol>
                  <p className="lr-story-result"><IcCheck /> {e.resultado}</p>
                </article>
              ))}
            </div>

            <article className="lr-card lr-takeaways">
              <h3>Lo que se repite en ambas</h3>
              <ul>
                <li><b>Historial limpio.</b> Meses pagando a tiempo, sin atrasos.</li>
                <li><b>Ingresos que se puedan comprobar.</b> Boletas, o recibos por honorarios declarados en SUNAT.</li>
                <li><b>Más relación con el banco.</b> Cuentas, seguros u otros productos pueden hacer que te conozcan mejor.</li>
                <li><b>Las ofertas pueden venir de la competencia.</b> Un buen historial se ve en todo el sistema, no solo en tu banco.</li>
              </ul>
              <p className="lr-takeaways-tip">
                <b>Si tienes tarjeta con garantía:</b> después de varios meses de buen uso, pregunta a tu banco si puede pasarla a una sin garantía y devolverte el depósito. Algunos lo evalúan; no cuesta preguntar.
              </p>
            </article>

            <p className="lr-note">
              Son experiencias personales compartidas por usuarios, no asesoría financiera ni una garantía de resultado. Cada banco evalúa tu perfil a su manera.
            </p>
          </section>

          {/* ── 6. RESUMEN ── */}
          <section className="lr-sec" id="resumen" aria-labelledby="resumen-t">
            <div className="lr-summary">
              <div>
                <span className="lr-tag lr-tag--light">En resumen</span>
                <h2 id="resumen-t">Cinco reglas de oro</h2>
              </div>
              <ol>
                <li>Paga el total siempre que puedas.</li>
                <li>Nunca uses el mínimo como hábito.</li>
                <li>Mantén tu uso bajo 30% de la línea.</li>
                <li>Paga antes del cierre, no solo antes del vencimiento.</li>
                <li>Compara tarjetas por TCEA y membresía, no solo por TEA.</li>
              </ol>
              <button className="lr-btn lr-btn--peach" onClick={() => navigate('/comparador')}>
                Ver TEAs por banco <IcArrow />
              </button>
            </div>
          </section>

          <p className="lr-foot">Información referencial y general. Verifica las condiciones de tu tarjeta con tu banco.</p>
        </main>
      </div>
    </div>
  );
}

export default Educacion;
