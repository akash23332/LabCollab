const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
// Phase 2 (Institutions / Equipment / Availability).
const institutionRoutes = require('./src/routes/institutionRoutes');
const equipmentRoutes = require('./src/routes/equipmentRoutes');
const availabilityRoutes = require('./src/routes/availabilityRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
// Phase 4 (AI recommendations).
const aiRoutes = require('./routes/aiRoutes');
const labRoutes = require('./routes/labRoutes');
// Phase 6 (QR check-in/out, usage logs, lab analytics).
const usageRoutes = require('./routes/usageRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
// Phase 7 (Payments & production hardening).
const paymentRoutes = require('./routes/paymentRoutes');

// Load environment variables
dotenv.config();

const app = express();

// Security HTTP Headers
app.use(helmet());

// CORS configuration with whitelist
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.length === 0) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Body parser
app.use(express.json());

// Rate Limiting (skipped in test environment unless x-test-rate-limit header is sent)
const isTest = process.env.NODE_ENV === 'test';

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 100,
  message: { success: false, message: 'Too many requests from this IP, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest && !req.headers['x-test-rate-limit'],
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest && !req.headers['x-test-rate-limit'],
});

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isTest ? 1000 : 30,
  message: { success: false, message: 'Too many payment requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isTest && !req.headers['x-test-rate-limit'],
});

app.use('/api', generalLimiter);

// Health Check Endpoints
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'LabShare API is running',
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Mount Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);

// Phase 2 Routes
app.use('/api/institutions', institutionRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/availability', availabilityRoutes);

// Phase 3 Routes
app.use('/api/bookings', bookingRoutes);

// Phase 4 Routes
app.use('/api/ai', aiRoutes);

// Phase 5 Routes (Lab Network)
app.use('/api/labs', labRoutes);

// Phase 6 Routes (Usage logs & analytics)
app.use('/api/usage', usageRoutes);
app.use('/api/usage-logs', usageRoutes);
app.use('/api/analytics', analyticsRoutes);

// Phase 7 Routes (Payments)
app.use('/api/payments', paymentLimiter, paymentRoutes);

// 404 Not Found Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Centralized Error Handling Middleware
app.use((err, req, res, next) => {
  let statusCode = err.statusCode || (res.statusCode >= 400 ? res.statusCode : 500);
  let message = err.message || 'Server error';

  if (statusCode >= 500 && process.env.NODE_ENV !== 'test') {
    console.error('[Server Error]:', err.message || err);
  }

  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  } else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  } else if (err.code === 11000) {
    statusCode = 400;
    message = 'Duplicate field value entered';
  } else if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Not authorized, invalid or expired token';
  } else if (err.message === 'Not allowed by CORS') {
    statusCode = 403;
    message = 'Not allowed by CORS';
  }

  const response = {
    success: false,
    message,
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
});

const PORT = process.env.PORT || 5000;

// Connect to MongoDB and start listening only if executed directly
if (require.main === module) {
  connectDB().then(() => {
    app.listen(PORT, () => {
      console.log(`LabShare server running on port ${PORT}`);
    });
  });
}

module.exports = app;
