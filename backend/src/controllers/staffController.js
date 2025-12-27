const Staff = require('../models/Staff');

// @desc    Tüm personelleri listele
// @route   GET /api/staff
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await Staff.find()
      .populate('createdBy', 'name email')
      .sort('-createdAt');
    
    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Tek personel getir
// @route   GET /api/staff/:id
exports.getStaff = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Personel bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Yeni personel oluştur
// @route   POST /api/staff
exports.createStaff = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Personel adı gerekli'
      });
    }
    
    // Benzersiz giriş kodu oluştur
    let loginCode;
    let isUnique = false;
    
    while (!isUnique) {
      loginCode = Staff.generateLoginCode();
      const existing = await Staff.findOne({ loginCode });
      if (!existing) {
        isUnique = true;
      }
    }
    
    const staff = await Staff.create({
      name,
      loginCode,
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Personel güncelle
// @route   PUT /api/staff/:id
exports.updateStaff = async (req, res) => {
  try {
    const { name } = req.body;
    
    const staff = await Staff.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true, runValidators: true }
    );
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Personel bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Personel aktif/pasif yap
// @route   PUT /api/staff/:id/toggle
exports.toggleStaffStatus = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Personel bulunamadı'
      });
    }
    
    staff.isActive = !staff.isActive;
    await staff.save();
    
    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Personel sil
// @route   DELETE /api/staff/:id
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await Staff.findByIdAndDelete(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Personel bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Personel silindi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Personel giriş kodunu yenile
// @route   PUT /api/staff/:id/regenerate-code
exports.regenerateCode = async (req, res) => {
  try {
    const staff = await Staff.findById(req.params.id);
    
    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Personel bulunamadı'
      });
    }
    
    // Benzersiz yeni kod oluştur
    let loginCode;
    let isUnique = false;
    
    while (!isUnique) {
      loginCode = Staff.generateLoginCode();
      const existing = await Staff.findOne({ loginCode });
      if (!existing) {
        isUnique = true;
      }
    }
    
    staff.loginCode = loginCode;
    await staff.save();
    
    res.status(200).json({
      success: true,
      data: staff
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};
