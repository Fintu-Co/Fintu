/**
 * INFRAESTRUCTURA COMPARTIDA: tareas programadas.
 *
 * Hasta ahora la limpieza de movimientos antiguos (retención: 12 meses)
 * solo corría si alguien llamaba a mano a POST /api/movements/cleanup,
 * así que en la práctica la tabla `movimientos` crecía sin límite.
 * Aquí se ejecuta sola.
 *
 * Se usa setInterval en vez de un cron externo para no añadir dependencias.
 * Si algún día corres varias instancias, deja esto activo en UNA sola
 * (variable RUN_JOBS=false en las demás): el DELETE es idempotente, pero
 * no tiene sentido repetirlo N veces.
 */
const CleanupOldMovements = require('../../modules/movements/application/CleanupOldMovements');
const MySqlMovementRepository = require('../../modules/movements/infrastructure/MySqlMovementRepository');

const UN_DIA_MS = 24 * 60 * 60 * 1000;
const RETRASO_INICIAL_MS = 60 * 1000; // 1 min tras arrancar, para no competir con el boot

async function limpiarMovimientosAntiguos() {
  try {
    const cleanup = new CleanupOldMovements({
      movementRepository: new MySqlMovementRepository(),
    });
    const eliminados = await cleanup.execute();
    if (eliminados > 0) {
      console.log(`🧹 Limpieza automática: ${eliminados} movimientos antiguos eliminados`);
    }
  } catch (error) {
    // Nunca debe tumbar el servidor: se registra y se reintenta al día siguiente.
    console.error('⚠️  Falló la limpieza automática de movimientos:', error.message);
  }
}

function startScheduler() {
  if (process.env.RUN_JOBS === 'false') {
    console.log('⏭️  Tareas programadas desactivadas (RUN_JOBS=false)');
    return;
  }

  setTimeout(limpiarMovimientosAntiguos, RETRASO_INICIAL_MS);
  setInterval(limpiarMovimientosAntiguos, UN_DIA_MS);

  console.log('⏰ Tareas programadas activas (limpieza de movimientos: cada 24 h)');
}

module.exports = { startScheduler };
