const Visitor = require('../models/Visitor');
const Staff = require('../models/Staff');
const { cloudinary } = require('../config/cloudinary');

// @desc    Aktif ziyaretçileri listele
// @route   GET /api/visitors/active
exports.getActiveVisitors = async (req, res) => {
  try {
    const visitors = await Visitor.find({ status: 'active' })
      .populate('department', 'name')
      .populate('recordedBy', 'name')
      .sort('-entryTime');
    
    res.status(200).json({
      success: true,
      count: visitors.length,
      data: visitors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Ziyaretçileri listele (filtreli)
// @route   GET /api/visitors
exports.getAllVisitors = async (req, res) => {
  try {
    const {
      status,
      department,
      recordedBy,
      visitingPerson,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (department) query.department = department;
    if (recordedBy) query.recordedBy = recordedBy;
    if (visitingPerson) {
      query.visitingPerson = { $regex: visitingPerson, $options: 'i' };
    }
    
    // Tarih filtresi
    if (startDate || endDate) {
      query.entryTime = {};
      if (startDate) {
        query.entryTime.$gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.entryTime.$lte = end;
      }
    }
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const visitors = await Visitor.find(query)
      .populate('department', 'name')
      .populate('recordedBy', 'name')
      .sort('-entryTime')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Visitor.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: visitors.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: visitors
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Tek ziyaretçi getir
// @route   GET /api/visitors/:id
exports.getVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id)
      .populate('department', 'name')
      .populate('recordedBy', 'name');
    
    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Ziyaretçi bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: visitor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Yeni ziyaretçi kaydı
// @route   POST /api/visitors
exports.createVisitor = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      company,
      visitingPerson,
      department,
      entryReason,
      hasVehicle,
      licensePlate,
      visitorPhoto,
      idPhoto,
      vehiclePhoto
    } = req.body;
    
    // Personel kontrolü
    if (req.userType !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Sadece personeller ziyaretçi kaydı oluşturabilir'
      });
    }
    
    const visitor = await Visitor.create({
      fullName,
      phone,
      company,
      visitingPerson,
      department,
      entryReason,
      hasVehicle: hasVehicle || false,
      licensePlate: licensePlate || '',
      visitorPhoto: visitorPhoto || '',
      idPhoto: idPhoto || '',
      vehiclePhoto: vehiclePhoto || '',
      recordedBy: req.user._id,
      entryTime: new Date(),
      status: 'active'
    });
    
    // Personelin ziyaretçi sayısını artır
    await Staff.findByIdAndUpdate(req.user._id, {
      $inc: { visitorCount: 1 }
    });
    
    const populatedVisitor = await Visitor.findById(visitor._id)
      .populate('department', 'name')
      .populate('recordedBy', 'name');
    
    res.status(201).json({
      success: true,
      data: populatedVisitor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Ziyaretçi çıkışı
// @route   PUT /api/visitors/:id/exit
exports.exitVisitor = async (req, res) => {
  try {
    const visitor = await Visitor.findById(req.params.id);
    
    if (!visitor) {
      return res.status(404).json({
        success: false,
        message: 'Ziyaretçi bulunamadı'
      });
    }
    
    if (visitor.status === 'exited') {
      return res.status(400).json({
        success: false,
        message: 'Bu ziyaretçinin çıkışı zaten yapılmış'
      });
    }
    
    visitor.exitTime = new Date();
    visitor.status = 'exited';
    await visitor.save();
    
    const populatedVisitor = await Visitor.findById(visitor._id)
      .populate('department', 'name')
      .populate('recordedBy', 'name');
    
    res.status(200).json({
      success: true,
      data: populatedVisitor
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Fotoğraf yükle
// @route   POST /api/visitors/upload
exports.uploadPhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Fotoğraf yüklenmedi'
      });
    }
    
    res.status(200).json({
      success: true,
      url: req.file.path
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Fotoğraf yükleme hatası',
      error: error.message
    });
  }
};
