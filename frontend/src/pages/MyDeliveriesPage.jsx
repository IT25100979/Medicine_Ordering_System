import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { deliveryApi } from '../api/deliveryApi';
import { errorMessage } from '../api/client';
import useRealtimeChannel, { DELIVERY_EVENT_TYPES } from '../hooks/useRealtimeChannel';

const STEPS = [
  { status: 'PENDING', label: 'Awaiting approval' },
  { status: 'APPROVED', label: 'Approved' },
  { status: 'DISPATCHED', label: 'Courier assigned' },
  { status: 'IN_TRANSIT', label: 'Out for delivery' },
  { status: 'DELIVERED', label: 'Delivered' },
];

const STOPPED = {
  REJECTED: 'bg-red-50 text-red-800 border-red-200',
  TERMINATED: 'bg-red-50 text-red-800 border-red-200',
  FAILED: 'bg-rose-50 text-rose-800 border-rose-200',
  ON_HOLD: 'bg-purple-50 text-purple-800 border-purple-200',
  POSTPONED: 'bg-orange-50 text-orange-800 border-orange-200',
};

const formatDate = (value) => (value ? new Date(value).toLocaleString() : '');

const ProgressBar = ({ status }) => {
  const reached = STEPS.findIndex((s) => s.status === status);
  return (
    <ol className="grid grid-cols-5 gap-1.5" aria-label="Delivery progress">
      {STEPS.map((step, i) => {
        const done = reached >= i;
        return (
          <li key={step.status} className="text-center">
            <div className={`h-1.5 rounded-full ${done ? 'bg-emerald-600' : 'bg-neutral-200'}`} />
            <span className={`block mt-1 text-[10px] font-bold leading-tight ${done ? 'text-emerald-800' : 'text-neutral-400'}`}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
};

/** Customer view: track each delivery live, see the handover OTP and the full timeline. */
const MyDeliveriesPage = () => {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [liveMessage, setLiveMessage] = useState('');
  const [expanded, setExpanded] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await deliveryApi.myDeliveries();
      setDeliveries(Array.isArray(data) ? data : []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load your deliveries.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Live updates pushed by the backend's DeliveryRealtimeObserver
  useRealtimeChannel(user?.userId ? `delivery-customer-${user.userId}` : null, DELIVERY_EVENT_TYPES, (type, payload) => {
    setLiveMessage(payload?.message || `Delivery #DEL-${payload?.deliveryId} updated`);
    load();
  });

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-12 max-w-5xl mx-auto min-h-screen">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-neutral-900 flex items-center gap-3">
            <i className="fa-solid fa-truck-fast text-emerald-700" />
            My Deliveries
          </h1>
          <p className="text-xs text-neutral-500 mt-1">
            Updates appear here automatically. Give the 4-digit handover code (1234) to the courier only when your parcel arrives.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 rounded-full bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider"
        >
          Refresh
        </button>
      </div>

      {liveMessage && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center justify-between gap-2" role="status">
          <span><i className="fa-solid fa-bolt text-emerald-600 mr-1.5" />{liveMessage}</span>
          <button type="button" onClick={() => setLiveMessage('')} className="text-emerald-700" aria-label="Dismiss">
            <i className="fa-solid fa-xmark" />
          </button>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-semibold" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-center py-16 text-xs font-bold text-neutral-400">Loading your deliveries...</p>
      ) : deliveries.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-neutral-200 space-y-3">
          <p className="text-sm font-bold text-neutral-800">You have no deliveries yet.</p>
          <Link to="/catalog" className="inline-block px-6 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase rounded-full">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {deliveries.map((d) => (
            <div key={d.id} className="bg-white rounded-2xl p-5 border border-neutral-200 shadow-sm space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="font-mono font-black text-sm text-neutral-900">#DEL-{d.id}</span>
                  <span className="text-xs text-neutral-400 ml-2">Order #{d.orderId} · {formatDate(d.createdAt)}</span>
                  <p className="text-xs text-neutral-600 mt-1">{d.itemsSummary}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full border ${
                    STOPPED[d.status] || 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {d.statusLabel}
                  </span>
                  <p className="text-sm font-black text-neutral-900 mt-1">
                    LKR {Number(d.orderTotal || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {!STOPPED[d.status] && <ProgressBar status={d.status} />}
              {d.actionReason && STOPPED[d.status] && (
                <p className="text-xs text-red-700 font-semibold">Reason: {d.actionReason}</p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Delivery partner</span>
                  <span className="font-bold text-neutral-900">{d.assignedCourier || d.preferredCourier}</span>
                  {!d.assignedCourier && <span className="text-neutral-400"> (your choice)</span>}
                </div>
                <div className="sm:col-span-2">
                  <span className="block text-[10px] uppercase font-bold text-neutral-400">Address</span>
                  <span className="text-neutral-800">{d.orderAddress}</span>
                </div>
              </div>

              {d.handoverOtp && (
                <div className="p-4 rounded-xl bg-zinc-900 text-white flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-zinc-400">Handover code</span>
                    <span className="font-mono text-2xl font-black tracking-[0.3em]">{d.handoverOtp}</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 max-w-xs">
                    Tell this code to the courier when you receive the parcel. Valid until {formatDate(d.otpExpiresAt)}.
                  </p>
                </div>
              )}

              <button
                type="button"
                onClick={() => setExpanded(expanded === d.id ? null : d.id)}
                className="text-xs font-bold text-emerald-800 hover:underline"
                aria-expanded={expanded === d.id}
              >
                {expanded === d.id ? 'Hide timeline' : `Show timeline (${d.timeline?.length || 0})`}
              </button>
              {expanded === d.id && (
                <ol className="border-l-2 border-emerald-200 pl-4 space-y-2">
                  {(d.timeline || []).map((e, i) => (
                    <li key={i} className="text-xs">
                      <span className="font-bold text-neutral-900">{e.description}</span>
                      <span className="block text-[10px] text-neutral-400">
                        {formatDate(e.createdAt)}{e.actorRole && e.actorRole !== 'CUSTOMER' ? ` · ${e.actorName}` : ''}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyDeliveriesPage;
