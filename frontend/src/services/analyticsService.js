import api from './api';

export const analyticsService = {
  getDashboardMetrics: async () => {
    return await api.get('/analytics/dashboard');
  },

  getReports: async () => {
    return await api.get('/analytics/reports');
  },

  getDemandInsights: async () => {
    return await api.get('/analytics/demand-insights');
  },
};

export default analyticsService;
