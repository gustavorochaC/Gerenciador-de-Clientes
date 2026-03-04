import axios from 'axios';
import {
  mockAuthApi,
  mockClientsApi,
  mockLoansApi,
  mockInstallmentsApi,
  mockDashboardApi,
  mockAlertsApi,
  mockReportsApi,
  mockTransactionsApi
} from './mock/mockApi';

// Set this to true to use the mock API instead of the real backend
const USE_MOCK_API = false;

// Em produção (Vercel etc.): use VITE_API_URL. Em dev: /api (proxy do Vite).
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/api`
  : '/api';

const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ========== EXPORTS ==========
export const authApi = USE_MOCK_API ? mockAuthApi : {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const clientsApi = USE_MOCK_API ? mockClientsApi : {
  list: (params?: any) => api.get('/clients', { params }),
  get: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.put(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  uploadDocument: (id: string, data: any) => api.post(`/clients/${id}/documents`, data),
  deleteDocument: (id: string, docId: string) => api.delete(`/clients/${id}/documents/${docId}`),
};

export const loansApi = USE_MOCK_API ? mockLoansApi : {
  list: (params?: any) => api.get('/loans', { params }),
  get: (id: string) => api.get(`/loans/${id}`),
  create: (data: any) => api.post('/loans', data),
  update: (id: string, data: any) => api.put(`/loans/${id}`, data),
  updateStatus: (id: string, status: string) => api.patch(`/loans/${id}/status`, { status }),
  delete: (id: string) => api.delete(`/loans/${id}`),
};

export const installmentsApi = USE_MOCK_API ? mockInstallmentsApi : {
  list: (loanId: string) => api.get(`/loans/${loanId}/installments`),
  pay: (id: string, data: any) => api.patch(`/installments/${id}/pay`, data),
  updateStatus: (id: string, status: string) => api.patch(`/installments/${id}/status`, { status }),
};

export const dashboardApi = USE_MOCK_API ? mockDashboardApi : {
  summary: () => api.get('/dashboard/summary'),
  chart: () => api.get('/dashboard/chart'),
};

export const alertsApi = USE_MOCK_API ? mockAlertsApi : {
  list: (unreadOnly?: boolean) => api.get('/alerts', { params: { unread_only: unreadOnly } }),
  markAsRead: (id: string) => api.patch(`/alerts/${id}/read`),
  markAllAsRead: () => api.patch('/alerts/read-all'),
};

export const reportsApi = USE_MOCK_API ? mockReportsApi : {
  clientReport: (id: string) => api.get(`/reports/pdf/client/${id}`),
  generalReport: (params?: any) => api.get('/reports/pdf/general', { params }),
};

export const transactionsApi = USE_MOCK_API ? mockTransactionsApi : {
  list: (params?: any) => api.get('/transactions', { params }),
};

/** Extrai mensagem de erro da resposta da API (evita renderizar objeto no React). */
export function getApiErrorMessage(err: any, fallback = 'Erro na requisição'): string {
  if (!err) return fallback;
  const d = err.response?.data;
  if (typeof d?.error === 'string') return d.error;
  if (typeof d?.message === 'string') return d.message;
  if (typeof err.message === 'string') return err.message;
  return fallback;
}

export default api;
