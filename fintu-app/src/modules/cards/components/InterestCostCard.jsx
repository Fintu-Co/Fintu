import ImproveCard from './ImproveCard';

const fmt0 = (n) => Math.round(n).toLocaleString('es-PE');

/* ¿Cuánto te cuesta no pagar el total? — interés de un mes con la TEA de la tarjeta */
function InterestCostCard({ tea, deuda, simboloMoneda, onSimular }) {
  const simbolo  = simboloMoneda || 'S/';
  const teaNum   = parseFloat(tea || 0);
  const deudaNum = parseFloat(deuda || 0);

  const base = {
    chip: 'Evita intereses',
    pregunta: '¿Cuánto te cuesta no pagar el total?',
  };

  if (teaNum <= 0) {
    return (
      <ImproveCard
        {...base}
        valor="—"
        detalle="Falta la TEA de esta tarjeta"
        paso="Registra la TEA (está en tu estado de cuenta) para calcular cuánto pagarías de intereses."
      />
    );
  }

  if (deudaNum <= 0) {
    return (
      <ImproveCard
        {...base}
        valor={`${simbolo} 0`}
        tono="good"
        detalle="de intereses"
        paso="No tienes deuda en esta tarjeta. Si usas la tarjeta, paga el total cada mes y seguirás sin pagar intereses."
        cta="Simular pagos"
        onCta={onSimular}
      />
    );
  }

  // TEA → tasa mensual equivalente
  const tasaMes = Math.pow(1 + teaNum / 100, 1 / 12) - 1;
  const interesMes = deudaNum * tasaMes;
  const interesAnio = deudaNum * (teaNum / 100);

  return (
    <ImproveCard
      {...base}
      valor={`~${simbolo} ${fmt0(interesMes)}`}
      tono="warn"
      detalle="de intereses al mes"
      paso={<>Paga el total antes de la fecha de pago y no pagas <strong>nada</strong> de intereses.</>}
      cta="Simular pagos"
      onCta={onSimular}
    >
      <p className="mj-texto">
        Es lo que sumarían los intereses si dejas tus {simbolo} {fmt0(deudaNum)} sin pagar un mes
        (TEA {teaNum}%). En un año serían unos {simbolo} {fmt0(interesAnio)}.
      </p>
    </ImproveCard>
  );
}

export default InterestCostCard;
