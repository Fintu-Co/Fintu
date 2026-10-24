import ImproveCard from './ImproveCard';
import { puntualidad, proximoPago } from '@/shared/utils/ciclo';

const fmt0 = (n) => Math.round(n).toLocaleString('es-PE');
const fecha = (d) => d.toLocaleDateString('es-PE', { day: 'numeric', month: 'long' });
const mes = (d) => d.toLocaleDateString('es-PE', { month: 'short' }).replace('.', '');

/* ¿Pagas a tiempo? — sale de tus movimientos: ciclo por ciclo, ¿quedó en cero al vencer? */
function OnTimeCard({ tarjeta, movimientos, simboloMoneda, onRegistrarPago }) {
  const simbolo = simboloMoneda || 'S/';

  const base = {
    chip: 'Cuida tu historial',
    pregunta: '¿Pagas a tiempo?',
    cta: 'Registrar un pago',
    onCta: onRegistrarPago,
  };

  if (movimientos === null) {
    return <ImproveCard {...base} valor="…" detalle="Revisando tus pagos" />;
  }

  const { evaluados, aTiempo, ciclos } = puntualidad(tarjeta, movimientos);

  if (evaluados === 0) {
    const { vence } = proximoPago(tarjeta);
    return (
      <ImproveCard
        {...base}
        valor="—"
        detalle="Aún no vence ningún pago"
        paso={`Cuando venza tu primer pago (${fecha(vence)}), verás aquí si lo cubriste a tiempo.`}
      />
    );
  }

  const ultimo = ciclos[0];
  const tono = aTiempo === evaluados ? 'good' : aTiempo === 0 ? 'bad' : 'warn';

  const paso = ultimo.aTiempo
    ? (aTiempo === evaluados
        ? 'Vas perfecto. Sigue pagando el total antes de cada fecha de pago.'
        : 'Tu último pago fue completo y a tiempo. Mantén ese hábito.')
    : `Tu pago del ${fecha(ultimo.pago)} quedó con ${simbolo} ${fmt0(ultimo.saldo)} sin cubrir. Págalo pronto para dejar de sumar intereses.`;

  return (
    <ImproveCard
      {...base}
      valor={`${aTiempo} de ${evaluados}`}
      tono={tono}
      detalle={evaluados === 1 ? 'pago completo a tiempo' : 'pagos completos a tiempo'}
      paso={paso}
    >
      <ol className="mj-ciclos" aria-label="Tus últimos pagos">
        {[...ciclos].reverse().map((c) => (
          <li key={c.pago.toISOString()} className={c.aTiempo ? 'ok' : 'no'}
              title={c.aTiempo ? `Pagado a tiempo (${fecha(c.pago)})` : `Quedaron ${simbolo} ${fmt0(c.saldo)} al ${fecha(c.pago)}`}>
            <span className="mj-ciclo-dot">{c.aTiempo ? '✓' : '!'}</span>
            <span className="mj-ciclo-mes">{mes(c.pago)}</span>
          </li>
        ))}
      </ol>
      <p className="mj-texto">
        Pagar el total a tiempo evita intereses. Si no cubres ni el mínimo, queda como atraso en las centrales de riesgo.
      </p>
    </ImproveCard>
  );
}

export default OnTimeCard;
