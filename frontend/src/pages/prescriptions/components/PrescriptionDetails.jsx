/**
 * PrescriptionDetails — Modal dialog showing full details, document preview,
 * assessment panel, pharmacist review form, usage progress bar, and audit timeline.
 * IT25101923
 */

import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, FileText, UserCheck, ShieldCheck, Edit3, Trash2 } from 'lucide-react';
import DocumentPreview from './DocumentPreview';
import StatusBadge from './StatusBadge';
import ReviewForm from './ReviewForm';
import AuditTimeline from './AuditTimeline';
import { formatDate, isEditable } from '../constants';

export default function PrescriptionDetails({
  prescription,
  isStaff,
  reasonCodes,
  onClose,
  onEdit,
  onRemove,
  onVerify,
}) {
  if (!prescription) return null;

  const [showReviewForm, setShowReviewForm] = useState(false);

  const used = prescription.usedCount || 0;
  const max = prescription.maxUses || 1;
  const usagePercent = Math.min(100, Math.round((used / max) * 100));

  return (
    <div className="rx-dialog wide">
      {/* Dialog Header */}
      <div className="rx-dialog-head">
        <div>
          <h2>Prescription Details</h2>
          <small className="rx-muted">ID #{prescription.id} • Submitted by {prescription.customerName}</small>
        </div>
        <button className="rx-icon-button" onClick={onClose} aria-label="Close modal">
          <X size={20} />
        </button>
      </div>

      <div className="rx-detail-grid">
        {/* Left Side: Document Preview & Meta */}
        <div className="rx-document-panel">
          <DocumentPreview prescription={prescription} />

          <div className="rx-detail-meta">
            <div>
              <small>Prescribing Doctor</small>
              <strong>{prescription.doctorName || 'Not specified'}</strong>
            </div>
            <div>
              <small>Submission Type</small>
              <strong>{prescription.chronicSubscription ? 'Chronic (Recurring Refills)' : 'Standard Single Prescription'}</strong>
            </div>
            <div>
              <small>Submitted On</small>
              <strong>{formatDate(prescription.createdAt)}</strong>
            </div>
            <div>
              <small>Current Status</small>
              <div><StatusBadge status={prescription.status} /></div>
            </div>
          </div>

          {prescription.patientNotes && (
            <div className="rx-note">
              <small>Patient Notes</small>
              <p>{prescription.patientNotes}</p>
            </div>
          )}

          {/* Customer Action Buttons inside detail view */}
          {!isStaff && isEditable(prescription) && (
            <div className="rx-section-line" style={{ marginTop: '20px' }}>
              {onEdit && (
                <button className="rx-button secondary" onClick={onEdit}>
                  <Edit3 size={14} /> Resubmit / Edit
                </button>
              )}
              {onRemove && (
                <button className="rx-text-link danger" onClick={onRemove}>
                  <Trash2 size={14} /> Remove Submission
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right Side: Assessment Panel & Pharmacist Form / History */}
        <div className="rx-assessment">
          {/* Status Callout */}
          {prescription.status === 'APPROVED' && (
            <div className="rx-callout">
              <CheckCircle2 size={18} />
              <div>
                <strong>Prescription Verified & Approved</strong>
                <p>
                  Verified by {prescription.verifiedByName || 'Pharmacist'} on {formatDate(prescription.verifiedAt)}.
                  {prescription.verificationNotes && ` Notes: ${prescription.verificationNotes}`}
                </p>
              </div>
            </div>
          )}

          {prescription.status === 'REJECTED' && (
            <div className="rx-callout rose">
              <AlertTriangle size={18} />
              <div>
                <strong>Prescription Rejected</strong>
                <p>
                  Reason: {prescription.rejectionReason || 'Document did not meet clinical verification criteria.'}
                  {prescription.verificationNotes && ` Notes: ${prescription.verificationNotes}`}
                </p>
              </div>
            </div>
          )}

          {prescription.status === 'CLARIFICATION_REQUIRED' && (
            <div className="rx-callout amber">
              <AlertTriangle size={18} />
              <div>
                <strong>Clarification Required</strong>
                <p>
                  {prescription.verificationNotes || 'Please upload a clearer image or provide doctor seal verification.'}
                </p>
              </div>
            </div>
          )}

          {/* Usage Progress for Approved Prescriptions */}
          {prescription.status === 'APPROVED' && (
            <div className="rx-usage">
              <div className="rx-section-line">
                <strong>Approved Fill Usage</strong>
                <span>{used} of {max} uses fulfilled</span>
              </div>
              <progress value={used} max={max} />
              <small>
                {used >= max
                  ? 'All allowed refills have been fulfilled.'
                  : `${max - used} refill use(s) remaining.`}
              </small>
            </div>
          )}

          {/* Pharmacist Action Area */}
          {isStaff && (
            <div>
              {!showReviewForm ? (
                <button
                  className="rx-button"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setShowReviewForm(true)}
                >
                  <UserCheck size={16} /> Review / Change Status
                </button>
              ) : (
                <ReviewForm
                  prescription={prescription}
                  reasonCodes={reasonCodes}
                  onSubmit={onVerify}
                  onCancel={() => setShowReviewForm(false)}
                />
              )}
            </div>
          )}

          {/* Activity Timeline */}
          <AuditTimeline prescriptionId={prescription.id} />
        </div>
      </div>
    </div>
  );
}
