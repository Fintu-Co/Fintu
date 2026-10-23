/**
 * INFRAESTRUCTURA COMPARTIDA: inicialización idempotente de la base de datos.
 *
 * Se ejecuta al arrancar el servidor y garantiza que TODO exista,
 * sin tocar los datos ya presentes:
 *   · CREATE DATABASE IF NOT EXISTS → crea la base si no existe
 *   · CREATE TABLE IF NOT EXISTS    → crea solo las tablas que falten
 *   · INSERT IGNORE en bancos       → siembra los bancos solo si no están
 *
 * Gracias a esto, cualquier entorno nuevo (Railway, otra PC, un compañero)
 * levanta el backend y la base se auto-construye. No depende de correr
 * schema.sql a mano.
 */
const mysql = require('mysql2/promise');

/**
 * Crea la base de datos si no existe, conectándose SIN seleccionar base.
 * Si el usuario MySQL no tiene permiso de CREATE (algunos hosts gestionados
 * ya entregan la base creada), se ignora el error y se continúa.
 */
async function ensureDatabase() {
  const dbName = process.env.DB_NAME;
  if (!/^[A-Za-z0-9_$]+$/.test(dbName || '')) {
    throw new Error(`DB_NAME inválido: "${dbName}"`);
  }
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
  });
  try {
    await conn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`
    );
  } catch (err) {
    console.warn(`⚠️  No se pudo crear la base "${dbName}" (${err.code}); se asume que ya existe.`);
  } finally {
    await conn.end();
  }
}

/* Orden respetando las foreign keys: primero las tablas sin dependencias. */
const tablas = [
  `CREATE TABLE IF NOT EXISTS usuarios (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    ha_pagado TINYINT(1) DEFAULT 0,
    fecha_registro TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_pago TIMESTAMP NULL DEFAULT NULL,
    paypal_payment_id VARCHAR(100) DEFAULT NULL COMMENT 'ID de transacción PayPal',
    monto_pagado DECIMAL(10,2) DEFAULT 4.00 COMMENT 'Monto pagado en USD',
    ultima_consulta_sentinel DATETIME DEFAULT NULL,
    reset_token VARCHAR(10) DEFAULT NULL,
    reset_token_expiry DATETIME DEFAULT NULL,
    PRIMARY KEY (id),
    UNIQUE KEY email (email)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  `CREATE TABLE IF NOT EXISTS bancos (
    id INT NOT NULL AUTO_INCREMENT,
    nombre VARCHAR(50) NOT NULL,
    tasa_interes_mensual DECIMAL(5,2) DEFAULT NULL,
    tasa_interes_anual DECIMAL(5,2) DEFAULT NULL,
    logo_url VARCHAR(255) DEFAULT NULL,
    tea_minima DECIMAL(5,2) DEFAULT 0.00,
    tea_maxima DECIMAL(5,2) DEFAULT 0.00,
    tea_promedio DECIMAL(5,2) DEFAULT 0.00,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  `CREATE TABLE IF NOT EXISTS tarjetas (
    id INT NOT NULL AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    slot_numero INT NOT NULL,
    esta_vacia TINYINT(1) DEFAULT 1,
    banco_id INT DEFAULT NULL,
    banco_nombre_custom VARCHAR(100) DEFAULT NULL,
    nombre_tarjeta VARCHAR(100) DEFAULT NULL,
    linea_credito DECIMAL(10,2) DEFAULT NULL,
    deuda_actual DECIMAL(10,2) DEFAULT 0.00,
    pago_minimo DECIMAL(10,2) DEFAULT 0.00,
    moneda VARCHAR(50) DEFAULT 'PEN',
    simbolo_moneda VARCHAR(5) DEFAULT 'S/',
    dia_inicio_ciclo INT DEFAULT NULL,
    dia_cierre_ciclo INT DEFAULT NULL,
    dia_pago INT DEFAULT NULL,
    tasa_interes DECIMAL(5,2) DEFAULT NULL,
    comision_mantenimiento DECIMAL(10,2) DEFAULT NULL,
    categoria_principal VARCHAR(50) DEFAULT NULL,
    notificar_dias_antes_cierre INT DEFAULT 3,
    notificar_dias_antes_pago INT DEFAULT 5,
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY unique_user_slot (usuario_id, slot_numero),
    KEY idx_usuario (usuario_id),
    KEY idx_banco (banco_id),
    KEY idx_slot (slot_numero),
    KEY idx_vacia (esta_vacia),
    CONSTRAINT tarjetas_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE,
    CONSTRAINT tarjetas_ibfk_2 FOREIGN KEY (banco_id) REFERENCES bancos (id),
    CONSTRAINT tarjetas_chk_1 CHECK (slot_numero BETWEEN 1 AND 4),
    CONSTRAINT tarjetas_chk_2 CHECK (dia_inicio_ciclo BETWEEN 1 AND 31 OR dia_inicio_ciclo IS NULL),
    CONSTRAINT tarjetas_chk_3 CHECK (dia_cierre_ciclo BETWEEN 1 AND 31 OR dia_cierre_ciclo IS NULL),
    CONSTRAINT tarjetas_chk_4 CHECK (dia_pago BETWEEN 1 AND 31 OR dia_pago IS NULL)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  `CREATE TABLE IF NOT EXISTS movimientos (
    id INT NOT NULL AUTO_INCREMENT,
    tarjeta_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo ENUM('gasto','pago') NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    fecha_movimiento DATETIME NOT NULL,
    ciclo_mes INT NOT NULL,
    ciclo_anio INT NOT NULL,
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_tarjeta_ciclo (tarjeta_id, ciclo_anio, ciclo_mes),
    KEY idx_usuario (usuario_id),
    CONSTRAINT movimientos_ibfk_1 FOREIGN KEY (tarjeta_id) REFERENCES tarjetas (id) ON DELETE CASCADE,
    CONSTRAINT movimientos_ibfk_2 FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,

  `CREATE TABLE IF NOT EXISTS objetivos (
    id INT NOT NULL AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tarjeta_id INT DEFAULT NULL,
    tarjeta_nombre VARCHAR(100) DEFAULT NULL,
    tipo VARCHAR(50) NOT NULL,
    descripcion VARCHAR(255) DEFAULT NULL,
    meta_valor DECIMAL(10,2) DEFAULT NULL,
    progreso_actual DECIMAL(10,2) DEFAULT 0.00,
    fecha_inicio DATE NOT NULL,
    fecha_limite DATE DEFAULT NULL,
    completado TINYINT(1) DEFAULT 0,
    fecha_completado TIMESTAMP NULL DEFAULT NULL,
    activo TINYINT(1) DEFAULT 1,
    fecha_creacion TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY usuario_id (usuario_id),
    CONSTRAINT objetivos_ibfk_1 FOREIGN KEY (usuario_id) REFERENCES usuarios (id) ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci`,
];

/*
  Datos semilla de bancos peruanos (referencia del Comparador).

  Sin logo_url a propósito: la app identifica a las entidades solo por su
  NOMBRE (uso nominativo). No se guardan ni muestran logos de terceros —
  eso evita usar marcas figurativas ajenas y hotlinkear a sus servidores.

  ⚠️ Las TEA son referenciales (fuente: SBS) y cambian con el tiempo.
  Al actualizarlas, sincroniza TEA_ACTUALIZADO en Comparador.jsx.
*/
const seedBancos = `INSERT IGNORE INTO bancos
    (id, nombre, tea_minima, tea_maxima, tea_promedio) VALUES
    (1,'BCP',76.90,107.00,91.45),
    (2,'Interbank',70.00,191.71,85.00),
    (3,'BBVA',39.99,109.99,84.99),
    (4,'Scotiabank',19.99,112.98,75.00),
    (5,'BanBif',63.00,82.00,72.50),
    (6,'Banco Ripley',15.94,109.83,62.89),
    (7,'Banco Falabella',34.20,95.99,65.10),
    (8,'Diners Club',12.00,79.00,45.50),
    (9,'Tarjeta Cencosud',34.90,116.00,75.45),
    (10,'Financiera Oh!',54.92,109.83,82.38)`;

async function initDatabase() {
  /* 1. La base de datos existe (la crea si falta) */
  await ensureDatabase();

  /* 2. Recién ahora se crea el pool — require perezoso para que
        la conexión de prueba del pool no corra antes que la base exista */
  const pool = require('./database');

  /* 3. Tablas y datos semilla */
  for (const sql of tablas) {
    await pool.query(sql);
  }
  await pool.query(seedBancos);
  console.log('✅ Base de datos verificada (base, tablas y bancos listos)');
}

module.exports = initDatabase;
