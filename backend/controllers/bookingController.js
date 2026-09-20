const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Equipment = require('../src/models/Equipment');
const Availability = require('../src/models/Availability');
const Institution = require('../src/models/Institution');
const { isValidObjectId } = require('../src/utils/apiHelpers');

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

    const eqName = equipment ? (equipment.equipmentName || equipment.name) : (req.body.equipmentName || 'Laboratory Equipment');
    const eqCategory = equipment ? equipment.category : (req.body.equipmentCategory || 'General');
    const college = equipment ? (equipment.collegeName || equipment.collegeId) : (req.body.college || 'Chitkara University');
    const lab = equipment ? equipment.labName : (req.body.lab || 'General Lab');
    const duration = calculateDurationHours(startTime, endTime);
    const hourlyRate = equipment?.price || equipment?.pricePerHour || 500;
    const totalCost = duration * hourlyRate;

    const bookingId = `BK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const studentUser = req.user || {};

    const booking = await Booking.create({
      bookingId,
      equipmentId: equipment ? equipment.equipmentId : targetEqId,
      equipment: equipment ? equipment._id : null,
      equipmentName: eqName,
      equipmentCategory: eqCategory,
      user: studentUser._id || null,
      student: {
        name: studentName || req.body.userName || studentUser.name || 'Student',
        email: studentEmail || req.body.userEmail || studentUser.email || 'student@example.com',
        avatar: studentUser.avatar || 'ST',
        institution: studentUser.institution || college,
        userId: studentUser._id,
      },
      lab,
      college,
      date: typeof date === 'string' ? date : new Date(date).toISOString().split('T')[0],
      startTime,
      endTime,
      duration,
      totalPrice: totalCost,
      totalAmount: totalCost,
      purpose: purpose || 'Academic Research',
      status: 'Pending',
    });

    return res.status(201).json({
      success: true,
      message: 'Booking request submitted successfully',
      data: booking,
      booking,
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
    const { status, rejectionReason } = req.body;

    const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { bookingId: id }] }
      : { bookingId: id };

    const booking = await Booking.findOne(query);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking request not found' });
    }

    booking.status = normalizedStatus;
    if (normalizedStatus === 'Approved') {
      booking.approvedBy = req.user?.name || 'Admin';
      booking.approvedAt = new Date();
      booking.rejectionReason = '';

      if (booking.equipmentId) {
        await Equipment.updateOne(
          { equipmentId: booking.equipmentId },
          { $inc: { activeSessions: 1 } }
        );
      }
    } else if (normalizedStatus === 'Rejected') {
      booking.rejectionReason = rejectionReason || 'Equipment unavailable for requested slot';
      booking.approvedBy = req.user?.name || 'Admin';
    }

    await booking.save();

    return res.json({
      success: true,
      message: `Booking request ${normalizedStatus.toLowerCase()} successfully`,
      data: booking,
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve booking helper
 * @route   PATCH /api/bookings/:id/approve
 */
const approveBooking = async (req, res, next) => {
  req.body.status = 'Approved';
  return updateBookingStatus(req, res, next);
};

/**
 * @desc    Reject booking helper
 * @route   PATCH /api/bookings/:id/reject
 */
const rejectBooking = async (req, res, next) => {
  req.body.status = 'Rejected';
  return updateBookingStatus(req, res, next);
};

/**
 * @desc    Cancel booking helper
 * @route   PATCH /api/bookings/:id/cancel
 */
const cancelBooking = async (req, res, next) => {
  req.body.status = 'Cancelled';
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
    const bookings = await Booking.find({
      $or: [{ user: userId }, { 'student.email': email }, { 'student.userId': userId }],
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
  return getAllBookings(req, res, next);
};

const getEquipmentBookingHistory = async (req, res, next) => {
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
