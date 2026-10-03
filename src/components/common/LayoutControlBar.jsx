import React from 'react';
import { LayoutGrid, Navigation, Loader2, Sparkles, Shield, LogOut } from 'lucide-react';

export const LayoutControlBar = ({
  layoutVariant,
  setLayoutVariant,
  skeletonMode,
  setSkeletonMode,
  onOpenWelcomeModal,
  onOpenAuthFlow
}) => {
  return (
    <div className="bg-slate-900 text-white px-4 py-2.5 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 border border-slate-800 mb-6">
      {/* Title & Badge */}
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
          <Shield className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-xs font-bold text-white leading-tight">Figma Layout & State Switcher</h4>
          <p className="text-[10px] text-slate-400">Explore Home V1, Home V2, Skeleton Loading & Welcome Popup</p>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        {/* Layout Switcher (V1 Left Sidebar vs V2 Top Nav) */}
        <div className="bg-slate-800 p-1 rounded-xl flex items-center border border-slate-700">
          <button
            onClick={() => setLayoutVariant('v1')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              layoutVariant === 'v1' ? 'bg-emerald-500 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Home V1 (Sidebar)</span>
          </button>

          <button
            onClick={() => setLayoutVariant('v2')}
            className={`px-3 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              layoutVariant === 'v2' ? 'bg-emerald-500 text-white shadow-sm font-semibold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Home V2 (Top Nav)</span>
          </button>
        </div>

        {/* Skeleton Loading Toggle */}
        <button
          onClick={() => setSkeletonMode(!skeletonMode)}
          className={`px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 font-medium ${
            skeletonMode
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 font-bold'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
          }`}
          title="Toggle Skeleton Loading mode matching Figma Screens 14 & 16"
        >
          <Loader2 className={`w-3.5 h-3.5 ${skeletonMode ? 'animate-spin text-amber-400' : ''}`} />
          <span>{skeletonMode ? 'Skeleton Mode ON' : 'Skeleton Loading'}</span>
        </button>

        {/* Welcome Popup Trigger (Screen 18) */}
        <button
          onClick={onOpenWelcomeModal}
          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center gap-1.5"
          title="Trigger Welcome App Popup Modal matching Figma Screen 18"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Welcome Popup</span>
        </button>

        {/* Auth Flow Switcher */}
        <button
          onClick={onOpenAuthFlow}
          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all flex items-center gap-1.5"
          title="Switch to Authentication & Onboarding Suite"
        >
          <LogOut className="w-3.5 h-3.5 text-rose-400" />
          <span>Auth & Onboarding</span>
        </button>
      </div>
    </div>
  );
};
