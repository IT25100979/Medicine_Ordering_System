import React, { useState } from 'react';
import { Sparkles, X, ArrowRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { inventoryApi } from '../api/inventoryApi';

export default function FefoSimulatorModal({ medicines, onClose }) {
  const [selectedMedicineId, setSelectedMedicineId] = useState(medicines[0]?.id || '');
  const [quantity, setQuantity] = useState(65);
  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSimulate = async (e) => {
    e?.preventDefault();
    if (!selectedMedicineId) return;

    try {
      setLoading(true);
      setError(null);
      const res = await inventoryApi.previewFefoAllocation(Number(selectedMedicineId), Number(quantity));
      setSimulationResult(res.data);
    } catch (err) {
      setError(err.message || 'Simulation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '720px' }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '8px', borderRadius: '10px' }}>
              <Sparkles size={20} color="#38bdf8" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>FEFO Allocation Algorithm Simulator</h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Test how the First-Expired-First-Out engine sequences and splits stock deductions
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSimulate} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr auto', gap: '12px', alignItems: 'end', marginBottom: '24px', background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '14px', border: '1px solid var(--border-glass)' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Pharmaceutical Item
            </label>
            <select
              className="input-glass"
              value={selectedMedicineId}
              onChange={(e) => setSelectedMedicineId(e.target.value)}
            >
              {medicines.map((m) => (
                <option key={m.id} value={m.id} style={{ background: '#0f172a' }}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Simulated Order Qty
            </label>
            <input
              type="number"
              min="1"
              className="input-glass font-mono"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ height: '44px' }}>
            {loading ? 'Simulating...' : 'Run FEFO'}
          </button>
        </form>

        {error && (
          <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '12px', borderRadius: '10px', color: '#fb7185', fontSize: '0.85rem', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* Simulation Output */}
        {simulationResult && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '0.88rem' }}>
                Order Fulfillment: {' '}
                <strong style={{ color: simulationResult.fullyFulfilled ? '#34d399' : '#fb7185' }}>
                  {simulationResult.allocatedQuantity} / {simulationResult.requestedQuantity} units
                </strong>
              </div>
              <span className={`badge ${simulationResult.fullyFulfilled ? 'badge-emerald' : 'badge-rose'}`}>
                {simulationResult.fullyFulfilled ? 'Full Allocation Possible' : `Stock Shortage (-${simulationResult.shortage})`}
              </span>
            </div>

            {/* Allocation Plan Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
              {simulationResult.allocationPlan?.length > 0 ? (
                simulationResult.allocationPlan.map((plan, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      background: 'rgba(30, 41, 59, 0.5)',
                      border: '1px solid rgba(56, 189, 248, 0.3)',
                      borderRadius: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className="badge badge-blue font-mono" style={{ fontSize: '0.72rem' }}>
                        Step {idx + 1} (Earliest Expiry)
                      </span>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                          Batch: <span className="font-mono" style={{ color: '#38bdf8' }}>{plan.batchNumber}</span>
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Expiry: <strong style={{ color: '#fbbf24' }}>{plan.expiryDate}</strong> | Location: {plan.shelfLocation}
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#34d399' }}>
                        Deduct {plan.allocatedQuantity} units
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Remaining in batch: {plan.remainingQuantityAfter}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No eligible active batches found to satisfy this quantity.
                </div>
              )}
            </div>

            {/* Exclusion Notes (Quarantined or Expired) */}
            {simulationResult.exclusionNotes?.length > 0 && (
              <div style={{ background: 'rgba(15, 23, 42, 0.4)', borderRadius: '12px', padding: '12px 16px', border: '1px solid var(--border-glass)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: '#fbbf24', marginBottom: '6px' }}>
                  <AlertTriangle size={14} />
                  <strong>Protected Exclusions (Ignored by Algorithm):</strong>
                </div>
                <ul style={{ paddingLeft: '18px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                  {simulationResult.exclusionNotes.map((note, i) => (
                    <li key={i}>{note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
