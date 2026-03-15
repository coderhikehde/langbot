import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (username, password) =>
    api.post('/auth/login', { username, password }),
  register: (username, email, password) =>
    api.post('/auth/register', { username, email, password }),
};

export const chatApi = {
  sendMessage: (message, conversationId = null) =>
    api.post('/chat/message', { message, conversationId }),
  getConversations: () =>
    api.get('/chat/conversations'),
  getConversation: (id) =>
    api.get(`/chat/conversations/${id}`),
  deleteConversation: (id) =>
    api.delete(`/chat/conversations/${id}`),
};

export const userApi = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  getStats: () => api.get('/user/stats'),
};

export default api;
