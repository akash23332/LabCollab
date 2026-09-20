/**
 * Phase 6 test suite - QR check-in/out, usage logs and lab analytics.
 *
 *   cd backend && npm run test:phase6
 *
 * Runs against an in-memory MongoDB with the real Express app, so every rule is
 * exercised through the API: JWT -> booking validation -> check-in window ->
 * UsageLog -> check-out -> analytics.
 */

process.env.NODE_ENV = 'test';
process.env.CHECK_IN_EARLY_MINUTES = '15';
process.env.CHECK_IN_LATE_GRACE_MINUTES = '0';
process.env.UNDERUTILIZATION_THRESHOLD = '10';
process.env.ANALYTICS_DEFAULT_RANGE_DAYS = '30';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../server');
const User = require('../models/User');
const Booking = require('../models/Booking');
const UsageLog = require('../models/UsageLog');
const Institution = require('../src/models/Institution');
const Equipment = require('../src/models/Equipment');
const Availability = require('../src/models/Availability');
const { generateToken } = require('../controllers/authController');
const { toUTCDay } = require('../src/utils/apiHelpers');
const usageConfig = require('../src/utils/usageConfig');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'phase6_test_jwt_secret_key_12345';

const DAY_MS = 24 * 60 * 60 * 1000;

let mongoServer;

const runTests = async () => {
  console.log('====================================================');
  console.log('  LabShare Phase 6: QR Check-in/out + Usage + Analytics');
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
    // Time helpers (all booking windows are relative to the server clock)
    // -----------------------------------------------------------------
    const now = new Date();
    const todayStored = usageConfig.storedDay(now);
    const todayStr = usageConfig.formatDateOnly(now);
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59);

    const hhmm = (date) =>
      `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;

    const clamp = (date) => new Date(Math.min(Math.max(date.getTime(), dayStart.getTime()), dayEnd.getTime()));

    /** A booking window that contains "now" (used by the happy-path tests). */
    const windowAroundNow = () => ({
      startTime: hhmm(clamp(new Date(now.getTime() - 60 * 60 * 1000))),
      endTime: hhmm(clamp(new Date(now.getTime() + 120 * 60 * 1000))),
    });

    /**
     * A booking window that opens in the future (too early to check in).
     * A same-day future window only exists before ~22:57 local; the test suite
     * degrades gracefully in the last minutes of the day (see test 3).
     */
    const futureWindowIsRepresentable = now.getHours() * 60 + now.getMinutes() <= 22 * 60 + 45;

    const windowInFuture = () => {
      const start = clamp(new Date(now.getTime() + 61 * 60 * 1000));
      let end = clamp(new Date(start.getTime() + 5 * 60 * 1000));
      if (end.getTime() <= start.getTime()) end = new Date(start.getTime() + 60 * 1000);
      return { startTime: hhmm(start), endTime: hhmm(end) };
    };

    /** A booking window that has already closed (too late to check in). */
    const windowInPast = () => {
      const start = clamp(new Date(now.getTime() - 180 * 60 * 1000));
      let end = clamp(new Date(now.getTime() - 120 * 60 * 1000));
      if (end.getTime() <= start.getTime()) end = new Date(start.getTime() + 60 * 1000);
      return { startTime: hhmm(start), endTime: hhmm(end) };
    };

    const minutesBetween = (a, b) => Math.round((b.getTime() - a.getTime()) / 60000);

    // -----------------------------------------------------------------
    // Test data
    // -----------------------------------------------------------------
    const manager = await User.create({
      name: 'Dr. Lab Manager',
      email: 'manager@abc.edu',
      password: 'Password123',
      role: 'faculty',
      institution: 'ABC University',
    });
    const managerToken = generateToken(manager);

    const admin = await User.create({
      name: 'Central Admin',
      email: 'admin@labshare.org',
      password: 'Password123',
      role: 'admin',
    });
    const adminToken = generateToken(admin);

    const student = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@abc.edu',
      password: 'Password123',
      role: 'student',
      institution: 'ABC University',
    });
    const studentToken = generateToken(student);

    const otherStudent = await User.create({
      name: 'Priya Patel',
      email: 'priya@abc.edu',
      password: 'Password123',
      role: 'student',
      institution: 'ABC University',
    });
    const otherStudentToken = generateToken(otherStudent);

    const outsider = await User.create({
      name: 'Zoya Khan',
      email: 'zoya@xyz.edu',
      password: 'Password123',
      role: 'student',
      institution: 'XYZ Institute',
    });
    const outsiderToken = generateToken(outsider);

    // Keeps the GAMMA analytics fixtures out of the student's own history.
    const gammaStudent = await User.create({
      name: 'Gamma Researcher',
      email: 'researcher@gamma.edu',
      password: 'Password123',
      role: 'student',
      institution: 'GAMMA Analytics Lab',
    });

    const abc = await Institution.create({
      name: 'ABC University',
      type: 'university',
      city: 'Chandigarh',
      state: 'Punjab',
      isVerified: true,
      createdBy: manager._id,
    });

    const xyz = await Institution.create({
      name: 'XYZ Institute',
      type: 'college',
      city: 'Delhi',
      state: 'Delhi',
      isVerified: true,
      createdBy: manager._id,
    });

    const gamma = await Institution.create({
      name: 'GAMMA Analytics Lab',
      type: 'research_lab',
      city: 'Mohali',
      state: 'Punjab',
      isVerified: true,
      createdBy: manager._id,
    });

    const makeEquipment = (overrides) =>
      Equipment.create({
        institution: abc._id,
        createdBy: manager._id,
        status: 'available',
        isVerified: true,
        pricePerHour: 500,
        ...overrides,
      });

    const semEq = await makeEquipment({ name: 'Scanning Electron Microscope', category: 'microscopy', pricePerHour: 800 });
    const freeEq = await makeEquipment({ name: 'Free Oscilloscope', category: 'electronics' });
    const earlyEq = await makeEquipment({ name: 'Early Booking Spectrometer', category: 'spectroscopy' });
    const lateEq = await makeEquipment({ name: 'Late Booking Centrifuge', category: 'biology' });
    const pendingEq = await makeEquipment({ name: 'Pending Booking Printer', category: 'prototyping' });
    const cancelledEq = await makeEquipment({ name: 'Cancelled Booking Printer', category: 'prototyping' });
    const completedEq = await makeEquipment({ name: 'Completed Booking Microscope', category: 'microscopy' });
    const maintenanceEq = await makeEquipment({ name: 'Maintenance XRD', category: 'spectroscopy', status: 'maintenance' });
    const scopeEq = await makeEquipment({ name: 'Scoped Robotic Arm', category: 'robotics' });
    const conflictEq = await makeEquipment({ name: 'Shared 3D Printer', category: 'prototyping' });

    const inWindow = windowAroundNow();

    const makeBooking = (equipment, overrides = {}) =>
      Booking.create({
        user: student._id,
        equipment: equipment._id,
        institution: equipment.institution,
        date: todayStored,
        startTime: inWindow.startTime,
        endTime: inWindow.endTime,
        duration: Math.max(0.5, minutesBetween(
          usageConfig.dateAtStoredTime(todayStored, inWindow.startTime),
          usageConfig.dateAtStoredTime(todayStored, inWindow.endTime)
        ) / 60),
        purpose: 'Phase 6 fixture booking',
        status: 'approved',
        totalAmount: equipment.pricePerHour,
        paymentStatus: 'paid',
        ...overrides,
      });

    // Student's usable booking for the happy path
    const studentBooking = await makeBooking(semEq);

    // Bookings that must be refused for their own reason
    const earlyBooking = futureWindowIsRepresentable
      ? await makeBooking(earlyEq, windowInFuture())
      : null;
    await makeBooking(lateEq, windowInPast());
    await makeBooking(pendingEq, { status: 'pending' });
    await makeBooking(cancelledEq, { status: 'cancelled' });
    await makeBooking(completedEq, { status: 'completed' });

    // Equipment in maintenance still has a valid approved booking
    await makeBooking(maintenanceEq);

    // Another user's booking: the student must not be able to check into it
    const otherStudentBooking = await makeBooking(scopeEq, { user: otherStudent._id });

    // Two approved bookings on one equipment (drives the conflicting-session rule)
    await makeBooking(conflictEq);
    await makeBooking(conflictEq, { user: otherStudent._id });

    // -----------------------------------------------------------------
    // GAMMA analytics fixtures (fully deterministic, independent of the clock)
    // -----------------------------------------------------------------
    const analyticsEq = await Equipment.create({
      name: 'Analytics SEM',
      category: 'microscopy',
      pricePerHour: 800,
      institution: gamma._id,
      createdBy: manager._id,
      isVerified: true,
      status: 'available',
    });
    const idleEq = await Equipment.create({
      name: 'Idle XRD',
      category: 'spectroscopy',
      pricePerHour: 900,
      institution: gamma._id,
      createdBy: manager._id,
      isVerified: true,
      status: 'available',
    });

    // 480 available minutes (analyticsEq) + 120 (idleEq)
    await Availability.create({
      equipment: analyticsEq._id,
      date: todayStored,
      startTime: '10:00',
      endTime: '18:00',
      isAvailable: true,
      createdBy: manager._id,
    });
    await Availability.create({
      equipment: idleEq._id,
      date: todayStored,
      startTime: '10:00',
      endTime: '12:00',
      isAvailable: true,
      createdBy: manager._id,
    });

    const atHour = (day, hour) => new Date(day.getTime() + hour * 60 * 60 * 1000);

    const gammaBooking = (equipment, { status, duration, totalAmount, date = todayStored, user = gammaStudent }) =>
      Booking.create({
        user: user._id,
        equipment: equipment._id,
        institution: gamma._id,
        date,
        startTime: '10:00',
        endTime: '18:00',
        duration,
        purpose: 'Analytics fixture',
        status,
        totalAmount,
      });

    const b1 = await gammaBooking(analyticsEq, { status: 'completed', duration: 3, totalAmount: 2400 });
    const b2 = await gammaBooking(analyticsEq, { status: 'completed', duration: 3, totalAmount: 2400 });
    const b3 = await gammaBooking(analyticsEq, { status: 'approved', duration: 2, totalAmount: 1600 });
    await gammaBooking(analyticsEq, { status: 'pending', duration: 1, totalAmount: 800 });
    await gammaBooking(analyticsEq, { status: 'cancelled', duration: 1, totalAmount: 800 });

    const oldDate = new Date(todayStored.getTime() - 40 * DAY_MS);
    const b6 = await gammaBooking(idleEq, {
      status: 'completed',
      duration: 1,
      totalAmount: 900,
      date: oldDate,
    });

    const makeLog = (booking, equipment, { minutes, status, checkInTime }) =>
      UsageLog.create({
        booking: booking._id,
        user: gammaStudent._id,
        equipment: equipment._id,
        institution: gamma._id,
        checkInTime,
        checkOutTime: status === 'completed' ? new Date(checkInTime.getTime() + minutes * 60000) : null,
        actualDurationMinutes: status === 'completed' ? minutes : null,
        status,
        checkInMethod: 'qr',
      });

    await makeLog(b1, analyticsEq, { minutes: 120, status: 'completed', checkInTime: atHour(todayStored, 6) });
    await makeLog(b2, analyticsEq, { minutes: 180, status: 'completed', checkInTime: atHour(todayStored, 9) });
    await makeLog(b3, analyticsEq, { minutes: 0, status: 'active', checkInTime: atHour(todayStored, 12) });
    await makeLog(b6, idleEq, { minutes: 60, status: 'completed', checkInTime: atHour(oldDate, 6) });

    console.log('Test data ready\n');

    // -----------------------------------------------------------------
    // 1. Authentication
    // -----------------------------------------------------------------
    await testCase('1. Unauthenticated check-in / check-out / usage / QR -> 401', async () => {
      const checkIn = await request(app).post('/api/usage/check-in').send({ equipmentId: String(semEq._id) });
      assertEqual(checkIn.status, 401);

      const checkOut = await request(app).post('/api/usage/check-out').send({ equipmentId: String(semEq._id) });
      assertEqual(checkOut.status, 401);

      const mine = await request(app).get('/api/usage/my');
      assertEqual(mine.status, 401);

      const active = await request(app).get('/api/usage/active');
      assertEqual(active.status, 401);

      const qr = await request(app).get(`/api/equipment/${semEq._id}/qr`);
      assertEqual(qr.status, 401);

      const analytics = await request(app).get(`/api/analytics/institution/${abc._id}`);
      assertEqual(analytics.status, 401);
    });

    // -----------------------------------------------------------------
    // 2. Booking validation
    // -----------------------------------------------------------------
    await testCase('2. No approved booking -> 404, non-approved booking -> 409', async () => {
      const noBooking = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(freeEq._id) });
      assertEqual(noBooking.status, 404);

      const pending = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(pendingEq._id) });
      assertEqual(pending.status, 409);
      assertTrue(/approved/i.test(pending.body.message), 'Pending booking must be explained');

      const cancelled = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(cancelledEq._id) });
      assertEqual(cancelled.status, 409);

      const completed = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(completedEq._id) });
      assertEqual(completed.status, 409);

      // equipment that does not exist
      const missing = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(new mongoose.Types.ObjectId()) });
      assertEqual(missing.status, 404);

      // malformed request body
      const invalid = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({});
      assertEqual(invalid.status, 400);

      const invalidId = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: 'not-an-id' });
      assertEqual(invalidId.status, 400);
    });

    await testCase('2b. Equipment in maintenance -> 409', async () => {
      const res = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(maintenanceEq._id) });
      assertEqual(res.status, 409);
      assertTrue(/maintenance/i.test(res.body.message));
    });

    await testCase('2c. Another user\'s booking cannot be checked into -> 404', async () => {
      assertTrue(otherStudentBooking.user.toString() === otherStudent._id.toString());
      const res = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(scopeEq._id) });
      assertEqual(res.status, 404);
    });

    // -----------------------------------------------------------------
    // 3. / 4. / 5. Check-in window
    // -----------------------------------------------------------------
    await testCase('3. Check-in too early -> 400', async () => {
      const res = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(earlyEq._id) });

      if (futureWindowIsRepresentable) {
        assertTrue(earlyBooking && earlyBooking.status === 'approved');
        assertEqual(res.status, 400);
        assertTrue(/check-in|window|opens|closed/i.test(res.body.message), `Unexpected message: ${res.body.message}`);
      } else {
        // Last minutes of the local day: a same-day future booking cannot exist,
        // so the same request must still be refused (no approved booking today).
        console.log('       [note] end of local day: asserting rejection instead of the window message');
        assertTrue([400, 404].includes(res.status), `Expected rejection, got ${res.status}`);
      }
    });

    await testCase('4. Check-in after the booking window -> 400', async () => {
      const res = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(lateEq._id) });
      assertEqual(res.status, 400);
      assertTrue(/check-in|window|opens|closed/i.test(res.body.message), `Unexpected message: ${res.body.message}`);
    });

    await testCase('5. Approved booking inside the window -> successful check-in', async () => {
      const res = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          equipmentId: String(semEq._id),
          // Values a malicious client might try to inject:
          checkInTime: '2000-01-01T00:00:00.000Z',
          actualDurationMinutes: 9999,
          userId: String(manager._id),
        });

      assertEqual(res.status, 201);
      assertEqual(res.body.success, true);
      assertEqual(res.body.usageLog.status, 'active');
      assertEqual(res.body.usageLog.checkInMethod, 'qr');
      assertEqual(res.body.usageLog.equipment.name, 'Scanning Electron Microscope');
      assertEqual(res.body.booking.status, 'approved');

      // Server clock, not the client payload
      const checkInTime = new Date(res.body.usageLog.checkInTime);
      assertTrue(Math.abs(checkInTime.getTime() - now.getTime()) < 60000, 'checkInTime must come from the server clock');
      assertEqual(res.body.usageLog.actualDurationMinutes, null);

      const booking = await Booking.findById(studentBooking._id);
      assertEqual(booking.status, 'approved', 'Booking stays approved while the session is open');
      assertEqual(booking.duration, studentBooking.duration, 'Planned duration is never overwritten');
    });

    await testCase('6. Duplicate check-in -> 409', async () => {
      const res = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(semEq._id) });
      assertEqual(res.status, 409);
      assertTrue(/already checked in/i.test(res.body.message));
    });

    await testCase('6b. Conflicting active session from another user -> 409', async () => {
      const first = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(conflictEq._id) });
      assertEqual(first.status, 201);

      const second = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${otherStudentToken}`)
        .send({ equipmentId: String(conflictEq._id) });
      assertEqual(second.status, 409);
      assertTrue(/another user|active usage session/i.test(second.body.message));
    });

    // -----------------------------------------------------------------
    // 18. Active sessions
    // -----------------------------------------------------------------
    await testCase('18. GET /api/usage/active returns only my active sessions', async () => {
      const mine = await request(app)
        .get('/api/usage/active')
        .set('Authorization', `Bearer ${studentToken}`);
      assertEqual(mine.status, 200);
      assertEqual(mine.body.success, true);
      // semEq + conflictEq
      assertEqual(mine.body.count, 2);
      mine.body.activeSessions.forEach((session) => {
        assertEqual(session.status, 'active');
        assertTrue(session.equipment.name, 'Active session must include the equipment');
        assertTrue(session.institution.name, 'Active session must include the institution');
        assertTrue(typeof session.elapsedMinutes === 'number');
      });

      const strangers = await request(app)
        .get('/api/usage/active')
        .set('Authorization', `Bearer ${outsiderToken}`);
      assertEqual(strangers.body.count, 0);
    });

    // -----------------------------------------------------------------
    // 12. Own usage history
    // -----------------------------------------------------------------
    await testCase('12. GET /api/usage/my returns only my own records', async () => {
      const mine = await request(app)
        .get('/api/usage/my')
        .set('Authorization', `Bearer ${studentToken}`);
      assertEqual(mine.status, 200);
      assertEqual(mine.body.count, 2);
      mine.body.usageLogs.forEach((log) => {
        assertEqual(log.user, undefined, 'Own history must not include a user block');
        assertTrue(log.equipment.name);
      });

      const outsiderHistory = await request(app)
        .get('/api/usage/my')
        .set('Authorization', `Bearer ${outsiderToken}`);
      assertEqual(outsiderHistory.body.count, 0);

      const invalidStatus = await request(app)
        .get('/api/usage/my?status=weird')
        .set('Authorization', `Bearer ${studentToken}`);
      assertEqual(invalidStatus.status, 400);
    });

    // -----------------------------------------------------------------
    // 13. Check-out rules
    // -----------------------------------------------------------------
    await testCase('7. Another user cannot check out my session -> 403', async () => {
      const res = await request(app)
        .post('/api/usage/check-out')
        .set('Authorization', `Bearer ${outsiderToken}`)
        .send({ equipmentId: String(semEq._id) });
      assertEqual(res.status, 403);
    });

    await testCase('7b. Check-out without any active session -> 404', async () => {
      const res = await request(app)
        .post('/api/usage/check-out')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(freeEq._id) });
      assertEqual(res.status, 404);
    });

    await testCase('8+9+10+11. Valid check-out completes the log, computes the duration and completes the booking', async () => {
      // Simulate 45 minutes of real usage: the server clock decides the rest.
      const activeLog = await UsageLog.findOne({ user: student._id, equipment: semEq._id, status: 'active' });
      assertTrue(activeLog, 'Expected an active usage log');
      const backdatedCheckIn = new Date(Date.now() - 45 * 60000);
      await UsageLog.updateOne({ _id: activeLog._id }, { $set: { checkInTime: backdatedCheckIn } });

      const res = await request(app)
        .post('/api/usage/check-out')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(semEq._id), checkOutTime: '2000-01-01T00:00:00.000Z', actualDurationMinutes: 9999 });

      assertEqual(res.status, 200);
      assertEqual(res.body.success, true);
      assertEqual(res.body.usageLog.status, 'completed');
      assertEqual(res.body.bookingCompleted, true);
      assertEqual(res.body.booking.status, 'completed');

      const duration = res.body.usageLog.actualDurationMinutes;
      assertTrue(duration >= 44 && duration <= 46, `Expected ~45 minutes, got ${duration}`);
      assertTrue(duration !== 9999, 'Client supplied duration must be ignored');

      const log = await UsageLog.findById(activeLog._id);
      assertEqual(log.status, 'completed');
      assertTrue(log.checkOutTime instanceof Date);
      assertEqual(log.actualDurationMinutes, duration);

      const booking = await Booking.findById(studentBooking._id);
      assertEqual(booking.status, 'completed');
      assertEqual(booking.duration, studentBooking.duration, 'Planned booking duration is preserved');

      // The session is now closed
      const active = await request(app).get('/api/usage/active').set('Authorization', `Bearer ${studentToken}`);
      assertEqual(active.body.count, 1, 'Only the conflictEq session remains open');

      // Checking out twice is refused, and a completed booking cannot be re-opened
      const secondCheckOut = await request(app)
        .post('/api/usage/check-out')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(semEq._id) });
      assertEqual(secondCheckOut.status, 404);

      const reCheckIn = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ equipmentId: String(semEq._id) });
      assertEqual(reCheckIn.status, 409);
    });

    // -----------------------------------------------------------------
    // 12b. Usage history with manager authorization
    // -----------------------------------------------------------------
    await testCase('12b. Equipment usage history: manager/admin allowed, student forbidden', async () => {
      const managerRes = await request(app)
        .get(`/api/usage/equipment/${semEq._id}`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(managerRes.status, 200);
      assertTrue(managerRes.body.count >= 1);
      const log = managerRes.body.usageLogs[0];
      assertEqual(log.status, 'completed');
      assertTrue(log.user && log.user.name === 'Rahul Sharma', 'Manager view must include the user');
      assertEqual(log.user.phone, undefined, 'Private profile fields must not be exposed');
      assertTrue(log.booking.date === todayStr);

      const adminRes = await request(app)
        .get(`/api/usage/equipment/${semEq._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      assertEqual(adminRes.status, 200);

      const studentRes = await request(app)
        .get(`/api/usage/equipment/${semEq._id}`)
        .set('Authorization', `Bearer ${studentToken}`);
      assertEqual(studentRes.status, 403);

      const missing = await request(app)
        .get(`/api/usage/equipment/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(missing.status, 404);
    });

    await testCase('13. Manager can view institution usage; outsiders cannot', async () => {
      const managerRes = await request(app)
        .get(`/api/usage/institution/${abc._id}`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(managerRes.status, 200);
      assertEqual(managerRes.body.institution.name, 'ABC University');
      assertTrue(managerRes.body.count >= 2);
      assertTrue(managerRes.body.activeSessions >= 1, 'conflictEq session is still open');

      const adminRes = await request(app)
        .get(`/api/usage/institution/${abc._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      assertEqual(adminRes.status, 200);

      const studentRes = await request(app)
        .get(`/api/usage/institution/${abc._id}`)
        .set('Authorization', `Bearer ${studentToken}`);
      assertEqual(studentRes.status, 403);

      const outsiderRes = await request(app)
        .get(`/api/usage/institution/${abc._id}`)
        .set('Authorization', `Bearer ${outsiderToken}`);
      assertEqual(outsiderRes.status, 403);

      const missing = await request(app)
        .get(`/api/usage/institution/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(missing.status, 404);
    });

    // -----------------------------------------------------------------
    // 14. QR payload
    // -----------------------------------------------------------------
    await testCase('14. Equipment QR identifies equipment only (manager/admin only)', async () => {
      const res = await request(app)
        .get(`/api/equipment/${semEq._id}/qr`)
        .set('Authorization', `Bearer ${managerToken}`);

      assertEqual(res.status, 200);
      assertEqual(res.body.success, true);
      assertEqual(res.body.qr.equipmentId, String(semEq._id));
      assertEqual(res.body.qr.qrPayload, `equipment:${semEq._id}`);
      assertEqual(res.body.qr.qrPayloadObject.type, 'equipment');
      assertEqual(res.body.qr.qrPayloadObject.equipmentId, String(semEq._id));
      assertEqual(res.body.qr.scanPath, `/scan/equipment/${semEq._id}`);

      // No credentials or personal data inside the QR payload
      const payload = JSON.stringify(res.body.qr.qrPayload);
      assertTrue(!/password|token|jwt|secret|email|rahul/i.test(payload), 'QR payload must not contain sensitive data');
      assertTrue(res.body.qr.qrImageDataUrl === null || typeof res.body.qr.qrImageDataUrl === 'string');

      const adminRes = await request(app)
        .get(`/api/equipment/${semEq._id}/qr`)
        .set('Authorization', `Bearer ${adminToken}`);
      assertEqual(adminRes.status, 200);

      const studentRes = await request(app)
        .get(`/api/equipment/${semEq._id}/qr`)
        .set('Authorization', `Bearer ${studentToken}`);
      assertEqual(studentRes.status, 403);

      const missing = await request(app)
        .get(`/api/equipment/${new mongoose.Types.ObjectId()}/qr`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(missing.status, 404);

      const invalid = await request(app)
        .get('/api/equipment/not-an-id/qr')
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(invalid.status, 400);
    });

    await testCase('14b. A scanned qrPayload is accepted as check-in input (still fully validated)', async () => {
      // The student already used the SEM booking, so this must be refused: the
      // payload only identifies equipment.
      const res = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ qrPayload: `equipment:${semEq._id}` });
      assertEqual(res.status, 409);

      const bogus = await request(app)
        .post('/api/usage/check-in')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ qrPayload: 'equipment:not-an-object-id' });
      assertEqual(bogus.status, 400);
    });

    // -----------------------------------------------------------------
    // 15. Equipment analytics
    // -----------------------------------------------------------------
    await testCase('15. Equipment analytics totals are correct', async () => {
      const res = await request(app)
        .get(`/api/analytics/equipment/${analyticsEq._id}?startDate=${todayStr}&endDate=${todayStr}`)
        .set('Authorization', `Bearer ${managerToken}`);

      assertEqual(res.status, 200);
      assertEqual(res.body.equipmentId, String(analyticsEq._id));
      assertEqual(res.body.totalBookings, 5);
      assertEqual(res.body.completedBookings, 2);
      assertEqual(res.body.totalUsageMinutes, 300);
      assertEqual(res.body.totalUsageHours, 5);
      assertEqual(res.body.averageUsageMinutes, 150);
      assertEqual(res.body.availableMinutes, 480);
      assertEqual(res.body.utilizationRate, 62.5);
      assertEqual(res.body.estimatedBookingValue, 6400);
      assertEqual(res.body.bookingStatusBreakdown.approved, 1);
      assertEqual(res.body.bookingStatusBreakdown.pending, 1);
      assertEqual(res.body.bookingStatusBreakdown.cancelled, 1);
      assertEqual(res.body.usageSessions.active, 1);
      assertEqual(res.body.range.startDate, todayStr);
    });

    await testCase('15b. Equipment analytics authorization', async () => {
      const studentRes = await request(app)
        .get(`/api/analytics/equipment/${analyticsEq._id}`)
        .set('Authorization', `Bearer ${studentToken}`);
      assertEqual(studentRes.status, 403);

      const adminRes = await request(app)
        .get(`/api/analytics/equipment/${analyticsEq._id}`)
        .set('Authorization', `Bearer ${adminToken}`);
      assertEqual(adminRes.status, 200);

      const missing = await request(app)
        .get(`/api/analytics/equipment/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(missing.status, 404);

      const invalid = await request(app)
        .get('/api/analytics/equipment/nope')
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(invalid.status, 400);
    });

    // -----------------------------------------------------------------
    // 16. Institution analytics
    // -----------------------------------------------------------------
    await testCase('16. Institution analytics aggregates are correct', async () => {
      const res = await request(app)
        .get(`/api/analytics/institution/${gamma._id}?startDate=${todayStr}&endDate=${todayStr}`)
        .set('Authorization', `Bearer ${managerToken}`);

      assertEqual(res.status, 200);
      assertEqual(res.body.institution.name, 'GAMMA Analytics Lab');
      assertEqual(res.body.totalEquipment, 2);
      assertEqual(res.body.verifiedEquipment, 2);
      assertEqual(res.body.totalBookings, 5);
      assertEqual(res.body.completedBookings, 2);
      assertEqual(res.body.pendingBookings, 1);
      assertEqual(res.body.approvedBookings, 1);
      assertEqual(res.body.totalUsageMinutes, 300);
      assertEqual(res.body.totalUsageHours, 5);
      assertEqual(res.body.activeSessions, 1);
      assertEqual(res.body.totalAvailableMinutes, 600);
      assertEqual(res.body.utilizationRate, 50);
      assertEqual(res.body.estimatedBookingValue, 6400);
      assertTrue(Array.isArray(res.body.notes) && res.body.notes.length > 0);
      assertTrue(
        res.body.notes.some((note) => /not recorded revenue/i.test(note)),
        'estimatedBookingValue must be labelled as an estimate'
      );
    });

    await testCase('16b. Institution analytics authorization + summary alias', async () => {
      const studentRes = await request(app)
        .get(`/api/analytics/institution/${gamma._id}`)
        .set('Authorization', `Bearer ${studentToken}`);
      assertEqual(studentRes.status, 403);

      const outsiderRes = await request(app)
        .get(`/api/analytics/institution/${gamma._id}`)
        .set('Authorization', `Bearer ${outsiderToken}`);
      assertEqual(outsiderRes.status, 403);

      const summary = await request(app)
        .get(`/api/analytics/institution/${gamma._id}/summary?startDate=${todayStr}&endDate=${todayStr}`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(summary.status, 200);
      assertEqual(summary.body.totalEquipment, 2);
      assertEqual(summary.body.dashboard.totalEquipment, 2);
      assertEqual(summary.body.dashboard.activeBookings, 1);
      assertEqual(summary.body.dashboard.usageHours, 5);
      assertEqual(summary.body.dashboard.currentlyInUse, 1);
      assertEqual(summary.body.dashboard.underutilizedCount, 1);
      assertEqual(summary.body.dashboard.mostUsedEquipment.name, 'Analytics SEM');
      assertEqual(summary.body.dashboard.activeSessions[0].equipment.name, 'Analytics SEM');

      const missing = await request(app)
        .get(`/api/analytics/institution/${new mongoose.Types.ObjectId()}`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(missing.status, 404);
    });

    await testCase('16c. Mocking another institution in the URL is not possible (institution-scoped by path + ownership)', async () => {
      // The manager owns XYZ too, so this is a positive control: totals differ per institution.
      const xyzRes = await request(app)
        .get(`/api/analytics/institution/${xyz._id}?startDate=${todayStr}&endDate=${todayStr}`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(xyzRes.status, 200);
      assertEqual(xyzRes.body.totalEquipment, 0);
      assertEqual(xyzRes.body.totalBookings, 0);
      assertEqual(xyzRes.body.utilizationRate, null, 'No availability data -> utilizationRate is null, never invented');
    });

    // -----------------------------------------------------------------
    // 17. Date filtering
    // -----------------------------------------------------------------
    await testCase('17. Date filtering (startDate/endDate) changes the aggregates', async () => {
      const wide = await request(app)
        .get(
          `/api/analytics/institution/${gamma._id}?startDate=${usageConfig.formatDateOnly(
            new Date(todayStored.getTime() - 45 * DAY_MS)
          )}&endDate=${todayStr}`
        )
        .set('Authorization', `Bearer ${managerToken}`);

      assertEqual(wide.status, 200);
      assertEqual(wide.body.totalBookings, 6, 'The 40 day old booking is included');
      assertEqual(wide.body.completedBookings, 3);
      assertEqual(wide.body.totalUsageMinutes, 360);
      assertEqual(wide.body.estimatedBookingValue, 7300);

      // idleEq used 60 minutes of 120 available minutes -> 50%, no longer underutilized
      const idle = wide.body.equipmentUtilization.find((item) => item.equipmentId === String(idleEq._id));
      assertEqual(idle.utilizationRate, 50);
      assertTrue(
        !wide.body.underutilizedEquipment.some((item) => item.equipmentId === String(idleEq._id)),
        '50% is above the 10% threshold'
      );

      const narrow = await request(app)
        .get(`/api/analytics/institution/${gamma._id}?startDate=${todayStr}&endDate=${todayStr}`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(narrow.body.totalBookings, 5);
      assertEqual(narrow.body.totalUsageMinutes, 300);
    });

    await testCase('17b. Invalid date ranges -> 400 and defaults are applied', async () => {
      const bad = await request(app)
        .get(`/api/analytics/institution/${gamma._id}?startDate=not-a-date`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(bad.status, 400);

      const reversed = await request(app)
        .get(`/api/analytics/institution/${gamma._id}?startDate=${todayStr}&endDate=2020-01-01`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(reversed.status, 400);

      const tooWide = await request(app)
        .get(`/api/analytics/institution/${gamma._id}?startDate=2000-01-01&endDate=${todayStr}`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(tooWide.status, 400);

      const defaults = await request(app)
        .get(`/api/analytics/institution/${gamma._id}`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(defaults.status, 200);
      assertEqual(defaults.body.range.endDate, todayStr);
      assertEqual(defaults.body.range.days, 30);
    });

    // -----------------------------------------------------------------
    // 18. Underutilization / most used
    // -----------------------------------------------------------------
    await testCase('19. Underutilized equipment is derived from factual metrics', async () => {
      const res = await request(app)
        .get(`/api/analytics/institution/${gamma._id}?startDate=${todayStr}&endDate=${todayStr}`)
        .set('Authorization', `Bearer ${managerToken}`);

      assertEqual(res.body.underutilizationThreshold, 10);
      assertEqual(res.body.underutilizedEquipment.length, 1);

      const [item] = res.body.underutilizedEquipment;
      assertEqual(item.equipmentId, String(idleEq._id));
      assertEqual(item.name, 'Idle XRD');
      assertEqual(item.utilizationRate, 0);
      assertEqual(item.totalUsageHours, 0);
      assertEqual(item.availableMinutes, 120);

      assertEqual(res.body.mostUsedEquipment[0].equipmentId, String(analyticsEq._id));
      assertEqual(res.body.mostUsedEquipment[0].usageHours, 5);
      assertTrue(
        !res.body.mostUsedEquipment.some((eq) => eq.usageMinutes === 0),
        'Zero-usage equipment must not be listed as most used'
      );
      assertEqual(res.body.leastUsedEquipment[0].equipmentId, String(idleEq._id));

      // No subjective labels anywhere in the payload
      assertTrue(!/bad equipment|poor|worst/i.test(JSON.stringify(res.body.underutilizedEquipment)));
    });

    // -----------------------------------------------------------------
    // 20. Duration calculation unit checks
    // -----------------------------------------------------------------
    await testCase('20. UsageLog stores server-calculated durations only', async () => {
      const logs = await UsageLog.find({ institution: gamma._id }).lean();
      logs.forEach((log) => {
        if (log.status === 'completed') {
          const expected = Math.round((new Date(log.checkOutTime) - new Date(log.checkInTime)) / 60000);
          assertEqual(log.actualDurationMinutes, expected, 'actualDurationMinutes must match the timestamps');
        } else {
          assertEqual(log.checkOutTime, null);
          assertEqual(log.actualDurationMinutes, null);
        }
      });

      const completedLogCount = await UsageLog.countDocuments({ status: 'completed' });
      assertTrue(completedLogCount >= 4);
    });

    await testCase('20b. usageConfig helpers keep one source of truth', async () => {
      const config = usageConfig.getCheckInConfig();
      assertEqual(config.earlyMinutes, 15);
      assertEqual(config.lateGraceMinutes, 0);
      assertEqual(usageConfig.getUnderutilizationThreshold(), 10);
      assertEqual(usageConfig.getAnalyticsRangeDays(), 30);

      const day = usageConfig.storedDay(new Date());
      assertEqual(day.toISOString().slice(0, 10), todayStr);

      const range = usageConfig.resolveDateRange({ defaultDays: 7 });
      assertEqual(range.days, 7);
      assertEqual(range.endDate, todayStr);
    });
  } catch (err) {
    console.error('Unexpected test error:', err);
  } finally {
    await mongoose.disconnect();
    if (mongoServer) await mongoServer.stop();
  }

  console.log('\n====================================================');
  console.log(`  Tests Completed: Passed: ${passed} | Failed: ${failed}`);
  console.log('====================================================\n');

  process.exit(failed > 0 ? 1 : 0);
};

runTests();
