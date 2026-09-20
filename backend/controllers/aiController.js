/**
 * Phase 4 - AI recommendation controller.
 *
 * POST /api/ai/recommend is strictly READ-ONLY: it parses a natural-language
 * requirement, validates candidates against the backend's own availability /
 * booking rules and returns a ranked list. It never writes to any collection,
 * and the requesting user always comes from `req.user` (the JWT), never from
 * the request body.
 */

const aiService = require('../services/aiService');
const recommendationService = require('../services/recommendationService');

/**
 * The only user data the parser/ranker (or a future external model) may see.
 * No password, no email, no internal fields.
 */
const buildUserContext = (user) => ({
  userId: String(user._id),
  role: user.role || 'student',
  institution: user.institution || '',
  isVerified: Boolean(user.isVerified),
  requirements: Array.isArray(user.requirements) ? user.requirements.slice(0, 20) : [],
  location: {
    city: user.location?.city || '',
    state: user.location?.state || '',
    latitude: typeof user.location?.latitude === 'number' ? user.location.latitude : null,
    longitude: typeof user.location?.longitude === 'number' ? user.location.longitude : null,
  },
});

const validateQuery = (value) => {
  if (value === undefined || value === null) return { error: 'query is required' };
  if (typeof value !== 'string') return { error: 'query must be a string' };
  const query = value.trim();
  if (!query) return { error: 'query cannot be empty' };
  if (query.length < 2) return { error: 'query is too short' };
  if (query.length > aiService.MAX_QUERY_LENGTH) {
    return { error: `query must be at most ${aiService.MAX_QUERY_LENGTH} characters` };
  }
  return { query };
};

/**
 * POST /api/ai/recommend  (protect)
 * body: { query: string, limit?: number }
 */
const recommendEquipment = async (req, res, next) => {
  try {
    const body = req.body || {};

    const { query, error } = validateQuery(body.query);
    if (error) return res.status(400).json({ message: error });

    let limit;
    try {
      limit = recommendationService.resolveLimit(body.limit);
    } catch (limitError) {
      return res.status(400).json({ message: limitError.message });
    }

    // Only the authenticated user's id is trusted; `userId`/`institutionId` in
    // the body are ignored on purpose.
    const user = req.user;
    if (!user || !user._id) {
      return res.status(404).json({ message: 'Authenticated user record is unavailable' });
    }

    const userContext = buildUserContext(user);

    // 1. Parse the free-text requirement (external model when configured,
    //    deterministic fallback otherwise - this never throws).
    const { requirement, source, warning } = await aiService.parseRequirement(query, userContext);

    // 2. Retrieve + validate + rank against the database (source of truth).
    const { recommendations, stats, message } = await recommendationService.recommendEquipment({
      requirement,
      userContext,
      limit,
    });

    return res.status(200).json({
      success: true,
      source,
      parsedRequirement: aiService.toPublicRequirement(requirement),
      count: recommendations.length,
      limit,
      stats,
      recommendations,
      ...(message ? { message } : {}),
      ...(warning ? { warnings: [warning] } : {}),
    });
  } catch (error) {
    return next(error);
  }
};

/**
 * GET /api/ai/status  (protect)
 * Tells the frontend which mode the recommendation engine is running in.
 * Never exposes the model URL or any key.
 */
const getRecommendationStatus = async (req, res, next) => {
  try {
    const { provider, externalConfigured, timeoutMs } = aiService.getProviderConfig();

    return res.status(200).json({
      success: true,
      mode: provider === 'external' && externalConfigured ? 'ai_model' : 'fallback',
      provider,
      externalConfigured,
      timeoutMs,
      defaultLimit: recommendationService.DEFAULT_LIMIT,
      maxLimit: recommendationService.MAX_LIMIT,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  recommendEquipment,
  getRecommendationStatus,
};
