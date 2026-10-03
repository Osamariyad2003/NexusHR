import React, { useEffect } from 'react';
import { Settings } from 'lucide-react';
import { useInbox } from '../../context/InboxContext';
import NotificationItem from './NotificationItem';

/** The bell's dropdown: my latest notifications (real, per person). */
export default function NotificationPopup({ isOpen, onClose, onShowAll, onOpenSettings, onNavigate }) {
  const { notifications, unread, markRead, markAllRead } = useInbox();

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const open = (n) => {
    if (!n.read) markRead(n.id);
    onClose();
    if (n.link) onNavigate?.(n.link);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="absolute right-0 top-full mt-2 w-96 max-w-[90vw] bg-white rounded-3xl shadow-2xl border border-slate-200 z-50 font-sans" role="dialog" aria-label="Notifications">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-black text-slate-900">Notifications</h3>
            <p className="text-[11px] text-slate-400">{unread ? `${unread} unread` : 'All caught up'}</p>
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && <button type="button" onClick={markAllRead} className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700">Mark all read</button>}
            <button type="button" onClick={onOpenSettings} title="Notification settings" className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><Settings className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {notifications.slice(0, 8).map(n => <NotificationItem key={n.id} n={n} onOpen={open} compact />)}
          {!notifications.length && <p className="py-8 text-center text-xs text-slate-400">No notifications yet.</p>}
        </div>
        <div className="p-3 border-t border-slate-100">
          <button type="button" onClick={onShowAll} className="w-full py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50">View all notifications</button>
        </div>
      </div>
    </>
  );
}
