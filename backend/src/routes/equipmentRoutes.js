const express = require('express');
const {
  createEquipment,
  getEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  verifyEquipment,
} = require('../controllers/equipmentController');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

router.route('/').post(protect, createEquipment).get(optionalAuth, getEquipment);
router.patch('/:id/verify', protect, adminOnly, verifyEquipment);
router
  .route('/:id')
  .get(optionalAuth, getEquipmentById)
  .patch(protect, updateEquipment)
  .delete(protect, deleteEquipment);

module.exports = router;
