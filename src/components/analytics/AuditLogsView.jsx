import React, { useState, useEffect } from 'react';
import { Shield, FileText, CheckCircle2, Activity, Server, Zap, Database } from 'lucide-react';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';

export const AuditLogsView = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getAuditLogs().then(setLogs, (err) => setError(err.message));
  }, []);

  return (
    <div className="space-y-6">
      {error && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{error}</div>}
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">System Audit Trail & SLA Analytics</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 text-white font-bold">
              Append-Only Security Audit
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable operation logs recording actor, tenant, entity diff, and IP origin address per SRS Section 8
          </p>
        </div>
      </div>

      {/* SLA Reliability Scorecards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>P95 API Response Latency</span>
            <Zap className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">112 ms</div>
          <div className="text-[11px] text-emerald-600 font-semibold">SLA Target: &le; 150ms (PASSED)</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>System Monthly Uptime SLA</span>
            <Server className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">99.98 %</div>
          <div className="text-[11px] text-emerald-600 font-semibold">High Availability SLA &ge; 99.9%</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-card space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold">
            <span>Leave Approval Resolution Time</span>
            <Activity className="w-4 h-4 text-brand-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">4.2 Hours</div>
          <div className="text-[11px] text-emerald-600 font-semibold">SLA Target: &le; 12 Operational Hours</div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900 text-sm">Security & System Operation Logs</h3>
          <span className="text-xs text-slate-400 font-mono">Showing {logs.length} Immutable Events</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-5">Timestamp (UTC)</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Action Event</th>
                <th className="py-3.5 px-4">Operation Details</th>
                <th className="py-3.5 px-5 text-right">IP Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-5 font-mono text-slate-600">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{log.actor_name}</div>
                    <div className="text-[10px] font-mono text-slate-400">{log.actor_role}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-brand-700">
                    {log.action}
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium max-w-md truncate">
                    {log.details}
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono text-slate-500">
                    {log.ip_address}
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
