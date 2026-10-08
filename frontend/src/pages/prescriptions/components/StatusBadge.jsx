/**
 * StatusBadge — Displays prescription status with a colored indicator
 * IT25101923
 */

import React from 'react';
import { STATUS_CONFIG } from '../constants';

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { label: status, color: 'cancelled' };

  return (
    <span className={`rx-badge ${config.color}`}>
      <span /> {/* Color dot */}
      {config.label}
    </span>
  );
}
