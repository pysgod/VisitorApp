const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  driverName: {
    type: String,
    required: [true, 'Sürücü adı soyadı gerekli']
  },
  licensePlate: {
    type: String,
    required: [true, 'Araç plakası gerekli']
  },
  brand: {
    type: String,
    default: ''
  },
  model: {
    type: String,
    default: ''
  },
  
  // Araç fotoğrafları (sınırsız sayıda - Cloudinary URL'leri)
  photos: [{
    type: String
  }],
  
  // Zaman damgaları
  entryTime: {
    type: Date,
    default: Date.now
  },
  exitTime: {
    type: Date,
    default: null
  },
  
  // Durum
  status: {
    type: String,
    enum: ['active', 'exited'],
    default: 'active'
  },
  
  // Kayıt türü (listelemede ayırt etmek için)
  recordType: {
    type: String,
    default: 'vehicle'
  },
  
  // Kaydı oluşturan personel
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Staff',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
vehicleSchema.index({ status: 1 });
vehicleSchema.index({ entryTime: -1 });
vehicleSchema.index({ licensePlate: 1 });
vehicleSchema.index({ recordedBy: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
