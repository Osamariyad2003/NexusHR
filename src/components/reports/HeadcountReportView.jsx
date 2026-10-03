import React, { useState } from 'react';
import { ReportFrame, useReports, Card, Stat, Donut, Table, Filter, toPairs } from './ReportParts';

const fmt = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

export default function HeadcountReportView({ onBack }) {
  const reports = useReports();
  const [dept, setDept] = useState('ALL');
  const [type, setType] = useState('ALL');
  const [office, setOffice] = useState('ALL');
  const [breakdown, setBreakdown] = useState('by_department');

  const rowsOf = (d) => d.headcount.rows.filter(r => (dept === 'ALL' || r.department === dept) && (type === 'ALL' || r.type === type) && (office === 'ALL' || r.office === office));

  return (
    <ReportFrame title="Headcount" subtitle="current employees" onBack={onBack} reports={reports}
      csv={{ name: 'headcount', rows: rowsOf, columns: [['Name', r => r.name], ['Department', r => r.department], ['Job title', r => r.job_title], ['Type', r => r.type], ['Office', r => r.office], ['Join date', r => r.join_date]] }}>
      {(d) => {
        const rows = rowsOf(d);
        const counts = rows.reduce((acc, r) => {
          const key = { by_department: r.department, by_type: r.type, by_gender: r.gender, by_office: r.office }[breakdown];
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});
        return (
          <>
            <div className="flex flex-wrap gap-3">
              <Filter label="Department" value={dept} onChange={setDept} options={Object.keys(d.headcount.by_department)} />
              <Filter label="Type" value={type} onChange={setType} options={Object.keys(d.headcount.by_type)} />
              <Filter label="Office" value={office} onChange={setOffice} options={Object.keys(d.headcount.by_office)} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Stat label="Employees" value={rows.length} hint={rows.length !== d.headcount.total ? `of ${d.headcount.total} in total` : 'everyone employed today'} />
              <Card title="Breakdown" className="lg:col-span-2">
                <div className="flex gap-2 mb-2">
                  {[['by_department', 'Department'], ['by_type', 'Type'], ['by_gender', 'Gender'], ['by_office', 'Office']].map(([k, l]) => (
                    <button key={k} type="button" onClick={() => setBreakdown(k)} aria-pressed={breakdown === k} className={`px-3 py-1 rounded-lg text-xs font-bold ${breakdown === k ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{l}</button>
                  ))}
                </div>
                <Donut data={toPairs(counts)} />
              </Card>
            </div>
            <Card title="Employees">
              <Table rows={rows} columns={[['Name', r => r.name], ['Department', r => r.department], ['Job title', r => r.job_title], ['Type', r => r.type], ['Office', r => r.office], ['Join date', r => fmt(r.join_date)]]} />
            </Card>
          </>
        );
      }}
    </ReportFrame>
  );
}
