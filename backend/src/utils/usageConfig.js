/**
 * Phase 6 - single home for the check-in / usage / analytics tunables and for
 * the date helpers the usage + analytics services share.
 *
 * Nothing here reads or writes the database, and every threshold is
 * environment-configurable so the same value is never hardcoded twice.
 */

const { httpError } = require('./apiHelpers');

const DEFAULTS = {
  checkInEarlyMinutes: 15,
  checkInLateGraceMinutes: 0,
  underutilizationThreshold: 10,
  analyticsRangeDays: 30,
};

/** Hard caps so a client can never ask for an unbounded analytics window. */
const LIMITS = {
  checkInEarlyMinutes: 24 * 60,
  checkInLateGraceMinutes: 12 * 60,
  underutilizationThreshold: 100,
  analyticsRangeDays: 366,
};

const readNumberEnv = (name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) => {
  const raw = process.env[name];
  if (raw === undefined || raw === null || String(raw).trim() === '') return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
};

/**
 * Check-in window: `earlyMinutes` before the booking starts through the booking
 * end (+ `lateGraceMinutes`, 0 by default).
 */
const getCheckInConfig = () => ({
  earlyMinutes: readNumberEnv('CHECK_IN_EARLY_MINUTES', DEFAULTS.checkInEarlyMinutes, {
    max: LIMITS.checkInEarlyMinutes,
  }),
  lateGraceMinutes: readNumberEnv('CHECK_IN_LATE_GRACE_MINUTES', DEFAULTS.checkInLateGraceMinutes, {
    max: LIMITS.checkInLateGraceMinutes,
  }),
});

/** Utilization percentage below which equipment is reported as underutilized. */
const getUnderutilizationThreshold = () =>
  readNumberEnv('UNDERUTILIZATION_THRESHOLD', DEFAULTS.underutilizationThreshold, {
    max: LIMITS.underutilizationThreshold,
  });

/** Analytics window used when the caller supplies no startDate/endDate. */
const getAnalyticsRangeDays = () =>
  readNumberEnv('ANALYTICS_DEFAULT_RANGE_DAYS', DEFAULTS.analyticsRangeDays, {
    min: 1,
    max: LIMITS.analyticsRangeDays,
  });

const pad2 = (value) => String(value).padStart(2, '0');

const DATE_ONLY = /^\d{4}-\d{2}-\d{2}$/;

const formatDateOnly = (date) => `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

/**
 * Bookings/Availability store one calendar day as UTC midnight. Documents are
 * created from a local (typed) date, so "today" must be derived the same way.
 */
const storedDay = (input = new Date()) => {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) throw httpError(400, 'Invalid date');
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
};

/** `HH:mm` -> minutes from midnight (null when malformed). */
const timeToMinutes = (time) => {
  if (typeof time !== 'string' || !/^([01]\d|2[0-3]):([0-5]\d)$/.test(time.trim())) return null;
  const [hours, minutes] = time.trim().split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Combine a stored (UTC-midnight) booking day with an `HH:mm` string into a
 * real timestamp, interpreting the time in the server's local timezone - the
 * same way the times were typed by the user that created the booking.
 */
const dateAtStoredTime = (storedDayValue, time) => {
  const minutes = timeToMinutes(time);
  if (minutes === null) return null;
  const day = new Date(storedDayValue);
  if (Number.isNaN(day.getTime())) return null;
  return new Date(
    day.getUTCFullYear(),
    day.getUTCMonth(),
    day.getUTCDate(),
    Math.floor(minutes / 60),
    minutes % 60,
    0,
    0
  );
};

const addDays = (date, days) => {
  const copy = new Date(date.getTime());
  copy.setUTCDate(copy.getUTCDate() + days);
  return copy;
};

/** Accepts "YYYY-MM-DD" or any value `Date` can parse; returns a stored day. */
const parseDateInput = (value, fieldName) => {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' && !(value instanceof Date)) {
    throw httpError(400, `${fieldName} must be a date in YYYY-MM-DD format`);
  }
  const raw = value instanceof Date ? formatDateOnly(value) : value.trim();
  if (!DATE_ONLY.test(raw)) throw httpError(400, `${fieldName} must be a date in YYYY-MM-DD format`);
  const parsed = storedDay(raw);
  return parsed;
};

/**
 * Resolve the analytics window.
 *   no dates        -> the previous `ANALYTICS_DEFAULT_RANGE_DAYS` days (default 30)
 *   only startDate  -> startDate .. today
 *   only endDate    -> endDate - default window .. endDate
 * Both boundaries are inclusive calendar days.
 */
const resolveDateRange = ({ startDate, endDate, now = new Date(), defaultDays } = {}) => {
  const start = parseDateInput(startDate, 'startDate');
  const end = parseDateInput(endDate, 'endDate');
  const windowDays = defaultDays ?? getAnalyticsRangeDays();
  const today = storedDay(now);

  let rangeStart = start;
  let rangeEnd = end;

  if (!rangeStart && !rangeEnd) {
    rangeEnd = today;
    rangeStart = addDays(today, -(windowDays - 1));
  } else if (!rangeStart) {
    rangeStart = addDays(rangeEnd, -(windowDays - 1));
  } else if (!rangeEnd) {
    rangeEnd = today;
  }

  if (rangeStart > rangeEnd) throw httpError(400, 'startDate cannot be after endDate');

  const days = Math.round((rangeEnd - rangeStart) / (24 * 60 * 60 * 1000)) + 1;
  if (days > LIMITS.analyticsRangeDays) {
    throw httpError(400, `Date range cannot exceed ${LIMITS.analyticsRangeDays} days`);
  }

  return {
    startDate: rangeStart.toISOString().slice(0, 10),
    endDate: rangeEnd.toISOString().slice(0, 10),
    start: rangeStart,
    endInclusive: rangeEnd,
    endExclusive: addDays(rangeEnd, 1),
    days,
  };
};

module.exports = {
  DEFAULTS,
  LIMITS,
  formatDateOnly,
  storedDay,
  timeToMinutes,
  dateAtStoredTime,
  addDays,
  parseDateInput,
  resolveDateRange,
  getCheckInConfig,
  getUnderutilizationThreshold,
  getAnalyticsRangeDays,
};
