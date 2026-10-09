import React, { useEffect, useMemo, useState } from 'react';
import client, { errorMessage, unwrap } from '../../api/client';
import { COURIER_PARTNERS_FALLBACK } from '../../api/deliveryApi';
import { isValidPhone, PHONE_HINT } from '../../utils/validation';

const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
const available = (m) => Math.max(0, Number(m.stockQuantity || 0) - Number(m.allocatedStock || 0));

/**
 * Pharmacist picks the medicines for an approved prescription. On confirm the stock is deducted
 * and the order goes to Delivery Management (POST /api/v1/pharmacy/prescriptions/{id}/dispense).
 */
const DispenseDialog = ({ prescription, onClose, onDispensed }) => {
  const [medicines, setMedicines] = useState([]);
  const [lines, setLines] = useState([{ medicineId: '', quantity: 1 }]);
  const [address, setAddress] = useState(prescription.deliveryAddress || '');
  const [phone, setPhone] = useState(prescription.contactPhone || '');
  const [courier, setCourier] = useState(prescription.preferredCourier || 'In Company Delivery');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // staff see the whole sellable catalog (incl. prescription-only medicines)
    client.get('/api/v1/medicines', { params: { onlyLive: true } })
      .then((res) => {
        const list = unwrap(res);
        setMedicines((Array.isArray(list) ? list : []).filter((m) => !m.isQuarantined));
      })
      .catch((err) => setError(errorMessage(err, 'Could not load the catalog.')));
  }, []);

  const byId = useMemo(() => new Map(medicines.map((m) => [String(m.id), m])), [medicines]);
  const total = lines.reduce((sum, l) => {
    const m = byId.get(String(l.medicineId));
    return sum + (m ? Number(m.unitPrice || 0) * (Number(l.quantity) || 0) : 0);
  }, 0);

  const update = (i, patch) => setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));

  const submit = async (e) => {
    e.preventDefault();
    const chosen = lines.filter((l) => l.medicineId);
    if (chosen.length === 0) return setError('Pick at least one medicine.');
    if (new Set(chosen.map((l) => l.medicineId)).size !== chosen.length) return setError('Each medicine can be added only once.');
    for (const l of chosen) {
      const m = byId.get(String(l.medicineId));
      const qty = Number(l.quantity);
      if (!(qty >= 1 && qty <= 100)) return setError('Quantity must be between 1 and 100.');
      if (m && qty > available(m)) return setError(`Only ${available(m)} unit(s) of ${m.name} are in stock.`);
    }
    if (address.trim().length < 5) return setError('Enter the delivery address.');
    if (!isValidPhone(phone)) return setError(PHONE_HINT);

    setSaving(true);
    setError('');
    try {
      const res = await client.post(`/api/v1/pharmacy/prescriptions/${prescription.id}/dispense`, {
        items: chosen.map((l) => ({ medicineId: Number(l.medicineId), quantity: Number(l.quantity) })),
        deliveryAddress: address.trim(),
        contactPhone: phone.trim(),
        preferredCourier: courier,
        note: note.trim() || null,
      });
      onDispensed(res.data?.message, unwrap(res));
    } catch (err) {
      setError(errorMessage(err, 'Could not dispense this prescription.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 overflow-y-auto">
      <form onSubmit={submit} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl my-auto space-y-4 text-sm">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">Dispense prescription #{prescription.id}</h3>
            <p className="text-xs text-neutral-500">{prescription.customerName} · {prescription.doctorName || 'doctor not given'}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="w-8 h-8 rounded-full hover:bg-neutral-100 text-neutral-500">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold text-neutral-600">Medicines</span>
          {lines.map((line, i) => {
            const m = byId.get(String(line.medicineId));
            return (
              <div key={i} className="flex gap-2 items-center">
                <select aria-label={`Medicine ${i + 1}`} value={line.medicineId} onChange={(e) => update(i, { medicineId: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-neutral-300">
                  <option value="">Choose a medicine</option>
                  {medicines.map((med) => (
                    <option key={med.id} value={med.id} disabled={available(med) === 0}>
                      {med.name} · {money(med.unitPrice)} · {available(med)} in stock
                    </option>
                  ))}
                </select>
                <input type="number" min="1" max={m ? Math.min(100, available(m)) : 100} aria-label={`Quantity ${i + 1}`}
                  value={line.quantity} onChange={(e) => update(i, { quantity: e.target.value })}
                  className="w-20 px-3 py-2 rounded-xl border border-neutral-300" />
                {lines.length > 1 && (
                  <button type="button" aria-label="Remove" onClick={() => setLines((p) => p.filter((_, idx) => idx !== i))}
                    className="w-8 h-8 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-600">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
              </div>
            );
          })}
          {lines.length < 30 && (
            <button type="button" onClick={() => setLines((p) => [...p, { medicineId: '', quantity: 1 }])}
              className="text-xs font-bold text-emerald-700 hover:underline">+ Add medicine</button>
          )}
        </div>

        <label className="block">
          <span className="text-xs font-bold text-neutral-600">Delivery address</span>
          <textarea rows="2" maxLength={500} value={address} onChange={(e) => setAddress(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Phone</span>
            <input type="tel" maxLength={16} value={phone} onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-neutral-600">Delivery partner</span>
            <select value={courier} onChange={(e) => setCourier(e.target.value)} className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300">
              {COURIER_PARTNERS_FALLBACK.map((p) => <option key={p.code} value={p.name}>{p.name}</option>)}
            </select>
          </label>
        </div>
        <label className="block">
          <span className="text-xs font-bold text-neutral-600">Note for the delivery team (optional)</span>
          <input type="text" maxLength={1000} value={note} onChange={(e) => setNote(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300" />
        </label>

        <p className="text-xs text-neutral-600">
          Medicines {money(total)} + delivery fee. Stock is deducted now; the order goes to Delivery Management for approval.
        </p>
        {error && <p className="text-xs text-red-600 font-semibold" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-neutral-300 text-xs font-bold">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-50">
            {saving ? 'Sending...' : 'Pick & send to delivery'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DispenseDialog;
