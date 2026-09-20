const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const Equipment = require('../models/Equipment');
const { isValidObjectId } = require('../utils/apiHelpers');

// Helper to convert "HH:mm" to minutes from midnight
const timeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

/**
 * @desc    Get equipment availability (template, exceptions, approved bookings)
 * @route   GET /api/availability/:equipmentId
 * @access  Public
 */
const getAvailability = async (req, res, next) => {
  try {
    const { equipmentId } = req.params;

    let availRecord = await Availability.findOne({
      $or: [{ equipmentId }, { equipment: isValidObjectId(equipmentId) ? equipmentId : null }],
    });

    if (!availRecord) {
      availRecord = await Availability.create({
        equipmentId,
        weeklyTemplate: {
          default: [{ start: 8 * 60, end: 20 * 60, status: 'available' }],
        },
        exceptions: [],
      });
    }

    // Fetch approved bookings for this equipment to overlay onto the calendar
    const approvedBookings = await Booking.find({
      $or: [{ equipmentId }, { equipment: isValidObjectId(equipmentId) ? equipmentId : null }],
      status: { $in: ['Approved', 'approved'] },
    }).select('bookingId date startTime endTime student purpose');

    const formattedBookings = approvedBookings.map((b) => ({
      id: b.bookingId,
      date: b.date,
      start: timeToMinutes(b.startTime),
      end: timeToMinutes(b.endTime),
      studentName: b.student?.name || 'Student',
      institution: b.student?.institution || 'Partner University',
      purpose: b.purpose,
    }));

    return res.json({
      success: true,
      data: {
        equipmentId,
        weeklyTemplate: availRecord.weeklyTemplate || {
          default: [{ start: 8 * 60, end: 20 * 60, status: 'available' }],
        },
        exceptions: availRecord.exceptions || [],
        bookings: formattedBookings,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update weekly template for equipment
 * @route   PUT /api/availability/:equipmentId/template
 * @access  Public/Admin
 */
const updateWeeklyTemplate = async (req, res, next) => {
  try {
    const { equipmentId } = req.params;
    const { weeklyTemplate } = req.body;

    if (!weeklyTemplate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide weeklyTemplate',
      });
    }

    const updated = await Availability.findOneAndUpdate(
      { $or: [{ equipmentId }, { equipment: isValidObjectId(equipmentId) ? equipmentId : null }] },
      { equipmentId, weeklyTemplate },
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: 'Weekly template updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add exception (blocked or maintenance slot)
 * @route   POST /api/availability/:equipmentId/exceptions
 * @access  Public/Admin
 */
const addException = async (req, res, next) => {
  try {
    const { equipmentId } = req.params;
    const { date, start, end, status, reason } = req.body;

    if (!date || start === undefined || end === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide date, start, and end time in minutes',
      });
    }

    const exceptionId = `exc-${Date.now()}`;
    const newException = {
      id: exceptionId,
      date,
      start: Number(start),
      end: Number(end),
      status: status || 'blocked',
      reason: reason || '',
    };

    const updated = await Availability.findOneAndUpdate(
      { $or: [{ equipmentId }, { equipment: isValidObjectId(equipmentId) ? equipmentId : null }] },
      { $push: { exceptions: newException } },
      { new: true, upsert: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Availability exception added',
      data: newException,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Remove exception
 * @route   DELETE /api/availability/:equipmentId/exceptions/:exceptionId
 * @access  Public/Admin
 */
const removeException = async (req, res, next) => {
  try {
    const { equipmentId, exceptionId } = req.params;

    const updated = await Availability.findOneAndUpdate(
      { $or: [{ equipmentId }, { equipment: isValidObjectId(equipmentId) ? equipmentId : null }] },
      { $pull: { exceptions: { id: exceptionId } } },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Availability record not found' });
    }

    return res.json({
      success: true,
      message: 'Exception removed successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create slot (for tests or custom slot bookings)
 * @route   POST /api/availability
 */
const createAvailability = async (req, res, next) => {
  try {
    const { equipment: equipmentId, date, startTime, endTime } = req.body;
    const availability = await Availability.create({
      equipment: equipmentId,
      equipmentId: equipmentId ? equipmentId.toString() : '',
      date: date ? new Date(date) : new Date(),
      startTime: startTime || '10:00',
      endTime: endTime || '12:00',
      isBooked: false,
      status: 'available',
    });

    return res.status(201).json({
      success: true,
      availability,
      data: availability,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get slots
 * @route   GET /api/availability
 */
const getAvailabilitySlots = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.equipment) {
      filter.$or = [{ equipment: req.query.equipment }, { equipmentId: req.query.equipment }];
    }
    const list = await Availability.find(filter);
    return res.json({
      success: true,
      count: list.length,
      availability: list,
      data: list,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailability,
  updateWeeklyTemplate,
  addException,
  removeException,
  createAvailability,
  getAvailabilitySlots,
};
