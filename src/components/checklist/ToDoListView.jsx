import React, { useState } from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';
import LoadState from '../common/LoadState';
import RecordDrawer from '../common/RecordDrawer';
import ToDoDetailDrawer from './ToDoDetailDrawer';

const formatDate = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : 'No due date');
const isOverdue = (iso, done) => !done && iso && iso < new Date().toISOString().slice(0, 10);

/** Checklist tasks assigned to me plus my personal to-dos; ticking one saves it. */
export default function ToDoListView() {
  const { currentUser, showToast } = useApp();
  const checklists = useResource('checklists', { quiet: true });
  const todos = useResource('todos');
  const [status, setStatus] = useState('OPEN');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState(null);

  // Checklist tasks assigned to me, with the checklist they belong to
  const assigned = checklists.rows.flatMap(c => (c.tasks || [])
    .filter(t => t.assignee_id === currentUser?.id)
    .map(t => ({ ...t, kind: 'checklist', checklist: c, done: t.completed })));
  const personal = todos.rows.map(t => ({ ...t, kind: 'todo' }));

  const q = search.trim().toLowerCase();
  const keep = (t) => (status === 'ALL' || (status === 'OPEN' ? !t.done : t.done)) && (!q || `${t.title} ${t.checklist?.employee?.name || ''}`.toLowerCase().includes(q));
  const byDue = (a, b) => String(a.due_date || '9999').localeCompare(String(b.due_date || '9999'));

  const toggle = async (item) => {
    try {
      if (item.kind === 'checklist') {
        const res = await api.resourceAction('checklists', item.checklist.id, 'toggleTask', { task_id: item.id, completed: !item.done });
        showToast(res.message, 'success');
        await checklists.reload();
      } else {
        await todos.update(item.id, { done: !item.done }, `"${item.title}" marked ${item.done ? 'not done' : 'done'}.`);
      }
      setSelected(null);
    } catch (err) {
      if (item.kind === 'checklist') showToast(err.message, 'error');
    }
  };

  const Row = ({ item }) => (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50/70">
      <input type="checkbox" checked={item.done} onChange={() => toggle(item)} aria-label={`Mark "${item.title}" ${item.done ? 'not done' : 'done'}`} className="w-4 h-4 accent-emerald-500 cursor-pointer" />
      <button type="button" onClick={() => setSelected(item)} className="flex-1 text-left min-w-0">
        <p className={`text-sm font-bold truncate ${item.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{item.title}</p>
        <p className="text-xs text-slate-400">
          {item.kind === 'checklist' ? `${item.checklist.type === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'} · ${item.checklist.employee?.name}` : 'Personal to-do'}
        </p>
      </button>
      <span className={`text-xs font-semibold ${isOverdue(item.due_date, item.done) ? 'text-rose-600' : 'text-slate-500'}`}>{formatDate(item.due_date)}</span>
      {item.kind === 'todo' && (
        <button type="button" onClick={() => window.confirm(`Delete "${item.title}"?`) && todos.remove(item.id).catch(() => {})} title={`Delete ${item.title}`} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
      )}
    </div>
  );

  const shownAssigned = assigned.filter(keep).sort(byDue);
  const shownPersonal = personal.filter(keep).sort(byDue);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Checklist - To Dos</h1>
          <p className="text-xs text-slate-500 mt-1">{assigned.filter(t => !t.done).length + personal.filter(t => !t.done).length} open task(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status" className="px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold">
            <option value="OPEN">Open</option><option value="DONE">Done</option><option value="ALL">All</option>
          </select>
          <div className="relative w-56">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks" className="w-full pl-4 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          <button type="button" onClick={() => setAdding(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold"><Plus className="w-4 h-4" />Add to-do</button>
        </div>
      </div>

      <LoadState loading={checklists.loading || todos.loading} error={checklists.error || todos.error} onRetry={() => { checklists.reload(); todos.reload(); }}>
        <div className="space-y-6">
          <section className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <h2 className="px-5 py-3 border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400">Assigned to me from checklists ({shownAssigned.length})</h2>
            <div className="divide-y divide-slate-100">{shownAssigned.map(t => <Row key={`c-${t.checklist.id}-${t.id}`} item={t} />)}</div>
            {!shownAssigned.length && <p className="px-5 py-6 text-xs text-slate-400">Nothing here.</p>}
          </section>
          <section className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
            <h2 className="px-5 py-3 border-b border-slate-100 text-xs font-black uppercase tracking-wider text-slate-400">My to-dos ({shownPersonal.length})</h2>
            <div className="divide-y divide-slate-100">{shownPersonal.map(t => <Row key={`t-${t.id}`} item={t} />)}</div>
            {!shownPersonal.length && <p className="px-5 py-6 text-xs text-slate-400">Nothing here.</p>}
          </section>
        </div>
      </LoadState>

      <RecordDrawer isOpen={adding} title="Add To-do" submitLabel="Add"
        fields={[{ name: 'title', label: 'What needs doing?', required: true }, { name: 'due_date', label: 'Due date', type: 'date' }, { name: 'notes', label: 'Notes', type: 'textarea' }]}
        onClose={() => setAdding(false)} onSubmit={(v) => todos.create({ ...v, due_date: v.due_date || null })} />
      {selected && <ToDoDetailDrawer task={selected} onClose={() => setSelected(null)} onToggle={() => toggle(selected)} />}
    </div>
  );
}
