const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

// Network security config dosyasını kopyala
const withNetworkSecurityConfig = (config) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      const resPath = path.join(config.modRequest.platformProjectRoot, 'app', 'src', 'main', 'res', 'xml');
      
      // xml klasörünü oluştur
      if (!fs.existsSync(resPath)) {
        fs.mkdirSync(resPath, { recursive: true });
      }

      // network_security_config.xml dosyasını kopyala
      const sourcePath = path.join(__dirname, '..', 'android-resources', 'network_security_config.xml');
      const destPath = path.join(resPath, 'network_security_config.xml');
      
      if (fs.existsSync(sourcePath)) {
        fs.copyFileSync(sourcePath, destPath);
        console.log('Network security config copied successfully');
      }

      return config;
    },
  ]);
};

// AndroidManifest.xml'e networkSecurityConfig ekle
const withNetworkSecurityManifest = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    
    // application tag'ine networkSecurityConfig ekle
    const application = androidManifest.manifest.application[0];
    application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    
    return config;
  });
};

module.exports = (config) => {
  config = withNetworkSecurityConfig(config);
  config = withNetworkSecurityManifest(config);
  return config;
};
