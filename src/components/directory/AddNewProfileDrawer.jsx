import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const EMPTY = { firstName: '', lastName: '', email: '', jobTitle: '', departmentId: '', joinDate: '', password: '', salary: '', currency: 'USD' };

/**
 * Creates a real employee record. `onSubmit(fields)` must return a promise; its error message
 * (e.g. duplicate email) is shown in the drawer and the drawer stays open.
 */
export const AddNewProfileDrawer = ({ isOpen, onClose, onSubmit }) => {
  const { departments } = useApp();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const close = () => {
    setForm(EMPTY);
    setError('');
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit({
        first_name: form.firstName,
        last_name: form.lastName,
        email: form.email,
        job_title: form.jobTitle,
        department_id: form.departmentId,
        ...(form.joinDate ? { join_date: form.joinDate } : {}),
        ...(form.password ? { password: form.password } : {}),
        ...(form.salary ? { salary: { annual_gross: form.salary, currency: form.currency } } : {})
      });
      close();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-sm text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all';
  const label = (text, required) => (
    <label className="block text-xs font-bold text-slate-700">
      {text} {required && <span className="text-rose-500">*</span>}
    </label>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs animate-fadeIn flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col overflow-y-auto border-l border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Add New Profile</h2>
          <button onClick={close} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" aria-label="Close">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form id="add-profile-form" onSubmit={handleSubmit} className="p-6 space-y-5 flex-1">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              {label('First Name', true)}
              <input type="text" required maxLength={50} value={form.firstName} onChange={set('firstName')} className={inputClass} />
            </div>
            <div className="space-y-1.5">
              {label('Last Name', true)}
              <input type="text" required maxLength={50} value={form.lastName} onChange={set('lastName')} className={inputClass} />
            </div>
          </div>

          <div className="space-y-1.5">
            {label('Email Address', true)}
            <input type="email" required value={form.email} onChange={set('email')} className={inputClass} />
          </div>

          <div className="space-y-1.5">
            {label('Job Title', true)}
            <input type="text" required maxLength={100} value={form.jobTitle} onChange={set('jobTitle')} className={inputClass} />
          </div>

          <div className="space-y-1.5">
            {label('Department', true)}
            <select required value={form.departmentId} onChange={set('departmentId')} className={inputClass}>
              <option value="" disabled>Select a department</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            {label('Join Date')}
            <input type="date" value={form.joinDate} onChange={set('joinDate')} className={inputClass} />
            <p className="text-[11px] text-slate-400">Defaults to today.</p>
          </div>

          <div className="space-y-1.5">
            {label('Initial Password')}
            <input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} className={inputClass} />
            <p className="text-[11px] text-slate-400">Needed for the employee to sign in. Leave empty to set it later.</p>
          </div>

          <div className="space-y-1.5">
            {label('Annual Salary')}
            <div className="flex gap-2">
              <input type="number" min="1" step="0.01" value={form.salary} onChange={set('salary')} className={inputClass} />
              <input type="text" maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value.toUpperCase() })} className={`${inputClass} w-24 uppercase`} aria-label="Currency" />
            </div>
            <p className="text-[11px] text-slate-400">Employees without a salary are skipped by payroll.</p>
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-medium flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </p>
          )}
        </form>

        <div className="p-6 border-t border-slate-100 flex items-center gap-3">
          <button type="button" onClick={close} className="flex-1 py-3 px-4 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button type="submit" form="add-profile-form" disabled={saving} className="flex-1 py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold transition-all shadow-md disabled:opacity-60">
            {saving ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};
