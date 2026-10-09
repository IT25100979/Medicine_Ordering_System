import { useEffect, useRef } from 'react';
import { API_BASE_URL } from '../api/client';

/**
 * Subscribes to a backend Server-Sent Events channel (/api/v1/realtime/stream/{channel}).
 * `onEvent(type, payload)` is called for every named event except the initial CONNECTED one.
 * The browser's EventSource reconnects automatically if the connection drops.
 */
export default function useRealtimeChannel(channel, eventTypes, onEvent) {
  const handlerRef = useRef(onEvent);
  handlerRef.current = onEvent;
  const typesKey = (eventTypes || []).join(',');

  useEffect(() => {
    if (!channel || typeof EventSource === 'undefined') return undefined;

    const source = new EventSource(`${API_BASE_URL}/api/v1/realtime/stream/${channel}`);
    const listeners = typesKey.split(',').filter(Boolean).map((type) => {
      const listener = (e) => {
        let payload = null;
        try {
          payload = JSON.parse(e.data);
        } catch {
          payload = e.data;
        }
        handlerRef.current?.(type, payload);
      };
      source.addEventListener(type, listener);
      return [type, listener];
    });

    return () => {
      listeners.forEach(([type, listener]) => source.removeEventListener(type, listener));
      source.close();
    };
  }, [channel, typesKey]);
}

export const DELIVERY_EVENT_TYPES = [
  'DELIVERY_REQUESTED',
  'DELIVERY_RECORDED',
  'DELIVERY_APPROVED',
  'DELIVERY_REJECTED',
  'COURIER_ASSIGNED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'DELIVERY_FAILED',
  'OTP_VERIFICATION_FAILED',
  'OTP_REGENERATED',
  'PUT_ON_HOLD',
  'POSTPONED',
  'RESUMED',
  'TERMINATED',
];
