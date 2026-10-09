import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client, { errorMessage, unwrap } from '../../api/client';
import { deliveryApi, COURIER_PARTNERS_FALLBACK } from '../../api/deliveryApi';
import { useAuth } from '../../context/AuthContext';
import useFeatureStatus from '../../hooks/useFeatureStatus';
import FeaturePausedBanner from '../../components/FeaturePausedBanner';
import { isValidPhone, PHONE_HINT } from '../../utils/validation';

const FREQUENCIES = [7, 14, 30, 60, 90];
const STATUS_STYLE = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  PAUSED: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-neutral-200 text-neutral-600',
};
const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
const cycleCost = (sub) => (sub.items || []).reduce((sum, i) => sum + Number(i.unitPrice || 0) * (i.quantity || 0), 0);
const today = () => new Date().toISOString().slice(0, 10);

/**
 * Customer refill subscriptions: subscribe to regular refills, pause / resume / cancel.
 * Each refill is sent by the pharmacist (pharmacist dashboard -> Refills) and arrives via delivery.
 */
const SubscriptionsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { status: featureStatus, isEnabled } = useFeatureStatus();
  const refillsPaused = !isEnabled('REFILLS');

  // Staff manage refills on the pharmacist dashboard
  useEffect(() => {
    if (user && user.role !== 'CUSTOMER') navigate('/pharmacist_dashboard?tab=refills', { replace: true });
  }, [user, navigate]);

  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const [busyId, setBusyId] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [medicines, setMedicines] = useState([]);
  const [approvedPrescriptions, setApprovedPrescriptions] = useState([]);
  const [partners, setPartners] = useState(COURIER_PARTNERS_FALLBACK);
  const [lines, setLines] = useState([{ medicineId: '', quantity: 1 }]);
  const [frequencyDays, setFrequencyDays] = useState(30);
  const [firstRefill, setFirstRefill] = useState('');
  const [prescriptionId, setPrescriptionId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.contactNumber || '');
  const [courier, setCourier] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = unwrap(await client.get('/api/v1/subscriptions/my'));
      setSubscriptions(Array.isArray(data) ? data : []);
    } catch (err) {
      setFeedback({ type: 'error', message: errorMessage(err, 'Could not load your subscriptions.') });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!showForm) return;
    client.get('/api/v1/medicines').then((res) => setMedicines(unwrap(res) || [])).catch(() => {});
    client.get('/api/v1/prescriptions', { params: { status: 'APPROVED' } })
      .then((res) => setApprovedPrescriptions((unwrap(res) || []).filter((p) => p.status === 'APPROVED')))
      .catch(() => {});
    deliveryApi.courierPartners().then((l) => Array.isArray(l) && l.length && setPartners(l)).catch(() => {});
  }, [showForm]);

  const medicineById = useMemo(() => new Map(medicines.map((m) => [String(m.id), m])), [medicines]);
  const rxSelected = lines.some((l) => medicineById.get(String(l.medicineId))?.requiresPrescription);
  const formCost = lines.reduce((sum, l) => {
    const med = medicineById.get(String(l.medicineId));
    return sum + (med ? Number(med.unitPrice || 0) * (Number(l.quantity) || 0) : 0);
  }, 0);

  const updateLine = (i, patch) => setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const submit = async (e) => {
    e.preventDefault();
    const chosen = lines.filter((l) => l.medicineId);
    if (chosen.length === 0) return setFormError('Choose at least one medicine.');
    if (new Set(chosen.map((l) => l.medicineId)).size !== chosen.length) return setFormError('Each medicine can only be added once.');
    if (chosen.some((l) => !(Number(l.quantity) >= 1 && Number(l.quantity) <= 100))) return setFormError('Quantity must be between 1 and 100.');
    if (firstRefill && firstRefill < today()) return setFormError('The first refill date cannot be in the past.');
    if (rxSelected && !prescriptionId) return setFormError('Choose an approved prescription for the prescription-only medicine.');
    if (address.trim().length < 5) return setFormError('Enter the delivery address for your refills.');
    if (!isValidPhone(phone)) return setFormError(PHONE_HINT);

    setSaving(true);
    setFormError('');
    try {
      await client.post('/api/v1/subscriptions/my', {
        frequencyDays: Number(frequencyDays),
        nextRefillDate: firstRefill || null,
        prescriptionId: rxSelected ? Number(prescriptionId) : null,
        deliveryAddress: address.trim(),
        contactPhone: phone.trim(),
        preferredCourier: courier || null,
        items: chosen.map((l) => ({ medicineId: Number(l.medicineId), quantity: Number(l.quantity) })),
      });
      setFeedback({ type: 'success', message: 'Refill subscription created. The pharmacist sends each refill when it is due.' });
      setShowForm(false);
      setLines([{ medicineId: '', quantity: 1 }]);
      load();
    } catch (err) {
      setFormError(errorMessage(err, 'Could not create the subscription.'));
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (sub, status) => {
    if (status === 'CANCELLED' && !window.confirm(`Cancel subscription #SUB-${sub.id}? This cannot be undone.`)) return;
    setBusyId(sub.id);
    setFeedback({ type: '', message: '' });
    try {
      await client.patch(`/api/v1/subscriptions/my/${sub.id}/status`, null, { params: { status } });
      load();
    } catch (err) {
      setFeedback({ type: 'error', message: errorMessage(err, 'Could not update the subscription.') });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900">My refill subscriptions</h1>
          <p className="text-sm text-neutral-600">Get your regular medicines on a schedule. Pause, resume or cancel any time.</p>
        </div>
        <button type="button" disabled={refillsPaused} onClick={() => setShowForm((v) => !v)}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-neutral-300 text-white text-sm font-bold">
          {showForm ? 'Close' : 'New subscription'}
        </button>
      </div>

      <FeaturePausedBanner title="Refill subscriptions" info={featureStatus.REFILLS} />

      {feedback.message && (
        <p className={`mb-4 p-3 rounded-xl text-xs font-semibold border ${
          feedback.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`}
          role={feedback.type === 'error' ? 'alert' : 'status'}>
          {feedback.message}
        </p>
      )}

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl p-5 border border-neutral-200 space-y-4 mb-6 text-sm">
          <h2 className="font-bold text-neutral-900">New refill subscription</h2>
          <div className="space-y-2">
            <span className="text-xs font-bold text-neutral-600">Medicines *</span>
            {lines.map((line, i) => (
              <div key={i} className="flex gap-2 items-center">
                <select aria-label={`Medicine ${i + 1}`} value={line.medicineId} onChange={(e) => updateLine(i, { medicineId: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-neutral-300">
                  <option value="">Select a medicine</option>
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>{m.name} · {money(m.unitPrice)}{m.requiresPrescription ? ' (prescription)' : ''}</option>
                  ))}
                </select>
                <input type="number" min="1" max="100" aria-label={`Quantity ${i + 1}`} value={line.quantity}
                  onChange={(e) => updateLine(i, { quantity: e.target.value })} className="w-20 px-3 py-2 rounded-xl border border-neutral-300" />
                {lines.length > 1 && (
                  <button type="button" aria-label="Remove medicine" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}
                    className="w-8 h-8 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-600">
                    <i className="fa-solid fa-trash text-xs" />
                  </button>
                )}
              </div>
            ))}
            {lines.length < 20 && (
              <button type="button" onClick={() => setLines((p) => [...p, { medicineId: '', quantity: 1 }])}
                className="text-xs font-bold text-emerald-700 hover:underline">+ Add another medicine</button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">Repeat every *</span>
              <select value={frequencyDays} onChange={(e) => setFrequencyDays(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300">
                {FREQUENCIES.map((d) => <option key={d} value={d}>{d} days</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">First refill date (optional)</span>
              <input type="date" min={today()} value={firstRefill} onChange={(e) => setFirstRefill(e.target.value)}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300" />
            </label>
          </div>

          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Delivery address *</span>
            <textarea rows="2" maxLength={500} value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 12 Flower Road, Colombo 07" className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300" />
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">Phone *</span>
              <input type="tel" maxLength={16} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0771234567"
                className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300" />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">Delivery partner</span>
              <select value={courier} onChange={(e) => setCourier(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300">
                <option value="">Pharmacy's choice</option>
                {partners.map((p) => <option key={p.code} value={p.name}>{p.name}</option>)}
              </select>
            </label>
          </div>

          {rxSelected && (
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
              <p className="text-xs font-bold text-amber-900">Prescription required</p>
              {approvedPrescriptions.length > 0 ? (
                <select aria-label="Approved prescription" value={prescriptionId} onChange={(e) => setPrescriptionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white border border-amber-300">
                  <option value="">Select an approved prescription</option>
                  {approvedPrescriptions.map((p) => <option key={p.id} value={p.id}>Rx #{p.id}{p.doctorName ? ` · ${p.doctorName}` : ''}</option>)}
                </select>
              ) : (
                <p className="text-xs text-amber-900">You have no approved prescription. <Link to="/prescription" className="font-bold underline">Upload one</Link> first.</p>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-neutral-100">
            <span className="font-bold text-neutral-700">Cost per refill: {money(formCost)} + delivery</span>
            <button type="submit" disabled={saving || refillsPaused}
              className="px-5 py-2 rounded-xl bg-neutral-900 hover:bg-black disabled:bg-neutral-300 text-white font-bold">
              {saving ? 'Saving...' : 'Subscribe'}
            </button>
          </div>
          {formError && <p className="text-xs text-red-600 font-semibold" role="alert">{formError}</p>}
        </form>
      )}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading subscriptions...</p>
      ) : subscriptions.length === 0 ? (
        <p className="bg-white rounded-2xl p-8 text-center border border-neutral-200 text-sm text-neutral-500">You have no refill subscriptions yet.</p>
      ) : (
        <div className="space-y-3">
          {subscriptions.map((sub) => (
            <div key={sub.id} className="bg-white rounded-2xl p-5 border border-neutral-200 space-y-3 text-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <span className="font-bold">#SUB-{sub.id}</span>
                  <p className="text-xs text-neutral-600 mt-1">{(sub.items || []).map((i) => `${i.quantity} x ${i.name}`).join(', ')}</p>
                </div>
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[sub.status] || ''}`}>{sub.status}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div><span className="block font-bold text-neutral-500">Repeats</span>Every {sub.frequencyDays} days</div>
                <div><span className="block font-bold text-neutral-500">Next refill</span>{sub.status === 'ACTIVE' ? sub.nextRefillDate : '—'}</div>
                <div><span className="block font-bold text-neutral-500">Per refill</span>{money(cycleCost(sub))} + delivery</div>
                <div><span className="block font-bold text-neutral-500">Deliver to</span>{sub.deliveryAddress || '—'}</div>
              </div>
              {sub.status !== 'CANCELLED' && (
                <div className="flex gap-2 pt-2 border-t border-neutral-100">
                  {sub.status === 'ACTIVE' ? (
                    <button type="button" disabled={busyId === sub.id} onClick={() => changeStatus(sub, 'PAUSED')}
                      className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold">Pause</button>
                  ) : (
                    <button type="button" disabled={busyId === sub.id || refillsPaused} onClick={() => changeStatus(sub, 'ACTIVE')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-bold disabled:opacity-50">Resume</button>
                  )}
                  <button type="button" disabled={busyId === sub.id} onClick={() => changeStatus(sub, 'CANCELLED')}
                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold">Cancel</button>
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
