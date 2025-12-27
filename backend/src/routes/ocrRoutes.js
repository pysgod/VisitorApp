const express = require('express');
const router = express.Router();
const { recognizePlate } = require('../controllers/ocrController');
const { protect } = require('../middleware/auth');

// Giriş gerektirir
router.use(protect);

// Plaka tanıma
router.post('/plate', recognizePlate);

module.exports = router;
