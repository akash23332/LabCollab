const express = require('express');
const {
  createInstitution,
  getInstitutions,
  getInstitutionById,
  updateInstitution,
  verifyInstitution,
} = require('../controllers/institutionController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

router
  .route('/')
  .post(protect, createInstitution)
  .get(optionalAuth, getInstitutions);

router.patch('/:id/verify', protect, adminOnly, verifyInstitution);

router
  .route('/:id')
  .get(optionalAuth, getInstitutionById)
  .patch(protect, updateInstitution);

module.exports = router;
