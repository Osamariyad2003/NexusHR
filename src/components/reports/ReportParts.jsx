import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, Download } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';
import { api } from '../../services/api';
import { downloadCsv } from '../../utils/csv';
import LoadState from '../common/LoadState';

export const PALETTE = ['#10B981', '#6366F1', '#F59E0B', '#EC4899', '#3B82F6', '#8B5CF6', '#14B8A6', '#94A3B8'];

/** Loads the computed reports (backend services/reports.service.js). */
export function useReports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setError('');
    try {
      setData((await api.request('/reports/summary')).data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, reload: load };
}

export const monthLabel = (key) => new Date(`${key}-01T00:00:00`).toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
export const toPairs = (obj) => Object.entries(obj || {}).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

/** Page frame shared by every report: back link, title, CSV download, scope note, loading/error. */
export function ReportFrame({ title, subtitle, onBack, reports, csv, children }) {
  const { data, loading, error, reload } = reports;
  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{title}</h1>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
            <button type="button" onClick={onBack} className="hover:text-emerald-600 font-bold flex items-center gap-1"><ChevronLeft className="w-3.5 h-3.5" /><span>List Report</span></button>
            {data && <span>· {subtitle} · as of {data.as_of}{data.scope !== 'company' ? ` · ${data.scope.replace('department:', '')} only` : ''}</span>}
          </div>
        </div>
        {csv && data && (
          <button type="button" onClick={() => downloadCsv(`${csv.name}-${data.as_of}.csv`, csv.rows(data), csv.columns.map(([header, value]) => ({ header, value })))}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50">
            <Download className="w-3.5 h-3.5" />Download CSV
          </button>
        )}
      </div>
      <LoadState loading={loading} error={error} onRetry={reload}>{data && children(data)}</LoadState>
    </div>
  );
}

export const Card = ({ title, children, className = '' }) => (
  <div className={`bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 ${className}`}>
    {title && <h2 className="text-sm font-black text-slate-900 mb-4">{title}</h2>}
    {children}
  </div>
);

export const Stat = ({ label, value, hint }) => (
  <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-5">
    <p className="text-xs font-bold text-slate-400">{label}</p>
    <p className="text-3xl font-black text-slate-900 mt-1">{value}</p>
    {hint && <p className="text-[11px] text-slate-400 mt-1">{hint}</p>}
  </div>
);

export const Donut = ({ data }) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
          {data.map((d, i) => <Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />)}
        </Pie>
        <Tooltip />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export const Bars = ({ data, bars, xKey = 'name' }) => (
  <div className="h-64">
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
        <Tooltip />
        {bars.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
        {bars.map(([key, name, color]) => <Bar key={key} dataKey={key} name={name} fill={color} radius={[4, 4, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer>
  </div>
);

/** Plain table; rows are objects, columns are [header, (row) => cell] pairs. */
export const Table = ({ rows, columns, empty = 'No rows.' }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-xs">
      <thead><tr className="bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400">{columns.map(([h]) => <th key={h} className="py-3 px-4">{h}</th>)}</tr></thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((r, i) => <tr key={r.id || i} className="hover:bg-slate-50/60">{columns.map(([h, cell]) => <td key={h} className="py-3 px-4 text-slate-700">{cell(r) ?? '—'}</td>)}</tr>)}
      </tbody>
    </table>
    {!rows.length && <p className="py-6 text-center text-xs text-slate-400">{empty}</p>}
  </div>
);

export const Filter = ({ label, value, onChange, options }) => (
  <select value={value} onChange={(e) => onChange(e.target.value)} aria-label={label} className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold">
    <option value="ALL">{label}: all</option>
    {options.map(o => <option key={o} value={o}>{o}</option>)}
  </select>
);
