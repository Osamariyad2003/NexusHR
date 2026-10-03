import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

const DIGITS = 6;
const RESEND_AFTER_S = 60;

/** Step 2 of password recovery: the 6-digit code emailed to the person. */
export const OtpVerification = ({ email, onVerify, onResend, onBackToLogin }) => {
  const [otp, setOtp] = useState(() => Array(DIGITS).fill(''));
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [resendIn, setResendIn] = useState(RESEND_AFTER_S);
  const inputs = useRef([]);

  useEffect(() => {
    if (resendIn <= 0) return undefined;
    const timer = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  const fill = (index, text) => {
    const digits = text.replace(/\D/g, '').slice(0, DIGITS - index).split('');
    if (!digits.length) return;
    const next = [...otp];
    digits.forEach((d, i) => { next[index + i] = d; });
    setOtp(next);
    inputs.current[Math.min(index + digits.length, DIGITS - 1)]?.focus();
  };

  const handleChange = (e, index) => {
    const value = e.target.value;
    if (value === '') {
      const next = [...otp];
      next[index] = '';
      setOtp(next);
      return;
    }
    fill(index, value);
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) inputs.current[index - 1]?.focus();
  };

  const code = otp.join('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== DIGITS) { setError('Type all 6 digits of the code.'); return; }
    setVerifying(true);
    setError('');
    try {
      await onVerify(code);
    } catch (err) {
      setError(err.message || 'That code did not work. Please try again.');
      setVerifying(false);
      if (err.status === 429) setResendIn(0); // too many tries: the code is spent, a new one is needed
    }
  };

  const resend = async () => {
    setError('');
    setNotice('');
    try {
      await onResend();
      setOtp(Array(DIGITS).fill(''));
      setResendIn(RESEND_AFTER_S);
      setNotice('If an account exists for that email, a new code is on its way.');
      inputs.current[0]?.focus();
    } catch (err) {
      setError(err.message || 'Could not send a new code.');
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
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">OTP Verification</h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            If an account exists for <strong className="text-slate-900 font-bold">{email}</strong>, we've sent it a 6-digit code. It is valid for a few minutes.{' '}
            <button type="button" onClick={onBackToLogin} className="text-emerald-600 font-bold hover:underline">
              Wrong Email?
            </button>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-center gap-2 sm:gap-3 my-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                autoComplete={index === 0 ? 'one-time-code' : 'off'}
                aria-label={`Digit ${index + 1}`}
                maxLength={DIGITS}
                ref={(el) => (inputs.current[index] = el)}
                value={digit}
                onChange={(e) => handleChange(e, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                onPaste={(e) => { e.preventDefault(); fill(index, e.clipboardData.getData('text')); }}
                onFocus={(e) => e.target.select()}
                className="w-11 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold rounded-2xl bg-white border border-slate-200 text-slate-900 focus:outline-none focus:ring-2 focus:border-emerald-500 focus:ring-emerald-500/20 transition-all"
              />
            ))}
          </div>

          {error && (
            <p role="alert" className="text-xs font-semibold text-rose-600 flex items-start justify-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}
          {notice && !error && <p role="status" className="text-xs font-semibold text-emerald-700">{notice}</p>}

          <button
            type="submit"
            disabled={verifying}
            className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white font-bold rounded-2xl text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {verifying && <Loader2 className="w-4 h-4 animate-spin" />}
            {verifying ? 'Checking…' : 'Submit Code'}
          </button>

          <p className="text-xs text-slate-500">
            Didn't get it? Check your spam folder, or{' '}
            <button type="button" onClick={resend} disabled={resendIn > 0} className="font-bold text-emerald-600 hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed">
              {resendIn > 0 ? `resend in ${resendIn} s` : 'send a new code'}
            </button>
          </p>
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
