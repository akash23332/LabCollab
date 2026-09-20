import api from './api';

export const authService = {
  login: async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.success && res.token) {
      localStorage.setItem('labshare_token', res.token);
      localStorage.setItem('labshare_user', JSON.stringify({ ...res.user, token: res.token }));
    }
    return res;
  },

  register: async (userData) => {
    const res = await api.post('/auth/register', userData);
    if (res.success && res.token) {
      localStorage.setItem('labshare_token', res.token);
      localStorage.setItem('labshare_user', JSON.stringify({ ...res.user, token: res.token }));
    }
    return res;
  },

  getMe: async () => {
    return await api.get('/auth/me');
  },

  logout: () => {
    localStorage.removeItem('labshare_token');
    localStorage.removeItem('labshare_user');
  },
};

export default authService;
