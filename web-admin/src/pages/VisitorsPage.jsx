import { useState, useEffect } from 'react';
import { visitorService, departmentService, staffService, reportService } from '../services/api';

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'entryTime', direction: 'desc' });
  const [filters, setFilters] = useState({
    status: '',
    department: '',
    recordedBy: '',
    startDate: '',
    endDate: '',
  });
  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    total: 0,
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadVisitors();
  }, [filters, pagination.page]);

  const loadInitialData = async () => {
    try {
      const [deptRes, staffRes] = await Promise.all([
        departmentService.getAll(),
        staffService.getAll(),
      ]);
      setDepartments(deptRes.data.data || []);
      setStaffList(staffRes.data.data || []);
    } catch (error) {
      console.error('Initial data load error:', error);
    }
  };

  const loadVisitors = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: 20,
      };
      Object.keys(params).forEach(key => !params[key] && delete params[key]);
      
      const response = await visitorService.getAll(params);
      setVisitors(response.data.data || []);
      setPagination({
        page: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Visitors load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadVisitors();
  };

  const handleExport = async () => {
    try {
      const response = await reportService.exportExcel(filters);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ziyaretci-raporu-${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert('Export başarısız');
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('tr-TR');
  };

  const openDetailModal = (visitor) => {
    setSelectedVisitor(visitor);
  };

  const closeDetailModal = () => {
    setSelectedVisitor(null);
  };

  // Quick date filter helpers
  const setQuickDateFilter = (preset) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate = '';
    let endDate = new Date().toISOString().split('T')[0];

    if (preset === 'today') {
      startDate = endDate;
    } else if (preset === 'week') {
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
    } else if (preset === 'month') {
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      startDate = monthAgo.toISOString().split('T')[0];
    }

    setFilters({ ...filters, startDate, endDate });
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      department: '',
      recordedBy: '',
      startDate: '',
      endDate: '',
    });
    setSearchText('');
    setPagination({ ...pagination, page: 1 });
  };

  const hasActiveFilters = filters.status || filters.department || filters.recordedBy || filters.startDate || filters.endDate || searchText;

  // Sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Filter and sort visitors
  const filteredVisitors = visitors
    .filter(v => {
      if (!searchText) return true;
      const search = searchText.toLowerCase();
      return (
        v.fullName?.toLowerCase().includes(search) ||
        v.phone?.includes(search) ||
        v.company?.toLowerCase().includes(search) ||
        v.visitingPerson?.toLowerCase().includes(search) ||
        v.licensePlate?.toLowerCase().includes(search)
      );
    })
    .sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (!aVal && !bVal) return 0;
      if (!aVal) return 1;
      if (!bVal) return -1;
      
      if (sortConfig.key === 'entryTime' || sortConfig.key === 'exitTime') {
        return sortConfig.direction === 'asc' 
          ? new Date(aVal) - new Date(bVal)
          : new Date(bVal) - new Date(aVal);
      }
      
      const comparison = String(aVal).localeCompare(String(bVal), 'tr');
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ziyaretçi Raporları</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleRefresh}>
            🔄 Yenile
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            📥 Excel İndir
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Filtreler</h3>
          <div className="filter-actions">
            <div className="quick-filters">
              <button className="filter-chip" onClick={() => setQuickDateFilter('today')}>📅 Bugün</button>
              <button className="filter-chip" onClick={() => setQuickDateFilter('week')}>📆 Bu Hafta</button>
              <button className="filter-chip" onClick={() => setQuickDateFilter('month')}>🗓️ Bu Ay</button>
            </div>
            {hasActiveFilters && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                ✕ Filtreleri Temizle
              </button>
            )}
          </div>
        </div>
        <div className="filters">
          <div className="filter-group search-group">
            <label>Ara</label>
            <input
              type="text"
              className="form-input search-input"
              placeholder="İsim, telefon, şirket..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Başlangıç Tarihi</label>
            <input
              type="date"
              className="form-input"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>Bitiş Tarihi</label>
            <input
              type="date"
              className="form-input"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
            />
          </div>
          <div className="filter-group">
            <label>Durum</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="">Tümü</option>
              <option value="active">Aktif</option>
              <option value="exited">Çıkış Yapmış</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Departman</label>
            <select
              className="form-select"
              value={filters.department}
              onChange={(e) => setFilters({ ...filters, department: e.target.value })}
            >
              <option value="">Tümü</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Kayıt Eden Personel</label>
            <select
              className="form-select"
              value={filters.recordedBy}
              onChange={(e) => setFilters({ ...filters, recordedBy: e.target.value })}
            >
              <option value="">Tümü</option>
              {staffList.map((s) => (
                <option key={s._id} value={s._id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            Ziyaretçiler ({pagination.total} kayıt)
          </h3>
        </div>
        
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Yükleniyor...</p>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="sortable-header" onClick={() => handleSort('fullName')}>
                    Ziyaretçi {getSortIcon('fullName')}
                  </th>
                  <th>Telefon</th>
                  <th className="sortable-header" onClick={() => handleSort('company')}>
                    Geldiği Kurum {getSortIcon('company')}
                  </th>
                  <th>Görüştüğü Kişi</th>
                  <th>Departman</th>
                  <th className="sortable-header" onClick={() => handleSort('entryTime')}>
                    Giriş {getSortIcon('entryTime')}
                  </th>
                  <th className="sortable-header" onClick={() => handleSort('exitTime')}>
                    Çıkış {getSortIcon('exitTime')}
                  </th>
                  <th>Araç</th>
                  <th>Personel</th>
                  <th className="sortable-header" onClick={() => handleSort('status')}>
                    Durum {getSortIcon('status')}
                  </th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {filteredVisitors.map((v) => (
                  <tr key={v._id}>
                    <td><strong>{v.fullName}</strong></td>
                    <td>{v.phone}</td>
                    <td>{v.company}</td>
                    <td>{v.visitingPerson}</td>
                    <td>{v.department?.name || '-'}</td>
                    <td>{formatDate(v.entryTime)}</td>
                    <td>{formatDate(v.exitTime)}</td>
                    <td>{v.licensePlate || '-'}</td>
                    <td>{v.recordedBy?.name || '-'}</td>
                    <td>
                      <span className={`badge ${v.status === 'active' ? 'badge-warning' : 'badge-success'}`}>
                        {v.status === 'active' ? 'Aktif' : 'Çıkış Yaptı'}
                      </span>
                    </td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openDetailModal(v)}
                        title="Detayları Görüntüle"
                      >
                        ⁝
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredVisitors.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center">Kayıt bulunamadı</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="pagination">
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              ◀ Önceki
            </button>
            <span className="pagination-info">
              Sayfa {pagination.page} / {pagination.totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
            >
              Sonraki ▶
            </button>
          </div>
        )}
      </div>

      {/* Visitor Detail Modal */}
      {selectedVisitor && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Ziyaretçi Detayı</h2>
              <button className="modal-close" onClick={closeDetailModal}>×</button>
            </div>
            
            <div className="visitor-detail">
              {/* Visitor Info Section */}
              <div className="detail-section">
                <h3 className="detail-section-title">Kişisel Bilgiler</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Ad Soyad</span>
                    <span className="detail-value">{selectedVisitor.fullName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Telefon</span>
                    <span className="detail-value">{selectedVisitor.phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Geldiği Kurum</span>
                    <span className="detail-value">{selectedVisitor.company}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Görüştüğü Kişi</span>
                    <span className="detail-value">{selectedVisitor.visitingPerson}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Departman</span>
                    <span className="detail-value">{selectedVisitor.department?.name || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Ziyaret Nedeni</span>
                    <span className="detail-value">{selectedVisitor.entryReason || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Time Info Section */}
              <div className="detail-section">
                <h3 className="detail-section-title">Zaman Bilgileri</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Giriş Zamanı</span>
                    <span className="detail-value">{formatDate(selectedVisitor.entryTime)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Çıkış Zamanı</span>
                    <span className="detail-value">{formatDate(selectedVisitor.exitTime)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Durum</span>
                    <span className={`badge ${selectedVisitor.status === 'active' ? 'badge-warning' : 'badge-success'}`}>
                      {selectedVisitor.status === 'active' ? 'Aktif' : 'Çıkış Yaptı'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Kayıt Eden Personel</span>
                    <span className="detail-value">{selectedVisitor.recordedBy?.name || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Vehicle Info Section */}
              {selectedVisitor.hasVehicle && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Araç Bilgileri</h3>
                  <div className="detail-grid">
                    <div className="detail-item">
                      <span className="detail-label">Araç Plakası</span>
                      <span className="detail-value">{selectedVisitor.licensePlate || '-'}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Photos Section */}
              <div className="detail-section">
                <h3 className="detail-section-title">Fotoğraflar</h3>
                <div className="photo-grid">
                  <div className="photo-item">
                    <span className="photo-label">Ziyaretçi Fotoğrafı</span>
                    {selectedVisitor.visitorPhoto ? (
                      <img 
                        src={selectedVisitor.visitorPhoto} 
                        alt="Ziyaretçi" 
                        className="detail-photo"
                      />
                    ) : (
                      <div className="photo-placeholder">Fotoğraf Yok</div>
                    )}
                  </div>
                  <div className="photo-item">
                    <span className="photo-label">Kimlik Fotoğrafı</span>
                    {selectedVisitor.idPhoto ? (
                      <img 
                        src={selectedVisitor.idPhoto} 
                        alt="Kimlik" 
                        className="detail-photo"
                      />
                    ) : (
                      <div className="photo-placeholder">Fotoğraf Yok</div>
                    )}
                  </div>
                  {selectedVisitor.hasVehicle && (
                    <div className="photo-item">
                      <span className="photo-label">Araç Fotoğrafı</span>
                      {selectedVisitor.vehiclePhoto ? (
                        <img 
                          src={selectedVisitor.vehiclePhoto} 
                          alt="Araç" 
                          className="detail-photo"
                        />
                      ) : (
                        <div className="photo-placeholder">Fotoğraf Yok</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDetailModal}>
                Kapat
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
