import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import client, { errorMessage, unwrap } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import useFeatureStatus from '../../hooks/useFeatureStatus';
import FeaturePausedBanner from '../../components/FeaturePausedBanner';

const FREQUENCIES = [7, 14, 30, 60, 90];
const STAFF_ROLES = ['CHIEF_PHARMACIST', 'PHARMACIST', 'ADMIN', 'SYSTEM_ADMIN', 'IT_MANAGER'];

const STATUS_STYLE = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  PAUSED: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-neutral-200 text-neutral-600',
};

const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
const cycleCost = (sub) => (sub.items || []).reduce((sum, i) => sum + Number(i.unitPrice || 0) * (i.quantity || 0), 0);
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Refill subscriptions.
 * Customers: subscribe to regular refills, pause / resume / cancel their own.
 * Pharmacists & admins: see every subscription, pause/resume/cancel, and record a completed refill cycle.
 */
const SubscriptionsPage = () => {
  const { user } = useAuth();
  const isStaff = STAFF_ROLES.includes(user?.role);
  const { status: featureStatus, isEnabled } = useFeatureStatus();
  const refillsPaused = !isEnabled('REFILLS');

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [busyId, setBusyId] = useState(null);

  // New subscription form (customers)
  const [showForm, setShowForm] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [approvedPrescriptions, setApprovedPrescriptions] = useState([]);
  const [lines, setLines] = useState([{ medicineId: '', quantity: 1 }]);
  const [frequencyDays, setFrequencyDays] = useState(30);
  const [firstRefill, setFirstRefill] = useState('');
  const [prescriptionId, setPrescriptionId] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await client.get(isStaff ? '/api/v1/subscriptions' : '/api/v1/subscriptions/my');
      const data = unwrap(res);
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      setFeedback({ type: 'error', message: errorMessage(err, 'Could not load subscriptions.') });
    } finally {
      setLoading(false);
    }
  }, [isStaff]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isStaff || !showForm) return;
    client.get('/api/v1/medicines')
      .then((res) => {
        const data = unwrap(res);
        setMedicines(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    client.get('/api/v1/prescriptions', { params: { status: 'APPROVED' } })
      .then((res) => {
        const data = unwrap(res);
        setApprovedPrescriptions((Array.isArray(data) ? data : []).filter((p) => p.status === 'APPROVED'));
      })
      .catch(() => {});
  }, [isStaff, showForm]);

  const medicineById = useMemo(() => new Map(medicines.map((m) => [String(m.id), m])), [medicines]);
  const rxSelected = lines.some((l) => medicineById.get(String(l.medicineId))?.requiresPrescription);
  const formCost = lines.reduce((sum, l) => {
    const med = medicineById.get(String(l.medicineId));
    return sum + (med ? Number(med.unitPrice ?? med.price ?? 0) * (Number(l.quantity) || 0) : 0);
  }, 0);

  const updateLine = (index, patch) => setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));

  const resetForm = () => {
    setLines([{ medicineId: '', quantity: 1 }]);
    setFrequencyDays(30);
    setFirstRefill('');
    setPrescriptionId('');
    setFormError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    const chosen = lines.filter((l) => l.medicineId);
    if (chosen.length === 0) return setFormError('Choose at least one medicine.');
    if (new Set(chosen.map((l) => l.medicineId)).size !== chosen.length) return setFormError('Each medicine can only be added once.');
    if (chosen.some((l) => !(Number(l.quantity) >= 1 && Number(l.quantity) <= 1000))) return setFormError('Quantity must be between 1 and 1000.');
    if (firstRefill && firstRefill < today()) return setFormError('The first refill date cannot be in the past.');
    if (rxSelected && !prescriptionId) return setFormError('Choose an approved prescription for the prescription-only medicine.');

    setSaving(true);
    setFormError('');
    try {
      await client.post('/api/v1/subscriptions/my', {
        frequencyDays: Number(frequencyDays),
        nextRefillDate: firstRefill || null,
        prescriptionId: rxSelected ? Number(prescriptionId) : null,
        items: chosen.map((l) => ({ medicineId: Number(l.medicineId), quantity: Number(l.quantity) })),
      });
      setFeedback({ type: 'success', message: 'Refill subscription created.' });
      setShowForm(false);
      resetForm();
      load();
    } catch (err) {
      setFormError(errorMessage(err, 'Could not create the subscription.'));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (sub, status) => {
    if (status === 'CANCELLED' && !window.confirm(`Cancel subscription #${sub.id}? This cannot be undone.`)) return;
    setBusyId(sub.id);
    setFeedback({ type: '', message: '' });
    try {
      if (isStaff) {
        await client.patch(`/api/v1/subscriptions/${sub.id}/status`, null, { params: { status } });
      } else {
        await client.patch(`/api/v1/subscriptions/my/${sub.id}/status`, null, { params: { status } });
      }
      load();
    } catch (err) {
      setFeedback({ type: 'error', message: errorMessage(err, 'Could not update the subscription.') });
    } finally {
      setBusyId(null);
    }
  };

  const advanceCycle = async (sub) => {
    setBusyId(sub.id);
    try {
      await client.post(`/api/v1/subscriptions/${sub.id}/advance-cycle`);
      setFeedback({ type: 'success', message: `Refill recorded for #${sub.id}; next refill date moved forward.` });
      load();
    } catch (err) {
      setFeedback({ type: 'error', message: errorMessage(err, 'Could not record the refill.') });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto min-h-screen">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 flex items-center gap-3">
            <i className="fa-solid fa-arrows-rotate text-emerald-700" />
            {isStaff ? 'Refill Subscriptions' : 'My Refill Subscriptions'}
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            {isStaff
              ? 'All customer refill plans. Record a completed refill to move the next refill date forward.'
              : 'Get your regular medicines on a schedule. Pause, resume or cancel any time.'}
          </p>
        </div>
        {!isStaff && (
          <button
            type="button"
            disabled={refillsPaused}
            onClick={() => {
              setShowForm((v) => !v);
              resetForm();
            }}
            className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white text-xs font-bold uppercase tracking-wider"
          >
            {showForm ? 'Close' : 'New Subscription'}
          </button>
        )}
      </div>

      <FeaturePausedBanner title="Refill subscriptions" info={featureStatus.REFILLS} />

      {feedback.message && (
        <div
          className={`mb-4 p-3 rounded-xl text-xs font-semibold border ${
            feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'
          }`}
          role={feedback.type === 'error' ? 'alert' : 'status'}
        >
          {feedback.message}
        </div>
      )}

      {showForm && !isStaff && (
        <form onSubmit={submit} className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-4 mb-6 text-xs">
          <h2 className="text-sm font-black uppercase tracking-wider text-neutral-900">New refill subscription</h2>

          <div className="space-y-2">
            <span className="block text-[10px] font-black uppercase tracking-wider text-neutral-400">Medicines *</span>
            {lines.map((line, index) => (
              <div key={index} className="flex gap-2 items-center">
                <select
                  aria-label={`Medicine ${index + 1}`}
                  value={line.medicineId}
                  onChange={(e) => updateLine(index, { medicineId: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200"
                >
                  <option value="">Select a medicine</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} — {money(m.unitPrice ?? m.price)}{m.requiresPrescription ? ' (prescription)' : ''}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  aria-label={`Quantity ${index + 1}`}
                  value={line.quantity}
                  onChange={(e) => updateLine(index, { quantity: e.target.value })}
                  className="w-20 px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200"
                />
                {lines.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                    aria-label="Remove medicine"
                    className="w-8 h-8 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-600"
                  >
                    <i className="fa-solid fa-trash text-xs" />
                  </button>
                )}
              </div>
            ))}
            {lines.length < 20 && (
              <button
                type="button"
                onClick={() => setLines((prev) => [...prev, { medicineId: '', quantity: 1 }])}
                className="text-emerald-800 font-bold hover:underline"
              >
                + Add another medicine
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">Repeat every *</span>
              <select
                value={frequencyDays}
                onChange={(e) => setFrequencyDays(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200"
              >
                {FREQUENCIES.map((d) => (
                  <option key={d} value={d}>{d} days</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-[10px] font-black uppercase tracking-wider text-neutral-400 mb-1">First refill date (optional)</span>
              <input
                type="date"
                min={today()}
                value={firstRefill}
                onChange={(e) => setFirstRefill(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200"
              />
            </label>
          </div>

          {rxSelected && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <p className="font-black uppercase tracking-wider text-amber-900">Prescription required</p>
              {approvedPrescriptions.length > 0 ? (
                <select
                  aria-label="Approved prescription"
                  value={prescriptionId}
                  onChange={(e) => setPrescriptionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300"
                >
                  <option value="">Select an approved prescription</option>
                  {approvedPrescriptions.map((p) => (
                    <option key={p.id} value={p.id}>Rx #{p.id}{p.doctorName ? ` · ${p.doctorName}` : ''}</option>
                  ))}
                </select>
              ) : (
                <p className="text-amber-900">
                  You have no approved prescription. <Link to="/prescription" className="font-bold underline">Upload one</Link> first.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100">
            <span className="font-bold text-neutral-700">Cost per refill: {money(formCost)}</span>
            <button
              type="submit"
              disabled={saving || refillsPaused}
              className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black disabled:bg-neutral-300 text-white font-bold uppercase tracking-wider"
            >
              {saving ? 'Saving...' : 'Subscribe'}
            </button>
          </div>
          {formError && <p className="text-red-600 font-semibold" role="alert">{formError}</p>}
        </form>
      )}

      {loading ? (
        <p className="text-center py-16 text-xs font-bold text-neutral-400">Loading subscriptions...</p>
      ) : subscriptions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 text-xs text-neutral-500">
          {isStaff ? 'No customer has a refill subscription yet.' : 'You have no refill subscriptions yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="font-mono font-black text-sm text-neutral-900">#SUB-{sub.id}</span>
                  {isStaff && sub.customerName && <span className="text-xs text-neutral-500 ml-2">{sub.customerName}</span>}
                  <p className="text-xs text-neutral-600 mt-1">
                    {(sub.items || []).map((i) => `${i.quantity} x ${i.name}`).join(', ') || 'No medicines'}
                  </p>
                </div>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${STATUS_STYLE[sub.status] || ''}`}>
                  {sub.status}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Repeats</span>
                  <span className="font-bold">Every {sub.frequencyDays} days</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Next refill</span>
                  <span className="font-bold text-emerald-800">{sub.status === 'ACTIVE' ? sub.nextRefillDate : '—'}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Cost per refill</span>
                  <span className="font-bold">{money(cycleCost(sub))}</span>
                </div>
              </div>

              {sub.status !== 'CANCELLED' && (
                <div className="flex flex-wrap gap-2 pt-2 border-t border-neutral-100">
                  {sub.status === 'ACTIVE' ? (
                    <button type="button" disabled={busyId === sub.id} onClick={() => changeStatus(sub, 'PAUSED')}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold">
                      Pause
                    </button>
                  ) : (
                    <button type="button" disabled={busyId === sub.id || refillsPaused} onClick={() => changeStatus(sub, 'ACTIVE')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold disabled:opacity-50">
                      Resume
                    </button>
                  )}
                  <button type="button" disabled={busyId === sub.id} onClick={() => changeStatus(sub, 'CANCELLED')}
                    className="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold">
                    Cancel
                  </button>
                  {isStaff && sub.status === 'ACTIVE' && (
                    <button type="button" disabled={busyId === sub.id || refillsPaused} onClick={() => advanceCycle(sub)}
                      className="px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-black text-white text-xs font-bold disabled:opacity-50">
                      Record refill done
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubscriptionsPage;
