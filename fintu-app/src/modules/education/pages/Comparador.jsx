import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/modules/auth/context/AuthContext';
import { cardsApi } from '@/modules/cards/services/cardsApi';
import { REFERENCIA_TEA, rangoTea, textoRango, interesMesRango, rangoMercado, mesesDesdeRevision, mesRevision } from '@/shared/utils/teaAprox';
import Sidebar from '@/shared/components/Sidebar';
/* El armazón (.dashboard-dark/-layout y los tokens :root) vive en
   Dashboard.css aunque lo usen varias páginas. Sin este import, al entrar
   directo aquí la página carga sin estructura.
   TODO: extraer ese armazón a shared/styles/app-shell.css. */
import '@/modules/cards/pages/Dashboard.css';
import './learn.css';

/*
  Las TEA de los bancos se muestran como RANGOS APROXIMADOS (teaAprox.js):
  cambian y no las actualizamos a diario, así que no afirmamos la cifra
  exacta de ningún banco. Fuente y fecha de revisión: REFERENCIA_TEA.
  ⚠️ Al revisar las tasas, actualiza el seed del backend y REFERENCIA_TEA.revisado.
*/

/*
  La página enseña a decidir; no recomienda un banco. "La TEA más baja" no
  es la mejor tarjeta para todos (membresía, beneficios, aprobación).
*/
const nivel = (tea) => (tea <= 60 ? { txt: 'Baja', tono: 'good' } : tea <= 80 ? { txt: 'Media', tono: 'warn' } : { txt: 'Alta', tono: 'bad' });
const fmt0 = (n) => Math.round(n).toLocaleString('es-PE');
const num = (v) => parseFloat(v);
/* "S/ 55–57": si redondean igual, un solo número */
const soles = ({ min, max }) => (Math.round(min) === Math.round(max) ? `S/ ${fmt0(min)}` : `S/ ${fmt0(min)}–${fmt0(max)}`);

const IcMenu  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><line x1="4" y1="7" x2="20" y2="7" /><line x1="4" y1="12" x2="20" y2="12" /><line x1="4" y1="17" x2="14" y2="17" /></svg>);
const IcArrow = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>);
const IcSort  = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 4v16M3 16l4 4 4-4M17 20V4M13 8l4-4 4 4" /></svg>);

function Comparador() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [bancos, setBancos] = useState([]);
  const [misTarjetas, setMisTarjetas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ordenAsc, setOrdenAsc] = useState(true);
  const [monto, setMonto] = useState(1000);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        setLoading(true);
        const [dataBancos, dataCards] = await Promise.all([
          cardsApi.getBancos(),
          cardsApi.getUserCards(user.id).catch(() => null),
        ]);
        if (dataBancos.success) setBancos(dataBancos.bancos.filter(b => !isNaN(num(b.tea_promedio))));
        if (dataCards?.success) setMisTarjetas(dataCards.tarjetas.filter(t => !t.esta_vacia));
      } catch (error) {
        console.error('Error al cargar bancos:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  if (!user) return <div className="loading-screen"><div className="spinner"></div></div>;

  const ordenados = [...bancos].sort((a, b) => num(a.tea_promedio) - num(b.tea_promedio));
  const lista = ordenAsc ? ordenados : [...ordenados].reverse();
  const minTea = ordenados[0] ? num(ordenados[0].tea_promedio) : 0;
  const maxTea = ordenados.length ? num(ordenados[ordenados.length - 1].tea_promedio) : 0;
  const montoOk = Math.max(0, Number(monto) || 0);
  const mercado = rangoMercado(ordenados.map(b => b.tea_promedio));
  const desactualizado = mesesDesdeRevision() >= REFERENCIA_TEA.vigenciaMeses;

  /* Tus tarjetas registradas, con su banco del catálogo */
  const mias = misTarjetas
    .map(t => ({ t, banco: bancos.find(b => b.id === t.banco_id) }))
    .filter(x => x.banco);
  const misBancoIds = new Set(mias.map(x => x.banco.id));
  const puesto = (id) => ordenados.findIndex(b => b.id === id) + 1;

  return (
    <div className="dashboard-dark">
      <Sidebar active="comparador" open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="dashboard-layout">
        <main className="lr">

          <header className="lr-top">
            <button className="lr-icon-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><IcMenu /></button>
            <div className="lr-title">
              <h1>Comparador de bancos</h1>
              <p>Cuánto te cobraría cada banco si no pagas el total.</p>
            </div>
          </header>

          {loading ? (
            <div className="lr-loading"><div className="spinner"></div></div>
          ) : (
            <>
              {/* ── RESPUESTA PRINCIPAL ── */}
              <section className="lr-hero lr-hero--compact" aria-label="Resumen de tasas">
                <div className="lr-hero-msg">
                  <span className="lr-hero-tag">Si debes S/ {fmt0(montoOk)} un mes</span>
                  <h2>
                    Pagarías aprox. entre <em>S/ {fmt0(interesMesRango(mercado?.baja, montoOk).min)}</em> y <em>S/ {fmt0(interesMesRango(mercado?.alta, montoOk).max)}</em> de interés, según el banco.
                  </h2>
                  <p>
                    {mias.length > 0
                      ? mias.map(({ t, banco }) => {
                          const propia = num(t.tasa_interes);
                          return propia > 0
                            ? `Tu tarjeta ${banco.nombre} tiene ${propia}% (la TEA que registraste): unos S/ ${fmt0(montoOk * (Math.pow(1 + propia / 100, 1 / 12) - 1))} al mes por S/ ${fmt0(montoOk)}.`
                            : `${banco.nombre} cobra ${textoRango(rangoTea(banco.tea_promedio))} (puesto ${puesto(banco.id)} de ${ordenados.length}).`;
                        }).join(' ')
                      : 'Agrega tus tarjetas y verás aquí cuánto te cobra la tuya.'}
                    {' '}Si pagas el total cada mes, la TEA no te afecta.
                  </p>
                </div>
                <label className="lr-amount">
                  <span>Cambia el monto</span>
                  <span className="lr-amount-box">
                    <i>S/</i>
                    <input type="number" inputMode="decimal" min="0" step="100" value={monto} onChange={e => setMonto(e.target.value)} aria-label="Monto de deuda en soles" />
                  </span>
                </label>
              </section>

              {/* ── LISTA DE BANCOS ── */}
              <section className="lr-sec" aria-labelledby="bancos-t">
                <div className="lr-sec-head lr-sec-head--row">
                  <div>
                    <span className="lr-tag">Bancos</span>
                    <h2 id="bancos-t">¿Cuánto cobra cada uno?</h2>
                    <p>TEA aproximada de cada banco e interés de un mes por S/ {fmt0(montoOk)}.</p>
                  </div>
                  <button className="lr-btn lr-btn--soft" onClick={() => setOrdenAsc(!ordenAsc)}>
                    <IcSort /> {ordenAsc ? 'Menor TEA primero' : 'Mayor TEA primero'}
                  </button>
                </div>

                <ul className="lr-banks">
                  {lista.map(b => {
                    const tea = num(b.tea_promedio);
                    const r = rangoTea(tea);
                    const n = nivel(r.centro);
                    const pos = maxTea > minTea ? ((tea - minTea) / (maxTea - minTea)) * 100 : 50;
                    const mio = misBancoIds.has(b.id);
                    return (
                      <li key={b.id} className={mio ? 'is-mine' : ''}>
                        <div className="lr-bank-name">
                          <b>{b.nombre}</b>
                          {mio && <span className="lr-mine">Tu tarjeta</span>}
                        </div>
                        <div className="lr-bank-scale" aria-hidden="true">
                          <div><i style={{ left: `${pos}%` }} className={`is-${n.tono}`} /></div>
                        </div>
                        <div className="lr-bank-tea">
                          <strong>{r.desde}–{r.hasta}%</strong>
                          <span className={`lr-status is-${n.tono}`}>{n.txt}</span>
                        </div>
                        <div className="lr-bank-cost">
                          <strong>{soles(interesMesRango(r, montoOk))}</strong>
                          <small>al mes, aprox.</small>
                        </div>
                      </li>
                    );
                  })}
                </ul>
                {desactualizado && (
                  <p className="lr-note lr-note--warn">
                    Estos rangos se revisaron en {mesRevision()} y pueden haber cambiado. Usa la TEA de tu estado de cuenta para tus cálculos.
                  </p>
                )}
                <p className="lr-note">
                  Rangos <b>aproximados</b> según {REFERENCIA_TEA.fuente}, revisados en {mesRevision()}. Las tasas cambian y la que te apliquen depende de tu perfil y del producto:
                  la exacta está en tu estado de cuenta. Fintú &amp; Co. no está afiliada a ninguna entidad; las marcas pertenecen a sus titulares.
                </p>
              </section>

              {/* ── CÓMO ELEGIR ── */}
              <section className="lr-sec" aria-labelledby="elegir-t">
                <div className="lr-sec-head">
                  <span className="lr-tag">Antes de elegir</span>
                  <h2 id="elegir-t">¿Qué tarjeta te conviene?</h2>
                  <p>Depende de cómo pagas. La TEA es solo una parte.</p>
                </div>
                <div className="lr-grid-3">
                  <article className="lr-card">
                    <h3>Si pagas el total</h3>
                    <p>La TEA casi no te toca. Mira la membresía anual y que los beneficios (millas, cashback) encajen con tus gastos.</p>
                  </article>
                  <article className="lr-card">
                    <h3>Si a veces no llegas al total</h3>
                    <p>La TEA es lo que más pesa. Unos puntos menos pueden ahorrarte cientos de soles al año.</p>
                  </article>
                  <article className="lr-card">
                    <h3>Si es tu primera tarjeta</h3>
                    <p>Busca TEA baja y sin membresía. Si no tienes historial, una tarjeta con garantía es la puerta de entrada.</p>
                  </article>
                </div>
                <button className="lr-btn lr-btn--outline" onClick={() => navigate('/educacion?tab=tcea')}>
                  ¿TEA o TCEA? Entiende la diferencia <IcArrow />
                </button>
              </section>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default Comparador;
