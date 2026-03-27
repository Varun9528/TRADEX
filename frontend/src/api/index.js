import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 30000,
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
    // Handle both TOKEN_EXPIRED code and generic 401 unauthorized
    if (error.response?.status === 401 && !original._retry) {
      const errorCode = error.response?.data?.code || error.response?.data?.message;
      
      // Only retry for token expiration, not for invalid credentials
      if (errorCode === 'TOKEN_EXPIRED' || errorCode === 'Token expired' || !errorCode) {
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
          if (!refreshToken) {
            throw new Error('No refresh token available');
          }
          
          const { data } = await axios.post(`${API_BASE_URL}/api/auth/refresh`, { refreshToken });
          const newToken = data.data.accessToken;
          localStorage.setItem('accessToken', newToken);
          localStorage.setItem('refreshToken', data.data.refreshToken);
          processQueue(null, newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch (err) {
          processQueue(err, null);
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
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
  // NEW: TwelveData integration
  getLivePrice: (symbol) => api.get(`/stocks/live-price/${symbol}`),
  getCandles: (symbol, interval = '1min', outputsize = 50) => 
    api.get(`/stocks/candles/${symbol}`, { params: { interval, outputsize } }),
  getQuote: (symbol) => api.get(`/stocks/quote/${symbol}`),
};

export const tradeAPI = {
  placeOrder: (data) => api.post('/trades/order', data),
  getOrders: (params) => api.get('/trades/orders', { params }),
  getPortfolio: () => api.get('/trades/portfolio'),
  getHoldings: () => api.get('/trades/holdings'),
  cancelOrder: (orderId) => api.delete(`/trades/orders/${orderId}`),
  modifyOrder: (orderId, data) => api.put(`/trades/orders/${orderId}`, data),
};

export const positionAPI = {
  getAll: (params) => api.get('/positions', { params }),
  close: (symbol, data) => api.post(`/positions/${symbol}/close`, data),
};

export const walletAPI = {
  getBalance: () => api.get('/wallet/balance'),
  getTransactions: (params) => api.get('/wallet/transactions', { params }),
  fundRequest: (data) => api.post('/wallet/fund-request', data),
  withdrawRequest: (data) => api.post('/wallet/withdraw-request', data),
  getFundRequests: () => api.get('/wallet/fund-requests'),
  getWithdrawRequests: () => api.get('/wallet/withdraw-requests'),
  getWithdrawals: () => api.get('/wallet/withdrawals'),
  // Admin actions
  approveFundRequest: (id) => api.post(`/wallet/approve-fund-request/${id}`),
  rejectFundRequest: (id, reason) => api.post(`/wallet/reject-fund-request/${id}`, { reason }),
  approveWithdrawRequest: (id) => api.post(`/wallet/approve-withdraw-request/${id}`),
  rejectWithdrawRequest: (id, reason) => api.post(`/wallet/reject-withdraw-request/${id}`, { reason }),
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
  updateUserTradingStatus: (id, tradingEnabled) => api.patch(`/admin/users/${id}/trading`, { tradingEnabled }),
  placeTradeForUser: (data) => api.post('/admin/trade', data),
  getKYCList: (params) => api.get('/admin/kyc', { params }),
  getKYCDetail: (userId) => api.get(`/admin/kyc/${userId}`),
  reviewKYC: (userId, data) => api.patch(`/admin/kyc/${userId}/review`, data),
  adjustWallet: (data) => api.patch('/admin/wallet/adjust', data),
  getWithdrawals: (params) => api.get('/admin/withdrawals', { params }),
  processWithdrawal: (id, data) => api.patch(`/admin/withdrawals/${id}`, data),
  setStockPrice: (symbol, price) => api.patch(`/admin/stocks/${symbol}/price`, { price }),
  getTransactions: (params) => api.get('/admin/transactions', { params }),
  broadcast: (data) => api.post('/admin/notifications/broadcast', data),
  // Fund request management
  getFundRequests: (params) => api.get('/admin/fund-requests', { params }),
  approveFundRequest: (id) => api.put(`/admin/fund-request/${id}/approve`),
  rejectFundRequest: (id) => api.put(`/admin/fund-request/${id}/reject`),
  // Withdraw request management
  getWithdrawRequests: (params) => api.get('/admin/withdraw-requests', { params }),
  approveWithdrawRequest: (id) => api.put(`/admin/withdraw-request/${id}/approve`),
  rejectWithdrawRequest: (id) => api.put(`/admin/withdraw-request/${id}/reject`),
  // Trade monitoring
  getTrades: (params) => api.get('/admin/trades', { params }),
  getPositions: (params) => api.get('/admin/positions', { params }),
};

export default api;
