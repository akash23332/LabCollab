/**
 * Phase 2 end-to-end API tests.
 *
 *   cd backend && npm test
 *
 * Boots the real Express app against a real MongoDB:
 *  - uses MONGODB_URI when it is set (e.g. a local mongod), otherwise
 *  - starts a throwaway in-memory MongoDB (mongodb-memory-server).
 */
const assert = require('assert');

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_only_jwt_secret';

let baseUrl;
let server;
let mongo;
let mongoose;
let User;

const results = [];

const test = async (name, fn) => {
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  PASS  ${name}`);
  } catch (error) {
    results.push({ name, ok: false, error });
    console.log(`  FAIL  ${name}\n        ${error.message}`);
  }
};

const api = async (method, path, { token, body } = {}) => {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  let json = null;
  try {
    json = await response.json();
  } catch {
    json = null;
  }

  return { status: response.status, body: json };
};  const ctx = {};


const setup = async () => {
  // Safety: this suite creates, mutates and deletes documents. It therefore only
  // ever talks to a throwaway in-memory MongoDB unless the developer explicitly
  // opts in to their own database.
  const externalUri =
    process.env.ALLOW_REAL_DB_TESTS === 'true' ? process.env.MONGODB_URI : null;

  let uri = externalUri;

  if (!uri) {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongo = await MongoMemoryServer.create();
    uri = mongo.getUri();
    console.log('[test] using in-memory MongoDB');
  } else {
    console.log(`[test] using external MongoDB: ${uri}`);
  }

  // Phase 1's connectDB prefers MONGO_URI, and dotenv never overrides variables
  // that are already set - so pin both names *before* the app (and dotenv) load.
  process.env.MONGODB_URI = uri;
  process.env.MONGO_URI = uri;

  mongoose = require('mongoose');

  // Phase 1 exports connectDB directly; tolerate either export shape.
  const dbModule = require('../src/config/db');
  const connectDB = typeof dbModule === 'function' ? dbModule : dbModule.connectDB;
  await connectDB(uri);

  if (mongo) {
    // Fail loudly rather than test against the wrong database.
    assert.strictEqual(
      String(mongoose.connection.port),
      new URL(uri).port,
      'test harness connected to an unexpected MongoDB'
    );
  }

  // Phase 1 owns the app entry point (flat layout); src/ re-exports it.
  User = require('../models/User');
  const app = require('../server');

  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;

  // Admin accounts are provisioned out of band (register is forced to "student").
  const admin = await User.create({
    name: 'Admin',
    email: 'admin@test.dev',
    password: 'admin123',
    role: 'admin',
  });
  ctx.adminId = admin._id.toString();

  const student = await User.create({
    name: 'Student',
    email: 'student@test.dev',
    password: 'student123',
    role: 'student',
  });
  ctx.studentId = student._id.toString();

  const outsider = await User.create({
    name: 'Outsider',
    email: 'outsider@test.dev',
    password: 'outsider123',
    role: 'student',
  });
  ctx.outsiderId = outsider._id.toString();

  const adminLogin = await api('POST', '/api/auth/login', {
    body: { email: 'admin@test.dev', password: 'admin123' },
  });
  const studentLogin = await api('POST', '/api/auth/login', {
    body: { email: 'student@test.dev', password: 'student123' },
  });
  const outsiderLogin = await api('POST', '/api/auth/login', {
    body: { email: 'outsider@test.dev', password: 'outsider123' },
  });

  ctx.adminToken = adminLogin.body?.token;
  ctx.studentToken = studentLogin.body?.token;
  ctx.outsiderToken = outsiderLogin.body?.token;

  if (!ctx.adminToken || !ctx.studentToken || !ctx.outsiderToken) {
    throw new Error('Login failed during setup - no tokens issued');
  }
};

const institutionPayload = {
  name: 'ABC University',
  type: 'university',
  description: 'Engineering and research university',
  email: 'lab@abc.edu',
  phone: '9876543210',
  address: 'University Road',
  city: 'Chandigarh',
  state: 'Punjab',
  country: 'India',
  location: { latitude: 30.7333, longitude: 76.7794 },
};

const equipmentPayload = () => ({
  name: 'Digital Storage Oscilloscope',
  category: 'electronics',
  description: '100 MHz digital oscilloscope',
  manufacturer: 'Tektronix',
  model: 'TBS1102',
  specifications: { bandwidth: '100 MHz', channels: 4, samplingRate: '1 GS/s' },
  institution: ctx.institutionId,
  pricePerHour: 300,
  location: {
    building: 'Electronics Block',
    room: 'Lab 204',
    city: 'Chandigarh',
    state: 'Punjab',
    latitude: 30.7333,
    longitude: 76.7794,
  },
  trainingRequired: false,
  certificationRequired: false,
});

const runPhase1Checks = async () => {
  console.log('\n-- Phase 1 sanity (needed by Phase 2 authorization) --');

  await test('app is up: root health check + public Phase 2 route', async () => {
    const root = await api('GET', '/');
    assert.strictEqual(root.status, 200);

    const catalogue = await api('GET', '/api/institutions');
    assert.strictEqual(catalogue.status, 200);
  });

  await test('login rejects a bad password (401)', async () => {
    const res = await api('POST', '/api/auth/login', {
      body: { email: 'admin@test.dev', password: 'wrong' },
    });
    assert.strictEqual(res.status, 401);
  });

  await test('register refuses to create an admin (400) and never returns a password', async () => {
    const escalation = await api('POST', '/api/auth/register', {
      body: { name: 'Sneaky', email: 'sneaky@test.dev', password: 'sneaky123', role: 'admin' },
    });
    assert.strictEqual(escalation.status, 400);

    const student = await api('POST', '/api/auth/register', {
      body: { name: 'Plain', email: 'plain@test.dev', password: 'plain123' },
    });
    assert.strictEqual(student.status, 201);
    assert.strictEqual(student.body.user.role, 'student');
    assert.strictEqual(student.body.user.password, undefined);
  });

  await test('GET /api/users/me requires a token (401)', async () => {
    const res = await api('GET', '/api/users/me');
    assert.strictEqual(res.status, 401);
  });

  await test('GET /api/users/all is admin-only (403 for student)', async () => {
    const res = await api('GET', '/api/users/all', { token: ctx.studentToken });
    assert.strictEqual(res.status, 403);
  });
};

const runInstitutionChecks = async () => {
  console.log('\n-- Institutions --');

  await test('1. create institution while logged in (201, isVerified false)', async () => {
    const res = await api('POST', '/api/institutions', {
      token: ctx.studentToken,
      body: { ...institutionPayload, isVerified: true, createdBy: ctx.adminId },
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.institution.name, 'ABC University');
    assert.strictEqual(res.body.institution.isVerified, false);
    assert.strictEqual(res.body.institution.createdBy, ctx.studentId);
    ctx.institutionId = res.body.institution._id;
  });

  await test('1b. create institution with an invalid type (400)', async () => {
    const res = await api('POST', '/api/institutions', {
      token: ctx.studentToken,
      body: { name: 'Bad Type Lab', type: 'space_station' },
    });
    assert.strictEqual(res.status, 400);
  });

  await test('2. create institution without token (401)', async () => {
    const res = await api('POST', '/api/institutions', { body: institutionPayload });
    assert.strictEqual(res.status, 401);
  });

  await test('3. list institutions hides unverified ones from the public', async () => {
    const res = await api('GET', '/api/institutions');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.count, 0);
  });

  await test('4a. get institution by id as its creator (200)', async () => {
    const res = await api('GET', `/api/institutions/${ctx.institutionId}`, {
      token: ctx.studentToken,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.institution.city, 'Chandigarh');
    assert.strictEqual(res.body.institution.createdBy.email, undefined);
  });

  await test('4b. anonymous cannot see an unverified institution (404)', async () => {
    const res = await api('GET', `/api/institutions/${ctx.institutionId}`);
    assert.strictEqual(res.status, 404);
  });

  await test('4c. malformed institution id (400)', async () => {
    const res = await api('GET', '/api/institutions/not-an-id');
    assert.strictEqual(res.status, 400);
  });

  await test('5a. creator can update institution (200)', async () => {
    const res = await api('PATCH', `/api/institutions/${ctx.institutionId}`, {
      token: ctx.studentToken,
      body: { description: 'Updated description', isVerified: true, createdBy: ctx.adminId },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.institution.description, 'Updated description');
    // isVerified and createdBy must be ignored on this route
    assert.strictEqual(res.body.institution.isVerified, false);
    assert.strictEqual(res.body.institution.createdBy, ctx.studentId);
  });

  await test('5b. another student cannot update it (403)', async () => {
    const res = await api('PATCH', `/api/institutions/${ctx.institutionId}`, {
      token: ctx.outsiderToken,
      body: { description: 'hacked' },
    });
    assert.strictEqual(res.status, 403);
  });

  await test('6a. student cannot verify an institution (403)', async () => {
    const res = await api('PATCH', `/api/institutions/${ctx.institutionId}/verify`, {
      token: ctx.studentToken,
    });
    assert.strictEqual(res.status, 403);
  });

  await test('6b. admin verifies the institution (200)', async () => {
    const res = await api('PATCH', `/api/institutions/${ctx.institutionId}/verify`, {
      token: ctx.adminToken,
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.institution.isVerified, true);
  });

  await test('6c. verified institution appears in the public list', async () => {
    const res = await api('GET', '/api/institutions');
    assert.strictEqual(res.body.count, 1);
    const filtered = await api('GET', '/api/institutions?city=chandigarh&type=university');
    assert.strictEqual(filtered.body.count, 1);
    const miss = await api('GET', '/api/institutions?city=Delhi');
    assert.strictEqual(miss.body.count, 0);
  });

  await test('6d. admin can include unverified institutions', async () => {
    const res = await api('GET', '/api/institutions?includeUnverified=true', {
      token: ctx.adminToken,
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.count >= 1);
  });
};

const runEquipmentChecks = async () => {
  console.log('\n-- Equipment --');

  await test('8. create equipment (201, isVerified false, status available)', async () => {
    const res = await api('POST', '/api/equipment', {
      token: ctx.studentToken,
      body: { ...equipmentPayload(), isVerified: true },
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.equipment.isVerified, false);
    assert.strictEqual(res.body.equipment.status, 'available');
    assert.strictEqual(res.body.equipment.createdBy, ctx.studentId);
    assert.strictEqual(res.body.equipment.pricePerHour, 300);
    ctx.equipmentId = res.body.equipment._id;
  });

  await test('8b. equipment in a non-existent institution (404)', async () => {
    const res = await api('POST', '/api/equipment', {
      token: ctx.studentToken,
      body: { ...equipmentPayload(), institution: '64b7f0c2f1a2b3c4d5e6f7a8' },
    });
    assert.strictEqual(res.status, 404);
  });

  await test('8c. outsider cannot add equipment to that institution (403)', async () => {
    const res = await api('POST', '/api/equipment', {
      token: ctx.outsiderToken,
      body: equipmentPayload(),
    });
    assert.strictEqual(res.status, 403);
  });

  await test('9. public equipment list only shows verified items', async () => {
    const res = await api('GET', '/api/equipment');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.count, 0);
  });

  await test('10/11/12. admin can verify, then filters work (category/city/price/status)', async () => {
    const verify = await api('PATCH', `/api/equipment/${ctx.equipmentId}/verify`, {
      token: ctx.adminToken,
    });
    assert.strictEqual(verify.status, 200);
    assert.strictEqual(verify.body.equipment.isVerified, true);

    // second (robotics) item, to prove filtering really filters
    const second = await api('POST', '/api/equipment', {
      token: ctx.studentToken,
      body: {
        name: '6-Axis Robotic Arm',
        category: 'robotics',
        institution: ctx.institutionId,
        pricePerHour: 900,
        location: { city: 'Mohali', state: 'Punjab' },
        status: 'maintenance',
        trainingRequired: true,
      },
    });
    assert.strictEqual(second.status, 201);
    ctx.roboticsId = second.body.equipment._id;
    await api('PATCH', `/api/equipment/${ctx.roboticsId}/verify`, { token: ctx.adminToken });

    const all = await api('GET', '/api/equipment');
    assert.strictEqual(all.body.count, 2);

    const byCategory = await api('GET', '/api/equipment?category=electronics');
    assert.strictEqual(byCategory.body.count, 1);
    assert.strictEqual(byCategory.body.equipment[0].name, 'Digital Storage Oscilloscope');

    // city matches the equipment location OR its institution's city, so the
    // Mohali-located robotics arm still counts as being in Chandigarh (university).
    const byCity = await api('GET', '/api/equipment?city=Chandigarh');
    assert.strictEqual(byCity.body.count, 2);

    const byEquipmentCity = await api('GET', '/api/equipment?city=Mohali');
    assert.strictEqual(byEquipmentCity.body.count, 1);
    assert.strictEqual(byEquipmentCity.body.equipment[0].name, '6-Axis Robotic Arm');

    const byState = await api('GET', '/api/equipment?state=punjab');
    assert.strictEqual(byState.body.count, 2);

    const byPrice = await api('GET', '/api/equipment?minPrice=100&maxPrice=500');
    assert.strictEqual(byPrice.body.count, 1);

    const byInstitution = await api('GET', `/api/equipment?institution=${ctx.institutionId}`);
    assert.strictEqual(byInstitution.body.count, 2);

    const byStatus = await api('GET', '/api/equipment?status=maintenance');
    assert.strictEqual(byStatus.body.count, 1);

    const byTraining = await api('GET', '/api/equipment?trainingRequired=false');
    assert.strictEqual(byTraining.body.count, 1);

    const badPrice = await api('GET', '/api/equipment?minPrice=abc');
    assert.strictEqual(badPrice.status, 400);

    const badStatus = await api('GET', '/api/equipment?status=exploded');
    assert.strictEqual(badStatus.status, 400);
  });

  await test('13. get equipment by id returns the populated institution and AI fields', async () => {
    const res = await api('GET', `/api/equipment/${ctx.equipmentId}`);
    assert.strictEqual(res.status, 200);
    const item = res.body.equipment;
    assert.strictEqual(item.name, 'Digital Storage Oscilloscope');
    assert.strictEqual(item.category, 'electronics');
    assert.deepStrictEqual(item.specifications, {
      bandwidth: '100 MHz',
      channels: 4,
      samplingRate: '1 GS/s',
    });
    assert.strictEqual(item.institution.name, 'ABC University');
    assert.strictEqual(item.institution.city, 'Chandigarh');
    assert.strictEqual(item.institution.location.latitude, 30.7333);
    assert.strictEqual(item.location.latitude, 30.7333);
    assert.strictEqual(item.location.longitude, 76.7794);
    assert.strictEqual(item.pricePerHour, 300);
    assert.strictEqual(item.status, 'available');
    assert.strictEqual(item.isVerified, true);
    assert.strictEqual(item.trainingRequired, false);
    assert.strictEqual(item.certificationRequired, false);
    assert.strictEqual(item.institution.createdBy.email, undefined);
  });

  await test('13b. unknown equipment id (404) and malformed id (400)', async () => {
    assert.strictEqual((await api('GET', '/api/equipment/not-an-id')).status, 400);
    assert.strictEqual(
      (await api('GET', '/api/equipment/64b7f0c2f1a2b3c4d5e6f7a8')).status,
      404
    );
  });

  await test('14a. creator can update equipment (200)', async () => {
    const res = await api('PATCH', `/api/equipment/${ctx.equipmentId}`, {
      token: ctx.studentToken,
      body: { pricePerHour: 350, status: 'maintenance', isVerified: false },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.equipment.pricePerHour, 350);
    assert.strictEqual(res.body.equipment.status, 'maintenance');
    // isVerified can never be changed through the update route
    assert.strictEqual(res.body.equipment.isVerified, true);
  });

  await test('14b. outsider cannot update equipment (403)', async () => {
    const res = await api('PATCH', `/api/equipment/${ctx.equipmentId}`, {
      token: ctx.outsiderToken,
      body: { pricePerHour: 1 },
    });
    assert.strictEqual(res.status, 403);
  });

  await test('16. student cannot verify equipment (403); admin can (200)', async () => {
    const asStudent = await api('PATCH', `/api/equipment/${ctx.roboticsId}/verify`, {
      token: ctx.studentToken,
    });
    assert.strictEqual(asStudent.status, 403);

    const asAdmin = await api('PATCH', `/api/equipment/${ctx.roboticsId}/verify`, {
      token: ctx.adminToken,
    });
    assert.strictEqual(asAdmin.status, 200);
    assert.strictEqual(asAdmin.body.equipment.isVerified, true);
  });
};

const runAvailabilityChecks = async () => {
  console.log('\n-- Availability --');

  await test('17a. invalid time format (400) and start >= end (400)', async () => {
    const badFormat = await api('POST', '/api/availability', {
      token: ctx.studentToken,
      body: {
        equipment: ctx.equipmentId,
        date: '2026-09-21',
        startTime: '25:00',
        endTime: '13:00',
      },
    });
    assert.strictEqual(badFormat.status, 400);

    const reversed = await api('POST', '/api/availability', {
      token: ctx.studentToken,
      body: {
        equipment: ctx.equipmentId,
        date: '2026-09-21',
        startTime: '13:00',
        endTime: '10:00',
      },
    });
    assert.strictEqual(reversed.status, 400);
  });

  await test('17b. availability for non-existent equipment (404) / bad id (400)', async () => {
    const missing = await api('POST', '/api/availability', {
      token: ctx.studentToken,
      body: {
        equipment: '64b7f0c2f1a2b3c4d5e6f7a8',
        date: '2026-09-21',
        startTime: '10:00',
        endTime: '13:00',
      },
    });
    assert.strictEqual(missing.status, 404);

    const malformed = await api('POST', '/api/availability', {
      token: ctx.studentToken,
      body: { equipment: 'abc', date: '2026-09-21', startTime: '10:00', endTime: '13:00' },
    });
    assert.strictEqual(malformed.status, 400);
  });

  await test('21b. unauthorized user cannot create availability (403)', async () => {
    const res = await api('POST', '/api/availability', {
      token: ctx.outsiderToken,
      body: {
        equipment: ctx.equipmentId,
        date: '2026-09-21',
        startTime: '10:00',
        endTime: '13:00',
      },
    });
    assert.strictEqual(res.status, 403);
  });

  await test('17. create availability (201, createdBy from token)', async () => {
    const res = await api('POST', '/api/availability', {
      token: ctx.studentToken,
      body: {
        equipment: ctx.equipmentId,
        date: '2026-09-21',
        startTime: '10:00',
        endTime: '13:00',
      },
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.availability.startTime, '10:00');
    assert.strictEqual(res.body.availability.endTime, '13:00');
    assert.strictEqual(res.body.availability.isAvailable, true);
    assert.strictEqual(res.body.availability.createdBy, ctx.studentId);
    ctx.availabilityId = res.body.availability._id;
  });

  await test('18. get availability for equipment, sorted and date filtered', async () => {
    const later = await api('POST', '/api/availability', {
      token: ctx.studentToken,
      body: {
        equipment: ctx.equipmentId,
        date: '2026-09-22',
        startTime: '09:00',
        endTime: '11:00',
        createdBy: ctx.adminId,
      },
    });
    assert.strictEqual(later.status, 201);
    assert.strictEqual(later.body.availability.createdBy, ctx.studentId);

    const all = await api('GET', `/api/availability/equipment/${ctx.equipmentId}`);
    assert.strictEqual(all.status, 200);
    assert.strictEqual(all.body.count, 2);
    assert.deepStrictEqual(
      all.body.availability.map((slot) => slot.date.slice(0, 10)),
      ['2026-09-21', '2026-09-22']
    );

    const oneDay = await api(
      'GET',
      `/api/availability/equipment/${ctx.equipmentId}?date=2026-09-21`
    );
    assert.strictEqual(oneDay.body.count, 1);

    const none = await api(
      'GET',
      `/api/availability/equipment/${ctx.equipmentId}?date=2026-09-25`
    );
    assert.strictEqual(none.body.count, 0);

    const missing = await api('GET', '/api/availability/equipment/64b7f0c2f1a2b3c4d5e6f7a8');
    assert.strictEqual(missing.status, 404);
  });

  await test('19. overlapping availability is rejected (409)', async () => {
    const exactDuplicate = await api('POST', '/api/availability', {
      token: ctx.studentToken,
      body: {
        equipment: ctx.equipmentId,
        date: '2026-09-21',
        startTime: '10:00',
        endTime: '13:00',
      },
    });
    assert.strictEqual(exactDuplicate.status, 409);

    const partial = await api('POST', '/api/availability', {
      token: ctx.studentToken,
      body: {
        equipment: ctx.equipmentId,
        date: '2026-09-21',
        startTime: '12:00',
        endTime: '14:00',
      },
    });
    assert.strictEqual(partial.status, 409);

    const swallowed = await api('POST', '/api/availability', {
      token: ctx.studentToken,
      body: {
        equipment: ctx.equipmentId,
        date: '2026-09-21',
        startTime: '09:00',
        endTime: '11:00',
      },
    });
    assert.strictEqual(swallowed.status, 409);

    // touching but not overlapping is allowed
    const backToBack = await api('POST', '/api/availability', {
      token: ctx.studentToken,
      body: {
        equipment: ctx.equipmentId,
        date: '2026-09-21',
        startTime: '13:00',
        endTime: '15:00',
      },
    });
    assert.strictEqual(backToBack.status, 201);
    ctx.backToBackId = backToBack.body.availability._id;
  });

  await test('20. update availability (200) with overlap re-checked', async () => {
    const res = await api('PATCH', `/api/availability/${ctx.availabilityId}`, {
      token: ctx.studentToken,
      body: { startTime: '08:00', endTime: '09:30', isAvailable: false },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.availability.startTime, '08:00');
    assert.strictEqual(res.body.availability.endTime, '09:30');
    assert.strictEqual(res.body.availability.isAvailable, false);

    const clash = await api('PATCH', `/api/availability/${ctx.availabilityId}`, {
      token: ctx.studentToken,
      body: { startTime: '14:00', endTime: '16:00' },
    });
    assert.strictEqual(clash.status, 409);

    const badTimes = await api('PATCH', `/api/availability/${ctx.availabilityId}`, {
      token: ctx.studentToken,
      body: { startTime: '18:00' },
    });
    assert.strictEqual(badTimes.status, 400);
  });

  await test('21. unauthorized modification attempts are refused', async () => {
    const outsider = await api('PATCH', `/api/availability/${ctx.availabilityId}`, {
      token: ctx.outsiderToken,
      body: { startTime: '07:00' },
    });
    assert.strictEqual(outsider.status, 403);

    const anonymous = await api('PATCH', `/api/availability/${ctx.availabilityId}`, {
      body: { startTime: '07:00' },
    });
    assert.strictEqual(anonymous.status, 401);

    const notFound = await api('PATCH', '/api/availability/64b7f0c2f1a2b3c4d5e6f7a8', {
      token: ctx.studentToken,
      body: { startTime: '07:00' },
    });
    assert.strictEqual(notFound.status, 404);
  });

  await test('admin can update a slot it does not own', async () => {
    const res = await api('PATCH', `/api/availability/${ctx.availabilityId}`, {
      token: ctx.adminToken,
      body: { isAvailable: true },
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.availability.isAvailable, true);
  });
};

const runDeletionChecks = async () => {
  console.log('\n-- Equipment deletion (availability aware) --');

  await test('15a. delete is refused while availability slots exist (409)', async () => {
    const res = await api('DELETE', `/api/equipment/${ctx.equipmentId}`, {
      token: ctx.studentToken,
    });
    assert.strictEqual(res.status, 409);
    assert.ok(res.body.availabilityCount >= 1);
  });

  await test('15b. outsider cannot delete (403)', async () => {
    const res = await api('DELETE', `/api/equipment/${ctx.roboticsId}`, {
      token: ctx.outsiderToken,
    });
    assert.strictEqual(res.status, 403);
  });

  await test('15c. delete with force removes equipment and its slots (200)', async () => {
    const res = await api('DELETE', `/api/equipment/${ctx.equipmentId}?force=true`, {
      token: ctx.studentToken,
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.deletedAvailabilitySlots >= 1);

    assert.strictEqual((await api('GET', `/api/equipment/${ctx.equipmentId}`)).status, 404);
    assert.strictEqual(
      (await api('GET', `/api/availability/equipment/${ctx.equipmentId}`)).status,
      404
    );
    assert.strictEqual((await api('DELETE', `/api/equipment/${ctx.equipmentId}`)).status, 401);
  });

  await test('15d. unknown route returns a JSON 404', async () => {
    const res = await api('GET', '/api/bookings');
    assert.strictEqual(res.status, 404);
    assert.ok(typeof res.body.message === 'string' && res.body.message.length > 0);
  });
};

const main = async () => {
  console.log('LabShare Phase 2 API tests');
  await setup();

  await runPhase1Checks();
  await runInstitutionChecks();
  await runEquipmentChecks();
  await runAvailabilityChecks();
  await runDeletionChecks();

  const failed = results.filter((r) => !r.ok);
  console.log(
    `\n${results.length - failed.length}/${results.length} checks passed${
      failed.length ? ` - ${failed.length} FAILED` : ''
    }`
  );

  await new Promise((resolve) => server.close(resolve));
  // Only ever wipe the throwaway in-memory database - never a user supplied one.
  if (mongo) await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  if (mongo) await mongo.stop();

  if (failed.length) {
    failed.forEach((f) => console.log(`\n${f.name}\n${f.error.stack}`));
    process.exit(1);
  }
  process.exit(0);
};

main().catch(async (error) => {
  console.error('\n[test] harness error:', error);
  try {
    if (server) await new Promise((resolve) => server.close(resolve));
    if (mongoose) await mongoose.disconnect();
    if (mongo) await mongo.stop();
  } catch {
    /* ignore teardown errors */
  }
  process.exit(1);
});
