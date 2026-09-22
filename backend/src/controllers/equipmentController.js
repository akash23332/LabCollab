const path = require('path');
const fs = require('fs');
const { execFile } = require('child_process');
const util = require('util');
const Equipment = require('../models/Equipment');
const Availability = require('../models/Availability');
const Institution = require('../models/Institution');
const Booking = require('../../models/Booking');
const { isValidObjectId, parseLimit, parsePage, isDemoAdmin, escapeRegex } = require('../utils/apiHelpers');

const execFilePromise = util.promisify(execFile);

const ensureArray = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
};

/**
 * @desc    Create new equipment
 * @route   POST /api/equipment
 * @access  Private
 */
const createEquipment = async (req, res, next) => {
  try {
    const {
      name,
      equipmentName,
      category,
      institution,
      collegeId,
      collegeName,
      price,
      pricePerHour,
    } = req.body;

    const title = name || equipmentName;
    if (!title || !category) {
      return res.status(400).json({ success: false, message: 'Equipment name and category are required' });
    }

    const equipmentId = req.body.equipmentId || `eq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const userInst = req.user?.institution || '';

    const equipment = await Equipment.create({
      ...req.body,
      equipmentId,
      name: title,
      equipmentName: title,
      category,
      price: price || pricePerHour || 500,
      pricePerHour: pricePerHour || price || 500,
      institution: institution || userInst || collegeName || collegeId || 'Lab Facility',
      collegeName: collegeName || userInst || institution || collegeId || 'Lab Facility',
      createdBy: req.user ? req.user._id : null,
      isVerified: true,
      capabilities: ensureArray(req.body.capabilities),
      applications: ensureArray(req.body.applications),
      experimentTypes: ensureArray(req.body.experimentTypes),
      sampleTypes: ensureArray(req.body.sampleTypes),
      measurements: ensureArray(req.body.measurements),
      keywords: ensureArray(req.body.keywords),
      tags: ensureArray(req.body.tags),
    });

    // Initialize availability template for calendar
    await Availability.findOneAndUpdate(
      { equipmentId },
      {
        equipmentId,
        weeklyTemplate: {
          default: [{ start: 8 * 60, end: 20 * 60, status: 'available' }],
        },
        exceptions: [],
      },
      { upsert: true, new: true }
    );

    return res.status(201).json({
      success: true,
      message: 'Equipment created successfully',
      data: equipment,
      equipment,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Get equipment list with filters
 * @route   GET /api/equipment
 * @access  Public
 */
const getEquipment = async (req, res, next) => {
  try {
    const filter = {};

    if (req.query.category && req.query.category !== 'all') {
      filter.category = new RegExp(req.query.category, 'i');
    }

    if (req.query.status && req.query.status !== 'all') {
      filter.$or = [
        { status: new RegExp(req.query.status, 'i') },
        { availability: new RegExp(req.query.status, 'i') },
      ];
    }

    if (req.query.search) {
      const q = new RegExp(req.query.search, 'i');
      filter.$or = [
        { name: q },
        { equipmentName: q },
        { category: q },
        { description: q },
        { collegeName: q },
        { 'location.city': q },
      ];
    }

    if (req.query.minPrice !== undefined || req.query.maxPrice !== undefined) {
      filter.price = {};
      if (req.query.minPrice !== undefined) {
        const min = Number(req.query.minPrice);
        if (!isNaN(min)) filter.price.$gte = min;
      }
      if (req.query.maxPrice !== undefined) {
        const max = Number(req.query.maxPrice);
        if (!isNaN(max)) filter.price.$lte = max;
      }
    }

    const isManageScope =
      req.query.scope === 'admin' ||
      req.query.manage === 'true' ||
      (req.user && req.user.role === 'admin' && req.headers.referer && req.headers.referer.includes('/admin'));

    if (isManageScope && req.user && req.user.role === 'admin') {
      if (!isDemoAdmin(req.user)) {
        const adminFilters = [];
        if (req.user._id) {
          adminFilters.push({ createdBy: req.user._id });
        }
        if (req.user.institution) {
          const instRegex = new RegExp(`^${escapeRegex(req.user.institution)}$`, 'i');
          adminFilters.push({
            $and: [
              { $or: [{ institution: instRegex }, { collegeName: instRegex }] },
              { createdBy: { $ne: null } },
            ],
          });
        }

        if (adminFilters.length > 0) {
          if (filter.$or) {
            filter.$and = (filter.$and || []).concat([{ $or: filter.$or }, { $or: adminFilters }]);
            delete filter.$or;
          } else {
            filter.$or = adminFilters;
          }
        } else {
          return res.json({
            success: true,
            count: 0,
            page: parseInt(req.query.page, 10) || 1,
            data: [],
            equipment: [],
          });
        }
      }
    }

    const limit = parseInt(req.query.limit, 10) || 100;
    const page = parseInt(req.query.page, 10) || 1;

    const [equipment, count] = await Promise.all([
      Equipment.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Equipment.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      count,
      page,
      data: equipment,
      equipment,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Get single equipment by id
 * @route   GET /api/equipment/:id
 * @access  Public
 */
const getEquipmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { equipmentId: id }] }
      : { equipmentId: id };

    const equipment = await Equipment.findOne(query);
    if (!equipment) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    return res.json({
      success: true,
      data: equipment,
      equipment,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Update equipment
 * @route   PUT /api/equipment/:id
 * @access  Private/Admin
 */
const updateEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { equipmentId: id }] }
      : { equipmentId: id };

    const item = await Equipment.findOne(query);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    const updates = { ...req.body };
    if (updates.capabilities !== undefined) updates.capabilities = ensureArray(updates.capabilities);
    if (updates.applications !== undefined) updates.applications = ensureArray(updates.applications);
    if (updates.keywords !== undefined) updates.keywords = ensureArray(updates.keywords);
    if (updates.name && !updates.equipmentName) updates.equipmentName = updates.name;
    if (updates.equipmentName && !updates.name) updates.name = updates.equipmentName;

    const updated = await Equipment.findByIdAndUpdate(item._id, updates, {
      new: true,
      runValidators: true,
    });

    return res.json({
      success: true,
      message: 'Equipment updated successfully',
      data: updated,
      equipment: updated,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Delete equipment
 * @route   DELETE /api/equipment/:id
 * @access  Private/Admin
 */
const deleteEquipment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const query = isValidObjectId(id)
      ? { $or: [{ _id: id }, { equipmentId: id }] }
      : { equipmentId: id };

    const item = await Equipment.findOne(query);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Equipment not found' });
    }

    await Equipment.findByIdAndDelete(item._id);
    await Availability.deleteMany({
      $or: [{ equipmentId: item.equipmentId }, { equipment: item._id }],
    });

    return res.json({
      success: true,
      message: `Equipment ${item.equipmentId || id} removed successfully`,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Export equipment formatted for AI models
 * @route   GET /api/equipment/export/ai-format
 * @access  Public
 */
const exportForAI = async (req, res, next) => {
  try {
    const allEquipment = await Equipment.find({});
    const formatted = allEquipment.map((item) =>
      typeof item.toAIModelFormat === 'function' ? item.toAIModelFormat() : item
    );

    return res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Sync AI Demand Predictions from CSV
 * @route   POST /api/equipment/sync-demand
 * @access  Private/Admin
 */
const syncDemandPredictions = async (req, res, next) => {
  try {
    const allEq = await Equipment.find({});
    let updatedCount = 0;

    for (const eq of allEq) {
      // 1. Query MongoDB Booking History (historical + real bookings)
      const eqBookings = await Booking.find({
        $or: [
          { equipment: eq._id },
          { equipmentId: eq.equipmentId },
          { equipmentName: eq.equipmentName || eq.name },
        ],
        status: { $in: ['Approved', 'approved', 'Completed', 'completed', 'CONFIRMED'] },
      });

      // 2. Feature Engineering
      const totalBookings = eqBookings.length;
      const weeklyAverage = totalBookings > 0 ? (totalBookings / 6) : 0;

      const weekdayCount = eqBookings.filter((b) => {
        if (!b.date) return true;
        const day = new Date(b.date).getDay();
        return day >= 1 && day <= 5;
      }).length;
      const weekdayRatio = totalBookings > 0 ? weekdayCount / totalBookings : 0.8;

      // 3. Demand Model Prediction Formula
      let predictedBookings = Number((weeklyAverage * (0.85 + 0.3 * weekdayRatio)).toFixed(1));
      if (predictedBookings === 0 && totalBookings > 0) {
        predictedBookings = Number((totalBookings * 0.5).toFixed(1));
      }

      // Default baseline for platform instruments if no bookings yet
      if (totalBookings === 0) {
        const title = (eq.equipmentName || eq.name || '').toLowerCase();
        if (title.includes('microscop') || title.includes('sem') || title.includes('gc-ms')) {
          predictedBookings = 11.5;
        } else if (title.includes('xrd') || title.includes('3d') || title.includes('zeta') || title.includes('thermal')) {
          predictedBookings = 6.2;
        } else {
          predictedBookings = 2.4;
        }
      }

      // 4. Classify Demand Level
      let demandLevel = 'LOW';
      if (predictedBookings >= 9.5) {
        demandLevel = 'HIGH';
      } else if (predictedBookings >= 4.0) {
        demandLevel = 'MEDIUM';
      } else {
        demandLevel = 'LOW';
      }

      // 5. Save Prediction in MongoDB
      eq.demandPrediction = {
        predictedBookings,
        demandLevel,
        historicalAverage: Number(weeklyAverage.toFixed(1)) || Number((predictedBookings * 0.95).toFixed(1)),
        predictionDate: new Date().toISOString().split('T')[0],
        lastSyncedAt: new Date(),
      };

      await eq.save();
      updatedCount++;
    }

    return res.json({
      success: true,
      message: `AI Demand Prediction pipeline executed. Synced ${updatedCount} equipment records from MongoDB booking history.`,
      recordsSynced: updatedCount,
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Semantic search powered by AI model or MongoDB fallback
 * @route   POST /api/equipment/ai-search
 * @access  Public
 */
const searchAISemantic = async (req, res, next) => {
  try {
    const { query, limit = 10 } = req.body;
    if (!query || !query.trim()) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const scriptPath = path.resolve(
      __dirname,
      '../../../ai-models/semantic-search/src/search_query.py'
    );

    if (fs.existsSync(scriptPath)) {
      try {
        const { stdout } = await execFilePromise('python', [scriptPath, query.trim()], {
          maxBuffer: 10 * 1024 * 1024,
          timeout: 10000,
          shell: true,
        });

        let jsonStr = '';
        if (stdout.includes('---SEARCH_RESULTS_JSON---')) {
          jsonStr = stdout.split('---SEARCH_RESULTS_JSON---')[1].trim();
        } else {
          const lastBracket = stdout.lastIndexOf(']');
          const firstBracket = stdout.indexOf('[');
          if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
            jsonStr = stdout.substring(firstBracket, lastBracket + 1);
          }
        }

        if (jsonStr) {
          const results = JSON.parse(jsonStr);
          return res.json({
            success: true,
            count: results.length,
            source: 'python-ai-mongodb',
            data: results.slice(0, parseInt(limit, 10) || 10),
          });
        }
      } catch (pyErr) {
        // Fall through to regex
      }
    }

    const searchRegex = new RegExp(query.trim(), 'i');
    const items = await Equipment.find({
      $or: [
        { name: searchRegex },
        { equipmentName: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
        { keywords: searchRegex },
        { capabilities: searchRegex },
      ],
    }).limit(parseInt(limit, 10) || 10);

    return res.json({
      success: true,
      count: items.length,
      source: 'mongodb-regex-fallback',
      data: items,
    });
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
  exportForAI,
  syncDemandPredictions,
  searchAISemantic,
};
