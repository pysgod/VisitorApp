# Ziyaretçi Yönetim Sistemi - Web Admin Panel

React tabanlı web yönetici paneli. Tarayıcı üzerinden çalışan, kurulum gerektirmeyen modern admin arayüzü.

## Özellikler

- 📊 Dashboard - Ziyaretçi ve araç istatistikleri
- 👥 Ziyaretçi Raporları - Filtreleme, Excel export
- 🚗 Araç Kayıtları - Plaka arama, CSV export
- 👤 Personel Yönetimi - CRUD, giriş kodu yönetimi
- 🏬 Departman Yönetimi - CRUD işlemleri
- 🔐 JWT tabanlı kimlik doğrulama

## Kurulum

```bash
# Bağımlılıkları yükle
npm install

# Development server başlat
npm run dev

# Production build
npm run build
```

## Environment Değişkenleri

### Development (.env.development)
```env
VITE_API_URL=http://localhost:5000/api
VITE_ENV=development
```

### Production (.env.production)
```env
VITE_API_URL=https://api.domain.com/api
VITE_ENV=production
```

## Deploy

### Vercel

1. GitHub'a push edin
2. Vercel'de import edin
3. Environment Variables ekleyin:
   - `VITE_API_URL`: Production API URL

### Netlify

1. GitHub'a push edin
2. Netlify'da import edin
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Environment Variables ekleyin

## Teknolojiler

- React 18
- Vite
- React Router DOM
- Axios
- Chart.js + react-chartjs-2
- Modern CSS (CSS Variables, Flexbox, Grid)

## Proje Yapısı

```
src/
├── components/
│   ├── Layout.jsx          # Sidebar + main layout
│   └── ProtectedRoute.jsx  # Auth guard
├── contexts/
│   └── AuthContext.jsx     # Global auth state
├── pages/
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── VisitorsPage.jsx
│   ├── VehiclesPage.jsx
│   ├── StaffPage.jsx
│   └── DepartmentsPage.jsx
├── services/
│   └── api.js              # Axios + all API services
├── App.jsx
├── main.jsx
└── index.css               # Global styles
```

## API Entegrasyonu

Panel aşağıdaki backend endpoint'lerini kullanır:

- `POST /auth/admin/login` - Admin girişi
- `POST /auth/admin/register` - Admin kaydı
- `GET /reports/dashboard` - Dashboard verileri
- `GET /visitors` - Ziyaretçi listesi
- `GET /vehicles` - Araç listesi
- `GET/POST/PUT/DELETE /staff` - Personel CRUD
- `GET/POST/PUT/DELETE /departments` - Departman CRUD
