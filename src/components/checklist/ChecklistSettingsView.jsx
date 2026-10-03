import React, { useState } from 'react';
import { UserCheck, UserX, Plus, Eye, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';
import LoadState from '../common/LoadState';
import RecordDrawer from '../common/RecordDrawer';
import TemplateDetailView from './TemplateDetailView';

/** Checklist templates (Settings): list, create, edit tasks, delete. HR only can change them. */
export default function ChecklistSettingsView() {
  const { currentUser } = useApp();
  const templates = useResource('checklistTemplates');
  const [tab, setTab] = useState('ONBOARDING');
  const [openId, setOpenId] = useState(null);
  const [creating, setCreating] = useState(false);
  const canEdit = ['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role);

  const open = templates.rows.find(t => t.id === openId);
  if (open) {
    return <TemplateDetailView template={open} canEdit={canEdit} onBack={() => setOpenId(null)} onSave={(fields) => templates.update(open.id, fields)} />;
  }

  const list = templates.rows.filter(t => t.type === tab);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Checklist - Setting</h1>
        {canEdit && <button type="button" onClick={() => setCreating(true)} className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold"><Plus className="w-4 h-4" />New template</button>}
      </div>
      <div className="flex gap-2">
        {[['ONBOARDING', 'Onboarding', UserCheck], ['OFFBOARDING', 'Offboarding', UserX]].map(([id, label, Icon]) => (
          <button key={id} type="button" onClick={() => setTab(id)} aria-pressed={tab === id}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold ${tab === id ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>
      <LoadState loading={templates.loading} error={templates.error} onRetry={templates.reload} empty={!list.length} emptyText="No templates yet.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {list.map(t => (
            <div key={t.id} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-card flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-sm font-black text-slate-900">{t.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{t.description || 'No description'}</p>
                <p className="text-[11px] text-slate-400 mt-2">{t.tasks.length} task(s){t.in_use ? ` · used by ${t.in_use} open checklist(s)` : ''}</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => setOpenId(t.id)} title={`Open ${t.name}`} className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"><Eye className="w-3.5 h-3.5" /></button>
                {canEdit && <button type="button" onClick={() => window.confirm(`Delete the template "${t.name}"? Existing checklists keep their tasks.`) && templates.remove(t.id).catch(() => {})} title={`Delete ${t.name}`} className="p-2 rounded-xl bg-rose-500 text-white"><Trash2 className="w-3.5 h-3.5" /></button>}
              </div>
            </div>
          ))}
        </div>
      </LoadState>
      <RecordDrawer isOpen={creating} title={`New ${tab === 'ONBOARDING' ? 'Onboarding' : 'Offboarding'} Template`} submitLabel="Create"
        fields={[{ name: 'name', label: 'Template name', required: true }, { name: 'description', label: 'Description', type: 'textarea' }]}
        onClose={() => setCreating(false)}
        onSubmit={async (v) => {
          const made = await templates.create({ ...v, type: tab, tasks: [] });
          if (made?.id) setOpenId(made.id);
        }} />
    </div>
  );
}
