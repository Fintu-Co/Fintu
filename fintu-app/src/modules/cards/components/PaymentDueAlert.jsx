import { proximoPago, saldoPendiente } from '@/shared/utils/ciclo';
import './PaymentDueAlert.css';

/**
 * Aviso del pago que vence.
 *
 * Aparece cuando el ciclo ya cerró y queda saldo de ESE ciclo: en ese momento
 * el monto está definido y no crece con nuevos consumos. Antes del cierre no
 * se muestra, porque ahí la guía correcta es la de PaymentPlan.
 *
 * Ojo con el monto: NO es `deuda_actual`. Ese campo es un saldo corriente que
 * incluye lo que llevas gastado del ciclo en curso, y esos consumos vencen el
 * mes siguiente, no en este pago. El saldo se calcula desde los movimientos.
 *
 * @param {Object} tarjeta      datos de la tarjeta
 * @param {Array}  movimientos  historial; null mientras carga
 */

const IcAlert = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>);
const IcClock = () => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>);

const MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function PaymentDueAlert({ tarjeta, movimientos = null }) {
  const simbolo = tarjeta?.simbolo_moneda || 'S/';
  const minimo  = parseFloat(tarjeta?.pago_minimo || 0);
  const tea     = parseFloat(tarjeta?.tasa_interes || 0);

  /* Sin historial no se puede saber cuánto de la deuda es de este ciclo. */
  if (!tarjeta || !movimientos) return null;

  const pago = proximoPago(tarjeta);

  /* Mientras el ciclo siga acumulando, el monto aún puede cambiar: la guía
     de PaymentPlan es más útil que una cuenta regresiva. */
  if (!pago.cerrado) return null;

  const { saldo: deuda, pagosDesdeCierre } = saldoPendiente(movimientos, pago.cicloCierre);

  /* Nada que vencer: lo que se debe pertenece al ciclo que aún acumula. */
  if (deuda <= 0) return null;

  const fmt  = (n) => parseFloat(n).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmt0 = (n) => Math.round(n).toLocaleString('es-PE');
  const fechaLarga = (d) => `${d.getDate()} de ${MESES[d.getMonth()]}`;

  /* Intereses de un mes si no paga: misma tasa mensual efectiva que usan
     PaymentPlan y el PDF, para que los tres digan lo mismo. */
  const iMensual = tea > 0 ? Math.pow(1 + tea / 100, 1 / 12) - 1 : 0;
  const interesMes = deuda * iMensual;

  const { dias } = pago;
  const tono = dias <= 0 ? 'critico' : dias <= 3 ? 'urgente' : dias <= 7 ? 'atencion' : 'aviso';

  const titulo =
    dias === 0 ? 'Tu pago vence hoy'
    : dias === 1 ? 'Tu pago vence mañana'
    : dias < 0 ? 'Tu pago está vencido'
    : `Te quedan ${dias} días para pagar`;

  const sinPagos = pagosDesdeCierre === 0;

  return (
    <div className={`pda-wrap pda-${tono}`}>
      <span className="pda-icon">{dias <= 3 ? <IcAlert /> : <IcClock />}</span>

      <div className="pda-body">
        <h3 className="pda-title">{titulo}</h3>

        <p className="pda-lead">
          Corresponde al ciclo <strong>{fechaLarga(pago.cicloInicio)} – {fechaLarga(pago.cicloCierre)}</strong>,
          que cerró con <strong>{simbolo} {fmt(deuda)}</strong>. Lo que gastes después de esa
          fecha se paga el mes siguiente.
        </p>

        <div className="pda-montos">
          <div className="pda-monto pda-monto-reco">
            <span className="pda-monto-label">Para no pagar intereses</span>
            <span className="pda-monto-valor">{simbolo} {fmt(deuda)}</span>
            <span className="pda-monto-hint">El total de tu deuda</span>
          </div>

          <div className="pda-monto">
            <span className="pda-monto-label">Mínimo para evitar mora</span>
            <span className="pda-monto-valor">{minimo > 0 ? `${simbolo} ${fmt(minimo)}` : '—'}</span>
            <span className="pda-monto-hint">
              {minimo > 0 ? 'El resto seguirá generando intereses' : 'No registrado en la app'}
            </span>
          </div>
        </div>

        {tea > 0 && (
          <p className="pda-consecuencia">
            Si no pagas el total, sobre el saldo restante se te cobrará la TEA de{' '}
            <strong>{tea}%</strong> — alrededor de <strong>{simbolo} {fmt0(interesMes)}</strong> de
            intereses el primer mes, y seguirá corriendo cada día.
          </p>
        )}

        {sinPagos && (
          <p className="pda-nota">
            No has registrado ningún pago desde que cerró el ciclo. Si ya pagaste,
            regístralo para que tu deuda quede al día.
          </p>
        )}
      </div>
    </div>
  );
}

export default PaymentDueAlert;
