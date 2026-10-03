import React, { useEffect, useState } from 'react';
import { ChevronLeft, Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';

const inputClass = 'px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500';
const ASSIGNEES = [['HR', 'HR (whoever creates the checklist)'], ['MANAGER', 'Line manager'], ['EMPLOYEE', 'The employee'], ['IT', 'IT (whoever creates the checklist)']];

/** Edit a checklist template: name, description and its tasks (due N days from the start date). */
export default function TemplateDetailView({ template, canEdit, onBack, onSave }) {
  const [draft, setDraft] = useState(template);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => setDraft(template), [template]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(template);
  const setTask = (i, changes) => setDraft(d => ({ ...d, tasks: d.tasks.map((t, j) => (j === i ? { ...t, ...changes } : t)) }));
  const moveTask = (i, dir) => setDraft(d => {
    const tasks = [...d.tasks];
    [tasks[i], tasks[i + dir]] = [tasks[i + dir], tasks[i]];
    return { ...d, tasks };
  });

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      await onSave({
        name: draft.name, description: draft.description || '',
        tasks: draft.tasks.map(t => ({ ...(t.id ? { id: t.id } : {}), title: t.title, description: t.description || '', assignee: t.assignee, due_offset_days: Number(t.due_offset_days) || 0 }))
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button type="button" onClick={onBack} aria-label="Back to templates" className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
          <div>
            <h1 className="text-2xl font-black text-slate-900">{template.name}</h1>
            <p className="text-xs text-slate-500">{template.type === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'} template · {template.tasks.length} tasks</p>
          </div>
        </div>
        {canEdit && <button type="button" onClick={save} disabled={!dirty || saving} className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold disabled:opacity-40">{saving ? 'Saving…' : 'Save template'}</button>}
      </div>
      {error && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{error}</div>}

      <fieldset disabled={!canEdit} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="tpl-name" className="text-xs font-bold text-slate-700 block">Template name</label>
            <input id="tpl-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className={`${inputClass} w-full`} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="tpl-desc" className="text-xs font-bold text-slate-700 block">Description</label>
            <input id="tpl-desc" value={draft.description || ''} onChange={(e) => setDraft({ ...draft, description: e.target.value })} className={`${inputClass} w-full`} />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-700">Tasks</p>
          {draft.tasks.map((t, i) => (
            <div key={t.id || i} className="grid grid-cols-12 gap-2 items-center">
              <input value={t.title} onChange={(e) => setTask(i, { title: e.target.value })} aria-label={`Task ${i + 1} title`} placeholder="Task" className={`${inputClass} col-span-5`} />
              <select value={t.assignee} onChange={(e) => setTask(i, { assignee: e.target.value })} aria-label={`Task ${i + 1} assignee`} className={`${inputClass} col-span-3`}>
                {ASSIGNEES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
              </select>
              <div className="col-span-2 flex items-center gap-1">
                <input type="number" value={t.due_offset_days} onChange={(e) => setTask(i, { due_offset_days: e.target.value })} aria-label={`Task ${i + 1} due offset`} className={`${inputClass} w-16`} />
                <span className="text-[10px] text-slate-400">days</span>
              </div>
              <div className="col-span-2 flex justify-end gap-1">
                <button type="button" onClick={() => moveTask(i, -1)} disabled={i === 0} aria-label={`Move task ${i + 1} up`} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => moveTask(i, 1)} disabled={i === draft.tasks.length - 1} aria-label={`Move task ${i + 1} down`} className="p-1.5 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => setDraft(d => ({ ...d, tasks: d.tasks.filter((_, j) => j !== i) }))} aria-label={`Remove task ${i + 1}`} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ))}
          <p className="text-[11px] text-slate-400">Due days count from the start date ({template.type === 'ONBOARDING' ? 'join date' : 'last working day'}); negative numbers mean before it.</p>
          <button type="button" onClick={() => setDraft(d => ({ ...d, tasks: [...d.tasks, { title: '', assignee: 'HR', due_offset_days: 0 }] }))}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"><Plus className="w-3.5 h-3.5" />Add task</button>
        </div>
      </fieldset>
    </div>
  );
}
