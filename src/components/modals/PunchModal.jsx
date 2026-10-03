import React, { useState, useEffect } from 'react';
import { X, Clock, CheckCircle2, AlertTriangle, Shield, Play, Square } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';

export const PunchModal = ({ isOpen, onClose }) => {
  const { activeSession, handlePunchEvent, currentUser } = useApp();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isOpen) return null;

  // Calculate 15-min grace window evaluation live preview (BR-ATT-001)
  const shiftStartToday = new Date();
  shiftStartToday.setHours(9, 0, 0, 0);

  const diffMins = Math.floor((currentTime - shiftStartToday) / (1000 * 60));
  const willBeLate = diffMins > 15;

  const onPunchClick = async () => {
    await handlePunchEvent();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-modal border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <Clock className="w-5 h-5 text-brand-400" />
            <span>Shift Punch Event Registration</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 text-center space-y-5">
          {/* Live UTC / Local Clock Widget */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Server-Authoritative Clock
            </span>
            <div className="text-3xl font-black text-slate-900 font-mono my-1 tracking-tight">
              {currentTime.toLocaleTimeString()}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {currentTime.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          {/* Grace Window Rule Status Evaluation (BR-ATT-001) */}
          <div className="p-4 rounded-xl border text-left text-xs space-y-2 bg-slate-50 border-slate-200">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Assigned Shift Window:</span>
              <span className="font-mono text-slate-900 font-semibold">09:00 AM – 05:00 PM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700">Punctuality Grace Period:</span>
              <span className="font-mono text-emerald-700 font-semibold">15 Minutes (until 09:15 AM)</span>
            </div>

            {!activeSession && (
              <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 font-medium ${
                willBeLate ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              }`}>
                {willBeLate ? (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Arrival after 09:15 AM flags session automatically as <strong className="font-bold">LATE</strong> per BR-ATT-001.</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>Arrival within allowable grace period flags session as <strong className="font-bold">PRESENT</strong>.</span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Active Session Status */}
          {activeSession && (
            <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-900 text-left flex items-center justify-between">
              <div>
                <p className="font-bold">Active Session Unclosed</p>
                <p className="text-[11px] text-violet-700">Punched in at: {new Date(activeSession.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <Badge status={activeSession.status} size="xs" />
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={onPunchClick}
            className={`w-full py-3 px-6 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-lg transition-all transform active:scale-95 ${
              activeSession
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
                : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
            }`}
          >
            {activeSession ? (
              <>
                <Square className="w-4 h-4 fill-current" />
                <span>Clock Out (Close Session)</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Clock In (Register Punch Event REQ-ATT-001)</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
