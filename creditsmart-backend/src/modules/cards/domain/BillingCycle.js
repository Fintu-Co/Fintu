/**
 * SERVICIO DE DOMINIO: ciclo de facturación de una tarjeta.
 *
 * Lógica pura de fechas (sin BD, sin HTTP). El ciclo se ancla en el CIERRE
 * y es CONTINUO: va del día siguiente al cierre anterior hasta el cierre.
 * Así ningún consumo queda huérfano entre dos estados de cuenta, que es
 * como funcionan las tarjetas reales.
 *
 * `diaInicio` queda como dato informativo de la tarjeta: el inicio se
 * deriva del cierre para que ambos no puedan contradecirse.
 *
 * Espejo de creditsmart-frontend/src/shared/utils/ciclo.js — si cambias
 * uno, cambia el otro.
 *
 * Ejemplo (tarjeta BCP: cierre=25, pago=20):
 *   - Hoy 17 Feb → ciclo 26 Ene → 25 Feb, pago 20 Mar
 *   - Hoy 28 Feb (cierre ya pasó) → ciclo 26 Feb → 25 Mar, pago 20 Abr
 */

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function formatearFecha(fecha) {
  return `${fecha.getDate()} ${MESES[fecha.getMonth()]}`;
}

/** 'YYYY-MM-DD' en hora local. toISOString() pasa a UTC y corre el día. */
function aISO(fecha) {
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

const ultimoDiaDelMes = (anio, mes) => new Date(anio, mes + 1, 0).getDate();

/** Fecha con el día recortado al último real del mes (los 29-31 no existen siempre). */
function diaDelMes(anio, mes, dia) {
  const ref = new Date(anio, mes, 1);
  const a = ref.getFullYear();
  const m = ref.getMonth();
  return new Date(a, m, Math.min(Math.max(dia, 1), ultimoDiaDelMes(a, m)));
}

const soloDia = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

class BillingCycle {
  static calcularActual(diaInicio, diaCierre, diaPago, refDate = new Date()) {
    const hoy = refDate;
    const dC = Number(diaCierre) || Number(diaInicio) || ultimoDiaDelMes(hoy.getFullYear(), hoy.getMonth());
    const dP = Number(diaPago) || dC;

    // Si ya pasó el día de cierre este mes, el cierre vigente es el del próximo
    const cierraEsteMes = hoy.getDate() <= Math.min(dC, ultimoDiaDelMes(hoy.getFullYear(), hoy.getMonth()));
    const fechaCierre = diaDelMes(hoy.getFullYear(), hoy.getMonth() + (cierraEsteMes ? 0 : 1), dC);

    // Inicio: el día siguiente al cierre anterior
    const cierreAnterior = diaDelMes(fechaCierre.getFullYear(), fechaCierre.getMonth() - 1, dC);
    const fechaInicio = new Date(cierreAnterior);
    fechaInicio.setDate(fechaInicio.getDate() + 1);

    // Pago: vence tras el cierre — mismo mes si el día es posterior, el siguiente si no
    const pagoDe = (cierre) =>
      diaDelMes(cierre.getFullYear(), cierre.getMonth() + (dP >= dC ? 0 : 1), dP);

    const fechaPagoDelCiclo = pagoDe(fechaCierre);

    /* ── Pago realmente vigente ──
       Al cerrar un ciclo empiezas a acumular el siguiente, pero sigues
       debiendo el que cerró. El vencimiento que el usuario tiene encima es
       el del ciclo ANTERIOR mientras no haya pasado; si se usara el del
       ciclo que acumula, la cuenta regresiva diría "faltan 32 días" el día
       antes de que le cobren intereses. */
    const cierreAnteriorFecha = cierreAnterior;
    const fechaPagoAnterior = pagoDe(cierreAnteriorFecha);
    const pagoAnteriorVigente = soloDia(fechaPagoAnterior) >= soloDia(hoy);

    const fechaPago = pagoAnteriorVigente ? fechaPagoAnterior : fechaPagoDelCiclo;
    const cierreDelPago = pagoAnteriorVigente ? cierreAnteriorFecha : fechaCierre;

    const enDias = (f) => Math.round((soloDia(f) - soloDia(hoy)) / (1000 * 60 * 60 * 24));

    return {
      // Fechas ISO para la BD
      fecha_inicio: aISO(fechaInicio),
      fecha_cierre: aISO(fechaCierre),
      fecha_pago: aISO(fechaPago),

      // Fechas formateadas para UI
      fecha_inicio_formateada: formatearFecha(fechaInicio),
      fecha_cierre_formateada: formatearFecha(fechaCierre),
      fecha_pago_formateada: formatearFecha(fechaPago),

      // Días restantes
      dias_al_cierre: Math.max(0, enDias(fechaCierre)),
      dias_al_pago: Math.max(0, enDias(fechaPago)),

      /* El pago vigente puede pertenecer al ciclo anterior: en ese caso su
         monto ya está cerrado y no crece con nuevos consumos. */
      pago_es_ciclo_anterior: pagoAnteriorVigente,
      pago_ciclo_cerrado: soloDia(cierreDelPago) < soloDia(hoy),
      pago_ciclo_cierre: aISO(cierreDelPago),

      /* Vencimiento propio del ciclo que acumula. No es el que hay que
         mostrar como cuenta regresiva —para eso está fecha_pago— pero sí
         el que corresponde a fecha_inicio/fecha_cierre. */
      fecha_pago_ciclo: aISO(fechaPagoDelCiclo),

      ciclo_descripcion: `${formatearFecha(fechaInicio)} → ${formatearFecha(fechaCierre)}`,
    };
  }
}

module.exports = BillingCycle;
