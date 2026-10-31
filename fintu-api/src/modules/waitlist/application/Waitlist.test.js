import { describe, it, expect } from 'vitest';
import JoinWaitlist from './JoinWaitlist';
import LeaveWaitlist from './LeaveWaitlist';

/* Repositorio y correo en memoria */
function crear() {
  const filas = new Map();   // email → token
  const enviados = [];
  const waitlistRepository = {
    async agregar(email, token) {
      if (filas.has(email)) return { nuevo: false, token: filas.get(email) };
      filas.set(email, token);
      return { nuevo: true, token };
    },
    async quitarPorToken(token) {
      for (const [e, t] of filas) if (t === token) { filas.delete(e); return true; }
      return false;
    },
  };
  const mailService = { async sendWaitlistWelcome(datos) { enviados.push(datos); } };
  return {
    filas, enviados,
    join: new JoinWaitlist({ waitlistRepository, mailService }),
    leave: new LeaveWaitlist({ waitlistRepository }),
  };
}

const baseUrl = 'https://api.test';

describe('JoinWaitlist', () => {
  it('rechaza correos inválidos', async () => {
    const { join, filas } = crear();
    expect((await join.execute({ email: 'no-es-correo', baseUrl })).status).toBe('INVALID_EMAIL');
    expect((await join.execute({ email: '', baseUrl })).status).toBe('INVALID_EMAIL');
    expect(filas.size).toBe(0);
  });

  it('guarda el correo normalizado y envía una confirmación con enlace de baja', async () => {
    const { join, filas, enviados } = crear();
    expect((await join.execute({ email: '  Ana@Correo.PE ', baseUrl })).status).toBe('OK');
    expect([...filas.keys()]).toEqual(['ana@correo.pe']);
    expect(enviados).toHaveLength(1);
    expect(enviados[0].enlaceBaja).toMatch(/^https:\/\/api\.test\/api\/lista\/baja\?token=[a-f0-9]{40}$/);
  });

  it('si el correo ya estaba responde igual y no vuelve a escribirle', async () => {
    const { join, enviados } = crear();
    await join.execute({ email: 'ana@correo.pe', baseUrl });
    expect((await join.execute({ email: 'ana@correo.pe', baseUrl })).status).toBe('OK');
    expect(enviados).toHaveLength(1);
  });

  it('si falla el correo, igual queda guardado', async () => {
    const { filas } = crear();
    const join = new JoinWaitlist({
      waitlistRepository: { agregar: async (e, t) => { filas.set(e, t); return { nuevo: true, token: t }; } },
      mailService: { sendWaitlistWelcome: async () => { throw new Error('SMTP caído'); } },
    });
    expect((await join.execute({ email: 'ana@correo.pe', baseUrl })).status).toBe('OK');
    expect(filas.has('ana@correo.pe')).toBe(true);
  });
});

describe('LeaveWaitlist', () => {
  it('borra el correo con el token del enlace', async () => {
    const { join, leave, filas, enviados } = crear();
    await join.execute({ email: 'ana@correo.pe', baseUrl });
    const token = enviados[0].enlaceBaja.split('token=')[1];
    expect((await leave.execute({ token })).status).toBe('OK');
    expect(filas.size).toBe(0);
    expect((await leave.execute({ token })).status).toBe('NOT_FOUND');
  });

  it('rechaza tokens con formato inválido', async () => {
    const { leave } = crear();
    expect((await leave.execute({ token: "x' OR 1=1" })).status).toBe('INVALID_TOKEN');
  });
});
