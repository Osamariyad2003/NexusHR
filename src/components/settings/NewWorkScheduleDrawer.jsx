import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const inputClass = 'px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500';

const blankDays = () => WEEKDAYS.map(day => ({ day, working: !['Saturday', 'Sunday'].includes(day), hours: 8, start: '09:00', end: '17:00' }));

/**
 * Add or edit a work schedule. Duration schedules set hours per day; clock schedules set start and
 * end times (the server computes the hours). `onSave(payload)` returns a promise; errors stay visible.
 */
export default function NewWorkScheduleDrawer({ isOpen, schedule, onClose, onSave }) {
  const [name, setName] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');
  const [type, setType] = useState('DURATION');
  const [isDefault, setIsDefault] = useState(false);
  const [days, setDays] = useState(blankDays());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    setName(schedule?.name || '');
    setEffectiveFrom(schedule?.effective_from || '');
    setType(schedule?.type || 'DURATION');
    setIsDefault(Boolean(schedule?.is_default));
    setDays(WEEKDAYS.map(day => {
      const saved = schedule?.days?.find(d => d.day === day);
      return saved ? { start: '09:00', end: '17:00', ...saved } : { ...blankDays().find(d => d.day === day), working: schedule ? false : !['Saturday', 'Sunday'].includes(day) };
    }));
    setError('');
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const setDay = (i, changes) => setDays(prev => prev.map((d, j) => (j === i ? { ...d, ...changes } : d)));
  const weekly = days.reduce((sum, d) => {
    if (!d.working) return sum;
    if (type === 'DURATION') return sum + (Number(d.hours) || 0);
    const [sh, sm] = d.start.split(':').map(Number);
    const [eh, em] = d.end.split(':').map(Number);
    return sum + Math.max(0, (eh * 60 + em - sh * 60 - sm) / 60);
  }, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSave({
        name, type, is_default: isDefault, effective_from: effectiveFrom || null,
        days: days.map(d => (type === 'DURATION'
          ? { day: d.day, working: d.working, hours: d.working ? Number(d.hours) : 0 }
          : { day: d.day, working: d.working, start: d.start, end: d.end }))
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label="Work schedule">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col font-sans">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">{schedule?.id ? 'Edit Work Schedule' : 'New Work Schedule'}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl"><X className="w-5 h-5" /></button>
          </div>
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{error}</div>}
            <div className="space-y-1.5">
              <label htmlFor="ws-name" className="text-xs font-bold text-slate-700 block">Schedule name <span className="text-rose-500">*</span></label>
              <input id="ws-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Remote week" className={`${inputClass} w-full`} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="ws-from" className="text-xs font-bold text-slate-700 block">Effective from</label>
                <input id="ws-from" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} className={`${inputClass} w-full`} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="ws-type" className="text-xs font-bold text-slate-700 block">Schedule type</label>
                <select id="ws-type" value={type} onChange={(e) => setType(e.target.value)} className={`${inputClass} w-full`}>
                  <option value="DURATION">Hours per day</option>
                  <option value="CLOCK">Start and end times</option>
                </select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
              <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} className="w-4 h-4 accent-emerald-500" />
              Default schedule for new employees
            </label>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-700">Working days</p>
              {days.map((d, i) => (
                <div key={d.day} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-32 text-xs font-semibold text-slate-700">
                    <input type="checkbox" checked={d.working} onChange={(e) => setDay(i, { working: e.target.checked })} className="w-4 h-4 accent-emerald-500" />
                    {d.day}
                  </label>
                  {d.working && type === 'DURATION' && (
                    <input type="number" min="0" max="24" step="0.5" value={d.hours} aria-label={`${d.day} hours`}
                      onChange={(e) => setDay(i, { hours: e.target.value })} className={`${inputClass} w-24`} />
                  )}
                  {d.working && type === 'CLOCK' && (
                    <>
                      <input type="time" value={d.start} aria-label={`${d.day} start`} onChange={(e) => setDay(i, { start: e.target.value })} className={inputClass} />
                      <span className="text-slate-400 text-xs">to</span>
                      <input type="time" value={d.end} aria-label={`${d.day} end`} onChange={(e) => setDay(i, { end: e.target.value })} className={inputClass} />
                    </>
                  )}
                  {!d.working && <span className="text-xs text-slate-400">Day off</span>}
                </div>
              ))}
              <p className="text-xs font-bold text-slate-900 pt-2">Total: {Math.round(weekly * 10) / 10} hours/week</p>
            </div>

            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold">Cancel</button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md disabled:opacity-60">
                {saving ? 'Saving…' : schedule?.id ? 'Save' : 'Create'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
