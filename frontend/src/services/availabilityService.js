import api from './api';

export const availabilityService = {
  getAvailability: async (equipmentId) => {
    return await api.get(`/availability/${equipmentId}`);
  },

  updateWeeklyTemplate: async (equipmentId, weeklyTemplate) => {
    return await api.put(`/availability/${equipmentId}/template`, { weeklyTemplate });
  },

  addException: async (equipmentId, { date, start, end, status, reason }) => {
    return await api.post(`/availability/${equipmentId}/exceptions`, {
      date,
      start,
      end,
      status,
      reason,
    });
  },

  removeException: async (equipmentId, exceptionId) => {
    return await api.delete(`/availability/${equipmentId}/exceptions/${exceptionId}`);
  },
};

export default availabilityService;
