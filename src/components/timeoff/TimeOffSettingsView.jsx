import React, { useEffect, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';
import LoadState from '../common/LoadState';
import Toggle from '../common/Toggle';
import RecordDrawer from '../common/RecordDrawer';

const BUILT_IN = ['ANNUAL', 'SICK', 'MATERNITY', 'UNPAID'];
const inputClass = 'px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500';
const fmt = (iso) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

/** Leave types (what can be requested, paid or not, default allowance) and public holidays. */
export const TimeOffSettingsView = () => {
  const { currentUser } = useApp();
  const { data, loading, error, reload, save } = useResource('leavePolicy', { settings: true });
  const [tab, setTab] = useState('types');
  const [draft, setDraft] = useState(null);
  const [addingType, setAddingType] = useState(false);
  const [addingHoliday, setAddingHoliday] = useState(false);
  const [saving, setSaving] = useState(false);
  const canEdit = ['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role);

  useEffect(() => { if (data) setDraft(structuredClone(data)); }, [data]);
  const dirty = draft && data && JSON.stringify({ t: draft.leave_types, h: draft.holidays }) !== JSON.stringify({ t: data.leave_types, h: data.holidays });
  const setType = (i, changes) => setDraft(d => ({ ...d, leave_types: d.leave_types.map((t, j) => (j === i ? { ...t, ...changes } : t)) }));

  const saveAll = async () => {
    setSaving(true);
    try {
      await save({ leave_types: draft.leave_types.map(t => ({ ...t, default_days: Number(t.default_days) || 0 })), holidays: draft.holidays }, 'Time off settings saved.');
    } catch { /* toast shown; draft kept */ } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Time Off Settings</h1>
          <p className="text-xs text-slate-500 mt-1">Leave is charged in calendar days. Grant allowances from Employee Time Off &gt; Balances.</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {dirty && <button type="button" onClick={() => setDraft(structuredClone(data))} className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">Discard changes</button>}
            <button type="button" onClick={saveAll} disabled={!dirty || saving} className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold disabled:opacity-40">{saving ? 'Saving…' : 'Save changes'}</button>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {[['types', 'Leave types'], ['holidays', 'Public holidays']].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} className={`px-4 py-2 text-xs font-bold border-b-2 -mb-px ${tab === id ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{label}</button>
        ))}
      </div>

      <LoadState loading={loading} error={error} onRetry={reload}>
        {draft && (
          <fieldset disabled={!canEdit} className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6">
            {tab === 'types' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button type="button" onClick={() => setAddingType(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"><Plus className="w-3.5 h-3.5" />Add leave type</button>
                </div>
                <table className="w-full text-left text-xs">
                  <thead><tr className="text-[11px] font-bold uppercase tracking-wider text-slate-400"><th className="py-2">Name</th><th className="py-2">Code</th><th className="py-2">Paid</th><th className="py-2">Default days/year</th><th className="py-2">Can be requested</th><th className="py-2" /></tr></thead>
                  <tbody className="divide-y divide-slate-100">
                    {draft.leave_types.map((t, i) => (
                      <tr key={t.code}>
                        <td className="py-2 pr-3"><input value={t.name} onChange={(e) => setType(i, { name: e.target.value })} aria-label={`${t.code} name`} className={`${inputClass} w-full`} /></td>
                        <td className="py-2 pr-3 font-mono text-slate-500">{t.code}</td>
                        <td className="py-2 pr-3"><Toggle on={t.paid} label={`${t.name} paid`} onChange={(on) => setType(i, { paid: on })} /></td>
                        <td className="py-2 pr-3"><input type="number" min="0" max="365" value={t.default_days} onChange={(e) => setType(i, { default_days: e.target.value })} aria-label={`${t.name} default days`} className={`${inputClass} w-24`} /></td>
                        <td className="py-2 pr-3"><Toggle on={t.enabled} label={`${t.name} can be requested`} onChange={(on) => setType(i, { enabled: on })} /></td>
                        <td className="py-2 text-right">
                          {!BUILT_IN.includes(t.code) && <button type="button" onClick={() => setDraft(d => ({ ...d, leave_types: d.leave_types.filter((_, j) => j !== i) }))} aria-label={`Remove ${t.name}`} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="text-[11px] text-slate-400">Built-in types can be switched off but not removed. Default days are the suggested yearly allowance; balances change only when HR grants them.</p>
              </div>
            )}
            {tab === 'holidays' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button type="button" onClick={() => setAddingHoliday(true)} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"><Plus className="w-3.5 h-3.5" />Add holiday</button>
                </div>
                {draft.holidays.map((h, i) => (
                  <div key={h.id || h.date} className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                    <div><p className="text-sm font-bold text-slate-900">{h.name}</p><p className="text-xs text-slate-500">{fmt(h.date)}</p></div>
                    <button type="button" onClick={() => setDraft(d => ({ ...d, holidays: d.holidays.filter((_, j) => j !== i) }))} aria-label={`Remove ${h.name}`} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                {!draft.holidays.length && <p className="text-xs text-slate-400">No public holidays yet.</p>}
                <p className="text-[11px] text-slate-400">Holidays are shown on the team time off calendar.</p>
              </div>
            )}
          </fieldset>
        )}
      </LoadState>
      {dirty && <p className="text-xs font-semibold text-amber-700">You have unsaved changes.</p>}

      <RecordDrawer isOpen={addingType} title="Add Leave Type" submitLabel="Add"
        fields={[
          { name: 'name', label: 'Name', required: true, placeholder: 'e.g. Study leave' },
          { name: 'code', label: 'Code', required: true, placeholder: 'e.g. STUDY', help: 'Capital letters and underscores; cannot be changed later.' },
          { name: 'default_days', label: 'Default days per year', type: 'number' },
          { name: 'paid', label: 'Paid leave', type: 'checkbox' }
        ]}
        initial={{ paid: true, default_days: 0 }}
        onClose={() => setAddingType(false)}
        onSubmit={async (v) => {
          const code = v.code.trim().toUpperCase();
          if (draft.leave_types.some(t => t.code === code)) throw new Error(`${code} already exists.`);
          setDraft(d => ({ ...d, leave_types: [...d.leave_types, { code, name: v.name.trim(), paid: v.paid, enabled: true, default_days: Number(v.default_days) || 0 }] }));
        }} />
      <RecordDrawer isOpen={addingHoliday} title="Add Public Holiday" submitLabel="Add"
        fields={[{ name: 'name', label: 'Holiday', required: true }, { name: 'date', label: 'Date', type: 'date', required: true }]}
        onClose={() => setAddingHoliday(false)}
        onSubmit={async (v) => {
          if (draft.holidays.some(h => h.date === v.date)) throw new Error('There is already a holiday on that day.');
          setDraft(d => ({ ...d, holidays: [...d.holidays, { name: v.name.trim(), date: v.date }].sort((a, b) => a.date.localeCompare(b.date)) }));
        }} />
    </div>
  );
};

export default TimeOffSettingsView;
