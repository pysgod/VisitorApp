import React, { useState, useEffect } from 'react';
import { visitorService, departmentService, staffService, reportService } from '../services/api';

export default function VisitorsPage() {
  const [visitors, setVisitors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVisitor, setSelectedVisitor] = useState(null);
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

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ziyaretçi Raporları</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
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
        </div>
        <div className="filters">
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
          <div className="text-center mt-20 mb-20">Yükleniyor...</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Ziyaretçi</th>
                  <th>Telefon</th>
                  <th>Geldiği Kurum</th>
                  <th>Görüştüğü Kişi</th>
                  <th>Departman</th>
                  <th>Giriş</th>
                  <th>Çıkış</th>
                  <th>Araç</th>
                  <th>Personel</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {visitors.map((v) => (
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
                        ⋮
                      </button>
                    </td>
                  </tr>
                ))}
                {visitors.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center">Kayıt bulunamadı</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', padding: '20px' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
              disabled={pagination.page === 1}
            >
              ◀ Önceki
            </button>
            <span style={{ alignSelf: 'center' }}>
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
