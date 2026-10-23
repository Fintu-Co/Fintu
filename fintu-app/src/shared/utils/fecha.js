/**
 * Parseo de fechas del backend SIN corrimiento por zona horaria.
 *
 * El backend envía fechas de día (fecha_inicio/cierre/pago) como "YYYY-MM-DD".
 * `new Date("YYYY-MM-DD")` las interpreta como medianoche UTC, y al mostrarlas
 * en una zona negativa (Perú = UTC-5) `.getDate()` devuelve el día anterior.
 *
 * `parseISODate` toma la parte de fecha y construye un Date en hora LOCAL,
 * así el día mostrado coincide con el que se guardó.
 */
export function parseISODate(value) {
  if (value == null) return null;
  if (value instanceof Date) return value;
  if (typeof value === 'string') {
    const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }
  return new Date(value);
}

const MESES_CORTO = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/** Formatea una fecha del backend como "26 Jul" (sin corrimiento de zona). */
export function formatearFechaCorta(value, fallback = '—') {
  const d = parseISODate(value);
  if (!d || isNaN(d)) return fallback;
  return `${d.getDate()} ${MESES_CORTO[d.getMonth()]}`;
}

export default parseISODate;
