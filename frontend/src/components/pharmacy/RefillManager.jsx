import React, { useCallback, useEffect, useState } from 'react';
import client, { errorMessage, unwrap } from '../../api/client';

const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().slice(0, 10);
const cost = (sub) => (sub.items || []).reduce((s, i) => s + Number(i.unitPrice || 0) * (i.quantity || 0), 0);

const STATUS_STYLE = {
  ACTIVE: 'bg-emerald-100 text-emerald-800',
  PAUSED: 'bg-amber-100 text-amber-800',
  CANCELLED: 'bg-neutral-200 text-neutral-600',
};

/**
 * Pharmacist view of every refill subscription. "Refill now" picks the medicines, deducts stock,
 * sends the order to Delivery Management and moves the next refill date forward.
 */
const RefillManager = ({ onMessage }) => {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('ACTIVE');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = unwrap(await client.get('/api/v1/subscriptions'));
      setSubs(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load subscriptions.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const act = async (sub, fn, success) => {
    setBusyId(sub.id);
    setError('');
    try {
      const res = await fn();
      onMessage?.(res?.data?.message || success);
      load();
    } catch (err) {
      setError(errorMessage(err, 'That did not work.'));
    } finally {
      setBusyId(null);
    }
  };

  const refill = (sub) => act(sub, () => client.post(`/api/v1/pharmacy/subscriptions/${sub.id}/refill`), 'Refill sent to delivery.');
  const setStatus = (sub, status) => {
    if (status === 'CANCELLED' && !window.confirm(`Cancel subscription #SUB-${sub.id}?`)) return;
    act(sub, () => client.patch(`/api/v1/subscriptions/${sub.id}/status`, null, { params: { status } }), `Subscription ${status.toLowerCase()}.`);
  };

  const visible = subs
    .filter((s) => filter === 'ALL' || s.status === filter)
    .sort((a, b) => String(a.nextRefillDate).localeCompare(String(b.nextRefillDate)));
  const dueCount = subs.filter((s) => s.status === 'ACTIVE' && s.nextRefillDate <= today()).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-neutral-900">Refill subscriptions</h1>
          <p className="text-xs text-neutral-500">
            {dueCount > 0 ? `${dueCount} refill(s) due today or overdue.` : 'No refills are due today.'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select aria-label="Status filter" value={filter} onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-neutral-300 text-sm">
            <option value="ACTIVE">Active</option>
            <option value="PAUSED">Paused</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="ALL">All</option>
          </select>
          <button type="button" onClick={load} className="px-3 py-2 rounded-xl bg-neutral-900 text-white text-sm font-bold">Refresh</button>
        </div>
      </div>

      {error && <p className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold" role="alert">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading...</p>
      ) : visible.length === 0 ? (
        <p className="bg-white rounded-2xl border border-neutral-200 p-6 text-sm text-neutral-500">No subscriptions in this list.</p>
      ) : (
        <div className="bg-white rounded-2xl border border-neutral-200 overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 text-neutral-600 uppercase text-[11px]">
              <tr>
                <th className="p-3">Subscription</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Medicines</th>
                <th className="p-3">Every</th>
                <th className="p-3">Next refill</th>
                <th className="p-3">Deliver to</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {visible.map((sub) => {
                const due = sub.status === 'ACTIVE' && sub.nextRefillDate <= today();
                return (
                  <tr key={sub.id} className={due ? 'bg-amber-50/60' : ''}>
                    <td className="p-3 font-bold">#SUB-{sub.id}</td>
                    <td className="p-3">{sub.customerName}</td>
                    <td className="p-3">
                      {(sub.items || []).map((i) => `${i.quantity} x ${i.name}`).join(', ')}
                      <div className="text-neutral-500">{money(cost(sub))} per refill</div>
                    </td>
                    <td className="p-3">{sub.frequencyDays} days</td>
                    <td className={`p-3 ${due ? 'font-bold text-amber-800' : ''}`}>{sub.nextRefillDate}{due ? ' (due)' : ''}</td>
                    <td className="p-3 max-w-[200px]">
                      {sub.deliveryAddress || <span className="text-red-600">no address</span>}
                      {sub.contactPhone && <div className="text-neutral-500">{sub.contactPhone}</div>}
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded-full font-bold ${STATUS_STYLE[sub.status] || ''}`}>{sub.status}</span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap space-x-1">
                      {sub.status === 'ACTIVE' && (
                        <>
                          <button type="button" disabled={busyId === sub.id} onClick={() => refill(sub)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold disabled:opacity-50">
                            Refill now
                          </button>
                          <button type="button" disabled={busyId === sub.id} onClick={() => setStatus(sub, 'PAUSED')}
                            className="px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 font-bold">Pause</button>
                        </>
                      )}
                      {sub.status === 'PAUSED' && (
                        <button type="button" disabled={busyId === sub.id} onClick={() => setStatus(sub, 'ACTIVE')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 font-bold">Resume</button>
                      )}
                      {sub.status !== 'CANCELLED' && (
                        <button type="button" disabled={busyId === sub.id} onClick={() => setStatus(sub, 'CANCELLED')}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 font-bold">Cancel</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default RefillManager;
