const express = require('express');
const { getNearbyLabs, getLabById } = require('../controllers/labController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Specific static route defined before parameterized route
router.get('/nearby', protect, getNearbyLabs);
router.get('/:id', protect, getLabById);

module.exports = router;
