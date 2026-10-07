import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

// Helper: Format Date as DD/MM/YYYY
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

// Helper: Shelf Life Status
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

// Helper: Stock Level Metric Badge
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

const OperationsCatalogDashboard = ({ initialTab = 'catalog' }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab: 'catalog' | 'stocks'
  const [activeTab, setActiveTab] = useState(() => {
    if (location.pathname.includes('/stocks')) return 'stocks';
    return initialTab || 'catalog';
  });

  useEffect(() => {
    if (location.pathname.includes('/stocks')) {
      setActiveTab('stocks');
    } else if (location.pathname.includes('/catalog')) {
      setActiveTab('catalog');
    }
  }, [location.pathname]);

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
  // Data Fetching
  // -------------------------------------------------------------
  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await client.get('/api/v1/medicines');
      setMedicines(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load medicines:', err);
      showToast('Error loading medicines from server', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Format Currency
  const formatLKR = (amount) => {
    const num = Number(amount) || 0;
    return `LKR ${num.toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // =============================================================
  // CATALOG MANAGEMENT VIEW STATE & LOGIC
  // =============================================================
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogSort, setCatalogSort] = useState('Newest');
  const [catalogPage, setCatalogPage] = useState(1);
  const catalogItemsPerPage = 8;

  // Catalog Add / Edit Modal
  const [showCatalogModal, setShowCatalogModal] = useState(false);
  const [catalogEditorMode, setCatalogEditorMode] = useState('create');
  const [savingCatalog, setSavingCatalog] = useState(false);
  const [catalogForm, setCatalogForm] = useState({
    id: null,
    name: '',
    genericName: '',
    sku: '',
    category: 'Daily Health & Wellness',
    unitPrice: '',
    requiresPrescription: false,
    description: '',
    imageUrl: '',
  });

  const filteredCatalogMedicines = useMemo(() => {
    let result = [...medicines];

    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase().trim();
      result = result.filter((m) => {
        const matchId = String(m.id || '').includes(q);
        const matchSku = (m.sku || '').toLowerCase().includes(q);
        const matchName = (m.name || '').toLowerCase().includes(q);
        const matchGeneric = (m.genericName || '').toLowerCase().includes(q);
        const matchCategory = (m.category || '').toLowerCase().includes(q);
        return matchId || matchSku || matchName || matchGeneric || matchCategory;
      });
    }

    if (catalogSort === 'Price: Low to High') {
      result.sort((a, b) => (Number(a.unitPrice) || 0) - (Number(b.unitPrice) || 0));
    } else if (catalogSort === 'Price: High to Low') {
      result.sort((a, b) => (Number(b.unitPrice) || 0) - (Number(a.unitPrice) || 0));
    } else {
      result.sort((a, b) => (Number(b.id) || 0) - (Number(a.id) || 0));
    }

    return result;
  }, [medicines, catalogSearch, catalogSort]);

  const totalCatalogPages = Math.ceil(filteredCatalogMedicines.length / catalogItemsPerPage) || 1;
  const paginatedCatalogMedicines = useMemo(() => {
    const start = (catalogPage - 1) * catalogItemsPerPage;
    return filteredCatalogMedicines.slice(start, start + catalogItemsPerPage);
  }, [filteredCatalogMedicines, catalogPage]);

  const handleOpenCreateCatalog = () => {
    setCatalogEditorMode('create');
    setCatalogForm({
      id: null,
      name: '',
      genericName: '',
      sku: '',
      category: 'Daily Health & Wellness',
      unitPrice: '',
      requiresPrescription: false,
      description: '',
      imageUrl: '',
    });
    setShowCatalogModal(true);
  };

  const handleOpenEditCatalog = (product) => {
    setCatalogEditorMode('edit');
    setCatalogForm({
      id: product.id,
      name: product.name || '',
      genericName: product.genericName || '',
      sku: product.sku || '',
      category: product.category || 'Daily Health & Wellness',
      unitPrice: product.unitPrice !== undefined ? String(product.unitPrice) : '',
      requiresPrescription: Boolean(product.requiresPrescription),
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
      showToast('Please enter a valid price in LKR.', 'error');
      return;
    }

    setSavingCatalog(true);
    try {
      const payload = {
        name: catalogForm.name.trim(),
        genericName: catalogForm.genericName.trim(),
        sku: catalogForm.sku.trim() || `SKU-${Date.now().toString().slice(-6)}`,
        category: catalogForm.category || 'Daily Health & Wellness',
        unitPrice: priceVal,
        requiresPrescription: catalogForm.requiresPrescription,
        description: catalogForm.description.trim(),
        imageUrl: catalogForm.imageUrl.trim(),
      };

      if (catalogEditorMode === 'edit' && catalogForm.id) {
        const res = await client.put(`/api/v1/medicines/${catalogForm.id}`, payload);
        showToast(`Catalog product "${res.data.name}" updated successfully!`);
      } else {
        const res = await client.post('/api/v1/medicines', payload);
        showToast(`New product "${res.data.name}" added to catalog!`);
      }

      setShowCatalogModal(false);
      await fetchData();
    } catch (err) {
      console.error('Save product error:', err);
      showToast(err.response?.data?.message || 'Failed to save product.', 'error');
    } finally {
      setSavingCatalog(false);
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete "${name}" (ID #${id}) from the catalog?`)) {
      return;
    }
    try {
      await client.delete(`/api/v1/medicines/${id}`);
      showToast(`Product "${name}" deleted.`);
      await fetchData();
    } catch (err) {
      console.error('Delete product error:', err);
      showToast(err.response?.data?.message || 'Failed to delete product', 'error');
    }
  };

  // =============================================================
  // STOCKS MANAGEMENT VIEW STATE & LOGIC
  // =============================================================
  const [stocksSearch, setStocksSearch] = useState('');
  const [stocksCategory, setStocksCategory] = useState('ALL');
  const [stocksTagFilter, setStocksTagFilter] = useState('ALL'); // ALL, OTC, Rx, Cold Chain
  const [stocksStatusFilter, setStocksStatusFilter] = useState('ALL'); // ALL, IN_STOCK, LOW_STOCK, OUT_OF_STOCK
  const [stocksShelfLifeFilter, setStocksShelfLifeFilter] = useState('ALL'); // ALL, GOOD, NEAR_EXPIRY, EXPIRED
  const [stocksPage, setStocksPage] = useState(1);
  const stocksItemsPerPage = 10;

  // Quick Adjust Modal State
  const [showQuickAdjustModal, setShowQuickAdjustModal] = useState(false);
  const [quickAdjustItem, setQuickAdjustItem] = useState(null);
  const [adjustForm, setAdjustForm] = useState({
    stockQuantity: 0,
    allocatedStock: 0,
    reorderLevel: 25,
    shelfLocation: '',
    cogs: 0,
    unitPrice: 0,
    batchNumber: '',
    barcode: '',
    storageRequirement: '',
    tags: '',
    manufacturingDate: '',
    expiryDate: '',
  });
  const [savingAdjust, setSavingAdjust] = useState(false);

  // Reorder / Create PO Modal State
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderItem, setReorderItem] = useState(null);
  const [poForm, setPoForm] = useState({
    quantity: 50,
    notes: '',
  });
  const [submittingPo, setSubmittingPo] = useState(false);
  const [poSuccessResult, setPoSuccessResult] = useState(null);

  // Compute Stocks Summary Metrics
  const stocksMetrics = useMemo(() => {
    let totalItems = medicines.length;
    let totalStockUnits = 0;
    let totalAllocatedUnits = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let nearExpiryCount = 0;
    let expiredCount = 0;
    let totalValuation = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    medicines.forEach((m) => {
      const stock = Number(m.stockQuantity) || 0;
      const allocated = Number(m.allocatedStock) || 0;
      const reorder = Number(m.reorderLevel) || 25;
      const cogs = Number(m.cogs) || (Number(m.unitPrice) * 0.45) || 0;

      totalStockUnits += stock;
      totalAllocatedUnits += allocated;
      totalValuation += stock * cogs;

      if (stock === 0) {
        outOfStockCount++;
      } else if (stock <= reorder) {
        lowStockCount++;
      }

      if (m.expiryDate) {
        const exp = new Date(m.expiryDate);
        exp.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          expiredCount++;
        } else if (diffDays <= 60) {
          nearExpiryCount++;
        }
      }
    });

    return {
      totalItems,
      totalStockUnits,
      totalAllocatedUnits,
      lowStockCount,
      outOfStockCount,
      nearExpiryCount,
      expiredCount,
      totalValuation,
    };
  }, [medicines]);

  // Filtered Stocks List
  const filteredStocks = useMemo(() => {
    let list = [...medicines];

    // Search: SKU/Barcode ID, Product Name, Generic, Batch Number, Shelf Location
    if (stocksSearch.trim()) {
      const q = stocksSearch.toLowerCase().trim();
      list = list.filter((m) => {
        const matchSku = (m.sku || '').toLowerCase().includes(q);
        const matchBarcode = (m.barcode || '').toLowerCase().includes(q);
        const matchName = (m.name || '').toLowerCase().includes(q);
        const matchGeneric = (m.genericName || '').toLowerCase().includes(q);
        const matchBatch = (m.batchNumber || '').toLowerCase().includes(q);
        const matchShelf = (m.shelfLocation || '').toLowerCase().includes(q);
        return matchSku || matchBarcode || matchName || matchGeneric || matchBatch || matchShelf;
      });
    }

    // Category Filter
    if (stocksCategory !== 'ALL') {
      list = list.filter((m) => (m.category || '').toLowerCase() === stocksCategory.toLowerCase());
    }

    // Tag Filter: OTC, Rx, Cold Chain
    if (stocksTagFilter !== 'ALL') {
      list = list.filter((m) => {
        const isRx = Boolean(m.requiresPrescription);
        const isCold = Boolean(m.isTemperatureSensitive) || (m.tags || '').toLowerCase().includes('cold');
        if (stocksTagFilter === 'Rx') return isRx;
        if (stocksTagFilter === 'OTC') return !isRx;
        if (stocksTagFilter === 'Cold Chain') return isCold;
        return true;
      });
    }

    // Stock Status Filter
    if (stocksStatusFilter !== 'ALL') {
      list = list.filter((m) => {
        const stock = Number(m.stockQuantity) || 0;
        const reorder = Number(m.reorderLevel) || 25;
        if (stocksStatusFilter === 'OUT_OF_STOCK') return stock === 0;
        if (stocksStatusFilter === 'LOW_STOCK') return stock > 0 && stock <= reorder;
        if (stocksStatusFilter === 'IN_STOCK') return stock > reorder;
        return true;
      });
    }

    // Shelf-Life Filter
    if (stocksShelfLifeFilter !== 'ALL') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      list = list.filter((m) => {
        if (!m.expiryDate) return false;
        const exp = new Date(m.expiryDate);
        exp.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (stocksShelfLifeFilter === 'EXPIRED') return diffDays < 0;
        if (stocksShelfLifeFilter === 'NEAR_EXPIRY') return diffDays >= 0 && diffDays <= 60;
        if (stocksShelfLifeFilter === 'GOOD') return diffDays > 60;
        return true;
      });
    }

    return list;
  }, [medicines, stocksSearch, stocksCategory, stocksTagFilter, stocksStatusFilter, stocksShelfLifeFilter]);

  const totalStocksPages = Math.ceil(filteredStocks.length / stocksItemsPerPage) || 1;
  const paginatedStocks = useMemo(() => {
    const start = (stocksPage - 1) * stocksItemsPerPage;
    return filteredStocks.slice(start, start + stocksItemsPerPage);
  }, [filteredStocks, stocksPage]);

  // Open Quick Adjust Modal
  const handleOpenQuickAdjust = (item) => {
    setQuickAdjustItem(item);
    setAdjustForm({
      stockQuantity: item.stockQuantity || 0,
      allocatedStock: item.allocatedStock || 0,
      reorderLevel: item.reorderLevel || 25,
      shelfLocation: item.shelfLocation || 'Shelf A-01',
      cogs: item.cogs !== undefined ? item.cogs : (Number(item.unitPrice) * 0.45).toFixed(2),
      unitPrice: item.unitPrice || 0,
      batchNumber: item.batchNumber || '',
      barcode: item.barcode || (item.sku ? 'BC-' + item.sku.replace('SKU-', '') : ''),
      storageRequirement: item.storageRequirement || (item.isTemperatureSensitive ? 'Cold Chain (2°C - 8°C)' : 'Room Temperature (15°C - 25°C)'),
      tags: item.tags || (item.requiresPrescription ? 'Rx' : 'OTC'),
      manufacturingDate: item.manufacturingDate ? String(item.manufacturingDate).split('T')[0] : '',
      expiryDate: item.expiryDate ? String(item.expiryDate).split('T')[0] : '',
    });
    setShowQuickAdjustModal(true);
  };

  const handleSaveQuickAdjust = async (e) => {
    e.preventDefault();
    if (!quickAdjustItem) return;
    setSavingAdjust(true);
    try {
      const payload = {
        stockQuantity: parseInt(adjustForm.stockQuantity, 10) || 0,
        allocatedStock: parseInt(adjustForm.allocatedStock, 10) || 0,
        reorderLevel: parseInt(adjustForm.reorderLevel, 10) || 25,
        shelfLocation: adjustForm.shelfLocation.trim(),
        cogs: parseFloat(adjustForm.cogs) || 0,
        unitPrice: parseFloat(adjustForm.unitPrice) || 0,
        batchNumber: adjustForm.batchNumber.trim(),
        barcode: adjustForm.barcode.trim(),
        storageRequirement: adjustForm.storageRequirement.trim(),
        tags: adjustForm.tags.trim(),
        manufacturingDate: adjustForm.manufacturingDate || null,
        expiryDate: adjustForm.expiryDate || null,
      };

      const res = await client.patch(`/api/v1/medicines/${quickAdjustItem.id}/stock`, payload);
      showToast(`Stock updated for "${res.data.name}"`);
      setShowQuickAdjustModal(false);
      await fetchData();
    } catch (err) {
      console.error('Quick adjust error:', err);
      showToast(err.response?.data?.message || 'Failed to update stock', 'error');
    } finally {
      setSavingAdjust(false);
    }
  };

  // Toggle Quarantine Action
  const handleToggleQuarantine = async (item) => {
    const nextState = !Boolean(item.isQuarantined);
    const actionLabel = nextState ? 'QUARANTINE' : 'RELEASE';
    if (!window.confirm(`Are you sure you want to ${actionLabel} "${item.name}" (SKU: ${item.sku})? ${nextState ? 'Quarantined stock is locked from fulfillment.' : 'Stock will be restored to active dispensing.'}`)) {
      return;
    }

    try {
      const res = await client.post(`/api/v1/medicines/${item.id}/quarantine`, {
        isQuarantined: nextState,
        reason: nextState ? 'Expired or quality inspection quarantine' : 'Quarantine cleared',
      });
      showToast(`"${res.data.name}" marked as ${nextState ? 'QUARANTINED' : 'ACTIVE'}`);
      await fetchData();
    } catch (err) {
      console.error('Quarantine toggle error:', err);
      showToast('Failed to update quarantine status', 'error');
    }
  };

  // Open Reorder / Create PO Modal
  const handleOpenReorder = (item) => {
    setReorderItem(item);
    const curr = Number(item.stockQuantity) || 0;
    const reorder = Number(item.reorderLevel) || 25;
    const suggested = Math.max(20, (reorder * 2) - curr);
    setPoForm({
      quantity: suggested,
      notes: `Restock request for ${item.name}. Shelf location: ${item.shelfLocation || 'N/A'}.`,
    });
    setPoSuccessResult(null);
    setShowReorderModal(true);
  };

  const handleCreatePurchaseOrder = async (e) => {
    e.preventDefault();
    if (!reorderItem) return;
    setSubmittingPo(true);
    try {
      const res = await client.post(`/api/v1/medicines/${reorderItem.id}/reorder`, {
        quantity: parseInt(poForm.quantity, 10) || 50,
        notes: poForm.notes.trim(),
      });
      setPoSuccessResult(res.data);
      showToast(`PO ${res.data.poNumber} created! Alert sent to Delivery Coordinator.`);
      await fetchData();
    } catch (err) {
      console.error('Create PO error:', err);
      showToast(err.response?.data?.message || 'Failed to create PO', 'error');
    } finally {
      setSubmittingPo(false);
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

      {/* ========================================================= */}
      {/* INVISIBLE LEFT EDGE HOVER ZONE (Slow animation open)     */}
      {/* Bringing cursor near the left edge opens side panel      */}
      {/* ========================================================= */}
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

      {/* ========================================================= */}
      {/* COLLAPSIBLE SIDE PANEL WITH MOVING HANDLE BUTTON          */}
      {/* Moves with the side panel itself. No separate buttons!    */}
      {/* ========================================================= */}
      <aside
        className={`fixed left-0 top-0 h-full w-72 sm:w-80 bg-[#f1f3ff] z-50 flex flex-col justify-between py-6 px-4 shadow-2xl transition-transform duration-700 ease-in-out transform ${
          isDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Operations Navigation Drawer"
      >
        {/* Floating Unified Moving Handle Button mounted directly to sidebar outer edge */}
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
          {/* Drawer Top Header (Without separate close button) */}
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

          {/* Drawer Navigation: Catalog Management & Stocks Management */}
          <nav className="flex flex-col gap-2 pt-2">
            
            {/* 1. Catalog Management Option */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('catalog');
                setIsDrawerOpen(false);
                navigate('/admin/catalog');
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-full font-bold text-xs tracking-wide transition-all cursor-pointer text-left ${
                activeTab === 'catalog'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-white/80 hover:bg-white text-neutral-700 hover:text-black'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">medication</span>
              <span className="flex-1">Catalog Management</span>
              {activeTab === 'catalog' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>

            {/* 2. Stocks Management Option */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('stocks');
                setIsDrawerOpen(false);
                navigate('/admin/stocks');
              }}
              className={`flex items-center gap-3 px-4 py-3 rounded-full font-bold text-xs tracking-wide transition-all cursor-pointer text-left ${
                activeTab === 'stocks'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-white/80 hover:bg-white text-neutral-700 hover:text-black'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              <span className="flex-1">Stocks Management</span>
              {activeTab === 'stocks' && (
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              )}
            </button>

          </nav>
        </div>

        {/* Bottom Staff Info */}
        <div className="px-3 pt-3 border-t border-gray-200 flex flex-col gap-1 text-[11px] text-gray-500">
          <span className="font-bold text-neutral-800">{user?.fullName || 'Operations Manager'}</span>
          <span className="text-[10px] uppercase tracking-wider font-semibold">{user?.role || 'OPERATIONS_MANAGER'}</span>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* TOP HEADER: Pharma + Logo (left) & Logout Button (right)  */}
      {/* Regular nav bar matching the Pharmacist Dashboard         */}
      {/* ========================================================= */}
      <header className="w-full bg-white border-b border-neutral-200/80 px-4 sm:px-6 lg:px-12 py-3.5 mb-6 shadow-xs">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          
          {/* Top Left: Pharma + Logo and Active Status Badge below it */}
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

            {/* Active Status Badge placed just below the Pharma + logo */}
            <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-bold tracking-wide shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{activeTab === 'stocks' ? 'Stocks & Inventory Operations' : 'Catalog & Formulation Operations'}</span>
            </div>
          </div>

          {/* Top Right: Logout Button */}
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

      {/* ========================================================= */}
      {/* WORKSPACE CONTENT AREA                                    */}
      {/* ========================================================= */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12">

        {/* ======================================================= */}
        {/* VIEW 1: CATALOG MANAGEMENT                              */}
        {/* ======================================================= */}
        {activeTab === 'catalog' && (
          <div>
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
                  Catalog Management
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  Configure master clinical pharmaceutical formulas, categories, pricing, and prescriptions.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchData}
                  title="Refresh catalog"
                  className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-black text-white flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                </button>
              </div>
            </div>

            {/* Catalog Controls Card */}
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden mb-8">
              <div className="p-4 sm:p-6 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Search Bar */}
                <div className="relative flex-1 max-w-lg">
                  <input
                    type="text"
                    value={catalogSearch}
                    onChange={(e) => {
                      setCatalogSearch(e.target.value);
                      setCatalogPage(1);
                    }}
                    placeholder="Search by ID, SKU, Name, Generic, Category..."
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

                {/* Sort & Add Product */}
                <div className="flex items-center gap-3">
                  <select
                    value={catalogSort}
                    onChange={(e) => setCatalogSort(e.target.value)}
                    className="h-10 px-3.5 rounded-full bg-neutral-50 text-xs text-neutral-800 font-bold border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                  >
                    <option value="Newest">Newest First</option>
                    <option value="Price: Low to High">Price: Low to High</option>
                    <option value="Price: High to Low">Price: High to Low</option>
                  </select>

                  <button
                    type="button"
                    onClick={handleOpenCreateCatalog}
                    className="h-10 px-5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    <span>Add New Product</span>
                  </button>
                </div>

              </div>

              {/* Table Counter */}
              <div className="px-6 py-2.5 bg-neutral-50/60 border-b border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
                <span>
                  Showing <strong className="text-black">{paginatedCatalogMedicines.length}</strong> of{' '}
                  <strong className="text-black">{filteredCatalogMedicines.length}</strong> products
                </span>
                <span className="text-[11px] font-medium text-neutral-400">
                  Currency: <strong className="text-neutral-700">LKR (Rs.)</strong>
                </span>
              </div>

              {/* Catalog Table: STOCK LEVEL COLUMN COMPLETELY REMOVED */}
              {loading ? (
                <div className="p-16 text-center text-xs font-semibold text-neutral-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
                  Loading catalog products...
                </div>
              ) : filteredCatalogMedicines.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <span className="material-symbols-outlined text-[42px] text-neutral-300">inventory_2</span>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    No products found matching criteria.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100/80 text-neutral-700 font-extrabold uppercase tracking-wider border-b border-neutral-200">
                      <tr>
                        <th className="py-3.5 px-4 w-16">ID</th>
                        <th className="py-3.5 px-4">Product Details &amp; Formulation</th>
                        <th className="py-3.5 px-4">Batch # / SKU</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Selling Price (LKR)</th>
                        <th className="py-3.5 px-4">Prescription</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {paginatedCatalogMedicines.map((m) => (
                        <tr
                          key={m.id}
                          className="hover:bg-neutral-50/80 transition-colors group"
                        >
                          <td className="py-3 px-4 font-mono font-bold text-neutral-500">
                            #{m.id}
                          </td>

                          <td className="py-3 px-4">
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

                          <td className="py-3 px-4 font-mono text-[11px] font-semibold text-neutral-600">
                            <span className="px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200">
                              {m.sku || 'N/A'}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-700">
                              {m.category || 'General'}
                            </span>
                          </td>

                          <td className="py-3 px-4 font-bold text-neutral-900 text-sm">
                            {formatLKR(m.unitPrice)}
                          </td>

                          <td className="py-3 px-4">
                            {m.requiresPrescription ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[10px] font-bold border border-amber-200">
                                <span className="material-symbols-outlined text-[13px]">prescriptions</span>
                                <span>Rx Required</span>
                              </span>
                            ) : (
                              <span className="text-[11px] text-neutral-400 font-medium">OTC</span>
                            )}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCatalog(m)}
                                className="px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(m.id, m.name)}
                                className="px-2.5 py-1 rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold transition-colors cursor-pointer"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
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
        )}

        {/* ======================================================= */}
        {/* VIEW 2: STOCKS MANAGEMENT                               */}
        {/* ======================================================= */}
        {activeTab === 'stocks' && (
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
                  Stocks Management Console
                </h1>
                <p className="text-xs text-neutral-500 mt-1">
                  Item identification, batch expiry tracking, storage locations, stock metrics, valuation &amp; PO reorders.
                </p>
              </div>

              {/* Small Horizontal Side Bar on the Right Side */}
              <div className="flex items-center gap-2.5 sm:gap-3 self-start lg:self-auto flex-wrap">
                <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-xs p-1.5 sm:p-2 flex items-center gap-2 sm:gap-3">
                  
                  {/* Notification 1: Low Stock Counts & Notification */}
                  <button
                    type="button"
                    onClick={() => {
                      setStocksStatusFilter(stocksStatusFilter === 'LOW_STOCK' ? 'ALL' : 'LOW_STOCK');
                      setStocksPage(1);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      stocksStatusFilter === 'LOW_STOCK'
                        ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-300 text-amber-950 font-bold'
                        : 'bg-amber-50/70 hover:bg-amber-100 border-amber-200 text-amber-900'
                    }`}
                    title="Click to filter low stock items"
                  >
                    <span className="relative flex h-2 w-2">
                      {stocksMetrics.lowStockCount > 0 && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      )}
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-amber-600">warning</span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-black text-neutral-900 bg-white px-2 py-0.5 rounded-md border border-amber-200 shadow-2xs">
                        {stocksMetrics.lowStockCount}
                      </span>
                      <span className="font-bold text-[11px] whitespace-nowrap">
                        Low Stock Alert
                      </span>
                    </div>
                  </button>

                  {/* Subtle separator inside the horizontal bar */}
                  <div className="h-6 w-px bg-neutral-200"></div>

                  {/* Notification 2: Out of Stock Counts & Notification */}
                  <button
                    type="button"
                    onClick={() => {
                      setStocksStatusFilter(stocksStatusFilter === 'OUT_OF_STOCK' ? 'ALL' : 'OUT_OF_STOCK');
                      setStocksPage(1);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      stocksStatusFilter === 'OUT_OF_STOCK'
                        ? 'bg-rose-100 border-rose-400 ring-2 ring-rose-300 text-rose-950 font-bold'
                        : 'bg-rose-50/70 hover:bg-rose-100 border-rose-200 text-rose-900'
                    }`}
                    title="Click to filter out of stock items"
                  >
                    <span className="relative flex h-2 w-2">
                      {stocksMetrics.outOfStockCount > 0 && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      )}
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-rose-600">cancel</span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-black text-neutral-900 bg-white px-2 py-0.5 rounded-md border border-rose-200 shadow-2xs">
                        {stocksMetrics.outOfStockCount}
                      </span>
                      <span className="font-bold text-[11px] whitespace-nowrap">
                        Out of Stock
                      </span>
                    </div>
                  </button>

                  {/* Subtle separator inside the horizontal bar */}
                  <div className="h-6 w-px bg-neutral-200"></div>

                  {/* Notification 3: Expired Stocks Counts & Notification */}
                  <button
                    type="button"
                    onClick={() => {
                      setStocksShelfLifeFilter(stocksShelfLifeFilter === 'EXPIRED' ? 'ALL' : 'EXPIRED');
                      setStocksPage(1);
                    }}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      stocksShelfLifeFilter === 'EXPIRED'
                        ? 'bg-red-100 border-red-400 ring-2 ring-red-300 text-red-950 font-bold'
                        : 'bg-red-50/70 hover:bg-red-100 border-red-200 text-red-900'
                    }`}
                    title="Click to filter expired items"
                  >
                    <span className="relative flex h-2 w-2">
                      {stocksMetrics.expiredCount > 0 && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      )}
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                    </span>
                    <span className="material-symbols-outlined text-[18px] text-red-600">event_busy</span>
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="font-black text-neutral-900 bg-white px-2 py-0.5 rounded-md border border-red-200 shadow-2xs">
                        {stocksMetrics.expiredCount}
                      </span>
                      <span className="font-bold text-[11px] whitespace-nowrap">
                        Expired Stocks Alert
                      </span>
                    </div>
                  </button>

                </div>

                {/* Refresh Stocks Button */}
                <button
                  type="button"
                  onClick={fetchData}
                  title="Refresh stocks data"
                  className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-black text-white flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span>
                </button>
              </div>
            </div>

            {/* Filter and Search Bar for Stocks */}
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm p-4 sm:p-6 mb-6">
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                
                {/* Search SKU / Barcode ID / Name / Batch # / Shelf */}
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={stocksSearch}
                    onChange={(e) => {
                      setStocksSearch(e.target.value);
                      setStocksPage(1);
                    }}
                    placeholder="Search by SKU, Barcode ID, Product Name, Batch #, Shelf Location..."
                    className="w-full h-10 pl-9 pr-8 rounded-full bg-neutral-50 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black border border-neutral-200 transition-all shadow-inner"
                  />
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px] pointer-events-none">
                    search
                  </span>
                  {stocksSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setStocksSearch('');
                        setStocksPage(1);
                      }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black font-bold text-sm cursor-pointer"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Filter dropdowns */}
                <div className="flex flex-wrap items-center gap-2">
                  
                  {/* Tag Filter */}
                  <select
                    value={stocksTagFilter}
                    onChange={(e) => {
                      setStocksTagFilter(e.target.value);
                      setStocksPage(1);
                    }}
                    className="h-9 px-3 rounded-full bg-neutral-50 text-xs text-neutral-800 font-bold border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                  >
                    <option value="ALL">All Tags</option>
                    <option value="OTC">OTC Only</option>
                    <option value="Rx">Rx Prescription</option>
                    <option value="Cold Chain">Cold Chain Tagged</option>
                  </select>

                  {/* Stock Status Filter */}
                  <select
                    value={stocksStatusFilter}
                    onChange={(e) => {
                      setStocksStatusFilter(e.target.value);
                      setStocksPage(1);
                    }}
                    className="h-9 px-3 rounded-full bg-neutral-50 text-xs text-neutral-800 font-bold border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                  >
                    <option value="ALL">All Stock Statuses</option>
                    <option value="IN_STOCK">In Stock</option>
                    <option value="LOW_STOCK">Low Stock (≤ Reorder)</option>
                    <option value="OUT_OF_STOCK">Out of Stock</option>
                  </select>

                  {/* Shelf-Life Status Filter */}
                  <select
                    value={stocksShelfLifeFilter}
                    onChange={(e) => {
                      setStocksShelfLifeFilter(e.target.value);
                      setStocksPage(1);
                    }}
                    className="h-9 px-3 rounded-full bg-neutral-50 text-xs text-neutral-800 font-bold border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black cursor-pointer"
                  >
                    <option value="ALL">All Shelf-Life</option>
                    <option value="GOOD">Good (&gt; 60 days)</option>
                    <option value="NEAR_EXPIRY">Near Expiry (&le; 60 days)</option>
                    <option value="EXPIRED">Expired</option>
                  </select>

                </div>

              </div>

              {/* Category Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-neutral-100">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 mr-1">
                  Category:
                </span>
                {['ALL', 'Prescription Medicines', 'Daily Health & Wellness', 'Vitamins & Nutritional Supplements', 'First Aid & Wound Care', 'Home Health & Medical Care'].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setStocksCategory(cat);
                      setStocksPage(1);
                    }}
                    className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                      stocksCategory === cat
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

            </div>

            {/* Stocks Table */}
            <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden mb-8">
              
              <div className="px-6 py-3 bg-neutral-50/70 border-b border-neutral-200 flex items-center justify-between text-xs text-neutral-500">
                <span>
                  Showing <strong className="text-black">{paginatedStocks.length}</strong> of{' '}
                  <strong className="text-black">{filteredStocks.length}</strong> items in inventory
                </span>
                <span className="text-[11px] font-medium text-neutral-400">
                  Valuation Currency: <strong className="text-neutral-700">LKR (Rs.)</strong>
                </span>
              </div>

              {loading ? (
                <div className="p-16 text-center text-xs font-semibold text-neutral-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
                  Loading inventory and stock telemetry...
                </div>
              ) : filteredStocks.length === 0 ? (
                <div className="p-16 text-center space-y-3">
                  <span className="material-symbols-outlined text-[42px] text-neutral-300">inventory_2</span>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                    No items match the specified inventory filters.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-neutral-100/90 text-neutral-700 font-extrabold uppercase tracking-wider border-b border-neutral-200">
                      <tr>
                        <th className="py-3 px-4">Item Identification</th>
                        <th className="py-3 px-4">Batch &amp; Shelf-Life (DD/MM/YYYY)</th>
                        <th className="py-3 px-4">Stock Level Metrics</th>
                        <th className="py-3 px-4">Pricing &amp; Valuation</th>
                        <th className="py-3 px-4">Storage &amp; Location</th>
                        <th className="py-3 px-4 text-right">Operational Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {paginatedStocks.map((m) => {
                        const shelfLife = getShelfLifeStatus(m.expiryDate);
                        const stockStatus = getStockLevelStatus(m.stockQuantity, m.reorderLevel);
                        const cogsVal = Number(m.cogs) || (Number(m.unitPrice) * 0.45) || 0;
                        const lineValuation = (Number(m.stockQuantity) || 0) * cogsVal;
                        const isQuarantined = Boolean(m.isQuarantined);

                        return (
                          <tr
                            key={m.id}
                            className={`hover:bg-neutral-50/70 transition-colors ${
                              isQuarantined ? 'bg-red-50/30' : ''
                            }`}
                          >
                            {/* 1. Item Identification */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden flex-shrink-0 border border-neutral-200 flex items-center justify-center mt-0.5">
                                  {m.imageUrl ? (
                                    <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="material-symbols-outlined text-neutral-400 text-[18px]">medication</span>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-extrabold text-neutral-900 leading-tight">
                                      {m.name}
                                    </span>
                                    {isQuarantined && (
                                      <span className="px-1.5 py-0.2 rounded bg-red-600 text-white text-[9px] font-black uppercase tracking-wider animate-pulse">
                                        QUARANTINED
                                      </span>
                                    )}
                                  </div>
                                  
                                  {m.genericName && (
                                    <div className="text-[11px] text-neutral-500 truncate max-w-xs">
                                      {m.genericName}
                                    </div>
                                  )}

                                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    {/* SKU */}
                                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-700 border border-neutral-200">
                                      {m.sku || 'N/A'}
                                    </span>
                                    {/* Barcode ID */}
                                    <span className="font-mono text-[10px] text-neutral-500 flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[13px]">barcode_scanner</span>
                                      <span>{m.barcode || 'N/A'}</span>
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                    {/* Category */}
                                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-neutral-100 text-neutral-600">
                                      {m.category || 'General'}
                                    </span>

                                    {/* Tags: OTC vs Rx */}
                                    {m.requiresPrescription ? (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-amber-100 text-amber-900 border border-amber-300">
                                        Rx
                                      </span>
                                    ) : (
                                      <span className="px-1.5 py-0.5 rounded text-[9px] font-black bg-blue-100 text-blue-800 border border-blue-200">
                                        OTC
                                      </span>
                                    )}

                                    {/* Tags: Cold Chain */}
                                    {(m.isTemperatureSensitive || (m.tags || '').toLowerCase().includes('cold')) && (
                                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-cyan-100 text-cyan-900 border border-cyan-300">
                                        <span className="material-symbols-outlined text-[11px]">ac_unit</span>
                                        <span>Cold Chain</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 2. Batch & Shelf-Life (Expiry Tracking) */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex flex-col gap-1.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] font-bold text-neutral-400 uppercase">Lot:</span>
                                  <span className="font-mono text-xs font-bold text-neutral-800 bg-neutral-50 px-1.5 py-0.5 rounded border border-neutral-200">
                                    {m.batchNumber || 'LOT-UNASSIGNED'}
                                  </span>
                                </div>

                                <div className="text-[11px] text-neutral-600 flex flex-col gap-0.5">
                                  <span>
                                    <strong>Mfg:</strong> {formatDateDDMMYYYY(m.manufacturingDate)}
                                  </span>
                                  <span>
                                    <strong>Exp:</strong> {formatDateDDMMYYYY(m.expiryDate)}
                                  </span>
                                </div>

                                <div>
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] border ${shelfLife.badgeClass}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${shelfLife.dotClass}`}></span>
                                    <span>{shelfLife.label}</span>
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* 3. Stock Level Metrics */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex flex-col gap-1.5">
                                <div>
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] border ${stockStatus.badgeClass}`}
                                  >
                                    <span className={`w-1.5 h-1.5 rounded-full ${stockStatus.dotClass}`}></span>
                                    <span>{stockStatus.label}</span>
                                  </span>
                                </div>

                                <div className="text-[11px] text-neutral-700 space-y-0.5 font-medium">
                                  <div>
                                    Available: <strong className="text-black font-bold">{m.stockQuantity || 0}</strong>
                                  </div>
                                  <div>
                                    Allocated: <span className="text-indigo-700 font-bold">{m.allocatedStock || 0}</span>
                                  </div>
                                  <div>
                                    Reorder Level: <span className="text-amber-800 font-semibold">{m.reorderLevel || 25}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 4. Pricing & Valuation */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex flex-col gap-1 text-[11px]">
                                <div>
                                  <span className="text-neutral-400 font-medium">Unit Cost:</span>{' '}
                                  <strong className="text-neutral-800">{formatLKR(cogsVal)}</strong>
                                </div>
                                <div>
                                  <span className="text-neutral-400 font-medium">Selling Price:</span>{' '}
                                  <strong className="text-emerald-800 font-black">{formatLKR(m.unitPrice)}</strong>
                                </div>
                                <div className="pt-1 border-t border-neutral-100 text-[10px] text-neutral-500">
                                  <span>Valuation:</span>{' '}
                                  <strong className="text-black font-bold">{formatLKR(lineValuation)}</strong>
                                </div>
                              </div>
                            </td>

                            {/* 5. Storage & Location */}
                            <td className="py-3.5 px-4 align-top">
                              <div className="flex flex-col gap-1.5">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-100 border border-neutral-200 font-mono text-[11px] font-bold text-neutral-800 w-fit">
                                  <span className="material-symbols-outlined text-[14px] text-neutral-500">shelves</span>
                                  <span>{m.shelfLocation || 'Shelf A-01'}</span>
                                </div>

                                <div className="text-[10px] text-neutral-500 font-medium">
                                  {m.storageRequirement || (m.isTemperatureSensitive ? 'Cold Chain (2°C - 8°C)' : 'Room Temperature (15°C - 25°C)')}
                                </div>
                              </div>
                            </td>

                            {/* 6. Operational Actions */}
                            <td className="py-3.5 px-4 align-top text-right">
                              <div className="flex flex-col items-end gap-1.5">
                                
                                {/* Quick Adjust */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenQuickAdjust(m)}
                                  className="w-full max-w-[120px] px-2.5 py-1 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-[14px]">tune</span>
                                  <span>Quick Adjust</span>
                                </button>

                                {/* Quarantine / Mark as Expired */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleQuarantine(m)}
                                  className={`w-full max-w-[120px] px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs ${
                                    isQuarantined
                                      ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300'
                                      : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'
                                  }`}
                                  title={isQuarantined ? 'Release item from quarantine' : 'Quarantine item or mark as expired'}
                                >
                                  <span className="material-symbols-outlined text-[14px]">
                                    {isQuarantined ? 'verified' : 'gpp_bad'}
                                  </span>
                                  <span>{isQuarantined ? 'Release' : 'Quarantine'}</span>
                                </button>

                                {/* Reorder / Create PO */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenReorder(m)}
                                  className="w-full max-w-[120px] px-2.5 py-1 rounded-full bg-zinc-900 hover:bg-black text-white text-[11px] font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                                >
                                  <span className="material-symbols-outlined text-[14px]">receipt_long</span>
                                  <span>Reorder PO</span>
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

              {/* Stocks Pagination */}
              {totalStocksPages > 1 && (
                <div className="p-4 border-t border-neutral-100 flex items-center justify-between">
                  <button
                    type="button"
                    disabled={stocksPage === 1}
                    onClick={() => setStocksPage((p) => Math.max(1, p - 1))}
                    className="px-4 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-xs font-bold text-neutral-700 cursor-pointer"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-medium text-neutral-500">
                    Page {stocksPage} of {totalStocksPages}
                  </span>
                  <button
                    type="button"
                    disabled={stocksPage === totalStocksPages}
                    onClick={() => setStocksPage((p) => Math.min(totalStocksPages, p + 1))}
                    className="px-4 py-1.5 rounded-full bg-neutral-100 hover:bg-neutral-200 disabled:opacity-40 text-xs font-bold text-neutral-700 cursor-pointer"
                  >
                    Next
                  </button>
                </div>
              )}

            </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* MODAL 1: CATALOG PRODUCT ADD / EDIT MODAL                 */}
      {/* ========================================================= */}
      {showCatalogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-neutral-900 uppercase tracking-tight">
                  {catalogEditorMode === 'edit' ? 'Edit Catalog Product' : 'Add New Catalog Product'}
                </h3>
                <p className="text-xs text-neutral-500">Master pharmaceutical product attributes.</p>
              </div>
              <button
                type="button"
                onClick={() => setShowCatalogModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCatalog} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Product Name *
                </label>
                <input
                  required
                  type="text"
                  value={catalogForm.name}
                  onChange={(e) => setCatalogForm({ ...catalogForm, name: e.target.value })}
                  placeholder="e.g. Paracetamol 500mg Tablets"
                  className="w-full h-10 px-4 rounded-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Generic Formulation Name
                </label>
                <input
                  type="text"
                  value={catalogForm.genericName}
                  onChange={(e) => setCatalogForm({ ...catalogForm, genericName: e.target.value })}
                  placeholder="e.g. Acetaminophen BP"
                  className="w-full h-10 px-4 rounded-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    value={catalogForm.sku}
                    onChange={(e) => setCatalogForm({ ...catalogForm, sku: e.target.value })}
                    placeholder="e.g. SKU-PAI-500"
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 font-mono text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={catalogForm.category}
                    onChange={(e) => setCatalogForm({ ...catalogForm, category: e.target.value })}
                    placeholder="Category name..."
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                  Selling Price in LKR (Rs.) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">
                    LKR
                  </span>
                  <input
                    required
                    type="number"
                    step="0.01"
                    value={catalogForm.unitPrice}
                    onChange={(e) => setCatalogForm({ ...catalogForm, unitPrice: e.target.value })}
                    placeholder="120.00"
                    className="w-full h-10 pl-14 pr-4 rounded-full bg-neutral-50 text-neutral-900 font-bold border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catalogForm.requiresPrescription}
                    onChange={(e) => setCatalogForm({ ...catalogForm, requiresPrescription: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                </label>
                <span className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Requires Doctor's Prescription (Rx)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Image URL
                </label>
                <input
                  type="text"
                  value={catalogForm.imageUrl}
                  onChange={(e) => setCatalogForm({ ...catalogForm, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full h-10 px-4 rounded-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={catalogForm.description}
                  onChange={(e) => setCatalogForm({ ...catalogForm, description: e.target.value })}
                  placeholder="Formulation details, dosage, usage..."
                  className="w-full p-3 rounded-2xl bg-neutral-50 text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowCatalogModal(false)}
                  className="px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCatalog}
                  className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {savingCatalog ? 'Saving...' : catalogEditorMode === 'edit' ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: STOCKS QUICK ADJUST MODAL                        */}
      {/* ========================================================= */}
      {showQuickAdjustModal && quickAdjustItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl border border-neutral-200">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-600">tune</span>
                  <span>Quick Stock Adjust: {quickAdjustItem.name}</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Update on-hand stock, reorder levels, shelf placement, lot numbers, and expiry telemetry.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickAdjustModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickAdjust} className="p-6 space-y-4 text-xs">
              
              {/* Item Identification Readonly Box */}
              <div className="bg-neutral-50 p-3.5 rounded-2xl border border-neutral-200 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Product</span>
                  <span className="font-extrabold text-neutral-900 text-sm">{quickAdjustItem.name}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">SKU</span>
                  <span className="font-mono font-bold text-neutral-800">{quickAdjustItem.sku}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-neutral-400 block">Category</span>
                  <span className="font-semibold text-neutral-800">{quickAdjustItem.category}</span>
                </div>
              </div>

              {/* Stock Numbers */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    On-Hand Stock Units *
                  </label>
                  <input
                    required
                    type="number"
                    value={adjustForm.stockQuantity}
                    onChange={(e) => setAdjustForm({ ...adjustForm, stockQuantity: e.target.value })}
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 font-black text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Allocated Units
                  </label>
                  <input
                    type="number"
                    value={adjustForm.allocatedStock}
                    onChange={(e) => setAdjustForm({ ...adjustForm, allocatedStock: e.target.value })}
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 font-bold text-indigo-700 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Reorder Alert Level *
                  </label>
                  <input
                    required
                    type="number"
                    value={adjustForm.reorderLevel}
                    onChange={(e) => setAdjustForm({ ...adjustForm, reorderLevel: e.target.value })}
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 font-bold text-amber-800 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Batch & Barcode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Batch / Lot Number
                  </label>
                  <input
                    type="text"
                    value={adjustForm.batchNumber}
                    onChange={(e) => setAdjustForm({ ...adjustForm, batchNumber: e.target.value })}
                    placeholder="e.g. LOT-2026-X89"
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 font-mono text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Barcode ID
                  </label>
                  <input
                    type="text"
                    value={adjustForm.barcode}
                    onChange={(e) => setAdjustForm({ ...adjustForm, barcode: e.target.value })}
                    placeholder="e.g. BC-984729103"
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 font-mono text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Manufacturing & Expiry Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Manufacture Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={adjustForm.manufacturingDate}
                    onChange={(e) => setAdjustForm({ ...adjustForm, manufacturingDate: e.target.value })}
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Expiry Date (YYYY-MM-DD)
                  </label>
                  <input
                    type="date"
                    value={adjustForm.expiryDate}
                    onChange={(e) => setAdjustForm({ ...adjustForm, expiryDate: e.target.value })}
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Storage & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Shelf Location (ID / Number)
                  </label>
                  <input
                    type="text"
                    value={adjustForm.shelfLocation}
                    onChange={(e) => setAdjustForm({ ...adjustForm, shelfLocation: e.target.value })}
                    placeholder="e.g. Shelf A-03"
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 font-mono text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Storage Requirement
                  </label>
                  <input
                    type="text"
                    value={adjustForm.storageRequirement}
                    onChange={(e) => setAdjustForm({ ...adjustForm, storageRequirement: e.target.value })}
                    placeholder="e.g. Cold Chain (2°C - 8°C)"
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              {/* Costs & Valuation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Unit Cost (COGS) in LKR
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjustForm.cogs}
                    onChange={(e) => setAdjustForm({ ...adjustForm, cogs: e.target.value })}
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 font-bold text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Selling Price in LKR
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={adjustForm.unitPrice}
                    onChange={(e) => setAdjustForm({ ...adjustForm, unitPrice: e.target.value })}
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 font-bold text-emerald-800 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowQuickAdjustModal(false)}
                  className="px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAdjust}
                  className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[16px]">check</span>
                  <span>{savingAdjust ? 'Updating Stock...' : 'Save Stock Adjustments'}</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: REORDER / CREATE PURCHASE ORDER (PO)             */}
      {/* Dispatches alert to Delivery Coordinator                  */}
      {/* ========================================================= */}
      {showReorderModal && reorderItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-neutral-200">
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-neutral-900 uppercase tracking-tight flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-600">receipt_long</span>
                  <span>Create Stock Purchase Order</span>
                </h3>
                <p className="text-xs text-neutral-500">
                  Generate PO and alert Delivery Coordinator for immediate dispatch.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReorderModal(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-700 flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            {poSuccessResult ? (
              <div className="p-6 space-y-4 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto text-2xl font-bold">
                  ✓
                </div>
                <h4 className="text-base font-extrabold text-neutral-900">
                  Purchase Order Generated Successfully!
                </h4>
                <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-200 text-left space-y-1.5 text-xs">
                  <div>
                    <span className="text-neutral-500">PO Number:</span>{' '}
                    <strong className="font-mono text-neutral-900 text-sm">{poSuccessResult.poNumber}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Medicine:</span>{' '}
                    <strong>{poSuccessResult.medicineName}</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Reorder Quantity:</span>{' '}
                    <strong>{poSuccessResult.reorderQuantity} units</strong>
                  </div>
                  <div>
                    <span className="text-neutral-500">Delivery Coordinators Alerted:</span>{' '}
                    <span className="text-emerald-700 font-bold">{poSuccessResult.coordinatorsNotified} Coordinator(s)</span>
                  </div>
                  <div>
                    <span className="text-neutral-500">Shelf Placement:</span>{' '}
                    <strong>{poSuccessResult.shelfLocation}</strong>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowReorderModal(false)}
                  className="w-full py-2.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreatePurchaseOrder} className="p-6 space-y-4 text-xs">
                
                <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-neutral-900">{reorderItem.name}</span>
                    <span className="font-mono font-bold text-neutral-700">{reorderItem.sku}</span>
                  </div>
                  <div className="text-[11px] text-amber-900 flex items-center gap-4">
                    <span>On-Hand: <strong>{reorderItem.stockQuantity || 0}</strong></span>
                    <span>Reorder Level: <strong>{reorderItem.reorderLevel || 25}</strong></span>
                    <span>Shelf: <strong>{reorderItem.shelfLocation || 'Shelf A-01'}</strong></span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Reorder Quantity (Units) *
                  </label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={poForm.quantity}
                    onChange={(e) => setPoForm({ ...poForm, quantity: e.target.value })}
                    className="w-full h-10 px-4 rounded-full bg-neutral-50 font-black text-neutral-900 text-sm border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black"
                  />
                  <span className="text-[10px] text-neutral-400 mt-1 block">
                    Recommended replenishment based on safe stock buffers.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                    Supplier &amp; Coordinator Dispatch Notes
                  </label>
                  <textarea
                    rows={3}
                    value={poForm.notes}
                    onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                    placeholder="Provide batch requirements, urgency, cold storage handling..."
                    className="w-full p-3 rounded-2xl bg-neutral-50 text-neutral-900 border border-neutral-200 focus:outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div>

                <div className="p-3 bg-neutral-50 rounded-2xl border border-neutral-200 flex items-center gap-2.5 text-[11px] text-neutral-600">
                  <span className="material-symbols-outlined text-blue-600 text-[18px]">notifications_active</span>
                  <span>
                    Submitting this PO automatically alerts the <strong>Delivery Coordinator</strong> queue to coordinate arrival and inventory check-in.
                  </span>
                </div>

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setShowReorderModal(false)}
                    className="px-5 py-2.5 rounded-full border border-neutral-300 text-neutral-700 text-xs font-bold uppercase tracking-wider hover:bg-neutral-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingPo}
                    className="px-6 py-2.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-[16px]">send</span>
                    <span>{submittingPo ? 'Generating PO...' : 'Generate PO & Alert Coordinator'}</span>
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default OperationsCatalogDashboard;
