const express = require('express');
const {
  getDashboardAnalytics,
  getAnalyticsReports,
  getDemandInsights,
  getUtilizationAnalytics,
  getOverviewAnalytics,
} = require('../controllers/analyticsController');
const optionalAuth = require('../src/middleware/optionalAuth');

const router = express.Router();

router.get('/dashboard', optionalAuth, getDashboardAnalytics);
router.get('/reports', optionalAuth, getAnalyticsReports);
router.get('/demand-insights', optionalAuth, getDemandInsights);
router.get('/utilization', optionalAuth, getUtilizationAnalytics);
router.get('/overview', optionalAuth, getOverviewAnalytics);

module.exports = router;
