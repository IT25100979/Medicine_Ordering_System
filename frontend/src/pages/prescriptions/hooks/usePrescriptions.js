/**
 * usePrescriptions — Custom hook for prescription data management
 * IT25101923
 *
 * Centralizes all API calls, state management, and business logic
 * for the prescription module. Used by both customer and pharmacist views.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../../../api/client';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE, getErrorMessage } from '../constants';
import { CUSTOMER_PRESCRIPTIONS } from '../../../utils/prescriptionRoutes';

export default function usePrescriptions({ isStaff = false }) {
  const { user, isAuthenticated, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();

  // ─── Core State ────────────────────────────────────────────────
  const [records, setRecords] = useState([]);
  const [codes, setCodes] = useState([]);           // Rejection reason codes
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState(isStaff ? 'PENDING' : 'ALL');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);        // Success notification

  // ─── Modal State ───────────────────────────────────────────────
  const [modal, setModal] = useState(null);           // 'upload' | 'edit' | 'details' | 'remove' | 'cleanup'
  const [selected, setSelected] = useState(null);     // Currently selected prescription
  const [confirmError, setConfirmError] = useState('');
  const [cleanup, setCleanup] = useState(null);       // Last cleanup result

  // ─── Data Loading ──────────────────────────────────────────────
  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [listRes, codesRes] = await Promise.all([
        client.get(API_BASE),
        client.get(`${API_BASE}/reason-codes`),
      ]);
      setRecords(listRes.data);
      setCodes(codesRes.data);
    } catch (err) {
      setLoadError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Initial Load ──────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      refresh();
    }
  }, [authLoading, isAuthenticated, refresh]);

  // ─── Auto-dismiss notice after 6 seconds ──────────────────────
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(null), 6000);
    return () => clearTimeout(timeout);
  }, [notice]);

  // ─── Filtered & Searched Records ──────────────────────────────
  const visible = useMemo(() => {
    return records.filter((rx) => {
      // Status / chronic filter
      if (filter === 'CHRONIC') {
        if (!rx.chronicSubscription) return false;
      } else if (filter !== 'ALL') {
        if (rx.status !== filter) return false;
      }

      // Search filter
      const query = search.toLowerCase().trim();
      if (!query) return true;

      const searchable = `${rx.id} ${rx.customerName} ${rx.customerEmail} ${rx.doctorName || ''}`;
      return searchable.toLowerCase().includes(query);
    });
  }, [records, search, filter]);

  // ─── Counts ────────────────────────────────────────────────────
  const countByStatus = useCallback(
    (status) => records.filter((rx) => rx.status === status).length,
    [records]
  );

  // ─── Modal Helpers ─────────────────────────────────────────────
  const closeModal = useCallback(() => {
    if (!busy) {
      setModal(null);
      setSelected(null);
      setConfirmError('');
    }
  }, [busy]);

  const openDetails = useCallback((rx) => {
    setSelected(rx);
    setModal('details');
  }, []);

  const openEdit = useCallback(() => {
    setModal('edit');
  }, []);

  const openUpload = useCallback(() => {
    setModal('upload');
  }, []);

  const openRemove = useCallback(() => {
    setConfirmError('');
    setModal('remove');
  }, []);

  const openCleanup = useCallback(() => {
    setConfirmError('');
    setModal('cleanup');
  }, []);

  // ─── CRUD Operations ──────────────────────────────────────────

  /**
   * Upload a new prescription or update an existing one.
   * @param {FormData} data - Multipart form data
   */
  const saveSubmission = useCallback(async (data) => {
    setBusy(true);
    try {
      if (modal === 'edit') {
        await client.put(`${API_BASE}/${selected.id}`, data);
      } else {
        await client.post(`${API_BASE}/upload`, data);
      }
      setModal(null);
      setSelected(null);
      setNotice({
        message: 'Prescription submitted. Your pharmacist will review it. Track the status below.',
      });
      navigate(CUSTOMER_PRESCRIPTIONS);
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [modal, selected, navigate, refresh]);

  /**
   * Pharmacist decision: verify/reject/clarify, or link order usage.
   * @param {'verify'|'usage'} kind
   * @param {Object} data
   */
  const performAction = useCallback(async (kind, data) => {
    setBusy(true);
    try {
      if (kind === 'verify') {
        await client.put(`${API_BASE}/${selected.id}/verify`, data);
      } else {
        await client.post(`${API_BASE}/${selected.id}/usage`, data);
      }
      setModal(null);
      setSelected(null);
      setNotice({
        message:
          kind === 'verify'
            ? "Review saved. The customer's status and activity history are updated."
            : 'Order linked. Approved usage has been updated.',
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }, [selected, refresh]);

  /**
   * Soft-delete a prescription (remove from active lists).
   */
  const removePrescription = useCallback(async () => {
    setBusy(true);
    setConfirmError('');
    try {
      await client.delete(`${API_BASE}/${selected.id}`);
      setModal(null);
      setSelected(null);
      setNotice({
        message: 'Submission removed from active records. Its history is retained.',
      });
      await refresh();
    } catch (err) {
      setConfirmError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [selected, refresh]);

  /**
   * Trigger storage cleanup (pharmacist only).
   */
  const runCleanup = useCallback(async () => {
    setBusy(true);
    setConfirmError('');
    try {
      const { data } = await client.post(`${API_BASE}/cleanup`);
      setCleanup(data);
      setNotice({ message: 'Storage cleanup completed.' });
      setModal(null);
      await refresh();
    } catch (err) {
      setConfirmError(getErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return {
    // Auth
    user,
    isAuthenticated,
    authLoading,
    logout,

    // Data
    records,
    visible,
    codes,
    loading,
    loadError,
    refresh,

    // Filters
    search,
    setSearch,
    filter,
    setFilter,
    countByStatus,

    // UI state
    busy,
    notice,
    setNotice,
    modal,
    setModal,
    selected,
    setSelected,
    confirmError,
    cleanup,

    // Modal helpers
    closeModal,
    openDetails,
    openEdit,
    openUpload,
    openRemove,
    openCleanup,

    // Actions
    saveSubmission,
    performAction,
    removePrescription,
    runCleanup,
  };
}
