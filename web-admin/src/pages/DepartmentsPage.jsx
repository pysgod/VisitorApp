import { useState, useEffect } from 'react';
import { departmentService } from '../services/api';

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDept, setSelectedDept] = useState(null);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadDepartments();
  }, []);

  const loadDepartments = async () => {
    try {
      const response = await departmentService.getAll();
      setDepartments(response.data.data || []);
    } catch (error) {
      console.error('Department load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditMode(false);
    setSelectedDept(null);
    setNewName('');
    setShowModal(true);
  };

  const openEditModal = (dept) => {
    setEditMode(true);
    setSelectedDept(dept);
    setNewName(dept.name);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      if (editMode && selectedDept) {
        await departmentService.update(selectedDept._id, { name: newName });
      } else {
        await departmentService.create(newName);
      }
      setShowModal(false);
      loadDepartments();
    } catch (error) {
      alert('İşlem başarısız: ' + (error.response?.data?.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await departmentService.toggle(id);
      loadDepartments();
    } catch (error) {
      alert('İşlem başarısız');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu departmanı silmek istediğinize emin misiniz?')) {
      try {
        await departmentService.delete(id);
        loadDepartments();
      } catch (error) {
        alert('Silme başarısız');
      }
    }
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
        <h1 className="page-title">Departman Yönetimi</h1>
        <button className="btn btn-success" onClick={openCreateModal}>
          ➕ Yeni Departman
        </button>
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Departman Adı</th>
                <th>Durum</th>
                <th>Oluşturma Tarihi</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((dept) => (
                <tr key={dept._id}>
                  <td><strong>{dept.name}</strong></td>
                  <td>
                    <span className={`badge ${dept.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {dept.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td>{new Date(dept.createdAt).toLocaleDateString('tr-TR')}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditModal(dept)}
                      >
                        ✏️ Düzenle
                      </button>
                      <button 
                        className={`btn btn-sm ${dept.isActive ? 'btn-danger' : 'btn-success'}`}
                        onClick={() => handleToggle(dept._id)}
                      >
                        {dept.isActive ? 'Pasif Yap' : 'Aktif Yap'}
                      </button>
                      <button 
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(dept._id)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center">Henüz departman yok</td>
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
              <h3 className="modal-title">
                {editMode ? 'Departman Düzenle' : 'Yeni Departman Ekle'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="form-group">
              <label className="form-label">Departman Adı</label>
              <input
                type="text"
                className="form-input"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Örn: İnsan Kaynakları"
                autoFocus
              />
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>
                İptal
              </button>
              <button 
                className="btn btn-success" 
                onClick={handleSave}
                disabled={saving || !newName.trim()}
              >
                {saving ? 'Kaydediliyor...' : (editMode ? 'Güncelle' : 'Ekle')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
