# Ziyaretçi Yönetim Sistemi

Şirketlere gelen ziyaretçilerin kayıt ve takibi için kapsamlı bir uygulama.

## Teknolojiler

| Katman | Teknoloji |
|--------|-----------|
| Backend | Node.js + Express + MongoDB |
| Mobile | Expo React Native (Android) |
| Desktop | Electron + React |
| Görsel | Cloudinary |

## Kurulum

### 1. Backend

```bash
cd backend
npm install

# .env dosyasını düzenleyin
# MongoDB ve Cloudinary bilgilerinizi ekleyin

npm run dev
```

### 2. Mobile (Android)

```bash
cd mobile
npm install

# src/config/api.ts dosyasında API URL'ini güncelleyin

npm start
# veya
npx expo start
```

### 3. Desktop (Yönetici)

```bash
cd desktop
npm install

npm start  # React dev server
# Yeni terminal:
npm run start  # Electron (react çalışırken)
```

## Kullanıcı Türleri

### Personel (Mobil)
- Kod ile giriş (XXX-XXX-X)
- Ziyaretçi kaydı oluşturma
- Fotoğraf çekme
- Çıkış işlemi

### Yönetici (Desktop)
- Email/şifre ile giriş
- Dashboard ve grafikler
- Personel yönetimi
- Departman yönetimi
- Raporlar ve Excel export

## API Endpoints

| Method | Endpoint | Açıklama |
|--------|----------|----------|
| POST | /api/auth/admin/login | Yönetici girişi |
| POST | /api/auth/staff/login | Personel girişi |
| GET/POST | /api/staff | Personel CRUD |
| GET/POST | /api/departments | Departman CRUD |
| GET/POST | /api/visitors | Ziyaretçi CRUD |
| GET | /api/reports/dashboard | Dashboard |
| GET | /api/reports/export | Excel export |

## Proje Yapısı

```
VisitorApp/
├── backend/          # Express API
├── mobile/           # Expo React Native
└── desktop/          # Electron + React
```
