const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Equipment = require('../src/models/Equipment');
const Availability = require('../src/models/Availability');
const Institution = require('../src/models/Institution');
const {
  isValidObjectId,
  isValidTime,
  toUTCDay,
  canManage,
} = require('../src/utils/apiHelpers');

/**
 * Helper to convert "HH:mm" to total minutes from midnight
 */
const timeToMinutes = (timeStr) => {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
};

/**
 * Calculate duration in hours between two HH:mm strings
 */
const calculateDurationHours = (startTime, endTime) => {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  return (endMin - startMin) / 60;
};

/**
 * Check if a conflicting booking exists for the given equipment, date, and time window.
 * Relevant active statuses: pending, approved
 */
const findConflictingBooking = async ({
  equipmentId,
  date,
  startTime,
  endTime,
  statuses = ['pending', 'approved'],
  excludeBookingId = null,
}) => {
  const query = {
    equipment: equipmentId,
    date: toUTCDay(date),
    status: { $in: statuses },
    // Two intervals overlap when: newStart < existingEnd AND newEnd > existingStart
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  return await Booking.findOne(query);
};

/**
 * @desc    Create a new booking request
 * @route   POST /api/bookings
 * @access  Private
 */
const createBooking = async (req, res, next) => {
  try {
    const { equipment: equipmentId, date, startTime, endTime, purpose } = req.body;

    // 1. Validate required fields
    if (!equipmentId) {
      return res.status(400).json({ message: 'Equipment ID is required' });
    }
    if (!isValidObjectId(equipmentId)) {
      return res.status(400).json({ message: 'Invalid equipment ID' });
    }
    if (!date) {
      return res.status(400).json({ message: 'Date is required' });
    }
    if (!startTime || !endTime) {
      return res.status(400).json({ message: 'Start time and end time are required' });
    }
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({ message: 'Times must be valid in HH:mm format' });
    }
    if (startTime >= endTime) {
      return res.status(400).json({ message: 'End time must be later than start time' });
    }
    if (!purpose || !purpose.trim()) {
      return res.status(400).json({ message: 'Purpose is required' });
    }

    // 2. Find and verify equipment
    const equipment = await Equipment.findById(equipmentId).populate('institution');
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }
    if (!equipment.isVerified) {
      return res.status(400).json({ message: 'Equipment is not verified or approved' });
    }
    if (equipment.status !== 'available') {
      return res.status(400).json({ message: 'Equipment is not currently available for booking' });
    }

    const institutionId = equipment.institution?._id || equipment.institution;
    if (!institutionId) {
      return res.status(400).json({ message: 'Equipment has no associated institution' });
    }

    const normalizedDate = toUTCDay(date);

    // 3. Verify requested time falls completely within an active Availability record
    const availabilitySlot = await Availability.findOne({
      equipment: equipment._id,
      date: normalizedDate,
      isAvailable: true,
      startTime: { $lte: startTime },
      endTime: { $gte: endTime },
    });

    if (!availabilitySlot) {
      return res.status(400).json({
        message: 'Selected time is outside the equipment availability.',
      });
    }

    // 4. Double-booking prevention: check for conflicting pending/approved bookings
    const conflict = await findConflictingBooking({
      equipmentId: equipment._id,
      date: normalizedDate,
      startTime,
      endTime,
      statuses: ['pending', 'approved'],
    });

    if (conflict) {
      return res.status(409).json({
        message: 'Equipment is already booked for the selected time.',
      });
    }

    // 5. Calculate duration and total amount dynamically on the backend
    const duration = calculateDurationHours(startTime, endTime);
    if (duration <= 0) {
      return res.status(400).json({ message: 'Duration must be greater than zero' });
    }

    const totalAmount = Math.round(duration * equipment.pricePerHour * 100) / 100;

    // 6. Create booking with status 'pending' (DO NOT trust user ID from client)
    const newBooking = await Booking.create({
      user: req.user._id,
      equipment: equipment._id,
      institution: institutionId,
      availability: availabilitySlot._id,
      date: normalizedDate,
      startTime,
      endTime,
      duration,
      purpose: purpose.trim(),
      status: 'pending',
      totalAmount,
    });

    // 7. Format clean response
    const dateFormatted = newBooking.date.toISOString().slice(0, 10);

    return res.status(201).json({
      message: 'Booking request created',
      booking: {
        id: newBooking._id.toString(),
        equipment: {
          id: equipment._id.toString(),
          name: equipment.name,
        },
        institution: {
          id: institutionId.toString(),
          name: equipment.institution?.name || '',
        },
        date: dateFormatted,
        startTime: newBooking.startTime,
        endTime: newBooking.endTime,
        duration: newBooking.duration,
        totalAmount: newBooking.totalAmount,
        purpose: newBooking.purpose,
        status: newBooking.status,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently logged-in user's bookings
 * @route   GET /api/bookings/my
 * @access  Private
 */
const getMyBookings = async (req, res, next) => {
  try {
    const userMatch = [
      { user: req.user._id },
      { 'student.userId': req.user._id },
    ];
    if (req.user.email) {
      userMatch.push({ 'student.email': req.user.email });
    }

    const query = { $or: userMatch };

    if (req.query.status) {
      query.status = new RegExp(`^${req.query.status}$`, 'i');
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('equipment', 'name category pricePerHour location images')
      .populate('institution', 'name city state address');

    return res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single booking by ID
 * @route   GET /api/bookings/:id
 * @access  Private (Owner, Manager, Admin)
 */
const getBookingById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(id)
      .populate('user', 'name email phone institution role')
      .populate('equipment')
      .populate('institution');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Authorization check: booking owner, authorized institution manager, or admin
    const isOwner = String(booking.user?._id || booking.user) === String(req.user._id);
    const isManager = canManage(req.user, booking.equipment, [booking.institution?.createdBy]);

    if (!isOwner && !isManager) {
      return res.status(403).json({ message: 'You are not authorized to view this booking' });
    }

    return res.status(200).json({ booking });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get pending booking requests for institutions managed by logged-in user
 * @route   GET /api/bookings/requests
 * @access  Private (Institution Manager, Admin)
 */
const getInstitutionBookingRequests = async (req, res, next) => {
  try {
    // Normal students cannot view institution booking requests
    if (req.user.role === 'student') {
      return res.status(403).json({
        message: 'Only institution managers and administrators can view booking requests',
      });
    }

    let query = { status: 'pending' };

    if (req.query.status) {
      query.status = req.query.status;
    }

    // If not admin, restrict to equipment/institutions owned by the user
    if (req.user.role !== 'admin') {
      const managedInstitutions = await Institution.find({ createdBy: req.user._id }).select('_id');
      const managedInstIds = managedInstitutions.map((i) => i._id);

      const managedEquipment = await Equipment.find({
        $or: [{ createdBy: req.user._id }, { institution: { $in: managedInstIds } }],
      }).select('_id');
      const managedEquipIds = managedEquipment.map((e) => e._id);

      query.$or = [
        { equipment: { $in: managedEquipIds } },
        { institution: { $in: managedInstIds } },
      ];
    }

    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone institution')
      .populate('equipment', 'name category')
      .populate('institution', 'name');

    const formattedRequests = bookings.map((b) => ({
      bookingId: b._id.toString(),
      student: b.user?.name || 'Unknown',
      equipment: b.equipment?.name || 'Unknown',
      date: b.date ? b.date.toISOString().slice(0, 10) : '',
      time: `${b.startTime} - ${b.endTime}`,
      purpose: b.purpose,
      totalAmount: b.totalAmount,
      status: b.status,
    }));

    return res.status(200).json({
      count: formattedRequests.length,
      requests: formattedRequests,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Approve a pending booking request
 * @route   PATCH /api/bookings/:id/approve
 * @access  Private (Institution Manager, Admin)
 */
const approveBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(id)
      .populate('equipment')
      .populate('institution');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Authorization: Only authorized manager or admin can approve
    if (!canManage(req.user, booking.equipment, [booking.institution?.createdBy])) {
      return res.status(403).json({ message: 'You are not authorized to approve this booking' });
    }

    if (booking.status !== 'pending') {
      return res.status(400).json({
        message: `Cannot approve booking with status '${booking.status}'`,
      });
    }

    // MANDATORY RECHECK: verify availability and ensure no conflicting approved booking
    const availabilitySlot = await Availability.findOne({
      equipment: booking.equipment._id,
      date: booking.date,
      isAvailable: true,
      startTime: { $lte: booking.startTime },
      endTime: { $gte: booking.endTime },
    });

    if (!availabilitySlot) {
      return res.status(400).json({
        message: 'Selected time is no longer within equipment availability.',
      });
    }

    const conflict = await findConflictingBooking({
      equipmentId: booking.equipment._id,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
      statuses: ['approved'],
      excludeBookingId: booking._id,
    });

    if (conflict) {
      return res.status(409).json({
        message: 'Equipment is already booked for the selected time.',
      });
    }

    booking.status = 'approved';
    await booking.save();

    return res.status(200).json({
      message: 'Booking approved successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reject a pending booking request
 * @route   PATCH /api/bookings/:id/reject
 * @access  Private (Institution Manager, Admin)
 */
const rejectBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(id)
      .populate('equipment')
      .populate('institution');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Authorization: Only authorized manager or admin can reject
    if (!canManage(req.user, booking.equipment, [booking.institution?.createdBy])) {
      return res.status(403).json({ message: 'You are not authorized to reject this booking' });
    }

    if (['rejected', 'cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({
        message: `Cannot reject already ${booking.status} booking`,
      });
    }

    booking.status = 'rejected';
    await booking.save();

    return res.status(200).json({
      message: 'Booking rejected successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a booking
 * @route   PATCH /api/bookings/:id/cancel
 * @access  Private (Owner, Manager, Admin)
 */
const cancelBooking = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID' });
    }

    const booking = await Booking.findById(id)
      .populate('equipment')
      .populate('institution');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Authorization: Booking owner, manager, or admin
    const isOwner = String(booking.user) === String(req.user._id);
    const isManager = canManage(req.user, booking.equipment, [booking.institution?.createdBy]);

    if (!isOwner && !isManager) {
      return res.status(403).json({ message: 'You are not authorized to cancel this booking' });
    }

    if (['rejected', 'cancelled', 'completed'].includes(booking.status)) {
      return res.status(400).json({
        message: `Cannot cancel already ${booking.status} booking`,
      });
    }

    booking.status = 'cancelled';
    await booking.save();

    return res.status(200).json({
      message: 'Booking cancelled successfully',
      booking,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get complete booking history for a specific piece of equipment
 * @route   GET /api/bookings/equipment/:equipmentId
 * @access  Private (Institution Manager, Admin)
 */
const getEquipmentBookingHistory = async (req, res, next) => {
  try {
    const { equipmentId } = req.params;
    if (!isValidObjectId(equipmentId)) {
      return res.status(400).json({ message: 'Invalid equipment ID' });
    }

    const equipment = await Equipment.findById(equipmentId).populate('institution');
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    // Authorization: Only authorized manager or admin
    if (!canManage(req.user, equipment, [equipment.institution?.createdBy])) {
      return res.status(403).json({
        message: 'You are not authorized to view booking history for this equipment',
      });
    }

    const bookings = await Booking.find({ equipment: equipmentId })
      .sort({ createdAt: -1 })
      .populate('user', 'name email phone institution role');

    return res.status(200).json({
      count: bookings.length,
      bookings,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  getInstitutionBookingRequests,
  approveBooking,
  rejectBooking,
  cancelBooking,
  getEquipmentBookingHistory,
  calculateDurationHours,
  findConflictingBooking,
};
