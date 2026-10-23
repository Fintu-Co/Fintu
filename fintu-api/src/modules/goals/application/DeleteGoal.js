/**
 * CASO DE USO: Abandonar (desactivar) un objetivo.
 * Es soft-delete: la fila queda en BD con activo = FALSE.
 */
class DeleteGoal {
  constructor({ goalRepository }) {
    this.goalRepository = goalRepository;
  }

  async execute({ objetivo_id, usuario_id }) {
    return this.goalRepository.deactivate(objetivo_id, usuario_id);
  }
}

module.exports = DeleteGoal;
