const {
  findNearbyLabs,
  getLabDetailsById,
} = require('../services/labNetworkService');
const { isValidObjectId, isValidTime } = require('../src/utils/apiHelpers');

/**
 * @desc    Find nearby laboratories and matching equipment
 * @route   GET /api/labs/nearby
 * @access  Private
 */
const getNearbyLabs = async (req, res, next) => {
  try {
    let originLat;
    let originLng;

    // 1. Resolve search origin: explicit query parameters take precedence over user profile
    if (req.query.lat !== undefined || req.query.lng !== undefined) {
      if (req.query.lat === undefined || req.query.lng === undefined) {
        return res.status(400).json({
          message: 'Both lat and lng must be provided when searching with coordinates.',
        });
      }

      const lat = Number(req.query.lat);
      const lng = Number(req.query.lng);

      if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
        return res.status(400).json({
          message: 'Invalid latitude or longitude coordinates.',
        });
      }

      originLat = lat;
      originLng = lng;
    } else if (
      req.user?.location?.latitude !== undefined &&
      req.user?.location?.latitude !== null &&
      req.user?.location?.longitude !== undefined &&
      req.user?.location?.longitude !== null
    ) {
      originLat = Number(req.user.location.latitude);
      originLng = Number(req.user.location.longitude);

      if (isNaN(originLat) || isNaN(originLng)) {
        return res.status(400).json({
          message: 'Location is required to find nearby laboratories.',
        });
      }
    } else {
      return res.status(400).json({
        message: 'Location is required to find nearby laboratories.',
      });
    }

    // 2. Validate radius (default: 50, maximum: 500)
    let radius = 50;
    if (req.query.radius !== undefined) {
      const parsedRadius = Number(req.query.radius);
      if (isNaN(parsedRadius) || parsedRadius <= 0 || parsedRadius > 500) {
        return res.status(400).json({
          message: 'Radius must be a positive number up to 500 km.',
        });
      }
      radius = parsedRadius;
    }

    // 3. Validate limit (default: 20, maximum: 50)
    let limit = 20;
    if (req.query.limit !== undefined) {
      const parsedLimit = Number(req.query.limit);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        return res.status(400).json({
          message: 'Limit must be a positive number.',
        });
      }
      limit = Math.min(parsedLimit, 50);
    }

    // 4. Validate price filters
    let minPrice;
    if (req.query.minPrice !== undefined) {
      minPrice = Number(req.query.minPrice);
      if (isNaN(minPrice) || minPrice < 0) {
        return res.status(400).json({
          message: 'minPrice must be a non-negative number.',
        });
      }
    }

    let maxPrice;
    if (req.query.maxPrice !== undefined) {
      maxPrice = Number(req.query.maxPrice);
      if (isNaN(maxPrice) || maxPrice < 0) {
        return res.status(400).json({
          message: 'maxPrice must be a non-negative number.',
        });
      }
    }

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      return res.status(400).json({
        message: 'minPrice cannot be greater than maxPrice.',
      });
    }

    // 5. Parse boolean filter parameters
    let trainingRequired;
    if (req.query.trainingRequired !== undefined) {
      trainingRequired = req.query.trainingRequired === 'true';
    }

    let certificationRequired;
    if (req.query.certificationRequired !== undefined) {
      certificationRequired = req.query.certificationRequired === 'true';
    }

    let availableOnly;
    if (req.query.available !== undefined) {
      availableOnly = req.query.available === 'true';
    }

    // 6. Validate date and time parameters for availability check
    const { date, startTime, endTime } = req.query;
    if (date || startTime || endTime) {
      if (!date || !startTime || !endTime) {
        return res.status(400).json({
          message: 'Date, startTime, and endTime are all required when checking slot availability.',
        });
      }
      if (!isValidTime(startTime) || !isValidTime(endTime)) {
        return res.status(400).json({
          message: 'Times must be valid in HH:mm format.',
        });
      }
      if (startTime >= endTime) {
        return res.status(400).json({
          message: 'endTime must be later than startTime.',
        });
      }
    }

    // 7. Fetch nearby labs via service
    const labs = await findNearbyLabs({
      originLat,
      originLng,
      radiusKm: radius,
      equipmentQuery: req.query.equipment,
      category: req.query.category,
      city: req.query.city,
      state: req.query.state,
      minPrice,
      maxPrice,
      trainingRequired,
      certificationRequired,
      availableOnly,
      date,
      startTime,
      endTime,
      limit,
    });

    return res.status(200).json({
      success: true,
      origin: {
        latitude: originLat,
        longitude: originLng,
      },
      radiusKm: radius,
      count: labs.length,
      labs,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get details and verified equipment for a single laboratory
 * @route   GET /api/labs/:id
 * @access  Private
 */
const getLabById = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid laboratory ID' });
    }

    const { date, startTime, endTime } = req.query;
    if (date || startTime || endTime) {
      if (!date || !startTime || !endTime) {
        return res.status(400).json({
          message: 'Date, startTime, and endTime are all required when checking slot availability.',
        });
      }
      if (!isValidTime(startTime) || !isValidTime(endTime)) {
        return res.status(400).json({
          message: 'Times must be valid in HH:mm format.',
        });
      }
      if (startTime >= endTime) {
        return res.status(400).json({
          message: 'endTime must be later than startTime.',
        });
      }
    }

    const lab = await getLabDetailsById(id, { date, startTime, endTime });
    if (!lab) {
      return res.status(404).json({ message: 'Laboratory not found or unverified' });
    }

    return res.status(200).json({
      success: true,
      lab,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNearbyLabs,
  getLabById,
};
