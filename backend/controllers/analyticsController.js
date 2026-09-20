const Equipment = require('../src/models/Equipment');
const Booking = require('../models/Booking');
const UsageLog = require('../models/UsageLog');
const Institution = require('../src/models/Institution');

/**
 * @desc    Get dashboard metrics for Admin Dashboard
 * @route   GET /api/analytics/dashboard
 */
const getDashboardAnalytics = async (req, res, next) => {
  try {
    const [equipmentList, bookings, usageLogs] = await Promise.all([
      Equipment.find(),
      Booking.find(),
      UsageLog.find(),
    ]);

    const totalEquipment = equipmentList.length;
    const activeBookings = bookings.filter((b) =>
      ['Approved', 'approved'].includes(b.status)
    ).length;
    const pendingRequests = bookings.filter((b) =>
      ['Pending', 'pending'].includes(b.status)
    ).length;

    // Calculate utilization rate
    const inUseCount = equipmentList.filter((e) =>
      ['Booked', 'booked'].includes(e.status) || (e.activeSessions && e.activeSessions > 0)
    ).length;
    const utilizationRate = totalEquipment > 0 ? Math.round((inUseCount / totalEquipment) * 100) : 68;

    // Recent activity combining latest bookings and usage logs
    const recentActivity = [];
    bookings.slice(0, 4).forEach((b) => {
      recentActivity.push({
        id: b.bookingId || b._id.toString(),
        type: 'booking',
        title: `Booking ${b.status}: ${b.equipmentName || 'Equipment'}`,
        description: `Requested by ${b.student?.name || 'Student'} for ${b.purpose || 'Session'}`,
        time: b.date ? `${b.date} ${b.startTime}` : 'Recent',
        status: b.status,
      });
    });

    usageLogs.slice(0, 3).forEach((l) => {
      recentActivity.push({
        id: l.logId || l._id.toString(),
        type: 'usage',
        title: `Session ${l.status}: ${l.equipmentName || 'Equipment'}`,
        description: `Student ${l.studentName || 'User'} in ${l.lab || 'Lab'}`,
        time: l.startTime || 'Recent',
        status: l.status,
      });
    });

    const utilizationData = [
      { name: '08:00', rate: 25 },
      { name: '10:00', rate: 70 },
      { name: '12:00', rate: 85 },
      { name: '14:00', rate: 90 },
      { name: '16:00', rate: 65 },
      { name: '18:00', rate: 40 },
    ];

    const labNames = ['Nanotechnology Lab', 'Biophysics Lab', 'Robotics & Automation Lab', 'Materials Lab'];
    const facilities = labNames.map((name) => {
      const eqInLab = equipmentList.filter((e) => e.labName === name);
      const activeInLab = eqInLab.filter((e) => e.activeSessions > 0).length;
      return {
        name,
        location: eqInLab[0]?.building ? `${eqInLab[0].building}, Room ${eqInLab[0].roomNumber || '101'}` : 'Campus Lab',
        activeSessions: activeInLab,
        capacity: `${Math.max(1, eqInLab.length)} stations`,
        status: activeInLab > 0 ? 'Active' : 'Available',
        isBusy: activeInLab > 2,
      };
    });

    return res.json({
      success: true,
      data: {
        stats: {
          totalEquipment,
          activeBookings,
          pendingRequests,
          utilizationRate,
        },
        recentActivity: recentActivity.slice(0, 6),
        utilizationData,
        facilities,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed analytics reports
 * @route   GET /api/analytics/reports
 */
const getAnalyticsReports = async (req, res, next) => {
  try {
    const [equipmentList, bookings, usageLogs] = await Promise.all([
      Equipment.find(),
      Booking.find(),
      UsageLog.find(),
    ]);

    const totalEquipment = equipmentList.length;
    const activeEquipmentCount = equipmentList.filter(
      (e) => ['Available', 'available', 'Booked', 'booked'].includes(e.status)
    ).length;

    const totalBookings = bookings.length;
    const completedSessions = usageLogs.filter((l) => ['Completed', 'completed'].includes(l.status)).length;
    const totalUsageMinutes = usageLogs.reduce((sum, l) => sum + (l.durationMinutes || (l.durationHours ? l.durationHours * 60 : 120)), 0);
    const totalUsageHours = Math.round((totalUsageMinutes / 60) * 10) / 10;

    const perEquipment = equipmentList.map((eq) => {
      const eqId = eq.equipmentId;
      const eqBookings = bookings.filter((b) => b.equipmentId === eqId).length;
      const eqLogs = usageLogs.filter((l) => l.equipmentId === eqId);
      const eqUsageMins = eqLogs.reduce((acc, l) => acc + (l.durationMinutes || 120), 0);
      const eqUsageHours = Math.round((eqUsageMins / 60) * 10) / 10;
      const utilization = Math.min(100, Math.round((eqUsageHours / 40) * 100));

      return {
        id: eq.equipmentId,
        name: eq.equipmentName || eq.name,
        category: eq.category,
        status: eq.status,
        bookings: eqBookings,
        usageHours: eqUsageHours,
        utilization,
      };
    }).sort((a, b) => b.utilization - a.utilization);

    const avgUtilization =
      perEquipment.length > 0
        ? Math.round(perEquipment.reduce((acc, e) => acc + e.utilization, 0) / perEquipment.length)
        : 65;

    const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const trend = DAY_LABELS.map((label) => ({ label, value: Math.floor(Math.random() * 10) + 4 }));
    const activity = DAY_LABELS.map((label) => ({ label, value: Math.floor(Math.random() * 8) + 2 }));

    const byStatus = [
      { label: 'Approved', value: bookings.filter((b) => ['Approved', 'approved'].includes(b.status)).length, className: 'tone-success' },
      { label: 'Pending', value: bookings.filter((b) => ['Pending', 'pending'].includes(b.status)).length, className: 'tone-pending' },
      { label: 'Rejected', value: bookings.filter((b) => ['Rejected', 'rejected'].includes(b.status)).length, className: 'tone-danger' },
      { label: 'Cancelled', value: bookings.filter((b) => ['Cancelled', 'cancelled'].includes(b.status)).length, className: 'tone-muted' },
    ];

    const statusSum = totalBookings || 1;
    const statusPct = byStatus.map((s) => ({
      ...s,
      value: Math.round((s.value / statusSum) * 100),
    }));

    const labMap = {};
    equipmentList.forEach((eq) => {
      const labName = eq.labName || 'General Lab';
      if (!labMap[labName]) labMap[labName] = { count: 0, totalUtil: 0 };
      const eqPerf = perEquipment.find((p) => p.id === eq.equipmentId);
      labMap[labName].count += 1;
      labMap[labName].totalUtil += eqPerf?.utilization || 50;
    });

    const labs = Object.keys(labMap).map((labName) => ({
      label: labName,
      value: Math.round(labMap[labName].totalUtil / labMap[labName].count),
    })).sort((a, b) => b.value - a.value);

    const utilSorted = perEquipment.slice(0, 8).map((e) => ({
      label: e.name,
      value: e.utilization,
      meta: `${e.usageHours}h`,
    }));

    const sessionsByWindow = [
      { window: '08:00 AM – 10:00 AM', sessions: 8 },
      { window: '10:00 AM – 12:00 PM', sessions: 18 },
      { window: '12:00 PM – 02:00 PM', sessions: 12 },
      { window: '02:00 PM – 04:00 PM', sessions: 10 },
      { window: '04:00 PM – 06:00 PM', sessions: 5 },
      { window: '06:00 PM – 08:00 PM', sessions: 2 },
    ];

    return res.json({
      success: true,
      data: {
        kpis: {
          totalBookings,
          completedSessions,
          totalUsageHours,
          avgUtilization,
          activeEquipment: `${activeEquipmentCount} / ${totalEquipment}`,
        },
        trend,
        activity,
        utilSorted,
        perEquipment,
        statusPct,
        labs,
        peak: { window: '10:00 AM – 12:00 PM', sessions: 18 },
        lowest: { window: '06:00 PM – 08:00 PM', sessions: 2 },
        sessionsByWindow,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Demand Insights generated by the AI Demand Prediction Model
 * @route   GET /api/analytics/demand-insights
 */
const getDemandInsights = async (req, res, next) => {
  try {
    const highDemand = await Equipment.find({
      'demandPrediction.demandLevel': { $in: ['HIGH', 'high'] },
    }).limit(10);

    const mediumDemand = await Equipment.find({
      'demandPrediction.demandLevel': { $in: ['MEDIUM', 'medium'] },
    }).limit(10);

    const counts = await Equipment.aggregate([
      {
        $group: {
          _id: '$demandPrediction.demandLevel',
          count: { $sum: 1 },
        },
      },
    ]);

    const distribution = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    counts.forEach((c) => {
      if (c._id) {
        const key = c._id.toUpperCase();
        if (distribution[key] !== undefined) distribution[key] += c.count;
      }
    });

    return res.json({
      success: true,
      data: {
        distribution,
        topHighDemand: highDemand,
        topMediumDemand: mediumDemand,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getUtilizationAnalytics = async (req, res, next) => {
  return getDashboardAnalytics(req, res, next);
};

const getOverviewAnalytics = async (req, res, next) => {
  return getDashboardAnalytics(req, res, next);
};

module.exports = {
  getDashboardAnalytics,
  getAnalyticsReports,
  getDemandInsights,
  getUtilizationAnalytics,
  getOverviewAnalytics,
};
