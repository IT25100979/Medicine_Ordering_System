/**
 * StatsCards — Summary metrics header for prescription counts
 * IT25101923
 */

import React from 'react';
import { FileText, Clock3, CheckCircle2, HelpCircle, ChevronRight } from 'lucide-react';

export default function StatsCards({ records, loading, filter, setFilter, countByStatus }) {
  const cards = [
    { label: 'Total prescriptions', value: records.length, Icon: FileText, color: 'all', status: 'ALL' },
    { label: 'Awaiting review', value: countByStatus('PENDING'), Icon: Clock3, color: 'pending', status: 'PENDING' },
    { label: 'Approved', value: countByStatus('APPROVED'), Icon: CheckCircle2, color: 'approved', status: 'APPROVED' },
    { label: 'Needs clarification', value: countByStatus('CLARIFICATION_REQUIRED'), Icon: HelpCircle, color: 'clarification', status: 'CLARIFICATION_REQUIRED' },
  ];

  return (
    <div className="rx-stats">
      {cards.map(({ label, value, Icon, color, status }) => (
        <button
          key={label}
          className={`rx-stat ${filter === status ? 'active' : ''}`}
          onClick={() => setFilter(status)}
        >
          <span className={`rx-stat-icon ${color}`}>
            <Icon size={20} />
          </span>
          <span>
            <small>{label}</small>
            <strong>{loading ? '—' : value}</strong>
          </span>
          <ChevronRight size={16} />
        </button>
      ))}
    </div>
  );
}
