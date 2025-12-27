const User = require('../models/User');
const Staff = require('../models/Staff');

// @desc    Yönetici girişi
// @route   POST /api/auth/admin/login
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email ve şifre gerekli'
      });
    }
    
    const user = await User.findOne({ email }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }
    
    const isMatch = await user.matchPassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz email veya şifre'
      });
    }
    
    const token = user.getSignedJwtToken();
    
    res.status(200).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Personel girişi (kod ile)
// @route   POST /api/auth/staff/login
exports.staffLogin = async (req, res) => {
  try {
    const { loginCode } = req.body;
    
    if (!loginCode) {
      return res.status(400).json({
        success: false,
        message: 'Giriş kodu gerekli'
      });
    }
    
    const staff = await Staff.findOne({ loginCode: loginCode.toUpperCase() });
    
    if (!staff) {
      return res.status(401).json({
        success: false,
        message: 'Geçersiz giriş kodu'
      });
    }
    
    if (!staff.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Bu hesap pasif durumda'
      });
    }
    
    const token = staff.getSignedJwtToken();
    
    res.status(200).json({
      success: true,
      token,
      staff: {
        id: staff._id,
        name: staff.name,
        loginCode: staff.loginCode
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Mevcut kullanıcı bilgisi
// @route   GET /api/auth/me
exports.getMe = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      userType: req.userType,
      user: req.user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Yönetici kaydı (sadece ilk kurulum için)
// @route   POST /api/auth/admin/register
exports.adminRegister = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Email kontrolü (zaten User modelinde unique var ama burada da kontrol edelim)
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Bu email adresi zaten kullanımda'
      });
    }
    
    const user = await User.create({
      name,
      email,
      password,
      role: 'admin'
    });
    
    const token = user.getSignedJwtToken();
    
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};
