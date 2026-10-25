import { describe, it, expect } from 'vitest';
import { planDeudas, soloMinimos, mesesDesde, tarjetasParaPlan } from './planDeudas';
import { simularPagos } from './intereses';

const bcp = { id: 1, nombre: 'BCP', deuda: 1000, tea: 90, minimo: 60 };
const ibk = { id: 2, nombre: 'Interbank', deuda: 800, tea: 60, minimo: 50 };

describe('planDeudas', () => {
  it('sin deuda no hay plan', () => {
    expect(planDeudas([{ ...bcp, deuda: 0 }], 300).estado).toBe('sin_deuda');
  });

  it('avisa si el monto no cubre los mínimos', () => {
    const r = planDeudas([bcp, ibk], 100);
    expect(r.estado).toBe('no_alcanza_minimos');
    expect(r.minimosTotal).toBeCloseTo(110, 6);
  });

  it('el extra va a la TEA más alta y las demás reciben el mínimo', () => {
    const r = planDeudas([ibk, bcp], 400);
    expect(r.estado).toBe('ok');
    const pBcp = r.primerMes.find((x) => x.id === 1);
    const pIbk = r.primerMes.find((x) => x.id === 2);
    expect(pIbk.pago).toBeCloseTo(50, 6);
    expect(pBcp.pago).toBeCloseTo(350, 6);
    expect(pBcp.prioridad).toBe(true);
    expect(r.primerMes[0].id).toBe(1);   // ordenado por prioridad
  });

  it('una sola tarjeta coincide con la calculadora', () => {
    const r = planDeudas([bcp], 200);
    const c = simularPagos(1000, 90, 200);
    expect(r.meses).toBe(c.meses);
    expect(r.intereses).toBeCloseTo(c.intereses, 4);
  });

  it('la deuda total baja mes a mes hasta cero y cada tarjeta tiene su mes de fin', () => {
    const r = planDeudas([bcp, ibk], 400);
    for (let k = 1; k < r.saldos.length; k++) expect(r.saldos[k]).toBeLessThan(r.saldos[k - 1]);
    expect(r.saldos.at(-1)).toBeLessThan(0.02);
    expect(r.terminaMes[1]).toBeLessThanOrEqual(r.terminaMes[2]);   // la cara termina primero
    expect(Math.max(...Object.values(r.terminaMes))).toBe(r.meses);
  });

  it('si alcanza para todo, termina este mes sin intereses', () => {
    const r = planDeudas([bcp, ibk], 1800);
    expect(r).toMatchObject({ estado: 'ok', meses: 1, intereses: 0 });
    expect(r.primerMes.map((x) => x.pago)).toEqual([1000, 800]);
  });

  it('pagar más termina antes y cuesta menos', () => {
    const a = planDeudas([bcp, ibk], 300);
    const b = planDeudas([bcp, ibk], 600);
    expect(b.meses).toBeLessThan(a.meses);
    expect(b.intereses).toBeLessThan(a.intereses);
  });

  it('sin mínimo registrado usa el interés del mes y lo marca como estimado', () => {
    const r = planDeudas([{ ...bcp, minimo: 0 }, ibk], 300);
    expect(r.estado).toBe('ok');
    expect(r.primerMes.find((x) => x.id === 1).minimoEstimado).toBe(true);
    expect(r.primerMes.find((x) => x.id === 2).minimoEstimado).toBe(false);
  });

  it('avalancha cuesta menos intereses que repartir solo los mínimos', () => {
    const plan = planDeudas([bcp, ibk], 110);   // exactamente los mínimos
    const sm = soloMinimos([bcp, ibk]);
    expect(plan.intereses).toBeLessThanOrEqual(sm.intereses + 0.01);
  });
});

describe('soloMinimos', () => {
  it('null si falta un mínimo', () => {
    expect(soloMinimos([bcp, { ...ibk, minimo: 0 }])).toBeNull();
  });
  it('toma el plazo de la tarjeta más lenta', () => {
    const r = soloMinimos([bcp, ibk]);
    expect(r.meses).toBe(Math.max(simularPagos(1000, 90, 60).meses, simularPagos(800, 60, 50).meses));
  });
});

describe('mesesDesde', () => {
  it('cuenta meses completos', () => {
    expect(mesesDesde('2026-03-10', new Date(2026, 3, 9))).toBe(0);
    expect(mesesDesde('2026-03-10', new Date(2026, 3, 10))).toBe(1);
    expect(mesesDesde('2026-03-10', new Date(2027, 2, 15))).toBe(12);
  });
});

describe('tarjetasParaPlan', () => {
  it('ignora espacios vacíos y normaliza números', () => {
    const r = tarjetasParaPlan([
      { id: 1, esta_vacia: 0, banco_nombre: 'BCP', deuda_actual: '100.50', tasa_interes: '80', pago_minimo: null },
      { id: 2, esta_vacia: 1 },
    ]);
    expect(r).toEqual([{ id: 1, nombre: 'BCP', deuda: 100.5, tea: 80, minimo: 0 }]);
  });
});
