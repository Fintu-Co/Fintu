/**
 * MIDDLEWARE COMPARTIDO: límites de peticiones (rate limiting).
 *
 * Protege dos cosas distintas:
 *   · apiLimiter  → evita que un cliente abusivo agote el pool de MySQL.
 *   · authLimiter → mucho más estricto en login/registro/recuperación,
 *                   que es donde se intentan ataques de fuerza bruta.
 *
 * Nota: el contador vive en memoria. Con una sola instancia es suficiente;
 * si algún día corres varias detrás de un balanceador, hay que moverlo a Redis.
 */
const rateLimit = require('express-rate-limit');

/* Límite general de la API */
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,        // 1 minuto
  max: 120,                   // 120 peticiones/minuto por IP
  standardHeaders: true,      // cabeceras RateLimit-*
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas peticiones. Espera un momento e intenta de nuevo.',
  },
});

/* Límite estricto para endpoints sensibles de autenticación */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutos
  max: 10,                    // 10 intentos por IP en esa ventana
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // solo cuentan los intentos fallidos
  message: {
    success: false,
    message: 'Demasiados intentos. Vuelve a intentarlo en unos minutos.',
  },
});

module.exports = { apiLimiter, authLimiter };
