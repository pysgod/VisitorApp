const Visitor = require('../models/Visitor');
const Vehicle = require('../models/Vehicle');
const Staff = require('../models/Staff');
const Department = require('../models/Department');
const ExcelJS = require('exceljs');

// @desc    Dashboard istatistikleri (Ziyaretçi + Araç)
// @route   GET /api/reports/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const { visitorPeriod = 'week', vehiclePeriod = 'week' } = req.query;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // ============ ZİYARETÇİ İSTATİSTİKLERİ ============
    const todayVisitors = await Visitor.countDocuments({
      entryTime: { $gte: today, $lt: tomorrow }
    });
    
    const activeVisitors = await Visitor.countDocuments({ status: 'active' });
    
    const todayVisitorExited = await Visitor.countDocuments({
      exitTime: { $gte: today, $lt: tomorrow }
    });
    
    const totalVisitors = await Visitor.countDocuments();
    
    // Ziyaretçi grafiği için tarih hesaplama
    const visitorChartStart = getStartDate(visitorPeriod);
    
    const visitorDailyStats = await Visitor.aggregate([
      { $match: { entryTime: { $gte: visitorChartStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$entryTime' } },
          entries: { $sum: 1 },
          exits: { $sum: { $cond: [{ $ne: ['$exitTime', null] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // En çok ziyaret edilen departman (son 30 gün)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const topDepartments = await Visitor.aggregate([
      { $match: { entryTime: { $gte: thirtyDaysAgo } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    const departmentIds = topDepartments.map(d => d._id);
    const departments = await Department.find({ _id: { $in: departmentIds } });
    const departmentMap = {};
    departments.forEach(d => { departmentMap[d._id.toString()] = d.name; });
    
    const topDepartmentsWithNames = topDepartments.map(d => ({
      department: departmentMap[d._id?.toString()] || 'Bilinmiyor',
      count: d.count
    }));
    
    // ============ ARAÇ İSTATİSTİKLERİ ============
    const todayVehicles = await Vehicle.countDocuments({
      entryTime: { $gte: today, $lt: tomorrow }
    });
    
    const activeVehicles = await Vehicle.countDocuments({ status: 'active' });
    
    const todayVehicleExited = await Vehicle.countDocuments({
      exitTime: { $gte: today, $lt: tomorrow }
    });
    
    const totalVehicles = await Vehicle.countDocuments();
    
    // Araç grafiği için tarih hesaplama
    const vehicleChartStart = getStartDate(vehiclePeriod);
    
    const vehicleDailyStats = await Vehicle.aggregate([
      { $match: { entryTime: { $gte: vehicleChartStart } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$entryTime' } },
          entries: { $sum: 1 },
          exits: { $sum: { $cond: [{ $ne: ['$exitTime', null] }, 1, 0] } }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        // Ziyaretçi
        todayVisitors,
        activeVisitors,
        todayVisitorExited,
        totalVisitors,
        topDepartments: topDepartmentsWithNames,
        visitorDailyStats,
        // Araç
        todayVehicles,
        activeVehicles,
        todayVehicleExited,
        totalVehicles,
        vehicleDailyStats
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

// Yardımcı fonksiyon: Periyoda göre başlangıç tarihi hesapla
function getStartDate(period) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  
  switch (period) {
    case 'day':
      return date;
    case 'week':
      date.setDate(date.getDate() - 7);
      return date;
    case 'month':
      date.setMonth(date.getMonth() - 1);
      return date;
    case 'year':
      date.setFullYear(date.getFullYear() - 1);
      return date;
    default:
      date.setDate(date.getDate() - 7);
      return date;
  }
}

// @desc    Excel export
// @route   GET /api/reports/export
exports.exportExcel = async (req, res) => {
  try {
    const { startDate, endDate, department, recordedBy } = req.query;
    
    let query = {};
    
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
    
    if (department) query.department = department;
    if (recordedBy) query.recordedBy = recordedBy;
    
    const visitors = await Visitor.find(query)
      .populate('department', 'name')
      .populate('recordedBy', 'name')
      .sort('-entryTime');
    
    // Excel oluştur
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ziyaretçi Raporu');
    
    // Başlıklar
    worksheet.columns = [
      { header: 'Ziyaretçi Adı', key: 'fullName', width: 25 },
      { header: 'Telefon', key: 'phone', width: 15 },
      { header: 'Geldiği Kurum', key: 'company', width: 20 },
      { header: 'Ziyaret Edilen Kişi', key: 'visitingPerson', width: 20 },
      { header: 'Departman', key: 'department', width: 15 },
      { header: 'Giriş Saati', key: 'entryTime', width: 20 },
      { header: 'Çıkış Saati', key: 'exitTime', width: 20 },
      { header: 'Araç Plakası', key: 'licensePlate', width: 15 },
      { header: 'Kaydı Alan Personel', key: 'recordedBy', width: 20 },
      { header: 'Durum', key: 'status', width: 10 }
    ];
    
    // Başlık stilini ayarla
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    
    // Verileri ekle
    visitors.forEach(visitor => {
      worksheet.addRow({
        fullName: visitor.fullName,
        phone: visitor.phone,
        company: visitor.company,
        visitingPerson: visitor.visitingPerson,
        department: visitor.department?.name || '-',
        entryTime: visitor.entryTime ? new Date(visitor.entryTime).toLocaleString('tr-TR') : '-',
        exitTime: visitor.exitTime ? new Date(visitor.exitTime).toLocaleString('tr-TR') : '-',
        licensePlate: visitor.licensePlate || '-',
        recordedBy: visitor.recordedBy?.name || '-',
        status: visitor.status === 'active' ? 'Aktif' : 'Çıkış Yapıldı'
      });
    });
    
    // Response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=ziyaretci-raporu-${new Date().toISOString().split('T')[0]}.xlsx`
    );
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Sunucu hatası',
      error: error.message
    });
  }
};

// @desc    Detaylı istatistikler
// @route   GET /api/reports/stats
exports.getStats = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let startDate = new Date();
    
    switch (period) {
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
    }
    
    // Departman bazlı ziyaretçi
    const departmentStats = await Visitor.aggregate([
      { $match: { entryTime: { $gte: startDate } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Personel bazlı kayıt sayısı
    const staffStats = await Visitor.aggregate([
      { $match: { entryTime: { $gte: startDate } } },
      { $group: { _id: '$recordedBy', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    // Ziyaret edilen kişi bazlı
    const personStats = await Visitor.aggregate([
      { $match: { entryTime: { $gte: startDate } } },
      { $group: { _id: '$visitingPerson', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Departman ve personel isimlerini ekle
    const departmentIds = departmentStats.map(d => d._id);
    const staffIds = staffStats.map(s => s._id);
    
    const departments = await Department.find({ _id: { $in: departmentIds } });
    const staffMembers = await Staff.find({ _id: { $in: staffIds } });
    
    const departmentMap = {};
    const staffMap = {};
    
    departments.forEach(d => { departmentMap[d._id.toString()] = d.name; });
    staffMembers.forEach(s => { staffMap[s._id.toString()] = s.name; });
    
    res.status(200).json({
      success: true,
      data: {
        departmentStats: departmentStats.map(d => ({
          name: departmentMap[d._id?.toString()] || 'Bilinmiyor',
          count: d.count
        })),
        staffStats: staffStats.map(s => ({
          name: staffMap[s._id?.toString()] || 'Bilinmiyor',
          count: s.count
        })),
        personStats: personStats.map(p => ({
          name: p._id || 'Bilinmiyor',
          count: p.count
        }))
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
