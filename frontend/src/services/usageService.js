import api from './api';

export const usageService = {
  getUsageLogs: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/usage-logs${query ? `?${query}` : ''}`;
    return await api.get(endpoint);
  },

  getUsageLogById: async (id) => {
    return await api.get(`/usage-logs/${id}`);
  },

  createUsageLog: async (data) => {
    return await api.post('/usage-logs', data);
  },

  updateUsageLog: async (id, data) => {
    return await api.patch(`/usage-logs/${id}`, data);
  },

  getUsageStats: async () => {
    return await api.get('/usage-logs/stats');
  },
};

export default usageService;
