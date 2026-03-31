import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

console.log('🔗 API Base URL:', API_BASE_URL);

const agentApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Token interceptor
agentApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('agentToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ SAB FUNCTIONS EK OBJECT ME
export const agentService = {

  // 🔐 Login
  login: async (email, password) => {
    const response = await agentApi.post('/api/agents/login', { email, password });
    return response.data;
  },

  // Profile
  getProfile: async () => {
    const response = await agentApi.get('/api/agents/profile');
    return response.data;
  },

  updateProfile: async (formData) => {
    const response = await agentApi.put('/api/agents/profile-update', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  // Dashboard
  getDashboard: async () => {
    const response = await agentApi.get('/api/agents/dashboard');
    return response.data;
  },

  // Report
  getReport: async () => {
    const response = await agentApi.get('/api/agents/report');
    return response.data;
  },

  // 🔍 Search Cabs
  searchCabs: async (data) => {
    const response = await agentApi.post('/api/bookings/search-cabs', data);
    return response.data;
  },

  // 🎫 Create Booking
  createBooking: async (data) => {
    const response = await agentApi.post('/api/bookings/create', data);
    return response.data;
  },

  // 📄 Get Bookings
  getMyBookings: async () => {
    const response = await agentApi.get('/api/bookings/my-bookings');
    return response.data;
  },

  // ❌ Cancel Booking
  cancelBooking: async (bookingId, reason) => {
    const response = await agentApi.put(`/api/bookings/cancel/${bookingId}`, { reason });
    return response.data;
  },

  // Wallet
  getWalletBalance: async () => {
    const response = await agentApi.get('/api/wallet/my-wallet');
    return response.data;
  },

  requestWithdrawal: async (amount, description) => {
    const response = await agentApi.post('/api/wallet/withdraw', { amount, description });
    return response.data;
  },

  // Notifications
  getNotifications: async () => {
    const response = await agentApi.get('/api/notifications/my-notifications');
    return response.data;
  },

  // Download Report
  downloadReport: async (format = 'pdf') => {
    const response = await agentApi.get(`/api/agents/report/download?format=${format}`, {
      responseType: 'blob'
    });
    return response;
  }

};