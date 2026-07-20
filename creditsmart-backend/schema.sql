-- ============================================================
-- CreditSmart.PE — Esquema de base de datos
-- Genera todas las tablas + datos semilla de bancos.
-- Uso:  mysql -u USER -p NOMBRE_BD < schema.sql
-- ============================================================


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
DROP TABLE IF EXISTS `bancos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bancos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `tasa_interes_mensual` decimal(5,2) DEFAULT NULL,
  `tasa_interes_anual` decimal(5,2) DEFAULT NULL,
  `logo_url` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tea_minima` decimal(5,2) DEFAULT '0.00',
  `tea_maxima` decimal(5,2) DEFAULT '0.00',
  `tea_promedio` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `movimientos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tarjeta_id` int NOT NULL,
  `usuario_id` int NOT NULL,
  `tipo` enum('gasto','pago') COLLATE utf8mb4_general_ci NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `fecha_movimiento` datetime NOT NULL,
  `ciclo_mes` int NOT NULL,
  `ciclo_anio` int NOT NULL,
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_tarjeta_ciclo` (`tarjeta_id`,`ciclo_anio`,`ciclo_mes`),
  KEY `idx_usuario` (`usuario_id`),
  CONSTRAINT `movimientos_ibfk_1` FOREIGN KEY (`tarjeta_id`) REFERENCES `tarjetas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `movimientos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=155 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `objetivos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `objetivos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `tarjeta_id` int DEFAULT NULL,
  `tarjeta_nombre` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `tipo` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `descripcion` varchar(255) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `meta_valor` decimal(10,2) DEFAULT NULL,
  `progreso_actual` decimal(10,2) DEFAULT '0.00',
  `fecha_inicio` date NOT NULL,
  `fecha_limite` date DEFAULT NULL,
  `completado` tinyint(1) DEFAULT '0',
  `fecha_completado` timestamp NULL DEFAULT NULL,
  `activo` tinyint(1) DEFAULT '1',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  CONSTRAINT `objetivos_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `tarjetas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tarjetas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `usuario_id` int NOT NULL,
  `slot_numero` int NOT NULL,
  `esta_vacia` tinyint(1) DEFAULT '1',
  `banco_id` int DEFAULT NULL,
  `banco_nombre_custom` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `nombre_tarjeta` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `linea_credito` decimal(10,2) DEFAULT NULL,
  `deuda_actual` decimal(10,2) DEFAULT '0.00',
  `pago_minimo` decimal(10,2) DEFAULT '0.00',
  `moneda` varchar(50) COLLATE utf8mb4_general_ci DEFAULT 'PEN',
  `simbolo_moneda` varchar(5) COLLATE utf8mb4_general_ci DEFAULT 'S/',
  `dia_inicio_ciclo` int DEFAULT NULL,
  `dia_cierre_ciclo` int DEFAULT NULL,
  `dia_pago` int DEFAULT NULL,
  `tasa_interes` decimal(5,2) DEFAULT NULL,
  `comision_mantenimiento` decimal(10,2) DEFAULT NULL,
  `categoria_principal` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `notificar_dias_antes_cierre` int DEFAULT '3',
  `notificar_dias_antes_pago` int DEFAULT '5',
  `fecha_creacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_user_slot` (`usuario_id`,`slot_numero`),
  KEY `idx_usuario` (`usuario_id`),
  KEY `idx_banco` (`banco_id`),
  KEY `idx_slot` (`slot_numero`),
  KEY `idx_vacia` (`esta_vacia`),
  CONSTRAINT `tarjetas_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tarjetas_ibfk_2` FOREIGN KEY (`banco_id`) REFERENCES `bancos` (`id`),
  CONSTRAINT `tarjetas_chk_1` CHECK ((`slot_numero` between 1 and 4)),
  CONSTRAINT `tarjetas_chk_2` CHECK (((`dia_inicio_ciclo` between 1 and 31) or (`dia_inicio_ciclo` is null))),
  CONSTRAINT `tarjetas_chk_3` CHECK (((`dia_cierre_ciclo` between 1 and 31) or (`dia_cierre_ciclo` is null))),
  CONSTRAINT `tarjetas_chk_4` CHECK (((`dia_pago` between 1 and 31) or (`dia_pago` is null)))
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `apellido` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `ha_pagado` tinyint(1) DEFAULT '0',
  `fecha_registro` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `fecha_pago` timestamp NULL DEFAULT NULL,
  `paypal_payment_id` varchar(100) COLLATE utf8mb4_general_ci DEFAULT NULL COMMENT 'ID de transacción PayPal',
  `monto_pagado` decimal(10,2) DEFAULT '5.00' COMMENT 'Monto pagado en USD',
  `ultima_consulta_sentinel` datetime DEFAULT NULL,
  `reset_token` varchar(10) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `reset_token_expiry` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

LOCK TABLES `bancos` WRITE;
/*!40000 ALTER TABLE `bancos` DISABLE KEYS */;
INSERT INTO `bancos` VALUES (1,'BCP',NULL,NULL,'https://upload.wikimedia.org/wikipedia/commons/2/28/Banco_de_Cr%C3%A9dito_del_Per%C3%BA_logo.svg',76.90,107.00,91.45),(2,'Interbank',NULL,NULL,'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/Interbank_logo.svg/2560px-Interbank_logo.svg.png',70.00,191.71,85.00),(3,'BBVA',NULL,NULL,'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/BBVA_2019.svg/2560px-BBVA_2019.svg.png',39.99,109.99,84.99),(4,'Scotiabank',NULL,NULL,'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Scotiabank.svg/2560px-Scotiabank.svg.png',19.99,112.98,75.00),(5,'BanBif',NULL,NULL,'https://www.banbif.com.pe/logo.png',63.00,82.00,72.50),(6,'Banco Ripley',NULL,NULL,'https://www.bancoripley.com.pe/logo.png',15.94,109.83,62.89),(7,'Banco Falabella',NULL,NULL,'https://www.bancofalabella.pe/logo.png',34.20,95.99,65.10),(8,'Diners Club',NULL,NULL,'https://upload.wikimedia.org/wikipedia/commons/thumb/6/65/Diners_Club_Logo3.svg/2560px-Diners_Club_Logo3.svg.png',12.00,79.00,45.50),(9,'Tarjeta Cencosud',NULL,NULL,'https://www.tarjetacencosud.pe/logo.png',34.90,116.00,75.45),(10,'Financiera Oh!',NULL,NULL,'https://www.tarjetaoh.com/logo.png',54.92,109.83,82.38);
/*!40000 ALTER TABLE `bancos` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

