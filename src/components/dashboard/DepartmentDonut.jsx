import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useApp } from '../../context/AppContext';
import { Building2 } from 'lucide-react';

export const DepartmentDonut = () => {
  const { departments } = useApp();

  const totalHeadcount = departments.reduce((acc, d) => acc + d.headcount, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const pct = (totalHeadcount ? (data.headcount / totalHeadcount) * 100 : 0).toFixed(1);
      return (
        <div className="bg-slate-900 text-white px-3 py-2 rounded-xl shadow-xl text-xs space-y-0.5 border border-slate-700">
          <p className="font-bold text-slate-100">{data.name}</p>
          <p className="text-slate-300">{data.headcount} Employees ({pct}%)</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base">Department Distribution</h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-100 text-slate-500">REQ-DASH-006</span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Active FTE headcount across teams</p>
        </div>
        <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
          <Building2 className="w-5 h-5" />
        </div>
      </div>

      {/* Donut Chart & Legend Grid */}
      <div className="flex flex-col sm:flex-row items-center gap-4 my-2">
        {/* Chart Container */}
        <div className="h-48 w-48 relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={departments}
                cx="50%"
                cy="50%"
                innerRadius={52}
                outerRadius={78}
                paddingAngle={3}
                dataKey="headcount"
              >
                {departments.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          {/* Centered Total Count Overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-slate-900">{totalHeadcount}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total FTE</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full grid grid-cols-2 gap-2 text-xs">
          {departments.map((dept) => {
            const pct = (totalHeadcount ? (dept.headcount / totalHeadcount) * 100 : 0).toFixed(0);
            return (
              <div key={dept.id} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: dept.color }} />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800 truncate">{dept.name}</p>
                  <p className="text-[11px] text-slate-400">{dept.headcount} FTE ({pct}%)</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
