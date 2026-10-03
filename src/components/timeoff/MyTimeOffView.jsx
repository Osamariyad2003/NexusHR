import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Eye, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

const PAGE_SIZE = 8;
const LEAVE_TYPE_LABELS = { ANNUAL: 'Annual leave', SICK: 'Sick leave', MATERNITY: 'Maternity leave', UNPAID: 'Unpaid leave' };
const STATUS_STYLES = {
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
  CANCELLED: 'bg-slate-100 text-slate-500 border-slate-200'
};
const typeLabel = (t) => LEAVE_TYPE_LABELS[t] || t;

// Inclusive calendar days, the same count the server charges
const daysBetween = (start, end) =>
  start && end ? Math.round((new Date(`${end}T00:00:00Z`) - new Date(`${start}T00:00:00Z`)) / 86400000) + 1 : 0;

/** The signed-in employee's own leave requests and balances (REQ-LEV-001). */
export const MyTimeOffView = () => {
  const { showToast, currentUser, leaveRequests, handleLeaveSubmission, loadLeaveRequests } = useApp();
  const [balances, setBalances] = useState(null);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const [isNewRequestOpen, setIsNewRequestOpen] = useState(false);
  const [form, setForm] = useState({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const loadBalances = useCallback(() => {
    api.getMyLeaveBalances().then(setBalances).catch(() => setBalances({}));
  }, []);
  useEffect(loadBalances, [loadBalances, leaveRequests]);

  const mine = useMemo(
    () => (leaveRequests || []).filter((r) => r.employee_id === currentUser.id),
    [leaveRequests, currentUser.id]
  );
  const filtered = mine.filter((r) => (typeFilter === 'ALL' || r.leave_type === typeFilter) && (statusFilter === 'ALL' || r.status === statusFilter));
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const balanceTypes = balances ? Object.keys(balances).filter((k) => typeof balances[k] === 'number') : [];

  const requestedDays = daysBetween(form.startDate, form.endDate);
  const available = balances?.[form.leaveType];

  const submit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (requestedDays <= 0) { setFormError('The end date must be on or after the start date.'); return; }
    setSubmitting(true);
    try {
      await handleLeaveSubmission({ employeeId: currentUser.id, ...form, daysRequested: requestedDays });
      setIsNewRequestOpen(false);
      setForm({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: '' });
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelRequest = async () => {
    setCancelling(true);
    try {
      const res = await api.cancelLeaveRequest(selected.id);
      showToast(res.message, 'success');
      setSelected(null);
      await loadLeaveRequests();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCancelling(false);
    }
  };

  const inputClass = 'w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500';

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">My Time Off</h2>
        <p className="text-xs text-slate-500 font-medium mt-0.5">Your leave balances and requests</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {balances === null && <p className="text-xs text-slate-400 col-span-full">Loading balances…</p>}
        {balances && balanceTypes.length === 0 && <p className="text-xs text-slate-500 col-span-full">No leave balances on record. Ask HR to set them up.</p>}
        {balanceTypes.map((type) => (
          <div key={type} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-card">
            <span className="text-xs font-bold text-slate-800">{typeLabel(type)}</span>
            <div className="text-lg font-black text-slate-900 mt-1">{balances[type]} {balances[type] === 1 ? 'day' : 'days'} left</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-xl font-black text-slate-900">Request Time List</h3>
          <div className="flex items-center gap-3">
            <button
              disabled
              title="Calendar sync isn't available yet"
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl text-xs font-bold flex items-center gap-2 cursor-not-allowed"
            >
              <CalendarIcon className="w-4 h-4" />
              <span>Sync With Google (coming soon)</span>
            </button>
            <button
              onClick={() => setIsNewRequestOpen(true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Request</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <option value="ALL">All Type</option>
            {Object.entries(LEAVE_TYPE_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700">
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400">
                <th className="py-3 px-4">From</th>
                <th className="py-3 px-4">To</th>
                <th className="py-3 px-4">Total</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {pageRows.length === 0 && (
                <tr><td colSpan={6} className="py-10 text-center text-slate-500">{mine.length === 0 ? 'You have no leave requests yet.' : 'No requests match these filters.'}</td></tr>
              )}
              {pageRows.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono">{req.start_date}</td>
                  <td className="py-3.5 px-4 font-mono">{req.end_date}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{req.days_requested} {req.days_requested === 1 ? 'day' : 'days'}</td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{typeLabel(req.leave_type)}</td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border ${STATUS_STYLES[req.status] || ''}`}>{req.status}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button onClick={() => setSelected(req)} className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="View request">
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{filtered.length === 0 ? '0 requests' : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)} of ${filtered.length}`}</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
            <span className="px-2 font-bold text-slate-700">{page} / {pageCount}</span>
            <button onClick={() => setPage(page + 1)} disabled={page === pageCount} className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 disabled:opacity-40" aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Time Off Request</h2>
              <button onClick={() => setSelected(null)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 text-xs flex-1">
              {[['From', selected.start_date], ['To', selected.end_date], ['Total', `${selected.days_requested} day(s)`], ['Type', typeLabel(selected.leave_type)], ['Status', selected.status], ['Reason', selected.reason], ...(selected.rejection_reason ? [['Rejection reason', selected.rejection_reason]] : [])].map(([label, value]) => (
                <div key={label}>
                  <span className="text-slate-400 block font-medium">{label}</span>
                  <span className="font-bold text-slate-900 mt-1 block">{value || '—'}</span>
                </div>
              ))}
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center gap-3">
              {selected.status === 'PENDING' ? (
                <button onClick={cancelRequest} disabled={cancelling} className="flex-1 py-3 border border-rose-300 text-rose-600 rounded-xl text-sm font-bold hover:bg-rose-50 disabled:opacity-60">
                  {cancelling ? 'Cancelling…' : 'Cancel Request'}
                </button>
              ) : (
                <p className="flex-1 text-xs text-slate-500">Only pending requests can be cancelled. Ask HR to change a decided request.</p>
              )}
              <button onClick={() => setSelected(null)} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800">Close</button>
            </div>
          </div>
        </div>
      )}

      {isNewRequestOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end animate-fadeIn">
          <form onSubmit={submit} className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Request Time Off</h2>
              <button type="button" onClick={() => setIsNewRequestOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100" aria-label="Close"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4 flex-1 text-xs">
              <label className="block space-y-1 font-bold text-slate-700">
                <span className="block">Time off type <span className="text-rose-500">*</span></span>
                <select value={form.leaveType} onChange={(e) => setForm({ ...form, leaveType: e.target.value })} className={inputClass}>
                  {(balanceTypes.length ? balanceTypes : Object.keys(LEAVE_TYPE_LABELS)).map((t) => <option key={t} value={t}>{typeLabel(t)}</option>)}
                </select>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1 font-bold text-slate-700">
                  <span className="block">From <span className="text-rose-500">*</span></span>
                  <input type="date" required value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value, endDate: form.endDate || e.target.value })} className={inputClass} />
                </label>
                <label className="block space-y-1 font-bold text-slate-700">
                  <span className="block">To <span className="text-rose-500">*</span></span>
                  <input type="date" required min={form.startDate || undefined} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className={inputClass} />
                </label>
              </div>
              {requestedDays > 0 && (
                <p className={available !== undefined && requestedDays > available ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                  {requestedDays} calendar day(s) requested{available !== undefined ? ` · ${available} available` : ''}
                </p>
              )}
              <label className="block space-y-1 font-bold text-slate-700">
                <span className="block">Reason <span className="text-rose-500">*</span></span>
                <textarea required rows={4} value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} className={inputClass} />
              </label>
              {formError && <p className="text-rose-600 font-medium">{formError}</p>}
            </div>
            <div className="p-6 border-t border-slate-100 flex items-center gap-3">
              <button type="button" onClick={() => setIsNewRequestOpen(false)} className="flex-1 py-3 border border-slate-300 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={submitting} className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold disabled:opacity-60">
                {submitting ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
