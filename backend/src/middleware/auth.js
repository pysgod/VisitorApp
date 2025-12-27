const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Staff = require('../models/Staff');

// Token kontrolü
exports.protect = async (req, res, next) => {
  let token;
  
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Bu işlem için giriş yapmanız gerekli'
    });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type === 'admin') {
      req.user = await User.findById(decoded.id);
      req.userType = 'admin';
    } else if (decoded.type === 'staff') {
      req.user = await Staff.findById(decoded.id);
      req.userType = 'staff';
    }
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı bulunamadı'
      });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Geçersiz token'
    });
  }
};

// Sadece admin erişimi
exports.adminOnly = (req, res, next) => {
  if (req.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem için yönetici yetkisi gerekli'
    });
  }
  next();
};

// Sadece personel erişimi
exports.staffOnly = (req, res, next) => {
  if (req.userType !== 'staff') {
    return res.status(403).json({
      success: false,
      message: 'Bu işlem sadece personeller için'
    });
  }
  next();
};
