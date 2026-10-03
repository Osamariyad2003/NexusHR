import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';
import LoadState from '../common/LoadState';

const inputClass = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500';

/** The rules the clock-in button applies. Changes take effect on the next clock-in. */
export const AttendanceSettingsView = () => {
  const { currentUser } = useApp();
  const { data, loading, error, reload, save } = useResource('attendanceSettings', { settings: true });
  const { rows: offices } = useResource('offices', { quiet: true });
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const canEdit = ['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role);

  useEffect(() => { if (data) setForm({ default_shift_start: data.default_shift_start, grace_minutes: data.grace_minutes, max_open_shift_hours: data.max_open_shift_hours }); }, [data]);
  const dirty = form && data && (form.default_shift_start !== data.default_shift_start || Number(form.grace_minutes) !== data.grace_minutes || Number(form.max_open_shift_hours) !== data.max_open_shift_hours);

  const submit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await save({ default_shift_start: form.default_shift_start, grace_minutes: Number(form.grace_minutes), max_open_shift_hours: Number(form.max_open_shift_hours) }, 'Attendance rules saved. They apply from the next clock-in.');
    } catch { /* toast shown */ } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Attendance Settings</h1>
        <p className="text-xs text-slate-500 mt-1">The rules applied when someone clocks in or forgets to clock out.</p>
      </div>
      <LoadState loading={loading} error={error} onRetry={reload}>
        {form && (
          <form onSubmit={submit} className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 sm:p-8 space-y-6 max-w-2xl">
            <fieldset disabled={!canEdit} className="space-y-6">
              <div className="space-y-1.5">
                <label htmlFor="att-start" className="text-xs font-bold text-slate-700 block">Default shift start</label>
                <input id="att-start" type="time" required value={form.default_shift_start} onChange={(e) => setForm({ ...form, default_shift_start: e.target.value })} className={inputClass} />
                <p className="text-[11px] text-slate-400">Used for anyone without their own shift start on their profile.</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="att-grace" className="text-xs font-bold text-slate-700 block">Late after (grace period, minutes)</label>
                <input id="att-grace" type="number" min="0" max="120" required value={form.grace_minutes} onChange={(e) => setForm({ ...form, grace_minutes: e.target.value })} className={inputClass} />
                <p className="text-[11px] text-slate-400">Clocking in more than this many minutes after the shift start is recorded as late.</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="att-max" className="text-xs font-bold text-slate-700 block">Flag a shift left open after (hours)</label>
                <input id="att-max" type="number" min="4" max="24" required value={form.max_open_shift_hours} onChange={(e) => setForm({ ...form, max_open_shift_hours: e.target.value })} className={inputClass} />
                <p className="text-[11px] text-slate-400">A forgotten clock-out is marked "needs review" for HR instead of counting as a very long shift.</p>
              </div>
            </fieldset>
            {canEdit && (
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button type="button" disabled={!dirty} onClick={() => setForm({ default_shift_start: data.default_shift_start, grace_minutes: data.grace_minutes, max_open_shift_hours: data.max_open_shift_hours })} className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-40">Reset</button>
                <button type="submit" disabled={!dirty || saving} className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold disabled:opacity-40">{saving ? 'Saving…' : 'Save rules'}</button>
              </div>
            )}
          </form>
        )}
      </LoadState>
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card p-6 max-w-2xl space-y-3">
        <h2 className="text-sm font-black text-slate-900">Locations</h2>
        <p className="text-xs text-slate-500">Clock-in is not tied to a location yet: people can clock in from anywhere. Offices are managed in Settings &gt; Offices.</p>
        <ul className="text-xs text-slate-700 space-y-1">{offices.map(o => <li key={o.id}>• {o.name}{o.city ? ` (${o.city})` : ''} · {o.employees_count} employee(s)</li>)}</ul>
      </div>
    </div>
  );
};

export default AttendanceSettingsView;
