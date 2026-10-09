import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client, { errorMessage, unwrap } from '../api/client';
import { isValidPhone, PHONE_HINT } from '../utils/validation';

const ADDRESS_KEY = 'pharma_user_addresses';
const money = (n) => `LKR ${Number(n || 0).toLocaleString('en-LK', { minimumFractionDigits: 2 })}`;

const loadAddresses = () => {
  try {
    return JSON.parse(localStorage.getItem(ADDRESS_KEY) || '[]');
  } catch {
    return [];
  }
};

const Message = ({ msg }) => (msg?.text ? (
  <p className={`text-xs font-semibold ${msg.type === 'error' ? 'text-red-600' : 'text-emerald-700'}`} role={msg.type === 'error' ? 'alert' : 'status'}>
    {msg.text}
  </p>
) : null);

/** My account: details, saved addresses (used at checkout), order history and password. */
const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const isCustomer = user?.role === 'CUSTOMER';
  const [tab, setTab] = useState('profile');

  // profile
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.contactNumber || '');
  const [profileMsg, setProfileMsg] = useState({});
  const [saving, setSaving] = useState(false);

  // addresses (kept in this browser; the default one pre-fills checkout)
  const [addresses, setAddresses] = useState(loadAddresses);
  const [newAddr, setNewAddr] = useState({ label: 'Home', street: '', city: '', postalCode: '', phone: '' });
  const [addrMsg, setAddrMsg] = useState({});

  // orders
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState('');

  // password
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [pwMsg, setPwMsg] = useState({});

  useEffect(() => {
    setFullName(user?.fullName || '');
    setPhone(user?.contactNumber || '');
  }, [user]);

  useEffect(() => {
    if (tab !== 'orders') return;
    setOrdersLoading(true);
    setOrdersError('');
    client.get('/api/v1/orders/my-orders')
      .then((res) => setOrders(unwrap(res) || []))
      .catch((err) => setOrdersError(errorMessage(err, 'Could not load your orders.')))
      .finally(() => setOrdersLoading(false));
  }, [tab]);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (fullName.trim().length < 2) return setProfileMsg({ type: 'error', text: 'Enter your full name.' });
    if (phone && !isValidPhone(phone)) return setProfileMsg({ type: 'error', text: PHONE_HINT });
    setSaving(true);
    try {
      const res = await client.put('/api/v1/users/profile', { fullName: fullName.trim(), contactNumber: phone.trim() });
      const updated = unwrap(res);
      if (updated) updateUser(updated);
      setProfileMsg({ type: 'success', text: 'Your details were saved.' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: errorMessage(err, 'Could not save your details.') });
    } finally {
      setSaving(false);
    }
  };

  const storeAddresses = (list) => {
    setAddresses(list);
    localStorage.setItem(ADDRESS_KEY, JSON.stringify(list));
  };

  const addAddress = (e) => {
    e.preventDefault();
    if (newAddr.street.trim().length < 3) return setAddrMsg({ type: 'error', text: 'Enter the street address.' });
    if (newAddr.city.trim().length < 2) return setAddrMsg({ type: 'error', text: 'Enter the city, e.g. Colombo 03.' });
    if (newAddr.phone && !isValidPhone(newAddr.phone)) return setAddrMsg({ type: 'error', text: PHONE_HINT });
    storeAddresses([...addresses, { ...newAddr, id: Date.now(), isDefault: addresses.length === 0 }]);
    setNewAddr({ label: 'Home', street: '', city: '', postalCode: '', phone: '' });
    setAddrMsg({ type: 'success', text: 'Address saved.' });
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pw.next.length < 6) return setPwMsg({ type: 'error', text: 'The new password must be at least 6 characters.' });
    if (pw.next !== pw.confirm) return setPwMsg({ type: 'error', text: 'The new passwords do not match.' });
    try {
      await client.put('/api/v1/users/password', { currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      setPwMsg({ type: 'success', text: 'Password changed.' });
    } catch (err) {
      setPwMsg({ type: 'error', text: errorMessage(err, 'Could not change the password.') });
    }
  };

  const tabs = [
    { id: 'profile', label: 'My details' },
    ...(isCustomer ? [{ id: 'addresses', label: 'Addresses' }, { id: 'orders', label: 'Orders' }] : []),
    { id: 'password', label: 'Password' },
  ];
  const input = 'mt-1 w-full px-3 py-2 rounded-xl border border-neutral-300';

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-12 max-w-4xl mx-auto">
      <h1 className="text-2xl font-extrabold text-neutral-900">My account</h1>
      <p className="text-sm text-neutral-500 mb-6">{user?.email}</p>

      {isCustomer && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          {[
            { to: '/my-deliveries', icon: 'fa-truck-fast', label: 'My deliveries' },
            { to: '/prescription', icon: 'fa-file-prescription', label: 'My prescriptions' },
            { to: '/modules/subscriptions', icon: 'fa-arrows-rotate', label: 'Refill subscriptions' },
          ].map((l) => (
            <Link key={l.to} to={l.to} className="bg-white border border-neutral-200 rounded-2xl p-4 flex items-center gap-3 hover:border-neutral-400">
              <i className={`fa-solid ${l.icon} text-emerald-700`} />
              <span className="text-sm font-bold">{l.label}</span>
            </Link>
          ))}
        </div>
      )}

      <div className="flex gap-2 mb-4" role="tablist">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-bold ${tab === t.id ? 'bg-neutral-900 text-white' : 'bg-white border border-neutral-200'}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-neutral-200 p-6 text-sm">
        {tab === 'profile' && (
          <form onSubmit={saveProfile} className="space-y-3 max-w-md">
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">Full name</span>
              <input type="text" maxLength={150} value={fullName} onChange={(e) => setFullName(e.target.value)} className={input} />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">Phone</span>
              <input type="tel" maxLength={16} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="0771234567" className={input} />
            </label>
            <label className="block">
              <span className="text-xs font-bold text-neutral-600">Email</span>
              <input type="email" value={user?.email || ''} disabled className={`${input} bg-neutral-50 text-neutral-500`} />
            </label>
            <Message msg={profileMsg} />
            <button type="submit" disabled={saving} className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-bold disabled:opacity-50">
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        )}

        {tab === 'addresses' && (
          <div className="space-y-4">
            <p className="text-xs text-neutral-500">Your default address is filled in for you at checkout. Addresses are saved in this browser.</p>
            {addresses.length === 0 ? (
              <p className="text-neutral-500">No saved addresses yet.</p>
            ) : (
              <ul className="space-y-2">
                {addresses.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-neutral-200">
                    <span>
                      <strong>{a.label}</strong>{a.isDefault && <span className="ml-2 text-[10px] font-bold text-emerald-700">DEFAULT</span>}
                      <span className="block text-xs text-neutral-600">{[a.street, a.city, a.postalCode].filter(Boolean).join(', ')}{a.phone ? ` · ${a.phone}` : ''}</span>
                    </span>
                    <span className="flex gap-3 text-xs font-bold shrink-0">
                      {!a.isDefault && (
                        <button type="button" onClick={() => storeAddresses(addresses.map((x) => ({ ...x, isDefault: x.id === a.id })))}
                          className="text-emerald-700">Make default</button>
                      )}
                      <button type="button" className="text-red-600" onClick={() => {
                        const rest = addresses.filter((x) => x.id !== a.id);
                        if (a.isDefault && rest.length) rest[0] = { ...rest[0], isDefault: true };
                        storeAddresses(rest);
                      }}>Remove</button>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <form onSubmit={addAddress} className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-neutral-100">
              <label className="block">
                <span className="text-xs font-bold text-neutral-600">Label</span>
                <input type="text" maxLength={30} value={newAddr.label} onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })} className={input} />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-600">Phone (optional)</span>
                <input type="tel" maxLength={16} value={newAddr.phone} onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })} className={input} />
              </label>
              <label className="block sm:col-span-2">
                <span className="text-xs font-bold text-neutral-600">Street address *</span>
                <input type="text" maxLength={200} value={newAddr.street} onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })} className={input} />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-600">City *</span>
                <input type="text" maxLength={60} value={newAddr.city} placeholder="Colombo 03" onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })} className={input} />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-neutral-600">Postal code</span>
                <input type="text" maxLength={10} value={newAddr.postalCode} onChange={(e) => setNewAddr({ ...newAddr, postalCode: e.target.value })} className={input} />
              </label>
              <div className="sm:col-span-2 space-y-2">
                <Message msg={addrMsg} />
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-bold">Save address</button>
              </div>
            </form>
          </div>
        )}

        {tab === 'orders' && (
          ordersLoading ? <p className="text-neutral-500">Loading orders...</p>
            : ordersError ? <p className="text-red-600">{ordersError}</p>
            : orders.length === 0 ? <p className="text-neutral-500">You have no orders yet. <Link to="/catalog" className="font-bold text-emerald-700">Start shopping</Link></p>
            : (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl border border-neutral-200">
                    <span>
                      <strong>Order #{o.id}</strong>
                      <span className="block text-xs text-neutral-500">{o.createdAt ? new Date(o.createdAt).toLocaleString() : ''} · {o.shippingAddress}</span>
                    </span>
                    <span className="flex items-center gap-3">
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-neutral-100">{o.status}</span>
                      <span className="font-bold">{money(o.totalAmount)}</span>
                    </span>
                  </div>
                ))}
                <Link to="/my-deliveries" className="inline-block pt-2 text-xs font-bold text-emerald-700 hover:underline">Track deliveries →</Link>
              </div>
            )
        )}

        {tab === 'password' && (
          <form onSubmit={changePassword} className="space-y-3 max-w-md">
            {[
              ['current', 'Current password'],
              ['next', 'New password (min 6 characters)'],
              ['confirm', 'Confirm new password'],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs font-bold text-neutral-600">{label}</span>
                <input type="password" value={pw[key]} onChange={(e) => setPw({ ...pw, [key]: e.target.value })} className={input} />
              </label>
            ))}
            <Message msg={pwMsg} />
            <button type="submit" className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white font-bold">Change password</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
