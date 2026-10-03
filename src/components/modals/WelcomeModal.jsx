import React from 'react';
import { X, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export const WelcomeModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col">
        {/* Header Illustration Area */}
        <div className="bg-gradient-to-tr from-emerald-600 via-teal-500 to-indigo-600 p-8 text-white relative text-center overflow-hidden">
          {/* Decorative shapes */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-400/20 rounded-full blur-lg pointer-events-none" />

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close welcome modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 mx-auto mb-4 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-inner">
            <Sparkles className="w-8 h-8 text-white" />
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight">
            Welcome to NexusHR!
          </h2>
          <p className="text-xs sm:text-sm text-emerald-50/90 mt-2 font-medium">
            Enjoy the convenience of managing your company's employees with AI-powered headcount intelligence!
          </p>
        </div>

        {/* Modal Body Feature Highlights */}
        <div className="p-6 space-y-4 bg-white">
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-emerald-50/60 border border-emerald-100/80">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Real-Time Headcount Analytics</h4>
                <p className="text-[11px] text-slate-500">Track total employees, job applicants, and headcount growth in real-time.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-2xl bg-brand-50/60 border border-brand-100/80">
              <CheckCircle2 className="w-5 h-5 text-brand-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-slate-900">Automated Shift & Leave Settlement</h4>
                <p className="text-[11px] text-slate-500">15-minute grace window attendance and anti-collision leave approvals.</p>
              </div>
            </div>
          </div>

          {/* Action Button matching Screen 18 */}
          <button
            onClick={onClose}
            className="w-full py-3.5 px-6 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all flex items-center justify-center gap-2 group"
          >
            <span>Let's Go!</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
};
