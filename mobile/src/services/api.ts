import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API_URL from '../config/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token ekle
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 401 (Unauthorized) kontrolü için interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      // 401 hatası alındığında token'ı sil
      await authService.logout();
      // Uygulamayı haberdar et (basit bir event sistemi veya callback)
      if (onUnauthorizedCallback) {
        onUnauthorizedCallback();
      }
    }
    return Promise.reject(error);
  }
);

let onUnauthorizedCallback: (() => void) | null = null;

export const setOnUnauthorized = (callback: () => void) => {
  onUnauthorizedCallback = callback;
};

// Auth Service
export const authService = {
  login: async (loginCode: string) => {
    const response = await api.post('/auth/staff/login', { loginCode });
    if (response.data.token) {
      await AsyncStorage.setItem('token', response.data.token);
      await AsyncStorage.setItem('staff', JSON.stringify(response.data.staff));
    }
    return response.data;
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('staff');
  },
  
  getStaff: async () => {
    const staff = await AsyncStorage.getItem('staff');
    return staff ? JSON.parse(staff) : null;
  },
  
  isLoggedIn: async () => {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  },
};

// Department Service
export const departmentService = {
  getAll: async () => {
    const response = await api.get('/departments?activeOnly=true');
    return response.data;
  },
};

// Visitor Service
export const visitorService = {
  getActive: async () => {
    const response = await api.get('/visitors/active');
    return response.data;
  },
  
  create: async (visitorData: any) => {
    const response = await api.post('/visitors', visitorData);
    return response.data;
  },
  
  exit: async (id: string) => {
    const response = await api.put(`/visitors/${id}/exit`);
    return response.data;
  },
  
  uploadPhoto: async (photo: any) => {
    const formData = new FormData();
    formData.append('photo', {
      uri: photo.uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    
    const response = await api.post('/visitors/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// Vehicle Service
export const vehicleService = {
  getActive: async () => {
    const response = await api.get('/vehicles/active');
    return response.data;
  },
  
  create: async (vehicleData: any) => {
    const response = await api.post('/vehicles', vehicleData);
    return response.data;
  },
  
  exit: async (id: string) => {
    const response = await api.put(`/vehicles/${id}/exit`);
    return response.data;
  },
  
  uploadPhoto: async (photo: any) => {
    const formData = new FormData();
    formData.append('photo', {
      uri: photo.uri,
      type: 'image/jpeg',
      name: 'photo.jpg',
    } as any);
    
    const response = await api.post('/vehicles/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

// OCR Service
export const ocrService = {
  recognizePlate: async (imageUrl: string) => {
    const response = await api.post('/ocr/plate', { imageUrl });
    return response.data;
  },
};

export default api;
