/**
 * CustomerPrescriptionsPage — Storefront prescription portal for patients
 * IT25101923
 */

import React from 'react';
import { Link } from 'react-router-dom';
import './prescriptions.css';
import { PlusCircle, Search, ShieldCheck, FileText, AlertCircle, Eye, Edit3, Trash2, HelpCircle } from 'lucide-react';
import usePrescriptions from './hooks/usePrescriptions';
import StatusBadge from './components/StatusBadge';
import PrescriptionDetails from './components/PrescriptionDetails';
import SubmissionForm from './components/SubmissionForm';
import StatsCards from './components/StatsCards';
import { formatDate, isEditable } from './constants';
import { UPLOAD_PRESCRIPTION, PRESCRIPTION_CATALOG } from '../../utils/prescriptionRoutes';

export default function CustomerPrescriptionsPage() {
  const {
    user,
    isAuthenticated,
    records,
    visible,
    loading,
    loadError,
    search,
    setSearch,
    filter,
    setFilter,
    countByStatus,
    notice,
    setNotice,
    modal,
    closeModal,
    selected,
    openDetails,
    openEdit,
    openRemove,
    saveSubmission,
    removePrescription,
    confirmError,
    busy,
  } = usePrescriptions({ isStaff: false });

  if (!isAuthenticated) {
    return (
      <div className="rx-page rx-customer-page rx-auth">
        <h2>Prescription Management</h2>
        <p>Please log in to your account to upload and manage your medical prescriptions.</p>
        <Link to="/login" className="rx-button">Sign In to Continue</Link>
      </div>
    );
  }

  return (
    <div className="rx-page rx-customer-page">
      {/* Customer Storefront Header */}
      <header className="rx-customer-header">
        <Link to="/" className="rx-customer-brand">
          PHARMA <span>+</span>
        </Link>
        <nav aria-label="Main Navigation">
          <Link to={PRESCRIPTION_CATALOG}>Medicine Catalog</Link>
          <Link to="/prescriptions" aria-current="page">My Prescriptions</Link>
          <Link to="/orders">My Orders</Link>
        </nav>
        <div className="rx-customer-account">
          <span>{user?.fullName}</span>
          <Link to={UPLOAD_PRESCRIPTION} className="rx-button">
            <PlusCircle size={16} /> Upload New
          </Link>
        </div>
      </header>

      <main className="rx-content">
        {/* Notice Message */}
        {notice && (
          <div className="rx-notice">
            <ShieldCheck size={18} />
            <span>{notice.message}</span>
            <button className="rx-icon-button" onClick={() => setNotice(null)}>×</button>
          </div>
        )}

        {/* Page Heading */}
        <div className="rx-heading">
          <div>
            <span className="rx-eyebrow">DIGITAL PRESCRIPTION RECORD</span>
            <h1>My Prescriptions</h1>
            <p>Upload your doctor's prescription for clinical verification before ordering Rx medicines.</p>
          </div>
          <div className="rx-heading-actions">
            <Link to={UPLOAD_PRESCRIPTION} className="rx-button">
              <PlusCircle size={16} /> Upload Prescription
            </Link>
          </div>
        </div>

        {/* Stats Metrics Header */}
        <StatsCards
          records={records}
          loading={loading}
          filter={filter}
          setFilter={setFilter}
          countByStatus={countByStatus}
        />

        {/* Guide / How it Works */}
        <div className="rx-guide">
          <div>
            <h2>Simple & Secure Verification</h2>
            <p>Your document is reviewed by certified clinical pharmacists before medicine fulfillment.</p>
          </div>
          <ol>
            <li>
              <span>1</span>
              <div>
                <strong>Upload Document</strong>
                <small>PDF or clear photo (Max 10MB)</small>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Pharmacist Review</strong>
                <small>Clinical audit & dosage check</small>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Order Medicines</strong>
                <small>Link approved Rx at checkout</small>
              </div>
            </li>
          </ol>
        </div>

        {/* Records Table Section */}
        <section className="rx-records">
          <div className="rx-records-head">
            <div>
              <h2>Submitted Prescriptions</h2>
              <p>Track the approval status of your uploaded documents.</p>
            </div>
            <div className="rx-search">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search by ID or doctor..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Chips */}
          <div className="rx-filter-row">
            {['ALL', 'PENDING', 'APPROVED', 'CLARIFICATION_REQUIRED', 'REJECTED', 'CHRONIC'].map((f) => (
              <button
                key={f}
                className={filter === f ? 'active' : ''}
                onClick={() => setFilter(f)}
              >
                {f === 'ALL' ? 'All Records' : f === 'CHRONIC' ? 'Chronic Subscriptions' : f.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="rx-loading">Loading prescription records...</div>
          ) : loadError ? (
            <div className="rx-inline-error" style={{ margin: '20px' }}>{loadError}</div>
          ) : visible.length === 0 ? (
            <div className="rx-empty">
              <FileText size={42} />
              <h3>No prescriptions found</h3>
              <p>You haven't uploaded any prescriptions matching this filter yet.</p>
              <Link to={UPLOAD_PRESCRIPTION} className="rx-button">Upload Your First Prescription</Link>
            </div>
          ) : (
            <div className="rx-table-wrap">
              <table className="rx-table">
                <thead>
                  <tr>
                    <th>Document</th>
                    <th>Doctor</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Fill Usage</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((rx) => (
                    <tr key={rx.id}>
                      <td>
                        <div className="rx-file-cell">
                          <div className="rx-file-icon">
                            <FileText size={20} />
                          </div>
                          <div>
                            <strong>Rx #{rx.id}</strong>
                            <small>{rx.originalFileName}</small>
                            {rx.chronicSubscription && <span className="rx-chronic">Chronic Subscription</span>}
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{rx.doctorName || 'Not specified'}</strong>
                        <small>{rx.patientNotes || 'No notes'}</small>
                      </td>
                      <td>
                        <StatusBadge status={rx.status} />
                      </td>
                      <td>
                        <small>{formatDate(rx.createdAt)}</small>
                      </td>
                      <td>
                        {rx.status === 'APPROVED' ? (
                          <small>{rx.usedCount || 0} / {rx.maxUses || 1} used</small>
                        ) : (
                          <small>—</small>
                        )}
                      </td>
                      <td>
                        <button className="rx-row-button" onClick={() => openDetails(rx)}>
                          <Eye size={14} /> View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Modal Dialogs */}
      {modal === 'details' && selected && (
        <PrescriptionDetails
          prescription={selected}
          isStaff={false}
          onClose={closeModal}
          onEdit={() => openEdit(selected)}
          onRemove={() => openRemove(selected)}
        />
      )}

      {modal === 'edit' && selected && (
        <div className="rx-dialog">
          <div className="rx-dialog-head">
            <h2>Edit Prescription #{selected.id}</h2>
            <button className="rx-icon-button" onClick={closeModal}>×</button>
          </div>
          <SubmissionForm
            initialData={selected}
            onSubmit={saveSubmission}
            onCancel={closeModal}
            busy={busy}
          />
        </div>
      )}

      {modal === 'remove' && selected && (
        <div className="rx-dialog">
          <div className="rx-dialog-head">
            <h2>Remove Submission #{selected.id}?</h2>
            <button className="rx-icon-button" onClick={closeModal}>×</button>
          </div>
          <div className="rx-form">
            {confirmError && <div className="rx-inline-error">{confirmError}</div>}
            <p>
              Are you sure you want to remove this prescription submission?
              Active listing will be cancelled, but audit history will be preserved for compliance.
            </p>
            <div className="rx-form-foot">
              <button className="rx-button secondary" onClick={closeModal} disabled={busy}>Cancel</button>
              <button className="rx-button destructive" onClick={removePrescription} disabled={busy}>
                {busy ? 'Removing...' : 'Confirm Remove'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
