import React, { useState } from 'react';
import { Plus, Search, Check, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import { useResource } from '../../hooks/useResource';
import { CreateJobModal } from './CreateJobModal';
import LoadState from '../common/LoadState';
import { JOB_STATUS, EMPLOYMENT_TYPES, timeAgo } from './shared';

export const JobListView = ({ onSelectJob }) => {
  const { rows: jobs, loading, error, reload, create, update, remove } = useResource('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [openDropdown, setOpenDropdown] = useState(null);
  const [editing, setEditing] = useState(null);

  const q = searchQuery.trim().toLowerCase();
  const filteredJobs = jobs.filter(j =>
    (statusFilter === 'ALL' || j.status === statusFilter) &&
    (!q || `${j.title} ${j.department_name || ''} ${j.office_name || ''}`.toLowerCase().includes(q)));

  const changeStatus = (job, status) => {
    setOpenDropdown(null);
    update(job.id, { status }, `"${job.title}" is now ${JOB_STATUS[status].label.toLowerCase()}.`).catch(() => {});
  };

  const handleDelete = (job) => {
    if (window.confirm(`Delete the job "${job.title}"?`)) remove(job.id).catch(() => {});
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Recruitment</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            {jobs.filter(j => j.status === 'ACTIVE').length} open job{jobs.filter(j => j.status === 'ACTIVE').length === 1 ? '' : 's'} · {jobs.reduce((n, j) => n + j.applicants_count, 0)} applicants
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status"
            className="px-3 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20">
            <option value="ALL">All statuses</option>
            {Object.entries(JOB_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <div className="relative w-56 sm:w-72">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search jobs"
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200/90 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <button onClick={() => setEditing({})}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all whitespace-nowrap">
            <Plus className="w-4 h-4 text-white" />
            <span>Add New</span>
          </button>
        </div>
      </div>

      <LoadState loading={loading} error={error} onRetry={reload} empty={!filteredJobs.length}
        emptyText={jobs.length ? 'No jobs match your filters.' : 'No jobs yet. Create your first job posting.'}>
        <div className="space-y-4">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative">
              <button type="button" className="space-y-3 flex-1 text-left" onClick={() => onSelectJob(job)}>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-black text-slate-900 hover:text-emerald-600 transition-colors">{job.title}</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-md ${JOB_STATUS[job.status]?.className}`}>{JOB_STATUS[job.status]?.label}</span>
                </div>
                <p className="text-xs text-slate-400 font-semibold">
                  {[EMPLOYMENT_TYPES.find(t => t.value === job.employment_type)?.label, job.department_name, job.office_name].filter(Boolean).join(' · ')}
                </p>
                <p className="text-xs font-semibold text-slate-500">
                  {job.applicants_count} candidate{job.applicants_count === 1 ? '' : 's'} applied
                  {job.hired_count ? ` · ${job.hired_count} hired` : ''} · {job.openings} opening{job.openings === 1 ? '' : 's'}
                </p>
              </button>

              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-[11px] text-slate-400 font-medium hidden md:inline">Created {timeAgo(job.created_at)}</span>
                <div className="relative">
                  <button type="button" onClick={() => setOpenDropdown(openDropdown === job.id ? null : job.id)}
                    className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 transition-colors shadow-2xs">
                    <span>{JOB_STATUS[job.status]?.label}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  {openDropdown === job.id && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50">
                      <div className="text-[11px] font-bold text-slate-400 px-3 py-1.5 uppercase tracking-wider">Change Status</div>
                      {Object.entries(JOB_STATUS).map(([key, s]) => (
                        <button key={key} type="button" onClick={() => changeStatus(job, key)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-left transition-colors ${job.status === key ? 'bg-emerald-50/60 text-emerald-900' : 'text-slate-700 hover:bg-slate-50'}`}>
                          <span>{s.label}</span>
                          {job.status === key && <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <button onClick={() => setEditing(job)} title="Edit job" className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(job)} title="Delete job" className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
        </div>
      </LoadState>

      <CreateJobModal
        isOpen={Boolean(editing)}
        job={editing}
        onClose={() => setEditing(null)}
        onSave={(payload) => (editing?.id ? update(editing.id, payload) : create(payload))}
      />
    </div>
  );
};
