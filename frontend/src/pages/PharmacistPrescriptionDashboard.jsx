import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const REJECTION_TAGS = [
  'Not clear photo',
  'Outdated Prescription',
  "Doctor's seal not available",
  'Medical Institute / Medical Personal Information is not true',
];

const PharmacistPrescriptionDashboard = () => {
  const { logout } = useAuth();

  // --- Prescriptions List State ---
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  
  // Status filter defaults strictly to 'PENDING', options: PENDING, CHRONIC, APPROVED, REJECTED (NO 'ALL')
  const [statusFilter, setStatusFilter] = useState('PENDING');

  // Search by Rx ID, Patient ID, Patient Email
  const [searchQuery, setSearchQuery] = useState('');

  // --- Unified View & Review Modal State ---
  const [selectedRx, setSelectedRx] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('APPROVED');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState(REJECTION_TAGS[0]);
  const [deleteFileImmediately, setDeleteFileImmediately] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch all prescriptions from database on mount or when refreshed
  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      // Calls endpoint without status parameter to load all prescriptions across the DB (Pending, Approved, Rejected, Chronic)
      const res = await client.get('/api/v1/prescriptions');
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch prescriptions', err);
      showToast('Failed to load prescriptions from clinical server.', 'error');
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  // Status counts across all prescriptions saved in the DB
  const statusCounts = useMemo(() => {
    return {
      PENDING: prescriptions.filter((rx) => rx.status === 'PENDING').length,
      CHRONIC: prescriptions.filter((rx) => Boolean(rx.chronicSubscription)).length,
      APPROVED: prescriptions.filter((rx) => rx.status === 'APPROVED').length,
      REJECTED: prescriptions.filter((rx) => rx.status === 'REJECTED').length,
      TOTAL: prescriptions.length,
    };
  }, [prescriptions]);

  // Open Unified View & Review Modal
  const handleOpenUnifiedModal = (rx) => {
    setSelectedRx(rx);
    setVerificationStatus('APPROVED');
    setVerificationNotes('');
    setRejectionReason(REJECTION_TAGS[0]);
    setDeleteFileImmediately(false);
  };

  // Submit clinical verification
  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRx) return;

    if (selectedRx.status !== 'PENDING') {
      showToast('This prescription has already been finalized and cannot be reviewed again.', 'error');
      return;
    }

    setSubmittingVerification(true);
    try {
      const payload = {
        status: verificationStatus,
        verificationNotes: verificationNotes.trim(),
        rejectionReason: verificationStatus === 'REJECTED' ? rejectionReason : null,
        deleteFileImmediately: verificationStatus === 'REJECTED' && deleteFileImmediately,
      };

      await client.put(`/api/v1/prescriptions/${selectedRx.id}/verify`, payload);
      showToast(`Prescription #${selectedRx.id} successfully marked as ${verificationStatus}! Notification dispatched to user.`);
      setSelectedRx(null);
      await fetchPrescriptions();
    } catch (err) {
      console.error('Verification failed', err);
      showToast(err.response?.data?.message || 'Failed to update prescription status.', 'error');
    } finally {
      setSubmittingVerification(false);
    }
  };

  // Delete Prescription
  const handleDeletePrescription = async (rxId) => {
    if (!window.confirm(`Are you sure you want to permanently delete prescription #${rxId}? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(rxId);
    try {
      await client.delete(`/api/v1/prescriptions/${rxId}`);
      showToast(`Prescription #${rxId} deleted permanently.`);
      if (selectedRx && selectedRx.id === rxId) {
        setSelectedRx(null);
      }
      await fetchPrescriptions();
    } catch (err) {
      console.error('Delete failed', err);
      showToast(err.response?.data?.message || 'Failed to delete prescription.', 'error');
    } finally {
      setDeletingId(null);
    }
  };

  // Filtered Prescriptions:
  // When a search query is entered, search across ALL prescriptions saved in the DB
  // (not just the selected filter status - includes APPROVED, REJECTED, PENDING, and CHRONIC).
  // When search query is empty, filter strictly by selected tab (Pending by default).
  const filteredPrescriptions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      return prescriptions.filter((rx) => {
        const matchRxId = String(rx.id || '').includes(q);
        const matchPatientId = String(rx.customerId || '').includes(q);
        const matchEmail = (rx.customerEmail || '').toLowerCase().includes(q);
        const matchName = (rx.customerName || '').toLowerCase().includes(q);
        const matchDoctor = (rx.doctorName || '').toLowerCase().includes(q);
        const matchStatus = (rx.status || '').toLowerCase().includes(q);
        return matchRxId || matchPatientId || matchEmail || matchName || matchDoctor || matchStatus;
      });
    }

    if (statusFilter === 'CHRONIC') {
      return prescriptions.filter((rx) => Boolean(rx.chronicSubscription));
    }
    return prescriptions.filter((rx) => rx.status === statusFilter);
  }, [prescriptions, searchQuery, statusFilter]);

  // Format Helper for Dates
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '—';
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

      {/* ========================================================= */}
      {/* TOP HEADER: Pharma + Logo (left) & Logout Button (right)  */}
      {/* NO navigation bar, NO top blue box, NO "My Dashboard"      */}
      {/* ========================================================= */}
      <header className="w-full bg-white border-b border-neutral-200/80 px-4 sm:px-6 lg:px-12 py-3.5 mb-6 shadow-xs">
        <div className="max-w-[1536px] mx-auto flex items-center justify-between">
          
          {/* Top Left: Pharma + Logo and Active Status Queue Badge below it */}
          <div>
            <Link
              to="/pharmacist_dashboard"
              className="flex items-center gap-1 font-sans font-black text-xl sm:text-2xl tracking-tight uppercase text-black hover:opacity-90 transition-opacity"
            >
              <span>PHARMA</span>
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white text-xs font-black shadow-sm">
                +
              </span>
            </Link>

            {/* Active Status Button placed just below the Pharma + logo */}
            <div className="mt-1 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-[10px] font-bold tracking-wide shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Prescription Verification Queue</span>
            </div>
          </div>

          {/* Top Right: Logout Button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={logout}
              title="Log Out of Pharmacist Portal"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-zinc-100 hover:bg-red-50 text-neutral-700 hover:text-red-600 text-xs font-bold uppercase tracking-wider transition-colors border border-neutral-200 shadow-2xs"
            >
              <span className="material-symbols-outlined text-[16px]">logout</span>
              <span className="hidden sm:inline">Log Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* ========================================================= */}
      {/* WORKSPACE BODY                                            */}
      {/* ========================================================= */}
      <div className="max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-12">
        
        {/* Workspace Title: "Rx Verification Portal" & Refresh Symbol */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-neutral-900">
              Rx Verification Portal
            </h1>
          </div>

          {/* Sync Queue - only reload symbol button without text */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchPrescriptions}
              title="Refresh queue"
              aria-label="Refresh queue"
              className="w-10 h-10 rounded-full bg-zinc-900 hover:bg-black text-white flex items-center justify-center shadow-sm transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
            </button>
          </div>
        </div>

        {/* Main Queue Container */}
        <div className="bg-white rounded-3xl border border-neutral-200 shadow-sm overflow-hidden">
          
          {/* Table Controls: Status Filters & Search Bar */}
          <div className="p-4 sm:p-6 border-b border-neutral-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Filter Status: Pending (1st), Chronic (2nd), Approved, Rejected (NO 'All') */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Filter Status:
              </span>
              <div className="flex flex-wrap items-center gap-1.5 bg-neutral-100 p-1 rounded-full border border-neutral-200">
                {[
                  { id: 'PENDING', label: 'Pending', count: statusCounts.PENDING },
                  { id: 'CHRONIC', label: 'Chronic', count: statusCounts.CHRONIC },
                  { id: 'APPROVED', label: 'Approved', count: statusCounts.APPROVED },
                  { id: 'REJECTED', label: 'Rejected', count: statusCounts.REJECTED },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setStatusFilter(st.id);
                      if (searchQuery) setSearchQuery('');
                    }}
                    className={`text-[11px] font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 ${
                      statusFilter === st.id && !searchQuery
                        ? 'bg-zinc-900 text-white shadow-sm font-extrabold'
                        : 'text-neutral-700 hover:bg-neutral-200/70'
                    }`}
                  >
                    <span>{st.label}</span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                        statusFilter === st.id && !searchQuery
                          ? 'bg-white/20 text-white'
                          : 'bg-neutral-200 text-neutral-600'
                      }`}
                    >
                      {st.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search Bar for ID numbers && email address */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search all DB prescriptions (Rx ID, Patient ID, Email)..."
                className="w-full h-10 pl-9 pr-8 rounded-full bg-neutral-50 text-xs text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-1 focus:ring-black border border-neutral-200 transition-all shadow-inner"
              />
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px] pointer-events-none">
                search
              </span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black font-bold text-sm"
                  title="Clear search"
                >
                  ×
                </button>
              )}
            </div>

          </div>

          {/* Table Header Counter & Search Banner */}
          {searchQuery.trim() ? (
            <div className="px-6 py-2.5 bg-amber-50/80 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-amber-900">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-amber-600">manage_search</span>
                <span>
                  Searching across <strong>all DB prescriptions</strong> (Approved, Rejected, Pending, Chronic): found <strong className="text-black">{filteredPrescriptions.length}</strong> matching &ldquo;{searchQuery}&rdquo;
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 hover:text-black bg-amber-100/90 hover:bg-amber-200/90 px-2.5 py-1 rounded-full transition-colors cursor-pointer"
              >
                <span>Clear Search &amp; Return to {statusFilter}</span>
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            </div>
          ) : (
            <div className="px-6 py-2.5 bg-neutral-50/60 border-b border-neutral-100 flex items-center justify-between text-xs text-neutral-500">
              <span>
                Showing <strong className="text-black">{filteredPrescriptions.length}</strong> prescriptions
              </span>
              <span className="text-[11px] font-medium text-neutral-400">
                Active filter: <strong className="text-neutral-700 uppercase">{statusFilter}</strong>
              </span>
            </div>
          )}

          {/* Table */}
          {loadingPrescriptions ? (
            <div className="p-16 text-center text-xs font-semibold text-neutral-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
              Loading clinical queue from server...
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-16 text-center space-y-3">
              <span className="material-symbols-outlined text-[42px] text-neutral-300">fact_check</span>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                {searchQuery
                  ? `No prescriptions found across the database matching "${searchQuery}".`
                  : `No prescriptions found under "${statusFilter}" status.`}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-100/80 text-neutral-700 font-extrabold uppercase tracking-wider border-b border-neutral-200">
                  <tr>
                    <th className="py-3.5 px-4">Rx ID</th>
                    <th className="py-3.5 px-4">Patient ID</th>
                    <th className="py-3.5 px-4">Patient Email</th>
                    <th className="py-3.5 px-4">Patient Name</th>
                    <th className="py-3.5 px-4">Prescriber / Clinic</th>
                    <th className="py-3.5 px-4">Category &amp; Regimen</th>
                    <th className="py-3.5 px-4">Verification Status</th>
                    <th className="py-3.5 px-4">Submission Date</th>
                    <th className="py-3.5 px-4">Approved / Rejected Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200">
                  {filteredPrescriptions.map((rx) => {
                    const isFinalized = rx.status === 'APPROVED' || rx.status === 'REJECTED';
                    return (
                      <tr key={rx.id} className="hover:bg-neutral-50/80 transition-colors">
                        {/* Rx ID */}
                        <td className="py-4 px-4 font-black text-neutral-900 whitespace-nowrap">
                          #{rx.id}
                        </td>

                        {/* Patient ID */}
                        <td className="py-4 px-4 font-mono font-bold text-neutral-700 whitespace-nowrap">
                          #{rx.customerId || '—'}
                        </td>

                        {/* Patient Email */}
                        <td className="py-4 px-4 font-mono text-[11px] text-neutral-600 max-w-[180px] truncate" title={rx.customerEmail}>
                          {rx.customerEmail || '—'}
                        </td>

                        {/* Patient Name */}
                        <td className="py-4 px-4 font-semibold text-neutral-900 whitespace-nowrap">
                          {rx.customerName || 'Patient'}
                        </td>

                        {/* Prescriber / Clinic */}
                        <td className="py-4 px-4">
                          <div className="font-semibold text-neutral-800">{rx.doctorName || 'Not specified'}</div>
                          {rx.patientNotes && (
                            <div className="text-[10px] text-neutral-500 truncate max-w-[160px]" title={rx.patientNotes}>
                              {rx.patientNotes}
                            </div>
                          )}
                        </td>

                        {/* Category & Regimen */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {rx.chronicSubscription ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                              <span className="material-symbols-outlined text-[12px]">autorenew</span>
                              <span>Chronic Refill</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                              Acute Course
                            </span>
                          )}
                        </td>

                        {/* Verification Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                              rx.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : rx.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{rx.status}</span>
                          </span>
                        </td>

                        {/* Submission Date */}
                        <td className="py-4 px-4 text-neutral-600 text-[11px] whitespace-nowrap">
                          {formatDateTime(rx.createdAt)}
                        </td>

                        {/* Approved / Rejected Date */}
                        <td className="py-4 px-4 text-neutral-600 text-[11px] font-mono whitespace-nowrap">
                          {rx.verifiedAt ? (
                            <span className={rx.status === 'APPROVED' ? 'text-emerald-800 font-bold' : 'text-red-800 font-bold'}>
                              {formatDateTime(rx.verifiedAt)}
                            </span>
                          ) : (
                            <span className="text-neutral-400 font-sans italic">Pending review</span>
                          )}
                        </td>

                        {/* Actions: Single Unified View & Review Button + Delete Button */}
                        <td className="py-4 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* Unified View & Review Action */}
                            <button
                              type="button"
                              onClick={() => handleOpenUnifiedModal(rx)}
                              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all shadow-xs ${
                                isFinalized
                                  ? 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-300'
                                  : 'bg-zinc-900 hover:bg-black text-white'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[15px]">
                                {isFinalized ? 'visibility' : 'rate_review'}
                              </span>
                              <span>{isFinalized ? 'View Details' : 'View & Review'}</span>
                            </button>

                            {/* Pharmacist Delete Button (Can delete any prescription, especially finalized ones) */}
                            <button
                              type="button"
                              disabled={deletingId === rx.id}
                              onClick={() => handleDeletePrescription(rx.id)}
                              className="w-8 h-8 rounded-full hover:bg-red-50 text-neutral-400 hover:text-red-600 flex items-center justify-center transition-colors disabled:opacity-40"
                              title="Delete Prescription Record"
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

      </div>

      {/* ========================================================= */}
      {/* UNIFIED VIEW & REVIEW MODAL                               */}
      {/* Both viewing and review/verification in the same place    */}
      {/* ========================================================= */}
      {selectedRx && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-5xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-200">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black uppercase tracking-tight text-neutral-900">
                    Prescription #{selectedRx.id}
                  </h3>
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                      selectedRx.status === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : selectedRx.status === 'REJECTED'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {selectedRx.status}
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Patient ID: <strong className="text-black font-mono">#{selectedRx.customerId || '—'}</strong> • 
                  Patient: <strong className="text-black">{selectedRx.customerName}</strong> ({selectedRx.customerEmail})
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRx(null)}
                className="w-9 h-9 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-600 transition-colors"
                aria-label="Close modal"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Split Content: Document Viewer on Left & Clinical Details/Assessment on Right */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-y-auto pr-1">
              
              {/* Left Col (7 cols): Document Preview */}
              <div className="lg:col-span-7 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-neutral-500">
                  <span>Prescription Document</span>
                  {selectedRx.fileUrl && !selectedRx.isFileDeleted && (
                    <a
                      href={selectedRx.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 hover:underline inline-flex items-center gap-1 lowercase text-[11px] font-semibold"
                    >
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                      <span>full view</span>
                    </a>
                  )}
                </div>

                <div className="flex-1 bg-neutral-100 rounded-2xl p-3 flex items-center justify-center min-h-[360px] border border-neutral-200/80 overflow-hidden">
                  {selectedRx.isFileDeleted || selectedRx.fileUrl === '[FILE_AUTO_DELETED_UPON_REJECTION]' ? (
                    <div className="text-center p-6 space-y-2">
                      <span className="material-symbols-outlined text-4xl text-neutral-400">delete_sweep</span>
                      <p className="text-xs font-bold text-neutral-600">Document File Purged</p>
                      <p className="text-[11px] text-neutral-400 max-w-xs">
                        Per clinical retention policy, the physical file was permanently shredded upon rejection.
                      </p>
                    </div>
                  ) : selectedRx.fileUrl ? (
                    selectedRx.contentType && selectedRx.contentType.includes('pdf') ? (
                      <iframe
                        src={selectedRx.fileUrl}
                        title="Prescription PDF"
                        className="w-full h-[420px] rounded-xl border border-neutral-300"
                      />
                    ) : (
                      <img
                        src={selectedRx.fileUrl}
                        alt="Prescription Document"
                        className="max-h-[420px] w-auto object-contain rounded-xl shadow-sm"
                      />
                    )
                  ) : (
                    <div className="text-center p-6 text-neutral-400 text-xs">
                      No document file attached to this record.
                    </div>
                  )}
                </div>
              </div>

              {/* Right Col (5 cols): Metadata & Clinical Evaluation */}
              <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
                
                {/* Clinical Metadata Summary */}
                <div className="bg-neutral-50 rounded-2xl p-4 border border-neutral-200 space-y-2.5 text-xs">
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                    <span className="text-neutral-500 font-bold uppercase text-[10px]">Prescriber</span>
                    <span className="font-bold text-neutral-900">{selectedRx.doctorName || 'Not specified'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                    <span className="text-neutral-500 font-bold uppercase text-[10px]">Course / Regimen</span>
                    <span className="font-semibold text-neutral-900">
                      {selectedRx.chronicSubscription ? 'Chronic Automated Refill' : 'Acute Course'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                    <span className="text-neutral-500 font-bold uppercase text-[10px]">Submitted Date</span>
                    <span className="font-mono text-neutral-700">{formatDateTime(selectedRx.createdAt)}</span>
                  </div>
                  {selectedRx.verifiedAt && (
                    <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                      <span className="text-neutral-500 font-bold uppercase text-[10px]">Decision Date</span>
                      <span className="font-mono font-bold text-neutral-900">{formatDateTime(selectedRx.verifiedAt)}</span>
                    </div>
                  )}
                  {selectedRx.patientNotes && (
                    <div className="pt-1">
                      <span className="text-neutral-500 font-bold uppercase text-[10px] block mb-0.5">Patient Notes</span>
                      <p className="text-[11px] text-neutral-700 leading-relaxed italic bg-white p-2 rounded-xl border border-neutral-200">
                        "{selectedRx.patientNotes}"
                      </p>
                    </div>
                  )}
                </div>

                {/* ===================================================== */}
                {/* VERIFICATION SECTION: IMMUTABILITY RULE               */}
                {/* If APPROVED or REJECTED: Greyed out, cannot re-review */}
                {/* If PENDING: Interactive Assessment & Rejection Tags   */}
                {/* ===================================================== */}
                {selectedRx.status !== 'PENDING' ? (
                  <div className="bg-neutral-100 rounded-2xl p-5 border border-neutral-200 space-y-4">
                    <div className="flex items-center gap-2 text-neutral-700">
                      <span className="material-symbols-outlined text-[20px] text-neutral-500">lock</span>
                      <h4 className="text-xs font-black uppercase tracking-wider">
                        Decision Finalized ({selectedRx.status})
                      </h4>
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-neutral-200 text-xs space-y-1.5">
                      <p className="font-bold text-neutral-800">
                        Decision recorded on {formatDateTime(selectedRx.verifiedAt)}
                      </p>
                      {selectedRx.status === 'REJECTED' && selectedRx.rejectionReason && (
                        <p className="text-red-700 font-semibold text-[11px]">
                          Rejection Reason: <span className="font-bold">{selectedRx.rejectionReason}</span>
                        </p>
                      )}
                      {selectedRx.verificationNotes && (
                        <p className="text-neutral-600 text-[11px]">
                          Notes: {selectedRx.verificationNotes}
                        </p>
                      )}
                    </div>

                    {/* Greyed out indicator note */}
                    <p className="text-[11px] text-neutral-500 italic">
                      This prescription has already been finalized and cannot be reviewed again. To remove this record, use the delete action below.
                    </p>

                    <div className="pt-2 border-t border-neutral-200 flex justify-between items-center">
                      <button
                        type="button"
                        onClick={() => handleDeletePrescription(selectedRx.id)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold uppercase tracking-wider rounded-full shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <span className="material-symbols-outlined text-[16px]">delete</span>
                        <span>Delete Prescription</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedRx(null)}
                        className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-700 hover:bg-white"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleVerificationSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-neutral-800 mb-2">
                        Clinical Verification Decision
                      </label>
                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setVerificationStatus('APPROVED')}
                          className={`py-2.5 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                            verificationStatus === 'APPROVED'
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setVerificationStatus('REJECTED')}
                          className={`py-2.5 px-3 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                            verificationStatus === 'REJECTED'
                              ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : 'bg-white text-neutral-700 border-neutral-300 hover:bg-neutral-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[18px]">cancel</span>
                          <span>Reject</span>
                        </button>
                      </div>
                    </div>

                    {verificationStatus === 'APPROVED' ? (
                      <div className="space-y-1.5">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-700">
                          Pharmacist Dispensing Instructions (Optional)
                        </label>
                        <textarea
                          rows={3}
                          value={verificationNotes}
                          onChange={(e) => setVerificationNotes(e.target.value)}
                          placeholder="e.g. Validated with prescriber. Cleared for dispensing."
                          className="w-full p-3 rounded-2xl bg-neutral-50 text-xs border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-black resize-none"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-neutral-800 mb-1.5">
                            Select Rejection Reason (Dispatched in User Notification)
                          </label>
                          {/* 4 Tags / Options as requested strictly */}
                          <div className="space-y-1.5">
                            {REJECTION_TAGS.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => setRejectionReason(tag)}
                                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold border transition-all flex items-center justify-between ${
                                  rejectionReason === tag
                                    ? 'bg-red-50 text-red-900 border-red-400 font-bold shadow-2xs'
                                    : 'bg-white text-neutral-700 border-neutral-200 hover:bg-neutral-50'
                                }`}
                              >
                                <span>{tag}</span>
                                {rejectionReason === tag && (
                                  <span className="material-symbols-outlined text-[16px] text-red-600">check</span>
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                            Additional Clinical Notes (Optional)
                          </label>
                          <input
                            type="text"
                            value={verificationNotes}
                            onChange={(e) => setVerificationNotes(e.target.value)}
                            placeholder="e.g. Seal blurred in lower right margin"
                            className="w-full px-3 py-2 rounded-xl bg-neutral-50 text-xs border border-neutral-300 focus:outline-none focus:ring-1 focus:ring-black"
                          />
                        </div>

                        <label className="flex items-center gap-2 p-2.5 bg-red-50/70 rounded-xl border border-red-100 text-[11px] text-red-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={deleteFileImmediately}
                            onChange={(e) => setDeleteFileImmediately(e.target.checked)}
                            className="w-3.5 h-3.5 rounded accent-red-600"
                          />
                          <span>Purge/shred uploaded file immediately (Strict HIPAA/GDPR)</span>
                        </label>
                      </div>
                    )}

                    {/* Commit Decision & Cancel */}
                    <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                      <button
                        type="button"
                        onClick={() => setSelectedRx(null)}
                        className="px-4 py-2 rounded-full border border-neutral-300 text-xs font-bold uppercase tracking-wider text-neutral-600 hover:bg-neutral-50"
                      >
                        Cancel
                      </button>

                      <button
                        type="submit"
                        disabled={submittingVerification}
                        className={`px-5 py-2.5 rounded-full text-white text-xs font-bold uppercase tracking-wider shadow-sm disabled:opacity-50 transition-all ${
                          verificationStatus === 'APPROVED'
                            ? 'bg-emerald-600 hover:bg-emerald-700'
                            : 'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {submittingVerification
                          ? 'Recording Decision...'
                          : verificationStatus === 'APPROVED'
                          ? 'Confirm Approval'
                          : 'Confirm Rejection'}
                      </button>
                    </div>
                  </form>
                )}

              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default PharmacistPrescriptionDashboard;
