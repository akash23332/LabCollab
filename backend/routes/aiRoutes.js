const express = require('express');
const { recommendEquipment, getRecommendationStatus } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Which mode the engine is in: "fallback" or "ai_model" (no secrets exposed).
router.get('/status', protect, getRecommendationStatus);

// Natural-language equipment recommendations (read-only).
router.post('/recommend', protect, recommendEquipment);

module.exports = router;
