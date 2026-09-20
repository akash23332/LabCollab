const express = require('express');
const {
  createOrder,
  verifyPayment,
  getBookingPayment,
  getUserPayments,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Order creation & payment verification
router.post('/create-order', protect, createOrder);
router.post('/verify', protect, verifyPayment);

// User's payment history
router.get('/my', protect, getUserPayments);

// Booking specific payment status
router.get('/booking/:bookingId', protect, getBookingPayment);

module.exports = router;
