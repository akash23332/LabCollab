const Institution = require('../models/Institution');
const {
  exactInsensitive,
  isValidObjectId,
  parseBoolean,
  parseLimit,
  parsePage,
  canManage,
} = require('../utils/apiHelpers');

// Fields an institution owner may edit. `createdBy` and `isVerified` are never
// accepted from the client - isVerified only changes through the admin endpoint.
const EDITABLE_FIELDS = [
  'name',
  'type',
  'description',
  'email',
  'phone',
  'address',
  'city',
  'state',
  'country',
  'location',
];

const CREATOR_FIELDS = 'name role';

const buildUpdate = (body = {}) => {
  const update = {};
  EDITABLE_FIELDS.forEach((field) => {
    if (body[field] !== undefined) update[field] = body[field];
  });
  return update;
};

/**
 * POST /api/institutions  (protect)
 */
const createInstitution = async (req, res, next) => {
  try {
    const { name, type } = req.body || {};

    if (!name) return res.status(400).json({ message: 'name is required' });
    if (!type) return res.status(400).json({ message: 'type is required' });

    const institution = await Institution.create({
      ...buildUpdate(req.body),
      // Ownership always comes from the verified token, never the request body.
      createdBy: req.user._id,
      isVerified: false,
    });

    return res.status(201).json({ institution });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/institutions  (public, optionalAuth)
 * Non-admins only ever see verified institutions; admins may include or filter
 * unverified ones with ?isVerified= / ?includeUnverified=true.
 */
const getInstitutions = async (req, res, next) => {
  try {
    const { city, state, type } = req.query;
    const filter = {};

    if (city) filter.city = exactInsensitive(city);
    if (state) filter.state = exactInsensitive(state);
    if (type) filter.type = type;

    const isAdmin = req.user?.role === 'admin';
    const isVerifiedFilter = parseBoolean(req.query.isVerified, 'isVerified');
    const includeUnverified = parseBoolean(req.query.includeUnverified, 'includeUnverified');

    if (isAdmin) {
      if (isVerifiedFilter !== undefined) filter.isVerified = isVerifiedFilter;
      else if (includeUnverified !== true) filter.isVerified = true;
    } else {
      filter.isVerified = true;
    }

    const limit = parseLimit(req.query.limit);
    const page = parsePage(req.query.page);

    const [institutions, count] = await Promise.all([
      Institution.find(filter)
        .populate('createdBy', CREATOR_FIELDS)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Institution.countDocuments(filter),
    ]);

    return res.json({ count, page, institutions });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/institutions/:id  (public, optionalAuth)
 * Unverified institutions are only visible to their creator and to admins.
 */
const getInstitutionById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid institution id' });
    }

    const institution = await Institution.findById(id).populate('createdBy', CREATOR_FIELDS);

    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    if (!institution.isVerified && !canManage(req.user, institution)) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    return res.json({ institution });
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/institutions/:id  (protect)
 * Creator or admin only.
 */
const updateInstitution = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid institution id' });
    }

    const institution = await Institution.findById(id);

    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    if (!canManage(req.user, institution)) {
      return res.status(403).json({ message: 'You are not allowed to modify this institution' });
    }

    Object.assign(institution, buildUpdate(req.body || {}));
    await institution.save();

    return res.json({ institution });
  } catch (error) {
    return next(error);
  }
};

/**
 * PATCH /api/institutions/:id/verify  (protect + adminOnly)
 */
const verifyInstitution = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid institution id' });
    }

    const institution = await Institution.findById(id);

    if (!institution) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    institution.isVerified = true;
    await institution.save();

    return res.json({ message: 'Institution verified', institution });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createInstitution,
  getInstitutions,
  getInstitutionById,
  updateInstitution,
  verifyInstitution,
};
