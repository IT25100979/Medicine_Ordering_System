import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Check, 
  X, 
  Trash2, 
  Edit3, 
  PlusCircle, 
  AlertCircle, 
  CheckCircle2, 
  Shield, 
  RefreshCw, 
  MapPin, 
  Truck, 
  Clock, 
  DollarSign, 
  Calendar 
} from 'lucide-react';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const DeliveryPage = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Navigation tab state: 'all' | 'deliveries' | 'zones'
  const [activeTab, setActiveTab] = useState('all');

  // --- Deliveries State ---
  const [deliveries, setDeliveries] = useState([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(true);
  const [publishingDelivery, setPublishingDelivery] = useState(false);
  const [deliveryFeedback, setDeliveryFeedback] = useState({ type: '', message: '' });

  const getTodayString = () => new Date().toISOString().split('T')[0];
  const getFutureString = (daysAhead = 2) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return d.toISOString().split('T')[0];
  };

  const [deliveryForm, setDeliveryForm] = useState({
    userId: '',
    description: '',
    pharmacistId: '',
    deliveryAddress: '',
    coldChainTag: false,
    initialDate: getTodayString(),
    finalDate: getFutureString(2),
    status: 'PENDING'
  });

  // --- Delivery Zones State ---
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [publishingZone, setPublishingZone] = useState(false);
  const [zoneFeedback, setZoneFeedback] = useState({ type: '', message: '' });
  const [editingZoneId, setEditingZoneId] = useState(null);

  const [zoneForm, setZoneForm] = useState({
    city: '',
    postal_code: '',
    is_active: '1',
    delivery_fee: '',
    estimated_delivery_time: '',
    created_at: getTodayString()
  });

  // --- Fetch Deliveries ---
  const fetchDeliveries = async () => {
    setDeliveriesLoading(true);
    try {
      const response = await client.get('/api/v1/deliveries');
      const data = response.data;
      if (Array.isArray(data)) {
        setDeliveries(data);
      } else if (data && Array.isArray(data.data)) {
        setDeliveries(data.data);
      } else {
        setDeliveries([]);
      }
    } catch (error) {
      console.error('Error fetching deliveries', error);
      setDeliveries([]);
      setDeliveryFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Could not load deliveries from server.'
      });
    } finally {
      setDeliveriesLoading(false);
    }
  };

  // --- Fetch Delivery Zones ---
  const fetchDeliveryZones = async () => {
    setZonesLoading(true);
    try {
      const response = await client.get('/api/v1/delivery-zones');
      const data = response.data;
      if (Array.isArray(data)) {
        setDeliveryZones(data);
      } else if (data && Array.isArray(data.data)) {
        setDeliveryZones(data.data);
      } else {
        setDeliveryZones([]);
      }
    } catch (error) {
      console.error('Error fetching delivery zones', error);
      setDeliveryZones([]);
      setZoneFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Could not load delivery zones from server.'
      });
    } finally {
      setZonesLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    fetchDeliveryZones();
  }, []);

  // Pre-fill userId when logged-in user changes
  useEffect(() => {
    if (user && (user.userId || user.id) && !deliveryForm.userId) {
      setDeliveryForm((prev) => ({
        ...prev,
        userId: user.userId || user.id
      }));
    }
  }, [user]);

  // --- Delivery Handlers ---
  const handleDeliveryFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setDeliveryForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handlePublishDelivery = async (e) => {
    e.preventDefault();
    setDeliveryFeedback({ type: '', message: '' });

    if (!deliveryForm.deliveryAddress || !deliveryForm.deliveryAddress.trim()) {
      setDeliveryFeedback({ type: 'error', message: 'Delivery address is required.' });
      return;
    }

    setPublishingDelivery(true);
    try {
      let resolvedUserId = 1;
      if (deliveryForm.userId && !isNaN(parseInt(deliveryForm.userId, 10))) {
        resolvedUserId = parseInt(deliveryForm.userId, 10);
      } else if (user && (user.userId || user.id)) {
        resolvedUserId = user.userId || user.id;
      }

      let resolvedPharmacistId = null;
      if (deliveryForm.pharmacistId && !isNaN(parseInt(deliveryForm.pharmacistId, 10))) {
        resolvedPharmacistId = parseInt(deliveryForm.pharmacistId, 10);
      }

      const payload = {
        userId: resolvedUserId,
        description: deliveryForm.description ? deliveryForm.description.trim() : '',
        pharmacistId: resolvedPharmacistId,
        deliveryAddress: deliveryForm.deliveryAddress.trim(),
        coldChainTag: Boolean(deliveryForm.coldChainTag),
        initialDate: deliveryForm.initialDate || getTodayString(),
        finalDate: deliveryForm.finalDate || getFutureString(2),
        status: deliveryForm.status || 'PENDING'
      };

      const response = await client.post('/api/v1/deliveries', payload);

      setDeliveryFeedback({
        type: 'success',
        message: `Delivery #${response.data?.id || ''} published successfully!`
      });

      setDeliveryForm({
        userId: user ? (user.userId || user.id || '') : '',
        description: '',
        pharmacistId: '',
        deliveryAddress: '',
        coldChainTag: false,
        initialDate: getTodayString(),
        finalDate: getFutureString(2),
        status: 'PENDING'
      });

      await fetchDeliveries();
    } catch (error) {
      console.error('Error publishing delivery', error);
      setDeliveryFeedback({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Error publishing delivery'
      });
    } finally {
      setPublishingDelivery(false);
    }
  };

  const updateDeliveryStatus = async (id, status) => {
    try {
      const response = await client.put(`/api/v1/deliveries/${id}/status`, { status });
      setDeliveries((prev) => prev.map((d) => (d.id === id ? response.data : d)));
      setDeliveryFeedback({
        type: 'success',
        message: `Delivery #${id} marked as ${status}.`
      });
    } catch (error) {
      console.error('Error updating status', error);
      setDeliveryFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Error updating delivery status.'
      });
    }
  };

  const handleDeleteDelivery = async (id) => {
    if (!window.confirm(`Are you sure you want to delete delivery #${id}?`)) {
      return;
    }
    try {
      await client.delete(`/api/v1/deliveries/${id}`);
      setDeliveries((prev) => prev.filter((d) => d.id !== id));
      setDeliveryFeedback({
        type: 'success',
        message: `Delivery #${id} deleted successfully.`
      });
    } catch (error) {
      console.error('Error deleting delivery', error);
      setDeliveryFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Error deleting delivery.'
      });
    }
  };

  // --- Delivery Zones Handlers ---
  const handleZoneFormChange = (e) => {
    const { name, value } = e.target;
    setZoneForm((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEditZoneClick = (zone) => {
    setEditingZoneId(zone.id);
    setZoneForm({
      city: zone.city || '',
      postal_code: zone.postal_code || zone.postalCode || '',
      is_active: String(zone.is_active !== undefined ? zone.is_active : (zone.isActive !== undefined ? zone.isActive : '1')),
      delivery_fee: zone.delivery_fee !== undefined ? String(zone.delivery_fee) : (zone.deliveryFee !== undefined ? String(zone.deliveryFee) : ''),
      estimated_delivery_time: zone.estimated_delivery_time !== undefined ? String(zone.estimated_delivery_time) : (zone.estimatedDeliveryTime !== undefined ? String(zone.estimatedDeliveryTime) : ''),
      created_at: zone.created_at || zone.createdAt || getTodayString()
    });
    setZoneFeedback({
      type: 'info',
      message: `Editing Delivery Zone #${zone.id} (${zone.city}). Update fields below and click "Update & Publish Zone".`
    });
    // Smooth scroll to form
    const formElement = document.getElementById('zone-form-section');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelZoneEdit = () => {
    setEditingZoneId(null);
    setZoneForm({
      city: '',
      postal_code: '',
      is_active: '1',
      delivery_fee: '',
      estimated_delivery_time: '',
      created_at: getTodayString()
    });
    setZoneFeedback({ type: '', message: '' });
  };

  const handlePublishZone = async (e) => {
    e.preventDefault();
    setZoneFeedback({ type: '', message: '' });

    if (!zoneForm.city || !zoneForm.city.trim()) {
      setZoneFeedback({ type: 'error', message: 'City name is required.' });
      return;
    }
    if (!zoneForm.postal_code || !zoneForm.postal_code.trim()) {
      setZoneFeedback({ type: 'error', message: 'Postal code is required.' });
      return;
    }
    if (zoneForm.delivery_fee === '' || isNaN(parseFloat(zoneForm.delivery_fee))) {
      setZoneFeedback({ type: 'error', message: 'A valid delivery fee is required.' });
      return;
    }
    if (zoneForm.estimated_delivery_time === '' || isNaN(parseInt(zoneForm.estimated_delivery_time, 10))) {
      setZoneFeedback({ type: 'error', message: 'A valid estimated delivery time (minutes) is required.' });
      return;
    }

    setPublishingZone(true);
    try {
      const estTime = parseInt(zoneForm.estimated_delivery_time, 10);
      const payload = {
        city: zoneForm.city.trim().toLowerCase(),
        postal_code: zoneForm.postal_code.trim(),
        is_active: parseInt(zoneForm.is_active, 10),
        delivery_fee: parseFloat(zoneForm.delivery_fee),
        estimated_delivery_time: estTime,
        esitmated_delivery_time: estTime,
        created_at: zoneForm.created_at || getTodayString()
      };

      let res;
      if (editingZoneId) {
        res = await client.put(`/api/v1/delivery-zones/${editingZoneId}`, payload);
        setZoneFeedback({
          type: 'success',
          message: `Delivery Zone #${editingZoneId} (${res.data?.city || payload.city}) updated and published successfully!`
        });
      } else {
        res = await client.post('/api/v1/delivery-zones', payload);
        setZoneFeedback({
          type: 'success',
          message: `New Delivery Zone #${res.data?.id || ''} (${res.data?.city || payload.city}) created and published successfully!`
        });
      }

      handleCancelZoneEdit();
      await fetchDeliveryZones();
    } catch (error) {
      console.error('Error publishing delivery zone', error);
      setZoneFeedback({
        type: 'error',
        message: error.response?.data?.message || error.message || 'Error publishing delivery zone.'
      });
    } finally {
      setPublishingZone(false);
    }
  };

  const handleToggleZoneStatus = async (id) => {
    try {
      const response = await client.patch(`/api/v1/delivery-zones/${id}/toggle-status`);
      setDeliveryZones((prev) => prev.map((z) => (z.id === id ? response.data : z)));
      const newActive = response.data?.is_active === 1;
      setZoneFeedback({
        type: 'success',
        message: `Zone #${id} status changed to ${newActive ? 'Active' : 'Inactive'}.`
      });
    } catch (error) {
      console.error('Error toggling zone status', error);
      setZoneFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Error updating zone status.'
      });
    }
  };

  const handleDeleteZone = async (id, cityName) => {
    if (!window.confirm(`Are you sure you want to delete delivery zone #${id} (${cityName || ''})?`)) {
      return;
    }
    try {
      await client.delete(`/api/v1/delivery-zones/${id}`);
      setDeliveryZones((prev) => prev.filter((z) => z.id !== id));
      setZoneFeedback({
        type: 'success',
        message: `Delivery zone #${id} deleted successfully.`
      });
    } catch (error) {
      console.error('Error deleting zone', error);
      setZoneFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Error deleting delivery zone.'
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Link to="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 mr-4 font-medium">
            <ArrowLeft className="w-5 h-5 mr-1" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Delivery Management Dashboard</h1>
        </div>

        {/* User Role Indicator */}
        <div className="flex items-center gap-3">
          {isAuthenticated && user ? (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
              <Shield className="w-3.5 h-3.5 mr-1 text-blue-600" />
              {user.fullName} ({user.role})
            </span>
          ) : (
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span>Guest Mode</span>
              <Link to="/login" className="text-blue-600 hover:underline font-medium">
                Log In
              </Link>
            </div>
          )}
          <button
            onClick={() => {
              fetchDeliveries();
              fetchDeliveryZones();
            }}
            title="Refresh All Data"
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-600 transition"
          >
            <RefreshCw className={`w-4 h-4 ${deliveriesLoading || zonesLoading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Navigation View Switcher */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('all')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          All Sections
        </button>
        <button
          onClick={() => setActiveTab('deliveries')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'deliveries'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Truck className="w-4 h-4" />
          Deliveries Management ({deliveries.length})
        </button>
        <button
          onClick={() => setActiveTab('zones')}
          className={`py-3 px-5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'zones'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Delivery Zones Management ({deliveryZones.length})
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: DELIVERIES MANAGEMENT */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'deliveries') && (
        <div className="mb-14">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-900">1. Deliveries Management</h2>
          </div>

          {/* Delivery Feedback Messages */}
          {deliveryFeedback.message && (
            <div
              className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
                deliveryFeedback.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {deliveryFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-sm font-medium">{deliveryFeedback.message}</div>
              <button
                onClick={() => setDeliveryFeedback({ type: '', message: '' })}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Create Delivery Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Create & Publish Delivery</h3>
            <form onSubmit={handlePublishDelivery} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer / User ID <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  name="userId"
                  value={deliveryForm.userId}
                  onChange={handleDeliveryFormChange}
                  placeholder="e.g. 1"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pharmacist ID <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  type="number"
                  name="pharmacistId"
                  value={deliveryForm.pharmacistId}
                  onChange={handleDeliveryFormChange}
                  placeholder="e.g. 2"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-xs text-gray-500">(Optional)</span>
                </label>
                <input
                  type="text"
                  name="description"
                  value={deliveryForm.description}
                  onChange={handleDeliveryFormChange}
                  placeholder="e.g. Urgent prescription medications"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="deliveryAddress"
                  value={deliveryForm.deliveryAddress}
                  onChange={handleDeliveryFormChange}
                  required
                  placeholder="e.g. No. 45, Hospital Road, Colombo 01"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Start Date</label>
                <input
                  type="date"
                  name="initialDate"
                  value={deliveryForm.initialDate}
                  onChange={handleDeliveryFormChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expected Completion Date</label>
                <input
                  type="date"
                  name="finalDate"
                  value={deliveryForm.finalDate}
                  onChange={handleDeliveryFormChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2 flex items-center pt-2">
                <input
                  type="checkbox"
                  id="coldChainTag"
                  name="coldChainTag"
                  checked={deliveryForm.coldChainTag}
                  onChange={handleDeliveryFormChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="coldChainTag" className="ml-2 block text-sm font-medium text-gray-800">
                  Requires Cold-Chain Logistics Transport (Temperature Sensitive)
                </label>
              </div>

              <div className="md:col-span-2 mt-4">
                <button
                  type="submit"
                  disabled={publishingDelivery}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition font-semibold text-base shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {publishingDelivery ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Publishing Delivery...
                    </>
                  ) : (
                    'Publish Delivery'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Deliveries Data Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900">All Deliveries in Database</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Live delivery records visible to all delivery coordinators ({deliveries.length} total)
                </p>
              </div>
              <button
                onClick={fetchDeliveries}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${deliveriesLoading ? 'animate-spin' : ''}`} />
                Refresh Deliveries
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 text-left">ID</th>
                    <th className="px-5 py-3.5 text-left">User ID</th>
                    <th className="px-5 py-3.5 text-left">Pharmacist ID</th>
                    <th className="px-5 py-3.5 text-left">Description</th>
                    <th className="px-5 py-3.5 text-left">Destination Address</th>
                    <th className="px-5 py-3.5 text-left">Schedule Dates</th>
                    <th className="px-5 py-3.5 text-left">Cold-Chain</th>
                    <th className="px-5 py-3.5 text-left">Status</th>
                    <th className="px-5 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {deliveries.map((delivery) => (
                    <tr key={delivery.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 whitespace-nowrap font-bold text-gray-900">#{delivery.id}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-600">{delivery.userId || 'N/A'}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-gray-600">{delivery.pharmacistId || 'N/A'}</td>
                      <td className="px-5 py-4 text-gray-700 max-w-xs truncate" title={delivery.description}>
                        {delivery.description || '—'}
                      </td>
                      <td className="px-5 py-4 text-gray-800 font-medium max-w-xs">{delivery.deliveryAddress}</td>
                      <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-600">
                        <div>Start: {delivery.initialDate || 'N/A'}</div>
                        <div>End: {delivery.finalDate || 'N/A'}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        {delivery.coldChainTag ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-cyan-100 text-cyan-800 border border-cyan-200">
                            ❄️ Required
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Standard</span>
                        )}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 inline-flex text-xs font-bold rounded-full ${
                            delivery.status === 'SUCCESSFUL'
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : delivery.status === 'UNSUCCESSFUL'
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                          }`}
                        >
                          {delivery.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'SUCCESSFUL')}
                            className="text-white bg-blue-600 hover:bg-blue-700 p-1.5 rounded-lg transition"
                            title="Mark Successful"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => updateDeliveryStatus(delivery.id, 'UNSUCCESSFUL')}
                            className="text-white bg-red-600 hover:bg-red-700 p-1.5 rounded-lg transition"
                            title="Mark Unsuccessful"
                          >
                            <X className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteDelivery(delivery.id)}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg transition ml-1"
                            title="Delete Delivery"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {deliveries.length === 0 && !deliveriesLoading && (
                    <tr>
                      <td colSpan="9" className="px-6 py-10 text-center text-gray-500">
                        No delivery records found in the database.
                      </td>
                    </tr>
                  )}
                  {deliveriesLoading && (
                    <tr>
                      <td colSpan="9" className="px-6 py-10 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                          <span>Loading deliveries...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: DELIVERY ZONES MANAGEMENT */}
      {/* ========================================================================= */}
      {(activeTab === 'all' || activeTab === 'zones') && (
        <div id="zone-form-section" className="mb-14">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">2. Delivery Zones Management</h2>
            </div>
            {editingZoneId && (
              <button
                onClick={handleCancelZoneEdit}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg font-medium transition"
              >
                Cancel Edit Mode
              </button>
            )}
          </div>

          <p className="text-sm text-gray-600 mb-6">
            Configure coverage cities, postal codes, delivery pricing, estimated times, and active availability in the{' '}
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-blue-700 font-mono text-xs">delivery_zones</code> database table.
          </p>

          {/* Delivery Zone Feedback Messages */}
          {zoneFeedback.message && (
            <div
              className={`p-4 rounded-xl mb-6 flex items-start gap-3 ${
                zoneFeedback.type === 'success'
                  ? 'bg-green-50 border border-green-200 text-green-800'
                  : zoneFeedback.type === 'info'
                  ? 'bg-blue-50 border border-blue-200 text-blue-800'
                  : 'bg-red-50 border border-red-200 text-red-800'
              }`}
            >
              {zoneFeedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
              ) : zoneFeedback.type === 'info' ? (
                <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-sm font-medium">{zoneFeedback.message}</div>
              <button
                onClick={() => setZoneFeedback({ type: '', message: '' })}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ×
              </button>
            </div>
          )}

          {/* Add / Edit Delivery Zone Form */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-8">
            <div className="flex items-center justify-between mb-4 border-b pb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                {editingZoneId ? (
                  <>
                    <Edit3 className="w-5 h-5 text-blue-600" />
                    Edit Delivery Zone #{editingZoneId}
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-5 h-5 text-blue-600" />
                    Add New Delivery Zone
                  </>
                )}
              </h3>
              {editingZoneId && (
                <span className="text-xs bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-semibold">
                  Update Mode
                </span>
              )}
            </div>

            <form onSubmit={handlePublishZone} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Column 1: City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="city"
                    value={zoneForm.city}
                    onChange={handleZoneFormChange}
                    required
                    placeholder="e.g. colombo01, colombo14, kandy"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8"
                  />
                  <MapPin className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
                </div>
              </div>

              {/* Column 2: Postal Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="postal_code"
                  value={zoneForm.postal_code}
                  onChange={handleZoneFormChange}
                  required
                  placeholder="e.g. 0100, 1400, 0900"
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Column 3: Active Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Active Status (<code className="text-xs">is_active</code>) <span className="text-red-500">*</span>
                </label>
                <select
                  name="is_active"
                  value={zoneForm.is_active}
                  onChange={handleZoneFormChange}
                  className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="1">Active (1) - City Available</option>
                  <option value="0">Inactive (0) - City Not Available</option>
                </select>
              </div>

              {/* Column 4: Delivery Fee */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Delivery Fee (Rs.) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    name="delivery_fee"
                    value={zoneForm.delivery_fee}
                    onChange={handleZoneFormChange}
                    required
                    placeholder="e.g. 500"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8"
                  />
                  <DollarSign className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
                </div>
              </div>

              {/* Column 5: Estimated Delivery Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estimated Delivery Time (Mins) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    name="estimated_delivery_time"
                    value={zoneForm.estimated_delivery_time}
                    onChange={handleZoneFormChange}
                    required
                    placeholder="e.g. 30, 60, 120"
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8"
                  />
                  <Clock className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
                </div>
              </div>

              {/* Column 6: Created Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Created Date</label>
                <div className="relative">
                  <input
                    type="date"
                    name="created_at"
                    value={zoneForm.created_at}
                    onChange={handleZoneFormChange}
                    className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8"
                  />
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-3" />
                </div>
              </div>

              {/* Form Actions */}
              <div className="md:col-span-2 lg:col-span-3 flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  disabled={publishingZone}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition font-semibold text-base shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {publishingZone ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Publishing Zone...
                    </>
                  ) : editingZoneId ? (
                    'Update & Publish Zone'
                  ) : (
                    'Publish Delivery Zone'
                  )}
                </button>
                {editingZoneId && (
                  <button
                    type="button"
                    onClick={handleCancelZoneEdit}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-6 rounded-lg font-semibold text-base transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Separate Table: All Delivery Zones */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">All Delivery Zones in Database</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Live records in <code className="font-mono text-blue-600 font-semibold">delivery_zones</code> table ({deliveryZones.length} total zones)
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">
                  Active Zones:{' '}
                  <strong className="text-green-600">
                    {deliveryZones.filter((z) => (z.is_active !== undefined ? z.is_active === 1 : z.isActive === 1)).length}
                  </strong>{' '}
                  | Inactive:{' '}
                  <strong className="text-red-600">
                    {deliveryZones.filter((z) => (z.is_active !== undefined ? z.is_active === 0 : z.isActive === 0)).length}
                  </strong>
                </span>
                <button
                  onClick={fetchDeliveryZones}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${zonesLoading ? 'animate-spin' : ''}`} />
                  Refresh Zones
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5 text-left">ID</th>
                    <th className="px-5 py-3.5 text-left">City</th>
                    <th className="px-5 py-3.5 text-left">Postal Code</th>
                    <th className="px-5 py-3.5 text-left">Active Status</th>
                    <th className="px-5 py-3.5 text-left">Delivery Fee</th>
                    <th className="px-5 py-3.5 text-left">Est. Time</th>
                    <th className="px-5 py-3.5 text-left">Created At</th>
                    <th className="px-5 py-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 text-sm">
                  {deliveryZones.map((zone) => {
                    const isActive = zone.is_active !== undefined ? zone.is_active === 1 : zone.isActive === 1;
                    const fee = zone.delivery_fee !== undefined ? zone.delivery_fee : zone.deliveryFee;
                    const estTime = zone.estimated_delivery_time !== undefined 
                      ? zone.estimated_delivery_time 
                      : (zone.estimatedDeliveryTime || zone.esitmated_delivery_time || zone.esitmatedDeliveryTime);
                    const postal = zone.postal_code || zone.postalCode;
                    const createdAt = zone.created_at || zone.createdAt;

                    return (
                      <tr 
                        key={zone.id} 
                        className={`hover:bg-gray-50 transition-colors ${editingZoneId === zone.id ? 'bg-blue-50/50' : ''}`}
                      >
                        <td className="px-5 py-4 whitespace-nowrap font-bold text-gray-900">#{zone.id}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-semibold text-gray-800 capitalize">{zone.city}</span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-mono text-gray-600">{postal}</td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleZoneStatus(zone.id)}
                            title="Click to toggle active/inactive status"
                            className={`px-3 py-1 inline-flex text-xs font-bold rounded-full transition cursor-pointer ${
                              isActive
                                ? 'bg-green-100 text-green-800 border border-green-300 hover:bg-green-200'
                                : 'bg-red-100 text-red-800 border border-red-300 hover:bg-red-200'
                            }`}
                          >
                            {isActive ? '● Active (1)' : '○ Inactive (0)'}
                          </button>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap font-medium text-gray-800">
                          Rs. {typeof fee === 'number' ? fee.toFixed(2) : fee}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-gray-700">
                          {estTime} mins
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500">
                          {createdAt || '—'}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => handleEditZoneClick(zone)}
                              className="text-white bg-blue-600 hover:bg-blue-700 p-1.5 rounded-lg transition"
                              title="Edit Zone"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteZone(zone.id, zone.city)}
                              className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg transition ml-1"
                              title="Delete Zone"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {deliveryZones.length === 0 && !zonesLoading && (
                    <tr>
                      <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                        No delivery zones registered yet. Fill out the form above to publish your first zone!
                      </td>
                    </tr>
                  )}
                  {zonesLoading && (
                    <tr>
                      <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                        <div className="flex items-center justify-center gap-2">
                          <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                          <span>Loading delivery zones...</span>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPage;
