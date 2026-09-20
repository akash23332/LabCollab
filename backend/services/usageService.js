/**
 * Phase 6 - QR check-in / check-out domain logic.
 *
 * The QR code only *identifies* equipment. Everything that grants or denies
 * access is decided here, server side:
 *   authenticated user (from the JWT) -> approved booking -> ownership ->
 *   booking day -> check-in window -> duplicate/conflicting session -> UsageLog
 *
 * The server clock is the only source of timestamps and durations; no request
 * body can set checkInTime, checkOutTime or a duration.
 */

const UsageLog = require('../models/UsageLog');
const Booking = require('../models/Booking');
const Equipment = require('../src/models/Equipment');
const { httpError, isValidObjectId, canManage } = require('../src/utils/apiHelpers');
const { storedDay, dateAtStoredTime, getCheckInConfig } = require('../src/utils/usageConfig');

/** QR payload form: "equipment:<equipmentObjectId>". */
const QR_PREFIX = 'equipment:';
const OBJECT_ID = /^[a-f0-9]{24}$/i;

/** Booking statuses that block a check-in, with the reason to report. */
const BLOCKED_BOOKING_REASONS = {
  pending: 'The booking has not been approved yet.',
  cancelled: 'The booking was cancelled.',
  rejected: 'The booking was rejected.',
  completed: 'The booking is already completed.',
};

const round = (value, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

// ---------------------------------------------------------------------------
// QR helpers
// ---------------------------------------------------------------------------

const buildQrPayload = (equipmentId) => `${QR_PREFIX}${String(equipmentId)}`;

/** Extract the equipment id from a scanned payload (or a bare id). Never more. */
const equipmentIdFromQrPayload = (payload) => {
  if (typeof payload !== 'string') return null;
  const trimmed = payload.trim();
  if (OBJECT_ID.test(trimmed)) return trimmed;
  if (trimmed.toLowerCase().startsWith(QR_PREFIX)) {
    const candidate = trimmed.slice(QR_PREFIX.length).trim();
    return OBJECT_ID.test(candidate) ? candidate : null;
  }
  return null;
};

/**
 * The check-in endpoint accepts `{ equipmentId }`. A raw scan result can also be
 * posted as `{ qrPayload }`; only the id embedded in it is used - the payload is
 * never treated as a credential.
 */
const resolveEquipmentIdInput = (body = {}) => {
  const rawId = body.equipmentId;
  if (rawId !== undefined && rawId !== null && rawId !== '') {
    if (!isValidObjectId(rawId)) throw httpError(400, 'Invalid equipment id');
    return String(rawId);
  }

  const fromQr = equipmentIdFromQrPayload(body.qrPayload);
  if (fromQr) return fromQr;

  if (body.qrPayload !== undefined) throw httpError(400, 'Invalid QR payload');

  throw httpError(400, 'equipmentId is required');
};

/**
 * Optional QR image. `qrcode` is not a dependency of this project, so the image
 * is produced only when it is installed (`npm i qrcode`); the payload itself is
 * always returned so any QR renderer on the frontend can draw it.
 */
const generateQrImageDataUrl = async (payload) => {
  try {
    // eslint-disable-next-line global-require
    const QRCode = require('qrcode');
    return await QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 320 });
  } catch (error) {
    return null;
  }
};

const buildEquipmentQr = async (equipment) => {
  const equipmentId = String(equipment._id);
  const qrPayload = buildQrPayload(equipmentId);
  const qrImageDataUrl = await generateQrImageDataUrl(qrPayload);

  return {
    equipmentId,
    equipmentName: equipment.name,
    qrPayload,
    qrPayloadObject: { type: 'equipment', equipmentId },
    scanPath: `/scan/equipment/${equipmentId}`,
    qrImageDataUrl,
    qrImageAvailable: Boolean(qrImageDataUrl),
    note: 'The QR code identifies equipment only. Scanning it never bypasses authentication, booking or time validation.',
  };
};

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

const asId = (value) => {
  if (!value) return null;
  if (typeof value === 'object' && value._id) return String(value._id);
  return String(value);
};

const formatBooking = (booking) => {
  if (!booking || typeof booking !== 'object') return asId(booking);
  return {
    _id: String(booking._id),
    date: booking.date ? new Date(booking.date).toISOString().slice(0, 10) : null,
    startTime: booking.startTime,
    endTime: booking.endTime,
    plannedDurationHours: booking.duration ?? null,
    plannedDurationMinutes: booking.duration === null || booking.duration === undefined
      ? null
      : Math.round(booking.duration * 60),
    totalAmount: booking.totalAmount ?? null,
    purpose: booking.purpose || '',
    status: booking.status,
  };
};

const formatEquipment = (equipment) => {
  if (!equipment || typeof equipment !== 'object' || !equipment.name) return asId(equipment);
  return {
    _id: String(equipment._id),
    name: equipment.name,
    category: equipment.category || '',
    pricePerHour: equipment.pricePerHour ?? null,
    status: equipment.status || null,
    location: {
      city: equipment.location?.city || '',
      state: equipment.location?.state || '',
      building: equipment.location?.building || '',
      room: equipment.location?.room || '',
    },
  };
};

const formatInstitution = (institution) => {
  if (!institution || typeof institution !== 'object' || !institution.name) return asId(institution);
  return {
    _id: String(institution._id),
    name: institution.name,
    type: institution.type || '',
    city: institution.city || '',
    state: institution.state || '',
  };
};

const formatUser = (user) => {
  if (!user || typeof user !== 'object' || !user.name) return asId(user);
  return {
    _id: String(user._id),
    name: user.name,
    email: user.email || '',
    institution: user.institution || '',
    role: user.role || '',
  };
};

/**
 * Public shape of a usage log. User data is only included when the caller is
 * allowed to see it (`includeUser`), so a student's own history never leaks
 * other people's details and vice versa.
 */
const formatUsageLog = (
  log,
  { includeUser = false, equipment, institution, user, booking } = {}
) => {
  const doc = log && log.toObject ? log.toObject() : log || {};

  // Callers that already loaded the related documents pass them in; otherwise
  // the (populated or raw) reference stored on the log is used.
  const equipmentDoc = equipment ?? doc.equipment;
  const institutionDoc = institution ?? doc.institution;
  const userDoc = user ?? doc.user;
  const bookingDoc = booking ?? doc.booking;

  return {
    _id: String(doc._id),
    status: doc.status,
    checkInTime: doc.checkInTime,
    checkOutTime: doc.checkOutTime || null,
    actualDurationMinutes: doc.actualDurationMinutes ?? null,
    actualDurationHours: doc.actualDurationMinutes === null || doc.actualDurationMinutes === undefined
      ? null
      : round(doc.actualDurationMinutes / 60, 2),
    checkInMethod: doc.checkInMethod,
    checkOutMethod: doc.checkOutTime ? doc.checkOutMethod : null,
    notes: doc.notes || '',
    equipment: formatEquipment(equipmentDoc),
    institution: formatInstitution(institutionDoc),
    ...(includeUser ? { user: formatUser(userDoc) } : {}),
    booking: formatBooking(bookingDoc),
    createdAt: doc.createdAt,
  };
};

/** Populate everything a usage response may need. */
const withUsagePopulate = (query) =>
  query
    .populate('equipment', UsageLog.EQUIPMENT_FIELDS)
    .populate('institution', UsageLog.INSTITUTION_FIELDS)
    .populate('booking', UsageLog.BOOKING_FIELDS)
    .populate('user', UsageLog.USER_FIELDS);

// ---------------------------------------------------------------------------
// Check-in
// ---------------------------------------------------------------------------

const loadEquipmentOr404 = async (equipmentId) => {
  if (!isValidObjectId(equipmentId)) throw httpError(400, 'Invalid equipment id');

  const equipment = await Equipment.findById(equipmentId).populate(
    'institution',
    UsageLog.INSTITUTION_FIELDS + ' createdBy'
  );

  if (!equipment) throw httpError(404, 'Equipment not found');
  return equipment;
};

const minutesLabel = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
};

/**
 * Resolve the approved booking for this user+equipment that is valid *now*.
 * Throws with the specific reason when no usable booking exists.
 */
const resolveCheckInBooking = async ({ user, equipment, now, today }) => {
  const approvedBookings = await Booking.find({
    user: user._id,
    equipment: equipment._id,
    date: today,
    status: 'approved',
  }).sort({ startTime: 1 });

  const { earlyMinutes, lateGraceMinutes } = getCheckInConfig();

  const windows = approvedBookings
    .map((booking) => {
      const start = dateAtStoredTime(booking.date, booking.startTime);
      const end = dateAtStoredTime(booking.date, booking.endTime);
      if (!start || !end) return null;
      return {
        booking,
        start,
        end,
        openAt: new Date(start.getTime() - earlyMinutes * 60 * 1000),
        closeAt: new Date(end.getTime() + lateGraceMinutes * 60 * 1000),
      };
    })
    .filter(Boolean);

  const open = windows.find((window) => now >= window.openAt && now <= window.closeAt);
  if (open) return { ...open, earlyMinutes, lateGraceMinutes };

  if (windows.length) {
    const first = windows[0];
    if (now < first.openAt) {
      throw httpError(
        400,
        `Check-in for your booking (${first.booking.startTime}-${first.booking.endTime}) opens at ${minutesLabel(
          first.openAt.getHours() * 60 + first.openAt.getMinutes()
        )}.`
      );
    }
    const last = windows[windows.length - 1];
    if (now > last.closeAt) {
      throw httpError(
        400,
        `The check-in window for your booking (${last.booking.startTime}-${last.booking.endTime}) has closed.`
      );
    }
  }

  // No approved booking today: explain exactly why, using the non-approved one.
  const otherBooking = await Booking.findOne({
    user: user._id,
    equipment: equipment._id,
    date: today,
  }).sort({ createdAt: -1 });

  if (otherBooking && BLOCKED_BOOKING_REASONS[otherBooking.status]) {
    throw httpError(409, BLOCKED_BOOKING_REASONS[otherBooking.status]);
  }

  throw httpError(404, 'No approved booking found for this equipment today.');
};

/**
 * POST /api/usage/check-in
 * @param {{ user: object, equipmentId: string, now?: Date }} params
 */
const checkIn = async ({ user, equipmentId, now = new Date() }) => {
  const equipment = await loadEquipmentOr404(equipmentId);

  const institutionId = equipment.institution?._id || equipment.institution;
  if (!institutionId) throw httpError(404, 'Equipment is not linked to an institution');

  if (equipment.status !== 'available') {
    throw httpError(409, `Equipment is not available for use (status: ${equipment.status}).`);
  }

  const today = storedDay(now);
  const window = await resolveCheckInBooking({ user, equipment, now, today });

  // Payment guard: unpaid non-free bookings cannot be checked in via QR
  if (Number(window.booking.totalAmount) > 0 && window.booking.paymentStatus !== 'paid') {
    throw httpError(400, 'Payment is required before check-in. Please complete payment.');
  }

  // One usage record per booking - checked here for a clear message and enforced
  // by the unique index for concurrency.
  const existing = await UsageLog.findOne({ booking: window.booking._id });
  if (existing) {
    throw httpError(
      409,
      existing.status === 'active'
        ? 'You have already checked in for this booking.'
        : 'Usage for this booking has already been completed.'
    );
  }

  const activeSession = await UsageLog.findOne({ equipment: equipment._id, status: 'active' });
  if (activeSession) {
    throw httpError(
      409,
      String(activeSession.user) === String(user._id)
        ? 'You already have an active usage session on this equipment.'
        : 'This equipment currently has an active usage session from another user.'
    );
  }

  let usageLog;
  try {
    usageLog = await UsageLog.create({
      booking: window.booking._id,
      user: user._id,
      equipment: equipment._id,
      institution: institutionId,
      checkInTime: now,
      checkInMethod: 'qr',
      status: 'active',
    });
  } catch (error) {
    // Unique index on `booking`: a concurrent check-in won the race.
    if (error.code === 11000) throw httpError(409, 'You have already checked in for this booking.');
    throw error;
  }

  return {
    usageLog,
    booking: window.booking,
    equipment,
    institution: equipment.institution,
    checkInWindow: {
      openAt: window.openAt,
      closeAt: window.closeAt,
      earlyMinutes: window.earlyMinutes,
      lateGraceMinutes: window.lateGraceMinutes,
    },
  };
};

// ---------------------------------------------------------------------------
// Check-out
// ---------------------------------------------------------------------------

/**
 * POST /api/usage/check-out
 * @param {{ user: object, equipmentId: string, now?: Date }} params
 */
const checkOut = async ({ user, equipmentId, now = new Date() }) => {
  const equipment = await loadEquipmentOr404(equipmentId);

  const activeLog = await UsageLog.findOne({
    user: user._id,
    equipment: equipment._id,
    status: 'active',
  }).sort({ checkInTime: -1 });

  if (!activeLog) {
    const otherActiveLog = await UsageLog.findOne({ equipment: equipment._id, status: 'active' });
    if (otherActiveLog) {
      throw httpError(403, 'This active usage session belongs to another user.');
    }
    throw httpError(404, 'No active usage session found for this equipment.');
  }

  const checkInTime = new Date(activeLog.checkInTime);
  const durationMinutes = Math.max(0, Math.round((now.getTime() - checkInTime.getTime()) / 60000));

  activeLog.checkOutTime = now;
  activeLog.actualDurationMinutes = durationMinutes;
  activeLog.status = 'completed';
  activeLog.checkOutMethod = 'qr';
  await activeLog.save();

  // Only an approved booking may become completed. Pending/rejected/cancelled
  // bookings are never promoted by a check-out.
  let bookingTransitioned = false;
  const booking = await Booking.findById(activeLog.booking);
  if (booking && booking.status === 'approved') {
    booking.status = 'completed';
    await booking.save();
    bookingTransitioned = true;
  }

  // The already-loaded documents travel with the result so the controller can
  // format the response without extra queries.
  return {
    usageLog: activeLog,
    booking,
    equipment,
    institution: equipment.institution,
    bookingTransitioned,
  };
};

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** The authenticated user's open sessions (drives the "currently using" card). */
const getActiveSessions = async (userId) => {
  const logs = await withUsagePopulate(
    UsageLog.find({ user: userId, status: 'active' }).sort({ checkInTime: -1 })
  ).lean();

  const now = Date.now();
  return logs.map((log) => ({
    ...formatUsageLog(log),
    elapsedMinutes: Math.max(0, Math.round((now - new Date(log.checkInTime).getTime()) / 60000)),
  }));
};

/** Everyone with a session open right now on the given equipment ids. */
const countActiveSessionsForEquipment = async (equipmentIds) => {
  if (!equipmentIds.length) return 0;
  return UsageLog.countDocuments({ equipment: { $in: equipmentIds }, status: 'active' });
};

module.exports = {
  QR_PREFIX,
  buildQrPayload,
  equipmentIdFromQrPayload,
  resolveEquipmentIdInput,
  buildEquipmentQr,
  formatUsageLog,
  formatBooking,
  formatEquipment,
  formatInstitution,
  formatUser,
  withUsagePopulate,
  loadEquipmentOr404,
  checkIn,
  checkOut,
  getActiveSessions,
  countActiveSessionsForEquipment,
};
