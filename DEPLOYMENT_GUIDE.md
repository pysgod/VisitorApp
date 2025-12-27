# 🚀 Ziyaretçi Yönetim Sistemi - Yayınlama (Publish) Rehberi

Bu proje 3 ana parçadan oluşur: Backend, Masaüstü Uygulaması ve Mobil Uygulama. Hepsini canlı kullanıma almak için aşağıdaki adımları takip edin.

---

## 🖥️ 1. Adım: Backend (Sunucu) Kurulumu

Backend'in sürekli çalışması için `pm2` gibi bir işlem yöneticisi kullanacağız. Bu sayede bilgisayar yeniden başlatılsa bile sunucu otomatik açılır.

### 1.1 PM2 Kurulumuc
Backend klasöründeyken terminalde şu komutu çalıştırın:

```powershell
npm install -g pm2
```

### 1.2 Sunucuyu Başlatma
Backend klasöründe (`backend/`):

```powershell
# Sunucuyu başlat ve isimlendir
pm2 start src/server.js --name "visitor-backend"

# Windows başlangıcına ekle (Yönetici olarak çalıştırın)
npm install pm2-windows-startup -g
pm2-startup install
pm2 save
```

*(Not: `pm2 startup` komutu size bir kod verebilir, o kodu terminale yapıştırıp çalıştırın.)*

**Backend artık arkaplanda `5000` portunda çalışıyor!**

---

## 💻 2. Adım: Masaüstü Uygulaması (exe) Oluşturma

Masaüstü uygulamasını `.exe` formatına çevirmek için `electron-builder` kullanacağız.

### 2.1 API Ayarı
`desktop/src/config/api.js` dosyasını kontrol edin. Eğer uygulama sadece ana bilgisayarda çalışacaksa `localhost` kalabilir. Başka bilgisayarlara da kurulacaksa sunucu bilgisayarın IP adresini yazın (örn: `http://192.168.1.100:5000/api`).

### 2.2 Build İşlemi
Desktop klasöründe (`desktop/`):

```powershell
npm run electron-build
```

Bu işlem tamamlandığında `desktop/dist` klasörü içinde **`Ziyaretci Yonetim Sistemi Setup 1.0.0.exe`** dosyası oluşacaktır. Bu dosyayı kurarak kullanabilirsiniz.

---

## 📱 3. Adım: Mobil Uygulama (APK) Oluşturma

Kiosk tabletlere yüklemek için Android APK dosyası oluşturacağız. Bunun için Expo EAS Build servisi kullanılır.

### 3.1 EAS CLI Kurulumu
```powershell
npm install -g eas-cli
```

### 3.2 Build İşlemi
Mobile klasöründe (`mobile/`):

1. Expo hesabınıza giriş yapın (hesabınız yoksa expo.dev'den açın):
   ```powershell
   eas login
   ```

2. Projeyi yapılandırın (Sadece ilk seferde):
   ```powershell
   eas build:configure
   ```

3. APK Oluşturun:
   ```powershell
   eas build -p android --profile preview
   ```

Bu işlem bulutta gerçekleşir ve size bir **indirme linki** verir. O linkten `.apk` dosyasını indirip tabletlere kurabilirsiniz.

---

## 4. Önemli Notlar

*   **IP Adresi Sabitleme:** Sunucu olarak kullandığınız bilgisayarın IP adresi (örn: `192.168.1.100`) değişirse mobil uygulama bağlanamaz. Modemde bu IP'yi sabitlemeniz (Static IP) önerilir.
*   **Firewall:** Windows Güvenlik Duvarı'nın `5000` portuna (Node.js) izin verdiğinden emin olun.
*   **Fotoğraflar:** Çekilen fotoğraflar Cloudinary'de tutulur, internet bağlantısı şarttır.

Başarılar! 🚀
