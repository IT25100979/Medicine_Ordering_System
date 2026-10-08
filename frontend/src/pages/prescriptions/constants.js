/**
 * Prescription Management Module — Shared Constants
 * IT25101923
 */

// API base path for all prescription endpoints
export const API_BASE = '/api/v1/prescriptions';

// Status configuration: [Human-readable label, CSS color class]
export const STATUS_CONFIG = {
  PENDING:                  { label: 'Awaiting review',      color: 'pending' },
  CLARIFICATION_REQUIRED:   { label: 'Needs clarification',  color: 'clarification' },
  APPROVED:                 { label: 'Approved',             color: 'approved' },
  REJECTED:                 { label: 'Rejected',             color: 'rejected' },
  CANCELLED:                { label: 'Cancelled',            color: 'cancelled' },
};

// File upload constraints
export const MAX_FILE_SIZE_MB = 10;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
export const ALLOWED_EXTENSIONS = /\.(pdf|jpe?g|png|webp)$/i;

// Field length limits (must match backend validation)
export const MAX_DOCTOR_NAME_LENGTH = 150;
export const MAX_NOTES_LENGTH = 2000;
export const MAX_REJECTION_REASON_LENGTH = 255;

// Chronic prescription usage limits
export const MIN_CHRONIC_USES = 1;
export const MAX_CHRONIC_USES = 12;

/**
 * Format a timestamp to a human-readable date string.
 * @param {string} value - ISO date string
 * @returns {string} Formatted date or '—' if empty
 */
export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Extract a user-friendly error message from an API error response.
 * @param {Error} error - Axios error object
 * @returns {string} Error message
 */
export function getErrorMessage(error) {
  return (
    error.response?.data?.message ||
    'We could not complete that action. Check your connection and try again.'
  );
}

/**
 * Check if a prescription can be edited by the customer.
 * Only PENDING and CLARIFICATION_REQUIRED prescriptions are editable.
 * @param {Object} rx - Prescription object
 * @returns {boolean}
 */
export function isEditable(rx) {
  return ['PENDING', 'CLARIFICATION_REQUIRED'].includes(rx.status);
}
