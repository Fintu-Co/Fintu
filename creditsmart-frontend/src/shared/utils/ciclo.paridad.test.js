import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { calcularCiclo, proximoPago, aISO } from './ciclo';

/**
 * El ciclo está implementado dos veces —aquí y en el backend— porque cada
 * paquete se despliega por separado. Este test es lo único que impide que
 * vuelvan a divergir: ya pasó una vez, y produjo un calendario que mostraba
 * ciclos de 54 días y fechas de pago con un mes de retraso.
 *
 * Si tocas ciclo.js, toca también BillingCycle.js (y al revés).
 */

const aquí = path.dirname(fileURLToPath(import.meta.url));
const rutaBackend = path.resolve(
  aquí,
  '../../../../creditsmart-backend/src/modules/cards/domain/BillingCycle.js'
);

/* En un checkout solo-frontend el backend no está: se omite en vez de fallar. */
const hayBackend = existsSync(rutaBackend);
const BillingCycle = hayBackend ? createRequire(import.meta.url)(rutaBackend) : null;

describe.skipIf(!hayBackend)('paridad frontend ↔ backend', () => {
  /* Ojo: `fecha_pago` del backend es el pago VIGENTE (puede ser el del ciclo
     anterior). El vencimiento propio del ciclo que acumula es
     `fecha_pago_ciclo`, y ese es el que corresponde a calcularCiclo().pago. */
  it('las tres fechas del ciclo coinciden en todas las combinaciones de días', () => {
    const diasDePago = [1, 5, 15, 20, 25, 28, 31];
    const discrepancias = [];
    let comparaciones = 0;

    for (let dC = 1; dC <= 31; dC++) {
      for (const dP of diasDePago) {
        for (let mes = 0; mes < 12; mes++) {
          for (const dia of [1, 14, 28]) {
            const hoy = new Date(2026, mes, dia, 12);

            const front = calcularCiclo({ dia_cierre_ciclo: dC, dia_pago: dP }, hoy);
            // El backend aún recibe diaInicio, pero lo ignora: el ciclo se
            // ancla en el cierre. Se pasa un valor cualquiera a propósito.
            const back = BillingCycle.calcularActual(26, dC, dP, hoy);

            comparaciones++;
            if (
              aISO(front.inicio) !== back.fecha_inicio ||
              aISO(front.cierre) !== back.fecha_cierre ||
              aISO(front.pago) !== back.fecha_pago_ciclo
            ) {
              discrepancias.push(
                `cierre=${dC} pago=${dP} hoy=${aISO(hoy)}\n` +
                `  front: ${aISO(front.inicio)}..${aISO(front.cierre)} pago ${aISO(front.pago)}\n` +
                `  back : ${back.fecha_inicio}..${back.fecha_cierre} pago ${back.fecha_pago_ciclo}`
              );
            }
          }
        }
      }
    }

    expect(comparaciones).toBeGreaterThan(7000);
    expect(discrepancias.slice(0, 5).join('\n'), `${discrepancias.length} discrepancias`).toBe('');
  });

  it('el backend tampoco desborda los días 29-31', () => {
    // cierre 31 en un mes de 30 días: debe recortarse, no saltar al siguiente
    const b = BillingCycle.calcularActual(1, 31, 5, new Date(2026, 5, 15, 12));
    expect(b.fecha_cierre).toBe('2026-06-30');
  });

  it('el backend devuelve fechas locales, no corridas por UTC', () => {
    const b = BillingCycle.calcularActual(26, 25, 15, new Date(2026, 6, 20, 12));
    expect(b.fecha_cierre).toBe('2026-07-25');
    expect(b.fecha_inicio).toBe('2026-06-26');
  });

  it('el pago vigente coincide en ambos lados, todos los días del año', () => {
    const discrepancias = [];

    for (let dC = 1; dC <= 31; dC++) {
      for (const dP of [1, 10, 20, 28]) {
        for (let mes = 0; mes < 12; mes++) {
          for (const dia of [1, 14, 20, 28]) {
            const hoy = new Date(2026, mes, dia, 12);

            const front = proximoPago({ dia_cierre_ciclo: dC, dia_pago: dP }, hoy);
            const back = BillingCycle.calcularActual(26, dC, dP, hoy);

            if (
              aISO(front.vence) !== back.fecha_pago ||
              front.dias !== back.dias_al_pago ||
              front.esDelCicloAnterior !== back.pago_es_ciclo_anterior ||
              front.cerrado !== back.pago_ciclo_cerrado
            ) {
              discrepancias.push(
                `cierre=${dC} pago=${dP} hoy=${aISO(hoy)}\n` +
                `  front: vence ${aISO(front.vence)} en ${front.dias}d, anterior=${front.esDelCicloAnterior}, cerrado=${front.cerrado}\n` +
                `  back : vence ${back.fecha_pago} en ${back.dias_al_pago}d, anterior=${back.pago_es_ciclo_anterior}, cerrado=${back.pago_ciclo_cerrado}`
              );
            }
          }
        }
      }
    }

    expect(discrepancias.slice(0, 5).join('\n'), `${discrepancias.length} discrepancias`).toBe('');
  });

  it('REGRESIÓN: el backend tampoco anuncia 32 días la víspera del pago', () => {
    // dias_al_pago alimenta el KPI del dashboard y las alertas de Goals
    const b = BillingCycle.calcularActual(26, 25, 20, new Date(2026, 7, 19, 12));
    expect(b.fecha_pago).toBe('2026-08-20');
    expect(b.dias_al_pago).toBe(1);
  });
});
