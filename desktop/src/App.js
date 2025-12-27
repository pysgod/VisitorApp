import React, { useState, useEffect } from 'react';
import { authService } from './services/api';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import StaffPage from './pages/StaffPage';
import DepartmentPage from './pages/DepartmentPage';
import VisitorsPage from './pages/VisitorsPage';
import VehiclesPage from './pages/VehiclesPage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loggedIn = authService.isLoggedIn();
    setIsLoggedIn(loggedIn);
    if (loggedIn) {
      setUser(authService.getUser());
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setUser(authService.getUser());
  };

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setUser(null);
  };

  if (!isLoggedIn) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'staff':
        return <StaffPage />;
      case 'departments':
        return <DepartmentPage />;
      case 'visitors':
        return <VisitorsPage />;
      case 'vehicles':
        return <VehiclesPage />;
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h1 className="sidebar-title">🏢 Ziyaretçi Sistemi</h1>
          <p className="sidebar-subtitle">Yönetici Paneli</p>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-item ${currentPage === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentPage('dashboard')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button
            className={`nav-item ${currentPage === 'visitors' ? 'active' : ''}`}
            onClick={() => setCurrentPage('visitors')}
          >
            <span className="nav-icon">👥</span>
            Ziyaretçi Raporları
          </button>
          <button
            className={`nav-item ${currentPage === 'vehicles' ? 'active' : ''}`}
            onClick={() => setCurrentPage('vehicles')}
          >
            <span className="nav-icon">🚗</span>
            Araç Kayıtları
          </button>
          <button
            className={`nav-item ${currentPage === 'staff' ? 'active' : ''}`}
            onClick={() => setCurrentPage('staff')}
          >
            <span className="nav-icon">👤</span>
            Personel Yönetimi
          </button>
          <button
            className={`nav-item ${currentPage === 'departments' ? 'active' : ''}`}
            onClick={() => setCurrentPage('departments')}
          >
            <span className="nav-icon">🏬</span>
            Departman Yönetimi
          </button>
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
        {renderPage()}
      </main>
    </div>
  );
}
