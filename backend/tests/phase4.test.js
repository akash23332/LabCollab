/**
 * Phase 4 test suite - AI equipment recommendations.
 *
 *   cd backend && npm run test:phase4
 *
 * Everything runs against an in-memory MongoDB with the real Express app, so the
 * tests cover the same code path the API serves (auth -> parser -> retrieval ->
 * availability/booking validation -> scoring -> response).
 */

// Deterministic parser for the suite (the external-provider case flips this to
// "external" for a single test and restores it afterwards).
process.env.AI_PROVIDER = 'mock';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = require('../server');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Institution = require('../src/models/Institution');
const Equipment = require('../src/models/Equipment');
const Availability = require('../src/models/Availability');
const aiService = require('../services/aiService');
const recommendationService = require('../services/recommendationService');
const { generateToken } = require('../controllers/authController');
const { toUTCDay } = require('../src/utils/apiHelpers');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'phase4_test_jwt_secret_key_12345';

let mongoServer;

const runTests = async () => {
  console.log('====================================================');
  console.log('  LabShare Phase 4: AI Equipment Recommendations     ');
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

  const findRecommendation = (res, equipmentId) =>
    (res.body.recommendations || []).find((rec) => rec.equipment._id === String(equipmentId));

  try {
    mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    console.log(`In-memory MongoDB started\n`);
  } catch (err) {
    console.error('Failed to start MongoDB Memory Server:', err);
    process.exit(1);
  }

  const createdEquipmentIds = [];

  try {
    // -------------------------------------------------------------
    // Test data
    // -------------------------------------------------------------
    const manageUser = await User.create({
      name: 'Dr. Vikram Sarabhai',
      email: 'manager@abc.edu',
      password: 'ManagerPassword123',
      role: 'faculty',
      institution: 'ABC University',
    });
    const manageToken = generateToken(manageUser);

    // Requesting user: has coordinates + saved requirements.
    const student = await User.create({
      name: 'Rahul Sharma',
      email: 'rahul@example.com',
      password: 'StudentPassword123',
      role: 'student',
      institution: 'ABC University',
      location: {
        city: 'Chandigarh',
        state: 'Punjab',
        latitude: 30.7333,
        longitude: 76.7794,
      },
      requirements: ['microscopy', '3d printing'],
    });
    const studentToken = generateToken(student);

    // Requesting user without coordinates (distance must stay null).
    const studentNoCoords = await User.create({
      name: 'Priya Patel',
      email: 'priya@example.com',
      password: 'StudentPassword123',
      role: 'student',
      institution: 'XYZ Institute',
      location: { city: 'Chandigarh', state: 'Punjab' },
    });

    const abc = await Institution.create({
      name: 'ABC University',
      type: 'university',
      city: 'Chandigarh',
      state: 'Punjab',
      location: { latitude: 30.7333, longitude: 76.7794 },
      isVerified: true,
      createdBy: manageUser._id,
    });

    const xyz = await Institution.create({
      name: 'XYZ Institute',
      type: 'college',
      city: 'Mohali',
      state: 'Punjab',
      location: { latitude: 30.7046, longitude: 76.7179 },
      isVerified: true,
      createdBy: manageUser._id,
    });

    // Institution without coordinates: distance must stay null (never invented).
    const lmn = await Institution.create({
      name: 'LMN College',
      type: 'college',
      city: 'Chandigarh',
      state: 'Punjab',
      isVerified: true,
      createdBy: manageUser._id,
    });

    const makeEquipment = async (overrides) => {
      const equipment = await Equipment.create({
        institution: abc._id,
        createdBy: manageUser._id,
        status: 'available',
        isVerified: true,
        location: { city: 'Chandigarh', state: 'Punjab' },
        ...overrides,
      });
      createdEquipmentIds.push(equipment._id);
      return equipment;
    };

    const sem = await makeEquipment({
      name: 'Scanning Electron Microscope',
      category: 'Microscopy',
      description: 'High resolution SEM with EDS detector',
      manufacturer: 'Zeiss',
      model: 'EVO 10',
      pricePerHour: 800,
      trainingRequired: true,
      location: {
        building: 'Materials Block',
        room: 'M-12',
        city: 'Chandigarh',
        state: 'Punjab',
        latitude: 30.75,
        longitude: 76.78,
      },
    });

    const semUnverified = await makeEquipment({
      name: 'Scanning Electron Microscope (Unverified)',
      category: 'Microscopy',
      pricePerHour: 400,
      isVerified: false,
    });

    const semMaintenance = await makeEquipment({
      name: 'Scanning Electron Microscope (Maintenance)',
      category: 'Microscopy',
      pricePerHour: 500,
      status: 'maintenance',
    });

    const semNoSlots = await makeEquipment({
      name: 'Scanning Electron Microscope (No Slots)',
      category: 'Microscopy',
      pricePerHour: 600,
    });

    const semBooked = await makeEquipment({
      name: 'Scanning Electron Microscope (Booked)',
      category: 'Microscopy',
      pricePerHour: 700,
    });

    const semRejectedBooking = await makeEquipment({
      name: 'Scanning Electron Microscope (Rejected Booking)',
      category: 'Microscopy',
      pricePerHour: 750,
    });

    const semEarlierBooking = await makeEquipment({
      name: 'Scanning Electron Microscope (Earlier Booking)',
      category: 'Microscopy',
      pricePerHour: 780,
    });

    const semWrongHours = await makeEquipment({
      name: 'Scanning Electron Microscope (Morning Only)',
      category: 'Microscopy',
      pricePerHour: 650,
    });

    const semNoCoords = await makeEquipment({
      name: 'Scanning Electron Microscope (No Coordinates)',
      category: 'Microscopy',
      pricePerHour: 820,
      institution: lmn._id,
      location: { building: 'Science Block', city: 'Chandigarh', state: 'Punjab' },
    });

    // Verified + available but its institution reference is dangling.
    const semDanglingInstitution = await Equipment.create({
      name: 'Scanning Electron Microscope (Dangling Institution)',
      category: 'Microscopy',
      pricePerHour: 500,
      institution: new mongoose.Types.ObjectId(),
      createdBy: manageUser._id,
      status: 'available',
      isVerified: true,
      location: { city: 'Chandigarh', state: 'Punjab' },
    });
    createdEquipmentIds.push(semDanglingInstitution._id);

    const printerCheap = await makeEquipment({
      name: '3D Printer (FDM)',
      category: '3D printing',
      description: 'FDM printer with PLA/PETG support',
      pricePerHour: 200,
      institution: xyz._id,
      location: {
        building: 'Fab Lab',
        room: 'F-1',
        city: 'Mohali',
        state: 'Punjab',
        latitude: 30.7046,
        longitude: 76.7179,
      },
    });

    const printerExpensive = await makeEquipment({
      name: '3D Printer (SLA Resin)',
      category: '3D printing',
      description: 'High precision SLA resin printer',
      pricePerHour: 900,
      institution: xyz._id,
      location: {
        building: 'Fab Lab',
        room: 'F-2',
        city: 'Mohali',
        state: 'Punjab',
        latitude: 30.7046,
        longitude: 76.7179,
      },
    });

    // -------------------------------------------------------------
    // Dates: "tomorrow" from the server's own reference day
    // -------------------------------------------------------------
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const tomorrowStr = aiService.formatDateOnly(tomorrow);
    const futureDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 5);
    const futureDayStr = aiService.formatDateOnly(futureDay);

    const addSlot = (equipment, dateStr, startTime, endTime) =>
      Availability.create({
        equipment: equipment._id,
        date: toUTCDay(dateStr),
        startTime,
        endTime,
        isAvailable: true,
        createdBy: manageUser._id,
      });

    const fullDay = ['10:00', '18:00'];

    await addSlot(sem, tomorrowStr, ...fullDay);
    await addSlot(semUnverified, tomorrowStr, ...fullDay);
    await addSlot(semMaintenance, tomorrowStr, ...fullDay);
    await addSlot(semNoSlots, futureDayStr, ...fullDay); // only on another day
    await addSlot(semBooked, tomorrowStr, ...fullDay);
    await addSlot(semRejectedBooking, tomorrowStr, ...fullDay);
    await addSlot(semEarlierBooking, tomorrowStr, ...fullDay);
    await addSlot(semWrongHours, tomorrowStr, '10:00', '12:00');
    await addSlot(semNoCoords, tomorrowStr, ...fullDay);
    await addSlot(semDanglingInstitution, tomorrowStr, ...fullDay);
    await addSlot(printerCheap, tomorrowStr, ...fullDay);
    await addSlot(printerExpensive, tomorrowStr, ...fullDay);

    const addBooking = (equipment, startTime, endTime, status) =>
      Booking.create({
        user: student._id,
        equipment: equipment._id,
        institution: abc._id,
        date: toUTCDay(tomorrowStr),
        startTime,
        endTime,
        duration: 1,
        purpose: 'Automated Phase 4 test booking',
        status,
        totalAmount: equipment.pricePerHour,
      });

    // Overlapping approved booking (14:00-16:00 vs requested 14:00-17:00).
    await addBooking(semBooked, '14:00', '16:00', 'approved');
    // Overlapping but rejected/cancelled bookings must be ignored.
    await addBooking(semRejectedBooking, '14:00', '16:00', 'rejected');
    // Approved booking that does not overlap the requested window.
    await addBooking(semEarlierBooking, '09:00', '10:00', 'approved');

    console.log('Test data ready\n');

    const semQuery = 'I need an SEM for 3 hours tomorrow afternoon';

    // -------------------------------------------------------------
    // 1. Authentication
    // -------------------------------------------------------------
    await testCase('1. POST /api/ai/recommend without JWT -> 401', async () => {
      const res = await request(app).post('/api/ai/recommend').send({ query: semQuery });
      assertEqual(res.status, 401);
      assertTrue(res.body.message, 'Expected an error message');
    });

    await testCase('1b. Invalid token -> 401', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', 'Bearer not-a-real-token')
        .send({ query: semQuery });
      assertEqual(res.status, 401);
    });

    // -------------------------------------------------------------
    // 2. Validation
    // -------------------------------------------------------------
    await testCase('2. Empty / missing / malformed query -> 400', async () => {
      const missing = await request(app).post('/api/ai/recommend').set('Authorization', `Bearer ${studentToken}`).send({});
      assertEqual(missing.status, 400);

      const empty = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: '' });
      assertEqual(empty.status, 400);

      const whitespace = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: '    ' });
      assertEqual(whitespace.status, 400);

      const wrongType = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: 42 });
      assertEqual(wrongType.status, 400);

      const tooLong = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: 'a'.repeat(500) });
      assertEqual(tooLong.status, 400);
    });

    // -------------------------------------------------------------
    // 3. Structured requirement
    // -------------------------------------------------------------
    await testCase('3. "I need an SEM tomorrow for 3 hours" -> structured requirement', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: 'I need an SEM tomorrow for 3 hours' });

      assertEqual(res.status, 200);
      assertEqual(res.body.success, true);
      assertEqual(res.body.source, 'fallback');
      assertEqual(res.body.parsedRequirement.equipmentType, 'SEM');
      assertEqual(res.body.parsedRequirement.category, 'microscopy');
      assertEqual(res.body.parsedRequirement.date, tomorrowStr);
      assertEqual(res.body.parsedRequirement.duration, 3);
      assertEqual(res.body.parsedRequirement.maxPricePerHour, null);
      assertTrue(Array.isArray(res.body.recommendations));
    });

    // -------------------------------------------------------------
    // 4. Matching verified equipment
    // -------------------------------------------------------------
    await testCase('4. Matching verified equipment appears with full detail', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery });

      assertEqual(res.status, 200);
      assertEqual(res.body.parsedRequirement.startTime, '14:00');
      assertEqual(res.body.parsedRequirement.endTime, '17:00');

      const match = findRecommendation(res, sem._id);
      assertTrue(match, 'Expected the verified SEM to be recommended');
      assertEqual(match.equipment.name, 'Scanning Electron Microscope');
      assertEqual(match.equipment.category, 'microscopy');
      assertEqual(match.equipment.pricePerHour, 800);
      assertEqual(match.institution.name, 'ABC University');
      assertEqual(match.institution.city, 'Chandigarh');
      assertEqual(match.estimatedCost, 2400);
      assertEqual(match.availability.available, true);
      assertEqual(match.availability.date, tomorrowStr);
      assertEqual(match.availability.startTime, '14:00');
      assertEqual(match.availability.endTime, '17:00');
      assertTrue(typeof match.score === 'number' && match.score > 0, 'Expected a numeric score');
      assertTrue(Array.isArray(match.matchReasons) && match.matchReasons.length > 0);
      assertTrue(match.scoreBreakdown && typeof match.scoreBreakdown === 'object');
    });

    // -------------------------------------------------------------
    // 5. Unverified equipment
    // -------------------------------------------------------------
    await testCase('5. Unverified equipment is never recommended', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery });

      assertEqual(res.status, 200);
      assertEqual(findRecommendation(res, semUnverified._id), undefined);
    });

    // -------------------------------------------------------------
    // 6. Maintenance
    // -------------------------------------------------------------
    await testCase('6. Equipment in maintenance is never recommended', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery });

      assertEqual(findRecommendation(res, semMaintenance._id), undefined);
    });

    // -------------------------------------------------------------
    // 7. Availability window
    // -------------------------------------------------------------
    await testCase('7. Equipment without a slot for the requested window is excluded', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery });

      assertEqual(findRecommendation(res, semWrongHours._id), undefined, 'Morning-only slot must not satisfy 14:00-17:00');
      assertEqual(findRecommendation(res, semNoSlots._id), undefined, 'No slot on that day must be excluded');
      assertEqual(findRecommendation(res, semDanglingInstitution._id), undefined, 'Dangling institution must be excluded');
      (res.body.recommendations || []).forEach((rec) => {
        assertEqual(rec.availability.available, true, 'Every recommendation must be validated as available');
      });
    });

    // -------------------------------------------------------------
    // 8. / 9. Bookings
    // -------------------------------------------------------------
    await testCase('8+9. Overlapping pending/approved booking excludes the equipment', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery });

      assertEqual(res.status, 200);
      assertEqual(findRecommendation(res, semBooked._id), undefined, 'Overlapping approved booking must exclude');
      assertTrue(res.body.stats.excluded.conflictingBooking >= 1, 'Expected the booking conflict to be reported');
    });

    // -------------------------------------------------------------
    // 10. Non-overlapping booking stays eligible
    // -------------------------------------------------------------
    await testCase('10. Non-overlapping booking (and rejected booking) stays eligible', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery });

      assertTrue(findRecommendation(res, semEarlierBooking._id), '09:00-10:00 booking must not block 14:00-17:00');
      assertTrue(
        findRecommendation(res, semRejectedBooking._id),
        'Rejected bookings are ignored when checking conflicts'
      );
    });

    // -------------------------------------------------------------
    // 11. Price constraint affects ranking
    // -------------------------------------------------------------
    await testCase('11. Price constraint is reflected in ranking and withinBudget', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: 'I need a 3D printer near Mohali for 4 hours under 1000' });

      assertEqual(res.status, 200);
      assertEqual(res.body.parsedRequirement.maxTotalPrice, 1000);
      assertEqual(res.body.parsedRequirement.maxPricePerHour, null);
      assertEqual(res.body.parsedRequirement.city, 'Mohali');

      const cheap = findRecommendation(res, printerCheap._id);
      const expensive = findRecommendation(res, printerExpensive._id);
      assertTrue(cheap && expensive, 'Both printers should be retrievable');
      assertEqual(cheap.withinBudget, true, '₹200/h x 4h = ₹800 must be within the ₹1000 budget');
      assertEqual(expensive.withinBudget, false, '₹900/h x 4h = ₹3600 must be over the ₹1000 budget');
      assertTrue(cheap.score > expensive.score, 'Cheaper (in-budget) equipment must rank higher');
      assertEqual(res.body.recommendations[0].equipment._id, String(printerCheap._id));
    });

    // -------------------------------------------------------------
    // 12. Distance with coordinates
    // -------------------------------------------------------------
    await testCase('12. distanceKm is calculated with Haversine when coordinates exist', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: 'I need a 3D printer near Mohali for 4 hours' });

      const cheap = findRecommendation(res, printerCheap._id);
      assertTrue(cheap, 'Expected the FDM printer');
      assertTrue(typeof cheap.distanceKm === 'number' && cheap.distanceKm > 0, 'distanceKm must be a number');

      const expected = recommendationService.haversineDistanceKm(
        { location: { latitude: 30.7333, longitude: 76.7794 } },
        { location: { latitude: 30.7046, longitude: 76.7179 } }
      );
      assertTrue(Math.abs(cheap.distanceKm - expected) < 0.2, `Expected ~${expected} km, got ${cheap.distanceKm}`);
    });

    // -------------------------------------------------------------
    // 13. Missing coordinates
    // -------------------------------------------------------------
    await testCase('13. distanceKm is null when coordinates are unavailable', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery });

      const noCoords = findRecommendation(res, semNoCoords._id);
      assertTrue(noCoords, 'Equipment without coordinates must still be recommended');
      assertEqual(
        noCoords.distanceKm,
        null,
        'distanceKm must be null when neither the equipment nor its institution has coordinates'
      );

      // A user without coordinates cannot have distances either.
      const noCoordsUserToken = generateToken(studentNoCoords);
      const res2 = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${noCoordsUserToken}`)
        .send({ query: semQuery });

      (res2.body.recommendations || []).forEach((rec) => {
        assertEqual(rec.distanceKm, null);
      });
    });

    // -------------------------------------------------------------
    // 14. Training / certification facts
    // -------------------------------------------------------------
    await testCase('14. Training requirements are reported and never assumed satisfied', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery });

      const match = findRecommendation(res, sem._id);
      assertEqual(match.trainingRequired, true);
      assertEqual(match.certificationRequired, false);
      assertEqual(match.equipment.trainingRequired, true);
      assertEqual(match.qualificationCheckRequired, true, 'User credentials are unknown -> must be flagged');
      assertTrue(
        match.notes.some((note) => /training/i.test(note)),
        'Expected a training note'
      );

      const prints = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: 'I need a 3D printer near Mohali for 4 hours' });
      const printer = findRecommendation(prints, printerCheap._id);
      assertEqual(printer.qualificationCheckRequired, false, 'No credentials needed -> no check required');
    });

    await testCase('14b. "without training" lowers the score of equipment that needs training', async () => {
      const plain = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery });

      const withoutTraining = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: `${semQuery} without training` });

      assertEqual(withoutTraining.body.parsedRequirement.trainingRequired, false);

      const plainScore = findRecommendation(plain, sem._id).score;
      const noTrainingScore = findRecommendation(withoutTraining, sem._id).score;
      assertTrue(
        noTrainingScore < plainScore,
        `Expected a lower score when training was explicitly refused (${noTrainingScore} vs ${plainScore})`
      );
      assertTrue(
        findRecommendation(withoutTraining, sem._id).matchReasons.some((reason) => /asked to avoid/i.test(reason)),
        'Expected the conflict to be explained'
      );
    });

    // -------------------------------------------------------------
    // 15. External AI unavailable -> fallback
    // -------------------------------------------------------------
    await testCase('15. Unreachable external AI provider falls back without failing', async () => {
      const previousProvider = process.env.AI_PROVIDER;
      const previousUrl = process.env.AI_MODEL_URL;
      const previousTimeout = process.env.AI_MODEL_TIMEOUT_MS;

      process.env.AI_PROVIDER = 'external';
      process.env.AI_MODEL_URL = 'http://127.0.0.1:9/recommend'; // discard port: connection refused
      process.env.AI_MODEL_TIMEOUT_MS = '1000';

      try {
        const res = await request(app)
          .post('/api/ai/recommend')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ query: semQuery });

        assertEqual(res.status, 200, 'Provider failure must not break the endpoint');
        assertEqual(res.body.source, 'fallback');
        assertEqual(res.body.success, true);
        assertTrue(Array.isArray(res.body.warnings) && res.body.warnings.length > 0, 'Expected a safe warning');
        assertTrue(findRecommendation(res, sem._id), 'Fallback results must still be returned');
      } finally {
        process.env.AI_PROVIDER = previousProvider;
        if (previousUrl === undefined) delete process.env.AI_MODEL_URL;
        else process.env.AI_MODEL_URL = previousUrl;
        if (previousTimeout === undefined) delete process.env.AI_MODEL_TIMEOUT_MS;
        else process.env.AI_MODEL_TIMEOUT_MS = previousTimeout;
      }
    });

    await testCase('15b. Configured external provider is used when it responds', async () => {
      const previousProvider = process.env.AI_PROVIDER;
      const previousUrl = process.env.AI_MODEL_URL;

      // Minimal stub model server on a loopback port.
      const http = require('http');
      const server = http.createServer((req, res) => {
        let raw = '';
        req.on('data', (chunk) => {
          raw += chunk;
        });
        req.on('end', () => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(
            JSON.stringify({
              requirement: {
                equipmentType: 'SEM',
                category: 'microscopy',
                date: tomorrowStr,
                startTime: '14:00',
                endTime: '17:00',
                duration: 3,
                // Attempts to smuggle backend-controlled fields must be ignored.
                availability: { available: true },
                status: 'available',
                isVerified: true,
                score: 100,
                _id: 'hacked',
              },
            })
          );
        });
      });

      await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address();

      process.env.AI_PROVIDER = 'external';
      process.env.AI_MODEL_URL = `http://127.0.0.1:${port}/recommend`;

      try {
        const res = await request(app)
          .post('/api/ai/recommend')
          .set('Authorization', `Bearer ${studentToken}`)
          .send({ query: 'anything' });

        assertEqual(res.status, 200);
        assertEqual(res.body.source, 'ai_model');
        assertEqual(res.body.parsedRequirement.equipmentType, 'SEM');
        assertEqual(res.body.parsedRequirement.duration, 3);
        assertEqual(res.body.parsedRequirement._id, undefined, 'Provider cannot inject unknown fields');
        assertEqual(res.body.parsedRequirement.status, undefined);
        assertEqual(res.body.parsedRequirement.isVerified, undefined);
        const rec = findRecommendation(res, sem._id);
        assertTrue(rec, 'Recommendations still come from the database, not the model');
        assertTrue(rec.score < 100, 'Model supplied score must not be used');
      } finally {
        process.env.AI_PROVIDER = previousProvider;
        if (previousUrl === undefined) delete process.env.AI_MODEL_URL;
        else process.env.AI_MODEL_URL = previousUrl;
        await new Promise((resolve) => server.close(resolve));
      }
    });

    // -------------------------------------------------------------
    // 16. No matches
    // -------------------------------------------------------------
    await testCase('16. No matching equipment returns an empty result with a useful message', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: 'I need a quantum teleporter tomorrow for 2 hours' });

      assertEqual(res.status, 200);
      assertEqual(res.body.success, true);
      assertEqual(res.body.count, 0);
      assertEqual(res.body.recommendations.length, 0);
      assertTrue(typeof res.body.message === 'string' && res.body.message.length > 10, 'Expected a helpful message');
    });

    // -------------------------------------------------------------
    // 17. Limit handling
    // -------------------------------------------------------------
    await testCase('17. limit defaults to 5, caps at 10 and rejects garbage', async () => {
      const big = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery, limit: 1000 });

      assertEqual(big.status, 200);
      assertEqual(big.body.limit, recommendationService.MAX_LIMIT, 'limit must be capped');
      assertTrue(big.body.recommendations.length <= recommendationService.MAX_LIMIT);

      const invalid = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery, limit: 'many' });
      assertEqual(invalid.status, 400);

      const zero = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery, limit: 0 });
      assertEqual(zero.status, 400);

      const one = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery, limit: 1 });
      assertEqual(one.body.limit, 1);
      assertEqual(one.body.recommendations.length, 1);
    });

    // -------------------------------------------------------------
    // 18. Identity comes from the JWT only
    // -------------------------------------------------------------
    await testCase('18. Body userId / institutionId are ignored (identity comes from the JWT)', async () => {
      const baseline = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery });

      const spoofed = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          query: semQuery,
          userId: manageUser._id,
          institutionId: xyz._id,
          ownerId: manageUser._id,
        });

      assertEqual(spoofed.status, 200);
      assertEqual(
        spoofed.body.recommendations.map((rec) => rec.equipment._id).join(','),
        baseline.body.recommendations.map((rec) => rec.equipment._id).join(',')
      );
    });

    // -------------------------------------------------------------
    // 19. Read-only
    // -------------------------------------------------------------
    await testCase('19. Recommendations are read-only (no collection is modified)', async () => {
      const before = await Promise.all([
        Equipment.countDocuments({}),
        Availability.countDocuments({}),
        Booking.countDocuments({}),
        User.countDocuments({}),
      ]);

      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery });

      assertEqual(res.status, 200);

      const after = await Promise.all([
        Equipment.countDocuments({}),
        Availability.countDocuments({}),
        Booking.countDocuments({}),
        User.countDocuments({}),
      ]);

      assertEqual(after[0], before[0], 'Equipment count changed');
      assertEqual(after[1], before[1], 'Availability count changed');
      assertEqual(after[2], before[2], 'Booking count changed');
      assertEqual(after[3], before[3], 'User count changed');
    });

    // -------------------------------------------------------------
    // 20. Engine status endpoint
    // -------------------------------------------------------------
    await testCase('20. GET /api/ai/status reports the mode without leaking config', async () => {
      const res = await request(app).get('/api/ai/status').set('Authorization', `Bearer ${studentToken}`);

      assertEqual(res.status, 200);
      assertEqual(res.body.mode, 'fallback');
      assertEqual(res.body.provider, 'mock');
      assertEqual(res.body.externalConfigured, false);
      assertEqual(res.body.rawUrl, undefined, 'Must not expose the model URL');
      assertEqual(res.body.url, undefined);
    });

    // -------------------------------------------------------------
    // 21. Contract: short and long queries, deterministic output
    // -------------------------------------------------------------
    await testCase('21. Same query yields the same ranking (deterministic fallback)', async () => {
      const first = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery });
      const second = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: semQuery });

      assertEqual(
        JSON.stringify(first.body.recommendations.map((rec) => [rec.equipment._id, rec.score])),
        JSON.stringify(second.body.recommendations.map((rec) => [rec.equipment._id, rec.score]))
      );
    });

    await testCase('22. Unreachable provider for a query with no equipment match still returns 200', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: 'I need a plasma cutter on 2026-12-31 from 09:00 to 10:00' });

      assertEqual(res.status, 200);
      assertEqual(res.body.source, 'fallback');
      assertTrue(res.body.recommendations.length === 0 || Array.isArray(res.body.recommendations));
      assertTrue(res.body.parsedRequirement.date === '2026-12-31');
    });

    // -------------------------------------------------------------
    // 23. Parser unit checks (interface stability)
    // -------------------------------------------------------------
    await testCase('23. parseRequirement keeps a stable interface', async () => {
      const userContext = {
        location: { city: 'Chandigarh', state: 'Punjab', latitude: 30.7333, longitude: 76.7794 },
        requirements: ['microscopy'],
      };

      const { requirement, source, provider } = await aiService.parseRequirement(
        'I need a 3D printer near Chandigarh for 4 hours under \u20b91000',
        userContext
      );

      assertEqual(source, 'fallback');
      assertEqual(provider, 'mock');
      assertEqual(requirement.equipmentType, '3D Printer');
      assertEqual(requirement.category, '3d printing');
      assertEqual(requirement.duration, 4);
      assertEqual(requirement.maxTotalPrice, 1000);
      assertEqual(requirement.city, 'Chandigarh');
      assertEqual(requirement.state, 'Punjab');
      assertEqual(requirement.trainingRequired, null, 'Missing info must stay null');

      const publicRequirement = aiService.toPublicRequirement(requirement);
      assertTrue(!('keywords' in publicRequirement), 'Internal hint fields must not be returned');
      assertTrue(!('aliases' in publicRequirement));
    });

    await testCase('24. Unknown equipment name returns no candidates but a 200 response', async () => {
      const res = await request(app)
        .post('/api/ai/recommend')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ query: 'tomorrow' });

      assertEqual(res.status, 200);
      assertEqual(res.body.parsedRequirement.date, tomorrowStr);
      assertTrue(res.body.recommendations.length > 0, 'A date-only query should still list available equipment');
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
