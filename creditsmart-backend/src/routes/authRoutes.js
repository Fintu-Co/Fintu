const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas (no requieren token)
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/confirm-payment', authController.confirmPayment);
router.post('/register-with-payment', authController.registerWithPayment);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Rutas protegidas (requieren token)
router.put('/sentinel', verifyToken, authController.registrarSentinel);
router.get('/sentinel/:id', verifyToken, authController.getSentinel);

// Perfil
router.get('/profile/:userId',  verifyToken, authController.getProfile);
router.put('/profile',          verifyToken, authController.updateProfile);
router.put('/change-password',  verifyToken, authController.changePassword);

module.exports = router;

