const express = require('express');
const router = express.Router();
const cardController = require('../controllers/cardController');
const { verifyToken } = require('../middleware/auth');

router.get('/bancos', cardController.getBancos); // pública: solo lista de bancos
router.get('/user', verifyToken, cardController.getUserCards);
router.get('/:id', verifyToken, cardController.getCardById);
router.put('/update', verifyToken, cardController.updateCard);
router.put('/clear', verifyToken, cardController.clearCard);
router.put('/update-deuda', verifyToken, cardController.updateDeuda);

module.exports = router;