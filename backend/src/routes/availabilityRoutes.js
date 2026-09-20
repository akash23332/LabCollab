const express = require('express');
const {
  createAvailability,
  getAvailabilityForEquipment,
  updateAvailability,
  deleteAvailability,
} = require('../controllers/availabilityController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', protect, createAvailability);
router.get('/equipment/:equipmentId', getAvailabilityForEquipment);
router.route('/:id').patch(protect, updateAvailability).delete(protect, deleteAvailability);

module.exports = router;
