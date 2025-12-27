const Vehicle = require('../models/Vehicle');
const Staff = require('../models/Staff');

// @desc    Aktif araçları listele
// @route   GET /api/vehicles/active
exports.getActiveVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find({ status: 'active' })
      .populate('recordedBy', 'name')
      .sort('-entryTime');
    
    res.status(200).json({
      success: true,
      count: vehicles.length,
      data: vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Araçları listele (filtreli)
// @route   GET /api/vehicles
exports.getAllVehicles = async (req, res) => {
  try {
    const {
      status,
      licensePlate,
      recordedBy,
      startDate,
      endDate,
      page = 1,
      limit = 20
    } = req.query;
    
    let query = {};
    
    if (status) query.status = status;
    if (recordedBy) query.recordedBy = recordedBy;
    if (licensePlate) {
      query.licensePlate = { $regex: licensePlate, $options: 'i' };
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
    
    const vehicles = await Vehicle.find(query)
      .populate('recordedBy', 'name')
      .sort('-entryTime')
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Vehicle.countDocuments(query);
    
    res.status(200).json({
      success: true,
      count: vehicles.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      data: vehicles
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Tek araç getir
// @route   GET /api/vehicles/:id
exports.getVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id)
      .populate('recordedBy', 'name');
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Araç kaydı bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: vehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Yeni araç kaydı
// @route   POST /api/vehicles
exports.createVehicle = async (req, res) => {
  try {
    const {
      driverName,
      licensePlate,
      brand,
      model,
      photos
    } = req.body;
    
    // Personel kontrolü
    if (req.userType !== 'staff') {
      return res.status(403).json({
        success: false,
        message: 'Sadece personeller araç kaydı oluşturabilir'
      });
    }
    
    const vehicle = await Vehicle.create({
      driverName,
      licensePlate,
      brand: brand || '',
      model: model || '',
      photos: photos || [],
      recordedBy: req.user._id,
      entryTime: new Date(),
      status: 'active'
    });
    
    // Personelin kayıt sayısını artır
    await Staff.findByIdAndUpdate(req.user._id, {
      $inc: { visitorCount: 1 }
    });
    
    const populatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('recordedBy', 'name');
    
    res.status(201).json({
      success: true,
      data: populatedVehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Araç çıkışı
// @route   PUT /api/vehicles/:id/exit
exports.exitVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Araç kaydı bulunamadı'
      });
    }
    
    if (vehicle.status === 'exited') {
      return res.status(400).json({
        success: false,
        message: 'Bu aracın çıkışı zaten yapılmış'
      });
    }
    
    vehicle.exitTime = new Date();
    vehicle.status = 'exited';
    await vehicle.save();
    
    const populatedVehicle = await Vehicle.findById(vehicle._id)
      .populate('recordedBy', 'name');
    
    res.status(200).json({
      success: true,
      data: populatedVehicle
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Araç fotoğrafı yükle
// @route   POST /api/vehicles/upload
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
