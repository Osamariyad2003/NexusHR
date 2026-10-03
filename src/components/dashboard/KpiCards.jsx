import React from 'react';
import { Users, CalendarDays, Clock, TrendingUp, TrendingDown, Briefcase, FileText, UserPlus, HelpCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const number = (value) => (typeof value === 'number' ? value.toLocaleString() : '—');
const percent = (value) => (typeof value === 'number' ? `${value}%` : '—');
const shortDate = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

/** Workforce KPIs from GET /dashboard/metrics (REQ-DASH-001..004). Nothing here is hard-coded. */
export const KpiCards = ({ variant = 'v1' }) => {
  const { metrics, loading } = useApp();

  if (loading || !metrics) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-32 bg-white rounded-2xl border border-slate-200 p-5 animate-pulse flex flex-col justify-between">
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="h-3 bg-slate-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const { total_employees: total = {}, job_applicants: applicants = {}, new_employees: joiners = {}, terminations = {}, employment_types: types = {} } = metrics;
  const change = total.change_pct;

  const kpisV1 = [
    {
      id: 'REQ-DASH-001',
      title: 'Total Employees',
      value: number(total.value),
      subtitle: typeof total.year_ago === 'number' ? `${number(total.year_ago)} a year ago` : 'Currently employed',
      trend: typeof change === 'number' ? { up: change >= 0, text: `${change >= 0 ? '+' : ''}${change}% YoY` } : null,
      icon: Users,
      iconBg: 'bg-brand-50 text-brand-600'
    },
    {
      id: 'REQ-DASH-002',
      title: 'Job Applicants',
      value: number(applicants.value),
      subtitle: typeof applicants.open_positions === 'number' ? `Active candidates · ${applicants.open_positions} open positions` : 'Active candidates in pipeline',
      icon: UserPlus,
      iconBg: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: 'REQ-DASH-003-A',
      title: 'New Employees',
      value: number(joiners.value),
      subtitle: joiners.since ? `Joined since ${shortDate(joiners.since)} (this quarter)` : 'Joined this quarter',
      icon: CalendarDays,
      iconBg: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'REQ-DASH-003-B',
      title: 'Terminations',
      value: number(terminations.value),
      subtitle: `Last 12 months · attrition ${percent(terminations.attrition_pct)}`,
      icon: Clock,
      iconBg: 'bg-rose-50 text-rose-600'
    }
  ];

  const typeCard = (key, title, subtitle, icon, iconBg, id) => ({
    id,
    title,
    value: number(types[key]?.value),
    subtitle: `${percent(types[key]?.share_pct)} of workforce · ${subtitle}`,
    icon,
    iconBg
  });
  const kpisV2 = [
    typeCard('FULL_TIME', 'Full-time', 'Permanent staff', Briefcase, 'bg-indigo-50 text-indigo-600', 'REQ-DASH-004-A'),
    typeCard('PART_TIME', 'Part-time', 'Reduced hours', FileText, 'bg-emerald-50 text-emerald-600', 'REQ-DASH-004-B'),
    typeCard('CONTRACTOR', 'Contractors', 'Fixed-term or project', UserPlus, 'bg-amber-50 text-amber-600', 'REQ-DASH-004-C'),
    typeCard('UNSPECIFIED', 'Type not set', 'Set it on the employee profile', HelpCircle, 'bg-slate-100 text-slate-500', 'REQ-DASH-004-D')
  ];

  const activeKpis = variant === 'v2' ? kpisV2 : kpisV1;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
      {activeKpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card hover:shadow-card-hover transition-all duration-200 flex flex-col justify-between group"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">{kpi.title}</span>
                <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{kpi.id}</span>
              </div>
              <div className={`p-2.5 rounded-xl ${kpi.iconBg} group-hover:scale-110 transition-transform flex-shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
            </div>

            <div className="flex items-baseline justify-between gap-2 my-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{kpi.value}</span>
              {kpi.trend && (
                <span className={`flex items-center gap-1 text-xs font-semibold ${kpi.trend.up ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {kpi.trend.up ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {kpi.trend.text}
                </span>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-500 font-medium">{kpi.subtitle}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
