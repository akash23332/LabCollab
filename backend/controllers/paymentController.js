const paymentService = require('../services/paymentService');

/**
 * POST /api/payments/create-order
 * Create a Razorpay order for an approved booking.
 */
const createOrder = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const result = await paymentService.createOrder({
      bookingId,
      user: req.user,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * POST /api/payments/verify
 * Verify Razorpay payment signature.
 */
const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, method } = req.body;
    const result = await paymentService.verifyPayment({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      method,
      user: req.user,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/payments/booking/:bookingId
 * Get payment status and details for a specific booking.
 */
const getBookingPayment = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const result = await paymentService.getBookingPayment({
      bookingId,
      user: req.user,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/payments/my
 * Get all payment records for authenticated user.
 */
const getUserPayments = async (req, res, next) => {
  try {
    const result = await paymentService.getUserPayments({
      user: req.user,
    });
    return res.status(200).json(result);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  getBookingPayment,
  getUserPayments,
};
