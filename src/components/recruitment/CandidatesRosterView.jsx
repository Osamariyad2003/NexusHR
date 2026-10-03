import React, { useState } from 'react';
import { Search, ChevronDown, Table as TableIcon, Columns as KanbanIcon } from 'lucide-react';
import { useResource } from '../../hooks/useResource';
import LoadState from '../common/LoadState';
import CandidateBoard from './CandidateBoard';
import CandidateEditDrawer from './CandidateEditDrawer';
import { CandidateDetailDrawer } from './CandidateDetailDrawer';
import { AddCandidateDrawer } from './AddCandidateDrawer';
import { useCandidates } from './useCandidates';

const selectClass = 'px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20';

export const CandidatesRosterView = () => {
  const { rows: jobs } = useResource('jobs', { quiet: true });
  const cands = useCandidates();
  const [search, setSearch] = useState('');
  const [jobFilter, setJobFilter] = useState('ALL');
  const [stageFilter, setStageFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [view, setView] = useState('table');
  const [menuOpen, setMenuOpen] = useState(false);
  const [addMode, setAddMode] = useState(null);
  const [open, setOpen] = useState(null);
  const [editing, setEditing] = useState(null);

  const q = search.trim().toLowerCase();
  const filtered = cands.rows.filter(c =>
    (jobFilter === 'ALL' || c.job_id === jobFilter) &&
    (stageFilter === 'ALL' || c.stage === stageFilter) &&
    (sourceFilter === 'ALL' || (c.source || '') === sourceFilter) &&
    (!from || c.applied_date >= from) && (!to || c.applied_date <= to) &&
    (!q || `${c.name} ${c.email} ${c.phone || ''} ${c.job_title || ''}`.toLowerCase().includes(q)));

  const sources = [...new Set(cands.rows.map(c => c.source).filter(Boolean))].sort();

  const handleDelete = (c) => {
    if (window.confirm(`Delete ${c.name}? Their files are deleted too.`)) cands.remove(c.id).catch(() => {});
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Candidates</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{filtered.length} of {cands.rows.length} candidates</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-64 sm:w-80">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search candidates"
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md whitespace-nowrap">
              <span>Add Candidates</span><ChevronDown className="w-3.5 h-3.5 text-slate-300" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                {[['manual', 'Add manually'], ['import', 'Import CSV']].map(([mode, label]) => (
                  <button key={mode} type="button" onClick={() => { setAddMode(mode); setMenuOpen(false); }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-slate-800 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl">{label}</button>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200">
            {[['table', TableIcon, 'Table view'], ['kanban', KanbanIcon, 'Pipeline view']].map(([id, Icon, label]) => (
              <button key={id} type="button" onClick={() => setView(id)} title={label} aria-pressed={view === id}
                className={`p-2 rounded-xl ${view === id ? 'bg-emerald-500 text-white' : 'text-slate-500 hover:bg-white'}`}><Icon className="w-4 h-4" /></button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <select value={jobFilter} onChange={(e) => setJobFilter(e.target.value)} aria-label="Filter by job" className={selectClass}>
          <option value="ALL">All jobs</option>
          {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
        </select>
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} aria-label="Filter by stage" className={selectClass}>
          <option value="ALL">All stages</option>
          {cands.stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
        </select>
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} aria-label="Filter by source" className={selectClass}>
          <option value="ALL">All sources</option>
          {sources.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="Applied from" className={selectClass} />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="Applied to" className={selectClass} />
      </div>

      <LoadState loading={cands.loading} error={cands.error} onRetry={cands.reload} empty={!filtered.length}
        emptyText={cands.rows.length ? 'No candidates match your filters.' : 'No candidates yet.'}>
        <CandidateBoard candidates={filtered} stages={cands.stages} view={view} showJob onOpen={setOpen} onMove={cands.move} onEdit={setEditing} onDelete={handleDelete} />
      </LoadState>

      {open && (
        <CandidateDetailDrawer candidate={open} stages={cands.stages} templates={cands.settings?.email_templates || []}
          act={cands.act} onChanged={cands.reload} onClose={() => setOpen(null)} />
      )}
      <CandidateEditDrawer candidate={editing} jobs={jobs} sources={cands.settings?.sources || []} onClose={() => setEditing(null)}
        onSave={(values) => cands.update(editing.id, values)} />
      <AddCandidateDrawer isOpen={Boolean(addMode)} defaultMode={addMode || 'manual'} onClose={() => setAddMode(null)} jobs={jobs}
        sources={cands.settings?.sources || []} onCreated={() => cands.reload()} />
    </div>
  );
};
