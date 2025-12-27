import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { authService } from '../services/api';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const [code1, setCode1] = useState('');
  const [code2, setCode2] = useState('');
  const [code3, setCode3] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    const loginCode = `${code1}-${code2}-${code3}`.toUpperCase();
    
    if (loginCode.length !== 9) {
      Alert.alert('Hata', 'Lütfen giriş kodunu tam olarak girin');
      return;
    }
    
    setLoading(true);
    try {
      await authService.login(loginCode);
      onLoginSuccess();
    } catch (error: any) {
      console.error('Login Error:', error);
      const msg = error.response?.data?.message 
        || (error.message === 'Network Error' ? 'Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edin.' : error.message);
      
      Alert.alert('Giriş Başarısız', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.title}>Ziyaretçi Kayıt Sistemi</Text>
          <Text style={styles.subtitle}>Personel Girişi</Text>
        </View>

        <View style={styles.codeContainer}>
          <Text style={styles.label}>Giriş Kodunuzu Girin</Text>
          <View style={styles.codeInputs}>
            <TextInput
              style={styles.codeInput}
              maxLength={3}
              value={code1}
              onChangeText={(text) => setCode1(text.toUpperCase())}
              placeholder="XXX"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={styles.separator}>-</Text>
            <TextInput
              style={styles.codeInput}
              maxLength={3}
              value={code2}
              onChangeText={(text) => setCode2(text.toUpperCase())}
              placeholder="XXX"
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Text style={styles.separator}>-</Text>
            <TextInput
              style={styles.codeInput}
              maxLength={1}
              value={code3}
              onChangeText={(text) => setCode3(text.toUpperCase())}
              placeholder="X"
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Text style={styles.buttonText}>GİRİŞ YAP</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a237e',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 24,
    color: '#90caf9',
    textAlign: 'center',
  },
  codeContainer: {
    width: '100%',
    maxWidth: 500,
    marginBottom: 40,
  },
  label: {
    fontSize: 20,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
  },
  codeInputs: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  codeInput: {
    backgroundColor: '#fff',
    width: 100,
    height: 80,
    borderRadius: 12,
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1a237e',
  },
  separator: {
    fontSize: 48,
    color: '#fff',
    marginHorizontal: 10,
  },
  button: {
    backgroundColor: '#4caf50',
    paddingVertical: 20,
    paddingHorizontal: 80,
    borderRadius: 12,
    minWidth: 300,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#81c784',
  },
  buttonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
});
