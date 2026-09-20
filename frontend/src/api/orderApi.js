import client from './client';

export const orderApi = {
  placeOrder: async (orderData) => {
    const res = await client.post('/api/v1/orders', orderData);
    return res.data;
  },
  getOrders: async (params) => {
    const res = await client.get('/api/v1/orders', { params });
    return res.data;
  },
  getOrderById: async (id) => {
    const res = await client.get(`/api/v1/orders/${id}`);
    return res.data;
  },
  trackOrderByNumber: async (orderNumber) => {
    const res = await client.get(`/api/v1/orders/track/${orderNumber}`);
    return res.data;
  },
  updateOrderStatus: async (id, newStatus, note) => {
    const res = await client.patch(`/api/v1/orders/${id}/status`, { newStatus, note });
    return res.data;
  },
  cancelOrder: async (id, reason) => {
    const res = await client.post(`/api/v1/orders/${id}/cancel`, { reason });
    return res.data;
  },
  getPackingSlip: async (id) => {
    const res = await client.get(`/api/v1/orders/${id}/packing-slip`);
    return res.data;
  },
};
