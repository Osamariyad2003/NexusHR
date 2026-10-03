import React, { useEffect, useState } from 'react';
import { FileText } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';

export const formatMoney = (amount, currency = 'USD') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(amount) || 0);

/** Approved payslips for one employee; each opens as a printable document. */
export const EmployeePayslips = ({ employeeId }) => {
  const { showToast } = useApp();
  const [payslips, setPayslips] = useState(null);
  const [error, setError] = useState('');
  const [opening, setOpening] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setPayslips(null);
    setError('');
    api.getPayslips(employeeId)
      .then((list) => { if (!cancelled) setPayslips(list); })
      .catch((err) => { if (!cancelled) setError(err.message); });
    return () => { cancelled = true; };
  }, [employeeId]);

  const openPayslip = async (runId) => {
    setOpening(runId);
    try {
      await api.openPayslip(employeeId, runId);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setOpening(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
      <div className="pb-2 border-b border-slate-100">
        <h4 className="text-base font-bold text-slate-900">Payslips</h4>
        <p className="text-[11px] text-slate-400 mt-0.5">Published when HR approves a payroll run. Open one to print or save it as PDF.</p>
      </div>

      {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
      {!error && payslips === null && <p className="text-xs text-slate-400">Loading payslips…</p>}
      {!error && payslips?.length === 0 && <p className="text-xs text-slate-500">No payslips yet.</p>}

      {payslips?.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-slate-400 border-b border-slate-100">
                <th className="pb-2 font-bold">Period</th>
                <th className="pb-2 font-bold">Pay date</th>
                <th className="pb-2 font-bold text-right">Gross</th>
                <th className="pb-2 font-bold text-right">Net pay</th>
                <th className="pb-2 font-bold text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payslips.map((slip) => (
                <tr key={slip.run_id} className="text-slate-800 font-medium">
                  <td className="py-3">{slip.period_name}</td>
                  <td className="py-3 font-mono">{slip.pay_date}</td>
                  <td className="py-3 text-right font-mono">{formatMoney(slip.gross, slip.currency)}</td>
                  <td className="py-3 text-right font-mono font-bold">{formatMoney(slip.net, slip.currency)}</td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => openPayslip(slip.run_id)}
                      disabled={opening === slip.run_id}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-60 transition-colors"
                      title={`Open payslip for ${slip.period_name}`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{opening === slip.run_id ? 'Opening…' : 'View'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

/** Annual salary (drives payroll). HR can edit it; everyone else sees it read-only. */
export const EmployeeSalaryCard = ({ employee, canEdit, isSelf = false, onSaved }) => {
  const { showToast } = useApp();
  const salary = employee.salary;
  const [editing, setEditing] = useState(false);
  const [amount, setAmount] = useState(salary?.annual_gross ?? '');
  const [currency, setCurrency] = useState(salary?.currency || 'USD');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const updated = await api.updateEmployee(employee.id, { salary: { annual_gross: amount, currency } });
      onSaved(updated);
      setEditing(false);
      showToast('Salary saved. It applies from the next payroll run.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3 shadow-xs">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-slate-800">Salary</h4>
        {isSelf && !canEdit && <span className="text-[11px] text-slate-400">Another HR administrator manages your salary</span>}
        {canEdit && !editing && (
          <button onClick={() => setEditing(true)} className="text-xs font-bold text-emerald-600 hover:text-emerald-700">
            {salary ? 'Edit' : 'Add salary'}
          </button>
        )}
      </div>

      {editing ? (
        <form onSubmit={save} className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-bold text-slate-700 space-y-1">
            <span className="block">Annual gross</span>
            <input
              type="number" min="1" step="0.01" required value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-40 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-500"
            />
          </label>
          <label className="text-xs font-bold text-slate-700 space-y-1">
            <span className="block">Currency</span>
            <input
              type="text" maxLength={3} required value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              className="w-20 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs uppercase focus:outline-none focus:border-emerald-500"
            />
          </label>
          <button type="button" onClick={() => setEditing(false)} className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 disabled:opacity-60">
            {saving ? 'Saving…' : 'Save'}
          </button>
          {error && <p className="w-full text-xs text-rose-600 font-medium">{error}</p>}
        </form>
      ) : salary ? (
        <div className="grid grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Annual gross</span>
            <span className="font-black text-slate-900 text-base">{formatMoney(salary.annual_gross, salary.currency)}</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Monthly gross (before deductions)</span>
            <span className="font-black text-slate-900 text-base">{formatMoney(Math.round(salary.annual_gross * 100 / 12) / 100, salary.currency)}</span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-500">No salary on record. This employee is skipped when payroll runs are generated.</p>
      )}
    </div>
  );
};
