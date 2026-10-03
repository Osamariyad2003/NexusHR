import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useInbox } from '../../context/InboxContext';
import NotificationItem from './NotificationItem';

const TYPES = [['ALL', 'All'], ['APPROVAL', 'Approvals'], ['LEAVE_UPDATE', 'My leave'], ['PAYROLL', 'Payslips'], ['NEWS', 'News'], ['CHECKLIST', 'Checklists'], ['ATTENDANCE', 'Attendance']];

/** All my notifications, filterable; clicking one marks it read and opens its screen. */
export default function NotificationViewAll({ onNavigate }) {
  const { notifications, unread, markRead, markAllRead } = useInbox();
  const [type, setType] = useState('ALL');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const shown = notifications.filter(n => (type === 'ALL' || n.type === type) && (!onlyUnread || !n.read) && (!q || `${n.title} ${n.description}`.toLowerCase().includes(q)));

  const open = (n) => {
    if (!n.read) markRead(n.id);
    if (n.link) onNavigate?.(n.link);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Notifications</h1>
          <p className="text-xs text-slate-500 mt-1">{unread} unread of {notifications.length}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-56">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search notifications" className="w-full pl-4 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <button type="button" onClick={markAllRead} disabled={!unread} className="px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold disabled:opacity-40">Mark all read</button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {TYPES.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setType(id)} aria-pressed={type === id} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${type === id ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{label}</button>
        ))}
        <label className="flex items-center gap-2 text-xs font-bold text-slate-600 ml-2">
          <input type="checkbox" checked={onlyUnread} onChange={(e) => setOnlyUnread(e.target.checked)} className="w-4 h-4 accent-emerald-500" />Unread only
        </label>
      </div>
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-3 space-y-1">
        {shown.map(n => <NotificationItem key={n.id} n={n} onOpen={open} />)}
        {!shown.length && <p className="py-10 text-center text-xs text-slate-400">No notifications here.</p>}
      </div>
    </div>
  );
}
