const express = require('express');
const router = express.Router();
const movementController = require('../controllers/movementController');
const { verifyToken } = require('../middleware/auth');

router.get('/card/:tarjetaId', verifyToken, movementController.getMovements);
router.get('/chart-detailed/:tarjetaId', verifyToken, movementController.getDetailedChartData);
router.get('/cycle', verifyToken, movementController.getMovementsByCycle);
router.post('/create', verifyToken, movementController.createMovement);
router.get('/stats/:tarjetaId', verifyToken, movementController.getStats);
router.get('/chart/:tarjetaId', verifyToken, movementController.getChartData);
router.delete('/delete', verifyToken, movementController.deleteMovement);
router.post('/cleanup', verifyToken, movementController.cleanup);

module.exports = router;