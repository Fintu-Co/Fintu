/**
 * TEA de mercado como RANGO APROXIMADO, no como cifra exacta.
 *
 * Las tasas de los bancos cambian y no las actualizamos todos los días.
 * Mostrar "BCP 91.45%" promete una precisión que no tenemos; "aprox. 90–95%"
 * enseña lo mismo sin afirmar la tasa exacta de nadie. La TEA exacta es la
 * que el usuario registra de su estado de cuenta.
 */

import { tasaMensual } from './intereses';

/** De dónde salen las tasas de referencia y cuándo se revisaron. */
export const REFERENCIA_TEA = {
  fuente: 'datos públicos de la SBS',
  revisado: '2026-07',           // ⚠️ actualizar al revisar las tasas (AAAA-MM)
  vigenciaMeses: 6,              // pasado esto, la página avisa que pueden estar desactualizadas
};

const ANCHO = 5;

/** Promedio del banco → banda de 5 puntos que lo contiene: 91.45 → 90–95. */
export function rangoTea(promedio) {
  const p = parseFloat(promedio);
  if (!(p > 0)) return null;
  const desde = Math.floor(p / ANCHO) * ANCHO;
  return { desde, hasta: desde + ANCHO, centro: desde + ANCHO / 2 };
}

/** "aprox. 90–95%" */
export function textoRango(r) {
  return r ? `aprox. ${r.desde}–${r.hasta}%` : '';
}

/** Interés de un mes sobre `monto` en los extremos del rango. */
export function interesMesRango(r, monto) {
  const m = parseFloat(monto) || 0;
  if (!r) return { min: 0, max: 0 };
  return { min: m * tasaMensual(r.desde), max: m * tasaMensual(r.hasta) };
}

/** Rango de todo el mercado: de la banda más baja a la más alta. */
export function rangoMercado(promedios) {
  const rs = promedios.map(rangoTea).filter(Boolean);
  if (!rs.length) return null;
  return {
    baja: { desde: Math.min(...rs.map(r => r.desde)), hasta: Math.min(...rs.map(r => r.hasta)) },
    alta: { desde: Math.max(...rs.map(r => r.desde)), hasta: Math.max(...rs.map(r => r.hasta)) },
    promedio: rangoTea(promedios.reduce((s, p) => s + parseFloat(p), 0) / promedios.length),
  };
}

/** Meses desde la última revisión de las tasas de referencia. */
export function mesesDesdeRevision(hoy = new Date(), revisado = REFERENCIA_TEA.revisado) {
  const [a, m] = revisado.split('-').map(Number);
  return (hoy.getFullYear() - a) * 12 + (hoy.getMonth() + 1 - m);
}

/** "julio 2026" */
export function mesRevision(revisado = REFERENCIA_TEA.revisado) {
  const [a, m] = revisado.split('-').map(Number);
  return new Date(a, m - 1, 1).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' }).replace(' de ', ' ');
}
