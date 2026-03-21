import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// ── REQUEST INTERCEPTOR: attach token ──
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// ── RESPONSE INTERCEPTOR: handle 401 / token refresh ──
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && error.response?.data?.code === 'TOKEN_EXPIRED') {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`;
          return api(original);
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        const newToken = data.data.accessToken;
        localStorage.setItem('accessToken', newToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        processQueue(null, newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        localStorage.clear();
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);

// ── API METHODS ──
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  sendOTP: (mobile) => api.post('/auth/send-otp', { mobile }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  changePassword: (data) => api.put('/users/change-password', data),
  getReferral: () => api.get('/users/referral'),
};

export const kycAPI = {
  getStatus: () => api.get('/kyc/status'),
  submitPersonal: (data) => api.put('/kyc/personal', data),
  submitPAN: (data) => api.put('/kyc/pan', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submitAadhaar: (data) => api.put('/kyc/aadhaar', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submitBank: (data) => api.put('/kyc/bank', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submitSelfie: (data) => api.put('/kyc/selfie', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  submitFinal: () => api.post('/kyc/submit'),
};

export const stockAPI = {
  getAll: (params) => api.get('/stocks', { params }),
  getOne: (symbol) => api.get(`/stocks/${symbol}`),
  getHistory: (symbol) => api.get(`/stocks/${symbol}/history`),
  getIndices: () => api.get('/stocks/meta/indices'),
};

export const tradeAPI = {
  placeOrder: (data) => api.post('/trades/order', data),
  getOrders: (params) => api.get('/trades/orders', { params }),
  getHoldings: () => api.get('/trades/holdings'),
  cancelOrder: (orderId) => api.delete(`/trades/orders/${orderId}`),
};

export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  addFunds: (data) => api.post('/wallet/add', data),
  withdraw: (data) => api.post('/wallet/withdraw', data),
  getWithdrawals: () => api.get('/wallet/withdrawals'),
};

export const watchlistAPI = {
  get: () => api.get('/watchlist'),
  add: (symbol) => api.post('/watchlist/add', { symbol }),
  remove: (symbol) => api.delete(`/watchlist/${symbol}`),
  setAlert: (symbol, alertPrice) => api.patch(`/watchlist/${symbol}/alert`, { alertPrice }),
};

export const orderAPI = {
  getAll: (params) => api.get('/orders', { params }),
  getOne: (orderId) => api.get(`/orders/${orderId}`),
};

export const notificationAPI = {
  getAll: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  getKYCList: (params) => api.get('/admin/kyc', { params }),
  getKYCDetail: (userId) => api.get(`/admin/kyc/${userId}`),
  reviewKYC: (userId, data) => api.patch(`/admin/kyc/${userId}/review`, data),
  adjustWallet: (data) => api.patch('/admin/wallet/adjust', data),
  getWithdrawals: (params) => api.get('/admin/withdrawals', { params }),
  processWithdrawal: (id, data) => api.patch(`/admin/withdrawals/${id}`, data),
  setStockPrice: (symbol, price) => api.patch(`/admin/stocks/${symbol}/price`, { price }),
  getTransactions: (params) => api.get('/admin/transactions', { params }),
  broadcast: (data) => api.post('/admin/notifications/broadcast', data),
};

export default api;
