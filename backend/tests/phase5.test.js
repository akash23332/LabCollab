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

process.env.JWT_SECRET = process.env.JWT_SECRET || 'phase5_test_jwt_secret_12345';

let mongoServer;

const runTests = async () => {
  console.log('====================================================');
  console.log('  LabShare Phase 5: Lab Network & Location Discovery  ');
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
    // Setup Test Data
    // -------------------------------------------------------------
    const manager = await User.create({
      name: 'Dr. Scientist',
      email: 'scientist@labshare.org',
      password: 'Password123',
      role: 'faculty',
    });

    // User located in Sector 17, Chandigarh (30.7046, 76.7179)
    const userWithLocation = await User.create({
      name: 'Local Researcher',
      email: 'local@research.org',
      password: 'Password123',
      role: 'student',
      location: {
        city: 'Chandigarh',
        state: 'Punjab',
        latitude: 30.7046,
        longitude: 76.7179,
      },
    });
    const tokenWithLoc = generateToken(userWithLocation);

    // User without stored location
    const userWithoutLocation = await User.create({
      name: 'No Location User',
      email: 'noloc@research.org',
      password: 'Password123',
      role: 'student',
    });
    const tokenNoLoc = generateToken(userWithoutLocation);

    // Institution A: Panjab University (~7 km from user origin)
    const instA = await Institution.create({
      name: 'Panjab University Science Dept',
      type: 'university',
      city: 'Chandigarh',
      state: 'Punjab',
      isVerified: true,
      createdBy: manager._id,
      location: {
        latitude: 30.7600,
        longitude: 76.7640,
      },
    });

    // Institution B: IIT Ropar (~45 km from user origin)
    const instB = await Institution.create({
      name: 'IIT Ropar Advanced Instrumentation',
      type: 'university',
      city: 'Rupnagar',
      state: 'Punjab',
      isVerified: true,
      createdBy: manager._id,
      location: {
        latitude: 30.9670,
        longitude: 76.5330,
      },
    });

    // Institution Far: Delhi Tech University (~240 km from user origin)
    const instFar = await Institution.create({
      name: 'Delhi Tech Lab',
      type: 'university',
      city: 'Delhi',
      state: 'Delhi',
      isVerified: true,
      createdBy: manager._id,
      location: {
        latitude: 28.7495,
        longitude: 77.1170,
      },
    });

    // Unverified Institution (~3 km from user origin)
    const instUnverified = await Institution.create({
      name: 'Unverified Testing Lab',
      type: 'college',
      city: 'Chandigarh',
      state: 'Punjab',
      isVerified: false,
      createdBy: manager._id,
      location: {
        latitude: 30.7100,
        longitude: 76.7200,
      },
    });

    // Institution with missing coordinates
    const instNoCoords = await Institution.create({
      name: 'Remote Research Station',
      type: 'research_lab',
      city: 'Shimla',
      state: 'Himachal Pradesh',
      isVerified: true,
      createdBy: manager._id,
      location: {},
    });

    // Equipments in Inst A
    const eqSEM_A = await Equipment.create({
      name: 'Scanning Electron Microscope (SEM)',
      category: 'microscopy',
      description: 'High resolution field emission SEM',
      pricePerHour: 800,
      status: 'available',
      isVerified: true,
      institution: instA._id,
      createdBy: manager._id,
      trainingRequired: true,
      certificationRequired: false,
    });

    const eq3D_A = await Equipment.create({
      name: 'Industrial 3D Printer',
      category: 'prototyping',
      pricePerHour: 1200,
      status: 'available',
      isVerified: true,
      institution: instA._id,
      createdBy: manager._id,
      trainingRequired: false,
      certificationRequired: false,
    });

    const eqMaint_A = await Equipment.create({
      name: 'Fluorescence Microscope',
      category: 'microscopy',
      pricePerHour: 500,
      status: 'maintenance',
      isVerified: true,
      institution: instA._id,
      createdBy: manager._id,
      trainingRequired: false,
      certificationRequired: false,
    });

    const eqUnverified_A = await Equipment.create({
      name: 'Unverified Centrifuge',
      category: 'biology',
      pricePerHour: 100,
      status: 'available',
      isVerified: false,
      institution: instA._id,
      createdBy: manager._id,
    });

    // Equipments in Inst B
    const eqOsc_B = await Equipment.create({
      name: 'Digital Storage Oscilloscope',
      category: 'electronics',
      pricePerHour: 300,
      status: 'available',
      isVerified: true,
      institution: instB._id,
      createdBy: manager._id,
    });

    const eqSEM_B = await Equipment.create({
      name: 'Tabletop SEM',
      category: 'microscopy',
      pricePerHour: 1500,
      status: 'available',
      isVerified: true,
      institution: instB._id,
      createdBy: manager._id,
    });

    // Equipments in Unverified Inst
    await Equipment.create({
      name: 'X-Ray Diffractometer (XRD)',
      category: 'spectroscopy',
      pricePerHour: 900,
      status: 'available',
      isVerified: true,
      institution: instUnverified._id,
      createdBy: manager._id,
    });

    // Availability slot on eqSEM_A: 2026-09-22 from 10:00 to 17:00
    const slotDate = '2026-09-22';
    await Availability.create({
      equipment: eqSEM_A._id,
      date: toUTCDay(slotDate),
      startTime: '10:00',
      endTime: '17:00',
      isAvailable: true,
      createdBy: manager._id,
    });

    // Existing approved booking on eqSEM_A: 13:00 to 15:00
    await Booking.create({
      user: manager._id,
      equipment: eqSEM_A._id,
      institution: instA._id,
      date: toUTCDay(slotDate),
      startTime: '13:00',
      endTime: '15:00',
      duration: 2,
      totalAmount: 1600,
      purpose: 'Existing research',
      status: 'approved',
    });

    // -------------------------------------------------------------
    // Test Case 1: GET /api/labs/nearby without JWT -> 401
    // -------------------------------------------------------------
    await testCase('1. GET /api/labs/nearby without JWT -> 401 Unauthorized', async () => {
      const res = await request(app).get('/api/labs/nearby');
      assertEqual(res.status, 401);
    });

    // -------------------------------------------------------------
    // Test Case 2: Authenticated user with stored location -> nearby labs returned
    // -------------------------------------------------------------
    await testCase('2. Authenticated user with stored location -> nearby labs returned', async () => {
      const res = await request(app)
        .get('/api/labs/nearby')
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      assertEqual(res.body.success, true);
      assertEqual(res.body.origin.latitude, 30.7046);
      assertEqual(res.body.origin.longitude, 76.7179);
      assertTrue(Array.isArray(res.body.labs));
      assertTrue(res.body.count >= 2);

      // Verify default 50km radius returns instA and instB, but NOT instFar (~240km)
      const labNames = res.body.labs.map((l) => l.institution.name);
      assertTrue(labNames.includes('Panjab University Science Dept'));
      assertTrue(labNames.includes('IIT Ropar Advanced Instrumentation'));
      assertTrue(!labNames.includes('Delhi Tech Lab'), 'Delhi Tech Lab should be outside 50km radius');

      // Verify sorted by distance ascending
      const d0 = res.body.labs[0].distanceKm;
      const d1 = res.body.labs[1].distanceKm;
      assertTrue(d0 <= d1, 'Labs should be sorted distance ascending');
    });

    // -------------------------------------------------------------
    // Test Case 3: Explicit lat/lng takes precedence
    // -------------------------------------------------------------
    await testCase('3. Explicit lat/lng -> explicit coordinates used as origin', async () => {
      // Provide coordinates near Delhi
      const res = await request(app)
        .get('/api/labs/nearby?lat=28.7490&lng=77.1170')
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      assertEqual(res.body.origin.latitude, 28.7490);
      assertEqual(res.body.origin.longitude, 77.1170);

      // Delhi Tech Lab is right next to these coordinates (< 1 km)
      const firstLab = res.body.labs[0];
      assertEqual(firstLab.institution.name, 'Delhi Tech Lab');
      assertTrue(firstLab.distanceKm < 5);
    });

    // -------------------------------------------------------------
    // Test Case 4: No user location and no lat/lng -> 400
    // -------------------------------------------------------------
    await testCase('4. No user location and no lat/lng -> 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/labs/nearby')
        .set('Authorization', `Bearer ${tokenNoLoc}`);

      assertEqual(res.status, 400);
      assertEqual(res.body.message, 'Location is required to find nearby laboratories.');
    });

    // -------------------------------------------------------------
    // Test Case 5: radius=10 -> only labs within 10 km
    // -------------------------------------------------------------
    await testCase('5. radius=10 -> only labs within 10 km', async () => {
      const res = await request(app)
        .get('/api/labs/nearby?radius=10')
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      assertEqual(res.body.radiusKm, 10);
      const labNames = res.body.labs.map((l) => l.institution.name);
      assertTrue(labNames.includes('Panjab University Science Dept'), 'Panjab University (~7km) should be in radius 10');
      assertTrue(!labNames.includes('IIT Ropar Advanced Instrumentation'), 'IIT Ropar (~45km) should NOT be in radius 10');
    });

    // -------------------------------------------------------------
    // Test Case 6: radius invalid -> 400
    // -------------------------------------------------------------
    await testCase('6. radius invalid (negative or string) -> 400 Bad Request', async () => {
      const resNegative = await request(app)
        .get('/api/labs/nearby?radius=-10')
        .set('Authorization', `Bearer ${tokenWithLoc}`);
      assertEqual(resNegative.status, 400);

      const resString = await request(app)
        .get('/api/labs/nearby?radius=abc')
        .set('Authorization', `Bearer ${tokenWithLoc}`);
      assertEqual(resString.status, 400);
    });

    // -------------------------------------------------------------
    // Test Case 7: radius greater than maximum (500 km) -> 400
    // -------------------------------------------------------------
    await testCase('7. radius greater than 500 km -> 400 Bad Request', async () => {
      const res = await request(app)
        .get('/api/labs/nearby?radius=600')
        .set('Authorization', `Bearer ${tokenWithLoc}`);
      assertEqual(res.status, 400);
      assertTrue(res.body.message.includes('500 km'));
    });

    // -------------------------------------------------------------
    // Test Case 8: equipment=SEM -> institutions with matching verified SEM
    // -------------------------------------------------------------
    await testCase('8. equipment=SEM -> institutions containing matching verified SEM equipment', async () => {
      const res = await request(app)
        .get('/api/labs/nearby?equipment=SEM')
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      assertTrue(res.body.labs.length >= 1);
      res.body.labs.forEach((lab) => {
        assertTrue(
          lab.equipment.some((e) => e.name.toLowerCase().includes('sem')),
          'Every returned institution must have matching SEM equipment'
        );
      });
    });

    // -------------------------------------------------------------
    // Test Case 9: category=microscopy -> matching category
    // -------------------------------------------------------------
    await testCase('9. category=microscopy -> matching category', async () => {
      const res = await request(app)
        .get('/api/labs/nearby?category=microscopy')
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      assertTrue(res.body.labs.length >= 1);
      res.body.labs.forEach((lab) => {
        assertTrue(
          lab.equipment.every((e) => e.category.toLowerCase() === 'microscopy'),
          'All equipment listed must match microscopy category'
        );
      });
    });

    // -------------------------------------------------------------
    // Test Case 10: maxPrice=1000 -> equipment price <= 1000
    // -------------------------------------------------------------
    await testCase('10. maxPrice=1000 -> equipment pricePerHour <= 1000', async () => {
      const res = await request(app)
        .get('/api/labs/nearby?maxPrice=1000')
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      res.body.labs.forEach((lab) => {
        lab.equipment.forEach((e) => {
          assertTrue(e.pricePerHour <= 1000, `Equipment price ${e.pricePerHour} should be <= 1000`);
        });
      });
    });

    // -------------------------------------------------------------
    // Test Case 11: Unverified institution -> excluded
    // -------------------------------------------------------------
    await testCase('11. Unverified institution -> excluded from public nearby labs', async () => {
      const res = await request(app)
        .get('/api/labs/nearby')
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      const names = res.body.labs.map((l) => l.institution.name);
      assertTrue(!names.includes('Unverified Testing Lab'));
    });

    // -------------------------------------------------------------
    // Test Case 12: Unverified equipment -> excluded from matching equipment
    // -------------------------------------------------------------
    await testCase('12. Unverified equipment -> excluded from matching equipment', async () => {
      const res = await request(app)
        .get('/api/labs/nearby')
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      res.body.labs.forEach((lab) => {
        lab.equipment.forEach((e) => {
          assertEqual(e.isVerified, true, 'Unverified equipment must not be returned');
        });
      });
    });

    // -------------------------------------------------------------
    // Test Case 13: Equipment in maintenance -> not shown as available
    // -------------------------------------------------------------
    await testCase('13. Equipment in maintenance -> status maintenance, availability false', async () => {
      const res = await request(app)
        .get('/api/labs/nearby?category=microscopy')
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      const instALab = res.body.labs.find(
        (l) => l.institution.name === 'Panjab University Science Dept'
      );
      assertTrue(!!instALab);
      const maintEq = instALab.equipment.find((e) => e.name === 'Fluorescence Microscope');
      assertTrue(!!maintEq);
      assertEqual(maintEq.status, 'maintenance');
      assertEqual(maintEq.availability, false, 'Equipment in maintenance must have availability false');
    });

    // -------------------------------------------------------------
    // Test Case 14: Requested date/time -> availability checked against Availability slot
    // -------------------------------------------------------------
    await testCase('14. Requested date/time within availability slot and no clash -> availability true', async () => {
      // 10:00 - 12:00 is within slot (10:00 - 17:00) and does not clash with booking (13:00 - 15:00)
      const res = await request(app)
        .get(`/api/labs/nearby?equipment=SEM&date=${slotDate}&startTime=10:00&endTime=12:00`)
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      const instALab = res.body.labs.find(
        (l) => l.institution.name === 'Panjab University Science Dept'
      );
      assertTrue(!!instALab);
      const semEq = instALab.equipment.find((e) => e.name.includes('Scanning Electron Microscope'));
      assertTrue(!!semEq);
      assertEqual(semEq.availability, true);
    });

    // -------------------------------------------------------------
    // Test Case 15: Existing overlapping booking -> equipment marked unavailable
    // -------------------------------------------------------------
    await testCase('15. Existing overlapping booking -> equipment marked unavailable (availability: false)', async () => {
      // 12:00 - 14:00 overlaps with existing booking 13:00 - 15:00
      const res = await request(app)
        .get(`/api/labs/nearby?equipment=SEM&date=${slotDate}&startTime=12:00&endTime=14:00`)
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      const instALab = res.body.labs.find(
        (l) => l.institution.name === 'Panjab University Science Dept'
      );
      assertTrue(!!instALab);
      const semEq = instALab.equipment.find((e) => e.name.includes('Scanning Electron Microscope'));
      assertTrue(!!semEq);
      assertEqual(semEq.availability, false, 'Overlapping booking must mark equipment availability false');
    });

    // -------------------------------------------------------------
    // Test Case 16: Missing equipment coordinates handled safely
    // -------------------------------------------------------------
    await testCase('16. Missing equipment coordinates -> handled safely without error', async () => {
      // Equipment without location coordinates should still be returned under its institution
      const res = await request(app)
        .get('/api/labs/nearby?equipment=Digital')
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      assertTrue(res.body.labs.length >= 1);
      const osc = res.body.labs[0].equipment[0];
      assertEqual(osc.name, 'Digital Storage Oscilloscope');
    });

    // -------------------------------------------------------------
    // Test Case 17: Missing institution coordinates handled safely
    // -------------------------------------------------------------
    await testCase('17. Missing institution coordinates -> distanceKm null, handled safely', async () => {
      // Fetch single lab for instNoCoords
      const res = await request(app)
        .get(`/api/labs/${instNoCoords._id}`)
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      assertEqual(res.body.lab.institution.name, 'Remote Research Station');
      assertEqual(res.body.lab.institution.location.latitude, null);
      assertEqual(res.body.lab.institution.location.longitude, null);
    });

    // -------------------------------------------------------------
    // Test Case 18: GET /api/labs/:id -> institution + equipment details
    // -------------------------------------------------------------
    await testCase('18. GET /api/labs/:id -> returns institution and verified equipment details', async () => {
      const res = await request(app)
        .get(`/api/labs/${instA._id}`)
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      assertEqual(res.body.success, true);
      assertEqual(res.body.lab.institution.name, 'Panjab University Science Dept');
      assertTrue(res.body.lab.equipment.length >= 2);
      // Unverified equipment must not be returned
      const unverified = res.body.lab.equipment.find((e) => e.name === 'Unverified Centrifuge');
      assertTrue(!unverified);
    });

    // -------------------------------------------------------------
    // Test Case 19: limit -> maximum result protection works
    // -------------------------------------------------------------
    await testCase('19. limit -> caps results to specified limit', async () => {
      const res = await request(app)
        .get('/api/labs/nearby?limit=1')
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      assertEqual(res.body.labs.length, 1);
    });

    // -------------------------------------------------------------
    // Test Case 20: Empty search -> nearby verified institutions returned
    // -------------------------------------------------------------
    await testCase('20. Empty search -> nearby verified institutions returned', async () => {
      const res = await request(app)
        .get('/api/labs/nearby')
        .set('Authorization', `Bearer ${tokenWithLoc}`);

      assertEqual(res.status, 200);
      assertTrue(res.body.labs.length >= 2);
      assertTrue(res.body.count >= 2);
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
