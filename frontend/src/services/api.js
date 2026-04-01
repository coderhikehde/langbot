import axios from 'axios';

const api = axios.create({
  baseURL: 'https://langbot-production-5ebc.up.railway.app/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username, password) =>
    api.post('/login', { username, password }),
  register: (username, email, password) =>
    api.post('/register', { username, email, password }),
};

export const chatApi = {
  sendMessage: (message, conversationId) =>
    api.post('/chat', { message, conversationId }),
  getConversations: () =>
    api.get('/conversations'),
  getConversation: (id) =>
    api.get(`/conversations/${id}`),
  deleteConversation: (id) =>
    api.delete(`/conversations/${id}`),
};

export const userApi = {
  getProfile: () => api.get('/profile'),
  updateProfile: (data) => api.put('/profile', data),
  getStats: () => api.get('/stats'),
};

export default api;
