import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Briefcase,
  TrendingUp,
  Calendar,
  TrendingDown
} from 'lucide-react';

export default function ReportsHubView({ onSelectReport }) {
  const reportCards = [
    {
      id: 'headcount',
      title: 'Headcount (Point-in-time)',
      description: 'Breakdown of all current employees.',
      icon: Users,
      color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    },
    {
      id: 'onboarding',
      title: 'Onboarding',
      description: 'Onboarding employees by month of their Join Date.',
      icon: UserCheck,
      color: 'bg-teal-50 text-teal-600 border-teal-100'
    },
    {
      id: 'offboarding',
      title: 'Offboarding',
      description: 'Offboarding and inactive employees by month of their Last Working Date.',
      icon: UserX,
      color: 'bg-rose-50 text-rose-600 border-rose-100'
    },
    {
      id: 'time-off-balance',
      title: 'Time Off Balance',
      description: "An overview of employees' time off balances.",
      icon: Clock,
      color: 'bg-blue-50 text-blue-600 border-blue-100'
    },
    {
      id: 'recruitment-pipeline',
      title: 'Recruitment Pipeline',
      description: 'An overview of the hiring progress during a period of time.',
      icon: Briefcase,
      color: 'bg-amber-50 text-amber-600 border-amber-100'
    },
    {
      id: 'employee-data',
      title: 'Employee Data Reports',
      description: 'An overview of employee information',
      icon: TrendingUp,
      color: 'bg-indigo-50 text-indigo-600 border-indigo-100'
    },
    {
      id: 'time-off-schedule',
      title: 'Time Off Schedule',
      description: "An overview of employees' time off schedules.",
      icon: Calendar,
      color: 'bg-purple-50 text-purple-600 border-purple-100'
    },
    {
      id: 'turnover-rate',
      title: 'Employee Turnover Rate',
      description: 'An overview of the resigned employees over the active employees',
      icon: TrendingDown,
      color: 'bg-sky-50 text-sky-600 border-sky-100'
    }
  ];

  return (
    <div className="space-y-6 font-sans">
      
      {/* Page Header Bar matching Figma Screen 97 */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Report
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Here's report so far
        </p>
      </div>

      {/* 2-Column Grid of 8 Report Category Cards (Figma Screen 97) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => onSelectReport(card.id)}
              className="p-8 bg-white rounded-3xl border border-slate-200/80 shadow-card flex items-start gap-5 cursor-pointer transition-all hover:shadow-xl hover:border-emerald-500/40 group"
            >
              <div className={`p-3.5 rounded-2xl border ${card.color} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                <Icon className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed">
                  {card.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
