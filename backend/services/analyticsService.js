/**
 * Phase 6 - lab analytics.
 *
 * Everything is derived on demand from the existing collections
 * (Equipment / Booking / UsageLog / Availability). No analytics collection is
 * written, so the numbers can never drift from the source of truth.
 *
 * Definitions used consistently across this module:
 *   totalUsageMinutes   - sum of actualDurationMinutes of *completed* logs
 *   activeSessions      - logs still in status "active" (counted, not added to
 *                         totalUsageMinutes, because their duration is unknown)
 *   availableMinutes    - sum of the durations of `isAvailable` Availability
 *                         slots inside the range (never estimated/invented)
 *   utilizationRate     - totalUsageMinutes / availableMinutes * 100, or null
 *                         when there is no availability data to divide by
 *   estimatedBookingValue - sum of Booking.totalAmount for approved/completed
 *                         bookings. This is NOT revenue: no payment records exist.
 */

const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const UsageLog = require('../models/UsageLog');
const Equipment = require('../src/models/Equipment');
const Institution = require('../src/models/Institution');
const Availability = require('../src/models/Availability');
const { resolveDateRange, getUnderutilizationThreshold, timeToMinutes } = require('../src/utils/usageConfig');

const MOST_USED_LIMIT = 5;
const LEAST_USED_LIMIT = 5;
const EQUIPMENT_UTILIZATION_LIMIT = 50;

/** Booking statuses that count towards planned/estimated values. */
const VALUE_STATUSES = ['approved', 'completed'];

const round = (value, decimals = 1) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const sum = (values) => values.reduce((total, value) => total + (Number(value) || 0), 0);

const minutesToHours = (minutes) => round((minutes || 0) / 60, 2);

const objectId = (value) => new mongoose.Types.ObjectId(String(value));

/** Bookings and usage logs are filtered by two different date representations. */
const bookingDateFilter = (range) => ({ $gte: range.start, $lt: range.endExclusive });
const timestampFilter = (range) => ({ $gte: range.start, $lt: range.endExclusive });

const bookingMetrics = (bookings) => {
  const byStatus = (status) => bookings.filter((booking) => booking.status === status).length;
  const plannedMinutes = sum(
    bookings
      .filter((booking) => VALUE_STATUSES.includes(booking.status))
      .map((booking) => (Number(booking.duration) || 0) * 60)
  );

  return {
    totalBookings: bookings.length,
    completedBookings: byStatus('completed'),
    approvedBookings: byStatus('approved'),
    pendingBookings: byStatus('pending'),
    cancelledBookings: byStatus('cancelled'),
    rejectedBookings: byStatus('rejected'),
    plannedMinutes: Math.round(plannedMinutes),
    estimatedBookingValue: round(
      sum(
        bookings
          .filter((booking) => VALUE_STATUSES.includes(booking.status))
          .map((booking) => booking.totalAmount)
      ),
      2
    ),
  };
};

const usageMetrics = (logs) => {
  const completed = logs.filter((log) => log.status === 'completed');
  const activeSessions = logs.filter((log) => log.status === 'active').length;
  const totalUsageMinutes = Math.round(sum(completed.map((log) => log.actualDurationMinutes)));

  return {
    totalUsageSessions: logs.length,
    completedUsageSessions: completed.length,
    activeSessions,
    totalUsageMinutes,
    totalUsageHours: minutesToHours(totalUsageMinutes),
    averageUsageMinutes: completed.length ? Math.round(totalUsageMinutes / completed.length) : null,
    longestUsageMinutes: completed.length
      ? Math.max(...completed.map((log) => Number(log.actualDurationMinutes) || 0))
      : null,
  };
};

/** Availability slot minutes inside the range - the utilization denominator. */
const availableMinutesPerEquipment = async (equipmentIds, range) => {
  const map = new Map();
  if (!equipmentIds.length) return map;

  const slots = await Availability.find({
    equipment: { $in: equipmentIds },
    isAvailable: true,
    date: bookingDateFilter(range),
  })
    .select('equipment startTime endTime')
    .lean();

  slots.forEach((slot) => {
    const start = timeToMinutes(slot.startTime);
    const end = timeToMinutes(slot.endTime);
    if (start === null || end === null || end <= start) return;
    const key = String(slot.equipment);
    map.set(key, (map.get(key) || 0) + (end - start));
  });

  return map;
};

/** Group completed usage minutes by equipment. */
const usageMinutesByEquipment = (logs) => {
  const map = new Map();
  logs
    .filter((log) => log.status === 'completed')
    .forEach((log) => {
      const key = String(log.equipment?._id || log.equipment);
      const entry = map.get(key) || { usageMinutes: 0, sessions: 0, activeSessions: 0 };
      entry.usageMinutes += Number(log.actualDurationMinutes) || 0;
      entry.sessions += 1;
      map.set(key, entry);
    });

  logs
    .filter((log) => log.status === 'active')
    .forEach((log) => {
      const key = String(log.equipment?._id || log.equipment);
      const entry = map.get(key) || { usageMinutes: 0, sessions: 0, activeSessions: 0 };
      entry.activeSessions += 1;
      map.set(key, entry);
    });

  return map;
};

const utilizationRate = (usageMinutes, availableMinutes) => {
  if (!availableMinutes || availableMinutes <= 0) return null;
  return round((usageMinutes / availableMinutes) * 100, 1);
};

const utilizationNotes = (availableMinutes) =>
  availableMinutes > 0
    ? []
    : [
        'utilizationRate is null because there is no availability data in the selected range (available hours are never estimated).',
      ];

// ---------------------------------------------------------------------------
// Equipment analytics
// ---------------------------------------------------------------------------

/**
 * GET /api/analytics/equipment/:equipmentId
 *
 * @param {string} equipmentId
 * @param {{startDate?: string, endDate?: string, now?: Date}} options
 */
const getEquipmentAnalytics = async (equipmentId, { startDate, endDate, now = new Date() } = {}) => {
  const range = resolveDateRange({ startDate, endDate, now });

  const equipment = await Equipment.findById(equipmentId)
    .populate('institution', 'name type city state isVerified')
    .lean();

  if (!equipment) return null;

  const [bookings, logs, availableMap] = await Promise.all([
    Booking.find({ equipment: equipment._id, date: bookingDateFilter(range) }).lean(),
    UsageLog.find({ equipment: equipment._id, checkInTime: timestampFilter(range) }).lean(),
    availableMinutesPerEquipment([equipment._id], range),
  ]);

  const bookingStats = bookingMetrics(bookings);
  const usageStats = usageMetrics(logs);
  const availableMinutes = availableMap.get(String(equipment._id)) || 0;

  return {
    success: true,
    equipmentId: String(equipment._id),
    equipment: {
      _id: String(equipment._id),
      name: equipment.name,
      category: equipment.category,
      pricePerHour: equipment.pricePerHour,
      status: equipment.status,
      isVerified: Boolean(equipment.isVerified),
      institution: equipment.institution
        ? {
            _id: String(equipment.institution._id),
            name: equipment.institution.name,
            city: equipment.institution.city || '',
            state: equipment.institution.state || '',
          }
        : null,
    },
    range: { startDate: range.startDate, endDate: range.endDate, days: range.days },

    // Flat metrics (the documented contract)
    totalBookings: bookingStats.totalBookings,
    completedBookings: bookingStats.completedBookings,
    totalUsageMinutes: usageStats.totalUsageMinutes,
    totalUsageHours: usageStats.totalUsageHours,
    averageUsageMinutes: usageStats.averageUsageMinutes,
    utilizationRate: utilizationRate(usageStats.totalUsageMinutes, availableMinutes),

    // Metric detail
    bookingStatusBreakdown: {
      approved: bookingStats.approvedBookings,
      pending: bookingStats.pendingBookings,
      completed: bookingStats.completedBookings,
      cancelled: bookingStats.cancelledBookings,
      rejected: bookingStats.rejectedBookings,
    },
    usageSessions: {
      total: usageStats.totalUsageSessions,
      completed: usageStats.completedUsageSessions,
      active: usageStats.activeSessions,
      longestUsageMinutes: usageStats.longestUsageMinutes,
    },
    plannedMinutes: bookingStats.plannedMinutes,
    availableMinutes,
    estimatedBookingValue: bookingStats.estimatedBookingValue,
    utilizationDenominator: 'availability slot minutes inside the selected range',
    notes: [
      'estimatedBookingValue is derived from booking amounts; it is not recorded revenue.',
      ...utilizationNotes(availableMinutes),
    ],
  };
};

// ---------------------------------------------------------------------------
// Institution analytics
// ---------------------------------------------------------------------------

const loadInstitutionOrNull = (institutionId) =>
  Institution.findById(institutionId).lean();

/**
 * GET /api/analytics/institution/:institutionId
 * GET /api/analytics/institution/:institutionId/summary  (same payload alias)
 */
const getInstitutionAnalytics = async (institutionId, { startDate, endDate, now = new Date() } = {}) => {
  const range = resolveDateRange({ startDate, endDate, now });

  const institution = await loadInstitutionOrNull(institutionId);
  if (!institution) return null;

  const equipment = await Equipment.find({ institution: institution._id })
    .select('name category pricePerHour status isVerified createdAt')
    .lean();
  const equipmentIds = equipment.map((item) => item._id);

  const [bookings, logs, availableMap] = await Promise.all([
    Booking.find({ institution: institution._id, date: bookingDateFilter(range) }).lean(),
    UsageLog.find({ institution: institution._id, checkInTime: timestampFilter(range) })
      .populate('equipment', 'name category')
      .lean(),
    availableMinutesPerEquipment(equipmentIds, range),
  ]);

  const bookingStats = bookingMetrics(bookings);
  const usageStats = usageMetrics(logs);
  const usageByEquipment = usageMinutesByEquipment(logs);

  const equipmentUtilization = equipment
    .map((item) => {
      const entry = usageByEquipment.get(String(item._id)) || { usageMinutes: 0, sessions: 0, activeSessions: 0 };
      const availableMinutes = availableMap.get(String(item._id)) || 0;
      return {
        equipmentId: String(item._id),
        name: item.name,
        category: item.category || '',
        status: item.status,
        pricePerHour: item.pricePerHour ?? null,
        usageMinutes: Math.round(entry.usageMinutes),
        usageHours: minutesToHours(entry.usageMinutes),
        sessions: entry.sessions,
        activeSessions: entry.activeSessions,
        availableMinutes,
        utilizationRate: utilizationRate(entry.usageMinutes, availableMinutes),
      };
    })
    .sort((a, b) => {
      if (b.usageMinutes !== a.usageMinutes) return b.usageMinutes - a.usageMinutes;
      return String(a.name).localeCompare(String(b.name));
    })
    .slice(0, EQUIPMENT_UTILIZATION_LIMIT);

  const mostUsedEquipment = equipmentUtilization
    .filter((item) => item.usageMinutes > 0)
    .slice(0, MOST_USED_LIMIT)
    .map((item) => ({
      equipmentId: item.equipmentId,
      name: item.name,
      usageMinutes: item.usageMinutes,
      usageHours: item.usageHours,
      sessions: item.sessions,
      utilizationRate: item.utilizationRate,
    }));

  const leastUsedEquipment = [...equipmentUtilization]
    .sort((a, b) => {
      if (a.usageMinutes !== b.usageMinutes) return a.usageMinutes - b.usageMinutes;
      return String(a.name).localeCompare(String(b.name));
    })
    .slice(0, LEAST_USED_LIMIT)
    .map((item) => ({
      equipmentId: item.equipmentId,
      name: item.name,
      usageMinutes: item.usageMinutes,
      usageHours: item.usageHours,
      sessions: item.sessions,
      utilizationRate: item.utilizationRate,
    }));

  const underutilizationThreshold = getUnderutilizationThreshold();
  const underutilizedEquipment = equipmentUtilization
    .filter((item) => item.utilizationRate !== null && item.utilizationRate < underutilizationThreshold)
    .sort((a, b) => a.utilizationRate - b.utilizationRate)
    .map((item) => ({
      equipmentId: item.equipmentId,
      name: item.name,
      utilizationRate: item.utilizationRate,
      totalUsageHours: item.usageHours,
      totalUsageMinutes: item.usageMinutes,
      availableMinutes: item.availableMinutes,
      sessions: item.sessions,
    }));

  const totalAvailableMinutes = equipmentUtilization.reduce((total, item) => total + item.availableMinutes, 0);
  const institutionUtilizationRate = utilizationRate(usageStats.totalUsageMinutes, totalAvailableMinutes);

  return {
    success: true,
    institutionId: String(institution._id),
    institution: {
      _id: String(institution._id),
      name: institution.name,
      type: institution.type || '',
      city: institution.city || '',
      state: institution.state || '',
      isVerified: Boolean(institution.isVerified),
    },
    range: { startDate: range.startDate, endDate: range.endDate, days: range.days },

    // Core aggregates
    totalEquipment: equipment.length,
    verifiedEquipment: equipment.filter((item) => item.isVerified).length,
    totalBookings: bookingStats.totalBookings,
    completedBookings: bookingStats.completedBookings,
    pendingBookings: bookingStats.pendingBookings,
    approvedBookings: bookingStats.approvedBookings,
    cancelledBookings: bookingStats.cancelledBookings,
    rejectedBookings: bookingStats.rejectedBookings,
    totalUsageMinutes: usageStats.totalUsageMinutes,
    totalUsageHours: usageStats.totalUsageHours,
    averageUsageMinutes: usageStats.averageUsageMinutes,
    totalUsageSessions: usageStats.totalUsageSessions,
    activeSessions: usageStats.activeSessions,
    utilizationRate: institutionUtilizationRate,
    totalAvailableMinutes,
    plannedMinutes: bookingStats.plannedMinutes,
    estimatedBookingValue: bookingStats.estimatedBookingValue,

    mostUsedEquipment,
    leastUsedEquipment,
    equipmentUtilization,
    underutilizedEquipment,
    underutilizationThreshold,
    utilizationDenominator: 'availability slot minutes inside the selected range',

    notes: [
      'estimatedBookingValue is derived from booking amounts; no payment records exist, so it is not recorded revenue.',
      'Usage hours come from completed UsageLog entries (actualDurationMinutes); active sessions are counted but not added to the totals.',
      ...utilizationNotes(totalAvailableMinutes),
    ],
  };
};

/**
 * Dashboard-friendly alias: the institution aggregate plus the counters a lab
 * manager dashboard needs at a glance, in one round trip.
 */
const getInstitutionSummary = async (institutionId, options = {}) => {
  const analytics = await getInstitutionAnalytics(institutionId, options);
  if (!analytics) return null;

  const activeSessions = await UsageLog.find({
    institution: objectId(institutionId),
    status: 'active',
  })
    .populate('equipment', 'name')
    .populate('user', 'name institution')
    .select('checkInTime user equipment booking')
    .lean();

  return {
    ...analytics,
    dashboard: {
      totalEquipment: analytics.totalEquipment,
      verifiedEquipment: analytics.verifiedEquipment,
      totalBookings: analytics.totalBookings,
      activeBookings: analytics.approvedBookings,
      usageHours: analytics.totalUsageHours,
      utilizationRate: analytics.utilizationRate,
      underutilizedCount: analytics.underutilizedEquipment.length,
      currentlyInUse: activeSessions.length,
      mostUsedEquipment: analytics.mostUsedEquipment[0] || null,
      activeSessions: activeSessions.map((log) => ({
        usageLogId: String(log._id),
        equipment: log.equipment ? { _id: String(log.equipment._id), name: log.equipment.name } : null,
        user: log.user ? { _id: String(log.user._id), name: log.user.name, institution: log.user.institution || '' } : null,
        checkInTime: log.checkInTime,
      })),
    },
  };
};

module.exports = {
  getEquipmentAnalytics,
  getInstitutionAnalytics,
  getInstitutionSummary,
  // exported for tests / reuse
  round,
  minutesToHours,
  utilizationRate,
  availableMinutesPerEquipment,
  usageMinutesByEquipment,
};
