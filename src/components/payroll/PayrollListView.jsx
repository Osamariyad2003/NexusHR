import React, { useCallback, useEffect, useState } from 'react';
import { Calendar, ChevronRight, Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatMoney } from './EmployeePayslips';

const STATUS_STYLES = {
  DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200'
};

const thisMonth = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Monthly payroll runs: generate a draft for a month, open a run to review and approve it. */
export const PayrollListView = ({ onSelectRun }) => {
  const { showToast } = useApp();
  const [runs, setRuns] = useState(null);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState(thisMonth());
  const [generating, setGenerating] = useState(false);

  const load = useCallback(() => {
    setError('');
    api.getPayrollRuns().then(setRuns).catch((err) => setError(err.message));
  }, []);
  useEffect(load, [load]);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await api.generatePayrollRun(period);
      const skipped = res.data.skipped.length;
      showToast(`${res.message}${skipped ? ` ${skipped} employee(s) skipped; see the run for details.` : ''}`, skipped ? 'warning' : 'success');
      onSelectRun(res.data);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Payroll</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            Monthly runs from each employee's salary and the deductions in Payroll Settings. Payslips are published when a run is approved.
          </p>
        </div>

        <div className="flex items-end gap-3">
          <label className="text-xs font-bold text-slate-700 space-y-1">
            <span className="block">Month</span>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="month"
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </label>
          <button
            onClick={generate}
            disabled={!period || generating}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            <span>{generating ? 'Generating…' : 'Generate draft'}</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
        {error && <p className="p-6 text-sm text-rose-600 font-medium">{error}</p>}
        {!error && runs === null && <p className="p-6 text-sm text-slate-400">Loading payroll runs…</p>}
        {!error && runs?.length === 0 && <p className="p-6 text-sm text-slate-500">No payroll runs yet. Pick a month and generate a draft.</p>}

        {runs?.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400">
                  <th className="py-3 px-5">Period</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Pay date</th>
                  <th className="py-3 px-4 text-right">Employees</th>
                  <th className="py-3 px-4 text-right">Gross</th>
                  <th className="py-3 px-4 text-right">Deductions</th>
                  <th className="py-3 px-4 text-right">Net pay</th>
                  <th className="py-3 px-5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {runs.map((run) => {
                  const detailed = Array.isArray(run.lines);
                  return (
                    <tr
                      key={run.id}
                      onClick={() => detailed && onSelectRun(run)}
                      className={detailed ? 'hover:bg-slate-50/80 cursor-pointer' : ''}
                    >
                      <td className="py-3.5 px-5 font-bold text-slate-900">{run.period_name || run.period}</td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${STATUS_STYLES[run.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                          {run.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">{run.pay_date || '—'}</td>
                      {detailed ? (
                        <>
                          <td className="py-3.5 px-4 text-right font-mono">{run.totals.employees}</td>
                          <td className="py-3.5 px-4 text-right font-mono">{formatMoney(run.totals.gross, run.currency)}</td>
                          <td className="py-3.5 px-4 text-right font-mono">{formatMoney(run.totals.deductions, run.currency)}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold">{formatMoney(run.totals.net, run.currency)}</td>
                          <td className="py-3.5 px-5 text-right"><ChevronRight className="w-4 h-4 text-slate-400 inline" /></td>
                        </>
                      ) : (
                        <td colSpan={5} className="py-3.5 px-4 text-right text-slate-400">Summary only (created before per-employee payroll)</td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
