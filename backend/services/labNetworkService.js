const Institution = require('../src/models/Institution');
const Equipment = require('../src/models/Equipment');
const Availability = require('../src/models/Availability');
const Booking = require('../models/Booking');
const { toUTCDay, escapeRegex } = require('../src/utils/apiHelpers');

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in kilometers rounded to 1 decimal place, or null if coordinates are missing.
 */
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  if (
    lat1 === null ||
    lat1 === undefined ||
    lon1 === null ||
    lon1 === undefined ||
    lat2 === null ||
    lat2 === undefined ||
    lon2 === null ||
    lon2 === undefined
  ) {
    return null;
  }

  const nLat1 = Number(lat1);
  const nLon1 = Number(lon1);
  const nLat2 = Number(lat2);
  const nLon2 = Number(lon2);

  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) {
    return null;
  }

  const R = 6371; // Earth's mean radius in kilometers
  const dLat = ((nLat2 - nLat1) * Math.PI) / 180;
  const dLon = ((nLon2 - nLon1) * Math.PI) / 180;
  const rLat1 = (nLat1 * Math.PI) / 180;
  const rLat2 = (nLat2 * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(rLat1) * Math.cos(rLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10;
};

/**
 * Check equipment availability, optionally evaluating specific date/time window
 */
const checkEquipmentAvailability = async (equipment, date, startTime, endTime) => {
  // If equipment is in maintenance, booked, or offline, it is not available
  if (equipment.status !== 'available') {
    return false;
  }

  // If no date/time was specified in the query, availability follows status
  if (!date || !startTime || !endTime) {
    return equipment.status === 'available';
  }

  const normalizedDate = toUTCDay(date);

  // 1. Check if an active availability slot covers the requested window
  const slot = await Availability.findOne({
    equipment: equipment._id,
    date: normalizedDate,
    isAvailable: true,
    startTime: { $lte: startTime },
    endTime: { $gte: endTime },
  });

  if (!slot) {
    return false;
  }

  // 2. Check if any active booking conflicts with the requested window
  const conflict = await Booking.findOne({
    equipment: equipment._id,
    date: normalizedDate,
    status: { $in: ['pending', 'approved'] },
    startTime: { $lt: endTime },
    endTime: { $gt: startTime },
  });

  if (conflict) {
    return false;
  }

  return true;
};

/**
 * Find nearby verified institutions hosting matching equipment
 */
const findNearbyLabs = async ({
  originLat,
  originLng,
  radiusKm = 50,
  equipmentQuery,
  category,
  city,
  state,
  minPrice,
  maxPrice,
  trainingRequired,
  certificationRequired,
  availableOnly,
  date,
  startTime,
  endTime,
  limit = 20,
}) => {
  // 1. Build Institution query (only verified institutions by default)
  const instQuery = { isVerified: true };
  if (city) {
    instQuery.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
  }
  if (state) {
    instQuery.state = new RegExp(`^${escapeRegex(state)}$`, 'i');
  }

  const institutions = await Institution.find(instQuery).lean();

  // 2. Calculate distances and filter by radius
  const candidateInstitutions = [];
  for (const inst of institutions) {
    const instLat = inst.location?.latitude;
    const instLng = inst.location?.longitude;

    const distanceKm = calculateHaversineDistance(originLat, originLng, instLat, instLng);

    // Keep if within radius, or if coordinates are missing and no strict radius rejection is requested
    if (distanceKm !== null) {
      if (distanceKm <= radiusKm) {
        candidateInstitutions.push({ ...inst, distanceKm });
      }
    } else {
      // Missing coordinates: distance is null
      candidateInstitutions.push({ ...inst, distanceKm: null });
    }
  }

  if (candidateInstitutions.length === 0) {
    return [];
  }

  const candidateInstIds = candidateInstitutions.map((inst) => inst._id);

  // 3. Build Equipment query (only verified equipment)
  const equipQuery = {
    institution: { $in: candidateInstIds },
    isVerified: true,
  };

  if (category) {
    equipQuery.category = new RegExp(`^${escapeRegex(category)}$`, 'i');
  }

  if (minPrice !== undefined || maxPrice !== undefined) {
    equipQuery.pricePerHour = {};
    if (minPrice !== undefined) equipQuery.pricePerHour.$gte = Number(minPrice);
    if (maxPrice !== undefined) equipQuery.pricePerHour.$lte = Number(maxPrice);
  }

  if (trainingRequired !== undefined) {
    equipQuery.trainingRequired = trainingRequired;
  }

  if (certificationRequired !== undefined) {
    equipQuery.certificationRequired = certificationRequired;
  }

  if (availableOnly) {
    equipQuery.status = 'available';
  }

  if (equipmentQuery) {
    const regex = new RegExp(escapeRegex(equipmentQuery), 'i');
    equipQuery.$or = [
      { name: regex },
      { category: regex },
      { description: regex },
      { manufacturer: regex },
      { model: regex },
    ];
  }

  const allEquipments = await Equipment.find(equipQuery).lean();

  // 4. Check availability for each matching equipment item
  const equipmentsByInstitution = new Map();

  for (const eq of allEquipments) {
    const isAvailable = await checkEquipmentAvailability(eq, date, startTime, endTime);

    const formattedEq = {
      _id: eq._id,
      name: eq.name,
      category: eq.category,
      pricePerHour: eq.pricePerHour,
      status: eq.status,
      isVerified: eq.isVerified,
      trainingRequired: eq.trainingRequired || false,
      certificationRequired: eq.certificationRequired || false,
      availability: isAvailable,
    };

    const instIdStr = String(eq.institution);
    if (!equipmentsByInstitution.has(instIdStr)) {
      equipmentsByInstitution.set(instIdStr, []);
    }
    equipmentsByInstitution.get(instIdStr).push(formattedEq);
  }

  // 5. Assemble labs
  const hasEquipmentFilter = !!(equipmentQuery || category || minPrice !== undefined || maxPrice !== undefined || availableOnly);

  const labs = [];
  for (const inst of candidateInstitutions) {
    const instIdStr = String(inst._id);
    const matchingEq = equipmentsByInstitution.get(instIdStr) || [];

    // If an equipment search was performed, only return institutions that have matching equipment
    if (hasEquipmentFilter && matchingEq.length === 0) {
      continue;
    }

    labs.push({
      institution: {
        _id: inst._id,
        name: inst.name,
        type: inst.type,
        isVerified: inst.isVerified,
        city: inst.city || '',
        state: inst.state || '',
        location: {
          latitude: inst.location?.latitude ?? null,
          longitude: inst.location?.longitude ?? null,
        },
      },
      distanceKm: inst.distanceKm,
      equipment: matchingEq,
    });
  }

  // 6. Sort by distance ascending (null distances at the end)
  labs.sort((a, b) => {
    if (a.distanceKm === null && b.distanceKm === null) return 0;
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  });

  // 7. Apply limit
  return labs.slice(0, limit);
};

/**
 * Get detailed lab info and verified equipment for a single institution
 */
const getLabDetailsById = async (institutionId, { date, startTime, endTime } = {}) => {
  const institution = await Institution.findById(institutionId).lean();
  if (!institution || !institution.isVerified) {
    return null;
  }

  const equipments = await Equipment.find({
    institution: institution._id,
    isVerified: true,
  }).lean();

  const formattedEquipments = [];
  for (const eq of equipments) {
    const isAvailable = await checkEquipmentAvailability(eq, date, startTime, endTime);

    formattedEquipments.push({
      _id: eq._id,
      name: eq.name,
      category: eq.category,
      description: eq.description || '',
      pricePerHour: eq.pricePerHour,
      status: eq.status,
      isVerified: eq.isVerified,
      trainingRequired: eq.trainingRequired || false,
      certificationRequired: eq.certificationRequired || false,
      availability: isAvailable,
    });
  }

  return {
    institution: {
      _id: institution._id,
      name: institution.name,
      type: institution.type,
      description: institution.description || '',
      address: institution.address || '',
      city: institution.city || '',
      state: institution.state || '',
      isVerified: institution.isVerified,
      location: {
        latitude: institution.location?.latitude ?? null,
        longitude: institution.location?.longitude ?? null,
      },
    },
    equipmentCount: formattedEquipments.length,
    equipment: formattedEquipments,
  };
};

module.exports = {
  calculateHaversineDistance,
  checkEquipmentAvailability,
  findNearbyLabs,
  getLabDetailsById,
};
