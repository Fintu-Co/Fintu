const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { verifyToken } = require('../middleware/auth');

router.get('/usage-analysis/:tarjetaId', verifyToken, analyticsController.getUsageAnalysis);

module.exports = router;