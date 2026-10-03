import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2, Shield, Calendar, Filter, RefreshCw } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { api } from '../../services/api';

export const AttendanceLogView = ({ onOpenPunchModal }) => {
  const { activeSession } = useApp();
  const [records, setRecords] = useState([]);
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    api.getAttendanceRecords().then(setRecords, () => setRecords([]));
  }, [activeSession]);

  const filtered = records.filter((r) => statusFilter === 'ALL' || r.status === statusFilter);

  const unclosedCount = records.filter((r) => r.status === 'INCOMPLETE_RECONCILIATION' || (!r.check_out && r.status === 'PRESENT')).length;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Shift Punch Event Logs & Time Engine</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 font-bold">
              REQ-ATT-001 & REQ-ATT-002
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Server-authoritative UTC clock times, 15-minute grace period bounds (BR-ATT-001), and automated unclosed session reconciliation
          </p>
        </div>
        <button
          onClick={onOpenPunchModal}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          <span>Record Shift Punch Event</span>
        </button>
      </div>

      {/* REQ-ATT-002 Automated Session Expiration Alert Banner */}
      {unclosedCount > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs flex items-start gap-3 text-amber-900">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Automated Session Expiration & Reconciliation Triggered (REQ-ATT-002)</p>
            <p className="text-slate-600 mt-0.5">
              System background worker evaluated punch sessions remaining unclosed &gt;16 hours following shift start. Automatically marked <strong className="font-mono text-amber-800">INCOMPLETE_RECONCILIATION</strong> and scheduled audit flags.
            </p>
          </div>
        </div>
      )}

      {/* Attendance Roster Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filter Attendance Logs</span>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">All Punctuality Statuses</option>
              <option value="PRESENT">Present (On-Time &le; 15m)</option>
              <option value="LATE">Late (&ge; 16m Grace Window)</option>
              <option value="INCOMPLETE_RECONCILIATION">Incomplete Reconciliation</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Employee & Department</th>
                <th className="py-3.5 px-4">Shift Date</th>
                <th className="py-3.5 px-4">Check-In UTC</th>
                <th className="py-3.5 px-4">Check-Out UTC</th>
                <th className="py-3.5 px-4">Late Minute Drift</th>
                <th className="py-3.5 px-5">Status (BR-ATT-001)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-slate-900">{r.employee_name}</div>
                    <div className="text-xs text-slate-400">{r.department_name}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{r.date}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                    {r.check_in ? new Date(r.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">
                    {r.check_out ? new Date(r.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : <span className="text-amber-600 font-semibold">Active Session</span>}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    {r.late_minutes > 0 ? (
                      <span className="text-amber-700 font-bold">+{r.late_minutes} mins late</span>
                    ) : (
                      <span className="text-emerald-600 font-semibold">On Time</span>
                    )}
                  </td>
                  <td className="py-3.5 px-5">
                    <Badge status={r.status} size="xs" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
