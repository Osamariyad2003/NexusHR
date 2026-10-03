import React from 'react';
import { Check } from 'lucide-react';

export const PasswordSuccess = ({ onBackToLogin }) => {
  return (
    <div className="min-h-screen w-full bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:16px_16px] bg-slate-50 flex flex-col items-center justify-between p-6 text-slate-900 font-sans">
      {/* Main Card (Matching Image 4) */}
      <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 space-y-6 my-auto text-center animate-fadeIn">
        {/* Confetti Circle Icon (Matching Image 4) */}
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
            <Check className="w-8 h-8 stroke-[3]" />
          </div>
          {/* Confetti Accent Dots */}
          <span className="absolute top-0 right-2 w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span className="absolute bottom-2 left-1 w-2 h-2 rounded-full bg-blue-400"></span>
          <span className="absolute top-2 left-2 w-2.5 h-2.5 rounded-full bg-indigo-400"></span>
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
            You've changed your password. Sign in with the new one; any other sessions were signed out.
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-xs mx-auto leading-relaxed">
            Always remember the password for your account at NexusHR!
          </p>
        </div>

        <button
          onClick={onBackToLogin}
          className="w-full py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm shadow-md transition-all"
        >
          Back to Login
        </button>
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
