import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  Calendar,
  Layers,
  KeyRound,
  PauseCircle,
  XCircle,
  Hourglass,
  Phone,
  Mail,
  User,
  Snowflake,
  Search,
  Filter,
  Send,
  ExternalLink,
  Lock,
  ChevronRight,
  Package,
  PlayCircle,
  ListOrdered,
  Bell
} from 'lucide-react';
import { errorMessage } from '../../api/client';
import { deliveryApi } from '../../api/deliveryApi';
import { useAuth } from '../../context/AuthContext';
import useRealtimeChannel, { DELIVERY_EVENT_TYPES } from '../../hooks/useRealtimeChannel';
import useFeatureStatus from '../../hooks/useFeatureStatus';
import FeaturePausedBanner from '../../components/FeaturePausedBanner';

const COURIER_OPTIONS = [
  'DHL',
  'Koombiyo',
  'Lanka Delivery',
  'In Company Delivery'
];

const ROUTE_OPTIONS = [
  'Colombo 1 - 5'
];

const DeliveryPage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const { status: featureStatus } = useFeatureStatus();

  // Tab state: 'management' | 'courier' | 'routes' (No stacked "all sections" layout)
  const [activeTab, setActiveTab] = useState('management');

  // Deliveries State
  const [deliveries, setDeliveries] = useState([]);
  const [deliveriesLoading, setDeliveriesLoading] = useState(true);
  const [deliveryFeedback, setDeliveryFeedback] = useState({ type: '', message: '' });

  // Courier View Deliveries State
  const [courierDeliveries, setCourierDeliveries] = useState([]);
  const [courierLoading, setCourierLoading] = useState(false);
  const [selectedCourierFilter, setSelectedCourierFilter] = useState('ALL');

  // Routes / Zones State
  const [deliveryZones, setDeliveryZones] = useState([]);
  const [zonesLoading, setZonesLoading] = useState(true);
  const [zoneFeedback, setZoneFeedback] = useState({ type: '', message: '' });

  // Filtering & Selection in Management View
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeliveryIds, setSelectedDeliveryIds] = useState([]);

  // Batch Assignment State ('' = keep each customer's chosen courier partner)
  const [batchRoute, setBatchRoute] = useState('Colombo 1 - 5');
  const [batchCourier, setBatchCourier] = useState('');
  const [batchIdInput, setBatchIdInput] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Modals State
  const [isNewDeliveryModalOpen, setIsNewDeliveryModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [targetActionDelivery, setTargetActionDelivery] = useState(null);
  const [actionType, setActionType] = useState('HOLD');
  const [actionReason, setActionReason] = useState('');
  const [actionSubmitting, setActionSubmitting] = useState(false);

  // Courier OTP Modal State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [targetCourierDelivery, setTargetCourierDelivery] = useState(null);
  const [enteredOtp, setEnteredOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSubmitting, setOtpSubmitting] = useState(false);

  // Courier Failure Modal State
  const [isFailureModalOpen, setIsFailureModalOpen] = useState(false);
  const [failureReason, setFailureReason] = useState('');

  // Approval workflow (Reject needs a reason) + timeline viewer
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [timelineTarget, setTimelineTarget] = useState(null);
  const [timelineEntries, setTimelineEntries] = useState([]);

  // Zone Coverage Test in Routes Tab
  const [testCityQuery, setTestCityQuery] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [testingCity, setTestingCity] = useState(false);

  // New Delivery Form
  const [newDeliveryForm, setNewDeliveryForm] = useState({
    customerName: '',
    orderAddress: '',
    customerPhone: '',
    customerEmail: '',
    specialInstructions: '',
    validatingPharmacist: user?.fullName ? `Pharm. ${user.fullName}` : 'Pharm. S. Perera',
    arrangingStaff: 'Dispenser Kamal',
    coldChainTag: false,
    assignedRoute: 'Colombo 1 - 5',
    assignedCourier: 'DHL',
    batchId: ''
  });
  const [creatingDelivery, setCreatingDelivery] = useState(false);

  // Fetch Deliveries for Management View
  const fetchDeliveries = async () => {
    setDeliveriesLoading(true);
    try {
      const data = await deliveryApi.list();
      setDeliveries(Array.isArray(data) ? data : []);
    } catch (error) {
      setDeliveryFeedback({
        type: 'error',
        message: errorMessage(error, 'Could not load deliveries from server.')
      });
    } finally {
      setDeliveriesLoading(false);
    }
  };

  // Fetch Deliveries tailored strictly for Couriers
  const fetchCourierDeliveries = async () => {
    setCourierLoading(true);
    try {
      const data = await deliveryApi.courierQueue(selectedCourierFilter);
      setCourierDeliveries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching courier deliveries:', error);
    } finally {
      setCourierLoading(false);
    }
  };

  // Fetch Delivery Routes / Zones
  const fetchDeliveryZones = async () => {
    setZonesLoading(true);
    try {
      const data = await deliveryApi.zones();
      setDeliveryZones(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching delivery zones:', error);
    } finally {
      setZonesLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
    fetchCourierDeliveries();
    fetchDeliveryZones();
  }, []);

  useEffect(() => {
    if (activeTab === 'courier') {
      fetchCourierDeliveries();
    }
  }, [activeTab, selectedCourierFilter]);

  // Live updates: the backend's DeliveryRealtimeObserver publishes every delivery event on the
  // "deliveries" channel, so a customer's confirmed order shows up here without refreshing.
  const [liveNotice, setLiveNotice] = useState(null);
  useRealtimeChannel('deliveries', DELIVERY_EVENT_TYPES, (type, payload) => {
    if (type === 'DELIVERY_REQUESTED') {
      setLiveNotice({ id: payload?.deliveryId, message: payload?.message });
    }
    fetchDeliveries();
    if (activeTab === 'courier') fetchCourierDeliveries();
  });

  // Handle New Delivery Input
  const handleNewDeliveryChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewDeliveryForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Submit New Delivery (POST /api/deliveries)
  const handleCreateDelivery = async (e) => {
    e.preventDefault();
    setCreatingDelivery(true);
    setDeliveryFeedback({ type: '', message: '' });

    try {
      const payload = {
        ...newDeliveryForm,
        specialInstructions: newDeliveryForm.coldChainTag
          ? `${newDeliveryForm.specialInstructions ? newDeliveryForm.specialInstructions + ' | ' : ''}Cold Chain Refrigerator Required (2-8°C)`
          : newDeliveryForm.specialInstructions
      };

      const created = await deliveryApi.record(payload);
      setDeliveryFeedback({
        type: 'success',
        message: `Delivery #DEL-${created?.id || ''} recorded and added to the approval queue.`
      });

      // Reset form
      setNewDeliveryForm({
        customerName: '',
        orderAddress: '',
        customerPhone: '',
        customerEmail: '',
        specialInstructions: '',
        validatingPharmacist: user?.fullName ? `Pharm. ${user.fullName}` : 'Pharm. S. Perera',
        arrangingStaff: 'Dispenser Kamal',
        coldChainTag: false,
        assignedRoute: 'Colombo 1 - 5',
        assignedCourier: 'DHL',
        batchId: ''
      });
      setIsNewDeliveryModalOpen(false);
      fetchDeliveries();
      fetchCourierDeliveries();
    } catch (error) {
      setDeliveryFeedback({
        type: 'error',
        message: errorMessage(error, 'Failed to create delivery.')
      });
    } finally {
      setCreatingDelivery(false);
    }
  };

  // Checkbox Selection
  // Only APPROVED (or FAILED / already dispatched for re-assignment) deliveries can get a courier.
  const canAssign = (d) => (d.nextStatuses || []).includes('DISPATCHED');

  const toggleSelectAll = () => {
    const assignable = filteredDeliveries.filter(canAssign);
    if (assignable.length > 0 && selectedDeliveryIds.length === assignable.length) {
      setSelectedDeliveryIds([]);
    } else {
      setSelectedDeliveryIds(assignable.map((d) => d.id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedDeliveryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Batch Assignment (PUT /api/deliveries/assign)
  const handleAssignBatch = async () => {
    if (selectedDeliveryIds.length === 0) return;
    setIsAssigning(true);
    setDeliveryFeedback({ type: '', message: '' });

    try {
      const payload = {
        deliveryIds: selectedDeliveryIds,
        batchId: batchIdInput.trim() || undefined,
        route: batchRoute,
        courier: batchCourier || undefined
      };

      await deliveryApi.assign(payload);
      setDeliveryFeedback({
        type: 'success',
        message: `Assigned ${selectedDeliveryIds.length} delivery(ies) to ${batchCourier || "each customer's chosen partner"} on route ${batchRoute}. Customers received their handover OTP.`
      });
      setSelectedDeliveryIds([]);
      setBatchIdInput('');
      fetchDeliveries();
      fetchCourierDeliveries();
    } catch (error) {
      setDeliveryFeedback({
        type: 'error',
        message: errorMessage(error, 'Failed to assign deliveries.')
      });
    } finally {
      setIsAssigning(false);
    }
  };

  // Action Submission (PUT /api/deliveries/{id}/action)
  const handlePerformAction = async () => {
    if (!targetActionDelivery) return;
    setActionSubmitting(true);
    setDeliveryFeedback({ type: '', message: '' });

    try {
      const id = targetActionDelivery.id || targetActionDelivery.deliveryId;
      await deliveryApi.action(id, actionType, actionReason);
      setDeliveryFeedback({
        type: 'success',
        message: `Action ${actionType} executed successfully on Delivery #${id}.`
      });
      setIsActionModalOpen(false);
      setTargetActionDelivery(null);
      setActionReason('');
      fetchDeliveries();
      fetchCourierDeliveries();
    } catch (error) {
      setDeliveryFeedback({
        type: 'error',
        message: errorMessage(error, `Failed to execute action ${actionType}.`)
      });
    } finally {
      setActionSubmitting(false);
    }
  };

  // Courier Status Update: Direct IN_TRANSIT
  const handleCourierMarkTransit = async (deliveryId) => {
    try {
      await deliveryApi.courierUpdate(deliveryId, { status: 'IN_TRANSIT' });
      fetchCourierDeliveries();
      fetchDeliveries();
    } catch (error) {
      setDeliveryFeedback({ type: 'error', message: errorMessage(error, 'Could not update status to IN_TRANSIT') });
    }
  };

  // Courier Status Update: FAILED
  const handleCourierMarkFailed = async () => {
    if (!targetCourierDelivery) return;
    const id = targetCourierDelivery.deliveryId || targetCourierDelivery.id;
    try {
      await deliveryApi.courierUpdate(id, {
        status: 'FAILED',
        failureReason: failureReason || 'Customer unreachable / delivery issue'
      });
      setIsFailureModalOpen(false);
      setTargetCourierDelivery(null);
      setFailureReason('');
      fetchCourierDeliveries();
      fetchDeliveries();
    } catch (error) {
      setDeliveryFeedback({ type: 'error', message: errorMessage(error, 'Could not mark delivery as FAILED') });
      setIsFailureModalOpen(false);
    }
  };

  // Courier Status Update: DELIVERED with strict OTP Verification
  const handleCourierVerifyOtpAndDeliver = async (e) => {
    e.preventDefault();
    if (!targetCourierDelivery) return;
    setOtpError('');
    setOtpSubmitting(true);

    const id = targetCourierDelivery.deliveryId || targetCourierDelivery.id;
    try {
      await deliveryApi.courierUpdate(id, {
        status: 'DELIVERED',
        otp: enteredOtp.trim()
      });
      setIsOtpModalOpen(false);
      setTargetCourierDelivery(null);
      setEnteredOtp('');
      fetchCourierDeliveries();
      fetchDeliveries();
    } catch (error) {
      setOtpError(errorMessage(error, 'Invalid OTP. Handover verification failed.'));
      fetchCourierDeliveries();
    } finally {
      setOtpSubmitting(false);
    }
  };

  // Approval workflow: PENDING -> APPROVED (then assign courier) or PENDING -> REJECTED
  const handleApprove = async (delivery) => {
    setBusyId(delivery.id);
    setDeliveryFeedback({ type: '', message: '' });
    try {
      await deliveryApi.approve(delivery.id);
      setDeliveryFeedback({
        type: 'success',
        message: `Delivery #DEL-${delivery.id} approved. Select it and use "Assign & Dispatch" to hand it to ${delivery.preferredCourier || 'a courier'}.`
      });
      setStatusFilter('APPROVED');
      fetchDeliveries();
    } catch (error) {
      setDeliveryFeedback({ type: 'error', message: errorMessage(error, 'Could not approve delivery.') });
    } finally {
      setBusyId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (rejectReason.trim().length < 5) {
      setRejectError('Please give the customer a reason (at least 5 characters).');
      return;
    }
    setBusyId(rejectTarget.id);
    try {
      await deliveryApi.reject(rejectTarget.id, rejectReason.trim());
      setDeliveryFeedback({ type: 'success', message: `Delivery #DEL-${rejectTarget.id} rejected. The customer has been notified.` });
      setRejectTarget(null);
      setRejectReason('');
      setRejectError('');
      fetchDeliveries();
    } catch (error) {
      setRejectError(errorMessage(error, 'Could not reject delivery.'));
    } finally {
      setBusyId(null);
    }
  };

  const handleResume = async (delivery) => {
    setBusyId(delivery.id);
    try {
      await deliveryApi.action(delivery.id, 'RESUME', '');
      fetchDeliveries();
    } catch (error) {
      setDeliveryFeedback({ type: 'error', message: errorMessage(error, 'Could not resume delivery.') });
    } finally {
      setBusyId(null);
    }
  };

  const handleRegenerateOtp = async (delivery) => {
    setBusyId(delivery.id);
    try {
      await deliveryApi.regenerateOtp(delivery.id);
      setDeliveryFeedback({ type: 'success', message: `A new handover OTP was issued to the customer of #DEL-${delivery.id}.` });
      fetchDeliveries();
    } catch (error) {
      setDeliveryFeedback({ type: 'error', message: errorMessage(error, 'Could not regenerate OTP.') });
    } finally {
      setBusyId(null);
    }
  };

  const openTimeline = async (delivery) => {
    setTimelineTarget(delivery);
    setTimelineEntries([]);
    try {
      setTimelineEntries(await deliveryApi.timeline(delivery.id));
    } catch (error) {
      setTimelineEntries([{ description: errorMessage(error, 'Could not load timeline.') }]);
    }
  };

  // Test Zone Coverage
  const handleTestCoverage = async (e) => {
    e.preventDefault();
    if (!testCityQuery.trim()) return;
    setTestingCity(true);
    setTestResult(null);

    try {
      setTestResult(await deliveryApi.checkZone(testCityQuery));
    } catch (err) {
      setTestResult({ available: false, message: 'Check failed' });
    } finally {
      setTestingCity(false);
    }
  };

  // Toggle Route Status
  const handleToggleZone = async (zoneId) => {
    try {
      await deliveryApi.toggleZone(zoneId);
      fetchDeliveryZones();
    } catch (err) {
      setZoneFeedback({ type: 'error', message: errorMessage(err, 'Could not toggle the zone.') });
    }
  };

  // Filtered Deliveries in Management View
  const filteredDeliveries = useMemo(() => {
    return deliveries.filter((d) => {
      const matchesStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIONS'
          ? ['ON_HOLD', 'TERMINATED', 'POSTPONED'].includes(d.status)
          : statusFilter === 'FAILED'
          ? ['FAILED', 'REJECTED'].includes(d.status)
          : d.status === statusFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (d.id && String(d.id).includes(q)) ||
        (d.batchId && d.batchId.toLowerCase().includes(q)) ||
        (d.customerName && d.customerName.toLowerCase().includes(q)) ||
        (d.customerPhone && d.customerPhone.includes(q)) ||
        (d.orderAddress && d.orderAddress.toLowerCase().includes(q)) ||
        (d.assignedCourier && d.assignedCourier.toLowerCase().includes(q)) ||
        (d.preferredCourier && d.preferredCourier.toLowerCase().includes(q));

      return matchesStatus && matchesSearch;
    });
  }, [deliveries, statusFilter, searchQuery]);

  // Counts for Management Filter Tabs
  const counts = useMemo(() => {
    const res = {
      ALL: deliveries.length,
      PENDING: 0,
      APPROVED: 0,
      DISPATCHED: 0,
      IN_TRANSIT: 0,
      DELIVERED: 0,
      FAILED: 0,
      ACTIONS: 0
    };
    deliveries.forEach((d) => {
      if (res[d.status] !== undefined) res[d.status]++;
      if (d.status === 'REJECTED') res.FAILED++;
      if (['ON_HOLD', 'TERMINATED', 'POSTPONED'].includes(d.status)) res.ACTIONS++;
    });
    return res;
  }, [deliveries]);

  // Status Badge Helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-amber-50 text-amber-700 border border-amber-200">PENDING APPROVAL</span>;
      case 'APPROVED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-teal-50 text-teal-700 border border-teal-200">APPROVED</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-300">REJECTED</span>;
      case 'DISPATCHED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">COURIER ASSIGNED</span>;
      case 'IN_TRANSIT':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200 animate-pulse">IN TRANSIT</span>;
      case 'DELIVERED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">DELIVERED</span>;
      case 'FAILED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-rose-50 text-rose-700 border border-rose-200">FAILED</span>;
      case 'ON_HOLD':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-50 text-purple-700 border border-purple-200">ON HOLD</span>;
      case 'TERMINATED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-300">TERMINATED</span>;
      case 'POSTPONED':
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-orange-50 text-orange-700 border border-orange-200">POSTPONED</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-100 text-gray-700 border border-gray-200">{status || 'UNKNOWN'}</span>;
    }
  };

  return (
    <div className="bg-[#fcfbf9] min-h-screen text-neutral-900 pb-20 font-sans">
      {/* ========================================================= */}
      {/* HEADER: Pharma+ Logo and User Profile / Logout            */}
      {/* ========================================================= */}
      <header className="w-full bg-white border-b border-neutral-200/80 px-4 sm:px-6 lg:px-12 py-3.5 mb-6 shadow-xs sticky top-0 z-30">
        <div className="max-w-[1536px] mx-auto flex items-center justify-between">
          <div>
            <Link
              to="/modules/delivery"
              className="flex items-center gap-1 font-sans font-black text-xl sm:text-2xl tracking-tight uppercase text-black hover:opacity-90 transition-opacity"
            >
              <span>PHARMA</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-black shadow-sm">
                +
              </span>
            </Link>
            <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-bold tracking-wide shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Fleet Dispatch, Geofenced Routes & Courier Verification</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated && user && (
              <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                <Shield className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                {user.fullName} ({user.role})
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                logout();
                navigate('/login/admin');
              }}
              title="Log Out"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 hover:bg-red-50 text-neutral-700 hover:text-red-600 text-xs font-bold uppercase tracking-wider transition-colors border border-neutral-200 shadow-2xs cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12">
        {/* Workspace Title & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
              Delivery Operations & Courier Center
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              Dispatch customer deliveries, assign couriers with multi-order batching, and verify OTP handovers.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                fetchDeliveries();
                fetchCourierDeliveries();
                fetchDeliveryZones();
              }}
              title="Refresh All Data"
              className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-black text-white flex items-center justify-center shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${deliveriesLoading || courierLoading || zonesLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={() => setIsNewDeliveryModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Record New Delivery</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {deliveryFeedback.message && (
          <div
            className={`p-4 rounded-xl mb-6 flex items-start gap-3 transition-all ${
              deliveryFeedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                : 'bg-red-50 text-red-900 border border-red-200'
            }`}
          >
            {deliveryFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-sm font-medium">{deliveryFeedback.message}</div>
            <button
              onClick={() => setDeliveryFeedback({ type: '', message: '' })}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <FeaturePausedBanner title="Delivery dispatching" info={featureStatus.DELIVERY} />

        {/* Live notice: a customer just confirmed an order */}
        {liveNotice && (
          <div className="p-4 rounded-xl mb-6 flex items-start gap-3 bg-amber-50 text-amber-900 border border-amber-200" role="status">
            <Bell className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
            <div className="flex-1 text-sm font-medium">
              <strong>New delivery request #DEL-{liveNotice.id}</strong> — {liveNotice.message}.
            </div>
            <button
              type="button"
              onClick={() => {
                setActiveTab('management');
                setStatusFilter('PENDING');
                setLiveNotice(null);
              }}
              className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shrink-0"
            >
              Review
            </button>
            <button onClick={() => setLiveNotice(null)} className="text-amber-500 hover:text-amber-700" aria-label="Dismiss">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB NAVIGATION: Strictly isolated tabs (NO vertical stacking!)            */}
        {/* ========================================================================= */}
        <div className="flex border-b border-gray-200 mb-8 bg-white rounded-t-xl px-2 shadow-xs">
          <button
            type="button"
            onClick={() => setActiveTab('management')}
            className={`py-3.5 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'management'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>Delivery Management</span>
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 font-semibold">
              {deliveries.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('courier')}
            className={`py-3.5 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'courier'
                ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Courier Dashboard</span>
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-indigo-100 text-indigo-800 font-semibold">
              {courierDeliveries.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('routes')}
            className={`py-3.5 px-6 text-sm font-bold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'routes'
                ? 'border-emerald-600 text-emerald-700 bg-emerald-50/50'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Delivery Routes & Geofencing</span>
            <span className="ml-1.5 px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-700 font-semibold">
              {deliveryZones.length}
            </span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* VIEW 1: DELIVERY MANAGEMENT (ONLY RENDERS WHEN activeTab === 'management') */}
        {/* ========================================================================= */}
        {activeTab === 'management' && (
          <div className="space-y-6">
            {/* Filter Tabs & Search Bar */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
              {/* Status Pills */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: 'ALL', label: 'All', count: counts.ALL },
                  { id: 'PENDING', label: 'Pending Approval', count: counts.PENDING, color: 'text-amber-700 bg-amber-50' },
                  { id: 'APPROVED', label: 'Approved', count: counts.APPROVED, color: 'text-teal-700 bg-teal-50' },
                  { id: 'DISPATCHED', label: 'With Courier', count: counts.DISPATCHED, color: 'text-indigo-700 bg-indigo-50' },
                  { id: 'IN_TRANSIT', label: 'In Transit', count: counts.IN_TRANSIT, color: 'text-blue-700 bg-blue-50' },
                  { id: 'DELIVERED', label: 'Delivered', count: counts.DELIVERED, color: 'text-emerald-700 bg-emerald-50' },
                  { id: 'FAILED', label: 'Failed / Rejected', count: counts.FAILED, color: 'text-rose-700 bg-rose-50' },
                  { id: 'ACTIONS', label: 'On Hold / Postponed', count: counts.ACTIONS, color: 'text-purple-700 bg-purple-50' }
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStatusFilter(pill.id)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      statusFilter === pill.id
                        ? 'bg-zinc-900 text-white shadow-xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    <span>{pill.label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${pill.color || 'bg-white/20 text-white'}`}>
                      {pill.count}
                    </span>
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search recipient, address, batch..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl text-xs bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* BATCH ASSIGNMENT TOOLBAR (Appears when items are selected) */}
            {selectedDeliveryIds.length > 0 && (
              <div className="bg-gradient-to-r from-zinc-900 to-neutral-900 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-neutral-800 flex flex-wrap items-center justify-between gap-4 animate-in fade-in slide-in-from-top duration-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                    {selectedDeliveryIds.length}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold tracking-tight">Batch Assignment & Dispatch</h3>
                    <p className="text-xs text-neutral-400">
                      Assign the selected approved orders to a route and courier partner.
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* Route Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Route</label>
                    <select
                      value={batchRoute}
                      onChange={(e) => setBatchRoute(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-emerald-500"
                    >
                      {ROUTE_OPTIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  {/* Courier Dropdown */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Courier Partner</label>
                    <select
                      value={batchCourier}
                      onChange={(e) => setBatchCourier(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-neutral-800 border border-neutral-700 text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="">Customer's choice</option>
                      {COURIER_OPTIONS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Custom Batch ID */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-neutral-400 mb-1">Batch Code (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. BATCH-01"
                      maxLength={40}
                      value={batchIdInput}
                      onChange={(e) => setBatchIdInput(e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-neutral-800 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500 w-32"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-4">
                    <button
                      type="button"
                      onClick={handleAssignBatch}
                      disabled={isAssigning}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isAssigning ? 'Dispatching...' : 'Assign & Dispatch'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedDeliveryIds([])}
                      className="px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Comprehensive Deliveries Table (Containing all 2A fields) */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50/75 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="p-4 w-12 text-center">
                        <input
                          type="checkbox"
                          checked={
                            filteredDeliveries.some(canAssign) &&
                            selectedDeliveryIds.length === filteredDeliveries.filter(canAssign).length
                          }
                          onChange={toggleSelectAll}
                          title="Select all approved deliveries"
                          className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-4">Delivery & Batch</th>
                      <th className="p-4">Customer Recipient</th>
                      <th className="p-4">Order Address</th>
                      <th className="p-4">Instructions / Cold Chain</th>
                      <th className="p-4">Validating Pharmacist & Staff</th>
                      <th className="p-4">Courier (chosen / assigned)</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/70">
                    {deliveriesLoading ? (
                      <tr>
                        <td colSpan="9" className="p-12 text-center text-neutral-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                          <span>Loading deliveries...</span>
                        </td>
                      </tr>
                    ) : filteredDeliveries.length === 0 ? (
                      <tr>
                        <td colSpan="9" className="p-12 text-center text-neutral-500">
                          <Package className="w-8 h-8 mx-auto mb-2 text-neutral-300" />
                          <p className="font-semibold text-neutral-700">No deliveries found matching filters.</p>
                          <p className="text-xs text-neutral-400 mt-1">Customer orders appear here automatically when they confirm checkout.</p>
                        </td>
                      </tr>
                    ) : (
                      filteredDeliveries.map((delivery) => {
                        const id = delivery.id || delivery.deliveryId;
                        const isSelected = selectedDeliveryIds.includes(id);

                        return (
                          <tr
                            key={id}
                            className={`hover:bg-neutral-50/70 transition-colors ${
                              isSelected ? 'bg-emerald-50/40' : ''
                            }`}
                          >
                            {/* Checkbox */}
                            <td className="p-4 text-center">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={!canAssign(delivery)}
                                onChange={() => toggleSelectOne(id)}
                                title={canAssign(delivery) ? 'Select for courier assignment' : 'Approve this delivery before assigning a courier'}
                                className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                              />
                            </td>

                            {/* Delivery & Batch */}
                            <td className="p-4 font-mono">
                              <div className="font-bold text-neutral-900 flex items-center gap-1">
                                <span>#DEL-{id}</span>
                              </div>
                              {delivery.batchId ? (
                                <span className="inline-block mt-1 px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-[10px]">
                                  {delivery.batchId}
                                </span>
                              ) : (
                                <span className="text-[10px] text-neutral-400 italic">Individual</span>
                              )}
                              {delivery.orderId && (
                                <div className="text-[10px] text-neutral-500 mt-1 font-sans">Order #{delivery.orderId}</div>
                              )}
                              {delivery.orderTotal != null && (
                                <div className="text-[10px] font-bold text-emerald-800 font-sans">
                                  LKR {Number(delivery.orderTotal).toLocaleString('en-LK', { minimumFractionDigits: 2 })}
                                </div>
                              )}
                            </td>

                            {/* Customer Recipient */}
                            <td className="p-4">
                              <div className="font-bold text-neutral-900 flex items-center gap-1">
                                <User className="w-3 h-3 text-neutral-400" />
                                <span>{delivery.customerName || 'N/A'}</span>
                              </div>
                              {delivery.customerPhone && (
                                <div className="text-neutral-500 text-[11px] mt-0.5 flex items-center gap-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{delivery.customerPhone}</span>
                                </div>
                              )}
                              {delivery.customerEmail && (
                                <div className="text-neutral-400 text-[10px] flex items-center gap-1">
                                  <Mail className="w-2.5 h-2.5" />
                                  <span>{delivery.customerEmail}</span>
                                </div>
                              )}
                            </td>

                            {/* Order Address */}
                            <td className="p-4 max-w-xs">
                              <div className="flex items-start gap-1 text-neutral-700">
                                <MapPin className="w-3 h-3 text-neutral-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-2">{delivery.orderAddress || delivery.deliveryAddress || 'Standard Address'}</span>
                              </div>
                            </td>

                            {/* Instructions & Cold Chain */}
                            <td className="p-4 max-w-xs">
                              {delivery.coldChainTag && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-[10px] font-bold mb-1">
                                  <Snowflake className="w-2.5 h-2.5 text-cyan-600" />
                                  Cold Chain (2-8°C)
                                </span>
                              )}
                              {delivery.itemsSummary && (
                                <p className="text-neutral-800 text-[11px] font-semibold line-clamp-2">{delivery.itemsSummary}</p>
                              )}
                              <p className="text-neutral-600 text-[11px] line-clamp-2">
                                {delivery.specialInstructions || 'Standard Handling'}
                              </p>
                            </td>

                            {/* Validating Pharmacist & Staff */}
                            <td className="p-4">
                              <div className="text-neutral-800 font-semibold text-[11px]">
                                {delivery.validatingPharmacist || 'Dr. Pending Verification'}
                              </div>
                              <div className="text-neutral-400 text-[10px]">
                                Pack: {delivery.arrangingStaff || 'Fulfillment Staff'}
                              </div>
                            </td>

                            {/* Route & Courier */}
                            <td className="p-4">
                              <div className="text-[10px] text-neutral-500">
                                Customer chose: <strong className="text-neutral-800">{delivery.preferredCourier || '—'}</strong>
                              </div>
                              <div className="font-bold text-neutral-800 mt-0.5">
                                {delivery.assignedCourier || <span className="text-neutral-400 font-normal">Not assigned yet</span>}
                              </div>
                              <div className="text-[10px] text-neutral-500">
                                {delivery.assignedRoute || 'No Route'}
                              </div>
                            </td>

                            {/* Status & Customer OTP */}
                            <td className="p-4">
                              <div>{renderStatusBadge(delivery.status)}</div>
                              {delivery.otpIssued && (
                                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200 text-[10px] font-bold text-zinc-700" title="The code is only visible to the customer">
                                  <KeyRound className="w-2.5 h-2.5 text-amber-600" />
                                  <span>OTP sent to customer{delivery.otpAttempts > 0 ? ` · ${delivery.otpAttempts} wrong` : ''}</span>
                                </div>
                              )}
                              {delivery.actionReason && (
                                <div className="text-[10px] text-red-600 mt-1 italic">
                                  Reason: {delivery.actionReason}
                                </div>
                              )}
                            </td>

                            {/* Row actions: only those allowed by the delivery's current status */}
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                {delivery.status === 'PENDING' && (
                                  <>
                                    <button
                                      type="button"
                                      disabled={busyId === id}
                                      onClick={() => handleApprove(delivery)}
                                      title="Approve delivery request"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold disabled:opacity-50"
                                    >
                                      <Check className="w-3.5 h-3.5" /> Approve
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setRejectTarget(delivery);
                                        setRejectReason('');
                                        setRejectError('');
                                      }}
                                      title="Reject delivery request"
                                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-[11px] font-bold"
                                    >
                                      <X className="w-3.5 h-3.5" /> Reject
                                    </button>
                                  </>
                                )}
                                {canAssign(delivery) && !isSelected && delivery.status === 'APPROVED' && (
                                  <button
                                    type="button"
                                    onClick={() => toggleSelectOne(id)}
                                    title="Select for courier assignment"
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold"
                                  >
                                    <Send className="w-3.5 h-3.5" /> Assign
                                  </button>
                                )}
                                {['ON_HOLD', 'POSTPONED'].includes(delivery.status) && (
                                  <button
                                    type="button"
                                    disabled={busyId === id}
                                    onClick={() => handleResume(delivery)}
                                    title="Resume delivery"
                                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600 transition-colors"
                                  >
                                    <PlayCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {['DISPATCHED', 'IN_TRANSIT'].includes(delivery.status) && (
                                  <button
                                    type="button"
                                    disabled={busyId === id}
                                    onClick={() => handleRegenerateOtp(delivery)}
                                    title="Send the customer a new OTP"
                                    className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                                  >
                                    <KeyRound className="w-4 h-4" />
                                  </button>
                                )}
                                {(delivery.nextStatuses || []).includes('ON_HOLD') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTargetActionDelivery(delivery);
                                      setActionType('HOLD');
                                      setIsActionModalOpen(true);
                                    }}
                                    title="Hold / postpone / terminate"
                                    className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-600 transition-colors"
                                  >
                                    <PauseCircle className="w-4 h-4" />
                                  </button>
                                )}
                                {(delivery.nextStatuses || []).includes('TERMINATED') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setTargetActionDelivery(delivery);
                                      setActionType('TERMINATE');
                                      setIsActionModalOpen(true);
                                    }}
                                    title="Terminate Delivery"
                                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-600 transition-colors"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => openTimeline(delivery)}
                                  title="View delivery timeline"
                                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-600 transition-colors"
                                >
                                  <ListOrdered className="w-4 h-4" />
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
        )}

        {/* ========================================================================= */}
        {/* VIEW 2: COURIER DASHBOARD (ONLY RENDERS WHEN activeTab === 'courier')      */}
        {/* Strictly displays: ID/Batch, Recipient, Order Address, Phone + Actions    */}
        {/* ========================================================================= */}
        {activeTab === 'courier' && (
          <div className="space-y-6">
            {/* Courier Persona Selector */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="text-sm font-bold text-neutral-900">Courier Partner Work Queue</h3>
                  <p className="text-xs text-neutral-500">
                    Handover parcels, record transit milestones, and verify customer OTP on delivery.
                  </p>
                </div>
              </div>

              {/* Courier Filter */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-500">Partner Filter:</span>
                <select
                  value={selectedCourierFilter}
                  onChange={(e) => setSelectedCourierFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg bg-neutral-50 border border-neutral-200 font-bold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="ALL">All Assigned Partners</option>
                  {COURIER_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Courier Orders Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {courierLoading ? (
                <div className="col-span-full p-12 text-center text-neutral-500 bg-white rounded-2xl border border-neutral-200/80">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                  <span>Loading courier orders...</span>
                </div>
              ) : courierDeliveries.length === 0 ? (
                <div className="col-span-full p-12 text-center text-neutral-500 bg-white rounded-2xl border border-neutral-200/80">
                  <Package className="w-10 h-10 mx-auto mb-2 text-neutral-300" />
                  <p className="font-bold text-neutral-800">No parcels assigned to couriers yet.</p>
                  <p className="text-xs text-neutral-400 mt-1">
                    Approve orders in Delivery Management, then use "Assign &amp; Dispatch".
                  </p>
                </div>
              ) : (
                courierDeliveries.map((item) => {
                  const id = item.deliveryId || item.id;
                  const isDelivered = item.status === 'DELIVERED';
                  const isFailed = item.status === 'FAILED';

                  return (
                    <div
                      key={id}
                      className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
                    >
                      {/* Top Header */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-neutral-900">
                              #DEL-{id}
                            </span>
                            {item.batchId && (
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[10px]">
                                {item.batchId}
                              </span>
                            )}
                          </div>
                          <div>{renderStatusBadge(item.status)}</div>
                        </div>

                        {/* Partner Tag */}
                        {item.assignedCourier && (
                          <div className="mb-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 text-[10px] font-bold">
                            <Truck className="w-2.5 h-2.5 text-neutral-500" />
                            <span>{item.assignedCourier}</span>
                            {item.assignedRoute && <span>• {item.assignedRoute}</span>}
                          </div>
                        )}

                        {/* Strictly Required Recipient Information */}
                        <div className="space-y-2.5 mt-2 pt-2 border-t border-neutral-100">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Recipient</span>
                            <div className="font-bold text-sm text-neutral-900 flex items-center gap-1.5 mt-0.5">
                              <User className="w-3.5 h-3.5 text-neutral-400" />
                              <span>{item.customerName || 'Customer'}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Delivery Address</span>
                            <div className="text-xs text-neutral-700 flex items-start gap-1.5 mt-0.5">
                              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <span>{item.orderAddress || 'Colombo Delivery Point'}</span>
                            </div>
                          </div>

                          <div>
                            <span className="text-[10px] uppercase font-bold text-neutral-400 block">Phone Contact</span>
                            <div className="text-xs font-semibold text-neutral-900 flex items-center gap-1.5 mt-0.5">
                              <Phone className="w-3.5 h-3.5 text-indigo-600" />
                              <a href={`tel:${item.customerPhone}`} className="hover:underline">
                                {item.customerPhone || 'Not Provided'}
                              </a>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Courier Actions */}
                      <div className="mt-5 pt-4 border-t border-neutral-100 space-y-2">
                        {!isDelivered && !isFailed ? (
                          <>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => handleCourierMarkTransit(id)}
                                disabled={item.status !== 'DISPATCHED'}
                                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                  item.status === 'IN_TRANSIT'
                                    ? 'bg-blue-100 text-blue-800 border border-blue-200 cursor-default'
                                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                                }`}
                              >
                                <Truck className="w-3.5 h-3.5" />
                                <span>{item.status === 'IN_TRANSIT' ? 'In Transit' : 'Picked Up'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setTargetCourierDelivery(item);
                                  setIsFailureModalOpen(true);
                                }}
                                className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 transition-all flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Mark Failed</span>
                              </button>
                            </div>

                            <button
                              type="button"
                              disabled={item.status !== 'IN_TRANSIT'}
                              title={item.status !== 'IN_TRANSIT' ? 'Mark the parcel as picked up first' : undefined}
                              onClick={() => {
                                setTargetCourierDelivery(item);
                                setEnteredOtp('');
                                setOtpError('');
                                setIsOtpModalOpen(true);
                              }}
                              className="w-full py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Handover Parcel (Verify Customer OTP)</span>
                            </button>
                          </>
                        ) : isDelivered ? (
                          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 border border-emerald-200">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Handover Completed & Verified</span>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-800 text-xs font-bold text-center flex items-center justify-center gap-1.5 border border-rose-200">
                            <AlertCircle className="w-4 h-4 text-rose-600" />
                            <span>Delivery Failed</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VIEW 3: GEOFENCED ROUTES (ONLY RENDERS WHEN activeTab === 'routes')       */}
        {/* Strictly displays: Colombo 1 - 5 Route and Geofence Verification          */}
        {/* ========================================================================= */}
        {activeTab === 'routes' && (
          <div className="space-y-6">
            {/* Active Route Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs md:col-span-2">
                <div className="flex items-center justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-base font-black uppercase text-neutral-900 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-emerald-600" />
                      <span>Colombo 1 - 5 Active Geofenced Route</span>
                    </h3>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      Standard operational fulfillment boundary for high-priority express deliveries.
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
                    Active Route
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-neutral-100">
                  <div className="p-3 rounded-xl bg-neutral-50">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 block">Coverage Area</span>
                    <span className="text-sm font-black text-neutral-900 mt-1 block">Colombo 1 - 5</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 block">Postal Codes</span>
                    <span className="text-sm font-black text-neutral-900 mt-1 block">0100 - 0500</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 block">Delivery Fee</span>
                    <span className="text-sm font-black text-emerald-700 mt-1 block">500 Rs</span>
                  </div>
                  <div className="p-3 rounded-xl bg-neutral-50">
                    <span className="text-[10px] font-bold uppercase text-neutral-400 block">Estimated Time</span>
                    <span className="text-sm font-black text-neutral-900 mt-1 block">1 Hour</span>
                  </div>
                </div>
              </div>

              {/* Live Geofence Tester */}
              <div className="bg-white rounded-2xl p-6 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-bold text-neutral-900 mb-1">Verify Geofence Address</h4>
                  <p className="text-xs text-neutral-500 mb-4">
                    Test if a customer location qualifies for express fulfillment.
                  </p>
                  <form onSubmit={handleTestCoverage} className="space-y-3">
                    <input
                      type="text"
                      placeholder="e.g. Colombo 03 or 0300"
                      value={testCityQuery}
                      onChange={(e) => setTestCityQuery(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                    <button
                      type="submit"
                      disabled={testingCity}
                      className="w-full py-2 rounded-xl bg-zinc-900 hover:bg-black text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                    >
                      {testingCity ? 'Verifying...' : 'Check Geofence Availability'}
                    </button>
                  </form>
                </div>

                {testResult && (
                  <div className={`mt-4 p-3 rounded-xl text-xs font-semibold ${
                    testResult.available
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      : 'bg-rose-50 text-rose-900 border border-rose-200'
                  }`}>
                    {testResult.available ? (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Deliverable to {testResult.city} (Fee: {testResult.delivery_fee} Rs)</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-600" />
                        <span>Outside active Colombo 1 - 5 geofenced zone.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Configured Delivery Zones Table */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-neutral-100 flex items-center justify-between">
                <h4 className="text-sm font-bold text-neutral-900">Seeded Delivery Zones Database</h4>
                <span className="text-xs text-neutral-500">{deliveryZones.length} configured zone(s)</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-600 font-bold uppercase text-[11px]">
                    <tr>
                      <th className="p-4">ID</th>
                      <th className="p-4">City / Sector</th>
                      <th className="p-4">Postal Code Range</th>
                      <th className="p-4">Delivery Fee</th>
                      <th className="p-4">Est. Delivery Time</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Toggle Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200/70">
                    {deliveryZones.map((z) => (
                      <tr key={z.id} className="hover:bg-neutral-50/70">
                        <td className="p-4 font-mono font-bold text-neutral-500">#{z.id}</td>
                        <td className="p-4 font-bold text-neutral-900">{z.city}</td>
                        <td className="p-4 font-mono text-neutral-600">{z.postal_code || z.postalCode}</td>
                        <td className="p-4 font-bold text-emerald-700">{z.delivery_fee || z.deliveryFee} Rs</td>
                        <td className="p-4 text-neutral-700">{z.estimated_delivery_time || z.estimatedDeliveryTime || 60} mins (1 hr)</td>
                        <td className="p-4">
                          {(z.is_active === 1 || z.isActive === 1) ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-600 border border-neutral-200 text-[10px] font-bold">
                              INACTIVE
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleToggleZone(z.id)}
                            className="px-3 py-1 rounded-lg text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 cursor-pointer"
                          >
                            Toggle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD NEW DELIVERY                                              */}
      {/* ========================================================================= */}
      {isNewDeliveryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3 mb-4">
              <div>
                <h3 className="text-lg font-black uppercase text-neutral-900">Record New Customer Delivery</h3>
                <p className="text-xs text-neutral-500">
                  Initial state will be PENDING. Customer verification OTP will be auto-generated.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewDeliveryModalOpen(false)}
                className="p-1 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDelivery} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Customer / Recipient Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    placeholder="e.g. Kasun Fernando"
                    value={newDeliveryForm.customerName}
                    onChange={handleNewDeliveryChange}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Customer Phone Number *</label>
                  <input
                    type="text"
                    name="customerPhone"
                    required
                    placeholder="e.g. 0771234567"
                    value={newDeliveryForm.customerPhone}
                    onChange={handleNewDeliveryChange}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Delivery Address *</label>
                <input
                  type="text"
                  name="orderAddress"
                  required
                  placeholder="e.g. 142 Galle Road, Colombo 03"
                  value={newDeliveryForm.orderAddress}
                  onChange={handleNewDeliveryChange}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Customer Email</label>
                  <input
                    type="email"
                    name="customerEmail"
                    placeholder="e.g. customer@gmail.com"
                    value={newDeliveryForm.customerEmail}
                    onChange={handleNewDeliveryChange}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Validating Pharmacist</label>
                  <input
                    type="text"
                    name="validatingPharmacist"
                    placeholder="e.g. Pharm. S. Perera"
                    value={newDeliveryForm.validatingPharmacist}
                    onChange={handleNewDeliveryChange}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Arranging Staff</label>
                  <input
                    type="text"
                    name="arrangingStaff"
                    placeholder="e.g. Dispenser Kamal"
                    value={newDeliveryForm.arrangingStaff}
                    onChange={handleNewDeliveryChange}
                    className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="flex items-center pt-5">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="coldChainTag"
                      checked={newDeliveryForm.coldChainTag}
                      onChange={handleNewDeliveryChange}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-neutral-800 flex items-center gap-1">
                      <Snowflake className="w-3.5 h-3.5 text-cyan-600" />
                      Cold Chain Tagging Required (2-8°C)
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Special Handling Instructions</label>
                <textarea
                  name="specialInstructions"
                  rows="2"
                  placeholder="e.g. Call before delivery, handle with care, insulate temperature packaging..."
                  value={newDeliveryForm.specialInstructions}
                  onChange={handleNewDeliveryChange}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setIsNewDeliveryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDelivery}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                >
                  {creatingDelivery ? 'Creating...' : 'Create & Generate OTP'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ACTION CONFIRMATION (HOLD / POSTPONE / TERMINATE)                 */}
      {/* ========================================================================= */}
      {isActionModalOpen && targetActionDelivery && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-base font-black uppercase text-neutral-900 mb-1">
              Confirm Action: {actionType}
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Apply administrative lifecycle action to Delivery #{targetActionDelivery.id || targetActionDelivery.deliveryId} ({targetActionDelivery.customerName}).
            </p>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Select Action Type</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 font-bold"
                >
                  <option value="HOLD">HOLD (Hold without sending to delivery)</option>
                  <option value="POSTPONE">POSTPONE (Reschedule dispatch)</option>
                  <option value="TERMINATE">TERMINATE (Cancel and abort delivery)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">
                  Reason / Notes {actionType === 'TERMINATE' && <span className="text-red-600">*</span>}
                </label>
                <textarea
                  rows="3"
                  placeholder="Enter reason for this action..."
                  maxLength={500}
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsActionModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePerformAction}
                disabled={actionSubmitting || (actionType === 'TERMINATE' && !actionReason.trim())}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50"
              >
                {actionSubmitting ? 'Applying...' : 'Apply Action'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: COURIER OTP VERIFICATION MODAL (STRICT FOR DELIVERED)             */}
      {/* ========================================================================= */}
      {isOtpModalOpen && targetCourierDelivery && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-black uppercase text-neutral-900">
              Customer OTP Verification
            </h3>
            <p className="text-xs text-neutral-500 mt-1 mb-4">
              Enter the 6-digit verification code provided by <strong>{targetCourierDelivery.customerName}</strong> to confirm successful delivery handover.
            </p>

            <form onSubmit={handleCourierVerifyOtpAndDeliver} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength="6"
                  required
                  autoFocus
                  placeholder="• • • • • •"
                  value={enteredOtp}
                  inputMode="numeric"
                  pattern="[0-9]{6}"
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-48 mx-auto text-center font-mono font-black text-2xl tracking-widest px-4 py-3 rounded-2xl bg-neutral-50 border-2 border-emerald-500/50 focus:border-emerald-600 focus:outline-none"
                />
              </div>

              {otpError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-800 text-xs font-semibold flex items-center justify-center gap-1.5 border border-red-200">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{otpError}</span>
                </div>
              )}

              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={otpSubmitting || enteredOtp.length !== 6}
                  className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {otpSubmitting ? 'Verifying...' : 'Verify & Complete Handover'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: COURIER MARK DELIVERY FAILED                                     */}
      {/* ========================================================================= */}
      {isFailureModalOpen && targetCourierDelivery && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-base font-black uppercase text-rose-800 mb-1">
              Mark Delivery as Failed
            </h3>
            <p className="text-xs text-neutral-500 mb-4">
              Record failure reason for Delivery #{targetCourierDelivery.deliveryId || targetCourierDelivery.id} ({targetCourierDelivery.customerName}).
            </p>

            <div className="space-y-3 text-xs mb-5">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">Failure Reason</label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Customer unreachable after 3 attempts, incorrect address..."
                  maxLength={500}
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200"
                ></textarea>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFailureModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCourierMarkFailed}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider"
              >
                Confirm Failure
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================================= */}
      {/* MODAL 5: REJECT DELIVERY REQUEST (reason is shown to the customer)        */}
      {/* ========================================================================= */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-base font-black uppercase text-red-800 mb-1">Reject Delivery Request</h3>
            <p className="text-xs text-neutral-500 mb-4">
              #DEL-{rejectTarget.id} from {rejectTarget.customerName} ({rejectTarget.preferredCourier}). The customer will see this reason.
            </p>
            <textarea
              rows="3"
              maxLength={500}
              autoFocus
              placeholder="e.g. Address outside our delivery zones"
              value={rejectReason}
              onChange={(e) => {
                setRejectReason(e.target.value);
                setRejectError('');
              }}
              className="w-full px-3 py-2 rounded-xl bg-neutral-50 border border-neutral-200 text-xs"
            ></textarea>
            {rejectError && <p className="text-xs text-red-600 font-semibold mt-1">{rejectError}</p>}
            <div className="flex items-center justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={busyId === rejectTarget.id}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs uppercase tracking-wider disabled:opacity-50"
              >
                Reject Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: DELIVERY TIMELINE (written by the backend's timeline observer)   */}
      {/* ========================================================================= */}
      {timelineTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black uppercase text-neutral-900">Timeline · #DEL-{timelineTarget.id}</h3>
              <button type="button" onClick={() => setTimelineTarget(null)} className="text-neutral-400 hover:text-neutral-600" aria-label="Close">
                <X className="w-5 h-5" />
              </button>
            </div>
            {timelineEntries.length === 0 ? (
              <p className="text-xs text-neutral-500">Loading...</p>
            ) : (
              <ol className="border-l-2 border-emerald-200 pl-4 space-y-3">
                {timelineEntries.map((e, i) => (
                  <li key={i} className="text-xs">
                    <div className="font-bold text-neutral-900">{e.description}</div>
                    <div className="text-[10px] text-neutral-500">
                      {e.eventType}
                      {e.createdAt ? ` · ${new Date(e.createdAt).toLocaleString()}` : ''}
                      {e.actorName ? ` · ${e.actorName} (${e.actorRole})` : ''}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliveryPage;
