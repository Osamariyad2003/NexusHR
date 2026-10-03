import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';
import { api } from '../../services/api';
import RecordDrawer from '../common/RecordDrawer';
import TimeOffRequestsView from './TimeOffRequestsView';

const nameOf = (e) => `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name;

/** Every employee's leave: requests, and (for HR) balances with a way to grant allowances. */
export const EmployeeTimeOffView = () => {
  const { employees, currentUser, showToast, loadEmployees } = useApp();
  const { data: policy } = useResource('leavePolicy', { settings: true, quiet: true });
  const [tab, setTab] = useState('requests');
  const [granting, setGranting] = useState(false);
  const isHr = ['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role);
  const types = (policy?.leave_types || []).filter(t => t.enabled);
  const staff = employees.filter(e => e.status !== 'TERMINATED');

  const tabs = (
    <div className="flex gap-2 border-b border-slate-200">
      {[['requests', 'Requests'], ...(isHr ? [['balances', 'Balances']] : [])].map(([id, label]) => (
        <button key={id} type="button" onClick={() => setTab(id)} className={`px-4 py-2 text-xs font-bold border-b-2 -mb-px ${tab === id ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{label}</button>
      ))}
    </div>
  );

  if (tab === 'requests') return <TimeOffRequestsView title="Employee Time Off" subtitle="All employees">{tabs}</TimeOffRequestsView>;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Employee Time Off</h1>
          <p className="text-xs text-slate-500 mt-1">Days left per leave type. Balances change when leave is requested, rejected or cancelled, or when HR grants an allowance.</p>
        </div>
        <button type="button" onClick={() => setGranting(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold"><Plus className="w-4 h-4" />Grant allowance</button>
      </div>
      {tabs}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead><tr className="bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400"><th className="py-3 px-4">Employee</th>{types.map(t => <th key={t.code} className="py-3 px-4 text-right">{t.name}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {staff.map(e => (
              <tr key={e.id} className="hover:bg-slate-50/60">
                <td className="py-3 px-4"><p className="font-bold text-slate-900">{nameOf(e)}</p><p className="text-[11px] text-slate-400">{e.department}</p></td>
                {types.map(t => <td key={t.code} className="py-3 px-4 text-right font-bold text-slate-700">{e.leave_balances?.[t.code] ?? 0}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RecordDrawer isOpen={granting} title="Grant Leave Allowance" submitLabel="Apply"
        fields={[
          { name: 'leaveType', label: 'Leave type', type: 'select', required: true, options: types.map(t => ({ value: t.code, label: t.name })) },
          { name: 'mode', label: 'How', type: 'select', required: true, options: [{ value: 'ADD', label: 'Add days to the current balance (negative to remove)' }, { value: 'SET', label: 'Set the balance to exactly this many days' }] },
          { name: 'days', label: 'Days (whole or half days)', type: 'number', required: true },
          { name: 'employeeIds', label: 'Employees', type: 'multiselect', options: staff.map(e => ({ value: e.id, label: nameOf(e) })) }
        ]}
        initial={{ leaveType: types[0]?.code, mode: 'ADD', days: '', employeeIds: [] }}
        onClose={() => setGranting(false)}
        onSubmit={async (v) => {
          if (!v.employeeIds.length) throw new Error('Choose at least one employee.');
          const res = await api.grantLeaveAllowance({ ...v, days: Number(v.days) });
          showToast(res.message, 'success');
          await loadEmployees();
        }} />
    </div>
  );
};

export default EmployeeTimeOffView;
