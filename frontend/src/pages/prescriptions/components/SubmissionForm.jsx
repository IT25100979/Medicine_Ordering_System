/**
 * SubmissionForm — Prescription upload and edit form component
 * IT25101923
 */

import React, { useState } from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import {
  ALLOWED_EXTENSIONS,
  MAX_FILE_SIZE_BYTES,
  MAX_FILE_SIZE_MB,
  MAX_DOCTOR_NAME_LENGTH,
  MAX_NOTES_LENGTH,
  getErrorMessage,
} from '../constants';

export default function SubmissionForm({ initialData = null, onSubmit, onCancel, busy }) {
  const isEdit = Boolean(initialData);

  const [file, setFile] = useState(null);
  const [doctorName, setDoctorName] = useState(initialData?.doctorName || '');
  const [patientNotes, setPatientNotes] = useState(initialData?.patientNotes || '');
  const [chronicSubscription, setChronicSubscription] = useState(
    initialData?.chronicSubscription || false
  );
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const validate = () => {
    if (!isEdit && !file) {
      return 'Please choose a prescription file (PDF, JPG, PNG, or WEBP).';
    }
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        return `File size exceeds limit (${MAX_FILE_SIZE_MB}MB maximum).`;
      }
      if (!ALLOWED_EXTENSIONS.test(file.name)) {
        return 'Unsupported file format. Please upload a PDF, JPG, PNG, or WEBP document.';
      }
    }
    if (doctorName.length > MAX_DOCTOR_NAME_LENGTH) {
      return `Doctor's name cannot exceed ${MAX_DOCTOR_NAME_LENGTH} characters.`;
    }
    if (patientNotes.length > MAX_NOTES_LENGTH) {
      return `Notes cannot exceed ${MAX_NOTES_LENGTH} characters.`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }
    if (doctorName.trim()) {
      formData.append('doctorName', doctorName.trim());
    }
    if (patientNotes.trim()) {
      formData.append('patientNotes', patientNotes.trim());
    }
    formData.append('chronicSubscription', chronicSubscription.toString());

    if (isEdit && initialData?.version !== undefined) {
      formData.append('version', initialData.version);
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragging(true);
  };

  const handleDragLeave = () => setDragging(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rx-form">
      {error && (
        <div className="rx-inline-error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* File Upload / Replace Section */}
      <div>
        <label>
          Prescription File {!isEdit && <span style={{ color: '#ac3e42' }}>*</span>}
          {isEdit && <span className="rx-optional">(Upload new file to replace existing)</span>}
        </label>
        <div
          className={`rx-drop ${dragging ? 'dragging' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="rx-file-input"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={(e) => e.target.files?.[0] && setFile(e.target.files[0])}
          />
          <label htmlFor="rx-file-input" style={{ cursor: 'pointer', width: '100%' }}>
            <Upload size={28} style={{ color: 'var(--rx-teal)', margin: '0 auto 8px' }} />
            <p>
              {file ? (
                <strong>Selected: {file.name}</strong>
              ) : isEdit ? (
                'Drag & drop a new document or click to replace'
              ) : (
                'Drag & drop document or click to browse'
              )}
            </p>
            <small>PDF, JPG, PNG, WEBP (Max {MAX_FILE_SIZE_MB}MB)</small>
          </label>
        </div>
        {isEdit && !file && (
          <small className="rx-muted" style={{ display: 'block', marginTop: '6px' }}>
            Current file: {initialData.originalFileName}
          </small>
        )}
      </div>

      {/* Doctor Name */}
      <div>
        <label htmlFor="doctorName">
          Prescribing Doctor's Name <span className="rx-optional">(Optional)</span>
        </label>
        <input
          id="doctorName"
          type="text"
          placeholder="e.g. Dr. A. Perera (SLMC 45123)"
          value={doctorName}
          onChange={(e) => setDoctorName(e.target.value)}
          maxLength={MAX_DOCTOR_NAME_LENGTH}
        />
      </div>

      {/* Patient / Doctor Notes */}
      <div>
        <label htmlFor="patientNotes">
          Notes or Dosage Instructions <span className="rx-optional">(Optional)</span>
        </label>
        <textarea
          id="patientNotes"
          rows={3}
          placeholder="Any special notes, allergies, or specific medicine quantities required..."
          value={patientNotes}
          onChange={(e) => setPatientNotes(e.target.value)}
          maxLength={MAX_NOTES_LENGTH}
        />
      </div>

      {/* Chronic Subscription Checkbox */}
      <label className="rx-checkbox-card">
        <input
          type="checkbox"
          checked={chronicSubscription}
          onChange={(e) => setChronicSubscription(e.target.checked)}
        />
        <div>
          <strong>Chronic / Repeating Prescription</strong>
          <small>
            Check this if you require recurring refills for long-term treatment. Chronic prescriptions are preserved across multiple uses (1–12 refills) and protected against automated retention cleanup.
          </small>
        </div>
      </label>

      {/* Buttons */}
      <div className="rx-form-foot">
        {onCancel && (
          <button type="button" className="rx-button secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        )}
        <button type="submit" className="rx-button" disabled={busy}>
          {busy ? (
            <>
              <Loader2 size={16} className="rx-spin" /> Submitting...
            </>
          ) : isEdit ? (
            'Save Changes'
          ) : (
            'Submit Prescription'
          )}
        </button>
      </div>
    </form>
  );
}
