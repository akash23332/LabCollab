const express = require('express');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  getInstitutionBookingRequests,
  approveBooking,
  rejectBooking,
  cancelBooking,
  getEquipmentBookingHistory,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Booking creation & user bookings
router.post('/', protect, createBooking);
router.get('/my', protect, getMyBookings);

// Institution / lab manager booking requests
router.get('/requests', protect, getInstitutionBookingRequests);

// Equipment specific booking history
router.get('/equipment/:equipmentId', protect, getEquipmentBookingHistory);

// Single booking management
router.get('/:id', protect, getBookingById);
router.patch('/:id/approve', protect, approveBooking);
router.patch('/:id/reject', protect, rejectBooking);
router.patch('/:id/cancel', protect, cancelBooking);

module.exports = router;
