/**
 * PUERTO: persistencia de usuarios.
 */

/* eslint-disable no-unused-vars */
class UserRepository {
  /** Crea el usuario (y sus 4 slots de tarjeta). Devuelve el id. */
  async create(userData) {
    throw new Error('UserRepository.create no implementado');
  }

  async findByEmail(email) {
    throw new Error('UserRepository.findByEmail no implementado');
  }

  async findById(id) {
    throw new Error('UserRepository.findById no implementado');
  }

  /** Marca el pago y aplica el plan: { plan, acceso_hasta, monto_pagado }. */
  async updatePaymentStatus(userId, paymentId, pago) {
    throw new Error('UserRepository.updatePaymentStatus no implementado');
  }

  /** Fundadores que ya pagaron (incluye a quienes pagaron antes de los planes). */
  async countFundadoresPagados() {
    throw new Error('UserRepository.countFundadoresPagados no implementado');
  }

  /** Usuarios con plan anual cuyo acceso vence en esa fecha (YYYY-MM-DD). */
  async findAnualesQueVencen(fecha) {
    throw new Error('UserRepository.findAnualesQueVencen no implementado');
  }

  async updateSentinelConsulta(userId) {
    throw new Error('UserRepository.updateSentinelConsulta no implementado');
  }

  async getSentinelConsulta(userId) {
    throw new Error('UserRepository.getSentinelConsulta no implementado');
  }

  async saveResetToken(email, token, expiry) {
    throw new Error('UserRepository.saveResetToken no implementado');
  }

  /** Actualiza contraseña y limpia el token de reset. */
  async updatePassword(email, hashedPassword) {
    throw new Error('UserRepository.updatePassword no implementado');
  }

  async getProfile(userId) {
    throw new Error('UserRepository.getProfile no implementado');
  }

  async updateProfile(userId, nombre, apellido) {
    throw new Error('UserRepository.updateProfile no implementado');
  }

  async getPasswordById(userId) {
    throw new Error('UserRepository.getPasswordById no implementado');
  }

  async changePassword(userId, hashedPassword) {
    throw new Error('UserRepository.changePassword no implementado');
  }
}

module.exports = UserRepository;
