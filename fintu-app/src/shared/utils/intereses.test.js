import { describe, it, expect } from 'vitest';
import { tasaMensual, simularPagos, textoMeses } from './intereses';

describe('tasaMensual', () => {
  it('12 meses de la tasa mensual dan la TEA', () => {
    expect(Math.pow(1 + tasaMensual(60), 12) - 1).toBeCloseTo(0.6, 10);
  });
  it('sin TEA no hay interés', () => {
    expect(tasaMensual(0)).toBe(0);
    expect(tasaMensual(undefined)).toBe(0);
  });
});

describe('simularPagos', () => {
  it('pagar todo de una vez cuesta un mes de interés', () => {
    const d = 1000, tea = 60;
    const r = simularPagos(d, tea, d * (1 + tasaMensual(tea)));
    expect(r.meses).toBe(1);
    expect(r.intereses).toBeCloseTo(d * tasaMensual(tea), 6);
  });

  it('un pago que no cubre el interés nunca termina', () => {
    const r = simularPagos(1000, 60, 10);
    expect(r.imposible).toBe(true);
    expect(r.meses).toBe(Infinity);
  });

  it('pagar más termina antes y cuesta menos', () => {
    const lento = simularPagos(2000, 80, 120);
    const rapido = simularPagos(2000, 80, 240);
    expect(rapido.meses).toBeLessThan(lento.meses);
    expect(rapido.intereses).toBeLessThan(lento.intereses);
  });

  it('el saldo final llega a cero y hay un saldo por mes', () => {
    const r = simularPagos(1500, 70, 200);
    expect(r.saldos).toHaveLength(r.meses + 1);
    expect(r.saldos.at(-1)).toBeLessThan(0.02);
    expect(r.totalPagado).toBeCloseTo(1500 + r.intereses, 6);
  });

  it('sin TEA, la deuda se paga sin intereses', () => {
    const r = simularPagos(600, 0, 200);
    expect(r.meses).toBe(3);
    expect(r.intereses).toBeCloseTo(0, 6);
  });
});

describe('textoMeses', () => {
  it.each([
    [1, '1 mes'], [8, '8 meses'], [12, '1 año'], [15, '1 año y 3 meses'], [25, '2 años y 1 mes'],
  ])('%i → %s', (m, t) => expect(textoMeses(m)).toBe(t));
  it('infinito → nunca', () => expect(textoMeses(Infinity)).toBe('nunca'));
});
