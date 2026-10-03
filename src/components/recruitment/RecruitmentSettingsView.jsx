import React, { useEffect, useState } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown, Lock, Edit2, X } from 'lucide-react';
import { useResource } from '../../hooks/useResource';
import { useApp } from '../../context/AppContext';
import LoadState from '../common/LoadState';
import RecordDrawer from '../common/RecordDrawer';

const inputClass = 'px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500';
const TABS = [['workflow', 'Pipeline stages'], ['tags', 'Tags & sources'], ['templates', 'Email templates']];

function ChipList({ title, items, field, onChange, placeholder }) {
  const [text, setText] = useState('');
  const add = () => {
    const value = text.trim();
    if (!value) return;
    onChange([...items, { [field]: value }]);
    setText('');
  };
  return (
    <div className="space-y-3">
      <p className="text-sm font-black text-slate-900">{title}</p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span key={item.id || `${item[field]}-${i}`} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
            {item[field]}
            <button type="button" onClick={() => onChange(items.filter((_, j) => j !== i))} aria-label={`Remove ${item[field]}`} className="text-slate-400 hover:text-rose-600"><X className="w-3 h-3" /></button>
          </span>
        ))}
        {!items.length && <span className="text-xs text-slate-400">None yet.</span>}
      </div>
      <div className="flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={placeholder} aria-label={placeholder} className={`${inputClass} flex-1`} />
        <button type="button" onClick={add} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">Add</button>
      </div>
    </div>
  );
}

export const RecruitmentSettingsView = () => {
  const { currentUser } = useApp();
  const { data, loading, error, reload, save } = useResource('recruitmentSettings', { settings: true });
  const [tab, setTab] = useState('workflow');
  const [draft, setDraft] = useState(null);
  const [newStage, setNewStage] = useState('');
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [saving, setSaving] = useState(false);
  const canEdit = ['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role);

  useEffect(() => { if (data) setDraft(structuredClone(data)); }, [data]);
  const dirty = draft && data && JSON.stringify(draft) !== JSON.stringify(data);
  const set = (key, value) => setDraft(d => ({ ...d, [key]: value }));

  const saveAll = async () => {
    setSaving(true);
    try {
      await save({ stages: draft.stages, tags: draft.tags, sources: draft.sources, email_templates: draft.email_templates }, 'Recruitment settings saved.');
    } catch { /* toast shown; keep the draft so nothing is lost */ } finally {
      setSaving(false);
    }
  };

  const moveStage = (i, dir) => {
    const stages = [...draft.stages];
    [stages[i], stages[i + dir]] = [stages[i + dir], stages[i]];
    set('stages', stages);
  };

  const templateFields = [
    { name: 'name', label: 'Template name', required: true },
    { name: 'stage', label: 'Used at stage', type: 'select', options: (draft?.stages || []).map(s => ({ value: s.name, label: s.name })), placeholder: 'Any stage' },
    { name: 'subject', label: 'Subject', required: true },
    { name: 'body', label: 'Message', type: 'textarea', required: true, help: 'Placeholders: {{first_name}}, {{last_name}}, {{job_title}}' }
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Recruitment Settings</h1>
          <p className="text-xs text-slate-500 mt-1">{canEdit ? 'Changes apply to every job once saved.' : 'Only HR administrators can change these settings.'}</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            {dirty && <button type="button" onClick={() => setDraft(structuredClone(data))} className="px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">Discard changes</button>}
            <button type="button" onClick={saveAll} disabled={!dirty || saving} className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold disabled:opacity-40">
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200">
        {TABS.map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)}
            className={`px-4 py-2 text-xs font-bold border-b-2 -mb-px ${tab === id ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>{label}</button>
        ))}
      </div>

      <LoadState loading={loading} error={error} onRetry={reload}>
        {draft && (
          <fieldset disabled={!canEdit} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card">
            {tab === 'workflow' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500">Candidates move through these stages in order. Locked stages are used by reports and can't be renamed or removed.</p>
                {draft.stages.map((s, i) => (
                  <div key={s.id || i} className="flex items-center gap-2">
                    <span className="w-6 text-xs font-bold text-slate-400">{i + 1}</span>
                    <input value={s.name} disabled={s.locked} aria-label={`Stage ${i + 1} name`}
                      onChange={(e) => set('stages', draft.stages.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} className={`${inputClass} flex-1`} />
                    {s.locked && <Lock className="w-4 h-4 text-slate-400" aria-label="Locked" />}
                    <button type="button" onClick={() => moveStage(i, -1)} disabled={i === 0} aria-label={`Move ${s.name} up`} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => moveStage(i, 1)} disabled={i === draft.stages.length - 1} aria-label={`Move ${s.name} down`} className="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={() => set('stages', draft.stages.filter((_, j) => j !== i))} disabled={s.locked} aria-label={`Remove ${s.name}`} className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <input value={newStage} onChange={(e) => setNewStage(e.target.value)} placeholder="New stage name" aria-label="New stage name" className={`${inputClass} flex-1`} />
                  <button type="button" onClick={() => {
                    if (!newStage.trim()) return;
                    // New stages go before Hired/Rejected
                    const end = draft.stages.findIndex(s => ['Hired', 'Rejected'].includes(s.name));
                    const at = end === -1 ? draft.stages.length : end;
                    set('stages', [...draft.stages.slice(0, at), { name: newStage.trim() }, ...draft.stages.slice(at)]);
                    setNewStage('');
                  }} className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"><Plus className="w-3.5 h-3.5" />Add stage</button>
                </div>
              </div>
            )}

            {tab === 'tags' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ChipList title="Candidate tags" items={draft.tags} field="title" placeholder="New tag" onChange={(v) => set('tags', v)} />
                <ChipList title="Candidate sources" items={draft.sources} field="title" placeholder="New source (e.g. Job fair)" onChange={(v) => set('sources', v)} />
              </div>
            )}

            {tab === 'templates' && (
              <div className="space-y-3">
                <div className="flex justify-end">
                  <button type="button" onClick={() => setEditingTemplate({ index: -1 })} className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"><Plus className="w-3.5 h-3.5" />New template</button>
                </div>
                {draft.email_templates.map((t, i) => (
                  <div key={t.id || i} className="p-4 rounded-2xl border border-slate-200 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900">{t.name} {t.stage && <span className="ml-2 text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">{t.stage}</span>}</p>
                      <p className="text-xs text-slate-500 truncate">{t.subject}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button type="button" onClick={() => setEditingTemplate({ ...t, index: i })} title={`Edit ${t.name}`} className="p-2 rounded-xl bg-blue-600 text-white"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button type="button" onClick={() => set('email_templates', draft.email_templates.filter((_, j) => j !== i))} title={`Delete ${t.name}`} className="p-2 rounded-xl bg-rose-500 text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
                {!draft.email_templates.length && <p className="text-xs text-slate-400">No templates yet.</p>}
              </div>
            )}
          </fieldset>
        )}
      </LoadState>

      {dirty && <p className="text-xs font-semibold text-amber-700">You have unsaved changes.</p>}

      <RecordDrawer
        isOpen={Boolean(editingTemplate)}
        title={editingTemplate?.index >= 0 ? 'Edit Email Template' : 'New Email Template'}
        submitLabel="Apply"
        fields={templateFields}
        initial={editingTemplate || {}}
        onClose={() => setEditingTemplate(null)}
        onSubmit={async (v) => {
          const { index } = editingTemplate;
          const item = { ...(index >= 0 ? draft.email_templates[index] : {}), ...v, stage: v.stage || null };
          set('email_templates', index >= 0 ? draft.email_templates.map((t, j) => (j === index ? item : t)) : [...draft.email_templates, item]);
        }}
      />
    </div>
  );
};
