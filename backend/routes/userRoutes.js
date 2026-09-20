const express = require('express');
const {
  getCurrentUser,
  updateRequirements,
  getAllUsers,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

const router = express.Router();

// Current user profile
router.get('/me', protect, getCurrentUser);

// Update requirements and location for authenticated user
router.patch('/requirements', protect, updateRequirements);

// Admin-only: list all users
router.get('/all', protect, adminOnly, getAllUsers);

module.exports = router;
