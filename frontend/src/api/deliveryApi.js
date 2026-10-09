import client, { unwrap } from './client';

/**
 * All Delivery Management HTTP calls in one place.
 * Staff console: /api/v1/deliveries   Courier: /api/v1/courier   Customer: /api/v1/customer/deliveries
 */
export const deliveryApi = {
  // ---- customer
  courierPartners: () => client.get('/api/v1/customer/deliveries/courier-partners').then(unwrap),
  placeOrder: (payload) => client.post('/api/v1/customer/deliveries', payload).then(unwrap),
  myDeliveries: () => client.get('/api/v1/customer/deliveries').then(unwrap),

  // ---- delivery coordinator
  list: (status) => client.get('/api/v1/deliveries', { params: status && status !== 'ALL' ? { status } : {} }).then(unwrap),
  timeline: (id) => client.get(`/api/v1/deliveries/${id}/timeline`).then(unwrap),
  record: (payload) => client.post('/api/v1/deliveries', payload).then(unwrap),
  approve: (id, note) => client.put(`/api/v1/deliveries/${id}/approve`, { note }).then(unwrap),
  reject: (id, reason) => client.put(`/api/v1/deliveries/${id}/reject`, { reason }).then(unwrap),
  assign: (payload) => client.put('/api/v1/deliveries/assign', payload).then(unwrap),
  action: (id, action, reason) => client.put(`/api/v1/deliveries/${id}/action`, { action, reason }).then(unwrap),
  regenerateOtp: (id) => client.post(`/api/v1/deliveries/${id}/regenerate-otp`).then(unwrap),

  // ---- courier
  courierQueue: (courier) =>
    client.get('/api/v1/courier/deliveries', { params: courier && courier !== 'ALL' ? { courier } : {} }).then(unwrap),
  courierUpdate: (id, payload) => client.put(`/api/v1/courier/deliveries/${id}/status`, payload).then(unwrap),

  // ---- zones (public read)
  zones: () => client.get('/api/v1/delivery-zones').then(unwrap),
  checkZone: (city) => client.get('/api/v1/delivery-zones/check', { params: { city } }).then(unwrap),
  toggleZone: (id) => client.patch(`/api/v1/delivery-zones/${id}/toggle-status`).then(unwrap),
};

export const COURIER_PARTNERS_FALLBACK = [
  { code: 'DHL', name: 'DHL', description: 'Express international-grade handling', estimatedDays: 1 },
  { code: 'KOOMBIYO', name: 'Koombiyo', description: 'Island-wide standard delivery', estimatedDays: 2 },
  { code: 'LANKA_DELIVERY', name: 'Lanka Delivery', description: 'Budget local delivery', estimatedDays: 2 },
  { code: 'IN_COMPANY_DELIVERY', name: 'In Company Delivery', description: "Pharmacy's own riders, cold-chain ready", estimatedDays: 1 },
];
