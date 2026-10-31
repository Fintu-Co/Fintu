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
const SendRenewalReminders = require('../../modules/auth/application/SendRenewalReminders');
const MySqlUserRepository = require('../../modules/auth/infrastructure/MySqlUserRepository');
const NodemailerMailService = require('../../modules/auth/infrastructure/NodemailerMailService');

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

/* Recordatorio por correo 7 días antes de que venza un plan anual */
async function recordarRenovaciones() {
  try {
    const job = new SendRenewalReminders({
      userRepository: new MySqlUserRepository(),
      mailService: new NodemailerMailService(),
    });
    const enviados = await job.execute();
    if (enviados > 0) console.log(`📧 Recordatorios de renovación enviados: ${enviados}`);
  } catch (error) {
    console.error('⚠️  Fallaron los recordatorios de renovación:', error.message);
  }
}

function startScheduler() {
  if (process.env.RUN_JOBS === 'false') {
    console.log('⏭️  Tareas programadas desactivadas (RUN_JOBS=false)');
    return;
  }

  setTimeout(limpiarMovimientosAntiguos, RETRASO_INICIAL_MS);
  setInterval(limpiarMovimientosAntiguos, UN_DIA_MS);
  setTimeout(recordarRenovaciones, RETRASO_INICIAL_MS);
  setInterval(recordarRenovaciones, UN_DIA_MS);

  console.log('⏰ Tareas programadas activas (limpieza de movimientos y recordatorios de renovación: cada 24 h)');
}

module.exports = { startScheduler };
