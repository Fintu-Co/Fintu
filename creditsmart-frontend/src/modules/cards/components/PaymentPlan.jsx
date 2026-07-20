import './PaymentPlan.css';

/**
 * "¿Cuánto pagar este ciclo?"
 *
 * Traduce la deuda, la línea y la TEA en tres montos accionables:
 *   1. Pago total      → cero intereses
 *   2. Uso saludable   → dejar la deuda en 30% de la línea (score)
 *   3. Pago mínimo     → solo evita mora, con el costo real que implica
 */

/* ── SVG icons ── */
const IcCheck = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>);
const IcTarget = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>);
const IcWarn = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IcParty = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/><polyline points="8 12 11 15 16 9"/></svg>);
const IcArrow = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>);

function PaymentPlan({ deuda, linea, pagoMinimo, tea, simboloMoneda, onVerCalculadora }) {
  const simbolo = simboloMoneda || 'S/';
  const deudaNum = parseFloat(deuda || 0);
  const lineaNum = parseFloat(linea || 0);
  const pagoMin  = parseFloat(pagoMinimo || 0);
  const teaNum   = parseFloat(tea || 0);

  const fmt = (n) => parseFloat(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt0 = (n) => Math.round(n).toLocaleString('es-PE');

  /* ── Sin deuda: estado positivo ── */
  if (deudaNum <= 0) {
    return (
      <div className="pp-wrap pp-clear">
        <div className="pp-clear-icon"><IcParty /></div>
        <div className="pp-clear-body">
          <h3>Estás al día · nada que pagar</h3>
          <p>
            Tu tarjeta no tiene deuda este ciclo, así que no pagarás <strong>ni un sol de intereses</strong>. Pero recuerda que usar tu tarjeta de forma responsable es clave para mantener un buen historial crediticio.
          </p>
        </div>
      </div>
    );
  }

  /* ── Montos ── */
  const umbral30      = lineaNum * 0.30;
  const yaSaludable   = deudaNum <= umbral30;
  const pagoSaludable = Math.max(0, deudaNum - umbral30);

  /* ── Proyección del pago mínimo (TEA → tasa mensual efectiva) ──
     Se simula mes a mes: el último pago es parcial, así que multiplicar
     mínimo × meses sobreestimaría los intereses. */
  const iMensual = teaNum > 0 ? Math.pow(1 + teaNum / 100, 1 / 12) - 1 : 0;
  let proyeccion = null;
  if (pagoMin > 0 && iMensual > 0) {
    const interesMes = deudaNum * iMensual;
    if (pagoMin <= interesMes) {
      // El mínimo no cubre ni los intereses: la deuda nunca baja.
      proyeccion = { imposible: true, interesMes };
    } else {
      let saldo = deudaNum;
      let meses = 0;
      let pagado = 0;
      while (saldo > 0.01 && meses < 600) {
        saldo = saldo * (1 + iMensual);
        const pago = Math.min(pagoMin, saldo);
        saldo -= pago;
        pagado += pago;
        meses++;
      }
      proyeccion = { imposible: false, meses, interesTotal: Math.max(0, pagado - deudaNum) };
    }
  }

  const tiers = [
    {
      id: 'total',
      Icon: IcCheck,
      tono: 'good',
      label: 'Pago total',
      badge: 'Sin intereses',
      monto: deudaNum,
      desc: 'Pagas el 100% de tu deuda. La TEA nunca se aplica.',
      recomendado: true,
    },
    {
      id: 'sano',
      Icon: IcTarget,
      tono: 'warn',
      label: 'Uso saludable',
      badge: 'Sube tu score',
      monto: pagoSaludable,
      desc: yaSaludable
        ? `Tu deuda ya está bajo el 30% de tu línea (${simbolo} ${fmt0(umbral30)}). No necesitas pagar de más.`
        : `Deja tu deuda en ${simbolo} ${fmt0(umbral30)} (30% de tu línea), el rango ideal para tu score.`,
      libre: yaSaludable,
    },
    {
      id: 'minimo',
      Icon: IcWarn,
      tono: 'danger',
      label: 'Pago mínimo',
      badge: 'Solo evita mora',
      monto: pagoMin,
      desc: pagoMin > 0
        ? 'Cubre la mora, pero el resto sigue generando intereses todos los días.'
        : 'No registraste el pago mínimo de tu tarjeta.',
      sinDato: pagoMin <= 0,
    },
  ];

  return (
    <div className="pp-wrap">
      <div className="pp-head">
        <div>
          <h3 className="pp-title">¿Cuánto pagar este ciclo?</h3>
          <p className="pp-sub">Tres opciones según tu deuda de {simbolo} {fmt(deudaNum)}{teaNum > 0 && ` · TEA ${teaNum}%`}</p>
        </div>
        {onVerCalculadora && (
          <button className="pp-calc-btn" onClick={onVerCalculadora}>
            Simular en detalle <IcArrow />
          </button>
        )}
      </div>

      <div className="pp-tiers">
        {tiers.map((t) => (
          <div key={t.id} className={`pp-tier pp-tier-${t.tono}${t.recomendado ? ' pp-tier-reco' : ''}`}>
            {t.recomendado && <span className="pp-reco-tag">Recomendado</span>}

            <div className="pp-tier-top">
              <span className={`pp-tier-icon pp-icon-${t.tono}`}><t.Icon /></span>
              <span className={`pp-tier-badge pp-badge-${t.tono}`}>{t.badge}</span>
            </div>

            <span className="pp-tier-label">{t.label}</span>
            <span className={`pp-tier-monto pp-monto-${t.tono}`}>
              {t.sinDato ? '—' : t.libre ? '¡Ya estás!' : `${simbolo} ${fmt(t.monto)}`}
            </span>
            <p className="pp-tier-desc">{t.desc}</p>

            {/* Costo real del mínimo */}
            {t.id === 'minimo' && proyeccion && (
              <div className="pp-proy">
                {proyeccion.imposible ? (
                  <>
                    <strong>Tu mínimo no cubre ni los intereses</strong>
                    <span>Solo en intereses se suman ~{simbolo} {fmt0(proyeccion.interesMes)} al mes, así tu deuda crecería.</span>
                  </>
                ) : (
                  <>
                    <strong>Pagando solo el mínimo: {proyeccion.meses} {proyeccion.meses === 1 ? 'mes' : 'meses'}</strong>
                    <span>Terminarías pagando ~{simbolo} {fmt0(proyeccion.interesTotal)} extra solo en intereses.</span>
                  </>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default PaymentPlan;
