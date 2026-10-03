import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';
import { downloadCsv } from '../../utils/csv';
import LoadState from '../common/LoadState';

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const mondayOf = (d) => { const m = new Date(d); m.setHours(0, 0, 0, 0); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return m; };
const hoursOf = (r) => (r.check_out ? Number(r.duration_hours) || (new Date(r.check_out) - new Date(r.check_in)) / 3600000 : 0);
const h = (n) => `${Math.round(n * 10) / 10}h`;
const time = (isoStr) => (isoStr ? new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
const STATUS = { PRESENT: 'bg-emerald-50 text-emerald-700', LATE: 'bg-amber-50 text-amber-700', INCOMPLETE_RECONCILIATION: 'bg-rose-50 text-rose-700' };

/**
 * Attendance of the people the signed-in person may see (the server limits managers to their team,
 * HR sees everyone): a week grid of hours worked per day, and the individual shifts.
 */
export const TeamAttendanceView = ({ title = 'Team Attendance' }) => {
  const { employees, currentUser } = useApp();
  const { rows: schedules } = useResource('workSchedules', { quiet: true });
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [week, setWeek] = useState(() => mondayOf(new Date()));
  const [search, setSearch] = useState('');
  const [view, setView] = useState('week');

  const load = useCallback(async () => {
    setError('');
    try {
      setRecords(await api.getAttendanceRecords());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => { const d = new Date(week); d.setDate(d.getDate() + i); return d; }), [week]);
  const from = iso(days[0]);
  const to = iso(days[6]);
  const expected = schedules.find(s => s.is_default)?.weekly_hours ?? 40;
  const inWeek = records.filter(r => r.date >= from && r.date <= to);

  // Everyone whose attendance the server returned, plus the team members who haven't clocked in
  const isHr = ['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role);
  const visibleIds = new Set(records.map(r => r.employee_id));
  const people = employees.filter(e => e.status !== 'TERMINATED' &&
    (isHr || visibleIds.has(e.id) || e.id === currentUser?.id || (currentUser?.role === 'PEOPLE_MANAGER' && e.department === currentUser.department)));
  const q = search.trim().toLowerCase();
  const shown = people.filter(e => !q || `${e.first_name} ${e.last_name} ${e.email}`.toLowerCase().includes(q));

  const rowFor = (e) => {
    const mine = inWeek.filter(r => r.employee_id === e.id);
    const perDay = days.map(d => mine.find(r => r.date === iso(d)));
    const total = mine.reduce((s, r) => s + hoursOf(r), 0);
    return { perDay, total, late: mine.filter(r => r.status === 'LATE').length, flagged: mine.filter(r => r.status === 'INCOMPLETE_RECONCILIATION' || !r.check_out).length };
  };

  const exportCsv = () => downloadCsv(`${title.toLowerCase().replace(/\s+/g, '-')}-${from}.csv`,
    inWeek.filter(r => shown.some(e => e.id === r.employee_id)).sort((a, b) => a.date.localeCompare(b.date)),
    [['Employee', r => r.employee_name], ['Date', r => r.date], ['Check in', r => time(r.check_in)], ['Check out', r => time(r.check_out)], ['Hours', r => (r.check_out ? hoursOf(r).toFixed(2) : '')], ['Status', r => r.status]]
      .map(([header, value]) => ({ header, value })));

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
          <p className="text-xs text-slate-500 mt-1">{shown.length} people · expected {h(expected)}/week (default schedule)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl px-2 py-1.5">
            <button type="button" onClick={() => setWeek(w => { const d = new Date(w); d.setDate(d.getDate() - 7); return d; })} aria-label="Previous week" className="p-1 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
            <span className="text-xs font-bold text-slate-700 px-1">{days[0].toLocaleDateString(undefined, { day: '2-digit', month: 'short' })} – {days[6].toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            <button type="button" onClick={() => setWeek(w => { const d = new Date(w); d.setDate(d.getDate() + 7); return d; })} aria-label="Next week" className="p-1 rounded-lg hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></button>
          </div>
          <div className="relative w-48">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people" className="w-full pl-4 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            {[['week', 'Week'], ['shifts', 'Shifts']].map(([id, label]) => (
              <button key={id} type="button" onClick={() => setView(id)} aria-pressed={view === id} className={`px-3 py-1 rounded-lg text-xs font-bold ${view === id ? 'bg-emerald-500 text-white' : 'text-slate-500'}`}>{label}</button>
            ))}
          </div>
          <button type="button" onClick={exportCsv} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50"><Download className="w-3.5 h-3.5" />Export CSV</button>
        </div>
      </div>

      <LoadState loading={loading} error={error} onRetry={load} empty={!shown.length} emptyText="Nobody to show.">
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-x-auto">
          {view === 'week' ? (
            <table className="w-full text-left text-xs">
              <thead><tr className="bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4">Employee</th>
                {days.map(d => <th key={iso(d)} className="py-3 px-2 text-center">{d.toLocaleDateString(undefined, { weekday: 'short' })}<br /><span className="font-semibold normal-case">{d.getDate()}</span></th>)}
                <th className="py-3 px-3 text-right">Total</th><th className="py-3 px-3 text-right">Late</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {shown.map(e => {
                  const row = rowFor(e);
                  return (
                    <tr key={e.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4"><p className="font-bold text-slate-900">{`${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name}</p><p className="text-[11px] text-slate-400">{e.job_title}</p></td>
                      {row.perDay.map((r, i) => (
                        <td key={i} className="py-3 px-2 text-center">
                          {r ? <span className={`inline-block px-2 py-0.5 rounded-md font-bold ${STATUS[r.status] || 'bg-slate-50 text-slate-600'}`} title={`${time(r.check_in)}–${time(r.check_out)} ${r.status}`}>{r.check_out ? h(hoursOf(r)) : 'open'}</span> : <span className="text-slate-300">—</span>}
                        </td>
                      ))}
                      <td className={`py-3 px-3 text-right font-black ${row.total < expected ? 'text-slate-700' : 'text-emerald-700'}`}>{h(row.total)}<span className="text-slate-400 font-semibold">/{h(expected)}</span></td>
                      <td className="py-3 px-3 text-right font-bold text-amber-700">{row.late || ''}{row.flagged ? <span className="text-rose-600 ml-1" title="Open or flagged shifts">⚑{row.flagged}</span> : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left text-xs">
              <thead><tr className="bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400"><th className="py-3 px-4">Employee</th><th className="py-3 px-4">Date</th><th className="py-3 px-4">Check in</th><th className="py-3 px-4">Check out</th><th className="py-3 px-4">Hours</th><th className="py-3 px-4">Status</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {inWeek.filter(r => shown.some(e => e.id === r.employee_id)).sort((a, b) => b.date.localeCompare(a.date)).map(r => (
                  <tr key={r.id}>
                    <td className="py-3 px-4 font-bold text-slate-900">{r.employee_name}</td>
                    <td className="py-3 px-4 text-slate-600">{r.date}</td>
                    <td className="py-3 px-4 text-slate-600">{time(r.check_in)}</td>
                    <td className="py-3 px-4 text-slate-600">{time(r.check_out)}</td>
                    <td className="py-3 px-4 font-bold text-slate-800">{r.check_out ? h(hoursOf(r)) : '—'}</td>
                    <td className="py-3 px-4"><span className={`px-2 py-0.5 rounded-md font-bold ${STATUS[r.status] || 'bg-slate-50 text-slate-600'}`}>{r.status === 'INCOMPLETE_RECONCILIATION' ? 'Needs review' : r.status[0] + r.status.slice(1).toLowerCase()}{r.late_minutes ? ` (+${r.late_minutes}m)` : ''}</span></td>
                  </tr>
                ))}
                {!inWeek.length && <tr><td colSpan={6} className="py-6 px-4 text-slate-400">No shifts recorded this week.</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      </LoadState>
    </div>
  );
};

export default TeamAttendanceView;
