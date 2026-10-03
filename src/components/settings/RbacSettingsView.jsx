import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Shield, Check, Search } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import LoadState from '../common/LoadState';

const ROLE_OPTIONS = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'HR_MANAGER', label: 'HR Manager' },
  { value: 'PEOPLE_MANAGER', label: 'People Manager' },
  { value: 'EMPLOYEE', label: 'Employee' }
];

/**
 * Settings > Permission. Access is enforced by four fixed roles in the server, so this screen shows
 * exactly what each role can do and who holds it; changing someone's role saves to their record.
 */
export const RbacSettingsView = () => {
  const { showToast, currentUser, employees, loadEmployees } = useApp();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('permission');
  const [memberSearch, setMemberSearch] = useState('');
  const [adding, setAdding] = useState('');
  const [busy, setBusy] = useState(null);

  const load = useCallback(async () => {
    setError('');
    try {
      setRoles(await api.getRoles());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const changeRole = async (member, role) => {
    setBusy(member.id);
    try {
      await api.updateEmployee(member.id, { role });
      showToast(`${member.name} is now ${ROLE_OPTIONS.find(r => r.value === role).label}.`, 'success');
      await load();
      loadEmployees?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(null);
    }
  };

  const role = roles.find(r => r.role === selected);
  const members = (role?.members || []).filter(m => `${m.name} ${m.email}`.toLowerCase().includes(memberSearch.trim().toLowerCase()));
  const others = employees.filter(e => e.status !== 'TERMINATED' && e.role !== selected && e.id !== currentUser?.id);

  if (!role) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-6">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Roles</h2>
          <p className="text-xs text-slate-500 mt-1">NexusHR has four built-in roles. What each role can do is set by the system; you choose who has which role.</p>
        </div>
        <LoadState loading={loading} error={error} onRetry={load}>
          <div className="space-y-3">
            {roles.map(r => (
              <button key={r.role} onClick={() => { setSelected(r.role); setTab('permission'); }}
                className="w-full p-4 rounded-2xl border border-slate-200/80 hover:bg-slate-50 flex items-center justify-between text-left transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><Shield className="w-5 h-5 text-emerald-600" /></div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{r.name}</p>
                    <p className="text-xs text-slate-500">{r.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-600">{r.members.length} member{r.members.length === 1 ? '' : 's'}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </button>
            ))}
          </div>
        </LoadState>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => setSelected(null)} aria-label="Back to roles" className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50"><ChevronLeft className="w-4 h-4" /></button>
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">{role.name}</h2>
          <p className="text-xs text-slate-500">{role.description}</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-100">
        {[['permission', 'What this role can do'], ['member', `Members (${role.members.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 text-xs font-bold border-b-2 -mb-px ${tab === id ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'permission' && (
        <ul className="space-y-2">
          {role.can.map(item => (
            <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
              <Check className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}

      {tab === 'member' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input value={memberSearch} onChange={(e) => setMemberSearch(e.target.value)} placeholder="Search members"
                className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div className="flex gap-2">
              <select value={adding} onChange={(e) => setAdding(e.target.value)} aria-label="Employee to add"
                className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Add someone to this role…</option>
                {others.map(e => <option key={e.id} value={e.id}>{`${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name}</option>)}
              </select>
              <button disabled={!adding || busy} onClick={() => {
                const emp = employees.find(e => e.id === adding);
                changeRole({ id: emp.id, name: `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || emp.name }, role.role).then(() => setAdding(''));
              }} className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-50">Add</button>
            </div>
          </div>
          <LoadState empty={!members.length} emptyText="Nobody has this role.">
            <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl">
              {members.map(m => (
                <div key={m.id} className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {m.avatar ? <img src={m.avatar} alt="" className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-slate-200" />}
                    <div>
                      <p className="text-sm font-bold text-slate-900">{m.name}</p>
                      <p className="text-xs text-slate-500">{m.email}{m.job_title ? ` · ${m.job_title}` : ''}</p>
                    </div>
                  </div>
                  {m.id === currentUser?.id ? (
                    <span className="text-xs text-slate-400 font-semibold">You (ask another admin to change your role)</span>
                  ) : (
                    <select value={role.role} disabled={busy === m.id} aria-label={`Role for ${m.name}`}
                      onChange={(e) => changeRole(m, e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500">
                      {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  )}
                </div>
              ))}
            </div>
          </LoadState>
        </div>
      )}
    </div>
  );
};

export default RbacSettingsView;
