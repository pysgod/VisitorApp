const express = require('express');
const router = express.Router();
const {
  getAllStaff,
  getStaff,
  createStaff,
  updateStaff,
  toggleStaffStatus,
  deleteStaff,
  regenerateCode
} = require('../controllers/staffController');
const { protect, adminOnly } = require('../middleware/auth');

// Tüm route'lar admin yetkisi gerektirir
router.use(protect);
router.use(adminOnly);

router.route('/')
  .get(getAllStaff)
  .post(createStaff);

router.route('/:id')
  .get(getStaff)
  .put(updateStaff)
  .delete(deleteStaff);

router.put('/:id/toggle', toggleStaffStatus);
router.put('/:id/regenerate-code', regenerateCode);

module.exports = router;
