const express = require('express');
const router = express.Router();
const {
  getActiveVisitors,
  getAllVisitors,
  getVisitor,
  createVisitor,
  exitVisitor,
  uploadPhoto
} = require('../controllers/visitorController');
const { protect, staffOnly } = require('../middleware/auth');
const { upload } = require('../config/cloudinary');

// Tüm route'lar giriş gerektirir
router.use(protect);

// Aktif ziyaretçiler
router.get('/active', getActiveVisitors);

// Fotoğraf yükleme
router.post('/upload', upload.single('photo'), uploadPhoto);

// Ziyaretçi CRUD
router.route('/')
  .get(getAllVisitors)
  .post(createVisitor);

router.route('/:id')
  .get(getVisitor);

// Çıkış işlemi
router.put('/:id/exit', exitVisitor);

module.exports = router;
