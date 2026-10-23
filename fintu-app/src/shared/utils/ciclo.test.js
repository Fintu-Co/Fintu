import { describe, it, expect } from 'vitest';
import { calcularCiclo, proximoPago, saldoPendiente, cicloDeFecha, diaDelMes, aISO } from './ciclo';

/**
 * El ciclo decide qué movimientos entran en el estado de cuenta y qué fecha
 * de pago se le muestra al usuario. Un error aquí no rompe nada visible:
 * simplemente genera un documento financiero incorrecto. De ahí que esto
 * se pruebe por invariantes y no solo con un par de casos sueltos.
 */

/** Mediodía, para que ningún test dependa de la hora. */
const enDia = (iso) => new Date(`${iso}T12:00:00`);

describe('diaDelMes', () => {
  it('recorta los días que no existen en el mes', () => {
    expect(aISO(diaDelMes(2026, 5, 31))).toBe('2026-06-30');   // junio tiene 30
    expect(aISO(diaDelMes(2027, 1, 31))).toBe('2027-02-28');   // febrero común
    expect(aISO(diaDelMes(2028, 1, 31))).toBe('2028-02-29');   // bisiesto
  });

  it('normaliza meses fuera de rango', () => {
    expect(aISO(diaDelMes(2026, 12, 10))).toBe('2027-01-10');
    expect(aISO(diaDelMes(2026, -1, 10))).toBe('2025-12-10');
  });
});

describe('aISO', () => {
  it('usa la fecha local, no UTC', () => {
    // toISOString() daría el día anterior en zonas negativas como Perú
    expect(aISO(new Date(2026, 6, 20, 0, 0, 0))).toBe('2026-07-20');
    expect(aISO(new Date(2026, 0, 1, 23, 59, 59))).toBe('2026-01-01');
  });
});

describe('calcularCiclo — casos concretos', () => {
  const casos = [
    // cierre, pago, hoy,         inicio,       cierre,       pago
    [24, 15, '2026-07-20', '2026-06-25', '2026-07-24', '2026-08-15'],
    [28, 15, '2026-07-20', '2026-06-29', '2026-07-28', '2026-08-15'],
    [15, 25, '2026-07-20', '2026-07-16', '2026-08-15', '2026-08-25'],
    [31,  5, '2026-07-20', '2026-07-01', '2026-07-31', '2026-08-05'],
    [31,  5, '2027-02-20', '2027-02-01', '2027-02-28', '2027-03-05'],
    [30,  5, '2026-03-20', '2026-03-01', '2026-03-30', '2026-04-05'],
    [ 1, 20, '2026-07-20', '2026-07-02', '2026-08-01', '2026-08-20'],
  ];

  it.each(casos)(
    'cierre %i / pago %i, hoy %s → %s .. %s (vence %s)',
    (dC, dP, hoy, inicio, cierre, pago) => {
      const c = calcularCiclo({ dia_cierre_ciclo: dC, dia_pago: dP }, enDia(hoy));
      expect(aISO(c.inicio)).toBe(inicio);
      expect(aISO(c.cierre)).toBe(cierre);
      expect(aISO(c.pago)).toBe(pago);
    }
  );

  it('el día del cierre todavía pertenece al ciclo que cierra', () => {
    const t = { dia_cierre_ciclo: 25, dia_pago: 15 };
    expect(aISO(calcularCiclo(t, enDia('2026-06-25')).cierre)).toBe('2026-06-25');
    // al día siguiente ya arrancó el ciclo nuevo
    expect(aISO(calcularCiclo(t, enDia('2026-06-26')).inicio)).toBe('2026-06-26');
  });

  it('no explota sin días configurados', () => {
    const c = calcularCiclo({}, enDia('2026-07-20'));
    expect(c.inicio).toBeInstanceOf(Date);
    expect(isNaN(c.cierre)).toBe(false);
  });
});

describe('calcularCiclo — invariantes sobre un año completo', () => {
  /* Para cada día de cierre posible, recorriendo los 365 días de 2026. */
  const diasDeCierre = Array.from({ length: 31 }, (_, i) => i + 1);

  it.each(diasDeCierre)('día de cierre %i: hoy siempre cae dentro de su ciclo', (dC) => {
    const t = { dia_cierre_ciclo: dC, dia_pago: dC };
    for (let d = new Date(2026, 0, 1); d < new Date(2027, 0, 1); d.setDate(d.getDate() + 1)) {
      const hoy = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12);
      const c = calcularCiclo(t, hoy);
      const finDelCierre = new Date(c.cierre.getFullYear(), c.cierre.getMonth(), c.cierre.getDate(), 23, 59);
      expect(hoy >= c.inicio && hoy <= finDelCierre, `${aISO(hoy)} fuera de ${aISO(c.inicio)}..${aISO(c.cierre)}`).toBe(true);
    }
  });

  it.each(diasDeCierre)('día de cierre %i: el ciclo dura entre 28 y 31 días', (dC) => {
    const t = { dia_cierre_ciclo: dC, dia_pago: dC };
    for (let d = new Date(2026, 0, 1); d < new Date(2027, 0, 1); d.setDate(d.getDate() + 1)) {
      const c = calcularCiclo(t, new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12));
      const dur = Math.round((c.cierre - c.inicio) / 86400000) + 1;
      expect(dur, `dC=${dC} dur=${dur}`).toBeGreaterThanOrEqual(28);
      expect(dur).toBeLessThanOrEqual(31);
    }
  });

  it.each(diasDeCierre)('día de cierre %i: los ciclos encadenan sin huecos ni solapamientos', (dC) => {
    const t = { dia_cierre_ciclo: dC, dia_pago: dC };
    const porCierre = new Map();

    for (let d = new Date(2026, 0, 1); d < new Date(2027, 0, 1); d.setDate(d.getDate() + 1)) {
      const c = calcularCiclo(t, new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12));
      porCierre.set(aISO(c.cierre), aISO(c.inicio));
    }

    const cierres = [...porCierre.keys()].sort();
    for (let i = 1; i < cierres.length; i++) {
      const siguiente = new Date(`${cierres[i - 1]}T12:00:00`);
      siguiente.setDate(siguiente.getDate() + 1);
      expect(porCierre.get(cierres[i]), `tras cerrar el ${cierres[i - 1]}`).toBe(aISO(siguiente));
    }
  });

  it('el pago nunca vence antes del cierre', () => {
    for (let dC = 1; dC <= 31; dC++) {
      for (const dP of [1, 5, 15, 20, 25, 28, 31]) {
        const c = calcularCiclo({ dia_cierre_ciclo: dC, dia_pago: dP }, enDia('2026-07-20'));
        expect(c.pago >= c.cierre, `dC=${dC} dP=${dP}`).toBe(true);
      }
    }
  });
});

describe('proximoPago — el vencimiento que el usuario tiene encima', () => {
  /* Tarjeta real: cierra el 25, vence el 20 del mes siguiente. */
  const t = { dia_inicio_ciclo: 26, dia_cierre_ciclo: 25, dia_pago: 20 };

  it('REGRESIÓN: el día antes del vencimiento avisa 1 día, no 32', () => {
    // El ciclo cerró el 25/07 y vence el 20/08. El 19/08 la app mostraba
    // el pago del ciclo que acumula (20/09) → "32 días · A tiempo",
    // justo el día antes de que le cobren intereses al usuario.
    const p = proximoPago(t, enDia('2026-08-19'));
    expect(aISO(p.vence)).toBe('2026-08-20');
    expect(p.dias).toBe(1);
  });

  it('mientras el ciclo acumula, el pago es el suyo propio', () => {
    const p = proximoPago(t, enDia('2026-07-25'));   // día del cierre
    expect(aISO(p.vence)).toBe('2026-08-20');
    expect(p.esDelCicloAnterior).toBe(false);
    expect(p.cerrado).toBe(false);                    // aún puede crecer
  });

  it('tras cerrar, el pendiente pasa a ser el del ciclo que cerró', () => {
    const p = proximoPago(t, enDia('2026-07-26'));
    expect(aISO(p.vence)).toBe('2026-08-20');
    expect(aISO(p.cicloCierre)).toBe('2026-07-25');
    expect(p.esDelCicloAnterior).toBe(true);
    expect(p.cerrado).toBe(true);                     // monto ya definido
  });

  it('el día del vencimiento cuenta 0, no salta al siguiente', () => {
    const p = proximoPago(t, enDia('2026-08-20'));
    expect(p.dias).toBe(0);
    expect(aISO(p.vence)).toBe('2026-08-20');
  });

  it('pasado el vencimiento rueda al siguiente pago', () => {
    const p = proximoPago(t, enDia('2026-08-21'));
    expect(aISO(p.vence)).toBe('2026-09-20');
    expect(p.esDelCicloAnterior).toBe(false);
  });

  it('nunca devuelve un vencimiento en el pasado, ningún día del año', () => {
    for (let dC = 1; dC <= 31; dC++) {
      for (const dP of [1, 10, 20, 28]) {
        const card = { dia_cierre_ciclo: dC, dia_pago: dP };
        for (let mes = 0; mes < 12; mes++) {
          for (const dia of [1, 14, 28]) {
            const hoy = new Date(2026, mes, dia, 12);
            const p = proximoPago(card, hoy);
            expect(p.dias, `cierre=${dC} pago=${dP} hoy=${aISO(hoy)}`).toBeGreaterThanOrEqual(0);
          }
        }
      }
    }
  });

  it('el vencimiento nunca queda a más de un ciclo de distancia', () => {
    // Si diera más de ~62 días, es que se saltó un pago intermedio
    for (let dC = 1; dC <= 31; dC++) {
      for (const dP of [1, 10, 20, 28]) {
        const card = { dia_cierre_ciclo: dC, dia_pago: dP };
        for (let mes = 0; mes < 12; mes++) {
          const p = proximoPago(card, new Date(2026, mes, 14, 12));
          expect(p.dias, `cierre=${dC} pago=${dP} mes=${mes + 1}`).toBeLessThanOrEqual(62);
        }
      }
    }
  });

  it('el pago siempre corresponde al ciclo que dice', () => {
    for (let dC = 1; dC <= 31; dC++) {
      const card = { dia_cierre_ciclo: dC, dia_pago: 20 };
      for (let mes = 0; mes < 12; mes++) {
        const p = proximoPago(card, new Date(2026, mes, 14, 12));
        expect(p.vence >= p.cicloCierre, `cierre=${dC} mes=${mes + 1}`).toBe(true);
      }
    }
  });
});

describe('cicloDeFecha — a qué estado de cuenta va un movimiento', () => {
  /* Es lo que promete el indicador del formulario antes de guardar. */
  const t = { dia_inicio_ciclo: 26, dia_cierre_ciclo: 25, dia_pago: 20 };

  it.each([
    ['2026-06-10', '2026-05-26', '2026-06-25', '2026-07-20'],
    ['2026-05-26', '2026-05-26', '2026-06-25', '2026-07-20'],   // primer día
    ['2026-06-25', '2026-05-26', '2026-06-25', '2026-07-20'],   // día del cierre
    ['2026-06-26', '2026-06-26', '2026-07-25', '2026-08-20'],   // uno más y salta
    ['2026-07-20', '2026-06-26', '2026-07-25', '2026-08-20'],
  ])('un movimiento del %s entra en %s – %s y vence el %s', (dia, inicio, cierre, pago) => {
    const c = cicloDeFecha(t, enDia(dia));
    expect(aISO(c.inicio)).toBe(inicio);
    expect(aISO(c.cierre)).toBe(cierre);
    expect(aISO(c.pago)).toBe(pago);
  });

  it('la fecha siempre queda dentro del ciclo que se le anuncia', () => {
    for (let dC = 1; dC <= 31; dC++) {
      const card = { dia_cierre_ciclo: dC, dia_pago: 20 };
      for (let mes = 0; mes < 12; mes++) {
        for (const dia of [1, 9, 17, 25, 28]) {
          const f = new Date(2026, mes, dia, 12);
          const c = cicloDeFecha(card, f);
          const finCierre = new Date(c.cierre.getFullYear(), c.cierre.getMonth(), c.cierre.getDate(), 23, 59);
          expect(f >= c.inicio && f <= finCierre, `cierre=${dC} fecha=${aISO(f)} → ${aISO(c.inicio)}..${aISO(c.cierre)}`).toBe(true);
        }
      }
    }
  });

  it('dos días consecutivos a ambos lados del cierre van a ciclos distintos', () => {
    for (let dC = 1; dC <= 28; dC++) {
      const card = { dia_cierre_ciclo: dC, dia_pago: 20 };
      const cierre = new Date(2026, 5, dC, 12);
      const siguiente = new Date(2026, 5, dC + 1, 12);
      expect(aISO(cicloDeFecha(card, cierre).cierre)).not.toBe(aISO(cicloDeFecha(card, siguiente).cierre));
    }
  });
});

describe('saldoPendiente — solo lo del ciclo que cerró', () => {
  const gasto = (fecha, monto) => ({ tipo: 'gasto', monto, fecha_movimiento: `${fecha} 12:00:00` });
  const pago  = (fecha, monto) => ({ tipo: 'pago',  monto, fecha_movimiento: `${fecha} 12:00:00` });

  const cierre = new Date(2026, 5, 25);   // 25 de junio
  const hoy    = new Date(2026, 6, 20);   // 20 de julio (día del vencimiento)

  it('REGRESIÓN: un gasto de hoy NO cuenta para el ciclo que cerró en junio', () => {
    // El usuario registró 10 el 20/07. Pertenece al ciclo 26/06-25/07, que
    // vence el 20/08. Usar deuda_actual lo atribuía al vencimiento de hoy.
    const r = saldoPendiente([gasto('2026-07-20', 10)], cierre, hoy);
    expect(r.saldo).toBe(0);
  });

  it('cuenta los consumos anteriores al cierre', () => {
    const r = saldoPendiente(
      [gasto('2026-06-01', 100), gasto('2026-06-25', 50), gasto('2026-07-20', 10)],
      cierre, hoy
    );
    expect(r.cargos).toBe(150);
    expect(r.saldo).toBe(150);
  });

  it('el día del cierre entra en el ciclo que cierra', () => {
    const r = saldoPendiente([gasto('2026-06-25', 80)], cierre, hoy);
    expect(r.saldo).toBe(80);
  });

  it('el día siguiente al cierre ya es del ciclo próximo', () => {
    const r = saldoPendiente([gasto('2026-06-26', 80)], cierre, hoy);
    expect(r.saldo).toBe(0);
  });

  it('los pagos posteriores al cierre reducen lo que vence', () => {
    const r = saldoPendiente(
      [gasto('2026-06-10', 200), pago('2026-07-05', 120)],
      cierre, hoy
    );
    expect(r.saldo).toBe(80);
    expect(r.pagosDesdeCierre).toBe(1);
  });

  it('si ya pagaste todo, no queda saldo', () => {
    const r = saldoPendiente(
      [gasto('2026-06-10', 200), pago('2026-07-05', 200), gasto('2026-07-18', 45)],
      cierre, hoy
    );
    expect(r.saldo).toBe(0);           // los 45 de julio son del ciclo siguiente
    expect(r.pagosDesdeCierre).toBe(1);
  });

  it('nunca devuelve saldo negativo por sobrepago', () => {
    const r = saldoPendiente([gasto('2026-06-10', 50), pago('2026-07-05', 500)], cierre, hoy);
    expect(r.saldo).toBe(0);
  });

  it('ignora montos y fechas corruptos sin romperse', () => {
    const r = saldoPendiente(
      [gasto('2026-06-10', 100), { tipo: 'gasto', monto: 'x', fecha_movimiento: '2026-06-11' },
       { tipo: 'gasto', monto: 20, fecha_movimiento: 'basura' }],
      cierre, hoy
    );
    expect(r.saldo).toBe(100);
  });

  it('sin movimientos, saldo cero', () => {
    expect(saldoPendiente([], cierre, hoy).saldo).toBe(0);
    expect(saldoPendiente(undefined, cierre, hoy).saldo).toBe(0);
  });
});

describe('calcularCiclo — navegación entre ciclos (offsetCiclos)', () => {
  it.each([5, 15, 25, 28, 30, 31])(
    'día de cierre %i: los ciclos consecutivos encadenan en ambos sentidos',
    (dC) => {
      const t = { dia_cierre_ciclo: dC, dia_pago: 15 };
      const hoy = enDia('2026-07-20');
      const ciclos = [-2, -1, 0, 1, 2].map((o) => calcularCiclo(t, hoy, o));

      for (let i = 1; i < ciclos.length; i++) {
        const siguiente = new Date(ciclos[i - 1].cierre);
        siguiente.setDate(siguiente.getDate() + 1);
        expect(aISO(ciclos[i].inicio)).toBe(aISO(siguiente));
      }
    }
  );

  it('el offset 0 es el ciclo vigente', () => {
    const t = { dia_cierre_ciclo: 25, dia_pago: 15 };
    const hoy = enDia('2026-07-20');
    expect(aISO(calcularCiclo(t, hoy, 0).cierre)).toBe(aISO(calcularCiclo(t, hoy).cierre));
  });
});
