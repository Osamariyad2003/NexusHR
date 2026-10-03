import React, { useState } from 'react';
import { ShieldCheck, Check, X, Eye, EyeOff, AlertCircle, Loader2 } from 'lucide-react';

/** Step 3 of password recovery: the new password (the server checks the same rules). */
export const UpdatePassword = ({ onSubmit }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Password Complexity Validation Rules (Matching Image 2)
  const has8Chars = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);

  const isValid = has8Chars && hasNumber && hasUppercase && hasLowercase;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid) { setError('The new password does not meet all the rules below.'); return; }
    if (password !== confirmPassword) { setError('The two passwords do not match.'); return; }
    setSaving(true);
    setError('');
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err.message || 'Could not update the password. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 flex flex-col items-center justify-between p-6 text-slate-900 font-sans">
      {/* Brand Header */}
      <div className="pt-8 flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-slate-900 text-lg tracking-tight">NexusHR</span>
      </div>

      {/* Main Card (Matching Image 2) */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 space-y-6 my-auto text-center animate-fadeIn">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Update your password
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            Set your new password with minimum 8 characters with a combination of letters and numbers
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          {/* New Password Field */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              New Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                id="reset-new-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Complexity Indicator Rules (Matching Image 2) */}
          <div className="grid grid-cols-2 gap-2 text-xs pt-1">
            <div className={`flex items-center gap-1.5 ${has8Chars ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}`}>
              {has8Chars ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>8 characters</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}`}>
              {hasNumber ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>Number (0-9)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}`}>
              {hasUppercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>Uppercase letter (A-Z)</span>
            </div>
            <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-600 font-medium' : 'text-rose-600 font-medium'}`}>
              {hasLowercase ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
              <span>Lowercase letter (a-z)</span>
            </div>
          </div>

          {/* Confirmation New Password Field */}
          <div className="space-y-1.5 pt-2">
            <label className="block text-xs font-bold text-slate-700">
              Confirmation New Password <span className="text-rose-500">*</span>
            </label>
            <input
              id="reset-confirm-password"
              type="password"
              required
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-type your new password"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          {error && (
            <p role="alert" className="text-xs font-semibold text-rose-600 flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold rounded-2xl text-sm shadow-md transition-all mt-4 flex items-center justify-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? 'Saving…' : 'Submit'}
          </button>
        </form>
      </div>

      {/* Footer */}
      <div className="pb-6 text-center text-[11px] text-slate-400 space-x-4">
        <span>&copy; {new Date().getFullYear()} NexusHR. All rights reserved.</span>
        <a href="#terms" className="font-semibold hover:text-slate-600">Terms & Conditions</a>
        <a href="#privacy" className="font-semibold hover:text-slate-600">Privacy Policy</a>
      </div>
    </div>
  );
};
