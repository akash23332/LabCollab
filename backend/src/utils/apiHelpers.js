const mongoose = require('mongoose');

/** Build an error that the central error handler will turn into JSON. */
const httpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Case-insensitive, whole-value match executed by MongoDB (not in JavaScript). */
const exactInsensitive = (value) => new RegExp(`^${escapeRegex(value)}$`, 'i');

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

/** Parse "true"/"false" (or real booleans). Throws 400 on anything else. */
const parseBoolean = (value, fieldName) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw httpError(400, `${fieldName} must be true or false`);
};

/** Parse a numeric query parameter. Throws 400 on non-numeric input. */
const parseNumber = (value, fieldName) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) throw httpError(400, `${fieldName} must be a number`);
  return parsed;
};

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const isValidTime = (value) => typeof value === 'string' && HH_MM.test(value.trim());

/** Normalise any date-ish value to its UTC midnight so one day === one stored Date. */
const toUTCDay = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw httpError(400, 'Invalid date');
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

/** Inclusive-start, exclusive-end range covering a full UTC day. */
const utcDayRange = (value) => {
  const start = toUTCDay(value);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { $gte: start, $lt: end };
};

/** "10:00" < "13:00" compares correctly because values are zero padded. */
const doTimesOverlap = (startA, endA, startB, endB) => startA < endB && startB < endA;

/** Cap client supplied page sizes. */
const parseLimit = (value, fallback = 100, max = 500) => {
  const parsed = parseNumber(value, 'limit');
  if (parsed === undefined) return fallback;
  if (parsed <= 0) throw httpError(400, 'limit must be greater than 0');
  return Math.min(parsed, max);
};

const parsePage = (value) => {
  const parsed = parseNumber(value, 'page');
  if (parsed === undefined) return 1;
  if (parsed <= 0) throw httpError(400, 'page must be greater than 0');
  return Math.floor(parsed);
};

/**
 * Ownership rule shared by Institution / Equipment / Availability writes:
 * the creator (or the creator of the parent institution) and admins may write.
 */
const canManage = (user, doc, extraOwnerIds = []) => {
  if (!user) return false;
  if (user.role === 'admin') return true;
  const owners = [doc?.createdBy, ...extraOwnerIds]
    .filter(Boolean)
    .map((id) => String(id?._id || id));
  return owners.includes(String(user._id));
};

const DEMO_ADMIN_EMAILS = [
  'nikhilpalyal6@gmail.com',
  'akak9781189@gmail.com',
  'demo@labcollab.com',
];

const isDemoAdmin = (user) => {
  if (!user || !user.email) return false;
  const email = String(user.email).toLowerCase().trim();
  return DEMO_ADMIN_EMAILS.includes(email) || email.endsWith('@demo.com');
};

module.exports = {
  httpError,
  escapeRegex,
  exactInsensitive,
  isValidObjectId,
  parseBoolean,
  parseNumber,
  isValidTime,
  toUTCDay,
  utcDayRange,
  doTimesOverlap,
  parseLimit,
  parsePage,
  canManage,
  isDemoAdmin,
};

