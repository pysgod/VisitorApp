const express = require('express');
const router = express.Router();
const {
  adminLogin,
  staffLogin,
  getMe,
  adminRegister
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/admin/register', adminRegister);
router.post('/admin/login', adminLogin);
router.post('/staff/login', staffLogin);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
