import React, { useState } from 'react';
import { X, Edit3, AlertCircle, Check } from 'lucide-react';
import { inventoryApi } from '../api/inventoryApi';

export default function EditBatchModal({ batch, onClose, onBatchUpdated }) {
  const [formData, setFormData] = useState({
    quantityAvailable: batch.quantityAvailable ?? 0,
    shelfLocation: batch.shelfLocation || '',
    expiryDate: batch.expiryDate || '',
    status: batch.status || 'ACTIVE',
    quarantineReason: batch.quarantineReason || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.quantityAvailable < 0) {
      setError('Available quantity cannot be negative.');
      return;
    }

    if (!formData.expiryDate) {
      setError('Expiry date is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await inventoryApi.updateBatch(batch.id, {
        quantityAvailable: Number(formData.quantityAvailable),
        shelfLocation: formData.shelfLocation,
        expiryDate: formData.expiryDate,
        status: formData.status,
        quarantineReason: formData.status === 'QUARANTINED' || formData.status === 'EXPIRED'
          ? (formData.quarantineReason || 'Status manually updated by pharmacy staff')
          : null,
      });
      onBatchUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Edit3 size={20} color="#38bdf8" />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Update Batch #{batch.batchNumber}</h3>
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Medicine</label>
              <input
                type="text"
                className="input-glass"
                value={batch.medicineName || ''}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>

            <div className="form-group">
              <label>Batch Serial</label>
              <input
                type="text"
                className="input-glass font-mono"
                value={batch.batchNumber || ''}
                disabled
                style={{ opacity: 0.7, cursor: 'not-allowed' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Available Stock (Units) *</label>
              <input
                type="number"
                min="0"
                className="input-glass"
                value={formData.quantityAvailable}
                onChange={(e) => setFormData({ ...formData, quantityAvailable: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Shelf Location *</label>
              <input
                type="text"
                className="input-glass"
                placeholder="e.g. Aisle 2 - Shelf B1"
                value={formData.shelfLocation}
                onChange={(e) => setFormData({ ...formData, shelfLocation: e.target.value })}
                required
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Expiry Date (FEFO) *</label>
              <input
                type="date"
                className="input-glass"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Batch Status *</label>
              <select
                className="input-glass"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="NEAR_EXPIRY">NEAR EXPIRY (&lt;30d)</option>
                <option value="QUARANTINED">QUARANTINED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
          </div>

          {(formData.status === 'QUARANTINED' || formData.status === 'EXPIRED') && (
            <div className="form-group">
              <label>Quarantine / Reason Note</label>
              <input
                type="text"
                className="input-glass"
                placeholder="Reason for locking batch from dispensing"
                value={formData.quarantineReason}
                onChange={(e) => setFormData({ ...formData, quarantineReason: e.target.value })}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Check size={16} />
              <span>{loading ? 'Saving Changes...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
