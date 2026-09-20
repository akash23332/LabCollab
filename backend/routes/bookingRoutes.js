const express = require('express');
const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  approveBooking,
  rejectBooking,
  cancelBooking,
  getMyBookings,
  getInstitutionBookingRequests,
  getEquipmentBookingHistory,
  exportDemandHistory,
} = require('../controllers/bookingController');
const optionalAuth = require('../src/middleware/optionalAuth');

const router = express.Router();

router.get('/export-demand-history', exportDemandHistory);
router.get('/my', optionalAuth, getMyBookings);
router.get('/requests', optionalAuth, getInstitutionBookingRequests);
router.get('/equipment/:equipmentId', optionalAuth, getEquipmentBookingHistory);

router
  .route('/')
  .get(optionalAuth, getAllBookings)
  .post(optionalAuth, createBooking);

router.get('/:id', optionalAuth, getBookingById);
router.patch('/:id/status', optionalAuth, updateBookingStatus);
router.patch('/:id/approve', optionalAuth, approveBooking);
router.patch('/:id/reject', optionalAuth, rejectBooking);
router.patch('/:id/cancel', optionalAuth, cancelBooking);

module.exports = router;
