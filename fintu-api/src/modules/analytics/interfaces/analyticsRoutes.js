/**
 * RUTAS + COMPOSITION ROOT del módulo analytics.
 * URLs idénticas a routes/analyticsRoutes.js.
 */
const express = require('express');
const { verifyToken } = require('../../../shared/middleware/auth');

const MySqlAnalyticsRepository = require('../infrastructure/MySqlAnalyticsRepository');
const GetUsageAnalysis = require('../application/GetUsageAnalysis');
const buildAnalyticsController = require('./analyticsController');

// ── Cableado ──
const analyticsRepository = new MySqlAnalyticsRepository();

const controller = buildAnalyticsController({
  getUsageAnalysis: new GetUsageAnalysis({ analyticsRepository }),
});

// ── Rutas ──
const router = express.Router();

router.get('/usage-analysis/:tarjetaId', verifyToken, controller.getUsageAnalysis);

module.exports = router;
