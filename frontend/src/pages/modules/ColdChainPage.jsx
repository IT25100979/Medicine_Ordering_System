import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const PACKAGE_TYPES = [
  'Insulated Cooler Box',
  'Secure Lockbox Cooler',
  'Refrigerated Padded Bag',
  'Tamper-Evident Cooler',
  'Cryogenic Container',
  'Ambient Insulated Tote',
];

const DELIVERY_STATUS_OPTIONS = [
  'Ready for Delivery',
  'In Transit',
  'Awaiting Verification',
  'HOLD',
  'RETURN TO PHARMACY',
  'Delivered',
];

const AGE_STATUS_OPTIONS = [
  'Not Required',
  'Pending',
  'Verified',
  'Failed',
];

const ColdChainPage = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Navigation Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Master Deliveries State
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState('ALL');
  const [filterTempStatus, setFilterTempStatus] = useState('ALL');
  const [filterAgeStatus, setFilterAgeStatus] = useState('ALL');

  // Toast State
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [formMode, setFormMode] = useState('create'); // 'create' | 'edit'
  const [activeItem, setActiveItem] = useState(null);

  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const initialFormState = {
    id: null,
    orderId: '',
    medicationName: '',
    courierName: '',
    packageType: 'Insulated Cooler Box',
    temperatureSensitive: true,
    minTemperature: '2.0',
    maxTemperature: '8.0',
    currentTemperature: '',
    ageVerificationRequired: false,
    minimumAge: '',
    ageVerificationStatus: 'Not Required',
    deliveryStatus: 'Ready for Delivery',
    notes: '',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [formErrors, setFormErrors] = useState({});

  // -------------------------------------------------------------
  // Data Fetching
  // -------------------------------------------------------------
  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const res = await client.get('/api/cold-chain');
      setDeliveries(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load cold-chain deliveries:', err);
      showToast('Could not load cold-chain records from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, []);

  // -------------------------------------------------------------
  // KPI Metrics Calculation
  // -------------------------------------------------------------
  const kpis = useMemo(() => {
    const total = deliveries.length;
    const safe = deliveries.filter((d) => d.temperatureStatus === 'SAFE').length;
    const breach = deliveries.filter((d) => d.temperatureStatus === 'BREACH').length;
    const agePending = deliveries.filter(
      (d) => d.ageVerificationRequired && (d.ageVerificationStatus === 'Pending' || !d.ageVerificationStatus)
    ).length;
    return { total, safe, breach, agePending };
  }, [deliveries]);

  // -------------------------------------------------------------
  // Filtering Engine
  // -------------------------------------------------------------
  const filteredDeliveries = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return deliveries.filter((item) => {
      // Search text (orderId, medicationName, courierName)
      const matchesSearch =
        !q ||
        (item.orderId && item.orderId.toLowerCase().includes(q)) ||
        (item.medicationName && item.medicationName.toLowerCase().includes(q)) ||
        (item.courierName && item.courierName.toLowerCase().includes(q));

      // Delivery Status
      const matchesDelivery =
        filterDeliveryStatus === 'ALL' || item.deliveryStatus === filterDeliveryStatus;

      // Temperature Status
      const matchesTemp =
        filterTempStatus === 'ALL' || item.temperatureStatus === filterTempStatus;

      // Age Verification Status
      let matchesAge = true;
      if (filterAgeStatus === 'Required') {
        matchesAge = item.ageVerificationRequired === true;
      } else if (filterAgeStatus !== 'ALL') {
        matchesAge = item.ageVerificationStatus === filterAgeStatus;
      }

      return matchesSearch && matchesDelivery && matchesTemp && matchesAge;
    });
  }, [deliveries, searchTerm, filterDeliveryStatus, filterTempStatus, filterAgeStatus]);

  // -------------------------------------------------------------
  // Form Field Handlers & Dynamic Business Rule Helpers
  // -------------------------------------------------------------
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      };

      // Temperature sensitive toggle
      if (name === 'temperatureSensitive') {
        if (checked) {
          if (!updated.minTemperature) updated.minTemperature = '2.0';
          if (!updated.maxTemperature) updated.maxTemperature = '8.0';
        }
      }

      // Age verification toggle
      if (name === 'ageVerificationRequired') {
        if (checked) {
          if (!updated.minimumAge) updated.minimumAge = '18';
          if (updated.ageVerificationStatus === 'Not Required') {
            updated.ageVerificationStatus = 'Pending';
          }
        } else {
          updated.minimumAge = '';
          updated.ageVerificationStatus = 'Not Required';
          if (updated.deliveryStatus === 'RETURN TO PHARMACY') {
            updated.deliveryStatus = 'Ready for Delivery';
          }
        }
      }

      // Age verification status change to "Failed"
      if (name === 'ageVerificationStatus') {
        if (value === 'Failed') {
          updated.deliveryStatus = 'RETURN TO PHARMACY';
        } else if (updated.deliveryStatus === 'RETURN TO PHARMACY') {
          updated.deliveryStatus = 'Ready for Delivery';
        }
      }

      return updated;
    });

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Live Temperature Evaluation Preview
  const liveTempEvaluation = useMemo(() => {
    const currentVal = parseFloat(formData.currentTemperature);
    const minVal = parseFloat(formData.minTemperature) || 2.0;
    const maxVal = parseFloat(formData.maxTemperature) || 8.0;

    if (isNaN(currentVal)) {
      return { status: 'idle', message: 'Enter temperature value to evaluate compliance.' };
    }
    if (currentVal < minVal || currentVal > maxVal) {
      return {
        status: 'breach',
        message: `BREACH: Excursion Detected! ${currentVal}°C is outside the safe range (${minVal}°C – ${maxVal}°C). System will flag as BREACH.`,
      };
    }
    return {
      status: 'safe',
      message: `SAFE: Compliant within safe cold-chain boundary (${minVal}°C – ${maxVal}°C).`,
    };
  }, [formData.currentTemperature, formData.minTemperature, formData.maxTemperature]);

  // Open Create Modal
  const openCreateModal = () => {
    setFormErrors({});
    setFormData(initialFormState);
    setFormMode('create');
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (item) => {
    setFormErrors({});
    setActiveItem(item);
    setFormData({
      id: item.id,
      orderId: item.orderId || '',
      medicationName: item.medicationName || '',
      courierName: item.courierName || '',
      packageType: item.packageType || 'Insulated Cooler Box',
      temperatureSensitive: item.temperatureSensitive !== false,
      minTemperature: item.minTemperature !== null && item.minTemperature !== undefined ? String(item.minTemperature) : '2.0',
      maxTemperature: item.maxTemperature !== null && item.maxTemperature !== undefined ? String(item.maxTemperature) : '8.0',
      currentTemperature: item.currentTemperature !== null && item.currentTemperature !== undefined ? String(item.currentTemperature) : '',
      ageVerificationRequired: Boolean(item.ageVerificationRequired),
      minimumAge: item.minimumAge ? String(item.minimumAge) : '',
      ageVerificationStatus: item.ageVerificationStatus || 'Not Required',
      deliveryStatus: item.deliveryStatus || 'Ready for Delivery',
      notes: item.notes || '',
    });
    setFormMode('edit');
    setIsFormModalOpen(true);
  };

  // Open View Modal
  const openViewModal = (item) => {
    setViewItem(item);
    setIsViewModalOpen(true);
  };

  // Open Delete Modal
  const openDeleteModal = (item) => {
    setDeleteItem(item);
    setIsDeleteModalOpen(true);
  };

  // Client Validation Engine
  const validateForm = () => {
    const errors = {};
    if (!formData.orderId.trim()) errors.orderId = 'Order ID is required.';
    if (!formData.medicationName.trim()) errors.medicationName = 'Medication Name is required.';
    if (!formData.courierName.trim()) errors.courierName = 'Courier Name is required.';

    if (formData.currentTemperature === '' || formData.currentTemperature === null) {
      errors.currentTemperature = 'Current Temperature is required.';
    } else if (isNaN(parseFloat(formData.currentTemperature))) {
      errors.currentTemperature = 'Current Temperature must be a valid number.';
    }

    const min = parseFloat(formData.minTemperature);
    const max = parseFloat(formData.maxTemperature);
    if (!isNaN(min) && !isNaN(max) && min >= max) {
      errors.tempRange = `Min temperature (${min}°C) must be strictly less than Max temperature (${max}°C).`;
    }

    if (formData.ageVerificationRequired) {
      const ageNum = parseInt(formData.minimumAge, 10);
      if (!formData.minimumAge || isNaN(ageNum) || ageNum <= 0) {
        errors.minimumAge = 'Valid positive minimum age is required (e.g. 18 or 21).';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Save (Create or Update)
  const handleSaveForm = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        orderId: formData.orderId.trim(),
        medicationName: formData.medicationName.trim(),
        courierName: formData.courierName.trim(),
        packageType: formData.packageType,
        temperatureSensitive: formData.temperatureSensitive,
        minTemperature: formData.minTemperature !== '' ? parseFloat(formData.minTemperature) : null,
        maxTemperature: formData.maxTemperature !== '' ? parseFloat(formData.maxTemperature) : null,
        currentTemperature: parseFloat(formData.currentTemperature),
        ageVerificationRequired: formData.ageVerificationRequired,
        minimumAge: formData.ageVerificationRequired && formData.minimumAge !== '' ? parseInt(formData.minimumAge, 10) : null,
        ageVerificationStatus: formData.ageVerificationRequired ? formData.ageVerificationStatus : 'Not Required',
        deliveryStatus: formData.deliveryStatus,
        notes: formData.notes.trim(),
      };

      if (formMode === 'create') {
        const res = await client.post('/api/cold-chain', payload);
        showToast(`Record ${res.data?.orderId || payload.orderId} created successfully!`, 'success');
      } else {
        const res = await client.put(`/api/cold-chain/${formData.id}`, payload);
        showToast(`Record ${res.data?.orderId || payload.orderId} updated successfully!`, 'success');
      }

      setIsFormModalOpen(false);
      await fetchDeliveries();
    } catch (err) {
      console.error('Save error:', err);
      const serverMsg = err.response?.data?.message || err.message || 'Error saving delivery record.';
      showToast(serverMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Action
  const handleConfirmDelete = async () => {
    if (!deleteItem) return;
    setIsSubmitting(true);
    try {
      await client.delete(`/api/cold-chain/${deleteItem.id}`);
      showToast(`Record #${deleteItem.orderId} permanently deleted.`, 'success');
      setIsDeleteModalOpen(false);
      setDeleteItem(null);
      await fetchDeliveries();
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete cold-chain record.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Date Formatter
  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return String(dateStr);
    }
  };

  return (
    <div className="bg-[#fcfbf9] min-h-screen text-neutral-900 pb-16 font-sans">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-xs font-bold border transition-all ${
            toast.type === 'error'
              ? 'bg-red-50 text-red-800 border-red-200'
              : 'bg-zinc-900 text-white border-zinc-800'
          }`}
        >
          <span className="material-symbols-outlined text-[20px] text-amber-400">
            {toast.type === 'error' ? 'error' : 'verified'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity duration-500 ease-in-out ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* ========================================================= */}
      {/* SLIDE-OUT NAVIGATION DRAWER (Exact Admin Console Pattern) */}
      {/* ========================================================= */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 sm:w-80 bg-[#f1f3ff] z-50 flex flex-col justify-between py-6 px-4 shadow-2xl transition-transform duration-700 ease-in-out transform ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Operations Navigation Drawer"
      >
        {/* Floating Moving Handle Button mounted directly to sidebar edge */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen((prev) => !prev)}
          className="absolute top-24 -right-10 w-10 h-16 bg-white border border-l-0 border-neutral-200/90 rounded-r-2xl shadow-xl flex flex-col items-center justify-center text-neutral-800 hover:text-black hover:w-11 transition-all duration-300 cursor-pointer group z-50"
          title={isDrawerOpen ? 'Close Side Panel' : 'Open Side Panel'}
          aria-label={isDrawerOpen ? 'Close Side Panel' : 'Open Side Panel'}
        >
          <span className="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">
            {isDrawerOpen ? 'chevron_left' : 'chevron_right'}
          </span>
          <span className="text-[8px] font-black uppercase tracking-tighter text-neutral-500 group-hover:text-black mt-0.5">
            {isDrawerOpen ? 'CLOSE' : 'MENU'}
          </span>
        </button>

        <div className="flex flex-col gap-6">
          {/* Drawer Top Header */}
          <div className="flex items-center gap-3 px-3 pb-3 border-b border-gray-200">
            <div className="w-9 h-9 rounded-full bg-black flex items-center justify-center text-white font-bold text-sm">
              P+
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-black leading-tight">PHARMA + Operations</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                Operations Console
              </span>
            </div>
          </div>

          {/* Drawer Navigation Links */}
          <nav className="flex flex-col gap-2 pt-2">
            {/* 1. Catalog Management */}
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                navigate('/admin/catalog');
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-full font-bold text-xs tracking-wide transition-all cursor-pointer text-left bg-white/80 hover:bg-white text-neutral-700 hover:text-black"
            >
              <span className="material-symbols-outlined text-[20px]">medication</span>
              <span className="flex-1">Catalog Management</span>
            </button>

            {/* 2. Stocks Management */}
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                navigate('/admin/stocks');
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-full font-bold text-xs tracking-wide transition-all cursor-pointer text-left bg-white/80 hover:bg-white text-neutral-700 hover:text-black"
            >
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              <span className="flex-1">Stocks Management</span>
            </button>

            {/* 3. Cold Chain Management (ACTIVE) */}
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                navigate('/admin/cold-chain');
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-full font-bold text-xs tracking-wide transition-all cursor-pointer text-left bg-black text-white shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">ac_unit</span>
              <span className="flex-1">Cold Chain Management</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </button>
          </nav>
        </div>

        {/* Bottom Staff Info */}
        <div className="px-3 pt-3 border-t border-gray-200 flex flex-col gap-1 text-[11px] text-gray-500">
          <span className="font-bold text-neutral-800">{user?.fullName || 'Delivery Coordinator'}</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold">{user?.role || 'DELIVERY_COORDINATOR'}</span>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* TOP HEADER: Clean Dashboard Layout                        */}
      {/* ========================================================= */}
      <header className="w-full bg-white border-b border-neutral-200/80 px-4 sm:px-6 lg:px-12 py-3.5 mb-6 shadow-xs">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 pl-8 sm:pl-10">
            <div>
              <Link
                to="/admin/catalog"
                className="flex items-center gap-1 font-sans font-black text-xl sm:text-2xl tracking-tight uppercase text-black hover:opacity-90 transition-opacity"
              >
                <span>PHARMA</span>
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-black shadow-sm">
                  +
                </span>
              </Link>
              <div className="mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-bold tracking-wide shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Cold Chain Management Active</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchDeliveries}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold transition-all cursor-pointer"
              title="Refresh Records"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login/admin');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <span>Log Out</span>
              <span className="material-symbols-outlined text-[16px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN CONTAINER CONTENT                                    */}
      {/* ========================================================= */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Global Temperature Breach Alert Banner */}
        {kpis.breach > 0 && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 border-2 border-red-300 text-red-900 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-pulse">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-red-600 text-[32px]">warning</span>
              <div>
                <p className="font-extrabold text-sm uppercase tracking-wide">
                  CRITICAL: {kpis.breach} Temperature Excursion Breach{kpis.breach > 1 ? 'es' : ''} Detected!
                </p>
                <p className="text-xs text-red-700">
                  Shipmentpayload exceeded safe cold-chain boundary (2°C – 8°C). Dispatch halted; inspect specimens immediately.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFilterTempStatus('BREACH')}
              className="px-3.5 py-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shrink-0 transition-colors shadow-sm"
            >
              Filter Breaches
            </button>
          </div>
        )}

        {/* --------------------------------------------------------- */}
        {/* KPI SUMMARY CARDS                                         */}
        {/* --------------------------------------------------------- */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Total Shipments */}
          <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Total Deliveries</p>
              <h3 className="text-2xl sm:text-3xl font-black text-black">{kpis.total}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">local_shipping</span>
            </div>
          </div>

          {/* Card 2: Safe Temperatures */}
          <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Safe Compliant</p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600">{kpis.safe}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">check_circle</span>
            </div>
          </div>

          {/* Card 3: Temperature Breaches */}
          <div className={`p-5 rounded-3xl border shadow-xs flex items-center justify-between ${
            kpis.breach > 0 ? 'bg-red-50/60 border-red-200 text-red-900' : 'bg-white border-neutral-200/80'
          }`}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Excursion Breaches</p>
              <h3 className={`text-2xl sm:text-3xl font-black ${kpis.breach > 0 ? 'text-red-600' : 'text-neutral-800'}`}>
                {kpis.breach}
              </h3>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              kpis.breach > 0 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-neutral-100 text-neutral-500'
            }`}>
              <span className="material-symbols-outlined text-[26px]">severe_cold</span>
            </div>
          </div>

          {/* Card 4: Age Check Pending */}
          <div className="bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 mb-1">Age Check Pending</p>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-600">{kpis.agePending}</h3>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[26px]">shield_person</span>
            </div>
          </div>
        </div>

        {/* --------------------------------------------------------- */}
        {/* TOOLBAR CONTROLS: Search, Filters & Add Record Button      */}
        {/* --------------------------------------------------------- */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-neutral-200/80 shadow-xs mb-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            {/* Search Box */}
            <div className="relative min-w-[220px] max-w-sm flex-1">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search Order ID, medication, courier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full text-xs font-semibold placeholder:text-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            {/* Delivery Status Filter */}
            <select
              value={filterDeliveryStatus}
              onChange={(e) => setFilterDeliveryStatus(e.target.value)}
              className="px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
            >
              <option value="ALL">All Delivery Statuses</option>
              {DELIVERY_STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>

            {/* Temperature Status Filter */}
            <select
              value={filterTempStatus}
              onChange={(e) => setFilterTempStatus(e.target.value)}
              className="px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
            >
              <option value="ALL">All Temp Statuses</option>
              <option value="SAFE">SAFE Only</option>
              <option value="BREACH">BREACH Only</option>
            </select>

            {/* Age Verification Filter */}
            <select
              value={filterAgeStatus}
              onChange={(e) => setFilterAgeStatus(e.target.value)}
              className="px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-full text-xs font-bold text-neutral-700 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
            >
              <option value="ALL">All Age Protocols</option>
              <option value="Required">Age Check Required</option>
              <option value="Pending">Pending Verification</option>
              <option value="Verified">Verified Handover</option>
              <option value="Failed">Failed / Refused</option>
              <option value="Not Required">Not Required</option>
            </select>

            {(searchTerm || filterDeliveryStatus !== 'ALL' || filterTempStatus !== 'ALL' || filterAgeStatus !== 'ALL') && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setFilterDeliveryStatus('ALL');
                  setFilterTempStatus('ALL');
                  setFilterAgeStatus('ALL');
                }}
                className="text-xs font-bold text-neutral-500 hover:text-black underline cursor-pointer px-2"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Action Button: Add Record */}
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer shrink-0"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>+ New Cold-Chain Record</span>
          </button>
        </div>

        {/* --------------------------------------------------------- */}
        {/* COLD CHAIN DATA TABLE                                     */}
        {/* --------------------------------------------------------- */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs overflow-hidden">
          <div className="p-4 px-6 border-b border-neutral-100 flex items-center justify-between text-xs text-neutral-500 font-semibold">
            <span>
              Showing <strong className="text-black">{filteredDeliveries.length}</strong> of {deliveries.length} cold-chain delivery records
            </span>
            <span className="text-[11px] font-mono text-neutral-400">
              Protocol: Safe standard 2.0°C – 8.0°C
            </span>
          </div>

          {loading ? (
            <div className="p-16 text-center text-xs font-semibold text-neutral-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
              Retrieving cold-chain records from MySQL database...
            </div>
          ) : filteredDeliveries.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <span className="material-symbols-outlined text-[42px] text-neutral-300">ac_unit</span>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                No matching cold-chain deliveries found.
              </p>
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-neutral-900 text-white text-xs font-bold"
              >
                Create First Record
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100/70 text-neutral-700 font-extrabold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3.5 px-4">Order ID</th>
                    <th className="py-3.5 px-4">Medication & Packaging</th>
                    <th className="py-3.5 px-4">Current Temp</th>
                    <th className="py-3.5 px-4">Temp Status</th>
                    <th className="py-3.5 px-4">Courier</th>
                    <th className="py-3.5 px-4">Age Protocol</th>
                    <th className="py-3.5 px-4">Delivery Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredDeliveries.map((item) => {
                    const isBreach = item.temperatureStatus === 'BREACH';
                    const isAgeFailed = item.ageVerificationRequired && item.ageVerificationStatus === 'Failed';

                    return (
                      <tr key={item.id} className="hover:bg-neutral-50/80 transition-colors">
                        {/* Order ID */}
                        <td className="py-4 px-4 font-black font-mono text-neutral-900 whitespace-nowrap">
                          {item.orderId}
                        </td>

                        {/* Medication & Packaging */}
                        <td className="py-4 px-4">
                          <div className="font-bold text-neutral-900 leading-tight">
                            {item.medicationName}
                          </div>
                          <div className="text-[10px] text-neutral-400 mt-0.5">
                            {item.packageType || 'Insulated Cooler Box'}
                          </div>
                        </td>

                        {/* Current Temperature & Range */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="font-extrabold text-sm text-neutral-900">
                            {item.currentTemperature !== null && item.currentTemperature !== undefined
                              ? `${Number(item.currentTemperature).toFixed(1)}°C`
                              : 'N/A'}
                          </div>
                          {item.minTemperature !== null && item.maxTemperature !== null && (
                            <div className="text-[10px] text-neutral-400">
                              [{item.minTemperature}°C – {item.maxTemperature}°C]
                            </div>
                          )}
                        </td>

                        {/* Temp Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isBreach ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-extrabold text-[10px] uppercase border border-red-200">
                              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
                              <span>BREACH</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                              <span>SAFE</span>
                            </span>
                          )}
                        </td>

                        {/* Courier */}
                        <td className="py-4 px-4 font-semibold text-neutral-800 whitespace-nowrap">
                          {item.courierName}
                        </td>

                        {/* Age Verification Protocol */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {!item.ageVerificationRequired ? (
                            <span className="inline-block px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[10px] font-bold">
                              Not Required
                            </span>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              {item.ageVerificationStatus === 'Verified' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  ✓ Verified
                                </span>
                              )}
                              {item.ageVerificationStatus === 'Failed' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-800 text-[10px] font-extrabold">
                                  ✕ Failed
                                </span>
                              )}
                              {item.ageVerificationStatus !== 'Verified' && item.ageVerificationStatus !== 'Failed' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                                  ⏳ Pending
                                </span>
                              )}
                              {item.minimumAge && (
                                <span className="px-1.5 py-0.5 rounded-md bg-neutral-200 text-neutral-700 text-[10px] font-mono font-bold">
                                  {item.minimumAge}+
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Delivery Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              item.deliveryStatus === 'RETURN TO PHARMACY'
                                ? 'bg-red-900 text-white font-black'
                                : item.deliveryStatus === 'HOLD'
                                ? 'bg-red-100 text-red-800 border border-red-300'
                                : item.deliveryStatus === 'Delivered'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.deliveryStatus === 'In Transit'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-neutral-100 text-neutral-800'
                            }`}
                          >
                            {item.deliveryStatus}
                          </span>
                        </td>

                        {/* Action Buttons */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openViewModal(item)}
                              title="Inspect Shipment Protocols"
                              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">visibility</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              title="Edit Record"
                              className="p-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => openDeleteModal(item)}
                              title="Delete Record"
                              className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-colors cursor-pointer"
                            >
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ========================================================= */}
      {/* MODAL 1: CREATE & EDIT RECORD MODAL                       */}
      {/* ========================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-black text-[24px]">
                  {formMode === 'create' ? 'add_circle' : 'edit_note'}
                </span>
                <h3 className="font-extrabold text-lg text-black">
                  {formMode === 'create' ? 'New Cold-Chain & Security Record' : `Edit Delivery: ${formData.orderId}`}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Order ID & Medication Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Order ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="orderId"
                    placeholder="e.g. ORD-1005"
                    value={formData.orderId}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  {formErrors.orderId && <p className="text-[11px] text-red-600 mt-1">{formErrors.orderId}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Medication Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="medicationName"
                    placeholder="e.g. Human Insulin 100 IU/mL"
                    value={formData.medicationName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  {formErrors.medicationName && <p className="text-[11px] text-red-600 mt-1">{formErrors.medicationName}</p>}
                </div>
              </div>

              {/* Courier Name & Package Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Courier Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="courierName"
                    placeholder="e.g. Jason Blake"
                    value={formData.courierName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  {formErrors.courierName && <p className="text-[11px] text-red-600 mt-1">{formErrors.courierName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Packaging Specification
                  </label>
                  <select
                    name="packageType"
                    value={formData.packageType}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                  >
                    {PACKAGE_TYPES.map((pkg) => (
                      <option key={pkg} value={pkg}>{pkg}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* SECTION: Temperature Control */}
              <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="temperatureSensitive"
                      checked={formData.temperatureSensitive}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded text-black focus:ring-black"
                    />
                    <span className="text-xs font-bold text-neutral-800">
                      Temperature-Sensitive (Standard Cold-Chain 2.0°C – 8.0°C)
                    </span>
                  </label>
                  <span className="text-[11px] font-mono text-blue-700 font-semibold">UC-04 Protocol</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Min Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="minTemperature"
                      value={formData.minTemperature}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">Max Temp (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      name="maxTemperature"
                      value={formData.maxTemperature}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-neutral-900 uppercase mb-1">
                      Current Temp (°C) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      name="currentTemperature"
                      placeholder="e.g. 5.5"
                      value={formData.currentTemperature}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-white border-2 border-black rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>

                {formErrors.currentTemperature && (
                  <p className="text-[11px] text-red-600">{formErrors.currentTemperature}</p>
                )}
                {formErrors.tempRange && (
                  <p className="text-[11px] text-red-600">{formErrors.tempRange}</p>
                )}

                {/* Live Real-Time Temperature Evaluation Preview */}
                <div
                  className={`p-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    liveTempEvaluation.status === 'breach'
                      ? 'bg-red-100 text-red-800 border border-red-200'
                      : liveTempEvaluation.status === 'safe'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-neutral-100 text-neutral-500'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {liveTempEvaluation.status === 'breach'
                      ? 'warning'
                      : liveTempEvaluation.status === 'safe'
                      ? 'check_circle'
                      : 'info'}
                  </span>
                  <span>{liveTempEvaluation.message}</span>
                </div>
              </div>

              {/* SECTION: Age Verification Protocol */}
              <div className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      name="ageVerificationRequired"
                      checked={formData.ageVerificationRequired}
                      onChange={handleInputChange}
                      className="w-4 h-4 rounded text-black focus:ring-black"
                    />
                    <span className="text-xs font-bold text-neutral-800">
                      Age Verification Required at Handover (Controlled Drug)
                    </span>
                  </label>
                  <span className="text-[11px] font-mono text-amber-700 font-semibold">Security Barrier</span>
                </div>

                {formData.ageVerificationRequired && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 animate-fadeIn">
                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                        Minimum Age Threshold <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="minimumAge"
                        placeholder="e.g. 18 or 21"
                        value={formData.minimumAge}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-semibold"
                      />
                      {formErrors.minimumAge && (
                        <p className="text-[11px] text-red-600 mt-1">{formErrors.minimumAge}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-neutral-600 uppercase mb-1">
                        Age Verification Status
                      </label>
                      <select
                        name="ageVerificationStatus"
                        value={formData.ageVerificationStatus}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-white border border-neutral-300 rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        {AGE_STATUS_OPTIONS.filter((s) => s !== 'Not Required').map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {/* Age Failed Warning */}
                {formData.ageVerificationRequired && formData.ageVerificationStatus === 'Failed' && (
                  <div className="p-2.5 rounded-xl bg-red-100 text-red-800 border border-red-200 text-xs font-bold flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">block</span>
                    <span>
                      Age Verification FAILED: Handover blocked. Delivery status is automatically set to "RETURN TO PHARMACY".
                    </span>
                  </div>
                )}
              </div>

              {/* Delivery Status & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Delivery Status
                  </label>
                  <select
                    name="deliveryStatus"
                    value={formData.deliveryStatus}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                  >
                    {DELIVERY_STATUS_OPTIONS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wide mb-1">
                    Coordinator Notes
                  </label>
                  <input
                    type="text"
                    name="notes"
                    placeholder="Gel ice packs, temperature logs, dispatch notes..."
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving to Database...' : formMode === 'create' ? 'Create Record' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: 6-STEP INSPECTION & AUDIT VIEW MODAL             */}
      {/* ========================================================= */}
      {isViewModalOpen && viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-neutral-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-blue-600 text-[26px]">verified</span>
                <div>
                  <h3 className="font-extrabold text-lg text-black">
                    Inspection Audit: {viewItem.orderId}
                  </h3>
                  <p className="text-[11px] text-neutral-400">Cold-Chain & Security Protocol Checklist</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Breach Alert inside View Modal */}
            {viewItem.temperatureStatus === 'BREACH' && (
              <div className="p-3.5 rounded-2xl bg-red-100 text-red-900 border border-red-300 text-xs font-bold flex items-center gap-3 mb-4 animate-pulse">
                <span className="material-symbols-outlined text-red-600 text-[24px]">warning</span>
                <div>
                  <strong>TEMPERATURE EXCURSION DETECTED!</strong>
                  <p className="text-[11px] font-normal">
                    Current temperature ({Number(viewItem.currentTemperature).toFixed(1)}°C) breached the safe range ({viewItem.minTemperature}°C – {viewItem.maxTemperature}°C). Dispatch halted!
                  </p>
                </div>
              </div>
            )}

            {/* Age Failed Alert inside View Modal */}
            {viewItem.ageVerificationRequired && viewItem.ageVerificationStatus === 'Failed' && (
              <div className="p-3.5 rounded-2xl bg-red-900 text-white text-xs font-bold flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-amber-400 text-[24px]">block</span>
                <div>
                  <strong>AGE VERIFICATION FAILED: RETURN TO PHARMACY</strong>
                  <p className="text-[11px] font-normal">
                    Recipient failed age check or lacked valid ID. Package must be returned to pharmacy.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 text-xs">
              {/* Step 1 & 3: Manifest */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <h4 className="font-extrabold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                  <span>📦</span> Step 1 & 3: Manifest & Packaging
                </h4>
                <div className="flex justify-between"><span className="text-neutral-500">Order ID:</span><span className="font-mono font-bold">{viewItem.orderId}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Medication:</span><span className="font-bold">{viewItem.medicationName}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Courier:</span><span className="font-semibold">{viewItem.courierName}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Packaging:</span><span className="font-semibold">{viewItem.packageType || 'Insulated Cooler Box'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Delivery Status:</span><span className="font-extrabold uppercase">{viewItem.deliveryStatus}</span></div>
              </div>

              {/* Step 2 & 3a: Cold-Chain */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <h4 className="font-extrabold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                  <span>❄️</span> Step 2 & 3a: Temperature Monitoring
                </h4>
                <div className="flex justify-between"><span className="text-neutral-500">Tagging:</span><span>{viewItem.temperatureSensitive ? 'Active 2°C–8°C' : 'Standard'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Current Temp:</span><span className="font-extrabold text-sm">{Number(viewItem.currentTemperature).toFixed(1)}°C</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Safe Range:</span><span>{viewItem.minTemperature}°C to {viewItem.maxTemperature}°C</span></div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500">Temp Status:</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    viewItem.temperatureStatus === 'BREACH' ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {viewItem.temperatureStatus}
                  </span>
                </div>
              </div>

              {/* Step 4 & 5: Age Security */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <h4 className="font-extrabold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                  <span>🛡️</span> Step 4 & 5: Recipient Age Protocol
                </h4>
                <div className="flex justify-between"><span className="text-neutral-500">Age Check:</span><span className="font-bold">{viewItem.ageVerificationRequired ? 'YES (Controlled Drug)' : 'Not Required'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Legal Min Age:</span><span>{viewItem.minimumAge ? `${viewItem.minimumAge}+ Years Old` : 'N/A'}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Status:</span><span className="font-bold">{viewItem.ageVerificationStatus || 'N/A'}</span></div>
              </div>

              {/* Step 6: Audit Log */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <h4 className="font-extrabold text-neutral-800 uppercase tracking-wide flex items-center gap-1.5 text-[11px]">
                  <span>📝</span> Step 6: Audit & Notes
                </h4>
                <div className="flex justify-between"><span className="text-neutral-500">Record ID:</span><span className="font-mono">#{viewItem.id}</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Logged At:</span><span>{formatDateTime(viewItem.createdAt)}</span></div>
                <div>
                  <span className="text-neutral-500 block mb-0.5">Notes:</span>
                  <p className="p-2 bg-white rounded-lg border border-neutral-200 text-neutral-700 text-[11px]">
                    {viewItem.notes || 'No notes recorded.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Courier Checklist */}
            <div className="p-3 bg-neutral-100/70 rounded-2xl border border-neutral-200/80 mb-6 text-xs text-neutral-700">
              <p className="font-bold uppercase tracking-wider text-[10px] text-neutral-500 mb-1.5">Mandatory Courier Handover Checklist:</p>
              <ul className="space-y-1 text-[11px]">
                <li>✓ Maintain insulated carrier payload between {viewItem.minTemperature || 2.0}°C and {viewItem.maxTemperature || 8.0}°C.</li>
                {viewItem.ageVerificationRequired ? (
                  <li>✓ Inspect government-issued photo ID at doorstep to verify recipient is {viewItem.minimumAge || 18}+ before handover.</li>
                ) : (
                  <li>✓ Standard direct delivery to registered address.</li>
                )}
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsViewModalOpen(false);
                  openEditModal(viewItem);
                }}
                className="px-6 py-2.5 rounded-full bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Edit Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION MODAL                        */}
      {/* ========================================================= */}
      {isDeleteModalOpen && deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-neutral-200">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <span className="material-symbols-outlined text-[32px]">delete_forever</span>
              <h3 className="font-extrabold text-lg text-black">Confirm Deletion</h3>
            </div>

            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Are you sure you want to permanently delete cold-chain shipment record{' '}
              <strong className="text-black font-mono">#{deleteItem.orderId}</strong> ({deleteItem.medicationName})?
              This action will remove the record directly from MySQL database and cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-5 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? 'Deleting...' : 'Delete Record'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColdChainPage;
