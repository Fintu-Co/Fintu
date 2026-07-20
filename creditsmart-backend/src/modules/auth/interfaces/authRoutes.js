/**
 * RUTAS + COMPOSITION ROOT del módulo auth.
 * URLs idénticas a routes/authRoutes.js.
 */
const express = require('express');
const { verifyToken } = require('../../../shared/middleware/auth');

// Infraestructura
const MySqlUserRepository = require('../infrastructure/MySqlUserRepository');
const BcryptPasswordHasher = require('../infrastructure/BcryptPasswordHasher');
const JwtTokenService = require('../infrastructure/JwtTokenService');
const NodemailerMailService = require('../infrastructure/NodemailerMailService');
const PayPalPaymentVerifier = require('../infrastructure/PayPalPaymentVerifier');

// Aplicación
const RegisterUser = require('../application/RegisterUser');
const LoginUser = require('../application/LoginUser');
const ConfirmPayment = require('../application/ConfirmPayment');
const RegisterWithPayment = require('../application/RegisterWithPayment');
const RegisterSentinelQuery = require('../application/RegisterSentinelQuery');
const GetSentinelQuery = require('../application/GetSentinelQuery');
const ForgotPassword = require('../application/ForgotPassword');
const ResetPassword = require('../application/ResetPassword');
const GetProfile = require('../application/GetProfile');
const UpdateProfile = require('../application/UpdateProfile');
const ChangePassword = require('../application/ChangePassword');

// Interfaz HTTP
const buildAuthController = require('./authController');

// ── Cableado ──
const userRepository = new MySqlUserRepository();
const passwordHasher = new BcryptPasswordHasher();
const tokenService = new JwtTokenService();
const mailService = new NodemailerMailService();
const paymentVerifier = new PayPalPaymentVerifier();

const controller = buildAuthController({
  registerUser: new RegisterUser({ userRepository, passwordHasher }),
  loginUser: new LoginUser({ userRepository, passwordHasher, tokenService }),
  confirmPayment: new ConfirmPayment({ userRepository, tokenService, paymentVerifier }),
  registerWithPayment: new RegisterWithPayment({ userRepository, passwordHasher, tokenService, paymentVerifier }),
  registerSentinelQuery: new RegisterSentinelQuery({ userRepository }),
  getSentinelQuery: new GetSentinelQuery({ userRepository }),
  forgotPassword: new ForgotPassword({ userRepository, mailService }),
  resetPassword: new ResetPassword({ userRepository, passwordHasher }),
  getProfile: new GetProfile({ userRepository }),
  updateProfile: new UpdateProfile({ userRepository }),
  changePassword: new ChangePassword({ userRepository, passwordHasher }),
});

// ── Rutas ──
const router = express.Router();

// Rutas públicas (no requieren token)
router.post('/register', controller.register);
router.post('/login', controller.login);
router.post('/confirm-payment', controller.confirmPayment);
router.post('/register-with-payment', controller.registerWithPayment);
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

// Rutas protegidas (requieren token)
router.put('/sentinel', verifyToken, controller.registrarSentinel);
router.get('/sentinel/:id', verifyToken, controller.getSentinel);

// Perfil
router.get('/profile/:userId', verifyToken, controller.getProfile);
router.put('/profile', verifyToken, controller.updateProfile);
router.put('/change-password', verifyToken, controller.changePassword);

module.exports = router;
