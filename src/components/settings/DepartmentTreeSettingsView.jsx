import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';
import { api } from '../../services/api';
import RecordDrawer from '../common/RecordDrawer';
import LoadState from '../common/LoadState';

function DepartmentNode({ dept, childrenOf, onAdd, onEdit, onDelete }) {
  const kids = childrenOf(dept.id);
  return (
    <div className="flex flex-col items-center">
      <div className="px-4 py-2.5 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center gap-2 relative min-w-[150px] justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dept.color || '#10B981' }} />
          <div className="text-left">
            <p className="font-bold text-slate-900 text-xs">{dept.name}</p>
            <p className="text-[10px] text-slate-400 font-semibold">
              {dept.headcount} employee{dept.headcount === 1 ? '' : 's'}{dept.manager_name ? ` · ${dept.manager_name}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(dept)} title={`Edit ${dept.name}`} className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center hover:bg-slate-700">
            <Edit2 className="w-2.5 h-2.5" />
          </button>
          <button onClick={() => onDelete(dept)} title={`Delete ${dept.name}`} className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center hover:bg-rose-600">
            <Trash2 className="w-2.5 h-2.5" />
          </button>
        </div>
        <button onClick={() => onAdd(dept)} title={`Add a sub-department under ${dept.name}`} className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs hover:scale-110 transition-transform">
          <Plus className="w-3 h-3" />
        </button>
      </div>
      {kids.length > 0 && (
        <>
          <div className="w-px h-6 bg-slate-300 mt-3" />
          <div className="flex items-start justify-center gap-4 border-t border-slate-300 pt-6">
            {kids.map(k => <DepartmentNode key={k.id} dept={k} childrenOf={childrenOf} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} />)}
          </div>
        </>
      )}
    </div>
  );
}

export default function DepartmentTreeSettingsView() {
  const { employees, loadEmployees } = useApp();
  const { rows: departments, loading, error, reload, create, update, remove } = useResource('departments');
  const [companyName, setCompanyName] = useState('');
  const [editing, setEditing] = useState(null); // null closed; { parent_id } new; dept edit

  useEffect(() => { api.getTenantInfo().then(t => setCompanyName(t?.name || ''), () => {}); }, []);

  const childrenOf = useMemo(() => (id) => departments.filter(d => (d.parent_id || null) === id), [departments]);
  const roots = childrenOf(null);

  // A department can't move under itself or its own sub-departments
  const descendantsOf = (id) => childrenOf(id).flatMap(c => [c.id, ...descendantsOf(c.id)]);
  const parentOptions = departments
    .filter(d => !editing?.id || (d.id !== editing.id && !descendantsOf(editing.id).includes(d.id)))
    .map(d => ({ value: d.id, label: d.name }));
  const managerOptions = employees.filter(e => e.status !== 'TERMINATED').map(e => ({ value: e.id, label: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name }));

  const fields = [
    { name: 'name', label: 'Department', required: true, placeholder: 'e.g. Data Platform' },
    { name: 'code', label: 'Code', placeholder: 'e.g. DATA' },
    { name: 'parent_id', label: 'Parent department', type: 'select', options: parentOptions, placeholder: 'None (top level)' },
    { name: 'manager_id', label: 'Manager', type: 'select', options: managerOptions, placeholder: 'No manager' },
    { name: 'color', label: 'Colour', type: 'color' },
    { name: 'description', label: 'Description', type: 'textarea' }
  ];

  const save = async (values) => {
    const payload = { ...values, parent_id: values.parent_id || null, manager_id: values.manager_id || null };
    await (editing?.id ? update(editing.id, payload) : create(payload));
    loadEmployees?.(); // renaming updates employees' department names
  };

  const handleDelete = (dept) => {
    if (window.confirm(`Delete the department "${dept.name}"?`)) remove(dept.id).catch(() => {});
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-slate-900">Department</h2>
        <button onClick={() => setEditing({ parent_id: null })} className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all">
          <Plus className="w-3.5 h-3.5" />
          <span>Add Department</span>
        </button>
      </div>

      <LoadState loading={loading} error={error} onRetry={reload} empty={!departments.length} emptyText="No departments yet. Add your first department.">
        <div className="p-8 bg-slate-50/50 rounded-2xl border border-slate-100 flex flex-col items-center overflow-x-auto">
          <div className="px-6 py-3 rounded-2xl bg-white border border-slate-200 shadow-md">
            <span className="font-extrabold text-slate-900 text-sm">{companyName || 'Company'}</span>
          </div>
          <div className="w-px h-8 bg-slate-300 mt-3" />
          <div className="flex items-start justify-center gap-4 sm:gap-6 border-t border-slate-300 pt-6">
            {roots.map(d => (
              <DepartmentNode key={d.id} dept={d} childrenOf={childrenOf}
                onAdd={(parent) => setEditing({ parent_id: parent.id })} onEdit={setEditing} onDelete={handleDelete} />
            ))}
          </div>
        </div>
      </LoadState>

      <RecordDrawer
        isOpen={Boolean(editing)}
        title={editing?.id ? 'Edit Department' : 'Add New Department'}
        submitLabel={editing?.id ? 'Save' : 'Create'}
        fields={fields}
        initial={{ color: '#10B981', ...(editing || {}) }}
        onSubmit={save}
        onClose={() => setEditing(null)}
      />
    </div>
  );
}
