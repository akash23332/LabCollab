const Availability = require('../models/Availability');
const Equipment = require('../models/Equipment');
const { isValidObjectId } = require('../utils/apiHelpers');

const HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

const createAvailability = async (req, res, next) => {
  try {
    const { equipment: equipmentId, date, startTime, endTime } = req.body;
    if (!equipmentId || !date || !startTime || !endTime) {
      return res.status(400).json({ message: 'equipment, date, startTime, and endTime are required' });
    }
    if (!isValidObjectId(equipmentId)) {
      return res.status(400).json({ message: 'Invalid equipment id' });
    }
    if (!HH_MM.test(startTime) || !HH_MM.test(endTime) || startTime >= endTime) {
      return res.status(400).json({ message: 'Invalid time range: startTime must precede endTime in HH:mm format' });
    }
    const equipment = await Equipment.findById(equipmentId);
    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    const availability = await Availability.create({
      equipment: equipmentId,
      date: new Date(date),
      startTime,
      endTime,
      isAvailable: true,
      createdBy: req.user._id,
    });
    return res.status(201).json({ availability });
  } catch (error) {
    return next(error);
  }
};

const getAvailabilityForEquipment = async (req, res, next) => {
  try {
    const { equipmentId } = req.params;
    if (!isValidObjectId(equipmentId)) {
      return res.status(400).json({ message: 'Invalid equipment id' });
    }
    const filter = { equipment: equipmentId };
    if (req.query.date) {
      filter.date = new Date(req.query.date);
    }
    const availability = await Availability.find(filter).sort({ date: 1, startTime: 1 });
    return res.json({ count: availability.length, availability });
  } catch (error) {
    return next(error);
  }
};

const updateAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
    const availability = await Availability.findByIdAndUpdate(id, req.body, { new: true });
    if (!availability) return res.status(404).json({ message: 'Availability not found' });
    return res.json({ availability });
  } catch (error) {
    return next(error);
  }
};

const deleteAvailability = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid id' });
    await Availability.findByIdAndDelete(id);
    return res.json({ message: 'Availability deleted' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createAvailability,
  getAvailabilityForEquipment,
  updateAvailability,
  deleteAvailability,
};
