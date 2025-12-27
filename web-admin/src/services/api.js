import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth Service
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/admin/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  register: async (name, email, password) => {
    const response = await api.post('/auth/admin/register', { name, email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  getToken: () => localStorage.getItem('token'),
  
  isLoggedIn: () => !!localStorage.getItem('token'),
};

// Staff Service
export const staffService = {
  getAll: () => api.get('/staff'),
  get: (id) => api.get(`/staff/${id}`),
  create: (name) => api.post('/staff', { name }),
  update: (id, name) => api.put(`/staff/${id}`, { name }),
  toggle: (id) => api.put(`/staff/${id}/toggle`),
  delete: (id) => api.delete(`/staff/${id}`),
  regenerateCode: (id) => api.put(`/staff/${id}/regenerate-code`),
};

// Department Service
export const departmentService = {
  getAll: () => api.get('/departments'),
  get: (id) => api.get(`/departments/${id}`),
  create: (name) => api.post('/departments', { name }),
  update: (id, data) => api.put(`/departments/${id}`, data),
  toggle: (id) => api.put(`/departments/${id}/toggle`),
  delete: (id) => api.delete(`/departments/${id}`),
};

// Visitor Service
export const visitorService = {
  getAll: (params) => api.get('/visitors', { params }),
  getActive: () => api.get('/visitors/active'),
  get: (id) => api.get(`/visitors/${id}`),
  exit: (id) => api.put(`/visitors/${id}/exit`),
};

// Report Service
export const reportService = {
  getDashboard: (visitorPeriod = 'week', vehiclePeriod = 'week') => 
    api.get('/reports/dashboard', { params: { visitorPeriod, vehiclePeriod } }),
  getStats: (period) => api.get('/reports/stats', { params: { period } }),
  exportExcel: (params) => api.get('/reports/export', { 
    params,
    responseType: 'blob'
  }),
  exportVehiclesExcel: (params) => api.get('/reports/vehicles/export', { 
    params,
    responseType: 'blob'
  }),
};

// Vehicle Service
export const vehicleService = {
  getAll: (params) => api.get('/vehicles', { params }),
  getActive: () => api.get('/vehicles/active'),
  get: (id) => api.get(`/vehicles/${id}`),
  exit: (id) => api.put(`/vehicles/${id}/exit`),
};

export default api;
