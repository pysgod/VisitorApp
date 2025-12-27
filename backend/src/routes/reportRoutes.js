const express = require('express');
const router = express.Router();
const {
  getDashboard,
  exportExcel,
  getStats
} = require('../controllers/reportController');
const { protect, adminOnly } = require('../middleware/auth');

// Tüm route'lar admin yetkisi gerektirir
router.use(protect);
router.use(adminOnly);

router.get('/dashboard', getDashboard);
router.get('/export', exportExcel);
router.get('/stats', getStats);

module.exports = router;
