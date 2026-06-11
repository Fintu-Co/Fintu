const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { verifyToken } = require('../middleware/auth');

router.get('/user', verifyToken, goalController.getGoals);
router.post('/create', verifyToken, goalController.createGoal);
router.put('/progreso', verifyToken, goalController.updateProgress);
router.put('/completar', verifyToken, goalController.completeGoal);
router.put('/sincronizar', verifyToken, goalController.syncProgress);
router.delete('/eliminar', verifyToken, goalController.deleteGoal);

module.exports = router;