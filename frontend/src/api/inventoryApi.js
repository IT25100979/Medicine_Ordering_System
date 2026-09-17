import api from './client';

export const inventoryApi = {
  getBatches: (params) => api.get('/inventory/batches', { params }),
  registerBatch: (batchData) => api.post('/inventory/batches', batchData),
  getBatchById: (id) => api.get(`/inventory/batches/${id}`),
  previewFefoAllocation: (medicineId, quantity) =>
    api.post('/inventory/allocate-fefo', { medicineId, quantity }),
  quarantineBatch: (id, reason) =>
    api.patch(`/inventory/batches/${id}/quarantine`, null, { params: { reason } }),
  releaseBatch: (id) => api.patch(`/inventory/batches/${id}/release`),
  runExpiryCheck: () => api.post('/inventory/run-expiry-check'),
  getMedicinesWithStock: () => api.get('/inventory/medicines'),
  updateBatch: (id, batchData) => api.put(`/inventory/batches/${id}`, batchData),
  updateMedicine: (id, medData) => api.put(`/inventory/medicines/${id}`, medData),
};
