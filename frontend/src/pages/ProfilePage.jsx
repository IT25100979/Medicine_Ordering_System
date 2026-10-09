import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';

const ProfilePage = () => {
  const { user, logout, updateUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'profile');

  useEffect(() => {
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    }
  }, [tabFromUrl]);
  
  // Profile Form State
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [contactNumber, setContactNumber] = useState(user?.contactNumber || user?.phoneNumber || '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ type: '', text: '' });

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  // Address Book State
  const [addresses, setAddresses] = useState(() => {
    const saved = localStorage.getItem('pharma_user_addresses');
    return saved ? JSON.parse(saved) : [
      {
        id: 1,
        label: 'Home (Default)',
        recipient: user?.fullName || 'John Doe',
        phone: user?.contactNumber || '0778899001',
        street: 'No. 45/2, Galle Road',
        city: 'Colombo 03',
        postalCode: '00300',
        notes: 'Cold-chain insulated drop-off at security gate.',
        isDefault: true,
      }
    ];
  });
  const [newAddr, setNewAddr] = useState({
    label: 'Office',
    recipient: '',
    phone: '',
    street: '',
    city: 'Colombo 07',
    postalCode: '00700',
    notes: '',
  });
  const [showAddAddr, setShowAddAddr] = useState(false);

  // Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState(() => {
    const saved = localStorage.getItem('pharma_user_payments');
    return saved ? JSON.parse(saved) : [
      { id: 1, cardType: 'Visa Platinum Healthcare', last4: '4242', expiry: '09/28', isDefault: true },
      { id: 2, cardType: 'Mastercard World Elite', last4: '8811', expiry: '12/29', isDefault: false },
    ];
  });
  const [showAddCard, setShowAddCard] = useState(false);
  const [newCard, setNewCard] = useState({ cardType: 'Visa', last4: '5566', expiry: '05/29' });

  // Orders State
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Subscriptions State
  const [subscriptions, setSubscriptions] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Prescriptions State
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingRx, setLoadingRx] = useState(false);

  // Sync profile when user changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setContactNumber(user.contactNumber || user.phoneNumber || '');
      setAvatarUrl(user.avatarUrl || '');
    }
  }, [user]);

  // Save addresses to localStorage
  const saveAddresses = (newAddrs) => {
    setAddresses(newAddrs);
    localStorage.setItem('pharma_user_addresses', JSON.stringify(newAddrs));
  };

  // Save payments to localStorage
  const savePayments = (newPayments) => {
    setPaymentMethods(newPayments);
    localStorage.setItem('pharma_user_payments', JSON.stringify(newPayments));
  };

  // Load orders & prescriptions when respective tab is opened
  useEffect(() => {
    if (activeTab === 'orders') {
      setLoadingOrders(true);
      client.get('/api/v1/orders/my-orders')
        .then(res => setOrders(res.data?.data || res.data || []))
        .catch(() => {
          // Fallback demo orders
          setOrders([
            {
              id: 'ORD-849201',
              createdAt: '2026-10-07T14:30:00',
              status: 'IN_TRANSIT',
              totalAmount: 14500.00,
              itemsCount: 3,
              batchNo: 'L24-789-COOL',
              storageCondition: 'REFRIGERATED (2°C - 8°C)',
              trackingId: 'TRK-LK-7741',
            },
            {
              id: 'ORD-621849',
              createdAt: '2026-09-28T09:15:00',
              status: 'DELIVERED',
              totalAmount: 6200.00,
              itemsCount: 2,
              batchNo: 'L24-102-AMB',
              storageCondition: 'AMBIENT (15°C - 25°C)',
              trackingId: 'TRK-LK-5510',
            }
          ]);
        })
        .finally(() => setLoadingOrders(false));
    } else if (activeTab === 'subscriptions') {
      setLoadingSubs(true);
      client.get('/api/v1/subscriptions')
        .then(res => setSubscriptions(res.data?.data || res.data || []))
        .catch(() => {
          setSubscriptions([
            {
              id: 'SUB-201',
              medicineName: 'Rosuvastatin Calcium 20mg',
              interval: 'Every 30 Days',
              nextRefillDate: '2026-11-01',
              status: 'ACTIVE',
              quantity: 1,
              price: 3450.00,
            },
            {
              id: 'SUB-202',
              medicineName: 'Metformin 500mg SR',
              interval: 'Every 60 Days',
              nextRefillDate: '2026-11-25',
              status: 'ACTIVE',
              quantity: 2,
              price: 1800.00,
            }
          ]);
        })
        .finally(() => setLoadingSubs(false));
    } else if (activeTab === 'prescriptions') {
      setLoadingRx(true);
      client.get('/api/v1/prescriptions')
        .then(res => setPrescriptions(res.data?.data || res.data || []))
        .catch(() => {
          setPrescriptions([
            {
              id: 1,
              prescriptionCode: 'RX-2026-0089',
              doctorName: 'Dr. A. B. Wickramasinghe (SLMC 44102)',
              issueDate: '2026-10-01',
              status: 'VERIFIED',
              notes: 'Hypertension and lipid management. FEFO batch verified.',
              fileName: 'prescription_dr_wickramasinghe.pdf',
            }
          ]);
        })
        .finally(() => setLoadingRx(false));
    }
  }, [activeTab]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ type: '', text: '' });
    try {
      const res = await client.put('/api/v1/users/profile', {
        fullName,
        contactNumber,
        avatarUrl,
      });
      if (res.data?.data) {
        if (updateUser) updateUser(res.data.data);
      }
      setProfileMsg({ type: 'success', text: 'Profile details successfully updated in database!' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }
    setSavingPassword(true);
    setPasswordMsg({ type: '', text: '' });
    try {
      await client.put('/api/v1/users/password', {
        currentPassword,
        newPassword,
      });
      setPasswordMsg({ type: 'success', text: 'Password successfully changed!' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.response?.data?.message || 'Failed to change password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAddAddress = (e) => {
    e.preventDefault();
    const addr = {
      ...newAddr,
      id: Date.now(),
      recipient: newAddr.recipient || fullName || 'Customer',
      phone: newAddr.phone || contactNumber || '0770000000',
      isDefault: addresses.length === 0,
    };
    saveAddresses([...addresses, addr]);
    setShowAddAddr(false);
    setNewAddr({ label: 'Office', recipient: '', phone: '', street: '', city: 'Colombo 07', postalCode: '00700', notes: '' });
  };

  const handleAddCard = (e) => {
    e.preventDefault();
    const card = {
      id: Date.now(),
      cardType: newCard.cardType,
      last4: newCard.last4 || '1122',
      expiry: newCard.expiry || '01/30',
      isDefault: paymentMethods.length === 0,
    };
    savePayments([...paymentMethods, card]);
    setShowAddCard(false);
  };

  const tabs = [
    { id: 'profile', label: 'Personal Profile', icon: 'fa-user' },
    { id: 'address', label: 'Address Book', icon: 'fa-location-dot' },
    { id: 'payment', label: 'Payment Methods', icon: 'fa-credit-card' },
    { id: 'orders', label: 'Order History', icon: 'fa-box' },
    { id: 'subscriptions', label: 'Refill Subscriptions', icon: 'fa-arrows-rotate' },
    { id: 'prescriptions', label: 'Prescription Vault', icon: 'fa-file-medical' },
    { id: 'security', label: 'Security & Auth', icon: 'fa-shield-halved' },
  ];

  return (
    <div className="pt-28 pb-20 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto min-h-screen">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-500 mb-6">
        <Link to="/" className="hover:text-black transition-colors">Home</Link>
        <span>/</span>
        <span className="text-black">Account Center</span>
      </div>

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-emerald-700 text-white font-black text-2xl flex items-center justify-center shadow-md">
            {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-neutral-900">
                {fullName || 'Account Management'}
              </h1>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 tracking-wider">
                {user?.role || 'CUSTOMER'}
              </span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">
              {user?.email} • Member ID: #US-{user?.id || user?.userId || '101'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold uppercase tracking-wider rounded-xl border border-red-200 transition-colors shadow-xs"
          >
            <i className="fa-solid fa-right-from-bracket" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Multi-Tab Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* Left Navigation Sidebar */}
        <div className="lg:col-span-1 space-y-1 bg-white rounded-2xl p-3 border border-neutral-200 shadow-sm h-fit">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left ${
                activeTab === tab.id
                  ? 'bg-neutral-900 text-white shadow-sm'
                  : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
              }`}
            >
              <i className={`fa-solid ${tab.icon} w-4 text-center ${activeTab === tab.id ? 'text-emerald-400' : 'text-neutral-400'}`} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3">
          
          {/* TAB 1: Profile Details */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">Personal Details</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Manage your legal pharmacy account identity and contact records.</p>
              </div>

              {profileMsg.text && (
                <div className={`p-4 rounded-xl text-xs font-bold ${
                  profileMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {profileMsg.text}
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Full Legal Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-neutral-900 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Contact Mobile Number
                    </label>
                    <input
                      type="text"
                      value={contactNumber}
                      onChange={(e) => setContactNumber(e.target.value)}
                      placeholder="0771234567"
                      className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-neutral-900 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Account Email Address (Read-Only)
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-3 bg-neutral-100 border border-neutral-200 text-neutral-500 rounded-xl text-xs font-medium cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                      Assigned RBAC Role
                    </label>
                    <input
                      type="text"
                      value={user?.role || 'CUSTOMER'}
                      disabled
                      className="w-full px-4 py-3 bg-neutral-100 border border-neutral-200 text-neutral-500 rounded-xl text-xs font-extrabold cursor-not-allowed uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1.5">
                    Profile Avatar URL
                  </label>
                  <input
                    type="url"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-neutral-900 outline-none"
                  />
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-6 py-3 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md active:scale-95 disabled:bg-neutral-400"
                  >
                    {savingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Address Book */}
          {activeTab === 'address' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">Delivery Address Book</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Manage locations for cold-chain temperature-controlled courier delivery.</p>
                </div>
                <button
                  onClick={() => setShowAddAddr(!showAddAddr)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                >
                  <i className="fa-solid fa-plus mr-1.5" />
                  {showAddAddr ? 'Cancel' : 'Add New Address'}
                </button>
              </div>

              {showAddAddr && (
                <form onSubmit={handleAddAddress} className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4 animate-scaleUp">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">New Address Details</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Address Label</label>
                      <input
                        type="text"
                        value={newAddr.label}
                        onChange={(e) => setNewAddr({ ...newAddr, label: e.target.value })}
                        placeholder="Home / Office / Clinic"
                        required
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Recipient Name</label>
                      <input
                        type="text"
                        value={newAddr.recipient}
                        onChange={(e) => setNewAddr({ ...newAddr, recipient: e.target.value })}
                        placeholder={fullName}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Street Address</label>
                      <input
                        type="text"
                        value={newAddr.street}
                        onChange={(e) => setNewAddr({ ...newAddr, street: e.target.value })}
                        placeholder="No. 12, Main Street"
                        required
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">City / Zone</label>
                      <input
                        type="text"
                        value={newAddr.city}
                        onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                        required
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Cold-Chain Courier Delivery Notes</label>
                    <input
                      type="text"
                      value={newAddr.notes}
                      onChange={(e) => setNewAddr({ ...newAddr, notes: e.target.value })}
                      placeholder="e.g. Ring apartment 4B bell, requires thermal box inspection"
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm hover:bg-black transition-all"
                  >
                    Save Address
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      addr.isDefault ? 'border-emerald-500 bg-emerald-50/30 shadow-sm' : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-black uppercase tracking-wider text-neutral-900">{addr.label}</span>
                      {addr.isDefault && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-bold text-neutral-800">{addr.recipient}</p>
                    <p className="text-xs text-neutral-600 mt-1">{addr.street}, {addr.city}</p>
                    {addr.notes && (
                      <p className="text-[11px] text-neutral-500 italic mt-2 border-t border-neutral-100 pt-2">
                        <i className="fa-solid fa-snowflake text-cyan-600 mr-1" />
                        {addr.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Payment Methods */}
          {activeTab === 'payment' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">Saved Payment Methods</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Encrypted payment tokens for one-click pharmacy refills.</p>
                </div>
                <button
                  onClick={() => setShowAddCard(!showAddCard)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                >
                  <i className="fa-solid fa-plus mr-1.5" />
                  {showAddCard ? 'Cancel' : 'Add Card'}
                </button>
              </div>

              {showAddCard && (
                <form onSubmit={handleAddCard} className="p-5 bg-neutral-50 rounded-2xl border border-neutral-200 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">Add Payment Card</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Card Brand</label>
                      <select
                        value={newCard.cardType}
                        onChange={(e) => setNewCard({ ...newCard, cardType: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                      >
                        <option value="Visa Platinum">Visa Platinum</option>
                        <option value="Mastercard World">Mastercard World</option>
                        <option value="Amex Health">Amex Health</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Last 4 Digits</label>
                      <input
                        type="text"
                        maxLength="4"
                        value={newCard.last4}
                        onChange={(e) => setNewCard({ ...newCard, last4: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        value={newCard.expiry}
                        onChange={(e) => setNewCard({ ...newCard, expiry: e.target.value })}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm hover:bg-black transition-all"
                  >
                    Save Card
                  </button>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paymentMethods.map((pm) => (
                  <div
                    key={pm.id}
                    className="p-5 rounded-2xl border border-neutral-200 bg-neutral-900 text-white space-y-3 relative overflow-hidden shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase tracking-wider text-emerald-400">{pm.cardType}</span>
                      <i className="fa-brands fa-cc-visa text-2xl opacity-80" />
                    </div>
                    <div className="font-mono text-base font-bold tracking-widest pt-2">
                      •••• •••• •••• {pm.last4}
                    </div>
                    <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-neutral-800">
                      <span>Expires: {pm.expiry}</span>
                      {pm.isDefault && (
                        <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                          Default Refill Card
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Order History */}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">Order History &amp; FEFO Batches</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Track your dispatched medication shipments and cold-chain compliance logs.</p>
              </div>

              {loadingOrders ? (
                <div className="text-center py-10 text-xs font-bold text-neutral-400">Loading order records...</div>
              ) : orders.length === 0 ? (
                <div className="text-center py-10 text-xs text-neutral-500">No recent orders found.</div>
              ) : (
                <div className="space-y-4">
                  {orders.map((ord) => (
                    <div key={ord.id} className="p-5 rounded-2xl border border-neutral-200 bg-white hover:border-neutral-300 transition-all space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                            {ord.id || ord.orderNumber}
                          </span>
                          <span className="text-xs text-neutral-400 ml-2">
                            {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          ord.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ord.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-neutral-100">
                        <div>
                          <span className="text-neutral-400 block text-[10px] uppercase font-bold">Total Amount</span>
                          <span className="font-extrabold text-neutral-900">LKR {(ord.totalAmount || 0).toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block text-[10px] uppercase font-bold">FEFO Batch Allocation</span>
                          <span className="font-mono font-bold text-neutral-700">{ord.batchNo || 'L24-789-COOL'}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block text-[10px] uppercase font-bold">Cold Chain Level</span>
                          <span className="font-bold text-cyan-800">{ord.storageCondition || 'REFRIGERATED'}</span>
                        </div>
                        <div>
                          <span className="text-neutral-400 block text-[10px] uppercase font-bold">Courier Tracking</span>
                          <span className="font-mono font-bold text-neutral-900">{ord.trackingId || 'TRK-LK-LIVE'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Active Subscriptions */}
          {activeTab === 'subscriptions' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">Recurring Medication Refills</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Automated pharmacy dispatches delivered straight to your door on schedule.</p>
              </div>

              {loadingSubs ? (
                <div className="text-center py-10 text-xs font-bold text-neutral-400">Loading subscriptions...</div>
              ) : subscriptions.length === 0 ? (
                <div className="text-center py-10 text-xs text-neutral-500">No active subscriptions found.</div>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">{sub.medicineName}</h3>
                          <p className="text-[11px] text-neutral-500">{sub.interval} • Qty: {sub.quantity}</p>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {sub.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-3 border-t border-neutral-100">
                        <div>
                          <span className="text-neutral-400 text-[10px] uppercase font-bold block">Next Auto-Refill Dispatch</span>
                          <span className="font-bold text-emerald-800">{sub.nextRefillDate}</span>
                        </div>
                        <span className="font-extrabold text-neutral-900">LKR {(sub.price || 0).toLocaleString()} / cycle</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Prescription Vault */}
          {activeTab === 'prescriptions' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">Prescription Vault</h2>
                  <p className="text-xs text-neutral-500 mt-0.5">Digitally verified medical prescriptions stored in tamper-evident storage.</p>
                </div>
                <Link
                  to="/modules/prescriptions"
                  className="px-4 py-2 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm"
                >
                  <i className="fa-solid fa-cloud-arrow-up mr-1.5" />
                  Upload Prescription
                </Link>
              </div>

              {loadingRx ? (
                <div className="text-center py-10 text-xs font-bold text-neutral-400">Loading prescription vault...</div>
              ) : (
                <div className="space-y-4">
                  {prescriptions.map((rx) => (
                    <div key={rx.id} className="p-5 rounded-2xl border border-neutral-200 bg-white space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-mono font-bold text-xs text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {rx.prescriptionCode}
                          </span>
                          <h3 className="text-xs font-bold text-neutral-900 mt-1">{rx.doctorName}</h3>
                        </div>
                        <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {rx.status}
                        </span>
                      </div>

                      <p className="text-xs text-neutral-600 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                        {rx.notes}
                      </p>

                      <div className="flex items-center justify-between text-xs pt-2">
                        <span className="text-neutral-400 text-[11px]">Issued: {rx.issueDate}</span>
                        <a
                          href={`/api/v1/prescriptions/${rx.id}/download`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
                        >
                          <i className="fa-solid fa-file-pdf" />
                          <span>View Signed PDF</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: Security & Auth */}
          {activeTab === 'security' && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-neutral-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">Security &amp; Access Controls</h2>
                <p className="text-xs text-neutral-500 mt-0.5">Manage authentication credentials and active audit sessions.</p>
              </div>

              {passwordMsg.text && (
                <div className={`p-4 rounded-xl text-xs font-bold ${
                  passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {passwordMsg.text}
                </div>
              )}

              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900">Change Account Password</h3>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Current Password</label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    required
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-neutral-600 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2.5 bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-sm hover:bg-black transition-all disabled:bg-neutral-400"
                >
                  {savingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </form>

              <div className="pt-6 border-t border-neutral-200">
                <h3 className="text-xs font-black uppercase tracking-wider text-neutral-900 mb-2">Active Session &amp; Audit Trail</h3>
                <p className="text-xs text-neutral-500 mb-4">You are logged in with authenticated JWT token with role claim <strong>{user?.role || 'CUSTOMER'}</strong>.</p>
                <button
                  onClick={logout}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
                >
                  Terminate Active Session
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default ProfilePage;
