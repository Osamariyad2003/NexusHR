import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../services/api';
import { useApp } from './AppContext';

const InboxContext = createContext(null);
const POLL_MS = 30_000;
// Live-connection retries back off 2s, 4s, 8s ... up to one minute; the 30-second refresh keeps
// the inbox current meanwhile, so a stopped server doesn't flood the console with failed sockets.
const RETRY_MIN_MS = 2_000;
const RETRY_MAX_MS = 60_000;

/**
 * The signed-in person's notifications and unread-message count, kept current by a WebSocket
 * (new notifications and direct messages arrive live) with a 30-second refresh as a fallback.
 * Screens subscribe to live direct messages with onDirectMessage(fn).
 */
export function InboxProvider({ children }) {
  const { currentUser } = useApp();
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const listeners = useRef(new Set());

  const refresh = useCallback(async () => {
    try {
      const [n, threads] = await Promise.all([api.getNotifications(), api.getMessageThreads()]);
      setNotifications(n.data);
      setUnread(n.unread);
      setUnreadMessages(threads.reduce((sum, t) => sum + t.unread, 0));
      return true;
    } catch {
      return false; // offline or signed out: keep what we have
    }
  }, []);

  useEffect(() => {
    if (!currentUser) return undefined;
    let socket;
    let closed = false;
    let retry;
    let delay = RETRY_MIN_MS;

    // The regular refresh doubles as a check: once the server answers, reconnect straight away
    const poll = async () => {
      const ok = await refresh();
      if (ok && !closed && socket && socket.readyState === WebSocket.CLOSED) {
        delay = 0;
        scheduleRetry();
      }
    };
    const timer = setInterval(poll, POLL_MS);
    const onFocus = () => poll();
    window.addEventListener('focus', onFocus);
    refresh();

    const scheduleRetry = () => {
      if (closed) return;
      clearTimeout(retry);
      retry = setTimeout(async () => {
        // Only open a socket once the server answers again (an expired session signs out here)
        if (closed) return;
        if (!(await refresh())) {
          delay = Math.min(Math.max(delay * 2, RETRY_MIN_MS), RETRY_MAX_MS);
          scheduleRetry();
          return;
        }
        connect();
      }, delay);
    };

    const connect = () => {
      if (closed) return;
      try {
        socket = new WebSocket(api.wsUrl('/ws/notifications'));
      } catch {
        scheduleRetry();
        return;
      }
      socket.onopen = () => { delay = RETRY_MIN_MS; };
      socket.onmessage = (event) => {
        let msg;
        try { msg = JSON.parse(event.data); } catch { return; }
        if (msg.type === 'NOTIFICATION') {
          setNotifications(list => [msg.notification, ...list.filter(n => n.id !== msg.notification.id)]);
          setUnread(u => u + 1);
        }
        if (msg.type === 'DIRECT_MESSAGE') {
          if (msg.message.to_id === currentUser.id) setUnreadMessages(u => u + 1);
          listeners.current.forEach(fn => fn(msg.message));
        }
      };
      // Reconnect after a drop (not after sign-out or a session-ended close)
      socket.onclose = (e) => {
        if (closed || e.code === 4001) return;
        delay = Math.min(Math.max(delay * 2, RETRY_MIN_MS), RETRY_MAX_MS);
        scheduleRetry();
      };
    };
    // Back online: try again now instead of waiting out the back-off
    const onOnline = () => {
      if (socket && socket.readyState <= WebSocket.OPEN) return;
      delay = RETRY_MIN_MS;
      scheduleRetry();
    };
    window.addEventListener('online', onOnline);
    connect();

    return () => {
      closed = true;
      clearInterval(timer);
      clearTimeout(retry);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      if (socket?.readyState === WebSocket.CONNECTING) {
        // Closing mid-handshake logs a browser warning (React dev mode mounts twice); close once open
        socket.onopen = () => socket.close();
        socket.onmessage = null;
      } else {
        socket?.close();
      }
    };
  }, [currentUser?.id, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  const markRead = useCallback(async (id) => {
    setNotifications(list => list.map(n => (n.id === id ? { ...n, read: true } : n)));
    setUnread(u => Math.max(0, u - 1));
    try { await api.markNotificationRead(id); } catch { refresh(); }
  }, [refresh]);

  const markAllRead = useCallback(async () => {
    setNotifications(list => list.map(n => ({ ...n, read: true })));
    setUnread(0);
    try { await api.markAllNotificationsRead(); } catch { refresh(); }
  }, [refresh]);

  const onDirectMessage = useCallback((fn) => {
    listeners.current.add(fn);
    return () => listeners.current.delete(fn);
  }, []);

  return (
    <InboxContext.Provider value={{ notifications, unread, unreadMessages, refresh, markRead, markAllRead, onDirectMessage }}>
      {children}
    </InboxContext.Provider>
  );
}

export const useInbox = () => {
  const ctx = useContext(InboxContext);
  if (!ctx) throw new Error('useInbox must be used within an InboxProvider');
  return ctx;
};
