/**
 * DocumentPreview — Renders uploaded file (PDF iframe or image preview)
 * IT25101923
 */

import React from 'react';
import { Download, ExternalLink, ShieldAlert } from 'lucide-react';
import { API_BASE } from '../constants';

export default function DocumentPreview({ prescription }) {
  if (!prescription) return null;

  const { id, isFileDeleted, contentType, originalFileName, fileUrl } = prescription;

  if (isFileDeleted) {
    return (
      <div className="rx-document">
        <div className="rx-empty" style={{ padding: '30px' }}>
          <ShieldAlert size={36} style={{ color: '#ac3e42' }} />
          <h3>Document File Purged</h3>
          <p className="rx-muted">
            The original document file was automatically removed per clinical storage policy.
            Verification decision and activity records remain preserved.
          </p>
        </div>
      </div>
    );
  }

  const downloadUrl = `${API_BASE}/${id}/file`;
  const isPdf = contentType?.includes('pdf') || originalFileName?.toLowerCase().endsWith('.pdf');
  const isImage = contentType?.includes('image') || /\.(jpg|jpeg|png|webp)$/i.test(originalFileName || '');

  return (
    <div>
      <div className="rx-section-line">
        <h3>Document Preview</h3>
        <a
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rx-text-link"
          download={originalFileName}
        >
          <Download size={14} /> Download File
        </a>
      </div>

      <div className="rx-document">
        {isPdf ? (
          <iframe src={downloadUrl} title={originalFileName || 'Prescription Document'} />
        ) : isImage ? (
          <img src={downloadUrl} alt={originalFileName || 'Prescription Document'} />
        ) : (
          <div className="rx-empty" style={{ padding: '20px' }}>
            <p>Preview not directly supported in browser.</p>
            <a href={downloadUrl} target="_blank" rel="noopener noreferrer" className="rx-button secondary">
              <ExternalLink size={14} /> Open File
            </a>
          </div>
        )}
      </div>

      <p className="rx-muted">
        Original File: <strong>{originalFileName}</strong> ({contentType})
      </p>
    </div>
  );
}
