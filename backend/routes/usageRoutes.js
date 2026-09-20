const express = require('express');
const {
  checkInEquipment,
  checkOutEquipment,
  getMyUsage,
  getActiveUsageSessions,
  getEquipmentUsage,
  getInstitutionUsage,
} = require('../controllers/usageController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// QR check-in / check-out (the QR only identifies the equipment)
router.post('/check-in', protect, checkInEquipment);
router.post('/check-out', protect, checkOutEquipment);

// Static routes first, then the parameterized history routes
router.get('/my', protect, getMyUsage);
router.get('/active', protect, getActiveUsageSessions);
router.get('/equipment/:equipmentId', protect, getEquipmentUsage);
router.get('/institution/:institutionId', protect, getInstitutionUsage);

module.exports = router;
