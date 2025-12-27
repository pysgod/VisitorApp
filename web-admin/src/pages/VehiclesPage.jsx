import { useState, useEffect } from 'react';
import { vehicleService, staffService } from '../services/api';

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    licensePlate: '',
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
    loadVehicles();
  }, [filters, pagination.page]);

  const loadInitialData = async () => {
    try {
      const staffRes = await staffService.getAll();
      setStaffList(staffRes.data.data || []);
    } catch (error) {
      console.error('Initial data load error:', error);
    }
  };

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        page: pagination.page,
        limit: 20,
      };
      Object.keys(params).forEach(key => !params[key] && delete params[key]);
      
      const response = await vehicleService.getAll(params);
      setVehicles(response.data.data || []);
      setPagination({
        page: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total,
      });
    } catch (error) {
      console.error('Vehicles load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadVehicles();
  };

  const handleExport = async () => {
    try {
      // Create CSV from current data
      const headers = ['Sürücü', 'Plaka', 'Marka', 'Model', 'Giriş', 'Çıkış', 'Personel', 'Durum'];
      const rows = vehicles.map(v => [
        v.driverName,
        v.licensePlate,
        v.brand || '-',
        v.model || '-',
        v.entryTime ? new Date(v.entryTime).toLocaleString('tr-TR') : '-',
        v.exitTime ? new Date(v.exitTime).toLocaleString('tr-TR') : '-',
        v.recordedBy?.name || '-',
        v.status === 'active' ? 'Aktif' : 'Çıkış Yapıldı'
      ]);
      
      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `arac-raporu-${new Date().toISOString().split('T')[0]}.csv`);
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

  const openDetailModal = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  const closeDetailModal = () => {
    setSelectedVehicle(null);
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Araç Kayıtları</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleRefresh}>
            🔄 Yenile
          </button>
          <button className="btn btn-primary" onClick={handleExport}>
            📥 CSV İndir
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
            <label>Plaka Ara</label>
            <input
              type="text"
              className="form-input"
              placeholder="Plaka..."
              value={filters.licensePlate}
              onChange={(e) => setFilters({ ...filters, licensePlate: e.target.value.toUpperCase() })}
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
            Araçlar ({pagination.total} kayıt)
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
                  <th>Sürücü</th>
                  <th>Plaka</th>
                  <th>Marka</th>
                  <th>Model</th>
                  <th>Giriş</th>
                  <th>Çıkış</th>
                  <th>Personel</th>
                  <th>Durum</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.map((v) => (
                  <tr key={v._id}>
                    <td><strong>{v.driverName}</strong></td>
                    <td className="license-plate">{v.licensePlate}</td>
                    <td>{v.brand || '-'}</td>
                    <td>{v.model || '-'}</td>
                    <td>{formatDate(v.entryTime)}</td>
                    <td>{formatDate(v.exitTime)}</td>
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
                {vehicles.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center">Kayıt bulunamadı</td>
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

      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <div className="modal-overlay" onClick={closeDetailModal}>
          <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Araç Detayı</h2>
              <button className="modal-close" onClick={closeDetailModal}>×</button>
            </div>
            
            <div className="visitor-detail">
              {/* Vehicle Info */}
              <div className="detail-section">
                <h3 className="detail-section-title">Araç Bilgileri</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Sürücü</span>
                    <span className="detail-value">{selectedVehicle.driverName}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Plaka</span>
                    <span className="detail-value license-plate-lg">{selectedVehicle.licensePlate}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Marka</span>
                    <span className="detail-value">{selectedVehicle.brand || '-'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Model</span>
                    <span className="detail-value">{selectedVehicle.model || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Time Info */}
              <div className="detail-section">
                <h3 className="detail-section-title">Zaman Bilgileri</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Giriş Zamanı</span>
                    <span className="detail-value">{formatDate(selectedVehicle.entryTime)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Çıkış Zamanı</span>
                    <span className="detail-value">{formatDate(selectedVehicle.exitTime)}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Durum</span>
                    <span className={`badge ${selectedVehicle.status === 'active' ? 'badge-warning' : 'badge-success'}`}>
                      {selectedVehicle.status === 'active' ? 'Aktif' : 'Çıkış Yaptı'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Kayıt Eden</span>
                    <span className="detail-value">{selectedVehicle.recordedBy?.name || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Photos */}
              {selectedVehicle.photos && selectedVehicle.photos.length > 0 && (
                <div className="detail-section">
                  <h3 className="detail-section-title">Fotoğraflar ({selectedVehicle.photos.length})</h3>
                  <div className="photo-grid">
                    {selectedVehicle.photos.map((photo, index) => (
                      <div key={index} className="photo-item">
                        <span className="photo-label">Fotoğraf {index + 1}</span>
                        <img 
                          src={photo} 
                          alt={`Araç ${index + 1}`} 
                          className="detail-photo"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
