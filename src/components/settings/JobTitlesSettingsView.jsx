import React, { useState } from 'react';
import { Search, Plus, Edit2, Trash2 } from 'lucide-react';
import { useResource } from '../../hooks/useResource';
import RecordDrawer from '../common/RecordDrawer';
import LoadState from '../common/LoadState';
import Toggle from '../common/Toggle';

const TITLE_FIELDS = [
  { name: 'title', label: 'Job title', required: true, placeholder: 'e.g. Data Analyst' },
  { name: 'description', label: 'Description', type: 'textarea' }
];

export default function JobTitlesSettingsView() {
  const { rows: jobTitles, loading, error, reload, create, update, remove } = useResource('jobTitles');
  const [searchQuery, setSearchQuery] = useState('');
  const [editing, setEditing] = useState(null);

  const filteredTitles = jobTitles.filter(jt => jt.title.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  const handleDelete = (jt) => {
    if (window.confirm(`Delete the job title "${jt.title}"?`)) remove(jt.id).catch(() => {});
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-slate-900">Job Titles</h2>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-60">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search job title"
              className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium text-slate-900 placeholder:text-slate-400 shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          </div>
          <button onClick={() => setEditing({})} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all whitespace-nowrap">
            <Plus className="w-4 h-4 text-white" />
            <span>Add New</span>
          </button>
        </div>
      </div>

      <LoadState loading={loading} error={error} onRetry={reload} empty={!filteredTitles.length}
        emptyText={searchQuery ? 'No job titles match your search.' : 'No job titles yet.'}>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                <th className="py-4 px-6">Job Title</th>
                <th className="py-4 px-6">Number of Employees</th>
                <th className="py-4 px-6">Active</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-semibold">
              {filteredTitles.map((jt) => (
                <tr key={jt.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-4 px-6 text-slate-900 font-bold">{jt.title}</td>
                  <td className="py-4 px-6 text-slate-700">{jt.employees_count}</td>
                  <td className="py-4 px-6">
                    <Toggle on={jt.active} label={`${jt.title} active`}
                      onChange={(on) => update(jt.id, { active: on }, `"${jt.title}" is now ${on ? 'active' : 'inactive'}.`).catch(() => {})} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => setEditing(jt)} className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all" title="Edit job title">
                        <Edit2 className="w-3.5 h-3.5 text-white" />
                      </button>
                      <button onClick={() => handleDelete(jt)} className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-2xs transition-all" title="Delete job title">
                        <Trash2 className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LoadState>

      <RecordDrawer
        isOpen={Boolean(editing)}
        title={editing?.id ? 'Edit Job Title' : 'Add Job Title'}
        submitLabel={editing?.id ? 'Save' : 'Create'}
        fields={TITLE_FIELDS}
        initial={editing || {}}
        onSubmit={(values) => (editing?.id ? update(editing.id, values) : create(values))}
        onClose={() => setEditing(null)}
      >
        {editing?.id && editing.employees_count > 0 && (
          <p className="text-[11px] text-slate-500">Renaming also updates the {editing.employees_count} employee(s) who hold this title.</p>
        )}
      </RecordDrawer>
    </div>
  );
}
