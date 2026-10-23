/**
 * RUTAS + COMPOSITION ROOT del módulo movements.
 * URLs idénticas a routes/movementRoutes.js.
 */
const express = require('express');
const { verifyToken } = require('../../../shared/middleware/auth');

// Infraestructura
const MySqlMovementRepository = require('../infrastructure/MySqlMovementRepository');
const MySqlCardDebtAdapter = require('../infrastructure/MySqlCardDebtAdapter');

// Aplicación
const GetMovementsByCard = require('../application/GetMovementsByCard');
const GetMovementsByCycle = require('../application/GetMovementsByCycle');
const GetMovementsByRange = require('../application/GetMovementsByRange');
const CreateMovement = require('../application/CreateMovement');
const GetCycleStats = require('../application/GetCycleStats');
const GetChartData = require('../application/GetChartData');
const GetDetailedChartData = require('../application/GetDetailedChartData');
const DeleteMovement = require('../application/DeleteMovement');
const CleanupOldMovements = require('../application/CleanupOldMovements');

// Interfaz HTTP
const buildMovementController = require('./movementController');

// ── Cableado ──
const movementRepository = new MySqlMovementRepository();
const cardDebtPort = new MySqlCardDebtAdapter();

const controller = buildMovementController({
  getMovementsByCard: new GetMovementsByCard({ movementRepository }),
  getMovementsByCycle: new GetMovementsByCycle({ movementRepository }),
  getMovementsByRange: new GetMovementsByRange({ movementRepository }),
  createMovement: new CreateMovement({ movementRepository, cardDebtPort }),
  getCycleStats: new GetCycleStats({ movementRepository }),
  getChartData: new GetChartData({ movementRepository }),
  getDetailedChartData: new GetDetailedChartData({ movementRepository, cardDebtPort }),
  deleteMovement: new DeleteMovement({ movementRepository, cardDebtPort }),
  cleanupOldMovements: new CleanupOldMovements({ movementRepository }),
});

// ── Rutas ──
const router = express.Router();

router.get('/card/:tarjetaId', verifyToken, controller.getMovements);
router.get('/chart-detailed/:tarjetaId', verifyToken, controller.getDetailedChartData);
router.get('/cycle', verifyToken, controller.getMovementsByCycle);
router.get('/range', verifyToken, controller.getMovementsByRange);
router.post('/create', verifyToken, controller.createMovement);
router.get('/stats/:tarjetaId', verifyToken, controller.getStats);
router.get('/chart/:tarjetaId', verifyToken, controller.getChartData);
router.delete('/delete', verifyToken, controller.deleteMovement);
router.post('/cleanup', verifyToken, controller.cleanup);

module.exports = router;
