import React, { useState } from 'react';
import { Check, X, Clock, AlertTriangle, ChevronRight, Calendar } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import { RejectReasonModal } from '../modals/RejectReasonModal';

export const PendingApprovals = () => {
  const { leaveRequests, handleLeaveStatusUpdate } = useApp();
  const [rejectModalTarget, setRejectModalTarget] = useState(null);

  // Filter top 5 actionable pending items matching REQ-DASH-003
  const pendingStream = leaveRequests
    .filter((r) => r.status === 'PENDING')
    .slice(0, 5);

  const handleApprove = (id) => {
    handleLeaveStatusUpdate(id, 'APPROVE');
  };

  const handleOpenRejectModal = (request) => {
    setRejectModalTarget(request);
  };

  const handleConfirmReject = (id, reason) => {
    handleLeaveStatusUpdate(id, 'REJECT', reason);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Pending Approvals Queue</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-violet-50 text-violet-700 font-bold">
              {pendingStream.length} Actionable
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">REQ-DASH-003 Manager decision stream with optimistic resolution</p>
        </div>
        <div className="p-2 rounded-xl bg-violet-50 text-violet-600">
          <Clock className="w-5 h-5" />
        </div>
      </div>

      {/* Stream Items List */}
      {pendingStream.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-xs">
          <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
          <p className="font-semibold text-slate-700">All caught up!</p>
          <p>No pending leave or attendance adjustments in your queue.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {pendingStream.map((req) => (
            <div
              key={req.id}
              className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
            >
              {/* Employee Info & Leave Request Meta */}
              <div className="flex items-start gap-3 min-w-0">
                <img
                  src={req.employee_avatar}
                  alt={req.employee_name}
                  className="w-10 h-10 rounded-full object-cover border border-slate-200 flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                      {req.employee_name}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-slate-200 text-slate-700">
                      {req.leave_type}
                    </span>
                    {req.is_urgent && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-bold bg-rose-100 text-rose-700 flex items-center gap-0.5">
                        <AlertTriangle className="w-3 h-3" /> Urgent
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 truncate mt-0.5">
                    {req.reason}
                  </p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {req.start_date} → {req.end_date} ({req.days_requested} days)
                    </span>
                  </div>
                </div>
              </div>

              {/* Inline Action Buttons (REQ-DASH-003) */}
              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                <button
                  onClick={() => handleOpenRejectModal(req)}
                  className="px-3 py-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-1 transition-all"
                  title="Reject request with justification"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Reject</span>
                </button>
                <button
                  onClick={() => handleApprove(req.id)}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all transform active:scale-95"
                  title="Approve request immediately"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Approve</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Reason Modal dialog */}
      {rejectModalTarget && (
        <RejectReasonModal
          isOpen={!!rejectModalTarget}
          onClose={() => setRejectModalTarget(null)}
          onConfirm={handleConfirmReject}
          requestId={rejectModalTarget.id}
          employeeName={rejectModalTarget.employee_name}
        />
      )}
    </div>
  );
};
