import React, { useState } from 'react';
import { ChevronLeft, Search, Plus, Table as TableIcon, Columns as KanbanIcon } from 'lucide-react';
import { useResource } from '../../hooks/useResource';
import LoadState from '../common/LoadState';
import CandidateBoard from './CandidateBoard';
import CandidateEditDrawer from './CandidateEditDrawer';
import { CandidateDetailDrawer } from './CandidateDetailDrawer';
import { AddCandidateDrawer } from './AddCandidateDrawer';
import { useCandidates } from './useCandidates';
import { JOB_STATUS, EMPLOYMENT_TYPES, formatDate } from './shared';

export const JobDetailView = ({ job: initialJob, onBack }) => {
  const { rows: jobs } = useResource('jobs', { quiet: true });
  const cands = useCandidates();
  const [view, setView] = useState('table');
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);
  const [adding, setAdding] = useState(false);

  const job = jobs.find(j => j.id === initialJob.id) || initialJob;
  const q = search.trim().toLowerCase();
  const mine = cands.rows.filter(c => c.job_id === job.id && (!q || `${c.name} ${c.email} ${c.phone || ''}`.toLowerCase().includes(q)));

  const handleDelete = (c) => {
    if (window.confirm(`Delete ${c.name}? Their files are deleted too.`)) cands.remove(c.id).catch(() => {});
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Recruitment</h1>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
            <button onClick={onBack} className="hover:text-emerald-600 font-bold flex items-center gap-1">
              <ChevronLeft className="w-3.5 h-3.5" /><span>List Job</span>
            </button>
            <span>&gt;</span>
            <span className="text-slate-900 font-black">{job.title}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidates"
              className="w-full pl-4 pr-9 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <button onClick={() => setAdding(true)} disabled={job.status === 'CLOSED'} title={job.status === 'CLOSED' ? 'This job is closed' : 'Add candidates'}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md disabled:opacity-40">
            <Plus className="w-3.5 h-3.5" /><span>Add Candidates</span>
          </button>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            {[['table', TableIcon, 'Table view'], ['kanban', KanbanIcon, 'Pipeline view']].map(([id, Icon, label]) => (
              <button key={id} type="button" onClick={() => setView(id)} title={label} aria-pressed={view === id}
                className={`p-2 rounded-xl transition-all ${view === id ? 'bg-emerald-500 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900 hover:bg-white'}`}>
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
        {[
          ['Status', JOB_STATUS[job.status]?.label],
          ['Type', EMPLOYMENT_TYPES.find(t => t.value === job.employment_type)?.label],
          ['Department', job.department_name || '—'],
          ['Openings', `${job.hired_count || 0} of ${job.openings} filled`],
          ['Closes', formatDate(job.closing_date)]
        ].map(([label, value]) => (
          <div key={label}><p className="text-slate-400 font-bold">{label}</p><p className="font-black text-slate-900 mt-0.5">{value}</p></div>
        ))}
      </div>

      <LoadState loading={cands.loading} error={cands.error} onRetry={cands.reload} empty={!mine.length}
        emptyText={q ? 'No candidates match your search.' : 'No candidates for this job yet.'}>
        <CandidateBoard candidates={mine} stages={cands.stages} view={view} onOpen={setOpen} onMove={cands.move} onEdit={setEditing} onDelete={handleDelete} />
      </LoadState>

      {open && (
        <CandidateDetailDrawer candidate={open} stages={cands.stages} templates={cands.settings?.email_templates || []}
          act={cands.act} onChanged={cands.reload} onClose={() => setOpen(null)} />
      )}
      <CandidateEditDrawer candidate={editing} jobs={jobs} sources={cands.settings?.sources || []} onClose={() => setEditing(null)}
        onSave={(values) => cands.update(editing.id, values)} />
      <AddCandidateDrawer isOpen={adding} onClose={() => setAdding(false)} jobs={jobs} sources={cands.settings?.sources || []} defaultJobId={job.id}
        onCreated={() => cands.reload()} />
    </div>
  );
};
