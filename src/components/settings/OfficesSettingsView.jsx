import React, { useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useResource } from '../../hooks/useResource';
import RecordDrawer from '../common/RecordDrawer';
import LoadState from '../common/LoadState';
import Toggle from '../common/Toggle';

const OFFICE_FIELDS = [
  { name: 'name', label: 'Office name', required: true, placeholder: 'e.g. Berlin Hub' },
  { name: 'is_hq', label: 'Headquarters (only one office can be HQ)', type: 'checkbox' },
  { name: 'city', label: 'City' },
  { name: 'country', label: 'Country' },
  { name: 'address', label: 'Address' },
  { name: 'timezone', label: 'Timezone', placeholder: 'e.g. Europe/Berlin' },
  { name: 'phone', label: 'Contact number', type: 'tel' },
  { name: 'email', label: 'Contact email', type: 'email' }
];

export default function OfficesSettingsView() {
  const { rows: offices, loading, error, reload, create, update, remove } = useResource('offices');
  const [editing, setEditing] = useState(null); // null = closed, {} = new, office = edit

  const save = (values) => (editing?.id ? update(editing.id, values) : create(values));

  const handleDelete = (office) => {
    if (window.confirm(`Delete the office "${office.name}"? This cannot be undone.`)) remove(office.id).catch(() => {});
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900">Offices</h2>
        <button onClick={() => setEditing({})} className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Office</span>
        </button>
      </div>

      <LoadState loading={loading} error={error} onRetry={reload} empty={!offices.length} emptyText="No offices yet. Add your first office.">
        <div className="space-y-4">
          {offices.map((office) => (
            <div key={office.id} className="p-6 bg-white rounded-3xl border border-slate-200/80 shadow-card space-y-5 transition-all hover:shadow-lg">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-extrabold text-slate-900">{office.name}</h3>
                    {office.is_hq && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black uppercase tracking-wider">HQ</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 font-medium">{[office.city, office.country].filter(Boolean).join(', ') || '—'}</p>
                </div>

                <div className="flex items-center gap-3">
                  <Toggle
                    on={office.status === 'ACTIVE'}
                    label={`${office.name} active`}
                    onChange={(on) => update(office.id, { status: on ? 'ACTIVE' : 'INACTIVE' }, `${office.name} is now ${on ? 'active' : 'inactive'}.`).catch(() => {})}
                  />
                  <button onClick={() => setEditing(office)} title="Edit office" className="p-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-2xs transition-all">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(office)} title="Delete office" className="p-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white shadow-2xs transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold">
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Number Of Employees</span>
                  <span className="text-slate-900 font-black">{office.employees_count}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Timezone</span>
                  <span className="text-slate-800 font-bold">{office.timezone || '—'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Contact Number</span>
                  <span className="text-slate-800 font-mono font-bold">{office.phone || '—'}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-slate-400 font-bold block">Contact Email</span>
                  <span className="text-slate-800 font-bold">{office.email || '—'}</span>
                </div>
                {office.address && (
                  <div className="space-y-1 sm:col-span-2">
                    <span className="text-slate-400 font-bold block">Address</span>
                    <span className="text-slate-800 font-bold">{office.address}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </LoadState>

      <RecordDrawer
        isOpen={Boolean(editing)}
        title={editing?.id ? 'Edit Office' : 'Add Office'}
        submitLabel={editing?.id ? 'Save' : 'Create'}
        fields={OFFICE_FIELDS}
        initial={editing || {}}
        onSubmit={save}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
