const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/database');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const cardRoutes = require('./routes/cardRoutes'); 
const movementRoutes = require('./routes/movementRoutes'); 
const analyticsRoutes = require('./routes/analyticsRoutes');
const goalRoutes = require('./routes/goalRoutes');


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


// Rutas
app.get('/', (req, res) => {
  res.json({ message: 'CreditSmart PE API funcionando correctamente' });
});

// Rutas de autenticación
app.use('/api/auth', authRoutes);
app.use('/api/cards', cardRoutes);


app.use('/api/movements', movementRoutes); 
app.use('/api/analytics', analyticsRoutes);
app.use('/api/goals', goalRoutes);


// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});
