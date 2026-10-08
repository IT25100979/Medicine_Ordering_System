/**
 * AuditTimeline — Displays append-only audit trail for a prescription
 * IT25101923
 */

import React, { useEffect, useState } from 'react';
import { History, RefreshCw } from 'lucide-react';
import client from '../../../api/client';
import { API_BASE, formatDate, getErrorMessage } from '../constants';

export default function AuditTimeline({ prescriptionId }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAudit = async () => {
    if (!prescriptionId) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get(`${API_BASE}/${prescriptionId}/audit`);
      setItems(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAudit();
  }, [prescriptionId]);

  return (
    <div className="rx-history">
      <h3>
        <History size={16} />
        Activity History
      </h3>

      {loading ? (
        <p className="rx-muted">Loading audit log...</p>
      ) : error ? (
        <div className="rx-inline-error">{error}</div>
      ) : items.length === 0 ? (
        <p className="rx-muted">No activity history recorded yet.</p>
      ) : (
        items.map((item) => (
          <div key={item.id} className="rx-timeline-item">
            <span className="rx-timeline-dot" />
            <div>
              <strong>
                {item.action.replace(/_/g, ' ').toLowerCase()} by {item.actorName}
              </strong>
              <small>{formatDate(item.createdAt)}</small>
              {item.details && <p>{item.details}</p>}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
