import React, { useEffect, useMemo, useState } from 'react';
import { Clock, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

const PAGE_SIZE = 8;
const STATUS_STYLES = {
  PRESENT: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  LATE: 'bg-amber-50 text-amber-700 border-amber-200',
  INCOMPLETE_RECONCILIATION: 'bg-rose-50 text-rose-700 border-rose-200'
};

const pad = (n) => String(n).padStart(2, '0');
const formatElapsed = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${pad(Math.floor(s / 3600))}h ${pad(Math.floor((s % 3600) / 60))}m ${pad(s % 60)}s`;
};
const formatTime = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
const hoursOf = (r) => (r.check_in && r.check_out ? (new Date(r.check_out) - new Date(r.check_in)) / 3600000 : 0);
const formatHours = (h) => `${Math.floor(h)}h ${pad(Math.round((h % 1) * 60))}m`;

/** The signed-in employee's own shifts, with real punch in/out (BR-ATT-001). */
export const MyAttendanceView = () => {
  const { activeSession, handlePunchEvent, currentUser } = useApp();
  const [records, setRecords] = useState(null);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [showClockOutModal, setShowClockOutModal] = useState(false);
  const [punching, setPunching] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Reload after every punch (activeSession changes)
  useEffect(() => {
    api.getAttendanceRecords(currentUser.id)
      .then((list) => setRecords(list.filter((r) => r.employee_id === currentUser.id).sort((a, b) => String(b.check_in).localeCompare(String(a.check_in)))))
      .catch((err) => setError(err.message));
  }, [activeSession, currentUser.id]);

  // Live timer while checked in
  useEffect(() => {
    if (!activeSession) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [activeSession]);

  const punch = async () => {
    setPunching(true);
    await handlePunchEvent(); // shows the server's result (or error) as a toast
    setPunching(false);
    setShowClockOutModal(false);
  };

  const elapsed = activeSession ? formatElapsed(now - new Date(activeSession.check_in)) : null;

  const monthPrefix = new Date().toISOString().slice(0, 7);
  const summary = useMemo(() => {
    const month = (records || []).filter((r) => String(r.date).startsWith(monthPrefix));
    return {
      shifts: month.length,
      logged: month.reduce((sum, r) => sum + hoursOf(r), 0),
      late: month.filter((r) => r.status === 'LATE').length,
      flagged: month.filter((r) => r.status === 'INCOMPLETE_RECONCILIATION').length
    };
  }, [records, monthPrefix]);

  const filtered = (records || []).filter((r) => statusFilter === 'ALL' || r.status === statusFilter);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const cards = [
    ['Shifts this month', summary.shifts],
    ['Logged time this month', formatHours(summary.logged)],
    ['Late arrivals this month', summary.late],
    ['Flagged for HR review', summary.flagged]
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Attendance</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {activeSession ? `Checked in at ${formatTime(activeSession.check_in)}` : 'You are not checked in'}
          </p>
        </div>

        <button
          onClick={() => (activeSession ? setShowClockOutModal(true) : punch())}
          disabled={punching}
          className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 disabled:opacity-60 ${
            activeSession ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{punching ? 'Saving…' : activeSession ? `Check Out · ${elapsed}` : 'Check In'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {cards.map(([label, value]) => (
          <div key={label} className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-card">
            <span className="text-xs font-bold text-slate-700">{label}</span>
            <div className="text-2xl font-black text-slate-900 mt-2">{records ? value : '…'}</div>
          </div>
        ))}
      </div>

      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 flex items-center gap-3 text-xs text-blue-700 font-medium">
        <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />
        <span>Arrivals more than 15 minutes after your shift start are marked late. Shifts left open over 16 hours are flagged for HR to correct.</span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
          >
            <option value="ALL">All Status</option>
            <option value="PRESENT">Present</option>
            <option value="LATE">Late</option>
            <option value="INCOMPLETE_RECONCILIATION">Flagged for review</option>
          </select>
        </div>

        {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Clock In</th>
                <th className="py-3 px-4">Clock Out</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Late by</th>
                <th className="py-3 px-4">Logged Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records && pageRows.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500">No attendance records yet.</td></tr>
              )}
              {pageRows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-800 font-mono">{r.date}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">{formatTime(r.check_in)}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-700">{r.check_out ? formatTime(r.check_out) : r.id === activeSession?.id ? 'In progress' : '—'}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_STYLES[r.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {r.status === 'INCOMPLETE_RECONCILIATION' ? 'Needs review' : r.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700">{r.late_minutes ? `${r.late_minutes} min` : '—'}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-800">{r.check_out ? formatHours(hoursOf(r)) : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-500">
          <span>
            {filtered.length === 0 ? '0 records' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-40" aria-label="Previous page">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-slate-700">{page} / {pageCount}</span>
            <button onClick={() => setPage(page + 1)} disabled={page === pageCount} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-40" aria-label="Next page">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showClockOutModal && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Clock out now?</h3>
              <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                <span>You checked in at {formatTime(activeSession.check_in)}. Time worked so far: <strong>{elapsed}</strong></span>
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button type="button" onClick={() => setShowClockOutModal(false)} className="flex-1 py-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button type="button" onClick={punch} disabled={punching} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-60">
                {punching ? 'Clocking out…' : 'Clock Out'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
