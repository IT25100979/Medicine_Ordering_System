import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import {
  Layers,
  Plus,
  AlertTriangle,
  Clock,
  ShieldAlert,
  CheckCircle2,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Edit,
  Lock,
  ArrowRight,
  Zap,
  Thermometer,
  Boxes,
  X,
  Sparkles,
  ArrowUpDown,
  FileCheck,
  AlertOctagon
} from 'lucide-react';

const InventoryPage = () => {
  // Main View Mode: 'batches' | 'medicines'
  const [activeMainView, setActiveMainView] = useState('batches');

  // State
  const [batches, setBatches] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState('ALL');

  // Medicine filters
  const [medSearchQuery, setMedSearchQuery] = useState('');
  const [medCategoryFilter, setMedCategoryFilter] = useState('ALL');

  // Modals
  const [showAddMedicineModal, setShowAddMedicineModal] = useState(false);
  const [showEditMedicineModal, setShowEditMedicineModal] = useState(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState(false);
  const [showQuarantineModal, setShowQuarantineModal] = useState(false);
  const [selectedBatchForQuarantine, setSelectedBatchForQuarantine] = useState(null);
  const [quarantineReasonInput, setQuarantineReasonInput] = useState('');

  // Form states
  const [editingMedicine, setEditingMedicine] = useState({
    id: null,
    name: '',
    genericName: '',
    sku: '',
    category: 'Analgesics',
    unitPrice: '',
    stockQuantity: 0,
    description: '',
    requiresPrescription: false,
    isTemperatureSensitive: false,
  });

  const [newMedicine, setNewMedicine] = useState({
    name: '',
    genericName: '',
    sku: '',
    category: 'Analgesics',
    unitPrice: '',
    requiresPrescription: false,
    isTemperatureSensitive: false,
  });

  const [createInitialBatch, setCreateInitialBatch] = useState(true);
  const [initialBatchData, setInitialBatchData] = useState({
    batchNumber: '',
    initialQuantity: 100,
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    shelfLocation: 'Aisle 1 - Shelf A1',
  });

  const [newBatch, setNewBatch] = useState({
    medicineId: '',
    batchNumber: '',
    initialQuantity: 50,
    manufacturingDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    shelfLocation: 'Aisle 1 - Shelf A1',
    status: 'ACTIVE',
  });

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    try {
      const [batchesRes, statsRes, medicinesRes] = await Promise.all([
        client.get('/api/v1/inventory/batches'),
        client.get('/api/v1/inventory/stats'),
        client.get('/api/v1/medicines'),
      ]);

      setBatches(batchesRes.data || []);
      setStats(statsRes.data || null);
      setMedicines(medicinesRes.data || []);
      if (medicinesRes.data?.length > 0 && !newBatch.medicineId) {
        setNewBatch((prev) => ({ ...prev, medicineId: medicinesRes.data[0].id }));
      }
    } catch (err) {
      console.error('Failed to load inventory data:', err);
      showToast('Error connecting to backend services.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter batches
  const filteredBatches = batches.filter((b) => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      b.batchNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.medicineName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.shelfLocation?.toLowerCase().includes(searchQuery.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      matchesStatus = b.status === statusFilter;
    }

    // Urgency filter
    let matchesUrgency = true;
    if (urgencyFilter !== 'ALL') {
      matchesUrgency = b.urgencyLevel === urgencyFilter;
    }

    return matchesSearch && matchesStatus && matchesUrgency;
  });

  // Handle Create Medicine
  const handleCreateMedicine = async (e) => {
    e.preventDefault();
    if (!newMedicine.name || !newMedicine.unitPrice) {
      showToast('Please fill in required fields.', 'error');
      return;
    }

    try {
      const skuVal =
        newMedicine.sku && newMedicine.sku.trim()
          ? newMedicine.sku.trim()
          : `SKU-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;
      const payload = {
        ...newMedicine,
        sku: skuVal,
        unitPrice: parseFloat(newMedicine.unitPrice),
      };

      const res = await client.post('/api/v1/medicines', payload);
      const createdMed = res.data;

      if (createInitialBatch) {
        try {
          const batchNum =
            initialBatchData.batchNumber && initialBatchData.batchNumber.trim()
              ? initialBatchData.batchNumber.trim()
              : `BATCH-${Date.now().toString().slice(-6)}`;
          await client.post('/api/v1/inventory/batches', {
            medicineId: createdMed.id,
            batchNumber: batchNum,
            initialQuantity: parseInt(initialBatchData.initialQuantity) || 100,
            manufacturingDate: initialBatchData.manufacturingDate || new Date().toISOString().split('T')[0],
            expiryDate:
              initialBatchData.expiryDate ||
              new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            shelfLocation: initialBatchData.shelfLocation || 'Aisle 1 - Shelf A1',
          });
          showToast(`Medicine & batch "${batchNum}" registered successfully!`);
        } catch (bErr) {
          console.error('Failed to create initial batch:', bErr);
          showToast(`Medicine added, but batch failed: ${bErr.response?.data?.message || 'Check batch inputs'}`, 'error');
        }
      } else {
        showToast(`Medicine "${createdMed.name}" added to catalog with 0 stock.`);
      }

      setShowAddMedicineModal(false);
      setNewMedicine({
        name: '',
        genericName: '',
        sku: '',
        category: 'Analgesics',
        unitPrice: '',
        requiresPrescription: false,
        isTemperatureSensitive: false,
      });
      setInitialBatchData({
        batchNumber: '',
        initialQuantity: 100,
        manufacturingDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        shelfLocation: 'Aisle 1 - Shelf A1',
      });
      fetchData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to create medicine.', 'error');
    }
  };

  // Handle Create Batch
  const handleCreateBatch = async (e) => {
    e.preventDefault();
    if (!newBatch.medicineId || !newBatch.batchNumber || !newBatch.expiryDate) {
      showToast('Please complete all batch fields.', 'error');
      return;
    }

    try {
      await client.post('/api/v1/inventory/batches', {
        ...newBatch,
        medicineId: parseInt(newBatch.medicineId),
        initialQuantity: parseInt(newBatch.initialQuantity),
      });

      showToast(`Batch "${newBatch.batchNumber}" registered successfully into FEFO queue!`);
      setShowAddBatchModal(false);
      setNewBatch({
        medicineId: medicines[0]?.id || '',
        batchNumber: '',
        initialQuantity: 50,
        manufacturingDate: new Date().toISOString().split('T')[0],
        expiryDate: '',
        shelfLocation: 'Aisle 1 - Shelf A1',
        status: 'ACTIVE',
      });
      fetchData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || 'Failed to register batch.', 'error');
    }
  };

  // Handle Status Update
  const handleUpdateStatus = async (batchId, status, quarantineReason = null) => {
    try {
      await client.put(`/api/v1/inventory/batches/${batchId}/status`, {
        status,
        quarantineReason,
      });
      showToast(`Batch status updated to ${status}!`);
      setShowQuarantineModal(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to update status.', 'error');
    }
  };

  // Handle Delete Batch
  const handleDeleteBatch = async (batchId, batchNumber) => {
    if (!window.confirm(`Are you sure you want to permanently delete batch ${batchNumber}?`)) {
      return;
    }
    try {
      await client.delete(`/api/v1/inventory/batches/${batchId}`);
      showToast(`Batch ${batchNumber} deleted.`);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete batch.', 'error');
    }
  };

  // Medicine Filtering
  const filteredMedicines = medicines.filter((m) => {
    const matchesSearch =
      !medSearchQuery ||
      m.name?.toLowerCase().includes(medSearchQuery.toLowerCase()) ||
      m.genericName?.toLowerCase().includes(medSearchQuery.toLowerCase()) ||
      m.sku?.toLowerCase().includes(medSearchQuery.toLowerCase()) ||
      m.category?.toLowerCase().includes(medSearchQuery.toLowerCase());

    const matchesCategory =
      medCategoryFilter === 'ALL' ||
      m.category?.toLowerCase() === medCategoryFilter.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  // Open Edit Medicine Modal
  const handleOpenEditMedicine = (med) => {
    setEditingMedicine({
      id: med.id,
      name: med.name || '',
      genericName: med.genericName || '',
      sku: med.sku || '',
      category: med.category || 'Analgesics',
      unitPrice: med.unitPrice != null ? med.unitPrice : (med.price || ''),
      stockQuantity: med.stockQuantity != null ? med.stockQuantity : 0,
      description: med.description || '',
      requiresPrescription: Boolean(med.requiresPrescription),
      isTemperatureSensitive: Boolean(med.isTemperatureSensitive),
    });
    setShowEditMedicineModal(true);
  };

  // Submit Update Medicine
  const handleUpdateMedicine = async (e) => {
    e.preventDefault();
    if (!editingMedicine.name || editingMedicine.unitPrice === '') {
      showToast('Please fill in required fields.', 'error');
      return;
    }

    try {
      const payload = {
        name: editingMedicine.name.trim(),
        genericName: editingMedicine.genericName ? editingMedicine.genericName.trim() : '',
        sku: editingMedicine.sku ? editingMedicine.sku.trim() : '',
        category: editingMedicine.category,
        unitPrice: parseFloat(editingMedicine.unitPrice),
        stockQuantity: parseInt(editingMedicine.stockQuantity, 10) || 0,
        description: editingMedicine.description,
        requiresPrescription: editingMedicine.requiresPrescription,
        isTemperatureSensitive: editingMedicine.isTemperatureSensitive,
      };

      await client.put(`/api/v1/medicines/${editingMedicine.id}`, payload);
      showToast(`Medicine "${editingMedicine.name}" updated successfully!`);
      setShowEditMedicineModal(false);
      fetchData();
    } catch (err) {
      console.error('Update medicine error:', err);
      showToast(err.response?.data?.message || 'Failed to update medicine.', 'error');
    }
  };

  // Delete Medicine
  const handleDeleteMedicine = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete "${name}" from the catalog? Any associated batches will also be removed.`)) {
      return;
    }

    try {
      await client.delete(`/api/v1/medicines/${id}`);
      showToast(`Medicine "${name}" deleted successfully.`);
      fetchData();
    } catch (err) {
      console.error('Delete medicine error:', err);
      showToast(err.response?.data?.message || 'Failed to delete medicine.', 'error');
    }
  };

  // Shortcut: Register Batch for specific medicine
  const handleRegisterBatchForMedicine = (medicineId) => {
    setNewBatch((prev) => ({
      ...prev,
      medicineId: String(medicineId),
      batchNumber: `BAT-${Date.now().toString().slice(-6)}`,
    }));
    setShowAddBatchModal(true);
  };

  // Helper for Urgency Styles
  const getUrgencyBadge = (batch) => {
    const days = batch.daysUntilExpiry;
    if (batch.status === 'EXPIRED' || days < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-red-500/10 text-red-500 border border-red-500/20">
          <AlertOctagon className="w-3 h-3" />
          EXPIRED ({Math.abs(days)}d ago)
        </span>
      );
    }
    if (batch.status === 'QUARANTINED') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <Lock className="w-3 h-3" />
          QUARANTINED
        </span>
      );
    }
    if (days <= 30) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-500 border border-amber-500/30 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          FEFO PRIORITY ({days}d left)
        </span>
      );
    }
    if (days <= 90) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
          <Clock className="w-3 h-3" />
          MODERATE ({days}d left)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
        <CheckCircle2 className="w-3 h-3" />
        SAFE ({days}d left)
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 pt-24 pb-16 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-500 selection:text-black">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all animate-bounce ${
            toast.type === 'error'
              ? 'bg-red-950/90 border-red-500/40 text-red-200'
              : 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200'
          }`}
        >
          {toast.type === 'error' ? <AlertTriangle className="w-5 h-5 text-red-400" /> : <Sparkles className="w-5 h-5 text-emerald-400" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      <div className="max-w-[1536px] mx-auto space-y-8">
        {/* Top Control Bar & Breadcrumbs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-emerald-400 uppercase mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span>PHARMACEUTICAL SUPPLY CHAIN PROTOCOL</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Smart Inventory & FEFO Engine</span>
              <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                First Expiring, First Out
              </span>
            </h1>
            <p className="text-zinc-400 text-sm mt-1 max-w-2xl">
              Automated earliest-expiry dispatch prioritization, cold-chain compliance, batch quarantine containment, and stock depletion intelligence.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowAddMedicineModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 hover:border-zinc-500 text-white font-bold text-xs uppercase tracking-wider transition-all"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Add Medicine</span>
            </button>

            <button
              onClick={() => setShowAddBatchModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20"
            >
              <Boxes className="w-4 h-4" />
              <span>Register Batch</span>
            </button>

            <button
              onClick={fetchData}
              title="Refresh Data"
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition-all"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Real-time KPI Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-md relative overflow-hidden group hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <span>Cataloged</span>
              <Boxes className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-3xl font-black text-white mt-2">{stats?.totalMedicines ?? 0}</div>
            <div className="text-[11px] text-zinc-500 mt-1">Unique medicine SKUs</div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-md relative overflow-hidden group hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <span>Total Units</span>
              <Layers className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-3xl font-black text-cyan-400 mt-2">{stats?.totalUnitsInStock ?? 0}</div>
            <div className="text-[11px] text-zinc-500 mt-1">Available in active storage</div>
          </div>

          <div className="p-5 rounded-2xl bg-zinc-900/60 border border-zinc-800 backdrop-blur-md relative overflow-hidden group hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between text-zinc-400 text-xs font-bold uppercase tracking-wider">
              <span>FEFO Queue</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-3xl font-black text-emerald-400 mt-2">{stats?.activeBatches ?? 0}</div>
            <div className="text-[11px] text-zinc-500 mt-1">Active registered batches</div>
          </div>

          <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/40 transition-all">
            <div className="flex items-center justify-between text-amber-400 text-xs font-bold uppercase tracking-wider">
              <span>Critical FEFO</span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-3xl font-black text-amber-400 mt-2">{stats?.nearExpiryBatches ?? 0}</div>
            <div className="text-[11px] text-amber-400/70 mt-1">Expiring within 30 days</div>
          </div>

          <div className="p-5 rounded-2xl bg-red-500/5 border border-red-500/20 backdrop-blur-md relative overflow-hidden group hover:border-red-500/40 transition-all">
            <div className="flex items-center justify-between text-red-400 text-xs font-bold uppercase tracking-wider">
              <span>Expired</span>
              <AlertOctagon className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-3xl font-black text-red-400 mt-2">{stats?.expiredBatches ?? 0}</div>
            <div className="text-[11px] text-red-400/70 mt-1">Halted from dispatch</div>
          </div>

          <div className="p-5 rounded-2xl bg-purple-500/5 border border-purple-500/20 backdrop-blur-md relative overflow-hidden group hover:border-purple-500/40 transition-all">
            <div className="flex items-center justify-between text-purple-400 text-xs font-bold uppercase tracking-wider">
              <span>Quarantined</span>
              <Lock className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-3xl font-black text-purple-400 mt-2">{stats?.quarantinedBatches ?? 0}</div>
            <div className="text-[11px] text-purple-400/70 mt-1">Containment inspection</div>
          </div>
        </div>

        {/* Main View Mode Selector (Batches vs Medicines) */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-2 rounded-2xl bg-zinc-900/90 border border-zinc-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveMainView('batches')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeMainView === 'batches'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>FEFO Batch Registry ({batches.length})</span>
            </button>

            <button
              onClick={() => setActiveMainView('medicines')}
              className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all ${
                activeMainView === 'medicines'
                  ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20 font-black'
                  : 'bg-zinc-950 text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800'
              }`}
            >
              <Boxes className="w-4 h-4" />
              <span>Master Medicines Catalog ({medicines.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2 pr-2">
            {activeMainView === 'medicines' ? (
              <button
                onClick={() => setShowAddMedicineModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Medicine</span>
              </button>
            ) : (
              <button
                onClick={() => setShowAddBatchModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-emerald-500/20"
              >
                <Plus className="w-4 h-4" />
                <span>Register Batch</span>
              </button>
            )}
          </div>
        </div>

        {activeMainView === 'medicines' ? (
          <div className="space-y-4">
            {/* Filter and Search Action Strip for Medicines */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
                {[
                  'ALL',
                  'Analgesics',
                  'Antibiotics',
                  'Cardiovascular',
                  'Antidiabetic',
                  'Respiratory',
                  'Gastrointestinal',
                  'Vitamins & Minerals',
                  'Dermatology',
                  'Dietary & Vits',
                  'General',
                ].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setMedCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      medCategoryFilter === cat
                        ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black'
                        : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Medicine Search Field */}
              <div className="relative min-w-[280px]">
                <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by drug name, generic or SKU..."
                  value={medSearchQuery}
                  onChange={(e) => setMedSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            {/* Medicines Master Table */}
            <div className="rounded-3xl bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-xl overflow-hidden shadow-2xl">
              <div className="p-5 border-b border-zinc-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-900/60">
                <div className="flex items-center gap-3">
                  <span className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-emerald-400" />
                    Master Pharmaceutical Products
                  </span>
                  <span className="text-xs text-zinc-400">({filteredMedicines.length} registered drugs)</span>
                </div>
                <div className="text-xs font-semibold text-zinc-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>Direct Edit &amp; Stock Management</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-950/80 text-[11px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                      <th className="py-3.5 px-4">SKU / Code</th>
                      <th className="py-3.5 px-4">Medicine &amp; Clinical Profile</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Unit Price</th>
                      <th className="py-3.5 px-4 text-center">Available Stock</th>
                      <th className="py-3.5 px-4 text-center">Active Batches</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 text-xs">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-zinc-500">
                          <div className="inline-flex items-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                            <span>Loading pharmaceutical products...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredMedicines.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="py-12 text-center text-zinc-500">
                          No medicines found matching criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredMedicines.map((med) => {
                        const medBatches = batches.filter((b) => b.medicineId === med.id);
                        const stock = med.stockQuantity != null ? med.stockQuantity : 0;
                        const isOutOfStock = stock <= 0;
                        const isLowStock = stock > 0 && stock <= 15;

                        return (
                          <tr
                            key={med.id}
                            className="hover:bg-zinc-800/30 transition-colors group"
                          >
                            {/* SKU */}
                            <td className="py-4 px-4 font-mono text-zinc-300 font-bold text-xs">
                              {med.sku || `MED-${med.id}`}
                            </td>

                            {/* Medicine & Generic Name */}
                            <td className="py-4 px-4">
                              <div className="font-bold text-white text-sm">{med.name}</div>
                              <div className="text-zinc-400 text-[11px] flex items-center gap-2 mt-0.5">
                                <span>{med.genericName || 'Standard Chemical Entity'}</span>
                                {med.requiresPrescription && (
                                  <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] font-extrabold uppercase">
                                    Rx Required
                                  </span>
                                )}
                                {med.isTemperatureSensitive && (
                                  <span className="inline-flex items-center gap-0.5 text-cyan-400 font-semibold text-[10px]">
                                    <Thermometer className="w-3 h-3" /> Cold Chain
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 font-medium">
                                {med.category || 'General'}
                              </span>
                            </td>

                            {/* Price */}
                            <td className="py-4 px-4">
                              <div className="font-mono font-bold text-white text-sm">
                                ${Number(med.unitPrice || med.price || 0).toFixed(2)}
                              </div>
                              {med.msrp && (
                                <div className="text-[10px] text-zinc-500 line-through">
                                  ${Number(med.msrp).toFixed(2)}
                                </div>
                              )}
                            </td>

                            {/* Available Stock */}
                            <td className="py-4 px-4 text-center">
                              {isOutOfStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/10 text-red-500 border border-red-500/20">
                                  <AlertOctagon className="w-3 h-3" />
                                  OUT OF STOCK
                                </span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                  <AlertTriangle className="w-3 h-3" />
                                  {stock} units (LOW)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  <CheckCircle2 className="w-3 h-3" />
                                  {stock} in stock
                                </span>
                              )}
                            </td>

                            {/* Active Batches Count */}
                            <td className="py-4 px-4 text-center">
                              <span className="px-2.5 py-1 rounded-full bg-zinc-950 border border-zinc-800 text-xs font-mono font-bold text-zinc-300">
                                {medBatches.length} {medBatches.length === 1 ? 'batch' : 'batches'}
                              </span>
                            </td>

                            {/* Actions (Add Batch, Edit & Delete) */}
                            <td className="py-4 px-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <button
                                  onClick={() => handleRegisterBatchForMedicine(med.id)}
                                  title="Add Batch for this Medicine"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 hover:text-black text-emerald-400 font-bold text-[11px] transition-all border border-emerald-500/30"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+ Batch</span>
                                </button>

                                <button
                                  onClick={() => handleOpenEditMedicine(med)}
                                  title="Edit Medicine Details"
                                  className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => handleDeleteMedicine(med.id, med.name)}
                                  title="Delete Medicine from Catalog"
                                  className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Filter and Search Action Strip */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
          {/* Quick Tab Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Batches', count: batches.length },
              { id: 'ACTIVE', label: '⚡ FEFO Active', count: stats?.activeBatches },
              { id: 'NEAR_EXPIRY', label: '⚠️ Near Expiry', count: stats?.nearExpiryBatches },
              { id: 'EXPIRED', label: '🔴 Expired', count: stats?.expiredBatches },
              { id: 'QUARANTINED', label: '🔒 Quarantined', count: stats?.quarantinedBatches },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setUrgencyFilter('ALL');
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  statusFilter === tab.id
                    ? 'bg-emerald-500 text-black shadow-md shadow-emerald-500/20 font-black'
                    : 'bg-zinc-800/60 text-zinc-400 hover:text-white hover:bg-zinc-800'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      statusFilter === tab.id ? 'bg-black/20 text-black' : 'bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Field */}
          <div className="relative min-w-[280px]">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search batch #, medicine, or shelf..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* FEFO Master Batch Table */}
        <div className="rounded-3xl bg-zinc-900/50 border border-zinc-800 overflow-hidden shadow-2xl backdrop-blur-xl">
          <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-white tracking-wide uppercase">
                FEFO Prioritized Batch Registry
              </span>
              <span className="text-xs text-zinc-400">({filteredBatches.length} records matching criteria)</span>
            </div>
            <div className="text-xs font-semibold text-zinc-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Sorted: Earliest Expiry First (Strict FEFO)</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 text-[11px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-800">
                  <th className="py-3.5 px-4 text-center">FEFO Priority</th>
                  <th className="py-3.5 px-4">Batch Details</th>
                  <th className="py-3.5 px-4">Medicine & SKU</th>
                  <th className="py-3.5 px-4">Shelf Location</th>
                  <th className="py-3.5 px-4">Manufacturing Date</th>
                  <th className="py-3.5 px-4">Expiry Date & Status</th>
                  <th className="py-3.5 px-4 text-center">Available Stock</th>
                  <th className="py-3.5 px-4 text-right">Batch Action & Status Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-zinc-500">
                      <div className="inline-flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                        <span>Synchronizing Smart Inventory & FEFO tables...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredBatches.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-zinc-500">
                      No batches found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredBatches.map((batch) => (
                    <tr
                      key={batch.id}
                      className="hover:bg-zinc-800/30 transition-colors group"
                    >
                      {/* FEFO Priority Rank */}
                      <td className="py-4 px-4 text-center">
                        {batch.status === 'EXPIRED' ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 font-extrabold text-[10px]">
                            HALTED
                          </span>
                        ) : batch.status === 'QUARANTINED' ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 font-extrabold text-[10px]">
                            LOCKED
                          </span>
                        ) : batch.fefoRank ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-black text-xs ${
                              batch.fefoRank === 1
                                ? 'bg-amber-400 text-black shadow-md shadow-amber-400/20'
                                : batch.fefoRank === 2
                                ? 'bg-zinc-300 text-black font-extrabold'
                                : 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            }`}
                          >
                            <span>#{batch.fefoRank}</span>
                            {batch.fefoRank === 1 && <Zap className="w-3 h-3 fill-black text-black" />}
                          </span>
                        ) : (
                          <span className="text-zinc-600 font-bold">-</span>
                        )}
                      </td>

                      {/* Batch Number */}
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-white text-sm tracking-wide">
                          {batch.batchNumber}
                        </div>
                        {batch.quarantineReason && (
                          <div className="text-[11px] text-purple-400 flex items-center gap-1 mt-0.5">
                            <Lock className="w-3 h-3" />
                            <span>{batch.quarantineReason}</span>
                          </div>
                        )}
                      </td>

                      {/* Medicine Info */}
                      <td className="py-4 px-4">
                        <div className="font-bold text-white text-sm">{batch.medicineName}</div>
                        <div className="text-zinc-400 text-[11px] flex items-center gap-2 mt-0.5">
                          <span>{batch.genericName || 'Standard Formulation'}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="font-mono text-zinc-500">{batch.sku}</span>
                          {batch.isTemperatureSensitive && (
                            <span className="inline-flex items-center gap-0.5 text-cyan-400 font-semibold">
                              <Thermometer className="w-3 h-3" /> Cold Chain
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Shelf Location */}
                      <td className="py-4 px-4 text-zinc-300 font-medium">
                        <span className="px-2.5 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-[11px]">
                          {batch.shelfLocation || 'Main Bay'}
                        </span>
                      </td>

                      {/* Manufacturing Date */}
                      <td className="py-4 px-4 text-zinc-400 font-mono">
                        {batch.manufacturingDate || 'N/A'}
                      </td>

                      {/* Expiry Date & Urgency Indicator */}
                      <td className="py-4 px-4">
                        <div className="font-mono font-bold text-white">{batch.expiryDate}</div>
                        <div className="mt-1">{getUrgencyBadge(batch)}</div>
                      </td>

                      {/* Quantity */}
                      <td className="py-4 px-4 text-center">
                        <div className="font-extrabold text-white text-sm">
                          {batch.quantityAvailable}{' '}
                          <span className="text-zinc-500 text-xs font-normal">/ {batch.initialQuantity}</span>
                        </div>
                        <div className="w-20 mx-auto bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                          <div
                            className={`h-full rounded-full transition-all ${
                              batch.quantityAvailable === 0
                                ? 'bg-zinc-600'
                                : batch.status === 'EXPIRED'
                                ? 'bg-red-500'
                                : batch.status === 'QUARANTINED'
                                ? 'bg-purple-500'
                                : 'bg-emerald-400'
                            }`}
                            style={{
                              width: `${Math.min(
                                100,
                                Math.round(((batch.quantityAvailable || 0) / (batch.initialQuantity || 1)) * 100)
                              )}%`,
                            }}
                          ></div>
                        </div>
                      </td>

                      {/* Status Management Actions */}
                      <td className="py-4 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          {batch.status !== 'ACTIVE' && (
                            <button
                              onClick={() => handleUpdateStatus(batch.id, 'ACTIVE')}
                              title="Mark as Active FEFO"
                              className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black font-bold text-[11px] transition-all"
                            >
                              Activate
                            </button>
                          )}

                          {batch.status !== 'QUARANTINED' && (
                            <button
                              onClick={() => {
                                setSelectedBatchForQuarantine(batch);
                                setQuarantineReasonInput('Visual seal check failed / storage review');
                                setShowQuarantineModal(true);
                              }}
                              title="Quarantine this batch"
                              className="px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-400 hover:bg-purple-500 hover:text-white font-bold text-[11px] transition-all"
                            >
                              Quarantine
                            </button>
                          )}

                          {batch.status !== 'EXPIRED' && (
                            <button
                              onClick={() => handleUpdateStatus(batch.id, 'EXPIRED')}
                              title="Mark Expired"
                              className="px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white font-bold text-[11px] transition-all"
                            >
                              Expire
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteBatch(batch.id, batch.batchNumber)}
                            title="Delete Batch"
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
  </div>

      {/* ============================================================== */}
      {/* MODAL 1: ADD NEW MEDICINE PRODUCT                              */}
      {/* ============================================================== */}
      {showAddMedicineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAddMedicineModal(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Plus className="w-4 h-4" />
              <span>Pharmaceutical Catalog</span>
            </div>
            <h2 className="text-2xl font-black text-white">Add New Medicine Product</h2>
            <p className="text-zinc-400 text-xs mt-1">
              Register a new pharmaceutical line into the master database before allocating batches.
            </p>

            <form onSubmit={handleCreateMedicine} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                  Medicine Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paracetamol 500mg, Omeprazole 20mg"
                  value={newMedicine.name}
                  onChange={(e) => setNewMedicine({ ...newMedicine, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">Generic Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Acetaminophen"
                    value={newMedicine.genericName}
                    onChange={(e) => setNewMedicine({ ...newMedicine, genericName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">SKU / Code</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={newMedicine.sku}
                    onChange={(e) => setNewMedicine({ ...newMedicine, sku: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">Category</label>
                  <select
                    value={newMedicine.category}
                    onChange={(e) => setNewMedicine({ ...newMedicine, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Analgesics">Analgesics</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Antidiabetic">Antidiabetic</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                    <option value="Vitamins & Minerals">Vitamins & Minerals</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Unit Price ($/LKR) <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="12.50"
                    value={newMedicine.unitPrice}
                    onChange={(e) => setNewMedicine({ ...newMedicine, unitPrice: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer hover:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={newMedicine.requiresPrescription}
                    onChange={(e) =>
                      setNewMedicine({ ...newMedicine, requiresPrescription: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-500 rounded bg-zinc-900 border-zinc-700 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-zinc-200">Requires Prescription</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer hover:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={newMedicine.isTemperatureSensitive}
                    onChange={(e) =>
                      setNewMedicine({ ...newMedicine, isTemperatureSensitive: e.target.checked })
                    }
                    className="w-4 h-4 text-cyan-400 rounded bg-zinc-900 border-zinc-700 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-zinc-200">Cold Chain Sensitive</span>
                </label>
              </div>

              {/* Optional Initial Batch Registration */}
              <div className="pt-3 border-t border-zinc-800">
                <label className="flex items-start gap-3 p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 cursor-pointer hover:border-emerald-500/50">
                  <input
                    type="checkbox"
                    checked={createInitialBatch}
                    onChange={(e) => setCreateInitialBatch(e.target.checked)}
                    className="w-4 h-4 mt-0.5 text-emerald-500 rounded bg-zinc-900 border-zinc-700 focus:ring-0"
                  />
                  <div className="flex-1">
                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wide flex items-center gap-1.5">
                      <Boxes className="w-3.5 h-3.5" />
                      Register Initial Stock Batch
                    </span>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Creates the first warehouse batch immediately so it appears in the FEFO Batch Registry with real available stock.
                    </p>
                  </div>
                </label>

                {createInitialBatch && (
                  <div className="mt-3 p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                          Batch Number
                        </label>
                        <input
                          type="text"
                          placeholder="Auto if empty"
                          value={initialBatchData.batchNumber}
                          onChange={(e) =>
                            setInitialBatchData({ ...initialBatchData, batchNumber: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                          Initial Stock Quantity <span className="text-emerald-400">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          required={createInitialBatch}
                          value={initialBatchData.initialQuantity}
                          onChange={(e) =>
                            setInitialBatchData({
                              ...initialBatchData,
                              initialQuantity: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                          Expiry Date (FEFO) <span className="text-emerald-400">*</span>
                        </label>
                        <input
                          type="date"
                          required={createInitialBatch}
                          value={initialBatchData.expiryDate}
                          onChange={(e) =>
                            setInitialBatchData({ ...initialBatchData, expiryDate: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                          Shelf Location
                        </label>
                        <input
                          type="text"
                          value={initialBatchData.shelfLocation}
                          onChange={(e) =>
                            setInitialBatchData({ ...initialBatchData, shelfLocation: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white text-xs focus:border-emerald-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddMedicineModal(false)}
                  className="px-5 py-2.5 rounded-xl text-zinc-400 hover:text-white font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                >
                  Save Medicine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1B: EDIT MEDICINE PRODUCT                                */}
      {/* ============================================================== */}
      {showEditMedicineModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowEditMedicineModal(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Edit className="w-4 h-4" />
              <span>Update Medication</span>
            </div>
            <h2 className="text-2xl font-black text-white">Edit Medicine Profile</h2>
            <p className="text-zinc-400 text-xs mt-1">
              Modify clinical specifications, pricing, and master catalog settings.
            </p>

            <form onSubmit={handleUpdateMedicine} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                  Medicine Name <span className="text-emerald-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingMedicine.name}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">Generic Name</label>
                  <input
                    type="text"
                    value={editingMedicine.genericName}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, genericName: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">SKU / Code</label>
                  <input
                    type="text"
                    value={editingMedicine.sku}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, sku: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">Category</label>
                  <select
                    value={editingMedicine.category}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Analgesics">Analgesics</option>
                    <option value="Antibiotics">Antibiotics</option>
                    <option value="Cardiovascular">Cardiovascular</option>
                    <option value="Antidiabetic">Antidiabetic</option>
                    <option value="Respiratory">Respiratory</option>
                    <option value="Gastrointestinal">Gastrointestinal</option>
                    <option value="Vitamins & Minerals">Vitamins & Minerals</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Dietary & Vits">Dietary & Vits</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Unit Price ($/LKR) <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editingMedicine.unitPrice}
                    onChange={(e) => setEditingMedicine({ ...editingMedicine, unitPrice: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">Description</label>
                <textarea
                  rows="2"
                  value={editingMedicine.description}
                  onChange={(e) => setEditingMedicine({ ...editingMedicine, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none resize-none"
                  placeholder="Clinical indications and dosage instructions..."
                ></textarea>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer hover:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={editingMedicine.requiresPrescription}
                    onChange={(e) =>
                      setEditingMedicine({ ...editingMedicine, requiresPrescription: e.target.checked })
                    }
                    className="w-4 h-4 text-emerald-500 rounded bg-zinc-900 border-zinc-700 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-zinc-200">Requires Prescription</span>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-xl bg-zinc-950 border border-zinc-800 cursor-pointer hover:border-zinc-700">
                  <input
                    type="checkbox"
                    checked={editingMedicine.isTemperatureSensitive}
                    onChange={(e) =>
                      setEditingMedicine({ ...editingMedicine, isTemperatureSensitive: e.target.checked })
                    }
                    className="w-4 h-4 text-cyan-400 rounded bg-zinc-900 border-zinc-700 focus:ring-0"
                  />
                  <span className="text-xs font-bold text-zinc-200">Cold Chain Sensitive</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowEditMedicineModal(false)}
                  className="px-5 py-2.5 rounded-xl text-zinc-400 hover:text-white font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: REGISTER NEW BATCH                                    */}
      {/* ============================================================== */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowAddBatchModal(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Boxes className="w-4 h-4" />
              <span>FEFO Lot Registration</span>
            </div>
            <h2 className="text-2xl font-black text-white">Register Inventory Batch</h2>
            <p className="text-zinc-400 text-xs mt-1">
              Add a physical manufacturing lot. The FEFO engine will automatically calculate its dispatch priority rank.
            </p>

            <form onSubmit={handleCreateBatch} className="space-y-4 mt-6">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                  Select Medicine <span className="text-emerald-400">*</span>
                </label>
                <select
                  required
                  value={newBatch.medicineId}
                  onChange={(e) => setNewBatch({ ...newBatch, medicineId: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {medicines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.genericName || m.sku})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Batch Number <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="BATCH-2026-PARA-05"
                    value={newBatch.batchNumber}
                    onChange={(e) => setNewBatch({ ...newBatch, batchNumber: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm font-mono focus:border-emerald-500 focus:outline-none uppercase"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Stock Quantity (Units) <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={newBatch.initialQuantity}
                    onChange={(e) => setNewBatch({ ...newBatch, initialQuantity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Manufacturing Date <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newBatch.manufacturingDate}
                    onChange={(e) => setNewBatch({ ...newBatch, manufacturingDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                    Expiry Date <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={newBatch.expiryDate}
                    onChange={(e) => setNewBatch({ ...newBatch, expiryDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">Shelf Location</label>
                  <input
                    type="text"
                    placeholder="Aisle 1 - Shelf B2"
                    value={newBatch.shelfLocation}
                    onChange={(e) => setNewBatch({ ...newBatch, shelfLocation: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">Initial Status</label>
                  <select
                    value={newBatch.status}
                    onChange={(e) => setNewBatch({ ...newBatch, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE (Ready for FEFO)</option>
                    <option value="QUARANTINED">QUARANTINED (Hold for inspection)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(false)}
                  className="px-5 py-2.5 rounded-xl text-zinc-400 hover:text-white font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                >
                  Commit Batch to FEFO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {/* ============================================================== */}
      {/* MODAL 4: QUARANTINE REASON PROMPT                              */}
      {/* ============================================================== */}
      {showQuarantineModal && selectedBatchForQuarantine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-zinc-900 border border-purple-500/30 rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setShowQuarantineModal(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Lock className="w-4 h-4" />
              <span>Safety Protocol</span>
            </div>
            <h2 className="text-xl font-black text-white">Quarantine Batch</h2>
            <p className="text-zinc-400 text-xs mt-1">
              Quarantining batch <span className="font-mono text-white font-bold">{selectedBatchForQuarantine.batchNumber}</span> immediately prevents it from being allocated to any customer order.
            </p>

            <div className="space-y-4 mt-5">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1">
                  Reason for Quarantine
                </label>
                <textarea
                  rows="3"
                  value={quarantineReasonInput}
                  onChange={(e) => setQuarantineReasonInput(e.target.value)}
                  placeholder="e.g. Broken foil packaging, suspected temperature spike, lab testing required..."
                  className="w-full px-4 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-white text-sm focus:border-purple-500 focus:outline-none"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowQuarantineModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white font-bold text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  onClick={() =>
                    handleUpdateStatus(
                      selectedBatchForQuarantine.id,
                      'QUARANTINED',
                      quarantineReasonInput
                    )
                  }
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg shadow-purple-600/20"
                >
                  Confirm Quarantine
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
