import React, { useState, useEffect } from 'react';
import { ShieldAlert, PlusCircle, Sparkles, Moon, RefreshCw, Lock, Unlock, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { inventoryApi } from '../api/inventoryApi';
import BatchRegistrationModal from '../components/BatchRegistrationModal';
import FefoSimulatorModal from '../components/FefoSimulatorModal';

export default function InventoryBatchPage() {
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Filters
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterMedId, setFilterMedId] = useState('ALL');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showSimulatorModal, setShowSimulatorModal] = useState(false);
  const [quarantineActionLoading, setQuarantineActionLoading] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [batchRes, medRes] = await Promise.all([
        inventoryApi.getBatches(),
        inventoryApi.getMedicinesWithStock(),
      ]);
      setBatches(batchRes.data || []);
      setMedicines(medRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch inventory data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleQuarantine = async (batch) => {
    try {
      setQuarantineActionLoading((prev) => ({ ...prev, [batch.id]: true }));
      setError(null);
      setSuccessMsg(null);

      if (batch.status === 'QUARANTINED') {
        await inventoryApi.releaseBatch(batch.id);
        setSuccessMsg(`Batch ${batch.batchNumber} has been released from quarantine.`);
      } else {
        await inventoryApi.quarantineBatch(batch.id, 'Manual quarantine triggered from pharmacy console');
        setSuccessMsg(`Batch ${batch.batchNumber} has been locked in quarantine.`);
      }
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to update quarantine status');
    } finally {
      setQuarantineActionLoading((prev) => ({ ...prev, [batch.id]: false }));
    }
  };

  const handleRunExpirySweep = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMsg(null);
      const res = await inventoryApi.runExpiryCheck();
      setSuccessMsg(`Automated sweep complete: ${res.data?.expiredBatchesLocked || 0} expired batches locked.`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to run automated expiry check');
    } finally {
      setLoading(false);
    }
  };

  // KPIs
  const totalBatches = batches.length;
  const activeStock = batches
    .filter((b) => b.status === 'ACTIVE' || b.status === 'NEAR_EXPIRY')
    .reduce((acc, b) => acc + b.quantityAvailable, 0);
  const nearExpiryBatches = batches.filter((b) => b.status === 'NEAR_EXPIRY').length;
  const quarantinedBatches = batches.filter((b) => b.status === 'QUARANTINED' || b.status === 'EXPIRED').length;

  // Filtered Batches
  const filteredBatches = batches.filter((b) => {
    const matchStatus = filterStatus === 'ALL' || b.status === filterStatus;
    const matchMed = filterMedId === 'ALL' || b.medicineId === Number(filterMedId);
    return matchStatus && matchMed;
  });

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', marginBottom: '6px' }}>
            Pharmacy Assistant <span className="gradient-text-emerald">FEFO & Expiry Console</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Automated First-Expired-First-Out batch queue, shelf coordinates, and automated expiry quarantine locks.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowSimulatorModal(true)}>
            <Sparkles size={16} color="#38bdf8" />
            <span>FEFO Simulator</span>
          </button>

          <button className="btn btn-secondary" onClick={handleRunExpirySweep} disabled={loading}>
            <Moon size={16} color="#c084fc" />
            <span>Nightly Expiry Sweep</span>
          </button>

          <button className="btn btn-primary" onClick={() => setShowRegisterModal(true)}>
            <PlusCircle size={16} />
            <span>Register Batch</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Total Registered Batches</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800 }}>{totalBatches}</div>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>Across all catalog SKUs</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Available Dispensing Units</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>{activeStock}</div>
          <div style={{ fontSize: '0.75rem', color: '#34d399', marginTop: '4px' }}>In active non-quarantined batches</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#fbbf24', marginBottom: '4px' }}>
            <Clock size={14} />
            <span>Near Expiry (&lt; 30 Days)</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24' }}>{nearExpiryBatches}</div>
          <div style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '4px' }}>Highest priority for FEFO dispatch</div>
        </div>

        <div className="glass-panel" style={{ padding: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#fb7185', marginBottom: '4px' }}>
            <Lock size={14} />
            <span>Quarantined & Expired</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fb7185' }}>{quarantinedBatches}</div>
          <div style={{ fontSize: '0.75rem', color: '#fb7185', marginTop: '4px' }}>Strictly locked from checkout</div>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '12px 16px', borderRadius: '12px', color: '#fb7185', fontSize: '0.88rem', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {successMsg && (
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '12px 16px', borderRadius: '12px', color: '#34d399', fontSize: '0.88rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Status:</span>
          <select
            className="input-glass"
            style={{ width: '180px', padding: '8px 12px' }}
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="NEAR_EXPIRY">NEAR EXPIRY (&lt;30d)</option>
            <option value="QUARANTINED">QUARANTINED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Medicine:</span>
          <select
            className="input-glass"
            style={{ width: '220px', padding: '8px 12px' }}
            value={filterMedId}
            onChange={(e) => setFilterMedId(e.target.value)}
          >
            <option value="ALL">All Catalog SKUs</option>
            {medicines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Batches Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'rgba(15, 23, 42, 0.6)', color: 'var(--text-muted)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <th style={{ padding: '14px 20px' }}>Batch Number</th>
              <th style={{ padding: '14px 20px' }}>Pharmaceutical Item</th>
              <th style={{ padding: '14px 20px' }}>Expiry Date (FEFO)</th>
              <th style={{ padding: '14px 20px' }}>Available / Initial</th>
              <th style={{ padding: '14px 20px' }}>Shelf Location</th>
              <th style={{ padding: '14px 20px' }}>Status</th>
              <th style={{ padding: '14px 20px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredBatches.map((b) => {
              const isLocked = b.status === 'QUARANTINED' || b.status === 'EXPIRED';

              return (
                <tr
                  key={b.id}
                  style={{
                    borderBottom: '1px solid var(--border-glass)',
                    background: b.status === 'QUARANTINED' ? 'rgba(244, 63, 94, 0.04)' : (b.status === 'NEAR_EXPIRY' ? 'rgba(245, 158, 11, 0.04)' : 'transparent'),
                    transition: 'background 0.2s ease'
                  }}
                >
                  <td style={{ padding: '16px 20px' }}>
                    <span className="font-mono" style={{ fontWeight: 700, color: '#38bdf8' }}>{b.batchNumber}</span>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 600 }}>{b.medicineName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mfd: {b.manufactureDate}</div>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ fontWeight: 600, color: b.daysUntilExpiry <= 30 ? '#fbbf24' : '#ffffff' }}>
                      {b.expiryDate}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: b.daysUntilExpiry < 0 ? '#fb7185' : 'var(--text-muted)' }}>
                      {b.daysUntilExpiry < 0 ? `Expired ${Math.abs(b.daysUntilExpiry)} days ago` : `${b.daysUntilExpiry} days remaining`}
                    </div>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <strong style={{ color: b.quantityAvailable === 0 ? '#fb7185' : '#ffffff' }}>{b.quantityAvailable}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}> / {b.initialQuantity} units</span>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                      {b.shelfLocation || 'Aisle 1 - Shelf A1'}
                    </span>
                  </td>

                  <td style={{ padding: '16px 20px' }}>
                    <span className={`badge ${
                      b.status === 'ACTIVE' ? 'badge-emerald' :
                      b.status === 'NEAR_EXPIRY' ? 'badge-amber' :
                      b.status === 'QUARANTINED' ? 'badge-rose' : 'badge-rose'
                    }`}>
                      {b.status}
                    </span>
                    {b.quarantineReason && (
                      <div style={{ fontSize: '0.72rem', color: '#fb7185', marginTop: '4px', maxWidth: '200px' }}>
                        {b.quarantineReason}
                      </div>
                    )}
                  </td>

                  <td style={{ padding: '16px 20px', textAlign: 'right' }}>
                    {b.status !== 'EXPIRED' && (
                      <button
                        className={`btn btn-sm ${b.status === 'QUARANTINED' ? 'btn-secondary' : 'btn-danger'}`}
                        onClick={() => handleToggleQuarantine(b)}
                        disabled={quarantineActionLoading[b.id]}
                      >
                        {b.status === 'QUARANTINED' ? (
                          <>
                            <Unlock size={14} />
                            <span>Release</span>
                          </>
                        ) : (
                          <>
                            <Lock size={14} />
                            <span>Quarantine</span>
                          </>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showRegisterModal && (
        <BatchRegistrationModal
          medicines={medicines}
          onClose={() => setShowRegisterModal(false)}
          onBatchRegistered={fetchData}
        />
      )}

      {showSimulatorModal && (
        <FefoSimulatorModal
          medicines={medicines}
          onClose={() => setShowSimulatorModal(false)}
        />
      )}
    </div>
  );
}
