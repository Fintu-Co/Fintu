import { describe, it, expect } from 'vitest';
import BillingCycle from './BillingCycle.js';

/**
 * Espejo de creditsmart-frontend/src/shared/utils/ciclo.js.
 * La paridad entre ambos se verifica en el test del frontend
 * (ciclo.paridad.test.js); aquí se prueba el contrato de este lado.
 */

const enDia = (iso) => new Date(`${iso}T12:00:00`);

describe('BillingCycle.calcularActual', () => {
  it('el ciclo es continuo: empieza el día siguiente al cierre anterior', () => {
    const c = BillingCycle.calcularActual(26, 25, 15, enDia('2026-07-20'));
    expect(c.fecha_inicio).toBe('2026-06-26');
    expect(c.fecha_cierre).toBe('2026-07-25');
  });

  it('si hoy ya pasó el día de cierre, el ciclo vigente cierra el mes próximo', () => {
    const c = BillingCycle.calcularActual(16, 15, 25, enDia('2026-07-20'));
    expect(c.fecha_inicio).toBe('2026-07-16');
    expect(c.fecha_cierre).toBe('2026-08-15');
  });

  /* ── Regresiones: los dos bugs que tenía la versión anterior ── */

  it('REGRESIÓN: un ciclo que cabe en un mes no dura 54 días', () => {
    // Antes: inicio se tomaba siempre del mes anterior al cierre → 5 Jun .. 28 Jul
    const c = BillingCycle.calcularActual(5, 28, 15, enDia('2026-07-20'));
    expect(c.fecha_inicio).toBe('2026-06-29');
    expect(c.fecha_cierre).toBe('2026-07-28');

    const dias = Math.round(
      (new Date(c.fecha_cierre) - new Date(c.fecha_inicio)) / 86400000
    ) + 1;
    expect(dias).toBeLessThanOrEqual(31);
  });

  it('REGRESIÓN: el pago del ciclo no se va un mes de más cuando vence tras el cierre', () => {
    // Antes: pago se tomaba siempre del mes siguiente al cierre → 25 Sep
    const c = BillingCycle.calcularActual(16, 15, 25, enDia('2026-07-20'));
    expect(c.fecha_cierre).toBe('2026-08-15');
    expect(c.fecha_pago_ciclo).toBe('2026-08-25');
  });

  /* ── Pago vigente: alimenta el KPI del dashboard y las alertas de Goals ── */

  it('REGRESIÓN: la víspera del vencimiento avisa 1 día, no 32', () => {
    // Ciclo cerrado el 25/07 que vence el 20/08. Antes se devolvía el pago
    // del ciclo que acumula (20/09) y el dashboard mostraba "32 días · A tiempo"
    // el día antes de que al usuario le cobraran intereses.
    const c = BillingCycle.calcularActual(26, 25, 20, enDia('2026-08-19'));
    expect(c.fecha_pago).toBe('2026-08-20');
    expect(c.dias_al_pago).toBe(1);
    expect(c.pago_es_ciclo_anterior).toBe(true);
    expect(c.pago_ciclo_cerrado).toBe(true);
  });

  it('tras cerrar, el pendiente es el del ciclo que cerró', () => {
    const c = BillingCycle.calcularActual(26, 25, 20, enDia('2026-07-26'));
    expect(c.fecha_cierre).toBe('2026-08-25');      // el que acumula
    expect(c.pago_ciclo_cierre).toBe('2026-07-25'); // el que se debe
    expect(c.fecha_pago).toBe('2026-08-20');
  });

  it('mientras el ciclo acumula, el monto aún no está cerrado', () => {
    const c = BillingCycle.calcularActual(26, 25, 20, enDia('2026-07-25'));
    expect(c.pago_ciclo_cerrado).toBe(false);
    expect(c.pago_es_ciclo_anterior).toBe(false);
  });

  it('pasado el vencimiento rueda al siguiente, sin saltarse ninguno', () => {
    const c = BillingCycle.calcularActual(26, 25, 20, enDia('2026-08-21'));
    expect(c.fecha_pago).toBe('2026-09-20');
    expect(c.dias_al_pago).toBe(30);
  });

  it('el vencimiento vigente nunca queda a más de un ciclo de distancia', () => {
    for (let dC = 1; dC <= 31; dC++) {
      for (const dP of [1, 10, 20, 28]) {
        for (let mes = 0; mes < 12; mes++) {
          const c = BillingCycle.calcularActual(1, dC, dP, new Date(2026, mes, 14, 12));
          expect(c.dias_al_pago, `cierre=${dC} pago=${dP} mes=${mes + 1}`).toBeLessThanOrEqual(62);
        }
      }
    }
  });

  /* ── Días que no existen en todos los meses ── */

  it('recorta el día 31 en meses de 30 días en vez de desbordar', () => {
    const c = BillingCycle.calcularActual(1, 31, 5, enDia('2026-06-15'));
    expect(c.fecha_cierre).toBe('2026-06-30');
  });

  it('recorta el día 31 en febrero', () => {
    const c = BillingCycle.calcularActual(1, 31, 5, enDia('2027-02-15'));
    expect(c.fecha_cierre).toBe('2027-02-28');
  });

  /* ── Zona horaria ── */

  it('devuelve fechas locales (toISOString correría el día en Perú)', () => {
    const c = BillingCycle.calcularActual(26, 25, 15, enDia('2026-07-20'));
    expect(c.fecha_cierre).toBe('2026-07-25');
    expect(c.fecha_inicio).toBe('2026-06-26');
  });

  /* ── Contrato de salida: lo consumen el dashboard, el resumen y Goals ── */

  it('mantiene todas las claves que espera el frontend', () => {
    const c = BillingCycle.calcularActual(26, 25, 15, enDia('2026-07-20'));
    for (const clave of [
      'fecha_inicio', 'fecha_cierre', 'fecha_pago',
      'fecha_inicio_formateada', 'fecha_cierre_formateada', 'fecha_pago_formateada',
      'dias_al_cierre', 'dias_al_pago', 'ciclo_descripcion',
      'pago_es_ciclo_anterior', 'pago_ciclo_cerrado', 'pago_ciclo_cierre', 'fecha_pago_ciclo',
    ]) {
      expect(c, `falta ${clave}`).toHaveProperty(clave);
    }
    expect(c.ciclo_descripcion).toBe('26 Jun → 25 Jul');
  });

  it('los días restantes se cuentan por día calendario', () => {
    const c = BillingCycle.calcularActual(26, 25, 15, enDia('2026-07-20'));
    expect(c.dias_al_cierre).toBe(5);    // 20 → 25 jul
    expect(c.dias_al_pago).toBe(26);     // 20 jul → 15 ago
  });

  it('nunca devuelve días negativos', () => {
    for (let dC = 1; dC <= 31; dC++) {
      const c = BillingCycle.calcularActual(1, dC, dC, enDia('2026-07-20'));
      expect(c.dias_al_cierre).toBeGreaterThanOrEqual(0);
      expect(c.dias_al_pago).toBeGreaterThanOrEqual(0);
    }
  });

  it('hoy siempre cae dentro del ciclo vigente, todo el año', () => {
    for (let dC = 1; dC <= 31; dC++) {
      for (let mes = 0; mes < 12; mes++) {
        for (const dia of [1, 15, 28]) {
          const hoy = new Date(2026, mes, dia, 12);
          const c = BillingCycle.calcularActual(1, dC, dC, hoy);
          const hoyISO = `2026-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
          expect(
            hoyISO >= c.fecha_inicio && hoyISO <= c.fecha_cierre,
            `${hoyISO} fuera de ${c.fecha_inicio}..${c.fecha_cierre} (cierre=${dC})`
          ).toBe(true);
        }
      }
    }
  });
});
