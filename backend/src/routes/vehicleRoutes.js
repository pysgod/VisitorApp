const express = require('express');
const router = express.Router();
const {
  getActiveVehicles,
  getAllVehicles,
  getVehicle,
  createVehicle,
  exitVehicle,
  uploadPhoto
} = require('../controllers/vehicleController');
const { protect, staffOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Tüm route'lar giriş gerektirir
router.use(protect);

// Aktif araçlar
router.get('/active', getActiveVehicles);

// Fotoğraf yükleme
router.post('/upload', upload.single('photo'), uploadPhoto);

// Araç CRUD
router.route('/')
  .get(getAllVehicles)
  .post(createVehicle);

router.route('/:id')
  .get(getVehicle);

// Çıkış işlemi
router.put('/:id/exit', exitVehicle);

module.exports = router;
