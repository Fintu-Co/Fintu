import { describe, it, expect } from 'vitest';
import Movement from './Movement.js';

/**
 * normalizarFecha es la única barrera entre el cliente y la columna
 * fecha_movimiento: decide en qué estado de cuenta cae cada consumo.
 * Un corrimiento de un día lo manda al ciclo equivocado.
 */

const ahora = new Date(2026, 6, 20, 9, 30, 0);   // lun 20 jul 2026, 09:30 local

/** 'YYYY-MM-DD HH:mm' en local, para comprobar que no hubo corrimiento. */
const fmt = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` +
  ` ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

describe('Movement.tipoValido / montoValido', () => {
  it('solo acepta gasto y pago', () => {
    expect(Movement.tipoValido('gasto')).toBe(true);
    expect(Movement.tipoValido('pago')).toBe(true);
    expect(Movement.tipoValido('transferencia')).toBe(false);
    expect(Movement.tipoValido('')).toBe(false);
  });

  it('exige monto mayor a 0', () => {
    expect(Movement.montoValido(0.01)).toBe(true);
    expect(Movement.montoValido(0)).toBe(false);
    expect(Movement.montoValido(-5)).toBe(false);
  });
});

describe('Movement.normalizarFecha', () => {
  it('guarda el día elegido, sin corrimiento de zona horaria', () => {
    // new Date('2026-06-25') es medianoche UTC: en Perú sería el 24 a las 19:00
    for (const dia of ['2026-07-15', '2026-06-25', '2026-05-01']) {
      const r = Movement.normalizarFecha(dia, ahora);
      expect(r.ok).toBe(true);
      expect(fmt(r.fecha).startsWith(dia), `${dia} → ${fmt(r.fecha)}`).toBe(true);
    }
  });

  it('un día pasado se ancla al mediodía, lejos de cualquier borde', () => {
    const r = Movement.normalizarFecha('2026-07-15', ahora);
    expect(fmt(r.fecha)).toBe('2026-07-15 12:00');
  });

  it('si es hoy conserva la hora real, para que ordene entre los del día', () => {
    const r = Movement.normalizarFecha('2026-07-20', ahora);
    expect(fmt(r.fecha)).toBe('2026-07-20 09:30');
  });

  it('sin fecha usa el momento actual', () => {
    for (const vacío of [undefined, null, '']) {
      const r = Movement.normalizarFecha(vacío, ahora);
      expect(r.ok).toBe(true);
      expect(r.fecha).toBe(ahora);
    }
  });

  /* ── Rechazos ── */

  it('rechaza fechas futuras', () => {
    for (const futura of ['2026-07-21', '2027-01-01']) {
      const r = Movement.normalizarFecha(futura, ahora);
      expect(r.ok).toBe(false);
      expect(r.message).toMatch(/futura/i);
    }
  });

  it('rechaza fechas más antiguas que el tope de retroactividad', () => {
    const r = Movement.normalizarFecha('2026-01-01', ahora);
    expect(r.ok).toBe(false);
    expect(r.message).toMatch(/antigüedad/i);
  });

  it('rechaza basura y fechas imposibles', () => {
    for (const mala of ['no-es-fecha', '2026-13-45', '/*/*/']) {
      expect(Movement.normalizarFecha(mala, ahora).ok, mala).toBe(false);
    }
  });

  it('el límite de retroactividad es exacto', () => {
    const límite = new Date(2026, 6, 20);
    límite.setDate(límite.getDate() - Movement.DIAS_RETRO_MAX);
    const iso = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    expect(Movement.normalizarFecha(iso(límite), ahora).ok, 'día 90 debe entrar').toBe(true);

    const unoMás = new Date(límite);
    unoMás.setDate(unoMás.getDate() - 1);
    expect(Movement.normalizarFecha(iso(unoMás), ahora).ok, 'día 91 debe rechazarse').toBe(false);
  });

  it('el tope queda holgadamente dentro de la retención de la limpieza', () => {
    // CleanupOldMovements borra a los 12 meses: un movimiento recién creado
    // nunca debe nacer ya caducado.
    expect(Movement.DIAS_RETRO_MAX).toBeLessThan(365);
  });

  it('acepta un Date directamente', () => {
    const r = Movement.normalizarFecha(new Date(2026, 6, 18, 8, 0), ahora);
    expect(r.ok).toBe(true);
    expect(fmt(r.fecha)).toBe('2026-07-18 08:00');
  });
});

describe('Movement.derivarCiclo', () => {
  it('deriva mes y año de la fecha del movimiento', () => {
    const { ciclo_mes, ciclo_anio } = Movement.derivarCiclo(new Date(2026, 5, 25, 12));
    expect(ciclo_mes).toBe(6);
    expect(ciclo_anio).toBe(2026);
  });
});
