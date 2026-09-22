const UsageLog = require('../models/UsageLog');
const Equipment = require('../src/models/Equipment');
const Booking = require('../models/Booking');
const { isValidObjectId, isDemoAdmin, escapeRegex } = require('../src/utils/apiHelpers');

/**
 * @desc    Get all usage logs with filtering
 * @route   GET /api/usage-logs and GET /api/usage/logs
 */
const getUsageLogs = async (req, res, next) => {
  try {
    const { status, lab, date, equipmentId, search, page = 1, limit = 50 } = req.query;
    const query = {};

    if (status && status !== 'all') {
      query.status = new RegExp(status, 'i');
    }

    if (lab) query.lab = lab;
    if (date) query.date = date;

    if (equipmentId) {
      query.$or = [
        { equipmentId },
        { equipment: isValidObjectId(equipmentId) ? equipmentId : null },
        { 'equipment.equipmentId': equipmentId },
      ];
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { logId: regex },
        { studentName: regex },
        { studentEmail: regex },
        { equipmentName: regex },
        { lab: regex },
        { notes: regex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;

    if (req.user && req.user.role === 'admin' && !isDemoAdmin(req.user)) {
      const adminEquipment = await Equipment.find({
        $or: [
          { createdBy: req.user._id },
          ...(req.user.institution
            ? [
                {
                  $and: [
                    {
                      $or: [
                        { institution: new RegExp(`^${escapeRegex(req.user.institution)}$`, 'i') },
                        { collegeName: new RegExp(`^${escapeRegex(req.user.institution)}$`, 'i') },
                      ],
                    },
                    { createdBy: { $ne: null } },
                  ],
                },
              ]
            : []),
        ],
      }).select('_id equipmentId');

      const eqIds = adminEquipment.map((e) => e._id);
      const eqStringIds = adminEquipment.map((e) => e.equipmentId).filter(Boolean);

      const adminFilters = [];
      if (eqIds.length > 0) adminFilters.push({ equipment: { $in: eqIds } });
      if (eqStringIds.length > 0) adminFilters.push({ equipmentId: { $in: eqStringIds } });

      if (adminFilters.length > 0) {
        if (query.$or) {
          query.$and = (query.$and || []).concat([{ $or: query.$or }, { $or: adminFilters }]);
          delete query.$or;
        } else {
          query.$or = adminFilters;
        }
      } else {
        return res.json({
          success: true,
          total: 0,
          count: 0,
          page: pageNum,
          totalPages: 0,
          data: [],
          logs: [],
        });
      }
    }

    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      UsageLog.find(query).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limitNum),
      UsageLog.countDocuments(query),
    ]);

    return res.json({
      success: true,
      total,
      count: logs.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: logs,
      logs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single usage log
 * @route   GET /api/usage-logs/:id
 */
const getUsageLogById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { logId: id }] }
      : { logId: id };

    const log = await UsageLog.findOne(query);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Usage log not found' });
    }

    return res.json({ success: true, data: log, log });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new usage log session
 * @route   POST /api/usage-logs
 */
const createUsageLog = async (req, res, next) => {
  try {
    const {
      equipmentId,
      studentName,
      studentEmail,
      date,
      startTime,
      endTime,
      notes,
    } = req.body;

    const equipment = await Equipment.findOne({
      $or: [
        { equipmentId },
        { _id: isValidObjectId(equipmentId) ? equipmentId : null },
        { equipmentNumber: equipmentId },
      ],
    });

    const count = await UsageLog.countDocuments();
    const logId = `UL-${1000 + count + 1}`;

    const newLog = await UsageLog.create({
      logId,
      equipmentId: equipment ? equipment.equipmentId : equipmentId,
      equipmentName: equipment ? (equipment.equipmentName || equipment.name) : 'Laboratory Equipment',
      equipmentNumber: equipment ? equipment.equipmentNumber : '',
      studentName: studentName || 'Student',
      studentEmail: studentEmail || 'student@example.com',
      lab: equipment ? equipment.labName : 'General Lab',
      college: equipment ? (equipment.collegeName || equipment.collegeId) : 'Chitkara University',
      date: date || new Date().toISOString().slice(0, 10),
      startTime: startTime || '10:00',
      endTime: endTime || '12:00',
      status: 'Active',
      notes: notes || '',
    });

    if (equipment) {
      await Equipment.updateOne({ _id: equipment._id }, { $inc: { activeSessions: 1 } });
    }

    return res.status(201).json({
      success: true,
      message: 'Usage log session created',
      data: newLog,
      log: newLog,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update usage log
 * @route   PATCH /api/usage-logs/:id
 */
const updateUsageLog = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { logId: id }] }
      : { logId: id };

    const log = await UsageLog.findOne(query);
    if (!log) {
      return res.status(404).json({ success: false, message: 'Usage log not found' });
    }

    if (status) log.status = status;
    if (notes !== undefined) log.notes = notes;

    await log.save();

    return res.json({
      success: true,
      message: 'Usage session updated',
      data: log,
      log,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get usage statistics
 * @route   GET /api/usage-logs/stats
 */
const getUsageStats = async (req, res, next) => {
  try {
    const totalSessions = await UsageLog.countDocuments();
    const activeSessions = await UsageLog.countDocuments({ status: { $in: ['Active', 'active', 'in-progress'] } });

    const totalHours = totalSessions * 2;
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthlySessions = await UsageLog.countDocuments({
      date: new RegExp(`^${currentMonthKey}`),
    });

    return res.json({
      success: true,
      data: {
        totalSessions,
        totalHours,
        activeSessions,
        monthlySessions,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    QR Check-in
 * @route   POST /api/usage/check-in
 */
const checkIn = async (req, res, next) => {
  try {
    const { bookingId } = req.body;
    const booking = await Booking.findOne({
      $or: [{ bookingId }, { _id: isValidObjectId(bookingId) ? bookingId : null }],
    });

    const newLog = await UsageLog.create({
      booking: booking ? booking._id : null,
      bookingId: booking ? booking.bookingId : bookingId,
      user: req.user?._id || booking?.user || null,
      equipmentId: booking ? booking.equipmentId : '',
      equipmentName: booking ? booking.equipmentName : 'Lab Instrument',
      studentName: booking?.student?.name || req.user?.name || 'Student',
      studentEmail: booking?.student?.email || req.user?.email || '',
      checkInTime: new Date(),
      status: 'Active',
      startTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    });

    return res.status(201).json({
      success: true,
      message: 'Check-in successful',
      data: newLog,
      log: newLog,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    QR Check-out
 * @route   POST /api/usage/check-out
 */
const checkOut = async (req, res, next) => {
  try {
    const { logId, bookingId } = req.body;
    let query = null;

    if (logId) {
      query = isValidObjectId(logId)
        ? { $or: [{ _id: logId }, { logId }] }
        : { logId };
    } else if (bookingId) {
      query = isValidObjectId(bookingId)
        ? { $or: [{ bookingId }, { booking: bookingId }] }
        : { bookingId };
    } else if (req.user) {
      query = {
        status: 'Active',
        $or: [
          { studentEmail: req.user.email },
          { 'student.email': req.user.email },
          { user: req.user._id },
        ],
      };
    }

    const log = query ? await UsageLog.findOne(query).sort({ createdAt: -1 }) : null;
    if (!log) {
      return res.status(404).json({ success: false, message: 'Session log not found' });
    }

    log.checkOutTime = new Date();
    log.status = 'Completed';
    log.endTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (req.body.notes) {
      log.notes = log.notes ? `${log.notes} | ${req.body.notes}` : req.body.notes;
    }
    await log.save();

    if (log.equipmentId) {
      await Equipment.updateOne(
        { $or: [{ equipmentId: log.equipmentId }, { _id: isValidObjectId(log.equipmentId) ? log.equipmentId : null }] },
        { $inc: { activeSessions: -1 } }
      ).catch(() => {});
    }

    return res.json({
      success: true,
      message: 'Check-out successful',
      data: log,
      log,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get active session for current user
 * @route   GET /api/usage/active
 */
const getActiveSession = async (req, res, next) => {
  try {
    const userEmail = req.user?.email;
    const query = { status: { $in: ['Active', 'active', 'in-progress'] } };
    if (userEmail) query.studentEmail = userEmail;

    const activeLog = await UsageLog.findOne(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      data: activeLog,
      session: activeLog,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getUsageLogs,
  getUsageLogById,
  createUsageLog,
  updateUsageLog,
  getUsageStats,
  checkIn,
  checkOut,
  getActiveSession,
};
