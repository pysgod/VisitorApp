const mongoose = require('mongoose');

const visitorSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: [true, 'Ziyaretçi adı soyadı gerekli']
  },
  phone: {
    type: String,
    required: [true, 'Telefon numarası gerekli']
  },
  company: {
    type: String,
    required: [true, 'Geldiği şirket/kurum gerekli']
  },
  visitingPerson: {
    type: String,
    required: [true, 'Ziyaret edilen kişi gerekli']
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Departman gerekli']
  },
  entryReason: {
    type: String,
    default: ''
  },
  
  // Fotoğraflar (Cloudinary URL'leri)
  visitorPhoto: {
    type: String,
    default: ''
  },
  idPhoto: {
    type: String,
    default: ''
  },
  vehiclePhoto: {
    type: String,
    default: ''
  },
  
  // Araç bilgisi
  hasVehicle: {
    type: Boolean,
    default: false
  },
  licensePlate: {
    type: String,
    default: ''
  },
  
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
visitorSchema.index({ status: 1 });
visitorSchema.index({ entryTime: -1 });
visitorSchema.index({ department: 1 });
visitorSchema.index({ recordedBy: 1 });

module.exports = mongoose.model('Visitor', visitorSchema);
