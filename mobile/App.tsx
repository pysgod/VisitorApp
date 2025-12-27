import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, Platform } from 'react-native';
import { useKeepAwake } from 'expo-keep-awake';
import * as NavigationBar from 'expo-navigation-bar';
import * as ScreenOrientation from 'expo-screen-orientation';
import { authService, setOnUnauthorized } from './src/services/api';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';

export default function App() {
  useKeepAwake(); // Ekranın kapanmasını engelle
  
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupKioskMode();
    checkAuth();
    
    // 401 hatası global logout tetikleyecek
    setOnUnauthorized(() => {
      setIsLoggedIn(false);
    });
  }, []);

  const setupKioskMode = async () => {
    try {
      // Hem yatay hem dikey modu destekle - oryantasyon kilidi kaldırıldı
      await ScreenOrientation.unlockAsync();

      if (Platform.OS === 'android') {
        // Navigasyon barını (alt butonları) gizle
        await NavigationBar.setVisibilityAsync('hidden');
        await NavigationBar.setBehaviorAsync('overlay-swipe');
        await NavigationBar.setBackgroundColorAsync('#00000000');
      }
    } catch (error) {
      console.log('Kiosk mode setup failed:', error);
    }
  };

  const checkAuth = async () => {
    try {
      const loggedIn = await authService.isLoggedIn();
      setIsLoggedIn(loggedIn);
    } catch (error) {
      setIsLoggedIn(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  if (loading) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {/* Status bar'ı gizle */}
        <StatusBar hidden={true} />
        {isLoggedIn ? (
          <HomeScreen onLogout={handleLogout} />
        ) : (
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e',
  },
});
