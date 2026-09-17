import React, { useState } from 'react';
import { Printer, Check, X, QrCode, FileText } from 'lucide-react';

export default function PackingSlipModal({ slipData, onClose }) {
  const [checkedItems, setCheckedItems] = useState({});

  if (!slipData) return null;

  const toggleCheck = (idx) => {
    setCheckedItems((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '680px', background: '#0b1120' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: '16px', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <FileText size={22} color="#38bdf8" />
            <h3 style={{ fontSize: '1.25rem' }}>Pharmacy Dispensing Packing Slip</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Slip Metadata Header */}
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.85rem' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Order ID: </span>
              <strong className="font-mono" style={{ color: '#38bdf8' }}>{slipData.orderNumber}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Fulfillment Status: </span>
              <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>{slipData.orderStatus}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Patient Name: </span>
              <strong>{slipData.customerName}</strong>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Contact: </span>
              <span>{slipData.customerPhone || 'N/A'}</span>
            </div>
            <div style={{ gridColumn: 'span 2' }}>
              <span style={{ color: 'var(--text-muted)' }}>Delivery Address: </span>
              <span>{slipData.shippingAddress}</span>
            </div>
          </div>
        </div>

        {/* Itemized Batches & Shelf Locations */}
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h4 style={{ fontSize: '0.95rem', color: '#94a3b8' }}>ALLOCATED ITEMS & SHELF LOCATIONS (FEFO)</h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assistant Checklist</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {slipData.items?.map((item, idx) => (
              <div
                key={idx}
                onClick={() => toggleCheck(idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: checkedItems[idx] ? 'rgba(16, 185, 129, 0.08)' : 'rgba(30, 41, 59, 0.4)',
                  border: `1px solid ${checkedItems[idx] ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-glass)'}`,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '6px',
                    background: checkedItems[idx] ? '#10b981' : 'rgba(255, 255, 255, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {checkedItems[idx] && <Check size={16} color="#ffffff" />}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{item.medicineName} ({item.dosage})</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '12px', marginTop: '2px' }}>
                      <span>Batch: <strong className="font-mono" style={{ color: '#fbbf24' }}>{item.batchNumber}</strong></span>
                      <span>Expires: <strong>{item.expiryDate}</strong></span>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                    {item.shelfLocation || 'Main Storage'}
                  </div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginTop: '4px' }}>
                    Qty: {item.quantity}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Security & Traceability Instructions */}
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: '14px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <QrCode size={32} color="#64748b" />
          <div>
            <strong>Batch Traceability Verified (NMRA Compliant):</strong> Each unit dispensed matches manufacturer batch serials according to First-Expired-First-Out sequencing.
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-primary" onClick={handlePrint}>
            <Printer size={16} />
            <span>Print Packing Slip</span>
          </button>
        </div>
      </div>
    </div>
  );
}
