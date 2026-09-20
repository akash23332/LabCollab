const Equipment = require('../models/Equipment');
const Institution = require('../models/Institution');
const { isValidObjectId, parseLimit, parsePage, canManage } = require('../utils/apiHelpers');

const createEquipment = async (req, res, next) => {
  try {
    const { name, category, institution: institutionId } = req.body;
    if (!name || !category || !institutionId) {
      return res.status(400).json({ message: 'name, category, and institution are required' });
    }
    if (!isValidObjectId(institutionId)) {
      return res.status(400).json({ message: 'Invalid institution id' });
    }
    const institution = await Institution.findById(institutionId);
    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }
    if (!canManage(req.user, institution)) {
      return res.status(403).json({ message: 'Not authorized to add equipment to this institution' });
    }

    const equipment = await Equipment.create({
      ...req.body,
      institution: institutionId,
      createdBy: req.user._id,
      isVerified: false,
    });
    return res.status(201).json({ equipment });
  } catch (error) {
    return next(error);
  }
};

const getEquipment = async (req, res, next) => {
  try {
    const filter = {};
    const isAdmin = req.user?.role === 'admin';
    if (!isAdmin) {
      filter.isVerified = true;
    }
    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) {
      if (!['available', 'maintenance', 'decommissioned'].includes(req.query.status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      filter.status = req.query.status;
    }
    if (req.query.institution && isValidObjectId(req.query.institution)) {
      filter.institution = req.query.institution;
    }
    if (req.query.trainingRequired !== undefined) {
      filter.trainingRequired = req.query.trainingRequired === 'true';
    }
    if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
      filter.pricePerHour = {};
      if (req.query.minPrice !== undefined) {
        const min = Number(req.query.minPrice);
        if (Number.isNaN(min)) return res.status(400).json({ message: 'Invalid minPrice' });
        filter.pricePerHour.$gte = min;
      }
      if (req.query.maxPrice !== undefined) {
        const max = Number(req.query.maxPrice);
        if (Number.isNaN(max)) return res.status(400).json({ message: 'Invalid maxPrice' });
        filter.pricePerHour.$lte = max;
      }
    }
    if (req.query.city) {
      filter['location.city'] = new RegExp(`^${req.query.city}$`, 'i');
    }
    if (req.query.state) {
      filter['location.state'] = new RegExp(`^${req.query.state}$`, 'i');
    }

    const limit = parseLimit(req.query.limit);
    const page = parsePage(req.query.page);

    const [equipment, count] = await Promise.all([
      Equipment.find(filter)
        .populate('institution', 'name city state location isVerified')
        .populate('createdBy', 'name role')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Equipment.countDocuments(filter),
    ]);

    return res.json({ count, page, equipment });
  } catch (error) {
    return next(error);
  }
};

const getEquipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid equipment id' });
    const equipment = await Equipment.findById(id)
      .populate('institution', 'name city state location isVerified')
      .populate('createdBy', 'name role');
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
    return res.json({ equipment });
  } catch (error) {
    return next(error);
  }
};

const updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid equipment id' });
    const equipment = await Equipment.findById(id);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
    Object.assign(equipment, req.body);
    await equipment.save();
    return res.json({ equipment });
  } catch (error) {
    return next(error);
  }
};

const deleteEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid equipment id' });
    await Equipment.findByIdAndDelete(id);
    return res.json({ message: 'Equipment deleted' });
  } catch (error) {
    return next(error);
  }
};

const verifyEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) return res.status(400).json({ message: 'Invalid equipment id' });
    const equipment = await Equipment.findById(id);
    if (!equipment) return res.status(404).json({ message: 'Equipment not found' });
    equipment.isVerified = true;
    await equipment.save();
    return res.json({ message: 'Equipment verified', equipment });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createEquipment,
  getEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  verifyEquipment,
};
