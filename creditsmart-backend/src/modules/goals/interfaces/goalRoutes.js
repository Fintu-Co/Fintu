/**
 * RUTAS + COMPOSITION ROOT del módulo goals.
 *
 * Aquí (y solo aquí) se cablea el módulo: se instancian los adaptadores
 * de infraestructura, se inyectan en los casos de uso y estos en el
 * controller. Las URLs no cambian respecto a la versión anterior.
 */
const express = require('express');
const { verifyToken } = require('../../../shared/middleware/auth');

// Infraestructura (adaptadores)
const MySqlGoalRepository = require('../infrastructure/MySqlGoalRepository');
const CardsModuleCardProvider = require('../infrastructure/CardsModuleCardProvider');

// Aplicación (casos de uso)
const GetUserGoals = require('../application/GetUserGoals');
const CreateGoal = require('../application/CreateGoal');
const UpdateGoalProgress = require('../application/UpdateGoalProgress');
const CompleteGoal = require('../application/CompleteGoal');
const DeleteGoal = require('../application/DeleteGoal');
const SyncGoalsProgress = require('../application/SyncGoalsProgress');

// Interfaz HTTP
const buildGoalController = require('./goalController');

// ── Cableado de dependencias ──
const goalRepository = new MySqlGoalRepository();
const cardProvider = new CardsModuleCardProvider();

const controller = buildGoalController({
  getUserGoals: new GetUserGoals({ goalRepository }),
  createGoal: new CreateGoal({ goalRepository, cardProvider }),
  updateGoalProgress: new UpdateGoalProgress({ goalRepository }),
  completeGoal: new CompleteGoal({ goalRepository }),
  deleteGoal: new DeleteGoal({ goalRepository }),
  syncGoalsProgress: new SyncGoalsProgress({ goalRepository, cardProvider }),
});

// ── Rutas (idénticas a routes/goalRoutes.js) ──
const router = express.Router();

router.get('/user', verifyToken, controller.getGoals);
router.post('/create', verifyToken, controller.createGoal);
router.put('/progreso', verifyToken, controller.updateProgress);
router.put('/completar', verifyToken, controller.completeGoal);
router.put('/sincronizar', verifyToken, controller.syncProgress);
router.delete('/eliminar', verifyToken, controller.deleteGoal);

module.exports = router;
