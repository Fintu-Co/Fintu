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
require('./shared/infrastructure/database'); // inicializa el pool y prueba conexión

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

// Rutas
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/movements', movementRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/goals', goalRoutes);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
