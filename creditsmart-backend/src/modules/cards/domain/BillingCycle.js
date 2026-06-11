/**
 * SERVICIO DE DOMINIO: ciclo de facturación de una tarjeta.
 *
 * Lógica pura de fechas (sin BD, sin HTTP). Calcula, a partir de los
 * días configurados (inicio, cierre, pago), las fechas reales del ciclo
 * vigente y los días restantes. Extraído de Card.calcularCicloActual
 * con comportamiento idéntico.
 *
 * Ejemplo (tarjeta BCP: inicio=26, cierre=25, pago=20):
 *   - Hoy 17 Feb → ciclo 26 Ene → 25 Feb, pago 20 Mar
 *   - Hoy 28 Feb (cierre ya pasó) → ciclo 26 Feb → 25 Mar, pago 20 Abr
 */

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatearFecha(fecha) {
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]}`;
}

class BillingCycle {
  static calcularActual(diaInicio, diaCierre, diaPago) {
    const hoy = new Date();
    const mesActual = hoy.getMonth(); // 0-11
    const anioActual = hoy.getFullYear();
    const diaHoy = hoy.getDate();

    // Determinar el mes del cierre actual
    let mesCierre = mesActual;
    let anioCierre = anioActual;

    // Si ya pasó el día de cierre este mes, el cierre actual es el próximo mes
    if (diaHoy > diaCierre) {
      mesCierre = mesActual + 1;
      if (mesCierre > 11) {
        mesCierre = 0;
        anioCierre++;
      }
    }

    const fechaCierre = new Date(anioCierre, mesCierre, diaCierre);

    // Inicio del ciclo: mes anterior al cierre
    let mesInicio = mesCierre - 1;
    let anioInicio = anioCierre;
    if (mesInicio < 0) {
      mesInicio = 11;
      anioInicio--;
    }
    const fechaInicio = new Date(anioInicio, mesInicio, diaInicio);

    // Pago: mes siguiente al cierre
    let mesPago = mesCierre + 1;
    let anioPago = anioCierre;
    if (mesPago > 11) {
      mesPago = 0;
      anioPago++;
    }
    const fechaPago = new Date(anioPago, mesPago, diaPago);

    const diasAlCierre = Math.ceil((fechaCierre - hoy) / (1000 * 60 * 60 * 24));
    const diasAlPago = Math.ceil((fechaPago - hoy) / (1000 * 60 * 60 * 24));

    return {
      // Fechas ISO para la BD
      fecha_inicio: fechaInicio.toISOString().split('T')[0],
      fecha_cierre: fechaCierre.toISOString().split('T')[0],
      fecha_pago: fechaPago.toISOString().split('T')[0],

      // Fechas formateadas para UI
      fecha_inicio_formateada: formatearFecha(fechaInicio),
      fecha_cierre_formateada: formatearFecha(fechaCierre),
      fecha_pago_formateada: formatearFecha(fechaPago),

      // Días restantes
      dias_al_cierre: Math.max(0, diasAlCierre),
      dias_al_pago: Math.max(0, diasAlPago),

      ciclo_descripcion: `${formatearFecha(fechaInicio)} → ${formatearFecha(fechaCierre)}`,
    };
  }
}

module.exports = BillingCycle;
