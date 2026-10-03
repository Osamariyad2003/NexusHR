import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, KeyRound, AlertCircle, Loader2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const inputClass = 'w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all';

const PasswordField = ({ id, label, value, onChange, autoComplete, hint }) => {
  const [shown, setShown] = useState(false);
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-xs font-bold text-slate-700">{label} <span className="text-rose-500">*</span></label>
      <div className="relative">
        <input id={id} type={shown ? 'text' : 'password'} required autoComplete={autoComplete} value={value} onChange={(e) => onChange(e.target.value)} className={inputClass} />
        <button type="button" onClick={() => setShown(!shown)} aria-label={shown ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
          {shown ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {hint && <p className="text-[11px] text-slate-400">{hint}</p>}
    </div>
  );
};

/**
 * Shown instead of the app when the account's password was set by someone else (HR's initial
 * password, a temporary password): the person picks their own before anything else opens.
 */
export const RequiredPasswordChange = () => {
  const { currentUser, completeRequiredPasswordChange, logout } = useApp();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next !== confirm) { setError('The new passwords do not match.'); return; }
    if (next === current) { setError('Choose a password different from the one you were given.'); return; }
    setError('');
    setSaving(true);
    try {
      // The server checks the current password and the password policy
      await completeRequiredPasswordChange(current, next);
    } catch (err) {
      setError(err.message || 'Could not change the password. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 flex items-center justify-center p-6 font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/80 shadow-xl p-8 space-y-6">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-black text-slate-900 text-lg tracking-tight">NexusHR</span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-700">
            <KeyRound className="w-5 h-5" />
            <h1 className="text-xl font-black text-slate-900 tracking-tight">Choose a new password</h1>
          </div>
          <p className="text-sm text-slate-500">
            {currentUser?.email ? <><span className="font-semibold text-slate-700">{currentUser.email}</span>: your</> : 'Your'} password was set by someone else.
            Pick your own to continue. Your other sessions will be signed out.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <PasswordField id="required-current-password" label="Password you were given" value={current} onChange={setCurrent} autoComplete="current-password" />
          <PasswordField id="required-new-password" label="New password" value={next} onChange={setNext} autoComplete="new-password" hint="At least 8 characters with an uppercase letter, a lowercase letter and a digit." />
          <PasswordField id="required-confirm-password" label="Confirm new password" value={confirm} onChange={setConfirm} autoComplete="new-password" />

          {error && (
            <p role="alert" className="text-xs font-semibold text-rose-600 flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button type="submit" disabled={saving} className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-bold shadow-md transition-all flex items-center justify-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : 'Save and continue'}
          </button>
        </form>

        <button type="button" onClick={logout} className="w-full text-xs font-semibold text-slate-500 hover:text-slate-700">
          Sign out
        </button>
      </div>
    </div>
  );
};
