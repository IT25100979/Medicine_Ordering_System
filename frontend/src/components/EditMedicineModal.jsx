import React, { useState } from 'react';
import { X, Edit2, AlertCircle, Check } from 'lucide-react';
import { inventoryApi } from '../api/inventoryApi';

export default function EditMedicineModal({ medicine, onClose, onMedicineUpdated }) {
  const [formData, setFormData] = useState({
    name: medicine.name || '',
    genericName: medicine.genericName || '',
    category: medicine.category || '',
    dosage: medicine.dosage || '',
    unitPrice: medicine.unitPrice ?? 0,
    reorderThreshold: medicine.reorderThreshold ?? 50,
    requiresPrescription: Boolean(medicine.requiresPrescription),
    description: medicine.description || '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Medicine name is required.');
      return;
    }

    if (Number(formData.unitPrice) <= 0) {
      setError('Unit price must be greater than zero.');
      return;
    }

    if (Number(formData.reorderThreshold) < 0) {
      setError('Reorder threshold cannot be negative.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await inventoryApi.updateMedicine(medicine.id, {
        name: formData.name.trim(),
        genericName: formData.genericName.trim(),
        category: formData.category.trim(),
        dosage: formData.dosage.trim(),
        unitPrice: Number(formData.unitPrice),
        reorderThreshold: Number(formData.reorderThreshold),
        requiresPrescription: formData.requiresPrescription,
        description: formData.description.trim(),
      });
      onMedicineUpdated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to update medicine');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Edit2 size={20} color="#10b981" />
            <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Edit Medicine: {medicine.name}</h3>
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
              <label>Medicine Name *</label>
              <input
                type="text"
                className="input-glass"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Generic Name</label>
              <input
                type="text"
                className="input-glass"
                value={formData.genericName}
                onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Therapeutic Category</label>
              <input
                type="text"
                className="input-glass"
                placeholder="e.g. Antibiotics, Analgesics"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Dosage & Form</label>
              <input
                type="text"
                className="input-glass"
                placeholder="e.g. 500mg Oral Tablet"
                value={formData.dosage}
                onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div className="form-group">
              <label>Unit Price ($) *</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                className="input-glass"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Reorder Threshold (Low Stock Alert) *</label>
              <input
                type="number"
                min="0"
                className="input-glass"
                value={formData.reorderThreshold}
                onChange={(e) => setFormData({ ...formData, reorderThreshold: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <input
              type="checkbox"
              id="reqRx"
              checked={formData.requiresPrescription}
              onChange={(e) => setFormData({ ...formData, requiresPrescription: e.target.checked })}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <label htmlFor="reqRx" style={{ cursor: 'pointer', margin: 0, fontSize: '0.9rem' }}>
              Requires Doctor Prescription (Rx)
            </label>
          </div>

          <div className="form-group">
            <label>Description / Usage Clinical Notes</label>
            <textarea
              className="input-glass"
              rows="3"
              placeholder="Clinical indication, contraindications, or storage instructions"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              <Check size={16} />
              <span>{loading ? 'Saving Changes...' : 'Save Medicine Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
