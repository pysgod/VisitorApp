import React, { useState, useEffect } from 'react';
import { staffService } from '../services/api';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

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

  if (loading) {
    return <div className="text-center mt-20">Yükleniyor...</div>;
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
              {staff.map((s) => (
                <tr key={s._id}>
                  <td><strong>{s.name}</strong></td>
                  <td>
                    <span style={{ 
                      fontFamily: 'monospace', 
                      fontSize: '16px',
                      background: '#e3f2fd',
                      padding: '6px 12px',
                      borderRadius: '6px'
                    }}>
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
                    <div style={{ display: 'flex', gap: '8px' }}>
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
                        🗑
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {staff.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center">Henüz personel yok</td>
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
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>
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
