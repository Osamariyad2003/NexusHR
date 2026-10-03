import React from 'react';
import { FileText, Edit2, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { stageClass, formatDate, initials } from './shared';

const Avatar = ({ name }) => (
  <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center flex-shrink-0">{initials(name)}</div>
);

function CvLink({ cv }) {
  const { showToast } = useApp();
  if (!cv) return <span className="text-slate-300">—</span>;
  return (
    <button type="button" onClick={(e) => { e.stopPropagation(); api.downloadFile(cv.id, cv.name).catch(err => showToast(err.message, 'error')); }}
      className="flex items-center gap-1.5 text-slate-600 hover:text-emerald-600 font-medium" title={`Download ${cv.name}`}>
      <span className="truncate max-w-[120px]">{cv.name}</span>
      <FileText className="w-4 h-4 text-slate-400" />
    </button>
  );
}

const StageSelect = ({ candidate, stages, onMove }) => (
  <select value={candidate.stage} onClick={(e) => e.stopPropagation()} onChange={(e) => onMove(candidate, e.target.value)}
    aria-label={`Stage for ${candidate.name}`}
    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer ${stageClass(candidate.stage, stages)}`}>
    {stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
  </select>
);

/** Candidates as a table or a stage board. Stage changes, edits and deletes are saved by the parent. */
export default function CandidateBoard({ candidates, stages, view, showJob, onOpen, onMove, onEdit, onDelete }) {
  if (view === 'kanban') {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {stages.map(stage => {
          const inStage = candidates.filter(c => c.stage === stage.name);
          return (
            <div key={stage.id} className="w-64 shrink-0 bg-slate-50 rounded-2xl border border-slate-200/80 p-3 space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-bold ${stageClass(stage.name, stages)}`}>{stage.name}</span>
                <span className="text-xs font-bold text-slate-400">{inStage.length}</span>
              </div>
              {inStage.map(c => (
                <div key={c.id} role="button" tabIndex={0} onClick={() => onOpen(c)} onKeyDown={(e) => e.key === 'Enter' && onOpen(c)}
                  className="bg-white rounded-xl border border-slate-200 p-3 space-y-2 cursor-pointer hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2">
                    <Avatar name={c.name} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-900 truncate">{c.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{showJob ? c.job_title : c.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">{formatDate(c.applied_date)}</span>
                    {c.average_rating && <span className="text-[11px] font-bold text-amber-600">★ {c.average_rating}</span>}
                  </div>
                  <StageSelect candidate={c} stages={stages} onMove={onMove} />
                </div>
              ))}
              {!inStage.length && <p className="text-[11px] text-slate-400 text-center py-3">No candidates</p>}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-4 px-6">Name</th>
              {showJob && <th className="py-4 px-4">Job</th>}
              <th className="py-4 px-4">Phone Number</th>
              <th className="py-4 px-4">CV</th>
              <th className="py-4 px-4">Applied</th>
              <th className="py-4 px-4">Stage</th>
              <th className="py-4 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
            {candidates.map((c) => (
              <tr key={c.id} onClick={() => onOpen(c)} className="hover:bg-slate-50/80 transition-colors cursor-pointer">
                <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                    <Avatar name={c.name} />
                    <div>
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-400 font-normal">{c.email}</div>
                    </div>
                  </div>
                </td>
                {showJob && <td className="py-4 px-4 text-slate-600">{c.job_title || '—'}</td>}
                <td className="py-4 px-4 font-mono text-slate-600">{c.phone || '—'}</td>
                <td className="py-4 px-4"><CvLink cv={c.cv} /></td>
                <td className="py-4 px-4 text-slate-500 font-normal">{formatDate(c.applied_date)}</td>
                <td className="py-4 px-4"><StageSelect candidate={c} stages={stages} onMove={onMove} /></td>
                <td className="py-4 px-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(c); }} title={`Edit ${c.name}`} className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(c); }} title={`Delete ${c.name}`} className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
