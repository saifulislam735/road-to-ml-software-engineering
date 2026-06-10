import axios from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout')
};

export const userApi = {
  getProfile: (username) => api.get(`/users/${username}`),
  updateMe: (data) => api.patch('/users/me', data)
};

export const duaApi = {
  send: (username, data) => api.post(`/duas/send/${username}`, data),
  getInbox: (params) => api.get('/duas/inbox', { params }),
  markRead: (id) => api.patch(`/duas/${id}/read`),
  delete: (id) => api.delete(`/duas/${id}`),
  report: (id, data) => api.post(`/duas/${id}/report`, data)
};

export const adminApi = {
  getStats: (params) => api.get('/admin/stats', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  banUser: (id, data) => api.patch(`/admin/users/${id}/ban`, data),
  unbanUser: (id) => api.patch(`/admin/users/${id}/unban`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getDuas: (params) => api.get('/admin/duas', { params }),
  hideDua: (id) => api.patch(`/admin/duas/${id}/hide`),
  unhideDua: (id) => api.patch(`/admin/duas/${id}/unhide`),
  deleteDua: (id) => api.delete(`/admin/duas/${id}`),
  getReports: (params) => api.get('/admin/reports', { params }),
  resolveReport: (id, data) => api.patch(`/admin/reports/${id}/resolve`, data),
  dismissReport: (id) => api.patch(`/admin/reports/${id}/dismiss`)
};
