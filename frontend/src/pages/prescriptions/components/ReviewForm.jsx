/**
 * ReviewForm — Pharmacist review form for verification/rejection/clarification
 * IT25101923
 */

import React, { useState } from 'react';
import { CheckCircle2, XCircle, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
import { MAX_REJECTION_REASON_LENGTH, MAX_NOTES_LENGTH, getErrorMessage } from '../constants';

export default function ReviewForm({ prescription, reasonCodes = [], onSubmit, onCancel, busy }) {
  const [status, setStatus] = useState('APPROVED');
  const [rejectionCode, setRejectionCode] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [maxUses, setMaxUses] = useState(prescription.chronicSubscription ? 6 : 1);
  const [deleteFileImmediately, setDeleteFileImmediately] = useState(false);
  const [error, setError] = useState('');

  const handleReasonCodeChange = (code) => {
    setRejectionCode(code);
    const matched = reasonCodes.find((c) => c.code === code);
    if (matched) {
      setRejectionReason(matched.label);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (status === 'REJECTED') {
      if (!rejectionReason.trim()) {
        setError('Please provide a reason for rejecting this prescription.');
        return;
      }
    }

    const payload = {
      status,
      verificationNotes: verificationNotes.trim() || null,
      rejectionCode: status === 'REJECTED' ? rejectionCode || null : null,
      rejectionReason: status === 'REJECTED' ? rejectionReason.trim() || null : null,
      maxUses: status === 'APPROVED' ? Number(maxUses) : 1,
      deleteFileImmediately: status === 'REJECTED' ? deleteFileImmediately : false,
    };

    try {
      await onSubmit(payload);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rx-form compact">
      <h3>Clinical Review & Verification</h3>

      {error && (
        <div className="rx-inline-error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Decision Radio Buttons */}
      <div>
        <label>Decision</label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
          <button
            type="button"
            className={`rx-button ${status === 'APPROVED' ? '' : 'secondary'}`}
            onClick={() => setStatus('APPROVED')}
            style={{ flex: 1 }}
          >
            <CheckCircle2 size={16} /> Approve
          </button>
          <button
            type="button"
            className={`rx-button ${status === 'CLARIFICATION_REQUIRED' ? '' : 'secondary'}`}
            onClick={() => setStatus('CLARIFICATION_REQUIRED')}
            style={{ flex: 1 }}
          >
            <HelpCircle size={16} /> Needs Clarification
          </button>
          <button
            type="button"
            className={`rx-button ${status === 'REJECTED' ? 'destructive' : 'secondary'}`}
            onClick={() => setStatus('REJECTED')}
            style={{ flex: 1 }}
          >
            <XCircle size={16} /> Reject
          </button>
        </div>
      </div>

      {/* Approved Settings: Max Uses */}
      {status === 'APPROVED' && (
        <div>
          <label htmlFor="maxUses">
            Allowed Fill Uses {prescription.chronicSubscription && <span style={{ color: 'var(--rx-teal)' }}>(Chronic Subscription)</span>}
          </label>
          <select
            id="maxUses"
            value={maxUses}
            onChange={(e) => setMaxUses(Number(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 9, 12].map((n) => (
              <option key={n} value={n}>
                {n} {n === 1 ? 'single order use' : `order refills (${n} uses)`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Rejected Settings: Reason Code & Custom Reason */}
      {status === 'REJECTED' && (
        <>
          {reasonCodes.length > 0 && (
            <div>
              <label htmlFor="rejectionCode">Reason Category</label>
              <select
                id="rejectionCode"
                value={rejectionCode}
                onChange={(e) => handleReasonCodeChange(e.target.value)}
              >
                <option value="">Select standard reason category...</option>
                {reasonCodes.map((rc) => (
                  <option key={rc.code} value={rc.code}>
                    {rc.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="rejectionReason">
              Rejection Explanation <span style={{ color: '#ac3e42' }}>*</span>
            </label>
            <textarea
              id="rejectionReason"
              rows={2}
              placeholder="Explain clearly to the customer why this prescription was rejected..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              maxLength={MAX_REJECTION_REASON_LENGTH}
            />
          </div>

          {!prescription.chronicSubscription && (
            <label className="rx-checkbox-card">
              <input
                type="checkbox"
                checked={deleteFileImmediately}
                onChange={(e) => setDeleteFileImmediately(e.target.checked)}
              />
              <div>
                <strong>Purge Document File Immediately</strong>
                <small>Check to delete the physical file right away instead of waiting for auto-retention cleanup (7 days).</small>
              </div>
            </label>
          )}
        </>
      )}

      {/* Clinical Notes */}
      <div>
        <label htmlFor="verificationNotes">
          Pharmacist / Clinical Notes <span className="rx-optional">(Visible to customer)</span>
        </label>
        <textarea
          id="verificationNotes"
          rows={2}
          placeholder="Directions for customer, dosage clarification, or pharmacist signature note..."
          value={verificationNotes}
          onChange={(e) => setVerificationNotes(e.target.value)}
          maxLength={MAX_NOTES_LENGTH}
        />
      </div>

      {/* Submit */}
      <div className="rx-form-foot">
        {onCancel && (
          <button type="button" className="rx-button secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
        <button type="submit" className={`rx-button ${status === 'REJECTED' ? 'destructive' : ''}`} disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={16} className="rx-spin" /> Saving...
            </>
          ) : (
            'Save Decision'
          )}
        </button>
      </div>
    </form>
  );
}
