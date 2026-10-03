import React, { useState } from 'react';
import { X, Calendar, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const LeaveRequestModal = ({ isOpen, onClose }) => {
  const { currentUser, employees, handleLeaveSubmission } = useApp();

  const currentEmp = employees.find((e) => e.id === currentUser.id) || {
    leave_balances: { ANNUAL: 18, SICK: 10, MATERNITY: 0, UNPAID: 30 }
  };

  const [leaveType, setLeaveType] = useState('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const availableBalance = currentEmp.leave_balances[leaveType] || 0;

  // Calculate working days requested
  const calculateDays = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) return 0;
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const requestedDays = calculateDays();
  const willExceedBalance = requestedDays > availableBalance;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!startDate || !endDate || !reason.trim()) {
      setError('HTTP 422: Please select valid start/end dates and provide a reason.');
      return;
    }

    if (new Date(endDate) < new Date(startDate)) {
      setError('HTTP 422: End date cannot precede start date.');
      return;
    }

    if (requestedDays <= 0) {
      setError('HTTP 422: Requested days must be greater than zero.');
      return;
    }

    // BR-LEV-001 Guard check
    if (willExceedBalance) {
      setError(`BR-LEV-001 Violation: Insufficient balance. Available: ${availableBalance} days, Requested: ${requestedDays} days.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await handleLeaveSubmission({
        employeeId: currentUser.id,
        leaveType,
        startDate,
        endDate,
        daysRequested: requestedDays,
        reason,
      });
      setIsSubmitting(false);
      onClose();
    } catch (err) {
      setIsSubmitting(false);
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-modal border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-base">
            <Calendar className="w-5 h-5 text-brand-400" />
            <span>New Leave Application (REQ-LEV-001)</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Balance Cards Display */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { type: 'ANNUAL', label: 'Annual' },
              { type: 'SICK', label: 'Sick' },
              { type: 'MATERNITY', label: 'Maternity' },
              { type: 'UNPAID', label: 'Unpaid' },
            ].map((item) => {
              const bal = currentEmp.leave_balances[item.type] || 0;
              const isSelected = leaveType === item.type;
              return (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setLeaveType(item.type)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    isSelected
                      ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20'
                      : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-slate-500 block truncate">
                    {item.label}
                  </span>
                  <span className={`text-base font-black ${isSelected ? 'text-brand-700' : 'text-slate-800'}`}>
                    {bal}d
                  </span>
                </button>
              );
            })}
          </div>

          {/* Date Pickers */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Start Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                End Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>

          {/* Working Days & Guard Verification Indicator */}
          {requestedDays > 0 && (
            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between font-semibold ${
              willExceedBalance
                ? 'bg-rose-50 text-rose-800 border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}>
              <div className="flex items-center gap-2">
                {willExceedBalance ? (
                  <Lock className="w-4 h-4 text-rose-600" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                )}
                <span>
                  {requestedDays} Calendar Day(s) Requested vs {availableBalance}d Accrued Available
                </span>
              </div>
              <span className="font-mono">{willExceedBalance ? 'REJECTED' : 'PASSED'}</span>
            </div>
          )}

          {/* Reason Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Application Justification / Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide clear rationale for leave booking..."
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || willExceedBalance}
              className={`px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-md transition-all ${
                willExceedBalance
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-brand-600 hover:bg-brand-700 shadow-brand-600/20'
              }`}
            >
              {isSubmitting ? 'Verifying Balance...' : 'Submit Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
