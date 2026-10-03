import React, { useState } from 'react';
import { ChevronLeft, Download, FileText, CheckCircle2, Trash2, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { downloadCsv } from '../../utils/csv';
import { formatMoney } from './EmployeePayslips';

/** One payroll run: per-employee lines, approval, CSV export and payslips. */
export const PayrollRunView = ({ run: initialRun, onBack, onChanged }) => {
  const { showToast, currentUser } = useApp();
  const [run, setRun] = useState(initialRun);
  const [busy, setBusy] = useState('');
  const [confirmApprove, setConfirmApprove] = useState(false);
  const money = (amount) => formatMoney(amount, run.currency);
  const isDraft = run.status === 'DRAFT';
  // Four-eyes control (enforced by the server too): whoever generated the run can't approve it
  const generatedByMe = run.created_by_id ? run.created_by_id === currentUser?.id : run.created_by === currentUser?.name;

  const approve = async () => {
    setBusy('approve');
    try {
      const res = await api.approvePayrollRun(run.id);
      setRun(res.data);
      setConfirmApprove(false);
      onChanged();
      showToast(res.message, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy('');
    }
  };

  const remove = async () => {
    setBusy('delete');
    try {
      await api.deletePayrollRun(run.id);
      showToast(`Draft for ${run.period_name} deleted.`, 'success');
      onChanged();
      onBack();
    } catch (err) {
      showToast(err.message, 'error');
      setBusy('');
    }
  };

  const exportCsv = () => {
    const names = run.deductions_applied.map((d) => d.name);
    downloadCsv(`payroll-${run.period}-${run.status.toLowerCase()}.csv`, run.lines, [
      { header: 'Employee ID', value: (l) => l.employee_id },
      { header: 'Employee', value: (l) => l.employee_name },
      { header: 'Department', value: (l) => l.department },
      { header: 'Currency', value: (l) => l.currency },
      { header: 'Days paid', value: (l) => l.days_paid ?? '' },
      { header: 'Days in period', value: (l) => l.days_in_period ?? '' },
      { header: 'Gross', value: (l) => l.gross.toFixed(2) },
      ...names.map((name) => ({ header: name, value: (l) => (l.deductions.find((d) => d.name === name)?.amount ?? 0).toFixed(2) })),
      { header: 'Total deductions', value: (l) => l.deductions_total.toFixed(2) },
      { header: 'Net pay', value: (l) => l.net.toFixed(2) }
    ]);
  };

  const openPayslip = async (employeeId) => {
    setBusy(employeeId);
    try {
      await api.openPayslip(employeeId, run.id);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs">
        <ChevronLeft className="w-4 h-4" />
        <span>Payroll runs</span>
      </button>

      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Payroll · {run.period_name}</h1>
          <p className="text-xs text-slate-500 mt-1">
            {isDraft
              ? `Draft created ${run.created_at?.slice(0, 10)} by ${run.created_by}. Employees can't see it until it's approved.`
              : `Approved ${run.approved_at?.slice(0, 10)} by ${run.approved_by}. Payslips are available to employees.`}
            {' '}Pay date {run.pay_date}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={exportCsv} className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-2">
            <Download className="w-4 h-4 text-slate-500" />
            <span>Download CSV</span>
          </button>
          {isDraft && (
            <>
              <button onClick={remove} disabled={!!busy} className="px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold flex items-center gap-2 disabled:opacity-60">
                <Trash2 className="w-4 h-4" />
                <span>{busy === 'delete' ? 'Deleting…' : 'Delete draft'}</span>
              </button>
              <button
                onClick={() => setConfirmApprove(true)}
                disabled={!!busy || generatedByMe}
                title={generatedByMe ? 'You generated this run, so another HR administrator must approve it.' : undefined}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & publish payslips</span>
              </button>
            </>
          )}
        </div>
      </div>

      {isDraft && generatedByMe && (
        <p className="p-3 rounded-2xl border border-amber-200 bg-amber-50 text-xs text-amber-900">
          You generated this draft, so a different HR administrator must review and approve it. Share the Payroll page with them.
        </p>
      )}

      {confirmApprove && (
        <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-xs text-emerald-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span>
            Approve {run.totals.employees} payslip(s) totalling <strong>{money(run.totals.net)}</strong> net? Approved runs are permanent and can't be edited or deleted.
          </span>
          <div className="flex gap-2">
            <button onClick={() => setConfirmApprove(false)} className="px-3 py-2 border border-emerald-300 rounded-xl font-bold bg-white hover:bg-emerald-100">Cancel</button>
            <button onClick={approve} disabled={busy === 'approve'} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-60">
              {busy === 'approve' ? 'Approving…' : 'Approve'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[['Employees', run.totals.employees], ['Gross', money(run.totals.gross)], ['Deductions', money(run.totals.deductions)], ['Net pay', money(run.totals.net)]].map(([label, value]) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase">{label}</span>
            <div className="text-lg font-black text-slate-900 font-mono mt-1">{value}</div>
          </div>
        ))}
      </div>

      {run.skipped.length > 0 && (
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50 text-xs text-amber-900 space-y-1">
          <p className="font-bold flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> {run.skipped.length} employee(s) not included</p>
          <ul className="list-disc pl-5">
            {run.skipped.map((s) => <li key={s.employee_id}>{s.employee_name}: {s.reason}</li>)}
          </ul>
          {isDraft && <p>Fix these on the employee profiles, then delete this draft and generate it again.</p>}
        </div>
      )}

      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400">
              <th className="py-3 px-5">Employee</th>
              <th className="py-3 px-4">Department</th>
              <th className="py-3 px-4 text-right">Gross</th>
              <th className="py-3 px-4">Deductions</th>
              <th className="py-3 px-4 text-right">Net pay</th>
              <th className="py-3 px-5 text-right">Payslip</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs">
            {run.lines.map((line) => (
              <tr key={line.employee_id} className="align-top">
                <td className="py-3.5 px-5">
                  <p className="font-bold text-slate-900">{line.employee_name}</p>
                  <p className="text-[11px] text-slate-400">{line.job_title}</p>
                </td>
                <td className="py-3.5 px-4 text-slate-600">{line.department || '—'}</td>
                <td className="py-3.5 px-4 text-right font-mono">
                  {money(line.gross)}
                  {line.prorated && <span className="block text-[10px] text-amber-600 font-sans font-bold">{line.days_paid} of {line.days_in_period} days</span>}
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  {line.deductions.length === 0 ? '—' : line.deductions.map((d) => (
                    <div key={d.name} className="flex justify-between gap-4">
                      <span>{d.name}{d.type === 'PERCENT' ? ` (${d.value}%)` : ''}</span>
                      <span className="font-mono">{money(d.amount)}</span>
                    </div>
                  ))}
                  {line.warning && <p className="text-rose-600 font-bold mt-1">{line.warning}</p>}
                </td>
                <td className="py-3.5 px-4 text-right font-mono font-bold">{money(line.net)}</td>
                <td className="py-3.5 px-5 text-right">
                  {isDraft ? (
                    <span className="text-slate-400">After approval</span>
                  ) : (
                    <button
                      onClick={() => openPayslip(line.employee_id)}
                      disabled={busy === line.employee_id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{busy === line.employee_id ? 'Opening…' : 'View'}</span>
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
