const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Equipment = require('../src/models/Equipment');
const Availability = require('../src/models/Availability');
const Institution = require('../src/models/Institution');
const { isValidObjectId, isDemoAdmin, escapeRegex } = require('../src/utils/apiHelpers');

// Helper to convert "HH:mm" to total minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

// Calculate duration in hours between two HH:mm strings
const calculateDurationHours = (startTime, endTime) => {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  return Math.max(0.5, (endMin - startMin) / 60);
};

/**
 * @desc    Get all bookings (Admin & User)
 * @route   GET /api/bookings
 * @access  Private / Public
 */
const getAllBookings = async (req, res, next) => {
  try {
    const { status, equipmentId, date, search, page = 1, limit = 50 } = req.query;
    const query = {};

    // If student is logged in, restrict to their own bookings (and exclude synthetic historical bookings)
    if (req.user && req.user.role === 'student') {
      query.$and = [
        {
          $or: [
            { user: req.user._id },
            { 'student.userId': req.user._id },
            { 'student.email': new RegExp(`^${escapeRegex(req.user.email)}$`, 'i') },
          ],
        },
        { isHistorical: { $ne: true } },
      ];
    } else if (req.user && ['admin', 'faculty', 'manager'].includes(req.user.role)) {
      // System admins and demo admins see all showcase and platform bookings.
      // Faculty and managers only see bookings for equipment belonging to them or their institution
      if (req.user.role !== 'admin' && !isDemoAdmin(req.user)) {
        const adminEquipment = await Equipment.find({
          $or: [
            { createdBy: req.user._id },
            ...(req.user.institution
              ? [
                  { institution: req.user.institution },
                  { collegeName: new RegExp(`^${escapeRegex(req.user.institution)}$`, 'i') },
                ]
              : []),
          ],
        }).select('_id equipmentId');

        const eqIds = adminEquipment.map((e) => e._id);
        const eqStringIds = adminEquipment.map((e) => e.equipmentId).filter(Boolean);

        const adminBookingFilters = [];
        if (eqIds.length > 0) adminBookingFilters.push({ equipment: { $in: eqIds } });
        if (eqStringIds.length > 0) adminBookingFilters.push({ equipmentId: { $in: eqStringIds } });

        if (adminBookingFilters.length > 0) {
          query.$or = adminBookingFilters;
        } else if (!equipmentId) {
          // No equipment exists yet for this admin/manager -> 0 bookings
          return res.status(200).json({
            success: true,
            total: 0,
            count: 0,
            page: parseInt(page, 10) || 1,
            totalPages: 0,
            data: [],
            bookings: [],
          });
        }
      }
    } else if (req.query.userEmail) {
      query['student.email'] = new RegExp(`^${escapeRegex(req.query.userEmail)}$`, 'i');
    }

    if (status && status !== 'all') {
      query.status = new RegExp(status, 'i');
    }

    if (equipmentId) {
      query.$or = [
        { equipmentId },
        { equipment: isValidObjectId(equipmentId) ? equipmentId : null },
      ];
    }

    if (date) {
      query.date = date;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [
        { bookingId: regex },
        { equipmentName: regex },
        { 'student.name': regex },
        { 'student.email': regex },
        { purpose: regex },
      ];
    }

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const [bookings, total] = await Promise.all([
      Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum),
      Booking.countDocuments(query),
    ]);

    return res.json({
      success: true,
      total,
      count: bookings.length,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      data: bookings,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { bookingId: id }] }
      : { bookingId: id };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking request not found' });
    }

    // Role-based visibility check: students cannot view other users' private bookings
    if (req.user && req.user.role === 'student') {
      const bUserId = (booking.user?._id || booking.user || booking.student?.userId)?.toString();
      const bEmail = (booking.student?.email || '').toLowerCase();
      const currentUserIdStr = (req.user._id || req.user.id)?.toString();
      const currentUserEmail = (req.user.email || '').toLowerCase();

      const isOwner =
        (currentUserIdStr && bUserId && currentUserIdStr === bUserId) ||
        (currentUserEmail && bEmail && currentUserEmail === bEmail);

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to view this booking',
        });
      }
    }

    return res.json({ success: true, data: booking, booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new booking request
 * @route   POST /api/bookings
 */
const createBooking = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token missing',
      });
    }

    const {
      equipmentId,
      equipment: eqParam,
      date,
      startTime,
      endTime,
      purpose,
      studentName,
      studentEmail,
    } = req.body;

    const targetEqId = equipmentId || eqParam;
    if (!targetEqId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: 'Please provide equipmentId, date, startTime, and endTime',
      });
    }

    const equipment = await Equipment.findOne({
      $or: [
        { equipmentId: targetEqId },
        { _id: isValidObjectId(targetEqId) ? targetEqId : null },
        { equipmentNumber: targetEqId },
      ],
    });

    if (!equipment) {
      return res.status(404).json({
        success: false,
        message: 'Equipment not found',
      });
    }

    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    if (startMin >= endMin) {
      return res.status(400).json({
        success: false,
        message: 'End time must be after start time',
      });
    }

    const dateStr = typeof date === 'string' ? date.split('T')[0] : new Date(date).toISOString().split('T')[0];
    const parsedDate = new Date(date);
    const utcStart = new Date(Date.UTC(parsedDate.getUTCFullYear(), parsedDate.getUTCMonth(), parsedDate.getUTCDate()));
    const utcEnd = new Date(utcStart.getTime() + 24 * 60 * 60 * 1000);

    // Check Availability window if set
    const availability = await Availability.findOne({
      $and: [
        {
          $or: [
            { equipment: equipment._id },
            ...(equipment.equipmentId ? [{ equipmentId: equipment.equipmentId }] : []),
            { equipmentId: targetEqId },
          ],
        },
        {
          $or: [
            { date: dateStr },
            { date: { $gte: utcStart, $lt: utcEnd } },
          ],
        },
      ],
    });

    if (availability && availability.startTime && availability.endTime) {
      const availStart = timeToMinutes(availability.startTime);
      const availEnd = timeToMinutes(availability.endTime);
      if (startMin < availStart || endMin > availEnd) {
        return res.status(400).json({
          success: false,
          message: 'Selected time is outside the equipment availability.',
        });
      }
    }

    // Double-booking and duplicate check:
    // Look for existing active bookings for this equipment on this date
    const eqFilter = [
      { equipment: equipment._id },
      ...(equipment.equipmentId ? [{ equipmentId: equipment.equipmentId }] : []),
      { equipmentId: targetEqId },
    ];

    const activeBookings = await Booking.find({
      $and: [
        {
          $or: eqFilter,
        },
        {
          $or: [
            { date: dateStr },
            { date: { $gte: utcStart, $lt: utcEnd } },
          ],
        },
        {
          status: { $in: ['pending', 'approved', 'Pending', 'Approved'] },
        },
      ],
    });

    const currentUserIdStr = (req.user._id || req.user.id)?.toString();
    const currentUserEmail = (req.user.email || studentEmail || '').toLowerCase();

    for (const b of activeBookings) {
      const existingStart = timeToMinutes(b.startTime);
      const existingEnd = timeToMinutes(b.endTime);

      // Overlap condition: startMin < existingEnd && endMin > existingStart
      if (startMin < existingEnd && endMin > existingStart) {
        const bUserId = (b.user?._id || b.user || b.student?.userId)?.toString();
        const bEmail = (b.student?.email || '').toLowerCase();

        const isSameUser =
          (currentUserIdStr && bUserId && currentUserIdStr === bUserId) ||
          (currentUserEmail && bEmail && currentUserEmail === bEmail);

        if (isSameUser) {
          return res.status(409).json({
            success: false,
            message: 'You already have an active booking for this equipment during this time slot.',
          });
        } else {
          return res.status(409).json({
            success: false,
            message: 'Equipment is already booked for the selected time.',
          });
        }
      }
    }

    const eqName = equipment.equipmentName || equipment.name || req.body.equipmentName || 'Laboratory Equipment';
    const eqCategory = equipment.category || req.body.equipmentCategory || 'General';
    const college = equipment.collegeName || equipment.collegeId || req.body.college || 'Chitkara University';
    const lab = equipment.labName || req.body.lab || 'General Lab';
    const duration = calculateDurationHours(startTime, endTime);
    const hourlyRate = equipment.pricePerHour || equipment.price || 500;
    const totalCost = duration * hourlyRate;

    const bookingId = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const studentUser = req.user;

    const booking = await Booking.create({
      bookingId,
      equipmentId: equipment.equipmentId || targetEqId,
      equipment: isValidObjectId(equipment._id) ? equipment._id : null,
      institution: isValidObjectId(equipment.institution) ? equipment.institution : null,
      equipmentName: eqName,
      equipmentCategory: eqCategory,
      user: studentUser._id,
      student: {
        name: studentName || req.body.userName || studentUser.name || 'Student',
        email: studentEmail || req.body.userEmail || studentUser.email || 'student@example.com',
        avatar: studentUser.avatar || 'ST',
        institution: studentUser.institution || college,
        userId: studentUser._id,
      },
      lab,
      college,
      date: dateStr,
      startTime,
      endTime,
      duration,
      totalPrice: totalCost,
      totalAmount: totalCost,
      purpose: purpose || 'Academic Research',
      status: 'pending',
    });

    let populated = booking;
    try {
      let query = Booking.findById(booking._id);
      if (booking.equipment && isValidObjectId(booking.equipment)) {
        query = query.populate('equipment');
      }
      if (booking.institution && isValidObjectId(booking.institution)) {
        query = query.populate('institution');
      }
      const resDoc = await query;
      if (resDoc) populated = resDoc;
    } catch (popErr) {
      console.warn('Booking populate warning (safe fallback used):', popErr.message);
      populated = booking;
    }

    return res.status(201).json({
      success: true,
      message: 'Booking request created',
      data: populated || booking,
      booking: populated || booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update booking status (Approve / Reject / Cancel)
 * @route   PATCH /api/bookings/:id/status
 */
const updateBookingStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    req.body = req.body || {};
    const { status, rejectionReason } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required' });
    }

    const targetStatus = status.toLowerCase();

    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { bookingId: id }] }
      : { bookingId: id };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking request not found' });
    }

    const isAdminOrManager =
      req.user && ['admin', 'faculty', 'manager'].includes(req.user.role);

    const bUserId = (booking.user?._id || booking.user || booking.student?.userId)?.toString();
    const bEmail = (booking.student?.email || '').toLowerCase();
    const currentUserIdStr = (req.user?._id || req.user?.id)?.toString();
    const currentUserEmail = (req.user?.email || '').toLowerCase();

    const isOwner =
      (currentUserIdStr && bUserId && currentUserIdStr === bUserId) ||
      (currentUserEmail && bEmail && currentUserEmail === bEmail);

    if (targetStatus === 'approved') {
      if (!isAdminOrManager) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to approve this booking',
        });
      }

      // Re-check conflicts during approval
      const dateStr = typeof booking.date === 'string' ? booking.date.split('T')[0] : new Date(booking.date).toISOString().split('T')[0];
      const startMin = timeToMinutes(booking.startTime);
      const endMin = timeToMinutes(booking.endTime);

      const approvedConflicts = await Booking.find({
        _id: { $ne: booking._id },
        $or: [
          ...(booking.equipment ? [{ equipment: booking.equipment }] : []),
          ...(booking.equipmentId ? [{ equipmentId: booking.equipmentId }] : []),
        ],
        date: { $in: [dateStr, new Date(`${dateStr}T00:00:00.000Z`)] },
        status: { $in: ['approved', 'Approved'] },
      });

      for (const b of approvedConflicts) {
        const bStart = timeToMinutes(b.startTime);
        const bEnd = timeToMinutes(b.endTime);
        if (startMin < bEnd && endMin > bStart) {
          return res.status(409).json({
            success: false,
            message: 'Equipment is already booked for the selected time.',
          });
        }
      }

      booking.status = 'approved';
      booking.approvedBy = req.user?.name || 'Admin';
      booking.approvedAt = new Date();
      booking.rejectionReason = '';

      if (booking.equipmentId) {
        await Equipment.updateOne(
          { equipmentId: booking.equipmentId },
          { $inc: { activeSessions: 1 } }
        );
      }

      await booking.save();

      return res.json({
        success: true,
        message: 'Booking approved successfully',
        data: booking,
        booking,
      });
    } else if (targetStatus === 'rejected') {
      if (!isAdminOrManager) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to approve this booking',
        });
      }

      booking.status = 'rejected';
      booking.rejectionReason = rejectionReason || 'Equipment unavailable for requested slot';
      booking.approvedBy = req.user?.name || 'Admin';

      await booking.save();

      return res.json({
        success: true,
        message: 'Booking rejected successfully',
        data: booking,
        booking,
      });
    } else if (targetStatus === 'cancelled') {
      if ((booking.status || '').toLowerCase() === 'rejected') {
        return res.status(400).json({
          success: false,
          message: 'Cannot cancel already rejected booking',
        });
      }

      if (!isOwner && !isAdminOrManager) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to cancel this booking',
        });
      }

      booking.status = 'cancelled';
      await booking.save();

      return res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: booking,
        booking,
      });
    } else {
      booking.status = targetStatus;
      await booking.save();

      return res.json({
        success: true,
        message: `Booking request ${targetStatus} successfully`,
        data: booking,
        booking,
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve booking helper
 * @route   PATCH /api/bookings/:id/approve
 */
const approveBooking = async (req, res, next) => {
  req.body = req.body || {};
  req.body.status = 'approved';
  return updateBookingStatus(req, res, next);
};

/**
 * @desc    Reject booking helper
 * @route   PATCH /api/bookings/:id/reject
 */
const rejectBooking = async (req, res, next) => {
  req.body = req.body || {};
  req.body.status = 'rejected';
  return updateBookingStatus(req, res, next);
};

/**
 * @desc    Cancel booking helper
 * @route   PATCH /api/bookings/:id/cancel
 */
const cancelBooking = async (req, res, next) => {
  req.body = req.body || {};
  req.body.status = 'cancelled';
  return updateBookingStatus(req, res, next);
};

/**
 * @desc    Get user's own bookings
 * @route   GET /api/bookings/my
 */
const getMyBookings = async (req, res, next) => {
  try {
    const userId = req.user?._id;
    const email = req.user?.email;

    if (!userId && !email) {
      return res.json({
        success: true,
        count: 0,
        data: [],
        bookings: [],
      });
    }

    const bookings = await Booking.find({
      $and: [
        {
          $or: [
            ...(userId ? [{ user: userId }, { 'student.userId': userId }] : []),
            ...(email ? [{ 'student.email': new RegExp(`^${escapeRegex(email)}$`, 'i') }] : []),
          ],
        },
        { isHistorical: { $ne: true } },
      ],
    }).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: bookings.length,
      data: bookings,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Export booking history for AI
 * @route   GET /api/bookings/export-demand-history
 */
const exportDemandHistory = async (req, res, next) => {
  try {
    const history = await Booking.aggregate([
      { $match: { status: { $in: ['Approved', 'approved'] } } },
      {
        $group: {
          _id: { equipment_id: '$equipmentId', date: '$date' },
          bookings: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          equipment_id: '$_id.equipment_id',
          date: '$_id.date',
          bookings: '$bookings',
        },
      },
      { $sort: { equipment_id: 1, date: 1 } },
    ]);

    return res.json({
      success: true,
      count: history.length,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

const getInstitutionBookingRequests = async (req, res, next) => {
  try {
    let bookings;
    try {
      bookings = await Booking.find({ isHistorical: { $ne: true } })
        .populate('equipment')
        .sort({ createdAt: -1 });
    } catch (popErr) {
      console.warn('Booking populate failed in getInstitutionBookingRequests, falling back:', popErr.message);
      bookings = await Booking.find({ isHistorical: { $ne: true } }).sort({ createdAt: -1 });
    }

    const requests = bookings.map((b) => ({
      ...b.toObject(),
      id: b.id || b._id.toString(),
      bookingId: b.id || b._id.toString(),
      student: b.student?.name || (typeof b.student === 'string' ? b.student : (b.user?.name || 'Student')),
      equipment: (b.equipment && typeof b.equipment === 'object' ? (b.equipment.name || b.equipment.equipmentName) : b.equipmentName) || 'Equipment',
      status: (b.status || 'pending').toLowerCase(),
      date: b.date,
      startTime: b.startTime,
      endTime: b.endTime,
      duration: b.duration,
      totalAmount: b.totalAmount,
      purpose: b.purpose,
      raw: b,
    }));

    return res.json({
      success: true,
      count: requests.length,
      requests,
      data: requests,
      bookings: requests,
    });
  } catch (error) {
    next(error);
  }
};

const getEquipmentBookingHistory = async (req, res, next) => {
  if (req.user && req.user.role === 'student') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: students cannot view equipment booking history',
    });
  }
  req.query.equipmentId = req.params.equipmentId;
  return getAllBookings(req, res, next);
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  approveBooking,
  rejectBooking,
  cancelBooking,
  getMyBookings,
  getInstitutionBookingRequests,
  getEquipmentBookingHistory,
  exportDemandHistory,
};
