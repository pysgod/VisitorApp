import { useState, useEffect } from 'react';
import { staffService } from '../services/api';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    try {
      const response = await staffService.getAll();
      setStaff(response.data.data || []);
    } catch (error) {
      console.error('Staff load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      await staffService.create(newName);
      setNewName('');
      setShowModal(false);
      loadStaff();
    } catch (error) {
      alert('Personel oluşturulamadı: ' + (error.response?.data?.message || ''));
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await staffService.toggle(id);
      loadStaff();
    } catch (error) {
      alert('İşlem başarısız');
    }
  };

  const handleRegenerate = async (id) => {
    if (window.confirm('Yeni giriş kodu oluşturulsun mu?')) {
      try {
        await staffService.regenerateCode(id);
        loadStaff();
      } catch (error) {
        alert('Kod oluşturulamadı');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu personeli silmek istediğinize emin misiniz?')) {
      try {
        await staffService.delete(id);
        loadStaff();
      } catch (error) {
        alert('Silme başarısız');
      }
    }
  };

  // Filter staff
  const filteredStaff = staff.filter(s => {
    const matchesSearch = !searchText || s.name?.toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = !statusFilter || 
      (statusFilter === 'active' && s.isActive) || 
      (statusFilter === 'inactive' && !s.isActive);
    return matchesSearch && matchesStatus;
  });

  const hasActiveFilters = searchText || statusFilter;

  const clearFilters = () => {
    setSearchText('');
    setStatusFilter('');
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Personel Yönetimi</h1>
        <button className="btn btn-success" onClick={() => setShowModal(true)}>
          ➕ Yeni Personel
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Filtreler</h3>
          {hasActiveFilters && (
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              ✕ Temizle
            </button>
          )}
        </div>
        <div className="filters">
          <div className="filter-group search-group">
            <label>Ara</label>
            <input
              type="text"
              className="form-input search-input"
              placeholder="Personel adı..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>
          <div className="filter-group">
            <label>Durum</label>
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tümü</option>
              <option value="active">Aktif</option>
              <option value="inactive">Pasif</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Personel Listesi ({filteredStaff.length})</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Ad Soyad</th>
                <th>Giriş Kodu</th>
                <th>Kayıt Sayısı</th>
                <th>Durum</th>
                <th>Oluşturma Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.name}</strong></td>
                  <td>
                    <span className="login-code">
                      {s.loginCode}
                    </span>
                  </td>
                  <td>{s.visitorCount}</td>
                  <td>
                    <span className={`badge ${s.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {s.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td>{new Date(s.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleRegenerate(s._id)}
                        title="Kod Yenile"
                      >
                        🔄
                      </button>
                      <button 
                        className={`btn btn-sm ${s.isActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggle(s._id)}
                      >
                        {s.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(s._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStaff.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">Kayıt bulunamadı</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Yeni Personel Ekle</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Personel Adı Soyadı</label>
              <input
                type="text"
                className="form-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Örn: Ahmet Yılmaz"
                autoFocus
              />
            </div>
            <p className="info-text">
              ℹ️ Giriş kodu otomatik olarak oluşturulacaktır.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                İptal
              </button>
              <button 
                className="btn btn-success" 
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
              >
                {creating ? 'Oluşturuluyor...' : 'Ekle'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
