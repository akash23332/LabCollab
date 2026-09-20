/**
 * Phase 6 - analytics controller.
 *
 * Read-only aggregate endpoints. Authorization is enforced here (manager/owner
 * of the institution or an admin); the service only computes metrics.
 */

const analyticsService = require('../services/analyticsService');
const Equipment = require('../src/models/Equipment');
const Institution = require('../src/models/Institution');
const { isValidObjectId, canManage } = require('../src/utils/apiHelpers');

const rangeOptions = (req) => ({
  startDate: req.query.startDate,
  endDate: req.query.endDate,
});

/**
 * @desc    Utilization analytics for one piece of equipment
 * @route   GET /api/analytics/equipment/:equipmentId
 * @access  Private (equipment/institution manager, admin)
 */
const getEquipmentAnalytics = async (req, res, next) => {
  try {
    const { equipmentId } = req.params;
    if (!isValidObjectId(equipmentId)) {
      return res.status(400).json({ message: 'Invalid equipment id' });
    }

    const equipment = await Equipment.findById(equipmentId)
      .select('name createdBy institution')
      .populate('institution', 'createdBy');

    if (!equipment) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    if (!canManage(req.user, equipment, [equipment.institution?.createdBy])) {
      return res
        .status(403)
        .json({ message: 'You are not authorized to view analytics for this equipment' });
    }

    const analytics = await analyticsService.getEquipmentAnalytics(equipmentId, rangeOptions(req));
    if (!analytics) {
      return res.status(404).json({ message: 'Equipment not found' });
    }

    return res.status(200).json(analytics);
  } catch (error) {
    return next(error);
  }
};

/** Shared authorization for the institution-scoped analytics endpoints. */
const authorizeInstitution = async (req, res) => {
  const { institutionId } = req.params;
  if (!isValidObjectId(institutionId)) {
    res.status(400).json({ message: 'Invalid institution id' });
    return null;
  }

  const institution = await Institution.findById(institutionId);
  if (!institution) {
    res.status(404).json({ message: 'Institution not found' });
    return null;
  }

  if (!canManage(req.user, institution)) {
    res.status(403).json({ message: 'You are not authorized to view analytics for this institution' });
    return null;
  }

  return institution;
};

/**
 * @desc    Aggregate analytics for an institution
 * @route   GET /api/analytics/institution/:institutionId
 * @access  Private (institution manager/owner, admin)
 */
const getInstitutionAnalytics = async (req, res, next) => {
  try {
    const institution = await authorizeInstitution(req, res);
    if (!institution) return undefined;

    const analytics = await analyticsService.getInstitutionAnalytics(
      institution._id,
      rangeOptions(req)
    );
    if (!analytics) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    return res.status(200).json(analytics);
  } catch (error) {
    return next(error);
  }
};

/**
 * @desc    Institution dashboard payload (aggregates + live counters)
 * @route   GET /api/analytics/institution/:institutionId/summary
 * @access  Private (institution manager/owner, admin)
 */
const getInstitutionSummary = async (req, res, next) => {
  try {
    const institution = await authorizeInstitution(req, res);
    if (!institution) return undefined;

    const summary = await analyticsService.getInstitutionSummary(institution._id, rangeOptions(req));
    if (!summary) {
      return res.status(404).json({ message: 'Institution not found' });
    }

    return res.status(200).json(summary);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getEquipmentAnalytics,
  getInstitutionAnalytics,
  getInstitutionSummary,
};
