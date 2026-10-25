import { describe, it, expect } from 'vitest';
import { rangoTea, textoRango, interesMesRango, rangoMercado, mesesDesdeRevision } from './teaAprox';

describe('rangoTea', () => {
  it.each([
    [91.45, 90, 95], [72.5, 70, 75], [45.5, 45, 50], [85, 85, 90], [84.99, 80, 85],
  ])('%f → %i–%i', (p, d, h) => {
    expect(rangoTea(p)).toMatchObject({ desde: d, hasta: h, centro: d + 2.5 });
  });
  it('sin dato no hay rango', () => {
    expect(rangoTea(0)).toBeNull();
    expect(rangoTea('abc')).toBeNull();
  });
  it('el promedio siempre queda dentro de su banda', () => {
    for (let p = 10; p < 200; p += 0.37) {
      const r = rangoTea(p);
      expect(p).toBeGreaterThanOrEqual(r.desde);
      expect(p).toBeLessThan(r.hasta);
    }
  });
});

describe('textoRango', () => {
  it('se lee como aproximado', () => expect(textoRango(rangoTea(91.45))).toBe('aprox. 90–95%'));
});

describe('interesMesRango', () => {
  it('el mínimo es menor que el máximo y escala con el monto', () => {
    const r = interesMesRango(rangoTea(91.45), 1000);
    expect(r.min).toBeLessThan(r.max);
    expect(r.min).toBeCloseTo(1000 * (Math.pow(1.9, 1 / 12) - 1), 6);
    expect(interesMesRango(rangoTea(91.45), 2000).max).toBeCloseTo(r.max * 2, 6);
  });
});

describe('rangoMercado', () => {
  it('va de la banda más baja a la más alta', () => {
    const m = rangoMercado([91.45, 45.5, 72.5]);
    expect(m.baja).toEqual({ desde: 45, hasta: 50 });
    expect(m.alta).toEqual({ desde: 90, hasta: 95 });
    expect(m.promedio.desde).toBe(65);   // promedio 69.8 → 65–70
  });
});

describe('mesesDesdeRevision', () => {
  it('cuenta meses calendario', () => {
    expect(mesesDesdeRevision(new Date(2026, 9, 24), '2026-07')).toBe(3);
    expect(mesesDesdeRevision(new Date(2027, 0, 5), '2026-07')).toBe(6);
  });
});
