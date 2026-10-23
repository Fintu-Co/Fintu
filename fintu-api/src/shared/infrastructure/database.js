/**
 * INFRAESTRUCTURA COMPARTIDA: pool de conexiones MySQL.
 * Único punto de acceso a la base de datos para todos los módulos.
 */
const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  waitForConnections: true,
  // Ajustable por entorno. Súbelo si crece el tráfico, pero nunca por encima
  // del max_connections de tu servidor MySQL (dividido entre tus instancias).
  connectionLimit: Number(process.env.DB_POOL_SIZE) || 25,
  queueLimit: 0,
  enableKeepAlive: true,      // evita que el proveedor corte conexiones inactivas
  keepAliveInitialDelay: 10000,
});

// Convertir a promesas
const promisePool = pool.promise();

// Probar conexión
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Error conectando a MySQL:', err.message);
  } else {
    console.log('✅ Conectado a MySQL correctamente');
    connection.release();
  }
});

module.exports = promisePool;
