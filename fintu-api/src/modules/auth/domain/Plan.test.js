import { describe, it, expect } from 'vitest';
import Plan from './Plan';

const cfg = { limite: 100, precioFundador: 5, precioAnual: 10 };

describe('Plan.config', () => {
  it('usa los valores por defecto', () => {
    expect(Plan.config({})).toEqual({ limite: 100, precioFundador: 5, precioAnual: 10 });
  });
  it('acepta PAYPAL_EXPECTED_USD como precio de fundador', () => {
    expect(Plan.config({ PAYPAL_EXPECTED_USD: '5.00' }).precioFundador).toBe(5);
    expect(Plan.config({ PRECIO_FUNDADOR_USD: '6', PRECIO_ANUAL_USD: '12', FUNDADORES_LIMITE: '50' }))
      .toEqual({ limite: 50, precioFundador: 6, precioAnual: 12 });
  });
});

describe('Plan.ofertaVigente', () => {
  it('ofrece fundador mientras queden cupos', () => {
    expect(Plan.ofertaVigente(0, cfg)).toMatchObject({ plan: 'fundador', precio: 5, quedan: 100 });
    expect(Plan.ofertaVigente(99, cfg)).toMatchObject({ plan: 'fundador', quedan: 1 });
  });
  it('desde el usuario 101 ofrece el plan anual', () => {
    expect(Plan.ofertaVigente(100, cfg)).toMatchObject({ plan: 'anual', precio: 10, quedan: 0 });
    expect(Plan.ofertaVigente(250, cfg)).toMatchObject({ plan: 'anual', quedan: 0 });
  });
});

describe('Plan.montoValido', () => {
  it('exige al menos el precio de la oferta', () => {
    expect(Plan.montoValido(5, 5)).toBe(true);
    expect(Plan.montoValido(10, 10)).toBe(true);
    expect(Plan.montoValido(5, 10)).toBe(false);   // pagar $5 cuando ya toca anual
    expect(Plan.montoValido(NaN, 5)).toBe(false);
  });
});

describe('Plan.accesoHasta', () => {
  const hoy = new Date(2026, 9, 30);
  it('fundador no vence', () => {
    expect(Plan.accesoHasta('fundador', hoy)).toBeNull();
  });
  it('anual: un año desde hoy', () => {
    expect(Plan.accesoHasta('anual', hoy)).toEqual(new Date(2027, 9, 30));
  });
  it('renovar antes de vencer suma un año al vencimiento, no a hoy', () => {
    expect(Plan.accesoHasta('anual', hoy, '2026-11-15')).toEqual(new Date(2027, 10, 15));
  });
  it('renovar ya vencido cuenta desde hoy', () => {
    expect(Plan.accesoHasta('anual', hoy, '2026-01-10')).toEqual(new Date(2027, 9, 30));
  });
});

describe('Plan.accesoVigente', () => {
  const hoy = new Date(2026, 9, 30);
  it('sin pago no entra', () => {
    expect(Plan.accesoVigente({ ha_pagado: 0 }, hoy)).toBe(false);
  });
  it('fundador y usuarios anteriores a los planes entran siempre', () => {
    expect(Plan.accesoVigente({ ha_pagado: 1, plan: 'fundador' }, hoy)).toBe(true);
    expect(Plan.accesoVigente({ ha_pagado: 1, plan: null }, hoy)).toBe(true);
  });
  it('anual entra hasta el día de vencimiento inclusive', () => {
    expect(Plan.accesoVigente({ ha_pagado: 1, plan: 'anual', acceso_hasta: '2026-10-30' }, hoy)).toBe(true);
    expect(Plan.accesoVigente({ ha_pagado: 1, plan: 'anual', acceso_hasta: '2026-10-29' }, hoy)).toBe(false);
    expect(Plan.accesoVigente({ ha_pagado: 1, plan: 'anual', acceso_hasta: null }, hoy)).toBe(false);
  });
});

describe('Plan.motivoPago', () => {
  it('distingue renovar de pago pendiente', () => {
    expect(Plan.motivoPago({ ha_pagado: 1, plan: 'anual' })).toBe('RENOVAR');
    expect(Plan.motivoPago({ ha_pagado: 0 })).toBe('PAGO_PENDIENTE');
  });
});
