import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const CATEGORIES = [
  'All Items',
  'Dietary & Vits',
  'Prescription Rx',
  'Dermatology',
  'Mental Wellness',
  'Cardiovascular',
];

const OperationsCatalogDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Data states
  const [medicines, setMedicines] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Items');
  const [sortBy, setSortBy] = useState('Highest Stock');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Editor State
  const [editorForm, setEditorForm] = useState({
    name: '',
    genericName: '',
    unitPrice: '',
    msrp: '',
    cogs: '',
    stockQuantity: '',
    category: '',
    description: '',
    imageUrl: '',
    claims: ['Immune Modulation', 'Gastric-Safe Buffered', 'Non-GMO Certified'],
  });
  const [newClaimText, setNewClaimText] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [notification, setNotification] = useState(null);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    name: '',
    genericName: '',
    sku: '',
    category: 'Dietary & Vits',
    unitPrice: '',
    msrp: '',
    cogs: '',
    stockQuantity: 100,
    requiresPrescription: false,
    isTemperatureSensitive: false,
    description: '',
    imageUrl: '',
  });

  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchPercent, setBatchPercent] = useState('5');
  const [batchCategory, setBatchCategory] = useState('All');

  // Fetch medicines and stats
  const fetchData = async () => {
    try {
      setLoading(true);
      const [medsRes, statsRes] = await Promise.all([
        client.get('/api/v1/medicines'),
        client.get('/api/v1/medicines/stats'),
      ]);
      setMedicines(medsRes.data || []);
      setStats(statsRes.data || null);

      if (medsRes.data && medsRes.data.length > 0) {
        // Select first or retain existing selection
        if (!selectedProduct) {
          selectProduct(medsRes.data[0]);
        } else {
          const match = medsRes.data.find((m) => m.id === selectedProduct.id);
          selectProduct(match || medsRes.data[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load catalog data:', err);
      showToast('Error loading catalog data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const selectProduct = (prod) => {
    setSelectedProduct(prod);
    setEditorForm({
      name: prod.name || '',
      genericName: prod.genericName || '',
      unitPrice: prod.unitPrice != null ? prod.unitPrice.toString() : '0.00',
      msrp: prod.msrp != null ? prod.msrp.toString() : '0.00',
      cogs: prod.cogs != null ? prod.cogs.toString() : '0.00',
      stockQuantity: prod.stockQuantity != null ? prod.stockQuantity.toString() : '0',
      category: prod.category || 'General',
      description: prod.description || '',
      imageUrl: prod.imageUrl || '',
      claims: ['Immune Modulation', 'Gastric-Safe Buffered', 'Non-GMO Certified'],
    });
  };

  const showToast = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Filtered & Sorted Medicines
  const filteredMedicines = useMemo(() => {
    let result = [...medicines];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          (m.name && m.name.toLowerCase().includes(q)) ||
          (m.genericName && m.genericName.toLowerCase().includes(q)) ||
          (m.sku && m.sku.toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'All Items') {
      result = result.filter(
        (m) => m.category && m.category.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    if (sortBy === 'Highest Stock') {
      result.sort((a, b) => (b.stockQuantity || 0) - (a.stockQuantity || 0));
    } else if (sortBy === 'Price: Low to High') {
      result.sort((a, b) => (Number(a.unitPrice) || 0) - (Number(b.unitPrice) || 0));
    } else if (sortBy === 'Price: High to Low') {
      result.sort((a, b) => (Number(b.unitPrice) || 0) - (Number(a.unitPrice) || 0));
    } else if (sortBy === 'Top Rated') {
      result.sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }

    return result;
  }, [medicines, searchQuery, selectedCategory, sortBy]);

  // Paginated list
  const totalPages = Math.ceil(filteredMedicines.length / itemsPerPage) || 1;
  const paginatedMedicines = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredMedicines.slice(start, start + itemsPerPage);
  }, [filteredMedicines, currentPage]);

  // Save selected product updates
  const handleSaveProduct = async () => {
    if (!selectedProduct) return;
    setSavingProduct(true);
    try {
      const payload = {
        name: editorForm.name,
        genericName: editorForm.genericName,
        unitPrice: parseFloat(editorForm.unitPrice) || 0,
        msrp: parseFloat(editorForm.msrp) || 0,
        cogs: parseFloat(editorForm.cogs) || 0,
        stockQuantity: parseInt(editorForm.stockQuantity, 10) || 0,
        category: editorForm.category,
        description: editorForm.description,
        imageUrl: editorForm.imageUrl,
      };

      const res = await client.put(`/api/v1/medicines/${selectedProduct.id}`, payload);
      showToast(`Updated "${res.data.name}" successfully!`);
      await fetchData();
    } catch (err) {
      console.error('Update product error:', err);
      showToast(err.response?.data?.message || 'Failed to update product', 'error');
    } finally {
      setSavingProduct(false);
    }
  };

  // Delete / Archive Product
  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove "${name}" from the active product catalog?`)) {
      return;
    }
    try {
      await client.delete(`/api/v1/medicines/${id}`);
      showToast(`Product "${name}" deleted successfully.`);
      await fetchData();
    } catch (err) {
      console.error('Delete product error:', err);
      showToast(err.response?.data?.message || 'Failed to delete product', 'error');
    }
  };

  // Handle Add Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newProductForm,
        unitPrice: parseFloat(newProductForm.unitPrice) || 0,
        msrp: parseFloat(newProductForm.msrp) || 0,
        cogs: parseFloat(newProductForm.cogs) || 0,
        stockQuantity: parseInt(newProductForm.stockQuantity, 10) || 0,
      };
      const res = await client.post('/api/v1/medicines', payload);
      showToast(`New product "${res.data.name}" added to catalog!`);
      setShowAddModal(false);
      setNewProductForm({
        name: '',
        genericName: '',
        sku: '',
        category: 'Dietary & Vits',
        unitPrice: '',
        msrp: '',
        cogs: '',
        stockQuantity: 100,
        requiresPrescription: false,
        isTemperatureSensitive: false,
        description: '',
        imageUrl: '',
      });
      await fetchData();
    } catch (err) {
      console.error('Create product error:', err);
      showToast(err.response?.data?.message || 'Failed to create product', 'error');
    }
  };

  // Handle Batch Price Update
  const handleBatchUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await client.post(
        `/api/v1/medicines/batch-price-update?percentageChange=${batchPercent}${
          batchCategory !== 'All' ? `&category=${batchCategory}` : ''
        }`
      );
      showToast(res.data.message || 'Batch price update applied!');
      setShowBatchModal(false);
      await fetchData();
    } catch (err) {
      console.error('Batch price update error:', err);
      showToast(err.response?.data?.message || 'Failed to update prices', 'error');
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    if (filteredMedicines.length === 0) {
      showToast('No products to export', 'error');
      return;
    }
    const headers = ['ID', 'Name', 'Generic Name', 'SKU', 'Category', 'Unit Price', 'MSRP', 'Stock Quantity'];
    const rows = filteredMedicines.map((m) => [
      m.id,
      `"${(m.name || '').replace(/"/g, '""')}"`,
      `"${(m.genericName || '').replace(/"/g, '""')}"`,
      `"${m.sku || ''}"`,
      `"${m.category || ''}"`,
      m.unitPrice || '0.00',
      m.msrp || '0.00',
      m.stockQuantity || 0,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `pills_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported CSV file successfully!');
  };

  // Profit Margin calculation
  const computedMargin = useMemo(() => {
    const price = parseFloat(editorForm.unitPrice) || 0;
    const cogs = parseFloat(editorForm.cogs) || 0;
    if (price <= 0) return '0.0';
    const margin = ((price - cogs) / price) * 100;
    return margin.toFixed(1);
  }, [editorForm.unitPrice, editorForm.cogs]);

  const discountPercent = useMemo(() => {
    const price = parseFloat(editorForm.unitPrice) || 0;
    const msrp = parseFloat(editorForm.msrp) || 0;
    if (msrp <= price || msrp <= 0) return '0.0';
    return (((msrp - price) / msrp) * 100).toFixed(1);
  }, [editorForm.unitPrice, editorForm.msrp]);

  return (
    <div className="min-h-screen bg-[#f9f9ff] text-[#141b2b] flex font-sans antialiased">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold transition-all ${
            notification.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-black text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {notification.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{notification.message}</span>
        </div>
      )}

      {/* --- SIDEBAR --- */}
      <aside className="fixed left-0 top-0 h-full w-72 bg-[#f1f3ff] z-50 flex flex-col justify-between py-6 px-4 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-3 px-3">
            <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center text-white font-bold text-lg">
              P
            </div>
            <div className="flex flex-col">
              <span className="text-[15px] font-bold text-black leading-tight">PILLS Operations</span>
              <span className="text-[11px] text-gray-500 uppercase tracking-wider font-semibold">
                Operations Manager
              </span>
            </div>
          </div>

          <div className="px-3">
            <div className="bg-white rounded-full px-4 py-2 flex items-center gap-2 border border-gray-200 shadow-sm">
              <span className="material-symbols-outlined text-gray-500 text-[18px]">verified_user</span>
              <span className="text-[11px] text-gray-700 font-bold">Ops ID #OPS-4920</span>
            </div>
          </div>

          <nav className="flex flex-col gap-1.5 pt-2">
            <Link
              to="/admin/catalog"
              className="flex items-center gap-3 px-4 py-3 bg-black text-white rounded-full font-bold text-xs tracking-wide shadow-sm"
            >
              <span className="material-symbols-outlined text-[20px]">medication</span>
              <span>Catalog Management</span>
            </Link>

            <Link
              to="/modules/prescription"
              className="flex items-center gap-3 px-4 py-3 rounded-full text-gray-600 hover:bg-[#e1e8fd] hover:text-black font-semibold text-xs tracking-wide transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">prescriptions</span>
              <span>Prescription Queue</span>
            </Link>

            <Link
              to="/modules/delivery"
              className="flex items-center gap-3 px-4 py-3 rounded-full text-gray-600 hover:bg-[#e1e8fd] hover:text-black font-semibold text-xs tracking-wide transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">local_shipping</span>
              <span>Delivery &amp; Logistics</span>
            </Link>

            <Link
              to="/modules/inventory"
              className="flex items-center gap-3 px-4 py-3 rounded-full text-gray-600 hover:bg-[#e1e8fd] hover:text-black font-semibold text-xs tracking-wide transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">inventory_2</span>
              <span>Cold-Chain &amp; Batches</span>
            </Link>

            <Link
              to="/"
              className="flex items-center gap-3 px-4 py-3 rounded-full text-gray-600 hover:bg-[#e1e8fd] hover:text-black font-semibold text-xs tracking-wide transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">storefront</span>
              <span>Customer Storefront</span>
            </Link>
          </nav>
        </div>

        <div className="flex flex-col gap-3 px-2">
          <div className="bg-[#e9edff] rounded-2xl p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs text-black font-bold uppercase tracking-wider">Dispensing Active</span>
            </div>
            <p className="text-[11px] text-gray-600">
              Operations manager console • Real-time database sync active
            </p>
          </div>

          <div className="flex items-center justify-between px-2 pt-1 border-t border-gray-200">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-black">{user?.fullName || 'Operations Manager'}</span>
              <span className="text-[10px] text-gray-500 uppercase font-bold">{user?.role}</span>
            </div>
            <button
              onClick={() => {
                logout();
                navigate('/login/admin');
              }}
              title="Sign Out"
              className="w-8 h-8 rounded-full bg-white hover:bg-red-50 text-gray-600 hover:text-red-600 flex items-center justify-center transition-colors shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* --- MAIN CONTENT WORKSPACE --- */}
      <div className="pl-72 w-full flex flex-col min-h-screen">
        {/* Header */}
        <header className="fixed top-0 left-72 right-0 h-16 bg-[#f9f9ff]/85 backdrop-blur-xl border-b border-gray-200 z-40 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
            <span>Pharmacy Operations</span>
            <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            <span className="text-black">Product Catalog Management</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold">
              <span className="material-symbols-outlined text-[14px]">shield</span>
              <span>Operations Manager Access</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center font-bold text-xs">
                {user?.fullName?.charAt(0) || 'O'}
              </div>
            </div>
          </div>
        </header>

        {/* Main Body */}
        <main className="w-full pt-20 px-8 pb-16">
          {/* Top Banner & Global Action Buttons */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 pt-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-[#c4e7ff] text-[#004d6a] text-[11px] uppercase tracking-wider font-bold">
                  Inventory Sync Active
                </span>
                <span className="text-gray-500 text-xs flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Live Cloud POS Sync
                </span>
              </div>
              <h1 className="text-3xl font-extrabold text-[#141b2b] tracking-tight">
                Catalog Management &amp; Product Inventory
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 max-w-2xl mt-1">
                Real-time SKU oversight, price adjustments, stock threshold maintenance, and customer sentiment monitoring.
              </p>
            </div>

            {/* Global Catalog Action Buttons */}
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleExportCSV}
                className="h-11 px-4 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-[0.99] transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">file_download</span>
                <span>Export CSV</span>
              </button>
              <button
                onClick={() => setShowBatchModal(true)}
                className="h-11 px-4 rounded-full bg-white text-black font-bold text-xs uppercase tracking-wider flex items-center gap-2 border border-gray-200 shadow-sm hover:bg-gray-50 active:scale-[0.99] transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">price_change</span>
                <span>Batch Price Update</span>
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="h-11 px-5 rounded-full bg-black text-white font-bold text-xs uppercase tracking-wider flex items-center gap-2 shadow-md hover:bg-zinc-800 active:scale-[0.99] transition-all"
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">add</span>
                <span>Add New Product</span>
              </button>
            </div>
          </div>

          {/* Key Metrics Row (4 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* Stat 1 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">
                  Total Active SKUs
                </span>
                <div className="w-9 h-9 rounded-full bg-[#f1f3ff] flex items-center justify-center text-black">
                  <span className="material-symbols-outlined text-[20px]">inventory_2</span>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#141b2b]">
                  {stats?.totalActiveSkus || medicines.length}
                </span>
                <span className="text-xs text-emerald-600 font-bold flex items-center">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span> Active
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stats?.shelfFulfillmentRate || '98.2%'} shelf fulfillment rate
              </p>
            </div>

            {/* Stat 2 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">
                  Low Stock Alerts
                </span>
                <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-red-600">
                  {stats?.lowStockCount ?? medicines.filter((m) => (m.stockQuantity || 0) <= 15).length}
                </span>
                <span className="text-xs text-red-600 font-bold">Requires PO</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Threshold: ≤ 15 units remaining</p>
            </div>

            {/* Stat 3 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">
                  Avg Selling Price
                </span>
                <div className="w-9 h-9 rounded-full bg-[#f1f3ff] flex items-center justify-center text-black">
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#141b2b]">
                  ${Number(stats?.avgSellingPrice || 28.5).toFixed(2)}
                </span>
                <span className="text-xs text-emerald-600 font-bold flex items-center">
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span> Healthy
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Blended clinical gross margin: 47%</p>
            </div>

            {/* Stat 4 */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-gray-500 uppercase tracking-wider font-bold">
                  Pending Reviews
                </span>
                <div className="w-9 h-9 rounded-full bg-[#c4e7ff] text-[#004d6a] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px]">rate_review</span>
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#141b2b]">
                  {stats?.pendingReviewsCount || 12}
                </span>
                <span className="text-xs text-blue-600 font-bold">Queue waiting</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">Customer verified testimonials</p>
            </div>
          </div>

          {/* Main Asymmetric Workspace Layout */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
            {/* LEFT COLUMN: Product Catalog Explorer (7 cols) */}
            <section className="xl:col-span-7 flex flex-col gap-5">
              {/* Filter & Search Panel */}
              <div className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="relative w-full">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                      search
                    </span>
                    <input
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="w-full h-11 pl-11 pr-4 rounded-full bg-[#f1f3ff] text-xs text-black placeholder:text-gray-400 focus:outline-none focus:bg-white border border-transparent focus:border-black transition-all"
                      placeholder="Search by SKU, active ingredient, brand or drug name..."
                      type="text"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  {/* Category Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(cat);
                          setCurrentPage(1);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                          selectedCategory === cat
                            ? 'bg-black text-white'
                            : 'bg-[#f1f3ff] text-gray-600 hover:text-black'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2 text-gray-600 text-xs font-bold">
                    <span>Sort:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="bg-[#f1f3ff] rounded-full px-3 py-1 text-xs text-black font-semibold focus:outline-none cursor-pointer border border-transparent focus:border-black"
                    >
                      <option>Highest Stock</option>
                      <option>Price: Low to High</option>
                      <option>Price: High to Low</option>
                      <option>Top Rated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Catalog List / Table Card */}
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                {/* Column Headers */}
                <div className="grid grid-cols-12 px-6 py-3.5 bg-[#f1f3ff] text-gray-500 text-[11px] uppercase tracking-wider font-bold">
                  <div className="col-span-6">Product Details &amp; SKU</div>
                  <div className="col-span-2 text-right">Price / MSRP</div>
                  <div className="col-span-2 text-center">Stock Level</div>
                  <div className="col-span-2 text-right">Action</div>
                </div>

                {/* Table Rows */}
                {loading ? (
                  <div className="p-12 text-center text-xs text-gray-400">Loading catalog items...</div>
                ) : paginatedMedicines.length === 0 ? (
                  <div className="p-12 text-center text-xs text-gray-400">
                    No products found matching your search criteria.
                  </div>
                ) : (
                  paginatedMedicines.map((m) => {
                    const isSelected = selectedProduct?.id === m.id;
                    const isLowStock = (m.stockQuantity || 0) <= 15;
                    return (
                      <div
                        key={m.id}
                        onClick={() => selectProduct(m)}
                        className={`grid grid-cols-12 px-6 py-4 items-center transition-colors cursor-pointer border-b border-gray-50 ${
                          isSelected
                            ? 'bg-[#c4e7ff]/30 hover:bg-[#c4e7ff]/40'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="col-span-6 flex items-center gap-3.5 min-w-0 pr-2">
                          <div className="w-12 h-12 rounded-2xl bg-[#e9edff] overflow-hidden flex-shrink-0 relative border border-gray-100">
                            {m.imageUrl ? (
                              <img
                                className="w-full h-full object-cover"
                                alt={m.name}
                                src={m.imageUrl}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <span className="material-symbols-outlined text-[20px]">medication</span>
                              </div>
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-black truncate">{m.name}</span>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                              <span className="font-mono">{m.sku}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                              <span className="text-blue-700 font-semibold">{m.category || 'General'}</span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1 text-gray-500 text-[11px]">
                              <span
                                className="material-symbols-outlined text-amber-500 text-[14px]"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                star
                              </span>
                              <span className="font-bold text-black">{Number(m.rating || 4.8).toFixed(1)}</span>
                              <span>({m.reviewsCount || 40} reviews)</span>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-2 text-right">
                          <div className="text-sm font-extrabold text-black">
                            ${Number(m.unitPrice || 0).toFixed(2)}
                          </div>
                          {m.msrp && (
                            <div className="text-[11px] text-gray-400 line-through">
                              ${Number(m.msrp).toFixed(2)}
                            </div>
                          )}
                        </div>

                        <div className="col-span-2 flex flex-col items-center">
                          {isLowStock ? (
                            <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-bold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                              <span>{m.stockQuantity || 0} left</span>
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                              {m.stockQuantity || 0} in stock
                            </span>
                          )}
                          <span className="text-gray-400 text-[10px] mt-0.5">
                            {isLowStock ? 'Critically Low' : 'Batch Active'}
                          </span>
                        </div>

                        <div className="col-span-2 flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectProduct(m);
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isSelected ? 'bg-black text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title="Edit Product"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteProduct(m.id, m.name);
                            }}
                            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 flex items-center justify-center transition-colors"
                            title="Archive / Delete"
                            type="button"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-2 pt-1 text-xs text-gray-500">
                <span>
                  Showing <strong className="text-black">{paginatedMedicines.length}</strong> of{' '}
                  <strong className="text-black">{filteredMedicines.length}</strong> active products
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="w-8 h-8 rounded-full bg-white text-gray-700 flex items-center justify-center hover:bg-gray-100 border border-gray-200 disabled:opacity-40 shadow-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_left</span>
                  </button>
                  <span className="px-3 py-1 font-bold text-xs text-black">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="w-8 h-8 rounded-full bg-white text-gray-700 flex items-center justify-center hover:bg-gray-100 border border-gray-200 disabled:opacity-40 shadow-sm"
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </button>
                </div>
              </div>
            </section>

            {/* RIGHT COLUMN: Active Product Editor (5 cols) */}
            <section className="xl:col-span-5 flex flex-col gap-6">
              {selectedProduct ? (
                <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-gray-100 flex flex-col gap-6">
                  {/* Editor Header */}
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-[11px] uppercase tracking-wider text-blue-700 font-bold">
                          Active Product Editor
                        </span>
                      </div>
                      <h2 className="text-lg font-black text-black mt-1">{editorForm.name || 'Untitled Product'}</h2>
                      <span className="text-xs text-gray-500 font-mono">
                        {selectedProduct.sku} • {editorForm.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteProduct(selectedProduct.id, selectedProduct.name)}
                        className="h-9 px-3.5 rounded-full bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-600 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors"
                        title="Archive Product"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        <span>Delete</span>
                      </button>
                      <button
                        onClick={handleSaveProduct}
                        disabled={savingProduct}
                        className="h-9 px-4 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md hover:bg-zinc-800 disabled:opacity-50 transition-all"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        <span>{savingProduct ? 'Saving...' : 'Save'}</span>
                      </button>
                    </div>
                  </div>

                  {/* 1. Pricing Architecture Section */}
                  <div className="bg-[#f1f3ff] rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-gray-500 font-bold uppercase tracking-wider">
                        Pricing Architecture
                      </span>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">trending_up</span>
                        <span>Profit Margin: {computedMargin}%</span>
                      </span>
                    </div>

                    {/* Big Price Display */}
                    <div className="flex items-baseline gap-3">
                      <span className="text-4xl font-black text-black tracking-tight leading-none">
                        ${Number(editorForm.unitPrice || 0).toFixed(2)}
                      </span>
                      <div className="flex flex-col">
                        <span className="text-xs text-gray-400 line-through font-medium">
                          MSRP ${Number(editorForm.msrp || 0).toFixed(2)}
                        </span>
                        <span className="text-xs text-emerald-700 font-bold">
                          {discountPercent}% Patient Discount
                        </span>
                      </div>
                    </div>

                    {/* Editable Price Matrix */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-gray-500 font-bold uppercase">Base Price ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editorForm.unitPrice}
                          onChange={(e) => setEditorForm({ ...editorForm, unitPrice: e.target.value })}
                          className="w-full h-10 px-3 rounded-full bg-white text-black font-bold text-xs focus:outline-none border border-gray-200 focus:border-black"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-gray-500 font-bold uppercase">Compare MSRP ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editorForm.msrp}
                          onChange={(e) => setEditorForm({ ...editorForm, msrp: e.target.value })}
                          className="w-full h-10 px-3 rounded-full bg-white text-black font-bold text-xs focus:outline-none border border-gray-200 focus:border-black"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-gray-500 font-bold uppercase">COGS / Unit ($)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={editorForm.cogs}
                          onChange={(e) => setEditorForm({ ...editorForm, cogs: e.target.value })}
                          className="w-full h-10 px-3 rounded-full bg-white text-black font-bold text-xs focus:outline-none border border-gray-200 focus:border-black"
                        />
                      </div>
                    </div>

                    {/* Stock level update */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-gray-500 font-bold uppercase">Inventory Stock Units</label>
                        <input
                          type="number"
                          value={editorForm.stockQuantity}
                          onChange={(e) => setEditorForm({ ...editorForm, stockQuantity: e.target.value })}
                          className="w-full h-10 px-3 rounded-full bg-white text-black font-bold text-xs focus:outline-none border border-gray-200 focus:border-black"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] text-gray-500 font-bold uppercase">Category</label>
                        <select
                          value={editorForm.category}
                          onChange={(e) => setEditorForm({ ...editorForm, category: e.target.value })}
                          className="w-full h-10 px-3 rounded-full bg-white text-black font-bold text-xs focus:outline-none border border-gray-200 focus:border-black"
                        >
                          {CATEGORIES.filter((c) => c !== 'All Items').map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* 2. Visual Asset Management */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black uppercase tracking-wider">
                        Product Visual Asset
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium">Cloud Hosted Imagery</span>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-[11px] text-gray-500 font-bold uppercase">Image URL</label>
                      <input
                        type="text"
                        value={editorForm.imageUrl}
                        onChange={(e) => setEditorForm({ ...editorForm, imageUrl: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="w-full h-10 px-4 rounded-full bg-[#f1f3ff] text-xs text-black focus:outline-none border border-transparent focus:border-black"
                      />
                    </div>

                    {editorForm.imageUrl && (
                      <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#f1f3ff] border border-gray-200">
                        <img
                          src={editorForm.imageUrl}
                          alt="Product Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>

                  {/* 3. Clinical Specifications & Description */}
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-black uppercase tracking-wider">
                        Clinical Copy &amp; Specifications
                      </span>
                      <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>Clinical Compliance Validated</span>
                      </span>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-gray-500 font-bold uppercase">
                        Product Title (Public Display)
                      </label>
                      <input
                        type="text"
                        value={editorForm.name}
                        onChange={(e) => setEditorForm({ ...editorForm, name: e.target.value })}
                        className="w-full h-10 px-4 rounded-full bg-[#f1f3ff] text-xs text-black font-semibold focus:outline-none border border-transparent focus:border-black"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-gray-500 font-bold uppercase">
                        Generic Formulation Name
                      </label>
                      <input
                        type="text"
                        value={editorForm.genericName}
                        onChange={(e) => setEditorForm({ ...editorForm, genericName: e.target.value })}
                        className="w-full h-10 px-4 rounded-full bg-[#f1f3ff] text-xs text-black font-semibold focus:outline-none border border-transparent focus:border-black"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-[11px] text-gray-500 font-bold uppercase">
                        Clinical Dosage &amp; Description
                      </label>
                      <textarea
                        rows={3}
                        value={editorForm.description}
                        onChange={(e) => setEditorForm({ ...editorForm, description: e.target.value })}
                        className="w-full p-3 rounded-2xl bg-[#f1f3ff] text-xs text-black leading-relaxed focus:outline-none border border-transparent focus:border-black resize-none"
                      />
                    </div>

                    {/* Claims Tags */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-gray-500 font-bold uppercase">
                        Clinical Benefit Claims &amp; Tags
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {editorForm.claims.map((claim, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 rounded-full bg-[#f1f3ff] text-black text-xs font-semibold flex items-center gap-1.5"
                          >
                            <span>{claim}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setEditorForm({
                                  ...editorForm,
                                  claims: editorForm.claims.filter((_, i) => i !== idx),
                                });
                              }}
                              className="text-gray-400 hover:text-red-600"
                            >
                              <span className="material-symbols-outlined text-[14px]">close</span>
                            </button>
                          </span>
                        ))}

                        <div className="inline-flex items-center gap-1">
                          <input
                            type="text"
                            placeholder="+ Add Claim"
                            value={newClaimText}
                            onChange={(e) => setNewClaimText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && newClaimText.trim()) {
                                e.preventDefault();
                                setEditorForm({
                                  ...editorForm,
                                  claims: [...editorForm.claims, newClaimText.trim()],
                                });
                                setNewClaimText('');
                              }
                            }}
                            className="h-7 px-3 rounded-full bg-[#e9edff] text-xs text-black placeholder:text-gray-500 focus:outline-none w-28"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 4. Customer Reviews Moderation Component */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-700 text-[18px]">forum</span>
                        <span className="text-xs font-bold text-black uppercase tracking-wider">
                          Verified Patient Review Feed
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-[#c4e7ff] text-[#004d6a] text-[10px] font-bold">
                        {selectedProduct.reviewsCount || 48} Reviews
                      </span>
                    </div>

                    <div className="rounded-2xl p-4 bg-[#f1f3ff] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center text-[10px] font-bold">
                            RN
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-black">Elena Morales, RN</span>
                            <span className="text-[10px] text-emerald-700 font-bold">
                              Verified Healthcare Clinician
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] text-gray-400">2 days ago</span>
                      </div>
                      <p className="text-xs text-gray-700 italic">
                        "Consistently high clinical grade. Bioflavonoid buffer eliminates gastric irritation during long nursing shift cycles."
                      </p>
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => showToast('Review approved and syndicated to catalog!')}
                          className="px-3 py-1 rounded-full bg-black text-white text-[10px] font-bold uppercase tracking-wider hover:bg-zinc-800 transition-colors"
                        >
                          Approve Review
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl p-12 text-center text-gray-400 text-xs shadow-sm border border-gray-100">
                  Select a product from the catalog table to inspect and edit details.
                </div>
              )}
            </section>
          </div>
        </main>
      </div>

      {/* --- ADD PRODUCT MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                </div>
                <h3 className="text-lg font-black text-black uppercase tracking-tight">Add New Medicine SKU</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Product Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. CoQ10 200mg Cellular Vitality"
                  value={newProductForm.name}
                  onChange={(e) => setNewProductForm({ ...newProductForm, name: e.target.value })}
                  className="w-full h-11 px-4 rounded-full bg-[#f1f3ff] text-xs font-medium focus:outline-none border border-transparent focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Generic Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Ubiquinone Bio-Solubilized"
                  value={newProductForm.genericName}
                  onChange={(e) => setNewProductForm({ ...newProductForm, genericName: e.target.value })}
                  className="w-full h-11 px-4 rounded-full bg-[#f1f3ff] text-xs font-medium focus:outline-none border border-transparent focus:border-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">SKU</label>
                  <input
                    type="text"
                    placeholder="e.g. SKU-COQ-200"
                    value={newProductForm.sku}
                    onChange={(e) => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                    className="w-full h-11 px-4 rounded-full bg-[#f1f3ff] text-xs font-mono font-medium focus:outline-none border border-transparent focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Category</label>
                  <select
                    value={newProductForm.category}
                    onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                    className="w-full h-11 px-4 rounded-full bg-[#f1f3ff] text-xs font-medium focus:outline-none border border-transparent focus:border-black"
                  >
                    {CATEGORIES.filter((c) => c !== 'All Items').map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Price ($)</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    placeholder="29.99"
                    value={newProductForm.unitPrice}
                    onChange={(e) => setNewProductForm({ ...newProductForm, unitPrice: e.target.value })}
                    className="w-full h-11 px-4 rounded-full bg-[#f1f3ff] text-xs font-bold focus:outline-none border border-transparent focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">MSRP ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="34.99"
                    value={newProductForm.msrp}
                    onChange={(e) => setNewProductForm({ ...newProductForm, msrp: e.target.value })}
                    className="w-full h-11 px-4 rounded-full bg-[#f1f3ff] text-xs font-bold focus:outline-none border border-transparent focus:border-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Initial Stock</label>
                  <input
                    required
                    type="number"
                    placeholder="100"
                    value={newProductForm.stockQuantity}
                    onChange={(e) => setNewProductForm({ ...newProductForm, stockQuantity: e.target.value })}
                    className="w-full h-11 px-4 rounded-full bg-[#f1f3ff] text-xs font-bold focus:outline-none border border-transparent focus:border-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newProductForm.imageUrl}
                  onChange={(e) => setNewProductForm({ ...newProductForm, imageUrl: e.target.value })}
                  className="w-full h-11 px-4 rounded-full bg-[#f1f3ff] text-xs focus:outline-none border border-transparent focus:border-black"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Clinical Description</label>
                <textarea
                  rows={3}
                  placeholder="Formulation specifications, indications, and clinical dosages..."
                  value={newProductForm.description}
                  onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                  className="w-full p-3 rounded-2xl bg-[#f1f3ff] text-xs focus:outline-none border border-transparent focus:border-black resize-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 text-xs font-bold uppercase hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-black text-white text-xs font-bold uppercase hover:bg-zinc-800 shadow-md transition-colors"
                >
                  Create Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- BATCH PRICE UPDATE MODAL --- */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-100">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">price_change</span>
                </div>
                <h3 className="text-base font-black text-black uppercase tracking-tight">Batch Price Adjustment</h3>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleBatchUpdate} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">
                  Percentage Adjustment (%)
                </label>
                <div className="relative">
                  <input
                    required
                    type="number"
                    step="0.1"
                    placeholder="e.g. 5 for +5%, -10 for -10%"
                    value={batchPercent}
                    onChange={(e) => setBatchPercent(e.target.value)}
                    className="w-full h-11 px-4 pr-10 rounded-full bg-[#f1f3ff] text-xs font-bold focus:outline-none border border-transparent focus:border-black"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">%</span>
                </div>
                <p className="text-[11px] text-gray-500 mt-1">Use positive numbers to markup, negative to discount.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-600 mb-1">Target Category</label>
                <select
                  value={batchCategory}
                  onChange={(e) => setBatchCategory(e.target.value)}
                  className="w-full h-11 px-4 rounded-full bg-[#f1f3ff] text-xs font-bold focus:outline-none border border-transparent focus:border-black"
                >
                  <option value="All">All Categories ({medicines.length} SKUs)</option>
                  {CATEGORIES.filter((c) => c !== 'All Items').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-5 py-2.5 rounded-full border border-gray-300 text-gray-700 text-xs font-bold uppercase hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-black text-white text-xs font-bold uppercase hover:bg-zinc-800 shadow-md transition-colors"
                >
                  Apply Price Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationsCatalogDashboard;
