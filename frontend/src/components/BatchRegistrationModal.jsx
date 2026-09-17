import React, { useState } from 'react';
import { X, PlusCircle, AlertCircle } from 'lucide-react';
import { inventoryApi } from '../api/inventoryApi';

export default function BatchRegistrationModal({ medicines, onClose, onBatchRegistered }) {
  const [formData, setFormData] = useState({
    medicineId: medicines[0]?.id || '',
    batchNumber: '',
    manufactureDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    initialQuantity: 100,
    shelfLocation: 'Aisle 1 - Shelf A1',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.expiryDate) {
      setError('Please select a valid expiry date in the future.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await inventoryApi.registerBatch({
        ...formData,
        medicineId: Number(formData.medicineId),
        initialQuantity: Number(formData.initialQuantity),
      });
      onBatchRegistered();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to register batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <PlusCircle size={22} color="#10b981" />
            <h3 style={{ fontSize: '1.2rem' }}>Register New Medicine Batch</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '10px 14px', borderRadius: '10px', color: '#fb7185', fontSize: '0.85rem', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Select Pharmaceutical SKU
            </label>
            <select
              className="input-glass"
              value={formData.medicineId}
              onChange={(e) => setFormData({ ...formData, medicineId: e.target.value })}
              required
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id} style={{ background: '#0f172a' }}>
                  {m.name} ({m.dosage})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Batch / Lot Serial Number
            </label>
            <input
              type="text"
              className="input-glass font-mono"
              placeholder="e.g. BATCH-2026-PARA-08"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Manufacture Date
              </label>
              <input
                type="date"
                className="input-glass"
                value={formData.manufactureDate}
                onChange={(e) => setFormData({ ...formData, manufactureDate: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Expiry Date (FEFO Sorted)
              </label>
              <input
                type="date"
                className="input-glass"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Quantity (Units)
              </label>
              <input
                type="number"
                min="1"
                className="input-glass"
                value={formData.initialQuantity}
                onChange={(e) => setFormData({ ...formData, initialQuantity: e.target.value })}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Warehouse Shelf Location
              </label>
              <input
                type="text"
                className="input-glass"
                placeholder="e.g. Aisle 3 - Shelf C2"
                value={formData.shelfLocation}
                onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Registering...' : 'Register Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
