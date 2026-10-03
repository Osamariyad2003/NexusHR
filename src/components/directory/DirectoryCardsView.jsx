import React, { useState } from 'react';
import { Mail, Phone, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';
import LoadState from '../common/LoadState';

const nameOf = (e) => `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name;
const initials = (n) => n.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();

/** Everyone who works here, as cards. Private details (phone) show only to HR and the person themself. */
export const DirectoryCardsView = () => {
  const { employees, departments } = useApp();
  const { rows: offices } = useResource('offices', { quiet: true });
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('ALL');
  const [office, setOffice] = useState('ALL');

  const q = search.trim().toLowerCase();
  const people = employees
    .filter(e => e.status !== 'TERMINATED')
    .filter(e => (dept === 'ALL' || e.department_id === dept) && (office === 'ALL' || e.office_id === office) &&
      (!q || `${nameOf(e)} ${e.job_title} ${e.email}`.toLowerCase().includes(q)))
    .sort((a, b) => nameOf(a).localeCompare(nameOf(b)));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Directory</h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">{people.length} people</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <select value={dept} onChange={(e) => setDept(e.target.value)} aria-label="Filter by department" className="px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold">
            <option value="ALL">All departments</option>{departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
          <select value={office} onChange={(e) => setOffice(e.target.value)} aria-label="Filter by office" className="px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold">
            <option value="ALL">All offices</option>{offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <div className="relative w-56">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search people" className="w-full pl-4 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
        </div>
      </div>
      <LoadState empty={!people.length} emptyText="Nobody matches.">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {people.map((person) => (
            <div key={person.id} className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col items-center text-center space-y-4">
              {person.avatar
                ? <img src={person.avatar} alt="" className="w-20 h-20 rounded-full object-cover border-4 border-slate-100 shadow-md" />
                : <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 text-xl font-black flex items-center justify-center border-4 border-slate-100">{initials(nameOf(person))}</div>}
              <div>
                <h3 className="text-base font-extrabold text-slate-900 tracking-tight">{nameOf(person)}</h3>
                <p className="text-xs text-slate-400 font-medium mt-0.5">{person.job_title}</p>
                <p className="text-[11px] text-slate-400">{person.department}{person.status === 'ON_LEAVE' ? ' · on leave' : ''}</p>
              </div>
              <div className="w-full pt-3 border-t border-slate-100 space-y-2 text-xs">
                <a href={`mailto:${person.email}`} className="flex items-center justify-center gap-2 text-slate-600 hover:text-emerald-600">
                  <Mail className="w-3.5 h-3.5 text-slate-400" /><span className="truncate">{person.email}</span>
                </a>
                {person.phone && (
                  <a href={`tel:${person.phone}`} className="flex items-center justify-center gap-2 text-slate-600 hover:text-emerald-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400" /><span>{person.phone}</span>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </LoadState>
    </div>
  );
};

export default DirectoryCardsView;
