import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import client from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const PrescriptionPage = () => {
  const { user, isAuthenticated } = useAuth();
  const fileInputRef = useRef(null);

  // Active view tab: 'upload' | 'my-prescriptions' | 'verification-queue' | 'retention'
  const isStaff = user && ['PHARMACIST', 'CHIEF_PHARMACIST', 'ADMIN', 'OPERATIONS_MANAGER'].includes(user.role);
  const [activeTab, setActiveTab] = useState(isStaff ? 'verification-queue' : 'upload');

  // --- Upload State ---
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [doctorName, setDoctorName] = useState('');
  const [patientNotes, setPatientNotes] = useState('');
  const [chronicSubscription, setChronicSubscription] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState({ type: '', message: '' });

  // --- Prescriptions List State ---
  const [prescriptions, setPrescriptions] = useState([]);
  const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');

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

  // Load prescriptions when tab changes
  useEffect(() => {
    if (activeTab === 'my-prescriptions' || activeTab === 'verification-queue') {
      fetchPrescriptions();
    }
  }, [activeTab, statusFilter]);

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
    } finally {
      setLoadingPrescriptions(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setUploadFeedback({ type: 'error', message: 'File exceeds 10MB maximum limit.' });
        return;
      }
      setSelectedFile(file);
      setUploadFeedback({ type: '', message: '' });

      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setFilePreviewUrl(null);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 10 * 1024 * 1024) {
        setUploadFeedback({ type: 'error', message: 'File exceeds 10MB maximum limit.' });
        return;
      }
      setSelectedFile(file);
      setUploadFeedback({ type: '', message: '' });
      if (file.type.startsWith('image/')) {
        setFilePreviewUrl(URL.createObjectURL(file));
      } else {
        setFilePreviewUrl(null);
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadFeedback({ type: 'error', message: 'Please select or drag a prescription file to upload.' });
      return;
    }

    setUploading(true);
    setUploadFeedback({ type: '', message: '' });

    const formData = new FormData();
    formData.append('file', selectedFile);
    if (doctorName) formData.append('doctorName', doctorName);
    if (patientNotes) formData.append('patientNotes', patientNotes);
    formData.append('chronicSubscription', chronicSubscription ? 'true' : 'false');

    try {
      const res = await client.post('/api/v1/prescriptions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setUploadFeedback({
        type: 'success',
        message: `Prescription #${res.data.id} uploaded successfully! Our clinical staff is reviewing your document.`
      });
      setSelectedFile(null);
      setFilePreviewUrl(null);
      setDoctorName('');
      setPatientNotes('');
      setChronicSubscription(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Upload error', err);
      const msg = err.response?.data?.message || err.message || 'Prescription upload failed. Please try again.';
      setUploadFeedback({ type: 'error', message: msg });
    } finally {
      setUploading(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyingPrescription) return;

    setSubmittingVerification(true);
    try {
      await client.put(`/api/v1/prescriptions/${verifyingPrescription.id}/verify`, {
        status: verificationStatus,
        verificationNotes,
        rejectionReason: verificationStatus === 'REJECTED' ? rejectionReason : null,
        deleteFileImmediately: verificationStatus === 'REJECTED' ? deleteFileImmediately : false
      });

      setVerifyingPrescription(null);
      setVerificationNotes('');
      fetchPrescriptions();
    } catch (err) {
      console.error('Verification error', err);
      alert(err.response?.data?.message || 'Verification update failed.');
    } finally {
      setSubmittingVerification(false);
    }
  };

  const handleDeletePrescription = async (id) => {
    if (!window.confirm(`Are you sure you want to cancel and delete Prescription #${id}? The physical document will also be purged from storage.`)) {
      return;
    }

    try {
      await client.delete(`/api/v1/prescriptions/${id}`);
      fetchPrescriptions();
    } catch (err) {
      console.error('Delete error', err);
      alert(err.response?.data?.message || 'Failed to delete prescription.');
    }
  };

  const handleRunCleanup = async () => {
    setCleanupLoading(true);
    try {
      const res = await client.post('/api/v1/prescriptions/cleanup');
      setCleanupReport(res.data);
      fetchPrescriptions();
    } catch (err) {
      console.error('Cleanup error', err);
      alert('Cleanup routine failed to execute.');
    } finally {
      setCleanupLoading(false);
    }
  };

  // Get base URL for file streaming
  const getFileStreamUrl = (p) => {
    if (!p) return '';
    if (p.isFileDeleted) return null;
    return `http://localhost:8080/api/v1/prescriptions/files/${p.storedFileName}`;
  };

  return (
    <div className="pt-24 pb-16 px-4 md:px-8 max-w-[1280px] mx-auto">
      {/* Breadcrumb Navigation */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
        <nav className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          <Link to="/" className="hover:text-black transition-colors">HOME</Link>
          <span>/</span>
          <span className="text-black">PRESCRIPTION INTAKE &amp; CLINICAL VERIFICATION</span>
        </nav>

        {/* View Switcher Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-surface-container-low p-1 rounded-full border border-brand-border">
          <button
            onClick={() => setActiveTab('upload')}
            className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-colors ${
              activeTab === 'upload' ? 'bg-black text-white' : 'text-on-surface hover:bg-surface-container'
            }`}
          >
            Upload Rx
          </button>
          <button
            onClick={() => setActiveTab('my-prescriptions')}
            className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-colors ${
              activeTab === 'my-prescriptions' ? 'bg-black text-white' : 'text-on-surface hover:bg-surface-container'
            }`}
          >
            {isStaff ? 'All Submissions' : 'My Prescriptions'}
          </button>
          {isStaff && (
            <button
              onClick={() => setActiveTab('verification-queue')}
              className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-colors ${
                activeTab === 'verification-queue' ? 'bg-black text-white' : 'text-on-surface hover:bg-surface-container'
              }`}
            >
              Pharmacist Queue
            </button>
          )}
          <button
            onClick={() => setActiveTab('retention')}
            className={`text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-full transition-colors ${
              activeTab === 'retention' ? 'bg-black text-white' : 'text-on-surface hover:bg-surface-container'
            }`}
          >
            Retention &amp; Storage
          </button>
        </div>
      </div>

      {/* Protocol Phase Strip */}
      <div className="w-full bg-surface-container-low rounded-2xl p-4 shadow-sm mb-8 border border-brand-border">
        <div className="flex items-center justify-between text-on-surface text-xs font-bold uppercase tracking-wider mb-2">
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-secondary">verified</span>
            Protocol Phase 1 of 3: Document Ingestion &amp; Script Audit
          </span>
          <span className="text-on-surface-variant font-medium">Ready</span>
        </div>
        <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
          <div className="h-full bg-black rounded-full" style={{ width: '40%' }}></div>
        </div>
        <div className="flex justify-between text-[11px] text-on-surface-variant mt-2">
          <span className="text-black font-bold">1. Image &amp; Script Audit</span>
          <span>2. Doctor Tele-Check</span>
          <span>3. Cold-Chain Dispensing</span>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: UPLOAD PRESCRIPTION                               */}
      {/* ======================================================== */}
      {activeTab === 'upload' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Clinical Guidelines (7 Cols) */}
          <div className="lg:col-span-7 space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-brand-charcoal mb-2">
                Upload Your Prescription
              </h1>
              <p className="text-sm sm:text-base text-on-surface-variant max-w-xl leading-relaxed">
                Our board-certified pharmacists inspect every prescription for dosage clarity, contraindications, and active physician registration prior to packaging.
              </p>
            </div>

            {/* Instruction Steps */}
            <div className="space-y-3">
              {[
                {
                  num: '1',
                  title: 'Ensure Patient & Doctor Information Is Clearly Visible',
                  desc: "Full legal name, date of birth, prescriber's clinic name, license number, and signature must be sharp and legible."
                },
                {
                  num: '2',
                  title: 'Verify Medication Details & Dosages',
                  desc: 'Double-check that the drug name, exact strength (e.g. mg, mcg), quantity, and specific intake frequency are uncropped.'
                },
                {
                  num: '3',
                  title: 'Capture High-Resolution, Well-Lit Photos or PDFs',
                  desc: 'Place physical paper scripts on a flat dark surface with even lighting to avoid glare, shadows, or blurry text.'
                },
                {
                  num: '4',
                  title: 'Check Prescription Expiration Date',
                  desc: 'Most standard prescriptions must be dated within the past 12 months (or 6 months for regulated maintenance medications).'
                },
                {
                  num: '5',
                  title: 'Preserve with Chronic Subscription Protection',
                  desc: 'If you require recurring monthly refills, check the "Chronic Subscription" box to ensure your prescription file is protected from auto-deletion.'
                }
              ].map((step) => (
                <div
                  key={step.num}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-brand-border flex items-start gap-4 transition-all hover:-translate-y-0.5"
                >
                  <div className="w-8 h-8 rounded-full bg-black text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {step.num}
                  </div>
                  <div>
                    <h2 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal mb-0.5">
                      {step.title}
                    </h2>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Regulatory Clinical Safeguards Strip */}
            <div className="bg-[#FAF8DE] rounded-2xl p-4 border border-[#EFE298] text-xs text-brand-charcoal flex items-center gap-3">
              <span className="material-symbols-outlined text-[24px] text-amber-800 shrink-0">shield_lock</span>
              <div>
                <span className="font-bold uppercase tracking-wider block">HIPAA &amp; Security Compliance</span>
                <span className="text-[11px] text-on-surface-variant">
                  Files are encrypted at rest with AES-256 local disk security. Only authorized clinical pharmacists have decryption access.
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Intake & Upload Engine (5 Cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-brand-border sticky top-28">
              
              {/* Feedback Alert */}
              {uploadFeedback.message && (
                <div
                  className={`mb-4 p-3.5 rounded-2xl text-xs flex items-start gap-2 ${
                    uploadFeedback.type === 'error'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px] shrink-0">
                    {uploadFeedback.type === 'error' ? 'error' : 'check_circle'}
                  </span>
                  <span>{uploadFeedback.message}</span>
                </div>
              )}

              {/* Drag and Drop Zone Container */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="relative group cursor-pointer bg-[#F5F7F8] hover:bg-[#FAF8DE]/60 transition-colors rounded-2xl p-8 text-center flex flex-col items-center justify-center border-2 border-dashed border-brand-border hover:border-black"
              >
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                    <span className="material-symbols-outlined text-black text-[32px]">cloud_upload</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-black text-white flex items-center justify-center text-xs font-bold shadow">
                    <span className="material-symbols-outlined text-[16px]">add</span>
                  </div>
                </div>

                <p className="text-sm font-bold uppercase tracking-wider text-brand-charcoal mb-1">
                  Drag &amp; drop prescription here
                </p>
                <p className="text-xs text-on-surface-variant mb-3">
                  or <span className="font-bold text-black underline underline-offset-4">Browse Files</span> from your device
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-on-surface-variant text-[11px] font-semibold shadow-sm border border-brand-border">
                  <span className="material-symbols-outlined text-[14px]">description</span>
                  <span>PDF, JPG, PNG, WEBP up to 10MB</span>
                </div>
              </div>

              {/* Selected File Card / Preview */}
              {selectedFile && (
                <div className="mt-4 p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {filePreviewUrl ? (
                      <img
                        src={filePreviewUrl}
                        alt="Preview"
                        className="w-10 h-10 rounded-xl object-cover border border-emerald-300 shrink-0"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-white text-emerald-800 flex items-center justify-center shrink-0 border border-emerald-300">
                        <span className="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-brand-charcoal truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-[11px] text-emerald-800">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for review
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      setFilePreviewUrl(null);
                    }}
                    className="w-7 h-7 rounded-full bg-red-100 hover:bg-red-200 text-red-700 flex items-center justify-center transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                </div>
              )}

              {/* Prescription Metadata Form */}
              <form onSubmit={handleUploadSubmit} className="mt-5 space-y-3.5">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface">
                    Doctor / Clinic Name
                  </label>
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="e.g. Dr. Robert Vance, St. Jude Clinic"
                    className="w-full h-10 px-3.5 rounded-full bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-black border border-brand-border"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface">
                    Patient Clinical Notes / Symptoms
                  </label>
                  <textarea
                    rows={2}
                    value={patientNotes}
                    onChange={(e) => setPatientNotes(e.target.value)}
                    placeholder="Provide details regarding allergies, dosage changes, or specific generic preferences..."
                    className="w-full p-3 rounded-2xl bg-surface-container-low text-xs text-on-surface placeholder:text-on-surface-variant/60 focus:outline-none focus:ring-1 focus:ring-black border border-brand-border resize-none"
                  ></textarea>
                </div>

                {/* Chronic Subscription Checkbox */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8DE] border border-[#EFE298] space-y-1">
                  <label className="flex items-start gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={chronicSubscription}
                      onChange={(e) => setChronicSubscription(e.target.checked)}
                      className="w-4 h-4 rounded text-black focus:ring-0 accent-black cursor-pointer mt-0.5"
                    />
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-charcoal block">
                        Chronic Subscription (Recurring Prescription)
                      </span>
                      <span className="text-[11px] text-on-surface-variant leading-relaxed block mt-0.5">
                        Preserve this prescription and its clinical file indefinitely. Exempt from auto-deletion until a pharmacist explicitly deletes or updates it.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full h-12 bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
                >
                  {uploading ? (
                    <span>Uploading &amp; Encrypting...</span>
                  ) : (
                    <>
                      <span>Submit Prescription for Review</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </form>

              {/* Support Note */}
              <p className="mt-4 text-center text-[11px] text-on-surface-variant">
                Need assistance? Call our 24/7 pharmacist hotline at{' '}
                <a href="tel:18007455789" className="font-bold text-black hover:underline">
                  1 (800) 745-5789
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2 & 3: PRESCRIPTIONS LIST / PHARMACIST QUEUE         */}
      {/* ======================================================== */}
      {(activeTab === 'my-prescriptions' || activeTab === 'verification-queue') && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-brand-charcoal">
                {activeTab === 'verification-queue' ? 'Clinical Verification Queue' : 'Prescription Submissions'}
              </h2>
              <p className="text-xs text-on-surface-variant">
                {activeTab === 'verification-queue'
                  ? 'Inspect uploaded scripts, verify prescriber DEA/license, and assign clinical approval status.'
                  : 'Track your uploaded prescriptions, verification feedback, and prescription status.'}
              </p>
            </div>

            {/* Status Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 bg-white p-1 rounded-full border border-brand-border">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'CHRONIC'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full transition-colors ${
                    statusFilter === st ? 'bg-black text-white' : 'text-on-surface hover:bg-surface-container'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Prescriptions Table */}
          <div className="bg-white rounded-3xl border border-brand-border shadow-sm overflow-hidden">
            {loadingPrescriptions ? (
              <div className="p-12 text-center text-xs font-semibold text-on-surface-variant">
                Loading prescriptions from server...
              </div>
            ) : prescriptions.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <span className="material-symbols-outlined text-[36px] text-on-surface-variant/40">description</span>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  No prescriptions found matching filter.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-low text-on-surface font-bold uppercase tracking-wider border-b border-brand-border">
                    <tr>
                      <th className="py-3 px-4">Rx ID</th>
                      <th className="py-3 px-4">Patient / Customer</th>
                      <th className="py-3 px-4">Prescriber / Clinic</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Uploaded</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {prescriptions.map((rx) => (
                      <tr key={rx.id} className="hover:bg-surface-container-low/50 transition-colors">
                        <td className="py-3.5 px-4 font-black text-brand-charcoal">
                          #{rx.id}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-on-surface">{rx.customerName || 'Patient'}</div>
                          <div className="text-[11px] text-on-surface-variant">{rx.customerEmail}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-on-surface">{rx.doctorName || 'Not specified'}</div>
                          {rx.patientNotes && (
                            <div className="text-[11px] text-on-surface-variant truncate max-w-[180px]">
                              {rx.patientNotes}
                            </div>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {rx.chronicSubscription ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                              <span className="material-symbols-outlined text-[12px]">all_inclusive</span>
                              <span>Chronic</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-semibold uppercase text-on-surface-variant">
                              One-Time
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                              rx.status === 'APPROVED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : rx.status === 'REJECTED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {rx.status}
                          </span>
                          {rx.isFileDeleted && (
                            <span className="block text-[10px] text-red-600 mt-0.5 italic">
                              File Purged
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-on-surface-variant text-[11px]">
                          {rx.createdAt ? rx.createdAt.replace('T', ' ').substring(0, 16) : '—'}
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-1.5">
                          {/* Preview Document Button */}
                          {!rx.isFileDeleted && (
                            <button
                              type="button"
                              onClick={() => setPreviewingDoc(rx)}
                              className="inline-flex items-center gap-1 bg-surface-container-low hover:bg-black hover:text-white px-2.5 py-1 rounded-full text-[11px] font-bold uppercase transition-colors border border-brand-border"
                            >
                              <span className="material-symbols-outlined text-[14px]">visibility</span>
                              <span>Inspect</span>
                            </button>
                          )}

                          {/* Pharmacist Verification Button */}
                          {isStaff && (
                            <button
                              type="button"
                              onClick={() => {
                                setVerifyingPrescription(rx);
                                setVerificationStatus(rx.status === 'PENDING' ? 'APPROVED' : rx.status);
                                setVerificationNotes(rx.verificationNotes || '');
                                setRejectionReason(rx.rejectionReason || 'Signature illegible or missing');
                              }}
                              className="inline-flex items-center gap-1 bg-black text-white hover:bg-zinc-800 px-3 py-1 rounded-full text-[11px] font-bold uppercase transition-colors shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[14px]">rate_review</span>
                              <span>Verify</span>
                            </button>
                          )}

                          {/* Delete / Cancel Button */}
                          {(isStaff || rx.status === 'PENDING') && (
                            <button
                              type="button"
                              onClick={() => handleDeletePrescription(rx.id)}
                              title="Delete prescription"
                              className="w-7 h-7 rounded-full bg-red-50 hover:bg-red-100 text-red-600 inline-flex items-center justify-center transition-colors"
                            >
                              <span className="material-symbols-outlined text-[15px]">delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: RETENTION & DISK STORAGE PANEL                    */}
      {/* ======================================================== */}
      {activeTab === 'retention' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-border shadow-sm space-y-6">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight text-brand-charcoal">
                Disk Storage &amp; Auto-Deletion Policy
              </h2>
              <p className="text-xs text-on-surface-variant mt-1">
                Automated local disk sanitation policies and chronic subscription protections.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-surface-container-low border border-brand-border">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                  Storage Directory
                </span>
                <span className="font-mono text-xs font-bold text-brand-charcoal block">
                  uploads/prescriptions/
                </span>
                <span className="text-[11px] text-on-surface-variant mt-1 block">
                  Local server file storage path
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-surface-container-low border border-brand-border">
                <span className="text-[11px] font-bold uppercase tracking-wider text-on-surface-variant block mb-1">
                  Rejected Retention Window
                </span>
                <span className="text-lg font-black text-brand-charcoal block">
                  7 Days
                </span>
                <span className="text-[11px] text-on-surface-variant mt-1 block">
                  Files auto-purged after 7 days
                </span>
              </div>
            </div>

            {/* Chronic Protection Policy */}
            <div className="p-4 rounded-2xl bg-[#FAF8DE] border border-[#EFE298] space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-brand-charcoal">
                <span className="material-symbols-outlined text-[18px] text-amber-800">all_inclusive</span>
                <span>Chronic Subscription Exemption</span>
              </div>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Prescriptions uploaded with the <strong>"Chronic Subscription"</strong> flag are strictly immune to automated retention purges. Their documents remain intact on disk until a pharmacist or system administrator explicitly removes the record.
              </p>
            </div>

            {/* Manual Cleanup Trigger */}
            <div className="pt-4 border-t border-brand-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-charcoal">
                  Execute Manual Cleanup Routine
                </h4>
                <p className="text-[11px] text-on-surface-variant">
                  Immediately purges expired rejected files (&gt;7 days) and removes orphaned disk files.
                </p>
              </div>

              <button
                type="button"
                onClick={handleRunCleanup}
                disabled={cleanupLoading}
                className="bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 rounded-full transition-all shadow-sm shrink-0 disabled:opacity-50 flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">cleaning_services</span>
                <span>{cleanupLoading ? 'Running...' : 'Run Auto-Deletion Now'}</span>
              </button>
            </div>

            {/* Cleanup Report Output */}
            {cleanupReport && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
                <span className="font-bold block">Cleanup Routine Completed:</span>
                <div>Purged Expired Rejected Files: {cleanupReport.purgedRejectedFiles}</div>
                <div>Orphaned Disk Files Cleaned: {cleanupReport.orphanedFilesCleaned}</div>
                <div>Retention Threshold: {cleanupReport.retentionDays} days</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: DOCUMENT INSPECTOR PREVIEW                      */}
      {/* ======================================================== */}
      {previewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-brand-border flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <div>
                <h3 className="font-black text-base uppercase text-brand-charcoal">
                  Prescription Document #{previewingDoc.id}
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {previewingDoc.originalFileName} ({((previewingDoc.fileSizeBytes || 0) / (1024 * 1024)).toFixed(2)} MB)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewingDoc(null)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-black hover:text-white flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-auto my-4 flex items-center justify-center bg-[#F5F7F8] rounded-2xl p-4 min-h-[350px]">
              {previewingDoc.contentType?.includes('pdf') ? (
                <iframe
                  src={getFileStreamUrl(previewingDoc)}
                  title="PDF Viewer"
                  className="w-full h-[500px] rounded-xl border border-brand-border"
                ></iframe>
              ) : (
                <img
                  src={getFileStreamUrl(previewingDoc)}
                  alt="Prescription Scan"
                  className="max-h-[500px] object-contain rounded-xl shadow"
                />
              )}
            </div>

            <div className="pt-3 border-t border-brand-border flex items-center justify-between text-xs">
              <span className="text-on-surface-variant">
                Uploaded by: <strong>{previewingDoc.customerName}</strong>
              </span>
              <a
                href={getFileStreamUrl(previewingDoc)}
                target="_blank"
                rel="noreferrer"
                download
                className="bg-black text-white px-4 py-1.5 rounded-full font-bold uppercase text-[11px] tracking-wider"
              >
                Open in Full Window
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CLINICAL VERIFICATION ACTION DRAWER             */}
      {/* ======================================================== */}
      {verifyingPrescription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-brand-border space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center">
                  <span className="material-symbols-outlined text-[16px]">rate_review</span>
                </span>
                <div>
                  <h3 className="font-black text-base uppercase text-brand-charcoal">
                    Clinical Verification • Rx #{verifyingPrescription.id}
                  </h3>
                  <p className="text-xs text-on-surface-variant">
                    Prescriber: {verifyingPrescription.doctorName || 'Unknown'} • Patient: {verifyingPrescription.customerName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerifyingPrescription(null)}
                className="w-8 h-8 rounded-full bg-surface-container hover:bg-black hover:text-white flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="space-y-4">
              {/* Decision Selector */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface">
                  Verification Decision
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVerificationStatus('APPROVED')}
                    className={`h-11 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
                      verificationStatus === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">check_circle</span>
                    <span>Approve Prescription</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVerificationStatus('REJECTED')}
                    className={`h-11 rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all ${
                      verificationStatus === 'REJECTED'
                        ? 'bg-red-600 text-white border-red-600 shadow-md'
                        : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[18px]">cancel</span>
                    <span>Reject Prescription</span>
                  </button>
                </div>
              </div>

              {/* Rejection Reason (only shown when REJECTED) */}
              {verificationStatus === 'REJECTED' && (
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface">
                    Rejection Reason
                  </label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full h-10 px-3.5 rounded-full bg-surface-container-low text-xs text-on-surface border border-brand-border focus:outline-none focus:ring-1 focus:ring-black"
                  >
                    <option value="Signature illegible or missing">Doctor signature illegible or missing</option>
                    <option value="Prescription expired (>12 months)">Prescription expired (&gt;12 months)</option>
                    <option value="Drug name or dosage strength unclear">Drug name or dosage strength unclear</option>
                    <option value="Suspected document alteration">Suspected document alteration</option>
                    <option value="Medication requires in-person specialist clinic">Medication requires in-person specialist clinic</option>
                    <option value="Medication unavailable or discontinued">Medication unavailable or discontinued</option>
                  </select>

                  {/* Immediate auto-delete option */}
                  <div className="pt-2">
                    {verifyingPrescription.chronicSubscription ? (
                      <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900">
                        <span className="font-bold">Protected:</span> This is a Chronic Subscription. The physical file will be <strong>preserved</strong> for future customer appeal until explicitly deleted.
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 text-xs text-red-700 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={deleteFileImmediately}
                          onChange={(e) => setDeleteFileImmediately(e.target.checked)}
                          className="w-4 h-4 rounded text-red-600 focus:ring-0 accent-red-600 cursor-pointer"
                        />
                        <span>Purge physical document file from disk storage immediately</span>
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Clinical Verification Notes */}
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface">
                  Clinical Findings &amp; Pharmacist Notes
                </label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Record verified dosage, dispensing instructions, or notes for the fulfillment team..."
                  className="w-full p-3 rounded-2xl bg-surface-container-low text-xs text-on-surface border border-brand-border focus:outline-none focus:ring-1 focus:ring-black resize-none"
                ></textarea>
              </div>

              {/* Submit Action */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setVerifyingPrescription(null)}
                  className="px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVerification}
                  className="bg-black hover:bg-zinc-800 text-white font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-full transition-all shadow-md disabled:opacity-50"
                >
                  {submittingVerification ? 'Submitting...' : 'Confirm Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PrescriptionPage;
