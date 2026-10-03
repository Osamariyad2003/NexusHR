import React from 'react';
import { Bell, CalendarCheck, Wallet, Newspaper, Clock, ClipboardList, CheckCircle2 } from 'lucide-react';

const ICONS = {
  APPROVAL: [CheckCircle2, 'bg-amber-100 text-amber-700'],
  LEAVE_UPDATE: [CalendarCheck, 'bg-emerald-100 text-emerald-700'],
  PAYROLL: [Wallet, 'bg-indigo-100 text-indigo-700'],
  NEWS: [Newspaper, 'bg-sky-100 text-sky-700'],
  ATTENDANCE: [Clock, 'bg-rose-100 text-rose-700'],
  CHECKLIST: [ClipboardList, 'bg-violet-100 text-violet-700']
};

export const whenLabel = (iso) => {
  const d = new Date(iso);
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 1) return 'Now';
  if (mins < 60) return `${mins}m ago`;
  if (mins < 24 * 60 && d.toDateString() === new Date().toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

/** One notification row; clicking marks it read and opens the screen it points to. */
export default function NotificationItem({ n, onOpen, compact }) {
  const [Icon, cls] = ICONS[n.type] || [Bell, 'bg-slate-100 text-slate-600'];
  return (
    <button type="button" onClick={() => onOpen(n)} className={`w-full flex items-start gap-3 text-left p-3 rounded-2xl transition-colors ${n.read ? 'hover:bg-slate-50' : 'bg-emerald-50/50 hover:bg-emerald-50'}`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cls}`}><Icon className="w-4 h-4" /></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={`text-xs ${n.read ? 'font-semibold text-slate-700' : 'font-black text-slate-900'} truncate`}>{n.title}</p>
          <span className="text-[10px] text-slate-400 shrink-0">{whenLabel(n.created_at)}</span>
        </div>
        {n.description && <p className={`text-[11px] text-slate-500 mt-0.5 ${compact ? 'truncate' : ''}`}>{n.description}</p>}
      </div>
      {!n.read && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" aria-label="Unread" />}
    </button>
  );
}
