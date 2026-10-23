/**
 * PUERTO (interfaz): GoalRepository
 *
 * Define QUÉ necesita el dominio para persistir objetivos,
 * sin decir CÓMO se implementa (MySQL, Postgres, memoria…).
 * La implementación concreta vive en infrastructure/.
 *
 * JS no tiene interfaces nativas; usamos una clase base cuyos
 * métodos lanzan error si la implementación no los define.
 */

/* eslint-disable no-unused-vars */
class GoalRepository {
  /** Objetivos activos del usuario (incluye en-progreso). */
  async findActiveByUserId(userId) {
    throw new Error('GoalRepository.findActiveByUserId no implementado');
  }

  /** Últimos objetivos completados del usuario. */
  async findCompletedByUserId(userId) {
    throw new Error('GoalRepository.findCompletedByUserId no implementado');
  }

  /** Cantidad de objetivos activos no completados. */
  async countActiveByUserId(userId) {
    throw new Error('GoalRepository.countActiveByUserId no implementado');
  }

  /** Persiste un objetivo nuevo. Devuelve el id insertado. */
  async create(userId, data) {
    throw new Error('GoalRepository.create no implementado');
  }

  /** Actualiza el progreso. Devuelve true si afectó una fila. */
  async updateProgress(goalId, userId, nuevoProgreso) {
    throw new Error('GoalRepository.updateProgress no implementado');
  }

  /** Marca como completado. Devuelve true si afectó una fila. */
  async markCompleted(goalId, userId) {
    throw new Error('GoalRepository.markCompleted no implementado');
  }

  /** Desactiva (soft-delete). Devuelve true si afectó una fila. */
  async deactivate(goalId, userId) {
    throw new Error('GoalRepository.deactivate no implementado');
  }
}

module.exports = GoalRepository;
