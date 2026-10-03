import React, { useMemo, useState } from 'react';
import { Search, Download, ChevronLeft, ChevronRight, List, Grid, Check, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';
import { downloadCsv } from '../../utils/csv';
import { RejectReasonModal } from '../modals/RejectReasonModal';
import LoadState from '../common/LoadState';

const STATUS_CLASS = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border border-slate-200'
};
const fmt = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/**
 * Leave requests the signed-in person may see (the server limits managers to their team and HR to
 * everyone), as a list or a month calendar. Managers approve or reject pending requests here.
 */
export default function TimeOffRequestsView({ title, subtitle, children }) {
  const { leaveRequests, employees, currentUser, handleLeaveStatusUpdate, loadLeaveRequests } = useApp();
  const { data: policy } = useResource('leavePolicy', { settings: true, quiet: true });
  const [view, setView] = useState('list');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [rejecting, setRejecting] = useState(null);

  const typeName = (code) => policy?.leave_types.find(t => t.code === code)?.name || code;
  const canDecide = ['SUPER_ADMIN', 'HR_MANAGER', 'PEOPLE_MANAGER'].includes(currentUser?.role);
  const byId = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);

  const q = search.trim().toLowerCase();
  const filtered = leaveRequests.filter(r =>
    (status === 'ALL' || r.status === status) && (type === 'ALL' || r.leave_type === type) &&
    (!from || r.end_date >= from) && (!to || r.start_date <= to) &&
    (!q || `${r.employee_name} ${byId.get(r.employee_id)?.email || ''} ${r.reason || ''}`.toLowerCase().includes(q)));

  const exportCsv = () => downloadCsv(`${title.toLowerCase().replace(/\s+/g, '-')}-${iso(new Date())}.csv`, filtered, [
    ['Employee', r => r.employee_name], ['Type', r => typeName(r.leave_type)], ['From', r => r.start_date], ['To', r => r.end_date],
    ['Days', r => r.days_requested], ['Status', r => r.status], ['Reason', r => r.reason], ['Rejection reason', r => r.rejection_reason || '']
  ].map(([header, value]) => ({ header, value })));

  // Month calendar: approved and pending leave per day, public holidays marked
  const days = [];
  const first = new Date(month);
  const offset = (first.getDay() + 6) % 7; // Monday first
  for (let i = 0; i < offset; i++) days.push(null);
  for (let d = 1; d <= new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate(); d++) days.push(new Date(month.getFullYear(), month.getMonth(), d));
  const holidays = new Map((policy?.holidays || []).map(h => [h.date, h.name]));

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
          <p className="text-xs text-slate-500 mt-1">{subtitle} · {filtered.length} request(s)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-52">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee or reason" className="w-full pl-4 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <button type="button" onClick={exportCsv} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"><Download className="w-3.5 h-3.5" />Export CSV</button>
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200">
            {[['list', List, 'List view'], ['calendar', Grid, 'Calendar view']].map(([id, Icon, label]) => (
              <button key={id} type="button" onClick={() => setView(id)} title={label} aria-pressed={view === id} className={`p-1.5 rounded-lg ${view === id ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:text-slate-800'}`}><Icon className="w-4 h-4" /></button>
            ))}
          </div>
        </div>
      </div>

      {children}

      <div className="flex flex-wrap gap-3">
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold">
          <option value="ALL">All statuses</option>{Object.keys(STATUS_CLASS).map(s => <option key={s} value={s}>{s[0] + s.slice(1).toLowerCase()}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Filter by type" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold">
          <option value="ALL">All types</option>{(policy?.leave_types || []).map(t => <option key={t.code} value={t.code}>{t.name}</option>)}
        </select>
        {view === 'list' && (
          <>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To" className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold" />
          </>
        )}
      </div>

      <LoadState empty={!filtered.length && view === 'list'} emptyText="No leave requests match.">
        {view === 'list' ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead><tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Employee</th><th className="py-3 px-4">From</th><th className="py-3 px-4">To</th><th className="py-3 px-4">Days</th><th className="py-3 px-4">Type</th><th className="py-3 px-4">Reason</th><th className="py-3 px-4 text-right">Status</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {r.employee_avatar ? <img src={r.employee_avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-slate-200" />}
                        <div><p className="font-bold text-slate-900">{r.employee_name}</p><p className="text-[11px] text-slate-400">{byId.get(r.employee_id)?.email || r.department_name}</p></div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{fmt(r.start_date)}</td>
                    <td className="py-3 px-4 text-slate-600">{fmt(r.end_date)}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{r.days_requested}</td>
                    <td className="py-3 px-4 text-slate-600">{typeName(r.leave_type)}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-[220px] truncate" title={r.rejection_reason ? `Rejected: ${r.rejection_reason}` : r.reason}>{r.reason}</td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'PENDING' && canDecide && r.employee_id !== currentUser?.id ? (
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={() => handleLeaveStatusUpdate(r.id, 'APPROVE')} title={`Approve ${r.employee_name}'s leave`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-bold"><Check className="w-3 h-3" />Approve</button>
                          <button type="button" onClick={() => setRejecting(r)} title={`Reject ${r.employee_name}'s leave`} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500 text-white font-bold"><X className="w-3 h-3" />Reject</button>
                        </div>
                      ) : (
                        <span className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${STATUS_CLASS[r.status] || ''}`}>{r.status[0] + r.status.slice(1).toLowerCase()}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Previous month" className="p-2 rounded-xl hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
              <h2 className="text-sm font-black text-slate-900">{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
              <button type="button" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Next month" className="p-2 rounded-xl hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-[11px]">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="text-center font-bold text-slate-400 py-1">{d}</div>)}
              {days.map((d, i) => {
                if (!d) return <div key={`e${i}`} />;
                const day = iso(d);
                const off = filtered.filter(r => ['APPROVED', 'PENDING'].includes(r.status) && r.start_date <= day && r.end_date >= day);
                return (
                  <div key={day} className={`min-h-[76px] rounded-lg border p-1.5 space-y-1 ${holidays.has(day) ? 'bg-violet-50 border-violet-200' : 'border-slate-100'}`}>
                    <p className="font-bold text-slate-500">{d.getDate()}</p>
                    {holidays.has(day) && <p className="text-[10px] font-bold text-violet-700 truncate">{holidays.get(day)}</p>}
                    {off.slice(0, 3).map(r => (
                      <p key={r.id} className={`truncate rounded px-1 ${r.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`} title={`${r.employee_name}: ${typeName(r.leave_type)} (${r.status.toLowerCase()})`}>{r.employee_name.split(' ')[0]}</p>
                    ))}
                    {off.length > 3 && <p className="text-slate-400">+{off.length - 3} more</p>}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-400">Green: approved · Amber: pending · Purple: public holiday</p>
          </div>
        )}
      </LoadState>

      <RejectReasonModal isOpen={Boolean(rejecting)} requestId={rejecting?.id} employeeName={rejecting?.employee_name}
        onClose={() => setRejecting(null)}
        onConfirm={async (id, reason) => { await handleLeaveStatusUpdate(id, 'REJECT', reason); setRejecting(null); loadLeaveRequests?.(); }} />
    </div>
  );
}
