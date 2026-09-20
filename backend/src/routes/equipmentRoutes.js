const express = require('express');
const {
  createEquipment,
  getEquipment,
  getEquipmentById,
  updateEquipment,
  deleteEquipment,
  exportForAI,
  syncDemandPredictions,
  searchAISemantic,
} = require('../controllers/equipmentController');
const optionalAuth = require('../middleware/optionalAuth');

const router = express.Router();

router.get('/export/ai-format', exportForAI);
router.post('/sync-demand', syncDemandPredictions);
router.post('/ai-search', searchAISemantic);

router
  .route('/')
  .post(optionalAuth, createEquipment)
  .get(optionalAuth, getEquipment);

router
  .route('/:id')
  .get(optionalAuth, getEquipmentById)
  .put(optionalAuth, updateEquipment)
  .patch(optionalAuth, updateEquipment)
  .delete(optionalAuth, deleteEquipment);

module.exports = router;
