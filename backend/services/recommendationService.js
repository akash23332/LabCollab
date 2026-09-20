/**
 * Phase 4 - deterministic recommendation engine.
 *
 * Responsibilities:
 *   1. retrieve *eligible* candidates from the Equipment collection
 *      (verified + available + linked to an institution)
 *   2. validate the requested window against the Availability and Booking
 *      collections (the AI never decides availability)
 *   3. score and rank the survivors
 *
 * The backend/database stays the source of truth: nothing in this module
 * writes to any collection and no provider-supplied value can override a
 * booking rule.
 */

const Equipment = require('../src/models/Equipment');
const Institution = require('../src/models/Institution');
const Availability = require('../src/models/Availability');
const { toUTCDay, escapeRegex, exactInsensitive, httpError } = require('../src/utils/apiHelpers');
// Phase 3's conflict rule is reused verbatim (startA < endB && endA > startB)
// instead of being re-implemented here.
const { findConflictingBooking } = require('../controllers/bookingController');
const { EQUIPMENT_TYPES } = require('./aiService');

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 10;

/** Upper bound on the equipment rows examined in one request. */
const CANDIDATE_POOL_LIMIT = 60;

/** Only these statuses block a time window (mirrors Phase 3). */
const ACTIVE_BOOKING_STATUSES = ['pending', 'approved'];

/** Distance (km) at which the location factor decays to 0. */
const DISTANCE_DECAY_KM = 100;

/**
 * Scoring weights. These are implementation parameters (tunable), not business
 * claims about the user, and `score` is a deterministic match score - not a
 * model confidence value.
 */
const WEIGHTS = {
  equipmentMatch: 0.35,
  categoryMatch: 0.15,
  availability: 0.2,
  price: 0.1,
  distance: 0.1,
  verification: 0.05,
  qualificationCompatibility: 0.05,
};

/** Value used when a factor cannot be evaluated for a candidate. */
const NEUTRAL = 0.5;

const round = (value, decimals = 2) => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};

const clamp01 = (value) => Math.min(Math.max(value, 0), 1);

const formatAmount = (value) => `₹${String(round(value, 2)).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;

const resolveLimit = (value) => {
  if (value === undefined || value === null || value === '') return DEFAULT_LIMIT;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) throw httpError(400, 'limit must be a positive number');
  // Capped rather than rejected: the client can never ask for an unbounded page.
  return Math.min(Math.floor(parsed), MAX_LIMIT);
};

// ---------------------------------------------------------------------------
// Distance
// ---------------------------------------------------------------------------

/** Accepts a document (with a `location` subdocument) or a plain coordinate pair. */
const coordinatesOf = (entity) => {
  if (!entity) return null;
  const latitude = entity.latitude ?? entity.location?.latitude;
  const longitude = entity.longitude ?? entity.location?.longitude;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { latitude, longitude };
};

/** Great-circle distance in km, or null when coordinates are unavailable. */
const haversineDistanceKm = (from, to) => {
  const start = coordinatesOf(from);
  const end = coordinatesOf(to);
  if (!start || !end) return null;

  const EARTH_RADIUS_KM = 6371;
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const deltaLat = toRadians(end.latitude - start.latitude);
  const deltaLon = toRadians(end.longitude - start.longitude);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(toRadians(start.latitude)) * Math.cos(toRadians(end.latitude)) * Math.sin(deltaLon / 2) ** 2;

  return round(2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(a))), 1);
};

// ---------------------------------------------------------------------------
// Candidate retrieval
// ---------------------------------------------------------------------------

/** Search terms used to pre-filter equipment inside MongoDB. */
const searchTerms = (requirement) => {
  const terms = [];

  const push = (value) => {
    if (!value) return;
    const term = String(value).trim().toLowerCase();
    if (term && !terms.includes(term)) terms.push(term);
  };

  if (requirement.aliases?.length) requirement.aliases.forEach(push);

  if (requirement.equipmentType) {
    const lower = String(requirement.equipmentType).toLowerCase();
    push(lower);
    const entry = EQUIPMENT_TYPES.find((type) => type.key.toLowerCase() === lower);
    if (entry) entry.aliases.forEach(push);
  }

  // A category alone is a valid, precise enough filter ("microscopy").
  if (!terms.length && requirement.category) push(requirement.category);

  // Last resort: use the leftover meaningful words of the query.
  if (!terms.length && requirement.keywords?.length) requirement.keywords.slice(0, 6).forEach(push);

  return terms.slice(0, 12);
};

const textClauses = (terms) =>
  terms.map((term) => {
    const regex = new RegExp(escapeRegex(term), 'i');
    return {
      $or: [
        { name: regex },
        { category: regex },
        { description: regex },
        { manufacturer: regex },
        { model: regex },
      ],
    };
  });

/**
 * Equipment that satisfies the backend's safety/business constraints:
 * verified, currently available, and attached to an existing institution.
 * Location scoping stays in MongoDB (same approach as the marketplace search).
 */
const findCandidateEquipment = async ({ requirement, userContext }) => {
  const filter = {
    isVerified: true,
    status: 'available',
    institution: { $ne: null },
  };

  const and = [];

  const terms = searchTerms(requirement);
  if (terms.length) and.push({ $or: textClauses(terms) });

  const locationClauses = [];
  const institutionOr = [];
  if (requirement.city) {
    locationClauses.push({ 'location.city': exactInsensitive(requirement.city) });
    institutionOr.push({ city: exactInsensitive(requirement.city) });
  }
  if (requirement.state) {
    locationClauses.push({ 'location.state': exactInsensitive(requirement.state) });
    institutionOr.push({ state: exactInsensitive(requirement.state) });
  }
  if (institutionOr.length) {
    const institutionIds = await Institution.find({ $or: institutionOr }).distinct('_id');
    // Equipment may inherit its city/state from the parent institution.
    if (institutionIds.length) locationClauses.push({ institution: { $in: institutionIds } });
    and.push({ $or: locationClauses });
  }

  if (and.length) filter.$and = and;

  const equipment = await Equipment.find(filter)
    .populate('institution', 'name type city state country location isVerified')
    .sort({ createdAt: -1 })
    .limit(CANDIDATE_POOL_LIMIT)
    .lean();

  // A dangling institution reference is not a valid candidate.
  return equipment.filter((item) => item.institution && item.institution._id);
};

// ---------------------------------------------------------------------------
// Availability validation (Availability + Booking collections)
// ---------------------------------------------------------------------------

/**
 * Checks the requested window against the existing Availability slots and the
 * active bookings. Returns facts only - it never mutates anything.
 *
 * availability.available is:
 *   true  -> validated against the backend for the requested window
 *   false -> the window is not usable (candidate is dropped by the caller)
 *   null  -> nothing was requested that can be validated (no date)
 */
const evaluateAvailability = async (equipmentId, requirement) => {
  const { date, startTime, endTime } = requirement;

  if (!date) {
    return {
      available: null,
      checked: false,
      code: 'no_date',
      date: null,
      startTime: null,
      endTime: null,
      reason: 'No date was given, so availability could not be validated.',
    };
  }

  const day = toUTCDay(date);

  const slotQuery = { equipment: equipmentId, date: day, isAvailable: true };
  if (startTime && endTime) {
    // The whole requested window must be covered by one slot.
    slotQuery.startTime = { $lte: startTime };
    slotQuery.endTime = { $gte: endTime };
  }

  const slot = await Availability.findOne(slotQuery).sort({ startTime: 1 }).lean();

  if (!slot) {
    return {
      available: false,
      checked: true,
      code: 'no_slot',
      date,
      startTime: startTime || null,
      endTime: endTime || null,
      reason: startTime && endTime
        ? 'Equipment has no availability slot covering the requested time.'
        : 'Equipment has no available slot on the requested date.',
    };
  }

  if (startTime && endTime) {
    const conflict = await findConflictingBooking({
      equipmentId,
      date: day,
      startTime,
      endTime,
      statuses: ACTIVE_BOOKING_STATUSES,
    });

    if (conflict) {
      return {
        available: false,
        checked: true,
        code: 'booked',
        date,
        startTime,
        endTime,
        reason: 'Equipment is already booked for the requested time.',
      };
    }
  }

  return {
    available: true,
    checked: true,
    code: 'ok',
    date,
    startTime: startTime || null,
    endTime: endTime || null,
    slot: { startTime: slot.startTime, endTime: slot.endTime },
    reason: null,
  };
};

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

/** 1 -> name hit, 0.8 -> manufacturer/model, 0.6 -> description, 0.2 -> loose. */
const equipmentMatchFactor = (candidate, requirement) => {
  const terms = searchTerms(requirement);
  if (!terms.length) return { value: null, matchedTerm: null };

  const equipment = candidate.equipment;
  const name = (equipment.name || '').toLowerCase();
  const category = (equipment.category || '').toLowerCase();
  const description = (equipment.description || '').toLowerCase();
  const manufacturer = (equipment.manufacturer || '').toLowerCase();
  const model = (equipment.model || '').toLowerCase();
  const specifications = JSON.stringify(equipment.specifications || {}).toLowerCase();

  const includes = (haystack, term) => haystack.includes(term);
  const find = (haystack) => terms.find((term) => includes(haystack, term)) || null;

  const nameTerm = find(name);
  if (nameTerm) return { value: 1, matchedTerm: nameTerm };

  const categoryTerm = find(category);
  if (categoryTerm) return { value: 0.9, matchedTerm: categoryTerm };

  const manufacturerTerm = find(manufacturer) || find(model);
  if (manufacturerTerm) return { value: 0.8, matchedTerm: manufacturerTerm };

  const descriptionTerm = find(description) || find(specifications);
  if (descriptionTerm) return { value: 0.6, matchedTerm: descriptionTerm };

  return { value: 0.2, matchedTerm: null };
};

const userRequirementHits = (candidate, userContext) => {
  const wanted = (userContext?.requirements || []).filter(isNonEmptyString).map((item) => item.toLowerCase());
  if (!wanted.length) return [];

  const equipment = candidate.equipment;
  const haystack = [equipment.name, equipment.category, equipment.description, equipment.manufacturer]
    .filter(isNonEmptyString)
    .join(' ')
    .toLowerCase();

  return wanted.filter((item) => haystack.includes(item) || item.includes((equipment.category || '').toLowerCase()));
};

const categoryMatchFactor = (candidate, userContext, requirement) => {
  const equipmentCategory = (candidate.equipment.category || '').toLowerCase();
  const wanted = (requirement.category || '').toLowerCase();

  if (wanted) {
    if (equipmentCategory === wanted) return { value: 1, reason: 'category_exact' };
    if (equipmentCategory && (equipmentCategory.includes(wanted) || wanted.includes(equipmentCategory))) {
      return { value: 0.85, reason: 'category_partial' };
    }
    return { value: 0.2, reason: 'category_mismatch' };
  }

  const hits = userRequirementHits(candidate, userContext);
  if (hits.length) return { value: 0.75, reason: 'user_requirement' };
  if (!(userContext?.requirements || []).length) return { value: null, reason: 'unknown' };
  return { value: 0.4, reason: 'no_user_requirement_hit' };
};

const priceFactor = (candidate, requirement) => {
  const { maxPricePerHour, maxTotalPrice, duration } = requirement;
  if (maxPricePerHour === null && maxTotalPrice === null) {
    return { value: null, withinBudget: null };
  }

  const pricePerHour = candidate.equipment.pricePerHour;
  let cost = pricePerHour;
  let budget = maxPricePerHour;

  if (budget === null) {
    budget = maxTotalPrice;
    cost = duration ? round(duration * pricePerHour, 2) : pricePerHour;
  }

  const withinBudget = cost <= budget;
  return { value: withinBudget ? 1 : 0, withinBudget };
};

const locationFactor = (candidate, requirement, userContext) => {
  if (candidate.distanceKm !== null && candidate.distanceKm !== undefined) {
    return { value: clamp01(1 - candidate.distanceKm / DISTANCE_DECAY_KM), kind: 'distance' };
  }

  // No coordinates on one of the two sides: fall back to city/state text.
  const wantedCity = (requirement.city || userContext?.location?.city || '').toLowerCase();
  const wantedState = (requirement.state || userContext?.location?.state || '').toLowerCase();
  const city = (candidate.equipment.location?.city || candidate.institution?.city || '').toLowerCase();
  const state = (candidate.equipment.location?.state || candidate.institution?.state || '').toLowerCase();

  if (wantedCity && city && wantedCity === city) return { value: 1, kind: 'city' };
  if (wantedState && state && wantedState === state) return { value: 0.7, kind: 'state' };
  if (!wantedCity && !wantedState) return { value: null, kind: 'unknown' };
  return { value: 0.2, kind: 'other' };
};

const verificationFactor = (candidate) => {
  const equipmentVerified = candidate.equipment.isVerified ? 1 : 0;
  const institutionVerified = candidate.institution?.isVerified ? 1 : 0;
  return { value: 0.6 * equipmentVerified + 0.4 * institutionVerified };
};

/**
 * Training/certification is a *fact* about the equipment. The User model stores
 * no verified credentials, so the user's side of the comparison is unknown:
 *   - equipment that needs nothing: 1
 *   - the user explicitly asked for "no training"/"no certification" but the
 *     equipment needs it: 0 (a real conflict with the stated request)
 *   - otherwise: neutral, and flagged with qualificationCheckRequired
 */
const qualificationFactor = (candidate, requirement) => {
  const equipment = candidate.equipment;
  const trainingRequired = Boolean(equipment.trainingRequired);
  const certificationRequired = Boolean(equipment.certificationRequired);
  const needsCredentials = trainingRequired || certificationRequired;

  if (!needsCredentials) return { value: 1, needsCredentials: false, conflict: false };

  const conflict =
    (trainingRequired && requirement.trainingRequired === false) ||
    (certificationRequired && requirement.certificationRequired === false);

  return { value: conflict ? 0 : NEUTRAL, needsCredentials: true, conflict };
};

const availabilityFactor = (candidate) => {
  if (candidate.availability?.available === true) return { value: 1 };
  if (candidate.availability?.available === false) return { value: 0 };
  return { value: NEUTRAL };
};

/**
 * Deterministic internal score (0-100) plus the factor breakdown behind it.
 * Factors that cannot be evaluated contribute a neutral NEUTRAL value.
 *
 * @returns {{score: number, breakdown: object, matchReasons: string[], withinBudget: boolean|null}}
 */
const explainRecommendationScore = (candidate, requirement, userContext = {}) => {
  const equipmentMatch = equipmentMatchFactor(candidate, requirement);
  const categoryMatch = categoryMatchFactor(candidate, userContext, requirement);
  const availability = availabilityFactor(candidate);
  const price = priceFactor(candidate, requirement);
  const location = locationFactor(candidate, requirement, userContext);
  const verification = verificationFactor(candidate);
  const qualification = qualificationFactor(candidate, requirement);

  const factors = [
    ['equipmentMatch', WEIGHTS.equipmentMatch, equipmentMatch.value],
    ['categoryMatch', WEIGHTS.categoryMatch, categoryMatch.value],
    ['availability', WEIGHTS.availability, availability.value],
    ['price', WEIGHTS.price, price.value],
    ['distance', WEIGHTS.distance, location.value],
    ['verification', WEIGHTS.verification, verification.value],
    ['qualificationCompatibility', WEIGHTS.qualificationCompatibility, qualification.value],
  ];

  const breakdown = {};
  let weighted = 0;
  factors.forEach(([name, weight, value]) => {
    const effective = value === null || value === undefined ? NEUTRAL : clamp01(value);
    breakdown[name] = round(effective, 2);
    weighted += weight * effective;
  });

  const score = Math.round(weighted * 100);

  const matchReasons = [];
  if (equipmentMatch.value !== null && equipmentMatch.value >= 0.6 && equipmentMatch.matchedTerm) {
    matchReasons.push(`Matches "${equipmentMatch.matchedTerm}"`);
  }
  if (categoryMatch.reason === 'category_exact') {
    matchReasons.push(`Same category as your request (${candidate.equipment.category})`);
  } else if (categoryMatch.reason === 'user_requirement') {
    matchReasons.push('Matches your saved profile requirements');
  }
  if (candidate.availability?.available === true) {
    matchReasons.push(
      candidate.availability.startTime && candidate.availability.endTime
        ? `Available ${candidate.availability.startTime}-${candidate.availability.endTime} on ${candidate.availability.date}`
        : `Has free slots on ${candidate.availability.date}`
    );
  } else if (candidate.availability?.available === null) {
    matchReasons.push('Availability not validated (no date in the request)');
  }
  if (price.withinBudget === true) matchReasons.push('Within your stated budget');
  if (price.withinBudget === false) matchReasons.push('Above your stated budget');
  if (candidate.distanceKm !== null && candidate.distanceKm !== undefined) {
    matchReasons.push(`${candidate.distanceKm} km from your location`);
  }
  if (candidate.institution?.isVerified) matchReasons.push('Institution is verified');
  else matchReasons.push('Institution is not verified yet');
  if (candidate.equipment.trainingRequired) {
    matchReasons.push(
      qualification.conflict ? 'Requires training, which you asked to avoid' : 'Training required'
    );
  }
  if (candidate.equipment.certificationRequired) {
    matchReasons.push(
      qualification.conflict ? 'Requires certification, which you asked to avoid' : 'Certification required'
    );
  }

  return { score, breakdown, matchReasons, withinBudget: price.withinBudget ?? null };
};

/** Numeric score only (the interface the ranking uses). */
const calculateRecommendationScore = (candidate, requirement, userContext) =>
  explainRecommendationScore(candidate, requirement, userContext).score;

/** Highest score first; ties break on distance, then price, then name. */
const rankRecommendations = (candidates, limit = DEFAULT_LIMIT) =>
  [...candidates]
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const distanceA = a.distanceKm === null || a.distanceKm === undefined ? Number.POSITIVE_INFINITY : a.distanceKm;
      const distanceB = b.distanceKm === null || b.distanceKm === undefined ? Number.POSITIVE_INFINITY : b.distanceKm;
      if (distanceA !== distanceB) return distanceA - distanceB;
      if (a.equipment.pricePerHour !== b.equipment.pricePerHour) {
        return a.equipment.pricePerHour - b.equipment.pricePerHour;
      }
      return String(a.equipment.name).localeCompare(String(b.equipment.name));
    })
    .slice(0, limit);

// ---------------------------------------------------------------------------
// Assembly
// ---------------------------------------------------------------------------

const buildRecommendation = ({ equipment, requirement, userContext, availability }) => {
  const institution = equipment.institution || null;
  const distanceKm = haversineDistanceKm(coordinatesOf(userContext), coordinatesOf(equipment) || coordinatesOf(institution));
  const duration = requirement.duration;
  const estimatedCost = duration ? round(duration * equipment.pricePerHour, 2) : null;

  const candidate = { equipment, institution, distanceKm, availability, estimatedCost };
  const { score, breakdown, matchReasons, withinBudget } = explainRecommendationScore(candidate, requirement, userContext);

  const trainingRequired = Boolean(equipment.trainingRequired);
  const certificationRequired = Boolean(equipment.certificationRequired);

  const notes = [];
  if (trainingRequired) notes.push('Training is required before using this equipment.');
  if (certificationRequired) notes.push('Certification is required before using this equipment.');
  if (availability.available === null) {
    notes.push('No date/time was specified, so availability was not validated.');
  }

  return {
    equipment: {
      _id: String(equipment._id),
      name: equipment.name,
      category: equipment.category,
      description: equipment.description || '',
      manufacturer: equipment.manufacturer || '',
      model: equipment.model || '',
      pricePerHour: equipment.pricePerHour,
      location: {
        building: equipment.location?.building || null,
        room: equipment.location?.room || null,
        city: equipment.location?.city || institution?.city || null,
        state: equipment.location?.state || institution?.state || null,
      },
      trainingRequired,
      certificationRequired,
      isVerified: Boolean(equipment.isVerified),
      status: equipment.status,
    },
    institution: institution
      ? {
          _id: String(institution._id),
          name: institution.name,
          city: institution.city || null,
          state: institution.state || null,
          isVerified: Boolean(institution.isVerified),
        }
      : null,
    distanceKm,
    availability,
    trainingRequired,
    certificationRequired,
    // The User model holds no verified training/certification records, so
    // eligibility is never assumed - the user must confirm it.
    qualificationCheckRequired: trainingRequired || certificationRequired,
    estimatedCost,
    withinBudget,
    score,
    scoreBreakdown: breakdown,
    matchReasons,
    notes,
  };
};

const buildEmptyMessage = (requirement, stats) => {
  const label = requirement.equipmentType || requirement.category || 'your request';
  const parts = [];
  if (stats.excluded.timeWindowUnavailable) {
    parts.push(`${stats.excluded.timeWindowUnavailable} had no availability for that time`);
  }
  if (stats.excluded.conflictingBooking) {
    parts.push(`${stats.excluded.conflictingBooking} were already booked`);
  }
  if (stats.excluded.noAvailabilityOnDate) {
    parts.push(`${stats.excluded.noAvailabilityOnDate} had no slots that day`);
  }

  let message = `No verified, available equipment matched ${label}`;
  if (requirement.city) message += ` in ${requirement.city}`;
  if (requirement.state && !requirement.city) message += ` in ${requirement.state}`;
  if (requirement.date) message += ` on ${requirement.date}`;
  message += '.';

  if (parts.length) message += ` ${parts.join(', ')}.`;
  message += ' Try a different date, time window or a broader description.';

  return message;
};

/**
 * Full pipeline: retrieve -> validate availability/bookings -> score -> rank.
 * Read-only; nothing is persisted.
 */
const recommendEquipment = async ({ requirement, userContext = {}, limit = DEFAULT_LIMIT }) => {
  const candidates = await findCandidateEquipment({ requirement, userContext });

  const stats = {
    candidatePoolSize: candidates.length,
    considered: 0,
    excluded: {
      noAvailabilityOnDate: 0,
      timeWindowUnavailable: 0,
      conflictingBooking: 0,
    },
    returned: 0,
  };

  // One query tells us which equipment has *any* free slot that day, so the
  // per-candidate window check only runs for plausible candidates.
  let equipmentWithSlots = null;
  if (requirement.date) {
    const ids = await Availability.distinct('equipment', {
      date: toUTCDay(requirement.date),
      isAvailable: true,
    });
    equipmentWithSlots = new Set(ids.map(String));
  }

  const scored = [];

  for (const equipment of candidates) {
    if (equipmentWithSlots && !equipmentWithSlots.has(String(equipment._id))) {
      stats.excluded.noAvailabilityOnDate += 1;
      continue;
    }

    const availability = await evaluateAvailability(equipment._id, requirement);

    if (availability.available === false) {
      if (availability.code === 'booked') stats.excluded.conflictingBooking += 1;
      else stats.excluded.timeWindowUnavailable += 1;
      continue;
    }

    stats.considered += 1;
    scored.push(buildRecommendation({ equipment, requirement, userContext, availability }));
  }

  const recommendations = rankRecommendations(scored, limit);
  stats.returned = recommendations.length;

  return {
    recommendations,
    stats,
    message: recommendations.length ? null : buildEmptyMessage(requirement, stats),
  };
};

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  CANDIDATE_POOL_LIMIT,
  ACTIVE_BOOKING_STATUSES,
  WEIGHTS,
  resolveLimit,
  haversineDistanceKm,
  searchTerms,
  findCandidateEquipment,
  evaluateAvailability,
  calculateRecommendationScore,
  explainRecommendationScore,
  rankRecommendations,
  recommendEquipment,
};
