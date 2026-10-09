import React, { useCallback, useEffect, useRef, useState } from 'react';
import client, { unwrap } from '../api/client';
import { useAuth } from '../context/AuthContext';

const POLL_MS = 30000;

const timeAgo = (value) => {
  if (!value) return '';
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return new Date(value).toLocaleDateString();
};

/**
 * In-app notification centre (bell + dropdown) for any logged-in user.
 * `variant="dark"` for the staff headers, default light for the storefront.
 */
const NotificationBell = ({ variant = 'light' }) => {
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef(null);

  const load = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    try {
      const data = unwrap(await client.get('/api/v1/notifications'));
      setItems(data?.items || []);
      setUnread(data?.unreadCount || 0);
    } catch {
      /* not fatal: the bell just stays as it was */
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return undefined;
    load();
    const timer = setInterval(load, POLL_MS);
    window.addEventListener('focus', load);
    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', load);
    };
  }, [isAuthenticated, load]);

  // Close when clicking outside
  useEffect(() => {
    if (!open) return undefined;
    const onClick = (e) => boxRef.current && !boxRef.current.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  if (!isAuthenticated) return null;

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      await load();
      setLoading(false);
    }
  };

  const markRead = async (n) => {
    if (n.read) return;
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      await client.put(`/api/v1/notifications/${n.id}/read`);
    } catch {
      load();
    }
  };

  const markAllRead = async () => {
    setItems((prev) => prev.map((x) => ({ ...x, read: true })));
    setUnread(0);
    try {
      await client.put('/api/v1/notifications/read-all');
    } catch {
      load();
    }
  };

  const dark = variant === 'dark';

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className={`relative w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
          dark
            ? 'bg-zinc-900 border border-zinc-800 text-zinc-200 hover:bg-zinc-800'
            : 'hover:bg-neutral-200/80 text-neutral-800'
        }`}
      >
        <i className="fa-solid fa-bell text-sm" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white text-neutral-900 rounded-2xl shadow-2xl border border-neutral-200 z-[60] overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
            <span className="text-xs font-black uppercase tracking-wider">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={markAllRead} className="text-[11px] font-bold text-emerald-700 hover:underline">
                Mark all as read
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {loading && items.length === 0 ? (
              <p className="p-6 text-center text-xs text-neutral-400">Loading...</p>
            ) : items.length === 0 ? (
              <p className="p-6 text-center text-xs text-neutral-400">You have no notifications.</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => markRead(n)}
                  className={`w-full text-left px-4 py-3 border-b border-neutral-100 hover:bg-neutral-50 flex gap-2 ${
                    n.read ? '' : 'bg-emerald-50/50'
                  }`}
                >
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${n.read ? 'bg-transparent' : 'bg-emerald-600'}`} />
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-neutral-900">{n.title}</span>
                    <span className="block text-[11px] text-neutral-600 mt-0.5">{n.message}</span>
                    <span className="block text-[10px] text-neutral-400 mt-1">{timeAgo(n.sentAt)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
