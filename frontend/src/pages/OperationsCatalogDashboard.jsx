import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import useRealtimeChannel from '../hooks/useRealtimeChannel';

// Helper: Format Date as DD/MM/YYYY (Preserved for cross-module compatibility)
export const formatDateDDMMYYYY = (dateStr) => {
  if (!dateStr) return 'N/A';
  try {
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateStr);
  }
};

// Helper: Shelf Life Status (Preserved for cross-module compatibility)
export const getShelfLifeStatus = (expiryDateStr) => {
  if (!expiryDateStr) {
    return {
      status: 'unknown',
      label: 'No Expiry Set',
      badgeClass: 'bg-neutral-100 text-neutral-600 border-neutral-200',
      dotClass: 'bg-neutral-400',
      days: 0,
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const exp = new Date(expiryDateStr);
  exp.setHours(0, 0, 0, 0);

  if (isNaN(exp.getTime())) {
    return {
      status: 'unknown',
      label: String(expiryDateStr),
      badgeClass: 'bg-neutral-100 text-neutral-600 border-neutral-200',
      dotClass: 'bg-neutral-400',
      days: 0,
    };
  }

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      label: `Expired (${Math.abs(diffDays)}d ago)`,
      badgeClass: 'bg-red-50 text-red-700 border-red-300 ring-1 ring-red-400 font-extrabold',
      dotClass: 'bg-red-600 animate-pulse',
      days: diffDays,
    };
  } else if (diffDays <= 60) {
    return {
      status: 'near_expiry',
      label: `Near Expiry (${diffDays}d left)`,
      badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 ring-1 ring-amber-400 font-bold',
      dotClass: 'bg-amber-500 animate-pulse',
      days: diffDays,
    };
  } else {
    return {
      status: 'good',
      label: `Good (${diffDays}d)`,
      badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200 font-semibold',
      dotClass: 'bg-emerald-500',
      days: diffDays,
    };
  }
};

// Helper: Stock Level Metric Badge (Preserved for cross-module compatibility)
export const getStockLevelStatus = (stockQty, reorderLvl) => {
  const stock = Number(stockQty) || 0;
  const reorder = Number(reorderLvl) || 25;

  if (stock === 0) {
    return {
      status: 'out_of_stock',
      label: 'Out of Stock',
      badgeClass: 'bg-red-100 text-red-900 border-red-300 font-black',
      dotClass: 'bg-red-600',
    };
  } else if (stock <= reorder) {
    return {
      status: 'low_stock',
      label: `Low Stock (${stock}/${reorder})`,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-bold',
      dotClass: 'bg-amber-600 animate-ping',
    };
  } else {
    return {
      status: 'in_stock',
      label: `In Stock (${stock})`,
      badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
      dotClass: 'bg-emerald-600',
    };
  }
};

export const CATEGORY_LIST = [
  'Prescription Medicines',
  'Daily Health & Wellness',
  'Vitamins & Nutritional Supplements',
  'First Aid & Wound Care',
  'Home Health & medical Care',
];

// Helper to format specific Product ID without 1, 2, 3...
export const getSpecificProductId = (item) => {
  if (!item) return 'PRD-0000';
  if (item.sku && String(item.sku).trim().length > 0) {
    const raw = String(item.sku).trim();
    if (raw.startsWith('PRD-')) return raw;
    return `PRD-${raw}`;
  }
  return `PRD-MED-${String(item.id).padStart(4, '0')}`;
};

const OperationsCatalogDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Master Data State
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);

  // Single Moving Side Panel Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Toast Notification
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4500);
  };

  // -------------------------------------------------------------
  // Data Fetching: Products & Cold Chain Tags
  // -------------------------------------------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      const resMeds = await client.get('/api/v1/medicines?all=true');
      const medList = Array.isArray(resMeds.data) ? resMeds.data : (resMeds.data?.data || []);
      setMedicines(medList);
    } catch (err) {
      console.error('Failed to load catalog data:', err);
      showToast('Error loading medicines from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Real-time synchronization for Cold Chain reviews and catalog updates
  useRealtimeChannel(
    'cold_chain',
    ['COLD_CHAIN_APPROVAL_REQUESTED', 'COLD_CHAIN_UPDATED', 'COLD_CHAIN_REVIEWED'],
    (eventType, payload) => {
      fetchData();
      if (eventType === 'COLD_CHAIN_REVIEWED') {
        showToast(`Cold chain status updated to ${payload?.action || 'REVIEWED'} in real-time.`);
      }
    }
  );

  // Format Currency
  const formatLKR = (amount) => {
    const num = Number(amount) || 0;
    return `LKR ${num.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // =============================================================
  // CATALOG MANAGEMENT SEARCH, FILTER & PAGINATION
  // =============================================================
  const [catalogSearch, setCatalogSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [coldChainFilter, setColdChainFilter] = useState('ALL'); // ALL | COLD_CHAIN | AMBIENT | PENDING
  const [catalogSort, setCatalogSort] = useState('Newest');
  const [catalogPage, setCatalogPage] = useState(1);
  const catalogItemsPerPage = 10;

  // Filtered Medicines
  const filteredCatalogMedicines = useMemo(() => {
    let result = [...medicines];

    // Search Query
    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase().trim();
      result = result.filter((m) => {
        const prodId = getSpecificProductId(m).toLowerCase();
        const rawSku = (m.sku || '').toLowerCase();
        const matchName = (m.name || '').toLowerCase().includes(q);
        const matchGeneric = (m.genericName || '').toLowerCase().includes(q);
        const matchCategory = (m.category || '').toLowerCase().includes(q);
        const matchDesc = (m.description || '').toLowerCase().includes(q);
        return prodId.includes(q) || rawSku.includes(q) || matchName || matchGeneric || matchCategory || matchDesc;
      });
    }

    // Category Filter
    if (categoryFilter !== 'ALL') {
      result = result.filter((m) => (m.category || '').toLowerCase() === categoryFilter.toLowerCase());
    }

    // Cold Chain Filter
    if (coldChainFilter !== 'ALL') {
      result = result.filter((m) => {
        const status = (m.coldChainStatus || '').toUpperCase();
        const isCold = Boolean(m.isTemperatureSensitive);
        if (coldChainFilter === 'COLD_CHAIN') {
          return status === 'APPROVED' || (isCold && status !== 'REJECTED' && status !== 'NOT_REQUIRED');
        }
        if (coldChainFilter === 'PENDING') {
          return status === 'PENDING_REVIEW' || status === 'PENDING_APPROVAL' || status === 'PENDING_DUAL_REVIEW';
        }
        if (coldChainFilter === 'AMBIENT') {
          return !isCold || status === 'NOT_REQUIRED' || status === 'AMBIENT';
        }
        return true;
      });
    }

    // Sorting
    if (catalogSort === 'Price: Low to High') {
      result.sort((a, b) => (Number(a.unitPrice) || 0) - (Number(b.unitPrice) || 0));
    } else if (catalogSort === 'Price: High to Low') {
      result.sort((a, b) => (Number(b.unitPrice) || 0) - (Number(a.unitPrice) || 0));
    } else if (catalogSort === 'Name: A to Z') {
      result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      result.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    }

    return result;
  }, [medicines, catalogSearch, categoryFilter, coldChainFilter, catalogSort]);

  const totalCatalogPages = Math.ceil(filteredCatalogMedicines.length / catalogItemsPerPage) || 1;
  const paginatedCatalogMedicines = useMemo(() => {
    const start = (catalogPage - 1) * catalogItemsPerPage;
    return filteredCatalogMedicines.slice(start, start + catalogItemsPerPage);
  }, [filteredCatalogMedicines, catalogPage]);

  // Statistics Summary
  const statsSummary = useMemo(() => {
    const total = medicines.length;
    let coldChainCount = 0;
    let pendingApprovalCount = 0;
    let rxCount = 0;
    let otcCount = 0;

    medicines.forEach((m) => {
      const status = (m.coldChainStatus || '').toUpperCase();
      if (status === 'APPROVED' || (Boolean(m.isTemperatureSensitive) && status !== 'REJECTED' && status !== 'NOT_REQUIRED')) {
        coldChainCount++;
      }
      if (status === 'PENDING_REVIEW' || status === 'PENDING_APPROVAL' || status === 'PENDING_DUAL_REVIEW') {
        pendingApprovalCount++;
      }
      if (m.requiresPrescription) rxCount++;
      else otcCount++;
    });

    return { total, coldChainCount, pendingApprovalCount, rxCount, otcCount };
  }, [medicines]);

  // =============================================================
  // CRUD MODAL STATE: CREATE & EDIT
  // =============================================================
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogEditorMode, setCatalogEditorMode] = useState('create'); // 'create' | 'edit'
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [catalogForm, setCatalogForm] = useState({
    id: null,
    productId: '',
    sku: '',
    name: '',
    genericName: '',
    category: 'Daily Health & Wellness',
    unitPrice: '',
    stockQuantity: 100,
    reorderLevel: 25,
    requiresPrescription: false,
    isTemperatureSensitive: false,
    minTemp: '2.00',
    maxTemp: '8.00',
    coldChainStatus: 'NOT_REQUIRED',
    storageRequirement: 'Room Temperature (15°C - 25°C)',
    description: '',
    imageUrl: '',
  });

  const handleOpenCreateCatalog = () => {
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const suggestedSku = `PRD-MED-${randomSuffix}`;

    setCatalogEditorMode('create');
    setCatalogForm({
      id: null,
      productId: suggestedSku,
      sku: suggestedSku,
      name: '',
      genericName: '',
      category: 'Daily Health & Wellness',
      unitPrice: '',
      stockQuantity: 100,
      reorderLevel: 25,
      requiresPrescription: false,
      isTemperatureSensitive: false,
      minTemp: '2.00',
      maxTemp: '8.00',
      coldChainStatus: 'NOT_REQUIRED',
      storageRequirement: 'Room Temperature (15°C - 25°C)',
      description: '',
      imageUrl: '',
    });
    setShowCatalogModal(true);
  };

  const handleOpenEditCatalog = (product) => {
    const formattedId = getSpecificProductId(product);
    setCatalogEditorMode('edit');
    setCatalogForm({
      id: product.id,
      productId: formattedId,
      sku: product.sku || formattedId,
      name: product.name || '',
      genericName: product.genericName || '',
      category: product.category || 'Daily Health & Wellness',
      unitPrice: product.unitPrice !== undefined ? String(product.unitPrice) : '',
      stockQuantity: product.stockQuantity !== undefined ? product.stockQuantity : 100,
      reorderLevel: product.reorderLevel !== undefined ? product.reorderLevel : 25,
      requiresPrescription: Boolean(product.requiresPrescription),
      isTemperatureSensitive: Boolean(product.isTemperatureSensitive),
      minTemp: product.minTemp !== null && product.minTemp !== undefined ? String(product.minTemp) : '2.00',
      maxTemp: product.maxTemp !== null && product.maxTemp !== undefined ? String(product.maxTemp) : '8.00',
      coldChainStatus: product.coldChainStatus || (product.isTemperatureSensitive ? 'APPROVED' : 'NOT_REQUIRED'),
      storageRequirement: product.storageRequirement || (product.isTemperatureSensitive ? 'Cold Chain (2°C - 8°C)' : 'Room Temperature (15°C - 25°C)'),
      description: product.description || '',
      imageUrl: product.imageUrl || '',
    });
    setShowCatalogModal(true);
  };

  const handleSaveCatalog = async (e) => {
    e.preventDefault();
    if (!catalogForm.name.trim()) {
      showToast('Product name is required.', 'error');
      return;
    }
    const priceVal = parseFloat(catalogForm.unitPrice);
    if (isNaN(priceVal) || priceVal < 0) {
      showToast('Please enter a valid unit price in LKR.', 'error');
      return;
    }

    setSavingCatalog(true);
    try {
      const cleanSku = (catalogForm.sku || catalogForm.productId || `PRD-${Date.now().toString().slice(-6)}`).trim();
      const isCold = Boolean(catalogForm.isTemperatureSensitive);

      const payload = {
        name: catalogForm.name.trim(),
        genericName: catalogForm.genericName.trim(),
        sku: cleanSku,
        category: catalogForm.category || 'Daily Health & Wellness',
        unitPrice: priceVal,
        stockQuantity: Number(catalogForm.stockQuantity) || 0,
        reorderLevel: Number(catalogForm.reorderLevel) || 25,
        requiresPrescription: catalogForm.requiresPrescription,
        isTemperatureSensitive: isCold,
        minTemp: isCold ? (parseFloat(catalogForm.minTemp) || 2.00) : 15.00,
        maxTemp: isCold ? (parseFloat(catalogForm.maxTemp) || 8.00) : 25.00,
        coldChainStatus: catalogForm.coldChainStatus || (isCold ? 'PENDING_REVIEW' : 'NOT_REQUIRED'),
        storageRequirement: isCold ? `Cold Chain (${catalogForm.minTemp || '2'}°C - ${catalogForm.maxTemp || '8'}°C)` : 'Room Temperature (15°C - 25°C)',
        description: catalogForm.description.trim(),
        imageUrl: catalogForm.imageUrl.trim(),
      };

      if (catalogEditorMode === 'edit' && catalogForm.id) {
        const res = await client.put(`/api/v1/medicines/${catalogForm.id}`, payload);
        showToast(`Product "${res.data.name}" [${cleanSku}] updated successfully in database!`);
      } else {
        const res = await client.post('/api/v1/medicines', payload);
        showToast(`New Product "${res.data.name}" [${cleanSku}] created and saved to database!`);
      }

      setShowCatalogModal(false);
      await fetchData();
    } catch (err) {
      console.error('Save product error:', err);
      showToast(err.response?.data?.message || 'Failed to save product in database.', 'error');
    } finally {
      setSavingCatalog(false);
    }
  };

  // =============================================================
  // DELETE PRODUCT MODAL STATE & HANDLER
  // =============================================================
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await client.delete(`/api/v1/medicines/${deleteTarget.id}`);
      showToast(`Product "${deleteTarget.name}" [${getSpecificProductId(deleteTarget)}] removed from database.`);
      setDeleteTarget(null);
      await fetchData();
    } catch (err) {
      console.error('Delete product error:', err);
      showToast(err.response?.data?.message || 'Failed to delete product from database.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  // =============================================================
  // SEND FOR COLD CHAIN APPROVAL HANDLER
  // =============================================================
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [submittingApproval, setSubmittingApproval] = useState(false);

  const handleSendForColdChainApproval = async (product) => {
    setSubmittingApproval(true);
    try {
      const prodId = getSpecificProductId(product);
      // Call dedicated cold-chain request-approval endpoint
      await client.post(`/api/v1/cold-chain/tags/medicine/${product.id}/request-approval`, {
        section: 'REFRIGERATED',
        storageTempMin: 2.00,
        storageTempMax: 8.00,
        intensity: 'HIGH',
        securityLevel: 'HIGH_VALUE',
        deliveryActions: 'Keep refrigerated (2°C - 8°C). Continuous IoT temperature monitoring required in transit.',
      });

      showToast(`Cold Chain Approval requested for "${product.name}" [${prodId}]! Sent to Chief Pharmacist review queue.`);
      setApprovalTarget(null);
      await fetchData();
    } catch (err) {
      console.error('Cold Chain approval request error:', err);
      // Fallback: update medicine directly
      try {
        await client.put(`/api/v1/medicines/${product.id}`, {
          isTemperatureSensitive: true,
          coldChainStatus: 'PENDING_REVIEW',
          storageRequirement: 'Cold Chain (2°C - 8°C)',
          minTemp: 2.00,
          maxTemp: 8.00,
        });
        showToast(`Cold Chain Approval requested for "${product.name}"! Status updated to Pending Review in DB.`);
        setApprovalTarget(null);
        await fetchData();
      } catch (innerErr) {
        showToast(err.response?.data?.message || 'Failed to submit cold chain approval request.', 'error');
      }
    } finally {
      setSubmittingApproval(false);
    }
  };

  return (
    <div className="bg-[#fcfbf9] min-h-screen text-neutral-900 pb-16 font-sans relative overflow-x-hidden">
      
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

      {/* Invisible Left Edge Hover Zone */}
      <div
        className="fixed left-0 top-0 bottom-0 w-8 z-40"
        onMouseEnter={() => setIsDrawerOpen(true)}
        aria-hidden="true"
      />

      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity duration-500 ease-in-out ${
          isDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsDrawerOpen(false)}
        aria-hidden="true"
      />

      {/* Side Navigation Drawer (Cleaned: Strictly Catalog Management) */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 sm:w-80 bg-[#f1f3ff] z-50 flex flex-col justify-between py-6 px-4 shadow-2xl transition-transform duration-700 ease-in-out transform ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Operations Navigation Drawer"
      >
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

          <nav className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsDrawerOpen(false);
                navigate('/admin/catalog');
              }}
              className="flex items-center gap-3 px-4 py-3 rounded-full font-bold text-xs tracking-wide transition-all cursor-pointer text-left bg-black text-white shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">medication</span>
              <span className="flex-1">Catalog Management</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            </button>
          </nav>
        </div>

        <div className="px-3 pt-3 border-t border-gray-200 flex flex-col gap-1 text-[11px] text-gray-500">
          <span className="font-bold text-neutral-800">{user?.fullName || 'Operations Manager'}</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold">{user?.role || 'OPERATIONS_MANAGER'}</span>
        </div>
      </aside>

      {/* Top Header */}
      <header className="w-full bg-white border-b border-neutral-200/80 px-4 sm:px-6 lg:px-12 py-3.5 mb-6 shadow-xs">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
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
            <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-bold tracking-wide shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Catalog &amp; Formulation Management Console</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login/admin');
              }}
              title="Log Out of Operations Console"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 hover:bg-red-50 text-neutral-700 hover:text-red-600 text-xs font-bold uppercase tracking-wider transition-colors border border-neutral-200 shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Container */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Page Title & Top Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900 flex items-center gap-3">
              <span>Catalog Management</span>
              <span className="text-xs px-3 py-1 rounded-full bg-zinc-100 border border-zinc-300 font-mono font-bold text-zinc-700">
                {statsSummary.total} Products
              </span>
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Create, view, update, and manage master pharmaceutical formulations, specific product IDs, unit pricing, and cold chain approval requests.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={fetchData}
              title="Refresh catalog from database"
              className="h-10 px-4 rounded-full bg-zinc-100 hover:bg-zinc-200 text-neutral-700 border border-neutral-200 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-all active:scale-95 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              type="button"
              onClick={handleOpenCreateCatalog}
              className="h-10 px-5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              <span>Add New Product</span>
            </button>
          </div>
        </div>

        {/* Top Summary Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mb-6">
          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-neutral-500 text-[11px] font-bold uppercase tracking-wider mb-1">
              <span>Total Formulations</span>
              <span className="material-symbols-outlined text-[18px] text-zinc-600">medication</span>
            </div>
            <div className="text-2xl font-black text-neutral-900">{statsSummary.total}</div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Active Master Catalog</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              <span>Cold Chain Active</span>
              <span className="material-symbols-outlined text-[18px] text-emerald-600">ac_unit</span>
            </div>
            <div className="text-2xl font-black text-emerald-700">{statsSummary.coldChainCount}</div>
            <div className="text-[10px] text-emerald-600/80 mt-0.5">2°C – 8°C Certified</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-amber-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              <span>Pending Approvals</span>
              <span className="material-symbols-outlined text-[18px] text-amber-600">pending_actions</span>
            </div>
            <div className="text-2xl font-black text-amber-700">{statsSummary.pendingApprovalCount}</div>
            <div className="text-[10px] text-amber-600/80 mt-0.5">Cold Chain Review Queue</div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-neutral-200 shadow-2xs">
            <div className="flex items-center justify-between text-purple-700 text-[11px] font-bold uppercase tracking-wider mb-1">
              <span>Rx / OTC Split</span>
              <span className="material-symbols-outlined text-[18px] text-purple-600">prescriptions</span>
            </div>
            <div className="text-2xl font-black text-purple-900">
              {statsSummary.rxCount} <span className="text-xs font-normal text-neutral-400">Rx</span> / {statsSummary.otcCount} <span className="text-xs font-normal text-neutral-400">OTC</span>
            </div>
            <div className="text-[10px] text-neutral-400 mt-0.5">Prescription Control</div>
          </div>
        </div>

        {/* Filter Controls & Search Card */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden mb-8">
          <div className="p-4 sm:p-6 border-b border-neutral-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            
            {/* Search Bar */}
            <div className="relative flex-1 max-w-lg">
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => {
                  setCatalogSearch(e.target.value);
                  setCatalogPage(1);
                }}
                placeholder="Search by Product ID, SKU, Formulation, Generic..."
                className="w-full h-10 pl-9 pr-8 rounded-full bg-neutral-50 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black border border-neutral-200 transition-all"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px] pointer-events-none">
                search
              </span>
              {catalogSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setCatalogSearch('');
                    setCatalogPage(1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black font-bold text-sm cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2.5">
              
              {/* Category Dropdown */}
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setCatalogPage(1);
                }}
                className="h-10 px-3.5 rounded-full bg-neutral-50 text-xs text-neutral-800 font-bold border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
              >
                <option value="ALL">All Categories</option>
                {CATEGORY_LIST.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              {/* Cold Chain Filter */}
              <select
                value={coldChainFilter}
                onChange={(e) => {
                  setColdChainFilter(e.target.value);
                  setCatalogPage(1);
                }}
                className="h-10 px-3.5 rounded-full bg-neutral-50 text-xs text-neutral-800 font-bold border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
              >
                <option value="ALL">All Cold Chain Statuses</option>
                <option value="COLD_CHAIN">Cold Chain (2°C - 8°C)</option>
                <option value="PENDING">Pending Approval</option>
                <option value="AMBIENT">Ambient / Non-Cold</option>
              </select>

              {/* Sort Dropdown */}
              <select
                value={catalogSort}
                onChange={(e) => setCatalogSort(e.target.value)}
                className="h-10 px-3.5 rounded-full bg-neutral-50 text-xs text-neutral-800 font-bold border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
              >
                <option value="Newest">Newest First</option>
                <option value="Name: A to Z">Name: A to Z</option>
                <option value="Price: Low to High">Price: Low to High</option>
                <option value="Price: High to Low">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Table Header Counter */}
          <div className="px-6 py-2.5 bg-neutral-50/60 border-b border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
            <span>
              Showing <strong className="text-black">{paginatedCatalogMedicines.length}</strong> of{' '}
              <strong className="text-black">{filteredCatalogMedicines.length}</strong> formulations
            </span>
            <span className="text-[11px] font-medium text-neutral-400">
              Persisted SQL Database &bull; Currency: <strong className="text-neutral-700">LKR (Rs.)</strong>
            </span>
          </div>

          {/* Master Catalog Table */}
          {loading ? (
            <div className="p-16 text-center text-xs font-semibold text-neutral-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
              Loading catalog formulations from database...
            </div>
          ) : filteredCatalogMedicines.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <span className="material-symbols-outlined text-[42px] text-neutral-300">medication</span>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                No catalog products found matching filter criteria.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100/80 text-neutral-700 font-extrabold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3.5 px-4">Product ID</th>
                    <th className="py-3.5 px-4">Product Details &amp; Formulation</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Selling Price (LKR)</th>
                    <th className="py-3.5 px-4">Prescription</th>
                    <th className="py-3.5 px-4">Cold Chain</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {paginatedCatalogMedicines.map((m) => {
                    const specificId = getSpecificProductId(m);
                    const isCold = Boolean(m.isTemperatureSensitive);
                    const coldStatus = (m.coldChainStatus || '').toUpperCase();
                    const isPendingApproval = coldStatus === 'PENDING_REVIEW' || coldStatus === 'PENDING_APPROVAL' || coldStatus === 'PENDING_DUAL_REVIEW';
                    const isApprovedCold = coldStatus === 'APPROVED' || (isCold && !isPendingApproval && coldStatus !== 'REJECTED' && coldStatus !== 'NOT_REQUIRED');
                    const isRejectedCold = coldStatus === 'REJECTED';

                    return (
                      <tr
                        key={m.id}
                        className="hover:bg-neutral-50/80 transition-colors group"
                      >
                        {/* Specific Product ID (No 1, 2, 3 raw counters!) */}
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 font-mono font-bold text-[11px] px-2.5 py-1 rounded-md bg-zinc-100 border border-zinc-300 text-zinc-900 shadow-2xs">
                            <span className="material-symbols-outlined text-[13px] text-zinc-500">qr_code</span>
                            <span>{specificId}</span>
                          </span>
                        </td>

                        {/* Product Details & Formulation */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200 flex items-center justify-center">
                              {m.imageUrl ? (
                                <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-neutral-400 text-[18px]">medication</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-neutral-900 group-hover:text-black line-clamp-1">
                                {m.name}
                              </span>
                              {m.genericName && (
                                <span className="text-[11px] text-neutral-500 line-clamp-1">
                                  {m.genericName}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700">
                            {m.category || 'General'}
                          </span>
                        </td>

                        {/* Price */}
                        <td className="py-3.5 px-4 font-bold text-neutral-900 text-sm">
                          {formatLKR(m.unitPrice)}
                        </td>

                        {/* Prescription */}
                        <td className="py-3.5 px-4">
                          {m.requiresPrescription ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                              <span className="material-symbols-outlined text-[13px]">prescriptions</span>
                              <span>Rx Required</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                              <span className="material-symbols-outlined text-[13px]">check_circle</span>
                              <span>OTC</span>
                            </span>
                          )}
                        </td>

                        {/* Dedicated Cold Chain Column */}
                        <td className="py-3.5 px-4">
                          {isPendingApproval ? (
                            <div className="inline-flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 text-[11px] font-extrabold border border-amber-300 ring-1 ring-amber-400/40">
                                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                                <span>Pending Approval</span>
                              </span>
                              <span className="text-[9px] text-amber-700/80 font-medium pl-1">
                                In Pharmacist Review
                              </span>
                            </div>
                          ) : isApprovedCold ? (
                            <div className="inline-flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-50 text-cyan-900 text-[11px] font-extrabold border border-cyan-300 ring-1 ring-cyan-400/40">
                                <span className="material-symbols-outlined text-[14px] text-cyan-600">ac_unit</span>
                                <span>Cold Chain (2°C - 8°C)</span>
                              </span>
                              <span className="text-[9px] text-cyan-800 font-semibold pl-1">
                                Certified &amp; Active
                              </span>
                            </div>
                          ) : isRejectedCold ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 text-[11px] font-bold border border-rose-200">
                              <span className="material-symbols-outlined text-[14px] text-rose-600">cancel</span>
                              <span>Review Rejected</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-600 text-[11px] font-semibold border border-neutral-200">
                              <span className="material-symbols-outlined text-[14px] text-neutral-400">thermostat</span>
                              <span>Ambient (15°C - 25°C)</span>
                            </span>
                          )}
                        </td>

                        {/* Actions (CRUD + Send for Cold Chain Approval) */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5 flex-wrap">
                            
                            {/* Option: Send for Cold Chain Approval */}
                            <button
                              type="button"
                              onClick={() => setApprovalTarget(m)}
                              title="Submit this product for Cold Chain Verification & Approval"
                              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer shadow-2xs ${
                                isPendingApproval
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                  : isApprovedCold
                                  ? 'bg-cyan-50 hover:bg-cyan-100 text-cyan-900 border border-cyan-200'
                                  : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {isPendingApproval ? 'hourglass_top' : isApprovedCold ? 'verified' : 'ac_unit'}
                              </span>
                              <span>
                                {isPendingApproval ? 'Approval Pending' : isApprovedCold ? 'Re-Request Approval' : 'Send for Cold Chain Approval'}
                              </span>
                            </button>

                            {/* Edit Action */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditCatalog(m)}
                              title="Edit product formulation"
                              className="px-3 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold transition-colors cursor-pointer border border-neutral-200"
                            >
                              Edit
                            </button>

                            {/* Delete Action */}
                            <button
                              type="button"
                              onClick={() => setDeleteTarget(m)}
                              title="Delete product permanently from database"
                              className="px-3 py-1.5 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold transition-colors cursor-pointer border border-red-200"
                            >
                              Delete
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

          {/* Pagination */}
          {totalCatalogPages > 1 && (
            <div className="p-4 border-t border-neutral-100 flex items-center justify-between">
              <button
                type="button"
                disabled={catalogPage === 1}
                onClick={() => setCatalogPage((p) => Math.max(1, p - 1))}
                className="px-4 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-xs font-bold text-neutral-700 cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs font-medium text-neutral-500">
                Page {catalogPage} of {totalCatalogPages}
              </span>
              <button
                type="button"
                disabled={catalogPage === totalCatalogPages}
                onClick={() => setCatalogPage((p) => Math.min(totalCatalogPages, p + 1))}
                className="px-4 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-xs font-bold text-neutral-700 cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: ADD / EDIT PRODUCT FORMULATION MODAL             */}
      {/* ========================================================= */}
      {showCatalogModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-neutral-200 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100 mb-6">
              <div>
                <h2 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                  {catalogEditorMode === 'create' ? 'Add New Formulation' : 'Update Catalog Formulation'}
                </h2>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Changes will be committed directly to MySQL master inventory catalog.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 font-bold cursor-pointer"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSaveCatalog} className="space-y-4">
              
              {/* Row 1: Product ID / SKU & Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Specific Product ID / SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={catalogForm.sku}
                    onChange={(e) => setCatalogForm({ ...catalogForm, sku: e.target.value })}
                    placeholder="e.g. PRD-RX-AMX-500"
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 text-xs font-mono font-bold text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <span className="text-[10px] text-neutral-400 mt-0.5 block">
                    Unique identifier (e.g. PRD-RX-AMX-500)
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={catalogForm.name}
                    onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
                    placeholder="e.g. Amoxil 500mg"
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 text-xs text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                  />
                </div>
              </div>

              {/* Row 2: Generic Formulation & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Generic / Active Chemical
                  </label>
                  <input
                    type="text"
                    value={catalogForm.genericName}
                    onChange={(e) => setCatalogForm({ ...catalogForm, genericName: e.target.value })}
                    placeholder="e.g. Amoxicillin Trihydrate"
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 text-xs text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={catalogForm.category}
                    onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 text-xs text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black font-medium cursor-pointer"
                  >
                    {CATEGORY_LIST.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Unit Price (LKR), Stock Quantity, Reorder Level */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Unit Price (LKR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={catalogForm.unitPrice}
                    onChange={(e) => setCatalogForm({ ...catalogForm, unitPrice: e.target.value })}
                    placeholder="e.g. 1200.00"
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 text-xs text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Initial Stock Qty
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={catalogForm.stockQuantity}
                    onChange={(e) => setCatalogForm({ ...catalogForm, stockQuantity: parseInt(e.target.value) || 0 })}
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 text-xs text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                    Reorder Threshold
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={catalogForm.reorderLevel}
                    onChange={(e) => setCatalogForm({ ...catalogForm, reorderLevel: parseInt(e.target.value) || 0 })}
                    className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 text-xs text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black font-semibold"
                  />
                </div>
              </div>

              {/* Row 4: Prescription & Cold Chain Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-neutral-900">Requires Prescription (Rx)</span>
                    <span className="text-[10px] text-neutral-500">Must be verified by Clinical Pharmacist</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={catalogForm.requiresPrescription}
                    onChange={(e) => setCatalogForm({ ...catalogForm, requiresPrescription: e.target.checked })}
                    className="w-5 h-5 accent-zinc-900 rounded cursor-pointer"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-cyan-50/70 border border-cyan-200 flex items-center justify-between">
                  <div>
                    <span className="block text-xs font-bold text-cyan-950 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px] text-cyan-700">ac_unit</span>
                      <span>Cold Chain Sensitive (2°C - 8°C)</span>
                    </span>
                    <span className="text-[10px] text-cyan-800">Requires temperature telemetry &amp; tag review</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={catalogForm.isTemperatureSensitive}
                    onChange={(e) => setCatalogForm({
                      ...catalogForm,
                      isTemperatureSensitive: e.target.checked,
                      coldChainStatus: e.target.checked ? 'PENDING_REVIEW' : 'NOT_REQUIRED',
                    })}
                    className="w-5 h-5 accent-cyan-700 rounded cursor-pointer"
                  />
                </div>
              </div>

              {/* Row 5: Image URL & Description */}
              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Product Image URL
                </label>
                <input
                  type="url"
                  value={catalogForm.imageUrl}
                  onChange={(e) => setCatalogForm({ ...catalogForm, imageUrl: e.target.value })}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full h-10 px-3.5 rounded-xl bg-neutral-50 text-xs text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 uppercase tracking-wider mb-1">
                  Clinical Description &amp; Usage Notes
                </label>
                <textarea
                  rows="3"
                  value={catalogForm.description}
                  onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })}
                  placeholder="Clinical indications, dosage, storage guidelines..."
                  className="w-full p-3.5 rounded-xl bg-neutral-50 text-xs text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="px-5 py-2.5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCatalog}
                  className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-sm transition-all"
                >
                  {savingCatalog ? 'Saving to Database...' : catalogEditorMode === 'create' ? 'Create Formulation' : 'Save Changes'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: SEND FOR COLD CHAIN APPROVAL CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {approvalTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-cyan-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">ac_unit</span>
              </div>
              <div>
                <h3 className="text-base font-black text-neutral-900">Send for Cold Chain Approval</h3>
                <span className="text-xs font-mono font-bold text-cyan-800">{getSpecificProductId(approvalTarget)}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
              Submit <strong>"{approvalTarget.name}"</strong> to the Chief Pharmacist Cold Chain Compliance Review queue.
              This will enforce <strong>2°C – 8°C storage validation</strong> and live IoT temperature breach telemetry during dispatch.
            </p>

            <div className="bg-cyan-50/80 p-3.5 rounded-2xl border border-cyan-200 mb-6 text-xs text-cyan-950 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-cyan-800 font-semibold">Target Storage Section:</span>
                <span className="font-bold">Refrigerated (2.00°C - 8.00°C)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-cyan-800 font-semibold">Security Protocol:</span>
                <span className="font-bold">High Security Tagging</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-cyan-800 font-semibold">Destination Queue:</span>
                <span className="font-bold text-indigo-700">Chief Pharmacist Review</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setApprovalTarget(null)}
                className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingApproval}
                onClick={() => handleSendForColdChainApproval(approvalTarget)}
                className="px-5 py-2 rounded-full bg-cyan-700 hover:bg-cyan-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">send</span>
                <span>{submittingApproval ? 'Submitting Request...' : 'Confirm & Request Approval'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: DELETE CONFIRMATION MODAL                        */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[26px]">delete_forever</span>
              </div>
              <div>
                <h3 className="text-base font-black text-neutral-900">Delete Formulation?</h3>
                <span className="text-xs font-mono font-bold text-neutral-500">{getSpecificProductId(deleteTarget)}</span>
              </div>
            </div>

            <p className="text-xs text-neutral-600 mb-6 leading-relaxed">
              Are you sure you want to permanently delete <strong>"{deleteTarget.name}"</strong>? This will remove all catalog formulation data and associated cold chain configurations from the SQL database.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2 rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm disabled:opacity-50"
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default OperationsCatalogDashboard;
