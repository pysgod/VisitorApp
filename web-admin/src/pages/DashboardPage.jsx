import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { reportService } from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [visitorPeriod, setVisitorPeriod] = useState('week');
  const [vehiclePeriod, setVehiclePeriod] = useState('week');

  useEffect(() => {
    loadDashboard();
  }, [visitorPeriod, vehiclePeriod]);

  const loadDashboard = async () => {
    try {
      const response = await reportService.getDashboard(visitorPeriod, vehiclePeriod);
      setStats(response.data.data);
    } catch (error) {
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
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

  // Ziyaretçi Grafik Verisi
  const visitorBarData = {
    labels: stats?.visitorDailyStats?.map(d => d._id) || [],
    datasets: [
      {
        label: 'Giriş',
        data: stats?.visitorDailyStats?.map(d => d.entries) || [],
        backgroundColor: '#4caf50',
      },
      {
        label: 'Çıkış',
        data: stats?.visitorDailyStats?.map(d => d.exits) || [],
        backgroundColor: '#2196f3',
      },
    ],
  };

  // Araç Grafik Verisi
  const vehicleBarData = {
    labels: stats?.vehicleDailyStats?.map(d => d._id) || [],
    datasets: [
      {
        label: 'Giriş',
        data: stats?.vehicleDailyStats?.map(d => d.entries) || [],
        backgroundColor: '#ff9800',
      },
      {
        label: 'Çıkış',
        data: stats?.vehicleDailyStats?.map(d => d.exits) || [],
        backgroundColor: '#9c27b0',
      },
    ],
  };

  // Departman Donut Verisi
  const doughnutData = {
    labels: stats?.topDepartments?.map(d => d.department) || [],
    datasets: [{
      data: stats?.topDepartments?.map(d => d.count) || [],
      backgroundColor: ['#1976d2', '#388e3c', '#f57c00', '#7b1fa2', '#c62828'],
    }],
  };

  const periodLabels = {
    day: 'Günlük',
    week: 'Haftalık',
    month: 'Aylık',
    year: 'Yıllık'
  };

  const PeriodFilter = ({ value, onChange, color }) => (
    <div className="period-filter">
      {['day', 'week', 'month', 'year'].map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          className={`period-btn ${value === p ? 'active' : ''}`}
          style={{
            '--active-color': color
          }}
        >
          {periodLabels[p]}
        </button>
      ))}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span className="page-date">
          {new Date().toLocaleDateString('tr-TR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
      </div>

      {/* ============ ZİYARETÇİ DASHBOARD ============ */}
      <div className="dashboard-section">
        <h2 className="section-title visitor-title">
          <span className="section-icon">👥</span> Ziyaretçi İstatistikleri
        </h2>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon blue">👥</div>
            <div className="stat-info">
              <h3>{stats?.todayVisitors || 0}</h3>
              <p>Bugünkü Ziyaretçi</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green">✓</div>
            <div className="stat-info">
              <h3>{stats?.activeVisitors || 0}</h3>
              <p>Aktif Ziyaretçi</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon orange">↩</div>
            <div className="stat-info">
              <h3>{stats?.todayVisitorExited || 0}</h3>
              <p>Bugün Çıkış Yapan</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple">📊</div>
            <div className="stat-info">
              <h3>{stats?.totalVisitors || 0}</h3>
              <p>Toplam Kayıt</p>
            </div>
          </div>
        </div>

        <div className="charts-grid">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Ziyaretçi Giriş / Çıkış</h3>
              <PeriodFilter value={visitorPeriod} onChange={setVisitorPeriod} color="#1976d2" />
            </div>
            <div className="chart-container">
              <Bar
                data={visitorBarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'top' } },
                }}
              />
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">En Çok Ziyaret Edilen</h3>
            </div>
            <div className="chart-container">
              <Doughnut
                data={doughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { position: 'bottom' } },
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ============ ARAÇ DASHBOARD ============ */}
      <div className="dashboard-section">
        <h2 className="section-title vehicle-title">
          <span className="section-icon">🚗</span> Araç İstatistikleri
        </h2>

        <div className="stats-grid">
          <div className="stat-card vehicle-stat">
            <div className="stat-icon" style={{ background: '#fff3e0', color: '#ff9800' }}>🚗</div>
            <div className="stat-info">
              <h3>{stats?.todayVehicles || 0}</h3>
              <p>Bugün Giriş Yapan</p>
            </div>
          </div>
          <div className="stat-card vehicle-stat">
            <div className="stat-icon" style={{ background: '#e8f5e9', color: '#388e3c' }}>🅿️</div>
            <div className="stat-info">
              <h3>{stats?.activeVehicles || 0}</h3>
              <p>Aktif Araç</p>
            </div>
          </div>
          <div className="stat-card vehicle-stat">
            <div className="stat-icon" style={{ background: '#ede7f6', color: '#7b1fa2' }}>🚙</div>
            <div className="stat-info">
              <h3>{stats?.todayVehicleExited || 0}</h3>
              <p>Bugün Çıkış Yapan</p>
            </div>
          </div>
          <div className="stat-card vehicle-stat">
            <div className="stat-icon" style={{ background: '#fce4ec', color: '#c62828' }}>📋</div>
            <div className="stat-info">
              <h3>{stats?.totalVehicles || 0}</h3>
              <p>Toplam Kayıt</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Araç Giriş / Çıkış</h3>
            <PeriodFilter value={vehiclePeriod} onChange={setVehiclePeriod} color="#ff9800" />
          </div>
          <div className="chart-container">
            <Bar
              data={vehicleBarData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: 'top' } },
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
