import api from './api';

export const equipmentService = {
  getEquipment: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/equipment${query ? `?${query}` : ''}`;
    return await api.get(endpoint);
  },

  getEquipmentById: async (id) => {
    return await api.get(`/equipment/${id}`);
  },

  createEquipment: async (data) => {
    return await api.post('/equipment', data);
  },

  updateEquipment: async (id, data) => {
    return await api.put(`/equipment/${id}`, data);
  },

  deleteEquipment: async (id) => {
    return await api.delete(`/equipment/${id}`);
  },

  exportForAI: async () => {
    return await api.get('/equipment/export/ai-format');
  },

  syncDemandPredictions: async () => {
    return await api.post('/equipment/sync-demand', {});
  },

  searchAI: async (query, limit = 10) => {
    return await api.post('/equipment/ai-search', { query, limit });
  },
};

export default equipmentService;
