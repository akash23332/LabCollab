/**
 * Phase 7 test suite - Payments (Razorpay in Test Mode) & Production Hardening.
 *
 *   cd backend && npm run test:phase7
 *
 * Runs against an in-memory MongoDB with the real Express app:
 *   - Razorpay order creation (backend authority for amounts)
 *   - Payment record tracking and dual state-machine updates
 *   - Cryptographic signature verification using HMAC-SHA256 & timingSafeEqual
 *   - QR check-in guard enforcing payment prior to equipment access
 *   - Free booking payment exemption
 *   - Security headers (Helmet), restricted CORS, rate limiters, and health check.
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'phase7_test_jwt_secret_key_12345';
process.env.RAZORPAY_KEY_ID = 'rzp_test_mock_12345';
process.env.RAZORPAY_KEY_SECRET = 'phase7_test_razorpay_secret_key_12345';
process.env.CLIENT_URL = 'http://localhost:5173';
process.env.CHECK_IN_EARLY_MINUTES = '15';
process.env.CHECK_IN_LATE_GRACE_MINUTES = '0';

const crypto = require('crypto');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../server');
const User = require('../models/User');
const Institution = require('../src/models/Institution');
const Equipment = require('../src/models/Equipment');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const UsageLog = require('../models/UsageLog');
const { generateToken } = require('../controllers/authController');
const usageConfig = require('../src/utils/usageConfig');

let mongoServer;

const runTests = async () => {
  console.log('====================================================');
  console.log('  LabShare Phase 7: Payments + Production Hardening ');
  console.log('  Comprehensive Test Suite                          ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const testCase = async (description, fn) => {
    try {
      await fn();
      console.log(`[PASS] ${description}`);
      passed++;
    } catch (err) {
      console.error(`[FAIL] ${description}`);
      console.error(`       Error: ${err.message}`);
      if (err.expected !== undefined && err.actual !== undefined) {
        console.error(`       Expected: ${JSON.stringify(err.expected)}`);
        console.error(`       Actual:   ${JSON.stringify(err.actual)}`);
      }
      failed++;
    }
  };

  const assertEqual = (actual, expected, message) => {
    if (actual !== expected) {
      const err = new Error(message || `Assertion failed: ${actual} !== ${expected}`);
      err.actual = actual;
      err.expected = expected;
      throw err;
    }
  };

  const assertTrue = (condition, message) => {
    if (!condition) throw new Error(message || 'Expected condition to be truthy');
  };

  try {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    console.log('In-memory MongoDB started\n');
  } catch (err) {
    console.error('Failed to start MongoDB Memory Server:', err);
    process.exit(1);
  }

  try {
    // -----------------------------------------------------------------
    // Time helpers for QR check-in windows
    // -----------------------------------------------------------------
    const now = new Date();
    const todayStored = usageConfig.storedDay(now);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);

    const hhmm = (date) =>
      `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    const clamp = (date) => new Date(Math.min(Math.max(date.getTime(), dayStart.getTime()), dayEnd.getTime()));

    const inWindow = {
      startTime: hhmm(clamp(new Date(now.getTime() - 30 * 60 * 1000))),
      endTime: hhmm(clamp(new Date(now.getTime() + 90 * 60 * 1000))),
    };

    // -----------------------------------------------------------------
    // Seed test users, institution, equipment
    // -----------------------------------------------------------------
    const manager = await User.create({
      name: 'Dr. Vikram Sarabhai',
      email: 'manager@isro.edu',
      password: 'Password123',
      role: 'faculty',
      institution: 'ISRO Research Center',
    });
    const managerToken = generateToken(manager);

    const student1 = await User.create({
      name: 'Aarav Patel',
      email: 'aarav@isro.edu',
      password: 'Password123',
      role: 'student',
      institution: 'ISRO Research Center',
    });
    const student1Token = generateToken(student1);

    const student2 = await User.create({
      name: 'Neha Gupta',
      email: 'neha@iitd.ac.in',
      password: 'Password123',
      role: 'student',
      institution: 'IIT Delhi',
    });
    const student2Token = generateToken(student2);

    const admin = await User.create({
      name: 'Platform Admin',
      email: 'admin@labshare.org',
      password: 'Password123',
      role: 'admin',
    });
    const adminToken = generateToken(admin);

    const institution = await Institution.create({
      name: 'ISRO Research Center',
      type: 'research_lab',
      city: 'Bengaluru',
      state: 'Karnataka',
      isVerified: true,
      createdBy: manager._id,
    });

    const paidEquipment = await Equipment.create({
      name: 'Confocal Microscope',
      category: 'microscopy',
      institution: institution._id,
      createdBy: manager._id,
      status: 'available',
      isVerified: true,
      pricePerHour: 500,
    });

    const freeEquipment = await Equipment.create({
      name: 'Digital Multimeter',
      category: 'electronics',
      institution: institution._id,
      createdBy: manager._id,
      status: 'available',
      isVerified: true,
      pricePerHour: 0,
    });

    const createBookingDoc = (overrides = {}) =>
      Booking.create({
        user: student1._id,
        equipment: paidEquipment._id,
        institution: institution._id,
        date: todayStored,
        startTime: inWindow.startTime,
        endTime: inWindow.endTime,
        duration: 2,
        purpose: 'Cell imaging research',
        status: 'approved',
        totalAmount: 1000,
        paymentStatus: 'unpaid',
        ...overrides,
      });

    console.log('Test fixtures created\n');

    // -----------------------------------------------------------------
    // TEST 1: Order creation requires authentication (401 without token)
    // -----------------------------------------------------------------
    await testCase('1. Order creation requires authentication (401 without token)', async () => {
      const res = await request(app).post('/api/payments/create-order').send({ bookingId: '60d0fe4f5311236168a109ca' });
      assertEqual(res.status, 401, 'Should return 401 Unauthorized');
      assertTrue(res.body.message && (res.body.message.includes('token') || res.body.message.includes('authorized')));
    });

    // -----------------------------------------------------------------
    // TEST 2: Order creation validates required bookingId and valid ObjectId (400)
    // -----------------------------------------------------------------
    await testCase('2. Order creation validates required bookingId and valid ObjectId (400)', async () => {
      let res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({});
      assertEqual(res.status, 400, 'Should reject missing bookingId with 400');
      assertTrue(res.body.message.includes('bookingId is required'));

      res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ bookingId: 'invalid-object-id' });
      assertEqual(res.status, 400, 'Should reject malformed ObjectId with 400');
      assertTrue(res.body.message.includes('Invalid booking id'));
    });

    // -----------------------------------------------------------------
    // TEST 3: Order creation rejects non-existent booking (404)
    // -----------------------------------------------------------------
    await testCase('3. Order creation rejects non-existent booking (404)', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ bookingId: nonExistentId });
      assertEqual(res.status, 404, 'Should return 404 Booking not found');
      assertEqual(res.body.message, 'Booking not found');
    });

    // -----------------------------------------------------------------
    // TEST 4: Order creation rejects booking belonging to another user (403)
    // -----------------------------------------------------------------
    await testCase('4. Order creation rejects booking belonging to another user (403 forbidden)', async () => {
      const booking = await createBookingDoc();
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({ bookingId: booking._id.toString() });
      assertEqual(res.status, 403, 'Should return 403 Forbidden');
      assertEqual(res.body.message, 'Not authorized to pay for this booking');
    });

    // -----------------------------------------------------------------
    // TEST 5: Order creation rejects non-approved booking statuses (400)
    // -----------------------------------------------------------------
    await testCase('5. Order creation rejects non-approved booking (pending, cancelled, rejected, completed) (400)', async () => {
      const statuses = ['pending', 'cancelled', 'rejected', 'completed'];
      for (const st of statuses) {
        const b = await createBookingDoc({ status: st });
        const res = await request(app)
          .post('/api/payments/create-order')
          .set('Authorization', `Bearer ${student1Token}`)
          .send({ bookingId: b._id.toString() });
        assertEqual(res.status, 400, `Status ${st} should be rejected with 400`);
        assertTrue(res.body.message.toLowerCase().includes('cannot pay'));
      }
    });

    // -----------------------------------------------------------------
    // TEST 6: Backend is sole authority for amount (frontend amount ignored)
    // -----------------------------------------------------------------
    let activeBooking;
    let createdOrderId;
    await testCase('6. Order creation calculates amount correctly in paise purely from backend Booking.totalAmount', async () => {
      activeBooking = await createBookingDoc({ totalAmount: 750 });
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          bookingId: activeBooking._id.toString(),
          amount: 10, // Tampered frontend amount must be completely ignored
        });
      assertEqual(res.status, 200, 'Order creation should succeed');
      assertEqual(res.body.success, true);
      assertEqual(res.body.order.amount, 75000, 'Amount must be exactly 750 * 100 paise');
      assertEqual(res.body.order.currency, 'INR');
      assertTrue(typeof res.body.order.id === 'string' && res.body.order.id.startsWith('order_'));
      createdOrderId = res.body.order.id;
    });

    // -----------------------------------------------------------------
    // TEST 7: Payment record created and booking paymentStatus becomes pending
    // -----------------------------------------------------------------
    await testCase('7. Order creation creates Payment record with status created and updates booking paymentStatus to pending', async () => {
      const payment = await Payment.findOne({ orderId: createdOrderId });
      assertTrue(Boolean(payment), 'Payment record must exist in database');
      assertEqual(payment.amount, 75000, 'Payment amount must be in paise');
      assertEqual(payment.status, 'created', 'Initial status must be created');
      assertEqual(payment.provider, 'razorpay');

      const updatedBooking = await Booking.findById(activeBooking._id);
      assertEqual(updatedBooking.paymentStatus, 'pending', 'Booking paymentStatus must now be pending');
    });

    // -----------------------------------------------------------------
    // TEST 8: Free booking automatically marks booking paymentStatus as paid
    // -----------------------------------------------------------------
    await testCase('8. Free booking (totalAmount === 0) automatically marks booking paymentStatus as paid without Razorpay order', async () => {
      const freeBooking = await createBookingDoc({
        equipment: freeEquipment._id,
        totalAmount: 0,
        paymentStatus: 'unpaid',
      });
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ bookingId: freeBooking._id.toString() });
      assertEqual(res.status, 200);
      assertEqual(res.body.success, true);
      assertEqual(res.body.isFree, true);
      assertEqual(res.body.booking.paymentStatus, 'paid');

      const refreshed = await Booking.findById(freeBooking._id);
      assertEqual(refreshed.paymentStatus, 'paid', 'Database booking paymentStatus must be paid');
    });

    // -----------------------------------------------------------------
    // TEST 9: Order creation rejects already paid booking (400)
    // -----------------------------------------------------------------
    await testCase('9. Order creation rejects already paid booking (400)', async () => {
      const paidBooking = await createBookingDoc({ paymentStatus: 'paid' });
      const res = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ bookingId: paidBooking._id.toString() });
      assertEqual(res.status, 400);
      assertEqual(res.body.message, 'This booking has already been paid for');
    });

    // -----------------------------------------------------------------
    // TEST 10: Payment verification requires authentication (401)
    // -----------------------------------------------------------------
    await testCase('10. Payment verification requires authentication (401 without token)', async () => {
      const res = await request(app).post('/api/payments/verify').send({
        razorpay_order_id: createdOrderId,
        razorpay_payment_id: 'pay_test_123',
        razorpay_signature: 'fake_sig',
      });
      assertEqual(res.status, 401);
      assertTrue(res.body.message && (res.body.message.includes('token') || res.body.message.includes('authorized')));
    });

    // -----------------------------------------------------------------
    // TEST 11: Payment verification requires all 3 Razorpay parameters (400)
    // -----------------------------------------------------------------
    await testCase('11. Payment verification requires razorpay_order_id, razorpay_payment_id, razorpay_signature (400)', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          razorpay_order_id: createdOrderId,
          razorpay_payment_id: 'pay_test_123',
          // razorpay_signature missing
        });
      assertEqual(res.status, 400);
      assertTrue(res.body.message.includes('razorpay_signature'));
    });

    // -----------------------------------------------------------------
    // TEST 12: Payment verification fails with invalid signature (400)
    // -----------------------------------------------------------------
    let failedOrderBooking;
    let failedOrderId;
    await testCase('12. Payment verification fails with invalid signature (400) and marks payment/booking failed', async () => {
      failedOrderBooking = await createBookingDoc({ totalAmount: 400 });
      const orderRes = await request(app)
        .post('/api/payments/create-order')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ bookingId: failedOrderBooking._id.toString() });
      failedOrderId = orderRes.body.order.id;

      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          razorpay_order_id: failedOrderId,
          razorpay_payment_id: 'pay_test_tampered_001',
          razorpay_signature: 'tampered_invalid_signature_hex_value',
        });
      assertEqual(res.status, 400);
      assertEqual(res.body.success, false);
      assertTrue(res.body.message.includes('Invalid signature'));

      const payment = await Payment.findOne({ orderId: failedOrderId });
      assertEqual(payment.status, 'failed');
      assertTrue(Boolean(payment.errorDetails));

      const refreshedBooking = await Booking.findById(failedOrderBooking._id);
      assertEqual(refreshedBooking.paymentStatus, 'failed');
    });

    // -----------------------------------------------------------------
    // TEST 13: Payment verification succeeds with valid HMAC-SHA256 signature
    // -----------------------------------------------------------------
    const validPaymentId = 'pay_test_' + Date.now();
    const validSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${createdOrderId}|${validPaymentId}`)
      .digest('hex');

    await testCase('13. Payment verification succeeds with valid HMAC-SHA256 signature (200), updates payment and booking status to paid', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          razorpay_order_id: createdOrderId,
          razorpay_payment_id: validPaymentId,
          razorpay_signature: validSignature,
          method: 'upi',
        });
      assertEqual(res.status, 200);
      assertEqual(res.body.success, true);
      assertEqual(res.body.payment.status, 'paid');
      assertEqual(res.body.booking.paymentStatus, 'paid');

      const dbPayment = await Payment.findOne({ orderId: createdOrderId });
      assertEqual(dbPayment.status, 'paid');
      assertEqual(dbPayment.paymentId, validPaymentId);
      assertEqual(dbPayment.method, 'upi');
      assertTrue(Boolean(dbPayment.paidAt));

      const dbBooking = await Booking.findById(activeBooking._id);
      assertEqual(dbBooking.paymentStatus, 'paid');
    });

    // -----------------------------------------------------------------
    // TEST 14: Payment verification idempotency
    // -----------------------------------------------------------------
    await testCase('14. Payment verification is idempotent (re-verifying already paid payment returns success)', async () => {
      const res = await request(app)
        .post('/api/payments/verify')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          razorpay_order_id: createdOrderId,
          razorpay_payment_id: validPaymentId,
          razorpay_signature: validSignature,
        });
      assertEqual(res.status, 200);
      assertEqual(res.body.success, true);
      assertEqual(res.body.payment.status, 'paid');
    });

    // -----------------------------------------------------------------
    // TEST 15: GET /api/payments/booking/:bookingId authorization & retrieval
    // -----------------------------------------------------------------
    await testCase('15. GET /api/payments/booking/:bookingId returns payment details for owner/admin and rejects unauthorized user (403)', async () => {
      // Owner check
      let res = await request(app)
        .get(`/api/payments/booking/${activeBooking._id.toString()}`)
        .set('Authorization', `Bearer ${student1Token}`);
      assertEqual(res.status, 200);
      assertEqual(res.body.success, true);
      assertEqual(res.body.payment.orderId, createdOrderId);
      assertEqual(res.body.booking.paymentStatus, 'paid');

      // Admin check
      res = await request(app)
        .get(`/api/payments/booking/${activeBooking._id.toString()}`)
        .set('Authorization', `Bearer ${adminToken}`);
      assertEqual(res.status, 200);
      assertEqual(res.body.payment.orderId, createdOrderId);

      // Unauthorized user check
      res = await request(app)
        .get(`/api/payments/booking/${activeBooking._id.toString()}`)
        .set('Authorization', `Bearer ${student2Token}`);
      assertEqual(res.status, 403);
      assertEqual(res.body.message, 'Not authorized to view payment for this booking');
    });

    // -----------------------------------------------------------------
    // TEST 16: GET /api/payments/my returns payment history for authenticated user
    // -----------------------------------------------------------------
    await testCase('16. GET /api/payments/my returns user payment history', async () => {
      const res = await request(app)
        .get('/api/payments/my')
        .set('Authorization', `Bearer ${student1Token}`);
      assertEqual(res.status, 200);
      assertEqual(res.body.success, true);
      assertTrue(Array.isArray(res.body.payments));
      assertTrue(res.body.payments.length >= 2); // created active payment + failed payment
      assertEqual(res.body.count, res.body.payments.length);
    });

    // -----------------------------------------------------------------
    // TEST 17: QR Check-in guard blocks check-in for unpaid non-free booking
    // -----------------------------------------------------------------
    const guardEquipment = await Equipment.create({
      name: 'Guard Test Microscope',
      category: 'microscopy',
      institution: institution._id,
      createdBy: manager._id,
      status: 'available',
      isVerified: true,
      pricePerHour: 500,
    });

    let unpaidBooking;
    await testCase('17. QR Check-in guard blocks check-in for unpaid non-free booking (400)', async () => {
      unpaidBooking = await createBookingDoc({
        equipment: guardEquipment._id,
        totalAmount: 1000,
        paymentStatus: 'unpaid',
      });

      const res = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ equipmentId: guardEquipment._id.toString() });

      assertEqual(res.status, 400);
      assertEqual(res.body.message, 'Payment is required before check-in. Please complete payment.');
    });

    // -----------------------------------------------------------------
    // TEST 18: QR Check-in guard allows check-in for paid booking and free booking
    // -----------------------------------------------------------------
    await testCase('18. QR Check-in guard allows check-in for paid booking and free booking', async () => {
      // 18a: Mark the unpaid booking as paid and check in
      unpaidBooking.paymentStatus = 'paid';
      await unpaidBooking.save();

      let res = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ equipmentId: guardEquipment._id.toString() });

      assertEqual(res.status, 201, 'Paid booking check-in must succeed with 201');
      assertEqual(res.body.usageLog.status, 'active');

      // Check out to clean up session
      await request(app)
        .post('/api/usage/check-out')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ equipmentId: guardEquipment._id.toString() });

      // 18b: Free booking check-in without payment
      const freeGuardEquipment = await Equipment.create({
        name: 'Free Guard Sensor',
        category: 'electronics',
        institution: institution._id,
        createdBy: manager._id,
        status: 'available',
        isVerified: true,
        pricePerHour: 0,
      });

      const freeBooking = await createBookingDoc({
        equipment: freeGuardEquipment._id,
        totalAmount: 0,
        paymentStatus: 'unpaid', // free booking with totalAmount 0
      });

      res = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ equipmentId: freeGuardEquipment._id.toString() });

      assertEqual(res.status, 201, 'Free booking check-in must succeed without payment');
      assertEqual(res.body.usageLog.status, 'active');

      // Check out to clean up session
      await request(app)
        .post('/api/usage/check-out')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({ equipmentId: freeGuardEquipment._id.toString() });
    });

    // -----------------------------------------------------------------
    // TEST 19: Health check GET /api/health
    // -----------------------------------------------------------------
    await testCase('19. Health check GET /api/health returns healthy, uptime, timestamp, environment', async () => {
      const res = await request(app).get('/api/health');
      assertEqual(res.status, 200);
      assertEqual(res.body.status, 'healthy');
      assertTrue(Boolean(res.body.timestamp));
      assertTrue(typeof res.body.uptime === 'number');
      assertEqual(res.body.environment, 'test');
    });

    // -----------------------------------------------------------------
    // TEST 20: Production security headers (Helmet) & CORS restrictions
    // -----------------------------------------------------------------
    await testCase('20. Production security headers (Helmet) are present and CORS whitelist is enforced', async () => {
      const res = await request(app).get('/api/health');
      // Verify Helmet headers
      assertEqual(res.headers['x-content-type-options'], 'nosniff', 'X-Content-Type-Options must be nosniff');
      assertEqual(res.headers['x-frame-options'], 'SAMEORIGIN', 'X-Frame-Options must be SAMEORIGIN');
      assertTrue(Boolean(res.headers['x-dns-prefetch-control']), 'X-DNS-Prefetch-Control must be present');

      // Verify CORS whitelist
      // 1. Whitelisted origin
      const corsAllowed = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:5173');
      assertEqual(corsAllowed.headers['access-control-allow-origin'], 'http://localhost:5173');

      // 2. Disallowed origin
      const corsDisallowed = await request(app)
        .get('/api/health')
        .set('Origin', 'http://malicious-site.com');
      assertEqual(corsDisallowed.status, 403, 'Unauthorized CORS origin must be rejected with 403');
    });

    console.log('\n====================================================');
    console.log(`  Phase 7 Tests Completed: Passed: ${passed} | Failed: ${failed}`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (outerErr) {
    console.error('Fatal error during test run:', outerErr);
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    if (mongoServer) {
      await mongoServer.stop();
    }
  }
};

runTests();
