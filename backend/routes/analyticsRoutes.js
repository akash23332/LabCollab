const express = require('express');
const {
  getEquipmentAnalytics,
  getInstitutionAnalytics,
  getInstitutionSummary,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Dashboard aggregate first (one round trip for the manager dashboard)
router.get('/institution/:institutionId/summary', protect, getInstitutionSummary);
router.get('/institution/:institutionId', protect, getInstitutionAnalytics);

// Equipment utilization
router.get('/equipment/:equipmentId', protect, getEquipmentAnalytics);

module.exports = router;
