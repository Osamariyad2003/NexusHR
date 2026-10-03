import React, { useState } from 'react';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../../services/api';

/** Step 1 of password recovery: the email (and workspace) to send a code to. */
export const ForgotPassword = ({ onSendOtp, onBackToLogin }) => {
  const [email, setEmail] = useState('');
  // Same workspace as the sign-in page (remembered on this browser); empty for the first company
  const [workspace, setWorkspace] = useState(() => api.getWorkspace());
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSending(true);
    setError('');
    try {
      await onSendOtp({ email: email.trim().toLowerCase(), workspace: workspace.trim().toLowerCase() });
    } catch (err) {
      setError(err.message || 'Could not send the code. Please try again.');
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 flex flex-col items-center justify-between p-6 text-slate-900 font-sans">
      <div className="pt-8 flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-slate-900 text-lg tracking-tight">NexusHR</span>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 space-y-6 my-auto text-center animate-fadeIn">
        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Reset your password</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
            Enter your email address and we'll send you a 6-digit code to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 text-left">
          <div className="space-y-1.5">
            <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700">
              Registered Email <span className="text-rose-500">*</span>
            </label>
            <input
              id="forgot-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Input your registered email"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="forgot-workspace" className="block text-xs font-bold text-slate-700">Workspace</label>
            <input
              id="forgot-workspace"
              type="text"
              autoCapitalize="none"
              spellCheck={false}
              value={workspace}
              onChange={(e) => setWorkspace(e.target.value)}
              placeholder="Leave empty unless your company gave you one"
              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-mono text-slate-900 placeholder-slate-300 placeholder:font-sans focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
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
            disabled={!email || sending}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              email && !sending ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20' : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            {sending && <Loader2 className="w-4 h-4 animate-spin" />}
            {sending ? 'Sending…' : 'Send Verification Code'}
          </button>

          <button
            type="button"
            onClick={onBackToLogin}
            className="w-full py-3.5 px-6 rounded-2xl font-bold text-sm text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            Back to Login
          </button>
        </form>
      </div>

      <div className="pb-6 text-center text-[11px] text-slate-400 space-x-4">
        <span>&copy; {new Date().getFullYear()} NexusHR. All rights reserved.</span>
        <a href="#terms" className="font-semibold hover:text-slate-600">Terms & Conditions</a>
        <a href="#privacy" className="font-semibold hover:text-slate-600">Privacy Policy</a>
      </div>
    </div>
  );
};
