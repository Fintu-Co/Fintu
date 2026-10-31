/**
 * CASO DE USO: darse de baja de la lista. Borra el correo (derecho de
 * cancelación, Ley 29733): no queda guardado en ningún lado.
 */
class LeaveWaitlist {
  constructor({ waitlistRepository }) {
    this.waitlistRepository = waitlistRepository;
  }

  async execute({ token }) {
    if (!token || !/^[a-f0-9]{40}$/.test(token)) return { status: 'INVALID_TOKEN' };
    const borrado = await this.waitlistRepository.quitarPorToken(token);
    return { status: borrado ? 'OK' : 'NOT_FOUND' };
  }
}

module.exports = LeaveWaitlist;
