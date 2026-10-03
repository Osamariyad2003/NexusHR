import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Download,
  Plus,
  ChevronDown,
  Check,
  Eye,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { downloadCsv, todayStamp } from '../../utils/csv';
import { AddNewProfileDrawer } from './AddNewProfileDrawer';
import { EmployeeDetailView } from './EmployeeDetailView';

const PAGE_SIZE = 10;
const STATUS_OPTIONS = ['All Status', 'Active', 'On Leave', 'Suspended', 'Terminated'];
const BADGE_STYLES = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ON_LEAVE: 'bg-amber-50 text-amber-700 border-amber-200',
  SUSPENDED: 'bg-purple-50 text-purple-700 border-purple-200',
  TERMINATED: 'bg-rose-50 text-rose-700 border-rose-200'
};
const humanize = (value) => (value ? String(value).replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase()) : '—');

// The API's employee record, with display names derived for older rows that only have `name`
const toRow = (e) => {
  const [first = '', ...rest] = (e.name || '').split(' ');
  return {
    ...e,
    first_name: e.first_name || first,
    last_name: e.last_name || rest.join(' '),
    department_name: e.department_name || e.department || '—'
  };
};

export const EmployeeDirectory = () => {
  // `employees` is already filtered by the header search (Alt + /) and loaded from the API
  const { employees, loadEmployees, showToast, currentUser } = useApp();
  const canManagePeople = ['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role);

  const [searchEmp, setSearchEmp] = useState('');
  const [selectedJobTitle, setSelectedJobTitle] = useState('All Job Titles');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [page, setPage] = useState(1);

  const [activeView, setActiveView] = useState('list');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const rows = useMemo(() => (employees || []).map(toRow), [employees]);
  const jobTitles = useMemo(() => [...new Set(rows.map((r) => r.job_title).filter(Boolean))].sort(), [rows]);

  const filteredEmployees = rows.filter((e) => {
    const q = searchEmp.trim().toLowerCase();
    const matchesSearch = !q || `${e.first_name} ${e.last_name}`.toLowerCase().includes(q) || (e.email || '').toLowerCase().includes(q);
    const matchesStatus = selectedStatus === 'All Status' || humanize(e.status) === selectedStatus;
    const matchesTitle = selectedJobTitle === 'All Job Titles' || e.job_title === selectedJobTitle;
    return matchesSearch && matchesStatus && matchesTitle;
  });

  const pageCount = Math.max(1, Math.ceil(filteredEmployees.length / PAGE_SIZE));
  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);
  const pageRows = filteredEmployees.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAddNewSubmit = async (fields) => {
    const res = await api.createEmployee(fields); // throws with the server's message on failure
    await loadEmployees();
    showToast(`Employee ${res.data.first_name} ${res.data.last_name} created.`, 'success');
  };

  const handleDownload = () => {
    downloadCsv(`employees-${todayStamp()}.csv`, filteredEmployees, [
      { header: 'Employee ID', value: (e) => e.id },
      { header: 'First Name', value: (e) => e.first_name },
      { header: 'Last Name', value: (e) => e.last_name },
      { header: 'Email', value: (e) => e.email },
      { header: 'Job Title', value: (e) => e.job_title },
      { header: 'Department', value: (e) => e.department_name },
      { header: 'Status', value: (e) => e.status },
      { header: 'Role', value: (e) => e.role },
      { header: 'Join Date', value: (e) => e.join_date }
    ]);
    showToast(`Downloaded ${filteredEmployees.length} employee(s).`, 'success');
  };

  if (activeView === 'detail') {
    return (
      <EmployeeDetailView
        employee={selectedEmployee}
        onBack={() => setActiveView('list')}
        onUpdated={loadEmployees}
      />
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-6">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Employees</h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5">Manage your Employee</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleDownload}
              disabled={filteredEmployees.length === 0}
              className="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Download</span>
            </button>

            {canManagePeople && (
              <button
                onClick={() => setIsDrawerOpen(true)}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add New</span>
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchEmp}
              onChange={(e) => { setSearchEmp(e.target.value); setPage(1); }}
              placeholder="Search employee"
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>

          <select
            value={selectedJobTitle}
            onChange={(e) => { setSelectedJobTitle(e.target.value); setPage(1); }}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="All Job Titles">All Job Titles</option>
            {jobTitles.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>

          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 font-medium flex items-center gap-2 hover:border-slate-300 focus:outline-none"
            >
              <span>{selectedStatus}</span>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-modal border border-slate-200 py-2 z-30 animate-fadeIn">
                {STATUS_OPTIONS.map((status) => (
                  <button
                    key={status}
                    onClick={() => { setSelectedStatus(status); setShowStatusDropdown(false); setPage(1); }}
                    className="w-full px-4 py-2 text-left text-xs font-semibold hover:bg-slate-50 flex items-center justify-between text-slate-800"
                  >
                    <span>{status}</span>
                    {selectedStatus === status && <Check className="w-4 h-4 text-emerald-500" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-100 rounded-2xl">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-bold text-slate-400">
                <th className="py-3 px-4">Employee Name</th>
                <th className="py-3 px-4">Job Title</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Employee Status</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Join Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500">
                    {rows.length === 0 ? 'No employees to show.' : 'No employees match these filters.'}
                  </td>
                </tr>
              )}
              {pageRows.map((emp) => (
                <tr
                  key={emp.id}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  onClick={() => { setSelectedEmployee(emp); setActiveView('detail'); }}
                >
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      {emp.avatar ? (
                        <img src={emp.avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[11px] font-bold">
                          {(emp.first_name[0] || '') + (emp.last_name[0] || '')}
                        </div>
                      )}
                      <div>
                        <p className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                          {emp.first_name} {emp.last_name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-700">{emp.job_title || '—'}</td>
                  <td className="py-3.5 px-4 text-slate-600">{emp.department_name}</td>
                  <td className="py-3.5 px-4">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${BADGE_STYLES[emp.status] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {humanize(emp.status)}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-600">{humanize(emp.role)}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{emp.join_date || '—'}</td>
                  <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => { setSelectedEmployee(emp); setActiveView('detail'); }}
                      className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors"
                      title="View employee"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
          <span>
            {filteredEmployees.length === 0
              ? '0 employees'
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filteredEmployees.length)} of ${filteredEmployees.length}`}
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-xl text-xs ${n === page ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-500 font-medium hover:bg-slate-50'}`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(page + 1)}
              disabled={page === pageCount}
              className="p-2 rounded-xl border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AddNewProfileDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onSubmit={handleAddNewSubmit}
      />
    </div>
  );
};
