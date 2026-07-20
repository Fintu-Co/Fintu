/**
 * CreditSmart PE — API
 *
 * Arquitectura DDD pragmática por módulos:
 *   src/modules/<dominio>/{domain, application, infrastructure, interfaces}
 *   src/shared/            → base de datos y middleware transversales
 *
 * Cada módulo expone sus rutas desde interfaces/, donde también
 * se cablean sus dependencias (composition root por módulo).
 */
const express = require('express');
const cors = require('cors');
require('dotenv').config();
// El pool se crea dentro de initDatabase, DESPUÉS de asegurar que la base exista
const initDatabase = require('./shared/infrastructure/initDatabase'); // crea base y tablas si faltan
const { startScheduler } = require('./shared/infrastructure/scheduler');
const { apiLimiter, authLimiter } = require('./shared/middleware/rateLimit');

// Rutas por módulo
const authRoutes = require('./modules/auth/interfaces/authRoutes');
const cardRoutes = require('./modules/cards/interfaces/cardRoutes');
const movementRoutes = require('./modules/movements/interfaces/movementRoutes');
const analyticsRoutes = require('./modules/analytics/interfaces/analyticsRoutes');
const goalRoutes = require('./modules/goals/interfaces/goalRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck
app.get('/', (req, res) => {
  res.json({ message: 'CreditSmart PE API funcionando correctamente' });
});

// Rutas — authLimiter es más estricto (fuerza bruta); apiLimiter protege el resto
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/cards', apiLimiter, cardRoutes);
app.use('/api/movements', apiLimiter, movementRoutes);
app.use('/api/analytics', apiLimiter, analyticsRoutes);
app.use('/api/goals', apiLimiter, goalRoutes);

// Iniciar servidor — primero asegura que las tablas existan
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
      startScheduler(); // limpieza automática de movimientos antiguos
    });
  })
  .catch((err) => {
    console.error('❌ No se pudo inicializar la base de datos:', err.message);
    process.exit(1); // no arrancar sin base de datos lista
  });
