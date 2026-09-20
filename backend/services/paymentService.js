const crypto = require('crypto');
const Razorpay = require('razorpay');
const Payment = require('../models/Payment');
const Booking = require('../models/Booking');
const { httpError, isValidObjectId } = require('../src/utils/apiHelpers');

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (!razorpayInstance) {
    const key_id = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id';
    const key_secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dummy_secret';
    razorpayInstance = new Razorpay({ key_id, key_secret });
  }
  return razorpayInstance;
};

const _setRazorpayInstance = (instance) => {
  razorpayInstance = instance;
};

/**
 * Creates a Razorpay order for an approved booking.
 * Calculates amount purely from Booking.totalAmount (converted to paise).
 * Free bookings (totalAmount === 0) are automatically marked as paid.
 */
const createOrder = async ({ bookingId, user }) => {
  if (!bookingId) {
    throw httpError(400, 'bookingId is required');
  }
  if (!isValidObjectId(bookingId)) {
    throw httpError(400, 'Invalid booking id');
  }

  const booking = await Booking.findById(bookingId).populate('institution');
  if (!booking) {
    throw httpError(404, 'Booking not found');
  }

  // Authorization: Only booking owner or admin can pay
  const isOwner = String(booking.user) === String(user._id);
  const isAdmin = user.role === 'admin';
  if (!isOwner && !isAdmin) {
    throw httpError(403, 'Not authorized to pay for this booking');
  }

  // Booking status check: only approved bookings can be paid
  if (booking.status !== 'approved') {
    const messages = {
      pending: 'Cannot pay for a booking that is not approved yet',
      cancelled: 'Cannot pay for a cancelled booking',
      rejected: 'Cannot pay for a rejected booking',
      completed: 'Cannot pay for an already completed booking',
    };
    throw httpError(400, messages[booking.status] || `Cannot pay for a booking with status ${booking.status}`);
  }

  // Payment status check
  if (booking.paymentStatus === 'paid') {
    throw httpError(400, 'This booking has already been paid for');
  }

  // Free booking handling
  if (Number(booking.totalAmount) === 0) {
    booking.paymentStatus = 'paid';
    await booking.save();
    return {
      success: true,
      message: 'Free booking confirmed without payment',
      isFree: true,
      booking: {
        _id: booking._id,
        totalAmount: 0,
        paymentStatus: 'paid',
        status: booking.status,
      },
    };
  }

  // Amount calculation: INR paise (sole source of truth is backend Booking)
  const amountInPaise = Math.round(booking.totalAmount * 100);

  let order;
  const isTestOrMock =
    process.env.NODE_ENV === 'test' ||
    process.env.RAZORPAY_MOCK === 'true' ||
    !process.env.RAZORPAY_KEY_ID ||
    process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_dummy') ||
    process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_mock');

  if (isTestOrMock) {
    order = {
      id: `order_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      amount: amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${booking._id.toString().slice(-8)}_${Date.now()}`,
      status: 'created',
    };
  } else {
    try {
      const razorpay = getRazorpayInstance();
      order = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: `rcpt_${booking._id.toString().slice(-8)}_${Date.now()}`,
      });
    } catch (err) {
      throw httpError(502, `Razorpay order creation failed: ${err.message}`);
    }
  }

  const institutionId = booking.institution?._id || booking.institution || null;

  const payment = await Payment.create({
    booking: booking._id,
    user: user._id,
    institution: institutionId,
    amount: amountInPaise,
    currency: order.currency || 'INR',
    orderId: order.id,
    razorpayOrderId: order.id,
    status: 'created',
  });

  booking.paymentStatus = 'pending';
  await booking.save();

  return {
    success: true,
    message: 'Order created successfully',
    order: {
      id: order.id,
      amount: order.amount,
      currency: order.currency,
    },
    paymentId: payment._id,
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
  };
};

/**
 * Verifies Razorpay payment signature using timingSafeEqual.
 * Updates payment status and booking paymentStatus.
 */
const verifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature, method, user }) => {
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw httpError(400, 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required');
  }

  const payment = await Payment.findOne({
    $or: [{ orderId: razorpay_order_id }, { razorpayOrderId: razorpay_order_id }],
  });

  if (!payment) {
    throw httpError(404, 'Payment record not found for this order');
  }

  const booking = await Booking.findById(payment.booking);
  if (!booking) {
    throw httpError(404, 'Booking not found');
  }

  // Idempotency: if already marked paid, return success
  if (payment.status === 'paid' && booking.paymentStatus === 'paid') {
    return {
      success: true,
      message: 'Payment already verified',
      payment: {
        _id: payment._id,
        orderId: payment.orderId,
        paymentId: payment.paymentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        paidAt: payment.paidAt,
      },
      booking: {
        _id: booking._id,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
      },
    };
  }

  // Cryptographic signature verification using HMAC-SHA256
  const secret = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_dummy_secret';
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  let isValid = false;
  try {
    isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'utf8'),
      Buffer.from(razorpay_signature, 'utf8')
    );
  } catch (err) {
    isValid = false;
  }

  if (!isValid) {
    payment.status = 'failed';
    payment.paymentId = razorpay_payment_id;
    payment.razorpayPaymentId = razorpay_payment_id;
    payment.errorDetails = { reason: 'Invalid signature verification' };
    await payment.save();

    booking.paymentStatus = 'failed';
    await booking.save();

    throw httpError(400, 'Payment verification failed: Invalid signature');
  }

  // Valid signature
  payment.status = 'paid';
  payment.paymentId = razorpay_payment_id;
  payment.razorpayPaymentId = razorpay_payment_id;
  payment.signature = razorpay_signature;
  payment.razorpaySignature = razorpay_signature;
  payment.paidAt = new Date();
  if (method) {
    payment.method = method;
  }
  await payment.save();

  booking.paymentStatus = 'paid';
  await booking.save();

  return {
    success: true,
    message: 'Payment verified successfully',
    payment: {
      _id: payment._id,
      orderId: payment.orderId,
      paymentId: payment.paymentId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paidAt: payment.paidAt,
    },
    booking: {
      _id: booking._id,
      paymentStatus: booking.paymentStatus,
      status: booking.status,
    },
  };
};

/**
 * Get payment record for a specific booking.
 */
const getBookingPayment = async ({ bookingId, user }) => {
  if (!isValidObjectId(bookingId)) {
    throw httpError(400, 'Invalid booking id');
  }

  const booking = await Booking.findById(bookingId).populate('institution equipment');
  if (!booking) {
    throw httpError(404, 'Booking not found');
  }

  const isOwner = String(booking.user) === String(user._id);
  const isAdmin = user.role === 'admin';
  const isManager =
    user.role === 'faculty' &&
    booking.institution &&
    (String(booking.institution.createdBy) === String(user._id) ||
      booking.institution.name === user.institution);

  if (!isOwner && !isAdmin && !isManager) {
    throw httpError(403, 'Not authorized to view payment for this booking');
  }

  const payment = await Payment.findOne({ booking: bookingId }).sort({ createdAt: -1 });

  return {
    success: true,
    payment: payment || null,
    booking: {
      _id: booking._id,
      totalAmount: booking.totalAmount,
      paymentStatus: booking.paymentStatus,
      status: booking.status,
    },
  };
};

/**
 * Get all payment records for authenticated user.
 */
const getUserPayments = async ({ user }) => {
  const payments = await Payment.find({ user: user._id })
    .populate({
      path: 'booking',
      populate: { path: 'equipment', select: 'name category' },
    })
    .sort({ createdAt: -1 });

  return {
    success: true,
    count: payments.length,
    payments,
  };
};

module.exports = {
  createOrder,
  verifyPayment,
  getBookingPayment,
  getUserPayments,
  getRazorpayInstance,
  _setRazorpayInstance,
};
