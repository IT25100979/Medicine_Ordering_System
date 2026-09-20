import client from './client';

export const inventoryApi = {
  getBatches: async (params) => {
    const res = await client.get('/api/v1/inventory/batches', { params });
    return res.data;
  },
  registerBatch: async (batchData) => {
    const res = await client.post('/api/v1/inventory/batches', batchData);
    return res.data;
  },
  getBatchById: async (id) => {
    const res = await client.get(`/api/v1/inventory/batches/${id}`);
    return res.data;
  },
  previewFefoAllocation: async (medicineId, quantity) => {
    const res = await client.post('/api/v1/inventory/allocate-fefo', { medicineId, quantity });
    return res.data;
  },
  quarantineBatch: async (id, reason) => {
    const res = await client.patch(`/api/v1/inventory/batches/${id}/quarantine`, null, { params: { reason } });
    return res.data;
  },
  releaseBatch: async (id) => {
    const res = await client.patch(`/api/v1/inventory/batches/${id}/release`);
    return res.data;
  },
  runExpiryCheck: async () => {
    const res = await client.post('/api/v1/inventory/run-expiry-check');
    return res.data;
  },
  getMedicinesWithStock: async () => {
    const res = await client.get('/api/v1/inventory/medicines');
    return res.data;
  },
  createMedicine: async (medData) => {
    const res = await client.post('/api/v1/inventory/medicines', medData);
    return res.data;
  },
  updateBatch: async (id, batchData) => {
    const res = await client.put(`/api/v1/inventory/batches/${id}`, batchData);
    return res.data;
  },
  updateMedicine: async (id, medData) => {
    const res = await client.put(`/api/v1/inventory/medicines/${id}`, medData);
    return res.data;
  },
};
