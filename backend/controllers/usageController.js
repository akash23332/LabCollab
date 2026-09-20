/**
 * Phase 6 - usage controller (QR check-in / check-out + usage history).
 *
 * The requesting user always comes from the JWT (`req.user`); nothing in the
 * request body can select a user. Timestamps are written by the service from
 * the server clock.
 */

const usageService = require('../services/usageService');
const UsageLog = require('../models/UsageLog');
const Equipment = require('../src/models/Equipment');
const Institution = require('../src/models/Institution');
const { isValidObjectId, canManage, parseLimit } = require('../src/utils/apiHelpers');
const { resolveDateRange } = require('../src/utils/usageConfig');

const USAGE_STATUSES = ['active', 'completed'];

/** Usage history defaults to the newest 50 records, hard capped at 100. */
const DEFAULT_HISTORY_LIMIT = 50;
const MAX_HISTORY_LIMIT = 100;

/** Optional startDate/endDate filter on history endpoints. */
const historyRangeFilter = (query) => {
  if (!query.startDate && !query.endDate) return null;
  return resolveDateRange({ startDate: query.startDate, endDate: query.endDate });
};

/**
 * @desc    Check in to an approved booking by scanning the equipment QR
 * @route   POST /api/usage/check-in
 * @access  Private
 */
const checkInEquipment = async (req, res, next) => {
  try {
    const equipmentId = usageService.resolveEquipmentIdInput(req.body || {});

    const { usageLog, booking, equipment, institution, checkInWindow } = await usageService.checkIn({
      user: req.user,
      equipmentId,
    });

    return res.status(201).json({
      success: true,
      message: 'Checked in successfully',
      usageLog: usageService.formatUsageLog(usageLog, { equipment, institution, booking }),
      booking: usageService.formatBooking(booking),
      checkInWindow: {
        openAt: checkInWindow.openAt,
        closeAt: checkInWindow.closeAt,
        earlyMinutes: checkInWindow.earlyMinutes,
        lateGraceMinutes: checkInWindow.lateGraceMinutes,
      },
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Check out of an active usage session by scanning the equipment QR
 * @route   POST /api/usage/check-out
 * @access  Private
 */
const checkOutEquipment = async (req, res, next) => {
  try {
    const equipmentId = usageService.resolveEquipmentIdInput(req.body || {});

    const { usageLog, booking, equipment, institution, bookingTransitioned } = await usageService.checkOut({
      user: req.user,
      equipmentId,
    });

    return res.status(200).json({
      success: true,
      message: 'Checked out successfully',
      usageLog: usageService.formatUsageLog(usageLog, { equipment, institution, booking }),
      booking: usageService.formatBooking(booking),
      bookingCompleted: bookingTransitioned,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    The authenticated user's own usage history (newest first)
 * @route   GET /api/usage/my
 * @access  Private
 */
const getMyUsage = async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT);

    const userMatch = [{ user: req.user._id }];
    if (req.user.email) {
      userMatch.push({ 'student.email': req.user.email });
    }
    const filter = { $or: userMatch };
    if (req.query.status) {
      if (!USAGE_STATUSES.includes(req.query.status)) {
        return res.status(400).json({ message: `status must be one of: ${USAGE_STATUSES.join(', ')}` });
      }
      filter.status = req.query.status;
    }

    const range = historyRangeFilter(req.query);
    if (range) filter.checkInTime = { $gte: range.start, $lt: range.endExclusive };

    const logs = await usageService
      .withUsagePopulate(UsageLog.find(filter).sort({ checkInTime: -1 }).limit(limit))
      .lean();

    return res.status(200).json({
      success: true,
      count: logs.length,
      usageLogs: logs.map((log) => usageService.formatUsageLog(log)),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    The authenticated user's currently open sessions
 * @route   GET /api/usage/active
 * @access  Private
 */
const getActiveUsageSessions = async (req, res, next) => {
  try {
    const activeSessions = await usageService.getActiveSessions(req.user._id);

    return res.status(200).json({
      success: true,
      count: activeSessions.length,
      activeSessions,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Usage history for one piece of equipment
 * @route   GET /api/usage/equipment/:equipmentId
 * @access  Private (equipment/institution manager, admin)
 */
const getEquipmentUsage = async (req, res, next) => {
  try {
    const { equipmentId } = req.params;
    if (!isValidObjectId(equipmentId)) {
      return res.status(400).json({ message: 'Invalid equipment id' });
    }

    const equipment = await Equipment.findById(equipmentId).populate(
      'institution',
      'name createdBy city state'
    );
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    if (!canManage(req.user, equipment, [equipment.institution?.createdBy])) {
      return res.status(403).json({ message: 'You are not authorized to view usage for this equipment' });
    }

    const limit = parseLimit(req.query.limit, DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT);

    const filter = { equipment: equipment._id };
    if (req.query.status && USAGE_STATUSES.includes(req.query.status)) filter.status = req.query.status;

    const range = historyRangeFilter(req.query);
    if (range) filter.checkInTime = { $gte: range.start, $lt: range.endExclusive };

    const logs = await usageService
      .withUsagePopulate(UsageLog.find(filter).sort({ checkInTime: -1 }).limit(limit))
      .lean();

    const completedLogs = logs.filter((log) => log.status === 'completed');

    return res.status(200).json({
      success: true,
      equipment: {
        _id: String(equipment._id),
        name: equipment.name,
        category: equipment.category,
        status: equipment.status,
      },
      count: logs.length,
      totalUsageMinutes: completedLogs.reduce(
        (total, log) => total + (Number(log.actualDurationMinutes) || 0),
        0
      ),
      // Managers see who used the equipment; private profile fields are not included.
      usageLogs: logs.map((log) => usageService.formatUsageLog(log, { includeUser: true })),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Usage history for every piece of equipment of an institution
 * @route   GET /api/usage/institution/:institutionId
 * @access  Private (institution manager/owner, admin)
 */
const getInstitutionUsage = async (req, res, next) => {
  try {
    const { institutionId } = req.params;
    if (!isValidObjectId(institutionId)) {
      return res.status(400).json({ message: 'Invalid institution id' });
    }

    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    if (!canManage(req.user, institution)) {
      return res.status(403).json({ message: 'You are not authorized to view usage for this institution' });
    }

    const limit = parseLimit(req.query.limit, DEFAULT_HISTORY_LIMIT, MAX_HISTORY_LIMIT);

    const filter = { institution: institution._id };
    if (req.query.status && USAGE_STATUSES.includes(req.query.status)) filter.status = req.query.status;

    const range = historyRangeFilter(req.query);
    if (range) filter.checkInTime = { $gte: range.start, $lt: range.endExclusive };

    const [logs, activeCount] = await Promise.all([
      usageService
        .withUsagePopulate(UsageLog.find(filter).sort({ checkInTime: -1 }).limit(limit))
        .lean(),
      UsageLog.countDocuments({ institution: institution._id, status: 'active' }),
    ]);

    const completedLogs = logs.filter((log) => log.status === 'completed');

    return res.status(200).json({
      success: true,
      institution: {
        _id: String(institution._id),
        name: institution.name,
        city: institution.city || '',
        state: institution.state || '',
      },
      count: logs.length,
      activeSessions: activeCount,
      totalUsageMinutes: completedLogs.reduce(
        (total, log) => total + (Number(log.actualDurationMinutes) || 0),
        0
      ),
      usageLogs: logs.map((log) => usageService.formatUsageLog(log, { includeUser: true })),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Official QR identity for a piece of equipment
 * @route   GET /api/equipment/:equipmentId/qr
 * @access  Private (equipment/institution manager, admin)
 */
const getEquipmentQr = async (req, res, next) => {
  try {
    const { equipmentId } = req.params;
    if (!isValidObjectId(equipmentId)) {
      return res.status(400).json({ message: 'Invalid equipment id' });
    }

    const equipment = await Equipment.findById(equipmentId).populate('institution', 'name createdBy');
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    if (!canManage(req.user, equipment, [equipment.institution?.createdBy])) {
      return res.status(403).json({ message: 'You are not authorized to manage this equipment QR code' });
    }

    const qr = await usageService.buildEquipmentQr(equipment);

    return res.status(200).json({ success: true, qr });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  checkInEquipment,
  checkOutEquipment,
  getMyUsage,
  getActiveUsageSessions,
  getEquipmentUsage,
  getInstitutionUsage,
  getEquipmentQr,
};
