import React, { useMemo, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import LoadState from '../common/LoadState';

const nameOf = (e) => `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name;

function Node({ person, reportsOf, collapsed, toggle, onSelect, selectedId }) {
  const reports = reportsOf(person.id);
  const open = !collapsed[person.id];
  return (
    <div className="flex flex-col items-center">
      <button type="button" onClick={() => onSelect(person)} aria-pressed={selectedId === person.id}
        className={`px-4 py-2.5 bg-white border rounded-xl shadow-xs text-left flex items-center gap-2.5 min-w-[170px] ${selectedId === person.id ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-200'}`}>
        {person.avatar ? <img src={person.avatar} alt="" className="w-8 h-8 rounded-full object-cover" /> : <div className="w-8 h-8 rounded-full bg-emerald-100" />}
        <div className="min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">{nameOf(person)}</p>
          <p className="text-[10px] text-slate-400 truncate">{person.job_title}</p>
        </div>
      </button>
      {reports.length > 0 && (
        <>
          <button type="button" onClick={() => toggle(person.id)} aria-label={`${open ? 'Collapse' : 'Expand'} ${nameOf(person)}'s team (${reports.length})`}
            className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center -mt-2.5 z-10 shadow-xs hover:scale-110 transition-transform">
            {open ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
          </button>
          {open && (
            <>
              <div className="w-px h-5 bg-slate-300" />
              <div className="flex items-start justify-center gap-4 border-t border-slate-300 pt-5">
                {reports.map(r => <Node key={r.id} person={r} reportsOf={reportsOf} collapsed={collapsed} toggle={toggle} onSelect={onSelect} selectedId={selectedId} />)}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

/** The reporting lines, from each employee's manager. HR can change who someone reports to. */
export const OrgChartView = () => {
  const { employees, currentUser, showToast, loadEmployees } = useApp();
  const [collapsed, setCollapsed] = useState({});
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const isHr = ['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role);

  const staff = useMemo(() => employees.filter(e => e.status !== 'TERMINATED'), [employees]);
  const ids = new Set(staff.map(e => e.id));
  const reportsOf = (id) => staff.filter(e => (e.manager_id && ids.has(e.manager_id) ? e.manager_id : null) === id).sort((a, b) => nameOf(a).localeCompare(nameOf(b)));
  const roots = reportsOf(null);

  // Everyone under a person (they can't report to one of these)
  const below = (id) => reportsOf(id).flatMap(r => [r.id, ...below(r.id)]);
  const current = selected && staff.find(e => e.id === selected.id);

  const changeManager = async (managerId) => {
    setSaving(true);
    try {
      await api.updateEmployee(current.id, { manager_id: managerId || null });
      showToast(managerId ? `${nameOf(current)} now reports to ${nameOf(staff.find(e => e.id === managerId))}.` : `${nameOf(current)} is now at the top of the chart.`, 'success');
      await loadEmployees();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">ORG Chart</h2>
        <p className="text-xs text-slate-500 mt-0.5">Built from each person's line manager.{isHr ? ' Select someone to change who they report to.' : ''}</p>
      </div>
      {current && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center gap-4">
          <p className="text-sm font-bold text-slate-900">{nameOf(current)}</p>
          <p className="text-xs text-slate-500">{reportsOf(current.id).length} direct report(s)</p>
          {isHr && (
            <label className="flex items-center gap-2 text-xs font-bold text-slate-700 ml-auto">
              Reports to
              <select value={current.manager_id || ''} disabled={saving} onChange={(e) => changeManager(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Nobody (top of the chart)</option>
                {staff.filter(e => e.id !== current.id && !below(current.id).includes(e.id)).map(e => <option key={e.id} value={e.id}>{nameOf(e)}</option>)}
              </select>
            </label>
          )}
          <button type="button" onClick={() => setSelected(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">Close</button>
        </div>
      )}
      <LoadState empty={!staff.length} emptyText="No employees yet.">
        <div className="bg-white rounded-3xl border border-slate-200/80 p-8 shadow-card overflow-x-auto min-h-[400px] flex items-start justify-center gap-6">
          {roots.map(p => <Node key={p.id} person={p} reportsOf={reportsOf} collapsed={collapsed} toggle={(id) => setCollapsed(c => ({ ...c, [id]: !c[id] }))} onSelect={setSelected} selectedId={selected?.id} />)}
        </div>
      </LoadState>
    </div>
  );
};

export default OrgChartView;
