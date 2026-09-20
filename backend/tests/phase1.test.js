const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../server');
const User = require('../models/User');
const { generateToken } = require('../controllers/authController');

// Ensure JWT secret is set for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_key_12345';

let mongoServer;

const runTests = async () => {
  console.log('====================================================');
  console.log('  LabShare Phase 1: Authentication & User Management  ');
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

  // Start in-memory MongoDB
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log(`In-memory MongoDB started at: ${uri}\n`);
  } catch (err) {
    console.error('Failed to start MongoDB Memory Server:', err);
    process.exit(1);
  }

  let studentToken = '';
  let adminToken = '';
  let studentUser = null;
  let adminUser = null;

  try {
    // Test Case 0: Health Check Endpoint
    await testCase('0. Health Check Endpoint (GET /)', async () => {
      const res = await request(app).get('/');
      assertEqual(res.status, 200, 'Status should be 200');
      assertEqual(res.body.message, 'LabShare API is running', 'Health check message mismatch');
    });

    // Test Case: Reject Admin Registration on Public Endpoint
    await testCase('Extra. Reject public registration with admin role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Fake Admin',
          email: 'admin_attempt@example.com',
          password: 'Password123',
          role: 'admin',
        });
      assertEqual(res.status, 400, 'Status should be 400');
      assertTrue(
        res.body.message && res.body.message.includes('Admin'),
        `Expected admin rejection message, got: ${res.body.message}`
      );
    });

    // Test Case 1: Register valid student
    await testCase('1. Register valid student (POST /api/auth/register)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Rahul Sharma',
          email: 'rahul@example.com',
          password: 'SecurePassword123',
          institution: 'ABC University',
          role: 'student',
          phone: '9876543210',
        });

      assertEqual(res.status, 201, 'Status should be 201');
      assertEqual(res.body.message, 'Registration successful', 'Success message mismatch');
      assertTrue(typeof res.body.token === 'string', 'Token should be a string');
      assertTrue(!!res.body.user, 'User object should be returned');
      assertEqual(res.body.user.name, 'Rahul Sharma', 'Name mismatch');
      assertEqual(res.body.user.email, 'rahul@example.com', 'Email mismatch');
      assertEqual(res.body.user.role, 'student', 'Role mismatch');
      assertEqual(res.body.user.institution, 'ABC University', 'Institution mismatch');
      assertTrue(!res.body.user.password, 'Password should never be returned');

      studentToken = res.body.token;
      studentUser = res.body.user;
    });

    // Test Case 2: Register duplicate email
    await testCase('2. Register duplicate email (POST /api/auth/register)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Rahul Duplicate',
          email: 'rahul@example.com',
          password: 'AnotherPassword123',
          institution: 'Another University',
          role: 'student',
        });

      assertEqual(res.status, 409, 'Status should be 409 Conflict');
      assertTrue(
        res.body.message && res.body.message.toLowerCase().includes('already'),
        `Expected duplicate email error, got: ${res.body.message}`
      );
    });

    // Test Case 3: Register invalid email
    await testCase('3. Register invalid email format (POST /api/auth/register)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'not-a-valid-email',
          password: 'SecurePassword123',
          role: 'student',
        });

      assertEqual(res.status, 400, 'Status should be 400');
      assertTrue(
        res.body.message && res.body.message.toLowerCase().includes('email'),
        `Expected email validation message, got: ${res.body.message}`
      );
    });

    // Test Case 4: Register short password
    await testCase('4. Register short password < 6 chars (POST /api/auth/register)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Short Password User',
          email: 'shortpass@example.com',
          password: '12345',
          role: 'student',
        });

      assertEqual(res.status, 400, 'Status should be 400');
      assertTrue(
        res.body.message && res.body.message.toLowerCase().includes('6 characters'),
        `Expected short password error, got: ${res.body.message}`
      );
    });

    // Test Case 5: Login with correct credentials
    await testCase('5. Login with correct credentials (POST /api/auth/login)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'rahul@example.com',
          password: 'SecurePassword123',
        });

      assertEqual(res.status, 200, 'Status should be 200');
      assertEqual(res.body.message, 'Login successful', 'Message should be "Login successful"');
      assertTrue(typeof res.body.token === 'string', 'Token should be returned');
      assertEqual(res.body.user.email, 'rahul@example.com', 'User email mismatch');
      assertTrue(!res.body.user.password, 'Password should never be returned');

      studentToken = res.body.token; // Refresh token
    });

    // Test Case 6: Login with incorrect credentials
    await testCase('6. Login with incorrect credentials (POST /api/auth/login)', async () => {
      // Wrong password
      const res1 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'rahul@example.com',
          password: 'WrongPassword999',
        });

      assertEqual(res1.status, 401, 'Status should be 401');
      assertEqual(
        res1.body.message,
        'Invalid email or password',
        'Generic error message required'
      );

      // Non-existent email
      const res2 = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nobody@example.com',
          password: 'SomePassword123',
        });

      assertEqual(res2.status, 401, 'Status should be 401');
      assertEqual(
        res2.body.message,
        'Invalid email or password',
        'Generic error message required'
      );
    });

    // Test Case 7: GET /api/users/me with valid JWT
    await testCase('7. GET /api/users/me with valid JWT', async () => {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${studentToken}`);

      assertEqual(res.status, 200, 'Status should be 200');
      assertTrue(!!res.body.user, 'Profile user object should be returned');
      assertEqual(res.body.user.email, 'rahul@example.com', 'Email mismatch');
      assertEqual(res.body.user.role, 'student', 'Role mismatch');
      assertEqual(res.body.user.isVerified, false, 'isVerified should default to false');
      assertTrue(Array.isArray(res.body.user.requirements), 'requirements should be an array');
      assertTrue(!res.body.user.password, 'Password must not be returned');
    });

    // Test Case 8: GET /api/users/me without JWT
    await testCase('8. GET /api/users/me without JWT', async () => {
      const res = await request(app).get('/api/users/me');
      assertEqual(res.status, 401, 'Status should be 401');
      assertTrue(
        res.body.message && res.body.message.toLowerCase().includes('not authorized'),
        'Expected unauthorized message'
      );
    });

    // Test Case 9: PATCH /api/users/requirements with valid JWT
    await testCase('9. PATCH /api/users/requirements with valid JWT', async () => {
      const updatePayload = {
        requirements: ['SEM', '3 hours'],
        location: {
          city: 'Chandigarh',
          state: 'Punjab',
          latitude: 30.7333,
          longitude: 76.7794,
        },
        // Attacker attempts to escalate privilege or change immutable fields:
        role: 'admin',
        isVerified: true,
        email: 'hacked@example.com',
      };

      const res = await request(app)
        .patch('/api/users/requirements')
        .set('Authorization', `Bearer ${studentToken}`)
        .send(updatePayload);

      assertEqual(res.status, 200, 'Status should be 200');
      assertTrue(!!res.body.user, 'Updated user object should be returned');
      assertEqual(res.body.user.requirements.length, 2, 'Requirements count mismatch');
      assertEqual(res.body.user.requirements[0], 'SEM', 'Requirement 0 mismatch');
      assertEqual(res.body.user.requirements[1], '3 hours', 'Requirement 1 mismatch');
      assertEqual(res.body.user.location.city, 'Chandigarh', 'Location city mismatch');
      assertEqual(res.body.user.location.state, 'Punjab', 'Location state mismatch');
      assertEqual(res.body.user.location.latitude, 30.7333, 'Latitude mismatch');
      assertEqual(res.body.user.location.longitude, 76.7794, 'Longitude mismatch');

      // Crucial Security assertions: immutable fields must NOT have changed!
      assertEqual(res.body.user.role, 'student', 'Role must NOT be changeable via PATCH');
      assertEqual(res.body.user.isVerified, false, 'isVerified must NOT be changeable via PATCH');
      assertEqual(res.body.user.email, 'rahul@example.com', 'Email must NOT be changeable via PATCH');
      assertTrue(!res.body.user.password, 'Password must never be returned');
    });

    // Test Case 10: PATCH /api/users/requirements without JWT
    await testCase('10. PATCH /api/users/requirements without JWT', async () => {
      const res = await request(app)
        .patch('/api/users/requirements')
        .send({
          requirements: ['Laser Microscope'],
        });

      assertEqual(res.status, 401, 'Status should be 401');
    });

    // Provision admin user out-of-band for admin test cases
    adminUser = await User.create({
      name: 'System Administrator',
      email: 'admin@labshare.org',
      password: 'AdminPassword123!',
      role: 'admin',
      institution: 'Central Lab Network',
    });
    adminToken = generateToken(adminUser);

    // Test Case 11: GET /api/users/all with admin JWT
    await testCase('11. GET /api/users/all with admin JWT', async () => {
      const res = await request(app)
        .get('/api/users/all')
        .set('Authorization', `Bearer ${adminToken}`);

      assertEqual(res.status, 200, 'Status should be 200');
      assertTrue(typeof res.body.count === 'number', 'count should be a number');
      assertTrue(Array.isArray(res.body.users), 'users should be an array');
      assertTrue(res.body.count >= 2, 'Should contain at least 2 users (student & admin)');
      assertEqual(res.body.count, res.body.users.length, 'Count must equal array length');

      // Verify sorted newest first
      if (res.body.users.length >= 2) {
        const time0 = new Date(res.body.users[0].createdAt).getTime();
        const time1 = new Date(res.body.users[1].createdAt).getTime();
        assertTrue(time0 >= time1, 'Users should be sorted newest first');
      }

      // Verify no passwords leaked
      res.body.users.forEach((u) => {
        assertTrue(!u.password, 'User password must not be present in list response');
        assertTrue(!!u.id, 'User must have id property');
      });
    });

    // Test Case 12: GET /api/users/all with student JWT
    await testCase('12. GET /api/users/all with student JWT', async () => {
      const res = await request(app)
        .get('/api/users/all')
        .set('Authorization', `Bearer ${studentToken}`);

      assertEqual(res.status, 403, 'Status should be 403 Forbidden for non-admins');
      assertEqual(res.body.message, 'Admin access required', 'Message mismatch');
    });

    // Test Case 13: GET /api/users/all without JWT
    await testCase('13. GET /api/users/all without JWT', async () => {
      const res = await request(app).get('/api/users/all');
      assertEqual(res.status, 401, 'Status should be 401 Unauthorized');
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
