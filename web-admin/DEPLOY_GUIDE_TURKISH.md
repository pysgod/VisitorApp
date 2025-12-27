# Web Admin Paneli VPS Dağıtım Rehberi

Bu rehber, Web Admin panelini VPS sunucunuzda yayınlamanız için gerekli adımları içerir.

## 1. Hazırlık

VPS sunucunuzda Node.js, NPM ve Nginx'in kurulu olduğundan emin olun.
Projenin GitHub'da güncel olduğundan emin olun (az önce push edildi).

## 2. Sunucuda Projeyi Güncelleme

VPS sunucunuza SSH ile bağlanın ve proje klasörüne gidin (örneğin `/var/www/visitor-app`):

```bash
cd /path/to/visitor-app
git pull origin main
```

## 3. Web Admin Panelini Derleme (Build)

Web admin klasörüne gidin, bağımlılıkları yükleyin ve build alın:

```bash
cd web-admin
npm install
npm run build
```

Bu işlem sonucunda `dist` klasörü oluşturulacaktır. Bu klasör, yayınlanacak statik dosyaları içerir.

## 4. Nginx Yapılandırması

Proje içerisinde sizin için hazırladığım `nginx.conf` dosyasını kullanabilirsiniz.

1. Nginx konfigürasyon dosyasını oluşturun veya düzenleyin:
   ```bash
   sudo nano /etc/nginx/sites-available/visitor-app
   ```

2. `visitor-app` klasöründeki `nginx.conf` içeriğini kopyalayıp bu dosyaya yapıştırın. `server_name` kısmını kendi domain veya IP adresinizle değiştirmeyi unutmayın. Ayrıca `root` yolunun sunucudaki gerçek yolla eşleştiğinden emin olun.

3. Konfigürasyonu aktif edin:
   ```bash
   sudo ln -s /etc/nginx/sites-available/visitor-app /etc/nginx/sites-enabled/
   ```

4. Nginx konfigürasyonunu test edin ve yeniden başlatın:
   ```bash
   sudo nginx -t
   sudo systemctl restart nginx
   ```

## 5. Backend Kontrolü

Backend servisinin çalıştığından emin olun (genellikle PM2 ile yönetilir):

```bash
pm2 list
# Eğer çalışmıyorsa:
cd ../backend
pm2 start src/server.js --name "visitor-backend"
```
