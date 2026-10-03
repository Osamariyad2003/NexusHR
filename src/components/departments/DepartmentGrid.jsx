import React from 'react';
import { Building2, Users, UserCheck, ChevronRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DepartmentGrid = () => {
  const { departments } = useApp();
  const totalCompanyHeadcount = departments.reduce((acc, d) => acc + d.headcount, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-slate-900">Organizational Departments</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-50 text-indigo-700 font-bold">
              REQ-DASH-006
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Current headcount and department heads, counted from employee records
          </p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Active FTE</span>
            <span className="text-lg font-black text-slate-900">{totalCompanyHeadcount} Personnel</span>
          </div>
          <div className="p-2 rounded-lg bg-brand-50 text-brand-600">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Grid of 6 Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const headcountPct = (totalCompanyHeadcount ? (dept.headcount / totalCompanyHeadcount) * 100 : 0).toFixed(1);
          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm"
                      style={{ backgroundColor: dept.color }}
                    >
                      {dept.code}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-brand-600 transition-colors">
                        {dept.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 font-mono">Dept Code: {dept.code}</span>
                    </div>
                  </div>
                </div>

                {/* Manager Info */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 my-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {dept.manager_avatar ? (
                      <img src={dept.manager_avatar} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-200" />
                    )}
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Department Head</span>
                      <span className="text-xs font-bold text-slate-800">{dept.manager_name || 'Not assigned'}</span>
                    </div>
                  </div>
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                </div>

                {/* Metrics: Headcount & Code */}
                <div className="grid grid-cols-2 gap-3 my-2">
                  <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      <Users className="w-3 h-3 text-slate-400" /> Headcount
                    </span>
                    <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                      {dept.headcount} FTE
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold flex items-center gap-1">
                      Code
                    </span>
                    <span className="text-base font-extrabold text-slate-900 block mt-0.5">
                      {dept.code || '—'}
                    </span>
                  </div>
                </div>

                {/* Headcount Share Progress Bar */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-slate-500">Workforce Share</span>
                    <span className="text-slate-800 font-mono">{headcountPct}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${headcountPct}%`, backgroundColor: dept.color }}
                    />
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-brand-600 font-semibold group-hover:translate-x-1 transition-transform">
                <span>View Department Roster</span>
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
