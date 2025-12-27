import React, { useState, useEffect, useCallback } from 'react';
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
    return <div className="text-center mt-20">Yükleniyor...</div>;
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
    <div style={{ display: 'flex', gap: '8px' }}>
      {['day', 'week', 'month', 'year'].map(p => (
        <button
          key={p}
          onClick={() => onChange(p)}
          style={{
            padding: '6px 12px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '12px',
            fontWeight: '500',
            backgroundColor: value === p ? color : '#f0f0f0',
            color: value === p ? '#fff' : '#666',
            transition: 'all 0.2s'
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
        <span style={{ color: '#666' }}>
          {new Date().toLocaleDateString('tr-TR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </span>
      </div>

      {/* ============ ZİYARETÇİ DASHBOARD ============ */}
      <div style={{ marginBottom: '40px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#1976d2', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>👥</span> Ziyaretçi İstatistikleri
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

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginTop: '24px' }}>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Ziyaretçi Giriş / Çıkış</h3>
              <PeriodFilter value={visitorPeriod} onChange={setVisitorPeriod} color="#1976d2" />
            </div>
            <div style={{ height: '280px' }}>
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
            <div style={{ height: '280px' }}>
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
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '20px', color: '#ff9800', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '28px' }}>🚗</span> Araç İstatistikleri
        </h2>

        <div className="stats-grid">
          <div className="stat-card" style={{ borderLeft: '4px solid #ff9800' }}>
            <div className="stat-icon" style={{ background: '#fff3e0', color: '#ff9800' }}>🚗</div>
            <div className="stat-info">
              <h3>{stats?.todayVehicles || 0}</h3>
              <p>Bugün Giriş Yapan</p>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #ff9800' }}>
            <div className="stat-icon" style={{ background: '#e8f5e9', color: '#388e3c' }}>🅿️</div>
            <div className="stat-info">
              <h3>{stats?.activeVehicles || 0}</h3>
              <p>Aktif Araç</p>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #ff9800' }}>
            <div className="stat-icon" style={{ background: '#ede7f6', color: '#7b1fa2' }}>🚙</div>
            <div className="stat-info">
              <h3>{stats?.todayVehicleExited || 0}</h3>
              <p>Bugün Çıkış Yapan</p>
            </div>
          </div>
          <div className="stat-card" style={{ borderLeft: '4px solid #ff9800' }}>
            <div className="stat-icon" style={{ background: '#fce4ec', color: '#c62828' }}>📋</div>
            <div className="stat-info">
              <h3>{stats?.totalVehicles || 0}</h3>
              <p>Toplam Kayıt</p>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: '24px' }}>
          <div className="card-header">
            <h3 className="card-title">Araç Giriş / Çıkış</h3>
            <PeriodFilter value={vehiclePeriod} onChange={setVehiclePeriod} color="#ff9800" />
          </div>
          <div style={{ height: '280px' }}>
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
