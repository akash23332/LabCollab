const express = require('express');
const {
  getAvailability,
  updateWeeklyTemplate,
  addException,
  removeException,
  createAvailability,
  getAvailabilitySlots,
} = require('../controllers/availabilityController');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

router.route('/').get(optionalAuth, getAvailabilitySlots).post(optionalAuth, createAvailability);

router.route('/:equipmentId').get(optionalAuth, getAvailability);
router.route('/:equipmentId/template').put(optionalAuth, updateWeeklyTemplate);
router.route('/:equipmentId/exceptions').post(optionalAuth, addException);
router.route('/:equipmentId/exceptions/:exceptionId').delete(optionalAuth, removeException);

module.exports = router;
