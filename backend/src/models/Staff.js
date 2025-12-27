const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const staffSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Personel adı gerekli']
  },
  loginCode: {
    type: String,
    required: [true, 'Giriş kodu gerekli'],
    unique: true,
    match: [/^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]$/, 'Kod formatı: XXX-XXX-X']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  visitorCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// JWT Token oluştur
staffSchema.methods.getSignedJwtToken = function() {
  return jwt.sign(
    { id: this._id, role: 'staff', type: 'staff' },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Rastgele giriş kodu oluştur
staffSchema.statics.generateLoginCode = function() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  // İlk 3 karakter
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  
  // İkinci 3 karakter
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  code += '-';
  
  // Son 1 karakter
  code += chars.charAt(Math.floor(Math.random() * chars.length));
  
  return code;
};

module.exports = mongoose.model('Staff', staffSchema);
