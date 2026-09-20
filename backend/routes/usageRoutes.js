const express = require('express');
const {
  getUsageLogs,
  getUsageLogById,
  createUsageLog,
  updateUsageLog,
  getUsageStats,
  checkIn,
  checkOut,
  getActiveSession,
} = require('../controllers/usageController');
const optionalAuth = require('../src/middleware/optionalAuth');

const router = express.Router();

router.get('/stats', optionalAuth, getUsageStats);
router.get('/active', optionalAuth, getActiveSession);
router.post('/check-in', optionalAuth, checkIn);
router.post('/check-out', optionalAuth, checkOut);

router
  .route('/')
  .get(optionalAuth, getUsageLogs)
  .post(optionalAuth, createUsageLog);

router
  .route('/:id')
  .get(optionalAuth, getUsageLogById)
  .patch(optionalAuth, updateUsageLog);

module.exports = router;
