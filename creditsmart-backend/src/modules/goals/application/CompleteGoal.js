/**
 * CASO DE USO: Marcar un objetivo como completado.
 */
class CompleteGoal {
  constructor({ goalRepository }) {
    this.goalRepository = goalRepository;
  }

  async execute({ objetivo_id, usuario_id }) {
    return this.goalRepository.markCompleted(objetivo_id, usuario_id);
  }
}

module.exports = CompleteGoal;
