const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Phase 2 addition (Phase 1's middleware only ships `protect` and `adminOnly`).
 *
 * Attaches req.user when a valid Bearer token is supplied, but never rejects the
 * request. The public catalogue endpoints use this so anonymous visitors get the
 * public (verified-only) view while admins can widen or re-filter their view.
 */
const optionalAuth = async (req, res, next) => {
  req.user = null;

  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return next();

  const token = header.slice('Bearer '.length).trim();
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fin_guard_secret' || 'secret123');
    // Only the id from the token is trusted.
    req.user = (await User.findById(decoded.id).select('-password')) || null;
  } catch {
    req.user = null; // an invalid token simply means "not an admin"
  }

  return next();
};

module.exports = optionalAuth;
