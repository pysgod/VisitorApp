import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: '📊', label: 'Grafik Paneli' },
    { path: '/visitors', icon: '👥', label: 'Ziyaretçi Raporları' },
    { path: '/vehicles', icon: '🚗', label: 'Araç Raporları' },
    { path: '/staff', icon: '👤', label: 'Personel Yönetimi' },
    { path: '/departments', icon: '🏬', label: 'Departman Yönetimi' },
  ];

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">🏢 Ziyaretçi Sistemi</h1>
          <p className="sidebar-subtitle">Yönetici Paneli</p>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              end={item.path === '/'}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase() || 'Y'}
            </div>
            <div>
              <div className="user-name">{user?.name || 'Yönetici'}</div>
              <div className="user-role">Yönetici</div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            🚪 Çıkış Yap
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
