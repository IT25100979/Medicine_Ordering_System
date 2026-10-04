import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const PharmacistPrescriptionDashboard = () => {
  const { user } = useAuth();

  // --- Prescriptions List State ---
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [statusFilter, setStatusFilter] = useState('PENDING');

  // --- Document Viewer Modal ---
  const [previewingDoc, setPreviewingDoc] = useState(null);

  // --- Clinical Verification Drawer/Modal State ---
  const [verifyingPrescription, setVerifyingPrescription] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState('APPROVED');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('Signature illegible or missing');
  const [deleteFileImmediately, setDeleteFileImmediately] = useState(false);
  const [submittingVerification, setSubmittingVerification] = useState(false);

  // --- Retention Cleanup State ---
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupReport, setCleanupReport] = useState(null);

  // Toast Notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [statusFilter]);

  const fetchPrescriptions = async () => {
    setLoadingPrescriptions(true);
    try {
      let url = '/api/v1/prescriptions';
      const params = new URLSearchParams();
      if (statusFilter !== 'ALL' && statusFilter !== 'CHRONIC') {
        params.append('status', statusFilter);
      }
      if (statusFilter === 'CHRONIC') {
        params.append('chronicOnly', 'true');
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await client.get(url);
      setPrescriptions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch prescriptions', err);
      showToast('Failed to load prescriptions from clinical server.', 'error');
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleOpenVerification = (rx) => {
    setVerifyingPrescription(rx);
    setVerificationStatus('APPROVED');
    setVerificationNotes('');
    setRejectionReason('Signature illegible or missing');
    setDeleteFileImmediately(false);
  };

  const handleVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verifyingPrescription) return;

    setSubmittingVerification(true);
    try {
      const payload = {
        status: verificationStatus,
        verificationNotes: verificationStatus === 'APPROVED' ? verificationNotes : rejectionReason,
        deleteFileImmediately: verificationStatus === 'REJECTED' && deleteFileImmediately,
      };

      await client.put(`/api/v1/prescriptions/${verifyingPrescription.id}/verify`, payload);
      showToast(`Prescription #${verifyingPrescription.id} marked as ${verificationStatus}!`);
      setVerifyingPrescription(null);
      await fetchPrescriptions();
    } catch (err) {
      console.error('Verification failed', err);
      showToast(err.response?.data?.message || 'Failed to update prescription status.', 'error');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleRunCleanup = async () => {
    if (!window.confirm('Run HIPAA/GDPR clinical data retention audit & automated file cleanup?')) {
      return;
    }
    setCleanupLoading(true);
    try {
      const res = await client.post('/api/v1/prescriptions/retention/cleanup');
      setCleanupReport(res.data);
      showToast('Clinical retention cleanup cycle completed successfully.');
      await fetchPrescriptions();
    } catch (err) {
      console.error('Cleanup failed', err);
      showToast('Failed to execute retention cleanup job.', 'error');
    } finally {
      setCleanupLoading(false);
    }
  };

  // Metrics
  const pendingCount = prescriptions.filter((p) => p.status === 'PENDING').length;
  const approvedCount = prescriptions.filter((p) => p.status === 'APPROVED').length;
  const chronicCount = prescriptions.filter((p) => p.chronicSubscription).length;

  return (
    <div className="pt-20 pb-16 px-4 sm:px-6 lg:px-12 max-w-[1536px] mx-auto min-h-screen">
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

      {/* Workspace Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
              <span>ADMIN CONSOLE</span>
              <span>/</span>
              <span className="text-black font-extrabold">PHARMACIST VERIFICATION PORTAL</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-brand-charcoal">
              Prescription Review &amp; Compliance Queue
            </h1>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
              Tele-pharmacy intake queue for evaluating patient scripts, prescriber credentials, and regulatory compliance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunCleanup}
              disabled={cleanupLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-white hover:bg-zinc-100 text-zinc-800 text-xs font-bold uppercase tracking-wider border border-brand-border shadow-sm transition-all disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[16px] text-amber-600">cleaning_services</span>
              <span>{cleanupLoading ? 'Running...' : 'Retention Cleanup'}</span>
            </button>

            <button
              onClick={fetchPrescriptions}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">refresh</span>
              <span>Sync Queue</span>
            </button>
          </div>
        </div>

        {/* Metric Cards Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Pending Verifications</p>
              <h3 className="text-2xl font-black text-amber-600 mt-1">{pendingCount}</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Awaiting DEA/signature audit</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">pending_actions</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Verified Active</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{approvedCount}</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Cleared for automated dispensing</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">verified</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Chronic Subscriptions</p>
              <h3 className="text-2xl font-black text-blue-600 mt-1">{chronicCount}</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Automated 30/60 day cycles</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">autorenew</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-brand-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">Audited Review Speed</p>
              <h3 className="text-2xl font-black text-brand-charcoal mt-1">14.2 min</h3>
              <p className="text-[10px] text-zinc-500 mt-0.5">Under SLA compliance threshold</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-zinc-100 text-zinc-700 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">speed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Queue Container */}
      <div className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="p-4 sm:p-6 border-b border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Filter Status:</span>
            <div className="flex flex-wrap items-center gap-1.5 bg-surface-container-low p-1 rounded-full border border-brand-border">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CHRONIC'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-colors ${
                    statusFilter === st
                      ? 'bg-zinc-900 text-white shadow-sm'
                      : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <span className="text-xs text-on-surface-variant">
            Displaying <strong className="text-black">{prescriptions.length}</strong> patient prescription files
          </span>
        </div>

        {/* Table */}
        {loadingPrescriptions ? (
          <div className="p-16 text-center text-xs font-semibold text-zinc-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-3"></div>
            Loading prescriptions from clinical server...
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <span className="material-symbols-outlined text-[42px] text-zinc-300">fact_check</span>
            <p className="text-xs font-bold uppercase tracking-wider text-zinc-500">
              No prescriptions found under "{statusFilter}" status filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-container-low text-on-surface font-bold uppercase tracking-wider border-b border-brand-border">
                <tr>
                  <th className="py-3.5 px-5">Rx ID</th>
                  <th className="py-3.5 px-5">Patient Details</th>
                  <th className="py-3.5 px-5">Prescriber / Clinic</th>
                  <th className="py-3.5 px-5">Category &amp; Regimen</th>
                  <th className="py-3.5 px-5">Verification Status</th>
                  <th className="py-3.5 px-5">Submission Date</th>
                  <th className="py-3.5 px-5 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {prescriptions.map((rx) => (
                  <tr key={rx.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="py-4 px-5 font-black text-brand-charcoal">
                      #{rx.id}
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-bold text-on-surface">{rx.customerName || 'Patient'}</div>
                      <div className="text-[11px] text-on-surface-variant font-mono">{rx.customerEmail}</div>
                    </td>

                    <td className="py-4 px-5">
                      <div className="font-semibold text-on-surface">{rx.doctorName || 'Not specified'}</div>
                      {rx.patientNotes && (
                        <div className="text-[11px] text-zinc-500 truncate max-w-[200px]" title={rx.patientNotes}>
                          {rx.patientNotes}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-5">
                      {rx.chronicSubscription ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                          <span className="material-symbols-outlined text-[12px]">autorenew</span>
                          <span>Chronic Refill</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-700">
                          Acute Course
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-5">
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

                    <td className="py-4 px-5 text-on-surface-variant text-[11px]">
                      {rx.createdAt ? new Date(rx.createdAt).toLocaleDateString() : 'N/A'}
                    </td>

                    <td className="py-4 px-5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {rx.fileUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewingDoc(rx)}
                            className="p-1.5 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                            title="Inspect Script Document"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenVerification(rx)}
                          className="px-3.5 py-1.5 rounded-full bg-zinc-900 hover:bg-black text-white text-[11px] font-bold uppercase tracking-wider transition-colors shadow-sm"
                        >
                          Review &amp; Verify
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- DOCUMENT PREVIEW MODAL --- */}
      {previewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-brand-charcoal">
                  Prescription Document #{previewingDoc.id}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Patient: {previewingDoc.customerName} ({previewingDoc.customerEmail})
                </p>
              </div>
              <button
                onClick={() => setPreviewingDoc(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto bg-zinc-50 rounded-2xl p-4 flex items-center justify-center min-h-[350px]">
              {previewingDoc.fileType && previewingDoc.fileType.includes('pdf') ? (
                <iframe
                  src={previewingDoc.fileUrl}
                  title="Prescription PDF"
                  className="w-full h-[500px] rounded-xl border border-brand-border"
                />
              ) : (
                <img
                  src={previewingDoc.fileUrl}
                  alt="Prescription"
                  className="max-h-[500px] object-contain rounded-xl shadow"
                />
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <a
                href={previewingDoc.fileUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="text-xs font-bold text-black underline inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                <span>Open in New Tab</span>
              </a>

              <button
                onClick={() => {
                  const rx = previewingDoc;
                  setPreviewingDoc(null);
                  handleOpenVerification(rx);
                }}
                className="px-4 py-2 rounded-full bg-black text-white text-xs font-bold uppercase tracking-wider"
              >
                Proceed to Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CLINICAL VERIFICATION DRAWER / MODAL --- */}
      {verifyingPrescription && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-brand-charcoal">
                  Prescription Verification
                </h3>
                <p className="text-xs text-on-surface-variant">
                  Clinical evaluation for Prescription #{verifyingPrescription.id}
                </p>
              </div>
              <button
                onClick={() => setVerifyingPrescription(null)}
                className="w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 flex items-center justify-center text-zinc-700"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleVerificationSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface mb-2">
                  Clinical Assessment
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVerificationStatus('APPROVED')}
                    className={`py-2.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                      verificationStatus === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Approve Script</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerificationStatus('REJECTED')}
                    className={`py-2.5 px-4 rounded-2xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 border transition-all ${
                      verificationStatus === 'REJECTED'
                        ? 'bg-red-600 text-white border-red-600 shadow'
                        : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    <span>Reject Script</span>
                  </button>
                </div>
              </div>

              {verificationStatus === 'APPROVED' ? (
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface">
                    Pharmacist Dispensing Instructions / Clinical Notes
                  </label>
                  <textarea
                    rows={3}
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes(e.target.value)}
                    placeholder="e.g. Validated with Dr. Smith. Cleared for standard 30-day oral administration."
                    className="w-full p-3 rounded-2xl bg-surface-container-low text-xs border border-brand-border focus:outline-none focus:ring-1 focus:ring-black resize-none"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface">
                      Primary Rejection Rationale
                    </label>
                    <select
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full h-11 px-3 rounded-2xl bg-surface-container-low text-xs border border-brand-border focus:outline-none focus:ring-1 focus:ring-black"
                    >
                      <option value="Signature illegible or missing">Signature illegible or missing</option>
                      <option value="Prescription expired (beyond 6 months/1 year statutory limit)">Prescription expired</option>
                      <option value="Prescriber DEA / License number unverifiable">Prescriber license unverifiable</option>
                      <option value="Dosing regimen exceeds statutory safe dosage threshold">Dosage exceeds safe ceiling</option>
                      <option value="Potential drug-drug severe clinical interaction">Drug-drug interaction detected</option>
                    </select>
                  </div>

                  <label className="flex items-center gap-2 p-3 bg-red-50 rounded-2xl border border-red-100 text-xs text-red-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteFileImmediately}
                      onChange={(e) => setDeleteFileImmediately(e.target.checked)}
                      className="w-4 h-4 rounded accent-red-600"
                    />
                    <span>Immediately shred/purge uploaded file (Strict HIPAA/GDPR Compliance)</span>
                  </label>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setVerifyingPrescription(null)}
                  className="px-4 py-2 rounded-full border border-zinc-200 text-xs font-bold uppercase tracking-wider text-zinc-600 hover:bg-zinc-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingVerification}
                  className="px-5 py-2.5 rounded-full bg-zinc-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider shadow disabled:opacity-50"
                >
                  {submittingVerification ? 'Recording Decision...' : 'Commit Clinical Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PharmacistPrescriptionDashboard;
