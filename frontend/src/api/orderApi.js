import api from './client';

export const orderApi = {
  placeOrder: (orderData) => api.post('/orders', orderData),
  getOrders: (params) => api.get('/orders', { params }),
  getOrderById: (id) => api.get(`/orders/${id}`),
  trackOrderByNumber: (orderNumber) => api.get(`/orders/track/${orderNumber}`),
  updateOrderStatus: (id, newStatus, note) => api.patch(`/orders/${id}/status`, { newStatus, note }),
  cancelOrder: (id, reason) => api.post(`/orders/${id}/cancel`, { reason }),
  getPackingSlip: (id) => api.get(`/orders/${id}/packing-slip`),
};
