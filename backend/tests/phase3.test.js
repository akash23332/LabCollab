const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const Institution = require('../src/models/Institution');
const Equipment = require('../src/models/Equipment');
const Availability = require('../src/models/Availability');
const Booking = require('../models/Booking');
const { generateToken } = require('../controllers/authController');
const { toUTCDay } = require('../src/utils/apiHelpers');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'phase3_test_jwt_secret_key_12345';

let mongoServer;

const runTests = async () => {
  console.log('====================================================');
  console.log('  LabShare Phase 3: Booking & Reservation Management  ');
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
    if (!condition) {
      throw new Error(message || 'Expected condition to be truthy');
    }
  };

  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log(`In-memory MongoDB started at: ${uri}\n`);
  } catch (err) {
    console.error('Failed to start MongoDB Memory Server:', err);
    process.exit(1);
  }

  try {
    // -------------------------------------------------------------
    // Setup Test Data (Institution, Equipment, Availability, Users)
    // -------------------------------------------------------------
    const managerUser = await User.create({
      name: 'Dr. Vikram Sarabhai',
      email: 'manager@abc.edu',
      password: 'ManagerPassword123',
      role: 'faculty',
      institution: 'ABC University',
    });
    const managerToken = generateToken(managerUser);

    const student1 = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      password: 'StudentPassword123',
      role: 'student',
      institution: 'ABC University',
    });
    const student1Token = generateToken(student1);

    const student2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@example.com',
      password: 'StudentPassword123',
      role: 'student',
      institution: 'XYZ Institute',
    });
    const student2Token = generateToken(student2);

    const adminUser = await User.create({
      name: 'Central Admin',
      email: 'admin@labshare.org',
      password: 'AdminPassword123',
      role: 'admin',
    });
    const adminToken = generateToken(adminUser);

    const institution = await Institution.create({
      name: 'ABC University',
      type: 'university',
      createdBy: managerUser._id,
      isVerified: true,
      city: 'Chandigarh',
      state: 'Punjab',
    });

    const equipment = await Equipment.create({
      name: 'Digital Oscilloscope',
      category: 'electronics',
      pricePerHour: 300,
      status: 'available',
      isVerified: true,
      institution: institution._id,
      createdBy: managerUser._id,
    });

    const unverifiedEquipment = await Equipment.create({
      name: 'Unverified Microscope',
      category: 'biology',
      pricePerHour: 150,
      status: 'available',
      isVerified: false,
      institution: institution._id,
      createdBy: managerUser._id,
    });

    // Equipment Availability: 2026-09-21 from 10:00 to 17:00
    const availabilityDate = '2026-09-21';
    const availability = await Availability.create({
      equipment: equipment._id,
      date: toUTCDay(availabilityDate),
      startTime: '10:00',
      endTime: '17:00',
      isAvailable: true,
      createdBy: managerUser._id,
    });

    let booking1Id = null;
    let booking2Id = null;
    let booking3Id = null;

    // -------------------------------------------------------------
    // Test Case 1: Create valid booking (Example End-to-End Test)
    // -------------------------------------------------------------
    await testCase('1. Create valid booking (POST /api/bookings)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          equipment: equipment._id.toString(),
          date: availabilityDate,
          startTime: '12:00',
          endTime: '15:00',
          purpose: 'Electronics research experiment',
        });

      assertEqual(res.status, 201, 'Status should be 201 Created');
      assertEqual(res.body.message, 'Booking request created');
      assertTrue(!!res.body.booking, 'Booking object should be returned');
      assertEqual(res.body.booking.status, 'pending');
      assertEqual(res.body.booking.duration, 3, 'Duration should be 3 hours');
      assertEqual(res.body.booking.totalAmount, 900, 'Total should be ₹900 (3 * 300)');
      assertEqual(res.body.booking.startTime, '12:00');
      assertEqual(res.body.booking.endTime, '15:00');
      assertEqual(res.body.booking.equipment.name, 'Digital Oscilloscope');
      assertEqual(res.body.booking.institution.name, 'ABC University');

      booking1Id = res.body.booking.id;
    });

    // -------------------------------------------------------------
    // Test Case 2: Create booking without login
    // -------------------------------------------------------------
    await testCase('2. Create booking without login (unauthenticated)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .send({
          equipment: equipment._id.toString(),
          date: availabilityDate,
          startTime: '15:00',
          endTime: '16:00',
          purpose: 'Unauthorized attempt',
        });

      assertEqual(res.status, 401, 'Status should be 401 Unauthorized');
    });

    // -------------------------------------------------------------
    // Test Case 3: Create booking for nonexistent equipment
    // -------------------------------------------------------------
    await testCase('3. Create booking for nonexistent equipment', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          equipment: fakeId,
          date: availabilityDate,
          startTime: '10:00',
          endTime: '11:00',
          purpose: 'Testing 404',
        });

      assertEqual(res.status, 404, 'Status should be 404 Not Found');
      assertEqual(res.body.message, 'Equipment not found');
    });

    // -------------------------------------------------------------
    // Test Case 4: Create booking outside availability
    // -------------------------------------------------------------
    await testCase('4. Create booking outside availability window (before 10:00)', async () => {
      // Starts at 09:00, while availability starts at 10:00
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          equipment: equipment._id.toString(),
          date: availabilityDate,
          startTime: '09:00',
          endTime: '11:00',
          purpose: 'Out of bounds experiment',
        });

      assertEqual(res.status, 400, 'Status should be 400 Bad Request');
      assertEqual(
        res.body.message,
        'Selected time is outside the equipment availability.'
      );
    });

    await testCase('4b. Create booking outside availability window (after 17:00)', async () => {
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          equipment: equipment._id.toString(),
          date: availabilityDate,
          startTime: '16:00',
          endTime: '18:00',
          purpose: 'Out of bounds experiment',
        });

      assertEqual(res.status, 400, 'Status should be 400 Bad Request');
      assertEqual(
        res.body.message,
        'Selected time is outside the equipment availability.'
      );
    });

    // -------------------------------------------------------------
    // Test Case 5: Create overlapping booking (double booking prevention)
    // -------------------------------------------------------------
    await testCase('5. Create overlapping booking (double booking prevention)', async () => {
      // Existing booking1 is 12:00 - 15:00
      // Student 2 attempts 13:00 - 16:00 (overlaps with 12:00 - 15:00)
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          equipment: equipment._id.toString(),
          date: availabilityDate,
          startTime: '13:00',
          endTime: '16:00',
          purpose: 'Conflicting experiment',
        });

      assertEqual(res.status, 409, 'Status should be 409 Conflict');
      assertEqual(
        res.body.message,
        'Equipment is already booked for the selected time.'
      );
    });

    // -------------------------------------------------------------
    // Test Case 6: Create non-overlapping booking
    // -------------------------------------------------------------
    await testCase('6. Create non-overlapping booking (adjacent slot 10:00 - 12:00)', async () => {
      // 10:00 - 12:00 ends exactly when 12:00 - 15:00 starts
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student2Token}`)
        .send({
          equipment: equipment._id.toString(),
          date: availabilityDate,
          startTime: '10:00',
          endTime: '12:00',
          purpose: 'Non-overlapping morning session',
        });

      assertEqual(res.status, 201, 'Status should be 201 Created');
      assertEqual(res.body.booking.duration, 2);
      assertEqual(res.body.booking.totalAmount, 600);
      booking2Id = res.body.booking.id;
    });

    // -------------------------------------------------------------
    // Test Case 7 & 8: Calculate duration and price correctly
    // -------------------------------------------------------------
    await testCase('7 & 8. Verify backend duration and totalAmount calculations', async () => {
      // 15:00 - 16:30 -> 1.5 hours @ 300/hr = 450
      const res = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${student1Token}`)
        .send({
          equipment: equipment._id.toString(),
          date: availabilityDate,
          startTime: '15:00',
          endTime: '16:30',
          purpose: 'Laser testing',
        });

      assertEqual(res.status, 201);
      assertEqual(res.body.booking.duration, 1.5, 'Duration should be 1.5 hours');
      assertEqual(res.body.booking.totalAmount, 450, 'Total should be 450');
      booking3Id = res.body.booking.id;
    });

    // -------------------------------------------------------------
    // Test Case 9: Get current user's bookings
    // -------------------------------------------------------------
    await testCase('9. Get current user bookings (GET /api/bookings/my)', async () => {
      const res = await request(app)
        .get('/api/bookings/my')
        .set('Authorization', `Bearer ${student1Token}`);

      assertEqual(res.status, 200);
      assertTrue(Array.isArray(res.body.bookings));
      assertEqual(res.body.count, 2, 'Student 1 should have 2 bookings');
      res.body.bookings.forEach((b) => {
        assertEqual(String(b.user), String(student1._id), 'User ID should match student 1');
      });
    });

    // -------------------------------------------------------------
    // Test Case 10: Confirm user cannot see another user's private bookings
    // -------------------------------------------------------------
    await testCase('10. Confirm user cannot view another user private booking', async () => {
      // Student 2 tries to view Student 1's booking
      const res = await request(app)
        .get(`/api/bookings/${booking1Id}`)
        .set('Authorization', `Bearer ${student2Token}`);

      assertEqual(res.status, 403, 'Should be 403 Forbidden');
      assertEqual(res.body.message, 'You are not authorized to view this booking');
    });

    // -------------------------------------------------------------
    // Test Case 11: Institution manager sees booking requests
    // -------------------------------------------------------------
    await testCase('11. Institution manager sees pending booking requests', async () => {
      const res = await request(app)
        .get('/api/bookings/requests')
        .set('Authorization', `Bearer ${managerToken}`);

      assertEqual(res.status, 200);
      assertTrue(Array.isArray(res.body.requests));
      assertTrue(res.body.count >= 2, 'Manager should see at least 2 pending requests');
      const req1 = res.body.requests.find((r) => r.bookingId === booking1Id);
      assertTrue(!!req1, 'booking1 should be in manager requests');
      assertEqual(req1.student, 'Rahul Sharma');
      assertEqual(req1.equipment, 'Digital Oscilloscope');
      assertEqual(req1.status, 'pending');
    });

    // -------------------------------------------------------------
    // Test Case 12: Student cannot approve booking
    // -------------------------------------------------------------
    await testCase('12. Student cannot approve booking (PATCH /api/bookings/:id/approve)', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${booking1Id}/approve`)
        .set('Authorization', `Bearer ${student1Token}`);

      assertEqual(res.status, 403, 'Status should be 403 Forbidden');
      assertEqual(res.body.message, 'You are not authorized to approve this booking');
    });

    // -------------------------------------------------------------
    // Test Case 13: Authorized manager can approve
    // -------------------------------------------------------------
    await testCase('13. Authorized manager can approve booking', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${booking1Id}/approve`)
        .set('Authorization', `Bearer ${managerToken}`);

      assertEqual(res.status, 200, 'Status should be 200 OK');
      assertEqual(res.body.message, 'Booking approved successfully');
      assertEqual(res.body.booking.status, 'approved');
    });

    // -------------------------------------------------------------
    // Test Case 14: Authorized manager can reject
    // -------------------------------------------------------------
    await testCase('14. Authorized manager can reject booking', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${booking2Id}/reject`)
        .set('Authorization', `Bearer ${managerToken}`);

      assertEqual(res.status, 200, 'Status should be 200 OK');
      assertEqual(res.body.message, 'Booking rejected successfully');
      assertEqual(res.body.booking.status, 'rejected');
    });

    // -------------------------------------------------------------
    // Test Case 15: User can cancel their own booking
    // -------------------------------------------------------------
    await testCase('15. User can cancel their own booking', async () => {
      const res = await request(app)
        .patch(`/api/bookings/${booking3Id}/cancel`)
        .set('Authorization', `Bearer ${student1Token}`);

      assertEqual(res.status, 200, 'Status should be 200 OK');
      assertEqual(res.body.message, 'Booking cancelled successfully');
      assertEqual(res.body.booking.status, 'cancelled');
    });

    // -------------------------------------------------------------
    // Test Case 16: Cannot cancel already completed/rejected booking
    // -------------------------------------------------------------
    await testCase('16. Cannot cancel already rejected booking', async () => {
      // booking2Id was rejected in Test Case 14
      const res = await request(app)
        .patch(`/api/bookings/${booking2Id}/cancel`)
        .set('Authorization', `Bearer ${student2Token}`);

      assertEqual(res.status, 400, 'Status should be 400 Bad Request');
      assertEqual(res.body.message, 'Cannot cancel already rejected booking');
    });

    // -------------------------------------------------------------
    // Test Case 17: Re-check conflicts during approval
    // -------------------------------------------------------------
    await testCase('17. Re-check conflicts during approval', async () => {
      // Suppose two bookings were seeded in 'pending' status that clash:
      // Candidate A: 10:00 - 12:00
      // Candidate B: 11:00 - 13:00 (overlaps with Candidate A)
      const slotA = await Booking.create({
        user: student1._id,
        equipment: equipment._id,
        institution: institution._id,
        date: toUTCDay(availabilityDate),
        startTime: '10:00',
        endTime: '12:00',
        duration: 2,
        totalAmount: 600,
        purpose: 'Concurrency test A',
        status: 'pending',
      });

      const slotB = await Booking.create({
        user: student2._id,
        equipment: equipment._id,
        institution: institution._id,
        date: toUTCDay(availabilityDate),
        startTime: '11:00',
        endTime: '13:00',
        duration: 2,
        totalAmount: 600,
        purpose: 'Concurrency test B',
        status: 'pending',
      });

      // Manager approves Slot A first
      const approveResA = await request(app)
        .patch(`/api/bookings/${slotA._id}/approve`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(approveResA.status, 200);
      assertEqual(approveResA.body.booking.status, 'approved');

      // Now Manager attempts to approve Slot B which overlaps with now-approved Slot A
      const approveResB = await request(app)
        .patch(`/api/bookings/${slotB._id}/approve`)
        .set('Authorization', `Bearer ${managerToken}`);

      assertEqual(approveResB.status, 409, 'Approval should be rejected with 409 Conflict');
      assertEqual(
        approveResB.body.message,
        'Equipment is already booked for the selected time.'
      );
    });

    // -------------------------------------------------------------
    // Test Case 18: Equipment booking history endpoint
    // -------------------------------------------------------------
    await testCase('18. Equipment booking history (GET /api/bookings/equipment/:id)', async () => {
      // Manager views history
      const resManager = await request(app)
        .get(`/api/bookings/equipment/${equipment._id}`)
        .set('Authorization', `Bearer ${managerToken}`);
      assertEqual(resManager.status, 200);
      assertTrue(Array.isArray(resManager.body.bookings));
      assertTrue(resManager.body.count >= 1);

      // Student views history -> Forbidden 403
      const resStudent = await request(app)
        .get(`/api/bookings/equipment/${equipment._id}`)
        .set('Authorization', `Bearer ${student1Token}`);
      assertEqual(resStudent.status, 403);
    });
  } catch (err) {
    console.error('Unexpected test error:', err);
  } finally {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  }

  console.log('\n====================================================');
  console.log(`  Tests Completed: Passed: ${passed} | Failed: ${failed}`);
  console.log('====================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
};

runTests();
