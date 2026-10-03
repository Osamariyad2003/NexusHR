import React, { useEffect, useState } from 'react';
import { X, Check } from 'lucide-react';
import { VISIBILITY_OPTIONS } from './shared';

/** Choose who can see a folder. This is the folder's real access rule, enforced by the server. */
export default function ShareModal({ isOpen, folder, onClose, onSave }) {
  const [visibility, setVisibility] = useState('ALL');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) return undefined;
    setVisibility(folder?.visibility || 'ALL');
    setError('');
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave(visibility);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4" role="dialog" aria-modal="true" aria-label={`Share ${folder?.name}`}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-5 font-sans">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900">Share "{folder?.name}"</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        {error && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{error}</div>}
        <div className="space-y-2">
          {VISIBILITY_OPTIONS.map(o => (
            <button key={o.value} type="button" onClick={() => setVisibility(o.value)} aria-pressed={visibility === o.value}
              className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between ${visibility === o.value ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:bg-slate-50'}`}>
              <div><p className="text-sm font-bold text-slate-900">{o.label}</p><p className="text-xs text-slate-500">{o.description}</p></div>
              {visibility === o.value && <Check className="w-5 h-5 text-emerald-600" />}
            </button>
          ))}
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">Cancel</button>
          <button type="button" onClick={save} disabled={saving} className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
