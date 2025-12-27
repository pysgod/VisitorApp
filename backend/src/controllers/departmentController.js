const Department = require('../models/Department');

// @desc    Tüm departmanları listele
// @route   GET /api/departments
exports.getAllDepartments = async (req, res) => {
  try {
    const { activeOnly } = req.query;
    
    let query = {};
    if (activeOnly === 'true') {
      query.isActive = true;
    }
    
    const departments = await Department.find(query)
      .populate('createdBy', 'name email')
      .sort('name');
    
    res.status(200).json({
      success: true,
      count: departments.length,
      data: departments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Tek departman getir
// @route   GET /api/departments/:id
exports.getDepartment = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('createdBy', 'name email');
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Departman bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Yeni departman oluştur
// @route   POST /api/departments
exports.createDepartment = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Departman adı gerekli'
      });
    }
    
    const department = await Department.create({
      name,
      createdBy: req.user._id
    });
    
    res.status(201).json({
      success: true,
      data: department
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu isimde bir departman zaten mevcut'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Departman güncelle
// @route   PUT /api/departments/:id
exports.updateDepartment = async (req, res) => {
  try {
    const { name, isActive } = req.body;
    
    const updateData = {};
    if (name) updateData.name = name;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Departman bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Bu isimde bir departman zaten mevcut'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Departman sil
// @route   DELETE /api/departments/:id
exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Departman bulunamadı'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Departman silindi'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Departman aktif/pasif yap
// @route   PUT /api/departments/:id/toggle
exports.toggleDepartmentStatus = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Departman bulunamadı'
      });
    }
    
    department.isActive = !department.isActive;
    await department.save();
    
    res.status(200).json({
      success: true,
      data: department
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};
