/**
 * CASO DE USO: Actualizar manualmente el progreso de un objetivo.
 */
class UpdateGoalProgress {
  constructor({ goalRepository }) {
    this.goalRepository = goalRepository;
  }

  async execute({ objetivo_id, usuario_id, progreso }) {
    return this.goalRepository.updateProgress(objetivo_id, usuario_id, progreso);
  }
}

module.exports = UpdateGoalProgress;
