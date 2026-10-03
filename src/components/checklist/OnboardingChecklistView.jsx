import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, Edit2, Trash2, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';
import LoadState from '../common/LoadState';
import RecordDrawer from '../common/RecordDrawer';

const formatDate = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
const nameOf = (e) => `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name;

/** Onboarding or offboarding checklists: one per employee, created from a template; ticks save. */
export default function OnboardingChecklistView({ type = 'onboarding' }) {
  const TYPE = type === 'offboarding' ? 'OFFBOARDING' : 'ONBOARDING';
  const isOff = TYPE === 'OFFBOARDING';
  const { showToast, currentUser, employees } = useApp();
  const checklists = useResource('checklists');
  const { rows: templates } = useResource('checklistTemplates', { quiet: true });
  const { rows: offices } = useResource('offices', { quiet: true });
  const [status, setStatus] = useState('IN_PROGRESS');
  const [office, setOffice] = useState('ALL');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(null);
  const [creating, setCreating] = useState(false);
  const [taskDrawer, setTaskDrawer] = useState(null); // { checklist, task? }
  const isHr = ['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role);

  const q = search.trim().toLowerCase();
  const list = checklists.rows.filter(c => c.type === TYPE &&
    (status === 'ALL' || c.status === status) &&
    (office === 'ALL' || c.employee?.office_id === office) &&
    (!q || `${c.employee?.name} ${c.employee?.job_title}`.toLowerCase().includes(q)));

  const act = async (checklist, action, body) => {
    try {
      const res = await api.resourceAction('checklists', checklist.id, action, body);
      showToast(res.message, 'success');
      await checklists.reload();
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  const people = employees.filter(e => e.status !== 'TERMINATED' || isOff);
  const createFields = [
    { name: 'employee_id', label: 'Employee', type: 'select', required: true, options: people.map(e => ({ value: e.id, label: nameOf(e) })) },
    { name: 'template_id', label: 'Template', type: 'select', options: templates.filter(t => t.type === TYPE).map(t => ({ value: t.id, label: `${t.name} (${t.tasks.length} tasks)` })), placeholder: 'No template (add tasks yourself)' },
    { name: 'start_date', label: isOff ? 'Last working day' : 'Start date', type: 'date', help: isOff ? 'Defaults to the termination date.' : 'Defaults to the join date. Task due dates count from this day.' }
  ];
  const taskFields = [
    { name: 'title', label: 'Task', required: true },
    { name: 'due_date', label: 'Due date', type: 'date' },
    { name: 'assignee_id', label: 'Assigned to', type: 'select', options: employees.filter(e => e.status !== 'TERMINATED').map(e => ({ value: e.id, label: nameOf(e) })), placeholder: 'Unassigned' },
    { name: 'description', label: 'Details', type: 'textarea' }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Checklist - {isOff ? 'Offboarding' : 'Onboarding'}</h1>
          <p className="text-xs text-slate-500 mt-1">{list.length} checklist(s)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select value={office} onChange={(e) => setOffice(e.target.value)} aria-label="Filter by office" className="px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold">
            <option value="ALL">All offices</option>
            {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold">
            <option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="ALL">All</option>
          </select>
          <div className="relative w-52">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search employee" className="w-full pl-4 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          {isHr && <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold"><Plus className="w-4 h-4" />New checklist</button>}
        </div>
      </div>

      <LoadState loading={checklists.loading} error={checklists.error} onRetry={checklists.reload} empty={!list.length}
        emptyText={`No ${isOff ? 'offboarding' : 'onboarding'} checklists${status !== 'ALL' ? ' with this status' : ''}.`}>
        <div className="space-y-4">
          {list.map(c => {
            const open = expanded === c.id;
            const pct = c.total_count ? Math.round((c.completed_count / c.total_count) * 100) : 0;
            return (
              <div key={c.id} className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
                <button type="button" onClick={() => setExpanded(open ? null : c.id)} className="w-full p-5 flex items-center gap-4 text-left hover:bg-slate-50/50">
                  {c.employee?.avatar ? <img src={c.employee.avatar} alt="" className="w-11 h-11 rounded-full object-cover" /> : <div className="w-11 h-11 rounded-full bg-slate-200" />}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-extrabold text-slate-900 leading-tight">{c.employee?.name}</h3>
                    <p className="text-xs text-slate-400">{c.employee?.job_title} · {isOff ? 'Last day' : 'Start date'}: {formatDate(c.start_date)}{c.template_name ? ` · ${c.template_name}` : ''}</p>
                  </div>
                  <div className="w-40 hidden sm:block">
                    <div className="flex justify-between text-[11px] font-bold text-slate-500 mb-1"><span>{c.completed_count}/{c.total_count} tasks</span><span>{pct}%</span></div>
                    <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
                  </div>
                  {c.status === 'COMPLETED' && <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">Completed</span>}
                  {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {open && (
                  <div className="border-t border-slate-100">
                    <table className="w-full text-left text-xs">
                      <thead><tr className="bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400"><th className="py-3 px-5 w-10" /><th className="py-3 px-2">Task</th><th className="py-3 px-2">Due</th><th className="py-3 px-2">Assigned to</th><th className="py-3 px-5 text-right">{isHr ? 'Action' : ''}</th></tr></thead>
                      <tbody className="divide-y divide-slate-100">
                        {c.tasks.map(t => {
                          const canTick = isHr || t.assignee_id === currentUser?.id || c.manager_id === currentUser?.id;
                          return (
                            <tr key={t.id}>
                              <td className="py-3 px-5"><input type="checkbox" checked={t.completed} disabled={!canTick} aria-label={`${t.completed ? 'Reopen' : 'Complete'} "${t.title}"`}
                                onChange={() => act(c, 'toggleTask', { task_id: t.id, completed: !t.completed }).catch(() => {})} className="w-4 h-4 accent-emerald-500" /></td>
                              <td className={`py-3 px-2 font-semibold ${t.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{t.title}</td>
                              <td className="py-3 px-2 text-slate-500">{formatDate(t.due_date)}</td>
                              <td className="py-3 px-2 text-slate-600">{t.assignee?.name || 'Unassigned'}</td>
                              <td className="py-3 px-5 text-right">
                                {isHr && (
                                  <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setTaskDrawer({ checklist: c, task: t })} title={`Edit ${t.title}`} className="p-1.5 rounded-lg bg-blue-600 text-white"><Edit2 className="w-3 h-3" /></button>
                                    <button type="button" onClick={() => window.confirm(`Remove "${t.title}"?`) && act(c, 'removeTask', { task_id: t.id }).catch(() => {})} title={`Remove ${t.title}`} className="p-1.5 rounded-lg bg-rose-500 text-white"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {!c.tasks.length && <p className="px-5 py-4 text-xs text-slate-400">No tasks yet.</p>}
                    {isHr && (
                      <div className="p-4 flex justify-between">
                        <button type="button" onClick={() => setTaskDrawer({ checklist: c })} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"><Plus className="w-3.5 h-3.5" />Add task</button>
                        <button type="button" onClick={() => window.confirm(`Delete ${c.employee?.name}'s ${isOff ? 'offboarding' : 'onboarding'} checklist?`) && checklists.remove(c.id).catch(() => {})} className="px-4 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50">Delete checklist</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </LoadState>

      <RecordDrawer isOpen={creating} title={`New ${isOff ? 'Offboarding' : 'Onboarding'} Checklist`} submitLabel="Create" fields={createFields}
        onClose={() => setCreating(false)}
        onSubmit={async (v) => {
          const res = await checklists.create({ type: TYPE, employee_id: v.employee_id, template_id: v.template_id || null, start_date: v.start_date || null });
          if (res?.id) setExpanded(res.id);
        }} />
      <RecordDrawer isOpen={Boolean(taskDrawer)} title={taskDrawer?.task ? 'Edit Task' : 'Add Task'} submitLabel={taskDrawer?.task ? 'Save' : 'Add'} fields={taskFields}
        initial={taskDrawer?.task || {}} onClose={() => setTaskDrawer(null)}
        onSubmit={(v) => {
          const body = { ...v, due_date: v.due_date || null, assignee_id: v.assignee_id || null };
          return taskDrawer.task
            ? act(taskDrawer.checklist, 'updateTask', { task_id: taskDrawer.task.id, ...body })
            : act(taskDrawer.checklist, 'addTask', body);
        }} />
    </div>
  );
}
