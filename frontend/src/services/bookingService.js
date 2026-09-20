import api from './api';

export const bookingService = {
  getBookings: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    const endpoint = `/bookings${query ? `?${query}` : ''}`;
    return await api.get(endpoint);
  },

  getMyBookings: async () => {
    return await api.get('/bookings/my');
  },

  getBookingById: async (id) => {
    return await api.get(`/bookings/${id}`);
  },

  createBooking: async (data) => {
    return await api.post('/bookings', data);
  },

  updateBookingStatus: async (id, status, rejectionReason = '') => {
    return await api.patch(`/bookings/${id}/status`, { status, rejectionReason });
  },

  exportDemandHistory: async () => {
    return await api.get('/bookings/export-demand-history');
  },
};

export default bookingService;
