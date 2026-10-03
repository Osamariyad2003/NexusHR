import React, { useEffect, useState } from 'react';
import { Settings, MinusCircle, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { formatMoney } from './EmployeePayslips';

const EXAMPLE_GROSS = 5000;

/**
 * Payroll settings stored on the server: currency, pay day and the deductions HR defines.
 * Payroll runs monthly; each run applies the deductions in force when it is generated.
 */
export const PayrollSettingsView = () => {
  const { showToast } = useApp();
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getPayrollSettings().then(setSettings).catch((err) => setLoadError(err.message));
  }, []);

  const update = (changes) => setSettings({ ...settings, ...changes });
  const updateDeduction = (index, changes) =>
    update({ deductions: settings.deductions.map((d, i) => (i === index ? { ...d, ...changes } : d)) });

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const saved = await api.savePayrollSettings({
        currency: settings.currency,
        pay_day: Number(settings.pay_day),
        deductions: settings.deductions.map((d) => ({ ...d, value: Number(d.value) }))
      });
      setSettings(saved);
      showToast('Payroll settings saved. They apply to payroll runs generated from now on.', 'success');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const exampleAmount = (d) => (d.type === 'PERCENT' ? (EXAMPLE_GROSS * Number(d.value || 0)) / 100 : Number(d.value || 0));
  const inputClass = 'w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20';
  const tabButton = (id, label, Icon) => (
    <button
      type="button"
      onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
        activeTab === id ? 'bg-emerald-50 text-emerald-950 border border-emerald-200 shadow-xs' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      }`}
    >
      <div className={`p-2 rounded-xl ${activeTab === id ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
        <Icon className="w-4 h-4" />
      </div>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Setting Payroll</h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Currency, pay day and the deductions applied to every payslip</p>
      </div>

      {loadError && <p className="text-sm text-rose-600 font-medium">{loadError}</p>}
      {!loadError && !settings && <p className="text-sm text-slate-400">Loading payroll settings…</p>}

      {settings && (
        <form onSubmit={save} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-3 bg-white rounded-3xl p-3 border border-slate-200/80 shadow-xs space-y-1">
            {tabButton('general', 'General', Settings)}
            {tabButton('deductions', `Deductions (${settings.deductions.length})`, MinusCircle)}
          </div>

          <div className="lg:col-span-9 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-card space-y-6">
            {activeTab === 'general' && (
              <>
                <h2 className="text-xl font-black text-slate-900 tracking-tight border-b border-slate-100 pb-4">General</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <label className="space-y-1.5 text-xs font-bold text-slate-700">
                    <span className="block">Payroll currency <span className="text-rose-500">*</span></span>
                    <input
                      type="text" required maxLength={3} value={settings.currency}
                      onChange={(e) => update({ currency: e.target.value.toUpperCase() })}
                      className={`${inputClass} uppercase`}
                    />
                    <span className="block font-normal text-slate-400">Employees whose salary is in another currency are skipped and listed on the run.</span>
                  </label>
                  <label className="space-y-1.5 text-xs font-bold text-slate-700">
                    <span className="block">Pay day of the month <span className="text-rose-500">*</span></span>
                    <input
                      type="number" required min={1} max={28} value={settings.pay_day}
                      onChange={(e) => update({ pay_day: e.target.value })}
                      className={inputClass}
                    />
                    <span className="block font-normal text-slate-400">1–28, so it exists in every month.</span>
                  </label>
                </div>
                <p className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3">
                  Payroll runs monthly. Each employee's monthly gross is their annual salary divided by 12.
                </p>
              </>
            )}

            {activeTab === 'deductions' && (
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Deductions</h2>
                  <button
                    type="button"
                    onClick={() => update({ deductions: [...settings.deductions, { name: '', type: 'PERCENT', value: '' }] })}
                    className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add deduction</span>
                  </button>
                </div>
                <p className="text-xs text-slate-500">
                  NexusHR doesn't calculate tax for you. Enter each deduction your payroll requires, such as income tax withholding, pension or insurance, as a percentage of gross pay or a fixed amount per month.
                </p>

                {settings.deductions.length === 0 && (
                  <p className="text-xs text-slate-500 border border-dashed border-slate-300 rounded-xl p-4 text-center">No deductions: net pay will equal gross pay.</p>
                )}

                <div className="space-y-3">
                  {settings.deductions.map((d, i) => (
                    <div key={d.id || i} className="grid grid-cols-12 gap-3 items-end border border-slate-200 rounded-2xl p-4">
                      <label className="col-span-12 sm:col-span-5 space-y-1 text-xs font-bold text-slate-700">
                        <span className="block">Name</span>
                        <input type="text" required maxLength={60} value={d.name} onChange={(e) => updateDeduction(i, { name: e.target.value })} className={inputClass} />
                      </label>
                      <label className="col-span-6 sm:col-span-3 space-y-1 text-xs font-bold text-slate-700">
                        <span className="block">Type</span>
                        <select value={d.type} onChange={(e) => updateDeduction(i, { type: e.target.value })} className={inputClass}>
                          <option value="PERCENT">% of gross</option>
                          <option value="FIXED">Fixed amount</option>
                        </select>
                      </label>
                      <label className="col-span-4 sm:col-span-3 space-y-1 text-xs font-bold text-slate-700">
                        <span className="block">{d.type === 'PERCENT' ? 'Percent' : `Amount (${settings.currency})`}</span>
                        <input
                          type="number" required min={0} max={d.type === 'PERCENT' ? 100 : undefined} step="0.01"
                          value={d.value} onChange={(e) => updateDeduction(i, { value: e.target.value })} className={inputClass}
                        />
                      </label>
                      <div className="col-span-2 sm:col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => update({ deductions: settings.deductions.filter((_, j) => j !== i) })}
                          className="p-2.5 rounded-xl text-rose-500 hover:bg-rose-50"
                          title={`Remove ${d.name || 'deduction'}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {settings.deductions.length > 0 && /^[A-Z]{3}$/.test(settings.currency) && (
                  <div className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-1">
                    <p className="font-bold text-slate-800">Example on a monthly gross of {formatMoney(EXAMPLE_GROSS, settings.currency)}</p>
                    {settings.deductions.map((d, i) => (
                      <div key={d.id || i} className="flex justify-between"><span>{d.name || 'Unnamed'}</span><span className="font-mono">−{formatMoney(exampleAmount(d), settings.currency)}</span></div>
                    ))}
                    <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                      <span>Net pay</span>
                      <span className="font-mono">{formatMoney(Math.max(0, EXAMPLE_GROSS - settings.deductions.reduce((sum, d) => sum + exampleAmount(d), 0)), settings.currency)}</span>
                    </div>
                  </div>
                )}
              </>
            )}

            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}
            <div className="flex justify-end border-t border-slate-100 pt-4">
              <button type="submit" disabled={saving} className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md disabled:opacity-60">
                {saving ? 'Saving…' : 'Save payroll settings'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
