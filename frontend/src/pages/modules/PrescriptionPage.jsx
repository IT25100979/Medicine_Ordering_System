import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client, { errorMessage, unwrap } from '../../api/client';
import { deliveryApi, COURIER_PARTNERS_FALLBACK } from '../../api/deliveryApi';
import { useAuth } from '../../context/AuthContext';
import useFeatureStatus from '../../hooks/useFeatureStatus';
import FeaturePausedBanner from '../../components/FeaturePausedBanner';
import { isValidPhone, PHONE_HINT } from '../../utils/validation';

const ALLOWED = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.heic'];
const MAX_BYTES = 10 * 1024 * 1024;

const STATUS_STYLE = {
  PENDING: 'bg-amber-100 text-amber-900',
  APPROVED: 'bg-emerald-100 text-emerald-800',
  REJECTED: 'bg-red-100 text-red-800',
};

/**
 * Customer prescriptions: upload a prescription with delivery details, then follow it:
 * pending review -> approved -> the pharmacist picks the medicines -> it arrives via delivery.
 * Pharmacists review and dispense on the pharmacist dashboard.
 */
const PrescriptionPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { status: featureStatus, isEnabled } = useFeatureStatus();
  const paused = !isEnabled('PRESCRIPTIONS');

  useEffect(() => {
    if (user && user.role !== 'CUSTOMER') navigate('/pharmacist_dashboard', { replace: true });
  }, [user, navigate]);

  const [prescriptions, setPrescriptions] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState(COURIER_PARTNERS_FALLBACK);

  // upload form
  const [file, setFile] = useState(null);
  const [doctorName, setDoctorName] = useState('');
  const [notes, setNotes] = useState('');
  const [longTerm, setLongTerm] = useState(false);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState(user?.contactNumber || '');
  const [courier, setCourier] = useState('');
  const [formError, setFormError] = useState('');
  const [message, setMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [fileKey, setFileKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rxRes, mine] = await Promise.all([
        client.get('/api/v1/prescriptions'),
        deliveryApi.myDeliveries().catch(() => []),
      ]);
      const list = unwrap(rxRes);
      setPrescriptions(Array.isArray(list) ? list : []);
      setDeliveries(Array.isArray(mine) ? mine : []);
    } catch (err) {
      setFormError(errorMessage(err, 'Could not load your prescriptions.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    deliveryApi.courierPartners().then((l) => Array.isArray(l) && l.length && setPartners(l)).catch(() => {});
  }, [load]);

  // prescriptionId -> the delivery that carries its medicines
  const deliveryByRx = useMemo(() => {
    const map = {};
    deliveries.forEach((d) => {
      if (d.prescriptionId && !['REJECTED', 'TERMINATED'].includes(d.status)) map[d.prescriptionId] = d;
    });
    return map;
  }, [deliveries]);

  const chooseFile = (f) => {
    setFormError('');
    if (!f) return setFile(null);
    const ext = f.name.slice(f.name.lastIndexOf('.')).toLowerCase();
    if (!ALLOWED.includes(ext)) {
      setFile(null);
      return setFormError('Upload a PDF or a photo (JPG, PNG, WEBP, HEIC).');
    }
    if (f.size > MAX_BYTES) {
      setFile(null);
      return setFormError('The file is larger than 10 MB.');
    }
    setFile(f);
  };

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return setFormError('Choose your prescription file.');
    if (address.trim().length < 5) return setFormError('Enter the delivery address for your medicines.');
    if (!isValidPhone(phone)) return setFormError(PHONE_HINT);
    if (!courier) return setFormError('Choose a delivery partner.');

    const form = new FormData();
    form.append('file', file);
    if (doctorName.trim()) form.append('doctorName', doctorName.trim());
    if (notes.trim()) form.append('patientNotes', notes.trim());
    form.append('chronicSubscription', longTerm ? 'true' : 'false');
    form.append('deliveryAddress', address.trim());
    form.append('contactPhone', phone.trim());
    form.append('preferredCourier', courier);

    setUploading(true);
    setFormError('');
    setMessage('');
    try {
      await client.post('/api/v1/prescriptions/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
      setMessage('Prescription uploaded. A pharmacist will review it and prepare your medicines.');
      setFile(null);
      setFileKey((k) => k + 1);
      setDoctorName('');
      setNotes('');
      setLongTerm(false);
      load();
    } catch (err) {
      setFormError(errorMessage(err, 'Upload failed. Please try again.'));
    } finally {
      setUploading(false);
    }
  };

  const cancel = async (rx) => {
    if (!window.confirm(`Cancel prescription #${rx.id}?`)) return;
    try {
      await client.delete(`/api/v1/prescriptions/${rx.id}`);
      load();
    } catch (err) {
      setFormError(errorMessage(err, 'Could not cancel this prescription.'));
    }
  };

  const progress = (rx) => {
    if (rx.status === 'REJECTED') return `Rejected${rx.rejectionReason ? `: ${rx.rejectionReason}` : ''}`;
    if (rx.status === 'PENDING') return 'Waiting for a pharmacist to review';
    const d = deliveryByRx[rx.id];
    if (d) return `Medicines prepared · delivery #DEL-${d.id} is ${d.statusLabel?.toLowerCase() || d.status}`;
    return 'Approved · the pharmacist is preparing your medicines';
  };

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto">
      <h1 className="text-2xl font-extrabold text-neutral-900 mb-1">My prescriptions</h1>
      <p className="text-sm text-neutral-600 mb-6">
        Upload your doctor's prescription. Our pharmacist checks it, picks your medicines and sends them to you.
      </p>

      <FeaturePausedBanner title="Prescription upload" info={featureStatus.PRESCRIPTIONS} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form onSubmit={upload} className="bg-white rounded-2xl border border-neutral-200 p-5 space-y-3 text-sm">
          <h2 className="font-bold text-neutral-900">Upload a prescription</h2>

          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Prescription file * (PDF or photo, max 10 MB)</span>
            <input key={fileKey} type="file" accept={ALLOWED.join(',')} onChange={(e) => chooseFile(e.target.files?.[0])}
              className="mt-1 block w-full text-sm" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Doctor's name</span>
            <input type="text" maxLength={150} value={doctorName} onChange={(e) => setDoctorName(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Note for the pharmacist</span>
            <textarea rows="2" maxLength={1000} value={notes} onChange={(e) => setNotes(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300" />
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="checkbox" checked={longTerm} onChange={(e) => setLongTerm(e.target.checked)} />
            Long-term medicine (keep this prescription for refills)
          </label>

          <h3 className="font-bold text-neutral-900 pt-2">Deliver my medicines to</h3>
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Address *</span>
            <textarea rows="2" maxLength={500} value={address} onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 12 Flower Road, Colombo 07" className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Phone *</span>
            <input type="tel" maxLength={16} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0771234567"
              className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Delivery partner *</span>
            <select value={courier} onChange={(e) => setCourier(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300">
              <option value="">Choose a delivery partner</option>
              {partners.map((p) => <option key={p.code} value={p.name}>{p.name} · ~{p.estimatedDays} day(s)</option>)}
            </select>
          </label>

          {formError && <p className="text-xs text-red-600 font-semibold" role="alert">{formError}</p>}
          {message && <p className="text-xs text-emerald-700 font-semibold" role="status">{message}</p>}
          <button type="submit" disabled={uploading || paused}
            className="w-full py-3 rounded-xl bg-neutral-900 hover:bg-black text-white font-bold disabled:opacity-40">
            {uploading ? 'Uploading...' : 'Upload prescription'}
          </button>
        </form>

        <div className="space-y-3">
          <h2 className="font-bold text-neutral-900">Submitted prescriptions</h2>
          {loading ? (
            <p className="text-sm text-neutral-500">Loading...</p>
          ) : prescriptions.length === 0 ? (
            <p className="text-sm text-neutral-500 bg-white rounded-2xl border border-neutral-200 p-5">You haven't uploaded a prescription yet.</p>
          ) : (
            prescriptions.map((rx) => (
              <div key={rx.id} className="bg-white rounded-2xl border border-neutral-200 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold">Rx #{rx.id}{rx.doctorName ? ` · ${rx.doctorName}` : ''}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[rx.status] || ''}`}>{rx.status}</span>
                </div>
                <p className="text-xs text-neutral-600">{progress(rx)}</p>
                <p className="text-[11px] text-neutral-400">Uploaded {rx.createdAt ? new Date(rx.createdAt).toLocaleString() : ''}</p>
                <div className="flex gap-3 text-xs">
                  {deliveryByRx[rx.id] && <Link to="/my-deliveries" className="font-bold text-emerald-700 hover:underline">Track delivery</Link>}
                  {rx.status === 'PENDING' && (
                    <button type="button" onClick={() => cancel(rx)} className="font-bold text-red-600 hover:underline">Cancel</button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionPage;
