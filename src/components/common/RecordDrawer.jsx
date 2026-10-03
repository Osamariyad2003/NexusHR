import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500';

/**
 * Side drawer with a form for adding or editing a record. `fields`:
 *   [{ name, label, type: 'text'|'textarea'|'select'|'multiselect'|'email'|'tel'|'date'|'time'|'number'|'checkbox'|'color',
 *      options: [{ value, label }], required, placeholder, help }]
 * `onSubmit(values)` must return a promise; its error message is shown and the drawer stays open.
 * Closes on Escape or the backdrop.
 */
export default function RecordDrawer({ isOpen, title, fields, initial = {}, submitLabel = 'Save', onSubmit, onClose, children }) {
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    setValues(Object.fromEntries(fields.map(f => [f.name, initial[f.name] ?? (f.type === 'checkbox' ? false : f.type === 'multiselect' ? [] : '')])));
    setError('');
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const set = (name, value) => setValues(v => ({ ...v, [name]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(values);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col font-sans animate-in slide-in-from-right duration-200">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-xl font-black text-slate-900">{title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
            {error && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{error}</div>}
            {fields.map((f) => (
              <div key={f.name} className="space-y-1.5">
                {f.type === 'checkbox' ? (
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700">
                    <input type="checkbox" checked={Boolean(values[f.name])} onChange={(e) => set(f.name, e.target.checked)} className="w-4 h-4 accent-emerald-500" />
                    {f.label}
                  </label>
                ) : (
                  <>
                    <label htmlFor={`rd-${f.name}`} className="text-xs font-bold text-slate-700 block">
                      {f.label} {f.required && <span className="text-rose-500">*</span>}
                    </label>
                    {f.type === 'multiselect' ? (
                      <div id={`rd-${f.name}`} className="max-h-44 overflow-y-auto border border-slate-200 rounded-xl p-2 space-y-1">
                        {(f.options || []).map(o => {
                          const selected = (values[f.name] || []).includes(o.value);
                          return (
                            <label key={o.value} className="flex items-center gap-2 px-2 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50">
                              <input type="checkbox" checked={selected} className="w-4 h-4 accent-emerald-500"
                                onChange={() => set(f.name, selected ? values[f.name].filter(v => v !== o.value) : [...(values[f.name] || []), o.value])} />
                              {o.label}
                            </label>
                          );
                        })}
                        {!(f.options || []).length && <p className="text-xs text-slate-400 px-2">Nothing to choose from.</p>}
                      </div>
                    ) : f.type === 'textarea' ? (
                      <textarea id={`rd-${f.name}`} rows={4} value={values[f.name] ?? ''} required={f.required} placeholder={f.placeholder}
                        onChange={(e) => set(f.name, e.target.value)} className={`${inputClass} resize-none font-medium`} />
                    ) : f.type === 'select' ? (
                      <select id={`rd-${f.name}`} value={values[f.name] ?? ''} required={f.required} onChange={(e) => set(f.name, e.target.value)} className={inputClass}>
                        {!f.required && <option value="">{f.placeholder || 'None'}</option>}
                        {f.required && !values[f.name] && <option value="" disabled>{f.placeholder || 'Select…'}</option>}
                        {(f.options || []).map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <input id={`rd-${f.name}`} type={f.type || 'text'} value={values[f.name] ?? ''} required={f.required} placeholder={f.placeholder}
                        onChange={(e) => set(f.name, e.target.value)} className={inputClass} />
                    )}
                  </>
                )}
                {f.help && <p className="text-[11px] text-slate-400">{f.help}</p>}
              </div>
            ))}
            {children}
            <div className="pt-6 border-t border-slate-100 flex items-center justify-end gap-3">
              <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all">
                Cancel
              </button>
              <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all disabled:opacity-60">
                {saving ? 'Saving…' : submitLabel}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
