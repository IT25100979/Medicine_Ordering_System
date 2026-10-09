import { useEffect, useState } from 'react';
import client, { unwrap } from '../api/client';

/**
 * Reads the System Admin kill switches from the public /api/v1/health/features endpoint.
 * Returns e.g. { ORDERING: { enabled: false, reason: '...' }, DELIVERY: { enabled: true }, ... }.
 * Everything counts as enabled until the status has loaded (the server still enforces it).
 */
export default function useFeatureStatus() {
  const [status, setStatus] = useState({});

  useEffect(() => {
    let active = true;
    client.get('/api/v1/health/features')
      .then((res) => active && setStatus(unwrap(res) || {}))
      .catch(() => { /* treat as enabled; the API rejects paused actions anyway */ });
    return () => {
      active = false;
    };
  }, []);

  const isEnabled = (key) => status[key]?.enabled !== false;
  return { status, isEnabled };
}
