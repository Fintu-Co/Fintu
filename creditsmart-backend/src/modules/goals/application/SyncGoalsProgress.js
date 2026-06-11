/**
 * CASO DE USO: Sincronizar el progreso de todos los objetivos del usuario
 * contra el estado real de sus tarjetas.
 *
 * La regla de CÓMO evoluciona cada tipo de objetivo vive en la entidad
 * (Goal.evaluarContraTarjeta); aquí solo se orquesta:
 *   cargar → evaluar → persistir → devolver estado fresco.
 */
const Goal = require('../domain/Goal');

class SyncGoalsProgress {
  constructor({ goalRepository, cardProvider }) {
    this.goalRepository = goalRepository;
    this.cardProvider = cardProvider;
  }

  async execute(usuarioId) {
    const objetivos = await this.goalRepository.findActiveByUserId(usuarioId);
    const tarjetas = await this.cardProvider.getByUserId(usuarioId);

    for (const row of objetivos) {
      if (row.completado) continue;

      const goal = Goal.fromRow(row);
      const tarjeta = goal.tarjetaId
        ? tarjetas.find((t) => t.id === goal.tarjetaId)
        : null;

      const { nuevoProgreso, debeCompletarse } = goal.evaluarContraTarjeta(tarjeta);

      await this.goalRepository.updateProgress(goal.id, usuarioId, nuevoProgreso);
      if (debeCompletarse) {
        await this.goalRepository.markCompleted(goal.id, usuarioId);
      }
    }

    const objetivosActualizados = await this.goalRepository.findActiveByUserId(usuarioId);
    const completados = await this.goalRepository.findCompletedByUserId(usuarioId);
    return { objetivos: objetivosActualizados, completados };
  }
}

module.exports = SyncGoalsProgress;
