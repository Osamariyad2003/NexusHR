import React, { useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';

const formatDate = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' }) : 'No due date');

/** Details of one task; the button saves the done/not-done change. */
export default function ToDoDetailDrawer({ task, onClose, onToggle }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const description = task.kind === 'checklist' ? task.description : task.notes;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label={task.title}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col font-sans">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">{task.title}</h2>
            <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-slate-400 font-bold">Due</p><p className="font-bold text-slate-800 mt-0.5">{formatDate(task.due_date)}</p></div>
              <div><p className="text-slate-400 font-bold">Status</p><p className="font-bold text-slate-800 mt-0.5">{task.done ? 'Done' : 'Open'}</p></div>
              {task.kind === 'checklist' && (
                <>
                  <div><p className="text-slate-400 font-bold">Checklist</p><p className="font-bold text-slate-800 mt-0.5">{task.checklist.type === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'}</p></div>
                  <div><p className="text-slate-400 font-bold">For</p><p className="font-bold text-slate-800 mt-0.5">{task.checklist.employee?.name}</p></div>
                </>
              )}
            </div>
            {task.completed_by && <p className="text-slate-500">Completed by {task.completed_by} on {new Date(task.completed_at).toLocaleDateString()}</p>}
            <div>
              <p className="text-slate-400 font-bold mb-1">Details</p>
              <p className="text-slate-700 whitespace-pre-wrap">{description || 'No details.'}</p>
            </div>
          </div>
          <div className="p-6 border-t border-slate-100">
            <button type="button" onClick={onToggle} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold">
              <CheckCircle2 className="w-4 h-4" />{task.done ? 'Mark as not done' : 'Mark as done'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
