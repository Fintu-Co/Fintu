/**
 * RUTAS + COMPOSITION ROOT del módulo cards.
 * URLs idénticas a routes/cardRoutes.js.
 */
const express = require('express');
const { verifyToken } = require('../../../shared/middleware/auth');
const { useCases } = require('../index');
const buildCardController = require('./cardController');

const controller = buildCardController(useCases);

const router = express.Router();

router.get('/bancos', controller.getBancos); // pública: solo lista de bancos
router.get('/user', verifyToken, controller.getUserCards);
router.get('/:id', verifyToken, controller.getCardById);
router.put('/update', verifyToken, controller.updateCard);
router.put('/clear', verifyToken, controller.clearCard);
router.put('/update-deuda', verifyToken, controller.updateDeuda);

module.exports = router;
