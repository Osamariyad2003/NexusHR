import React, { useState } from 'react';
import { Search, Plus, ChevronUp, ChevronDown, Edit2, Trash2 } from 'lucide-react';
import NewWorkScheduleDrawer from './NewWorkScheduleDrawer';
import { useResource } from '../../hooks/useResource';
import LoadState from '../common/LoadState';
import Toggle from '../common/Toggle';

const hoursLabel = (h) => {
  const whole = Math.floor(h);
  return `${whole}h ${String(Math.round((h - whole) * 60)).padStart(2, '0')}m`;
};
const formatDate = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function WorkScheduleSettingsView() {
  const { rows: schedules, loading, error, reload, create, update, remove } = useResource('workSchedules');
  const [searchQuery, setSearchQuery] = useState('');
  const [expanded, setExpanded] = useState({});
  const [editing, setEditing] = useState(null);

  const filtered = schedules.filter(s => s.name.toLowerCase().includes(searchQuery.trim().toLowerCase()));

  const handleDelete = (sch) => {
    if (window.confirm(`Delete the schedule "${sch.name}"?`)) remove(sch.id).catch(() => {});
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Work Schedule</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input type="text" placeholder="Search schedules" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50/70 border border-slate-200/80 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all" />
          </div>
          <button onClick={() => setEditing({})} className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs shrink-0">
            <Plus className="w-4 h-4" />
            <span>Add New</span>
          </button>
        </div>
      </div>

      <LoadState loading={loading} error={error} onRetry={reload} empty={!filtered.length} emptyText={searchQuery ? 'No schedules match your search.' : 'No work schedules yet.'}>
        <div className="space-y-4">
          {filtered.map((sch) => {
            const open = expanded[sch.id] ?? sch.is_default;
            const working = (sch.days || []).filter(d => d.working);
            const perDay = working.length ? sch.weekly_hours / working.length : 0;
            return (
              <div key={sch.id} className="border border-slate-200/80 rounded-2xl overflow-hidden transition-all bg-white">
                <div className="p-4 sm:px-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                  <button type="button" onClick={() => setExpanded(e => ({ ...e, [sch.id]: !open }))} className="flex items-center gap-3 text-left flex-1">
                    <span className="font-black text-sm text-slate-900 tracking-tight">{sch.name}</span>
                    {sch.is_default && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 tracking-wider">DEFAULT</span>}
                    {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </button>
                  <div className="flex items-center gap-3">
                    <Toggle on={sch.active} label={`${sch.name} active`}
                      onChange={(on) => update(sch.id, { active: on }, `"${sch.name}" is now ${on ? 'active' : 'inactive'}.`).catch(() => {})} />
                    <button onClick={() => setEditing(sch)} title="Edit schedule" className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => handleDelete(sch)} title="Delete schedule" className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>

                {open && (
                  <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-slate-100 text-xs space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[14px]">
                      <div className="flex items-center justify-between sm:justify-start sm:gap-12">
                        <span className="text-slate-400 font-medium w-48">Average working hours/day</span>
                        <span className="font-bold text-slate-800">{hoursLabel(perDay)}</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-start sm:gap-12">
                        <span className="text-slate-400 font-medium w-48">Effective from</span>
                        <span className="font-bold text-slate-800">{formatDate(sch.effective_from)}</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-start sm:gap-12">
                        <span className="text-slate-400 font-medium w-48">Schedule type</span>
                        <span className="font-bold text-slate-800">{sch.type === 'CLOCK' ? 'Start and end times' : 'Hours per day'}</span>
                      </div>
                      <div className="flex items-center justify-between sm:justify-start sm:gap-12">
                        <span className="text-slate-400 font-medium w-48">Total working hours/week</span>
                        <span className="font-bold text-slate-800">{hoursLabel(sch.weekly_hours)}</span>
                      </div>
                    </div>
                    <div className="pt-2 flex items-start gap-12">
                      <span className="text-slate-400 font-medium w-48 pt-1">Daily working hours</span>
                      <div className="space-y-2 flex-1">
                        {(sch.days || []).map((d) => (
                          <div key={d.day} className="flex items-center justify-between max-w-xs">
                            <span className="font-semibold text-slate-600">{d.day}</span>
                            <span className="font-bold text-slate-800">
                              {!d.working ? 'Day off' : sch.type === 'CLOCK' ? `${d.start}–${d.end} (${hoursLabel(d.hours)})` : hoursLabel(d.hours)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </LoadState>

      <NewWorkScheduleDrawer
        isOpen={Boolean(editing)}
        schedule={editing}
        onClose={() => setEditing(null)}
        onSave={(payload) => (editing?.id ? update(editing.id, payload) : create(payload))}
      />
    </div>
  );
}
