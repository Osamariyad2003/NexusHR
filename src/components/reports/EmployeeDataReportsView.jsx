import React, { useState } from 'react';
import { ReportFrame, useReports, Card, Donut, Bars, Table, toPairs } from './ReportParts';

/** Age, gender and tenure profiles of current employees. "Not specified" counts people without that detail. */
export default function EmployeeDataReportsView({ onBack }) {
  const reports = useReports();
  const [profile, setProfile] = useState('age');
  const labels = { age: 'Age profile', gender: 'Gender profile', tenure: 'Employee tenure' };
  const field = { age: 'age_band', gender: 'gender', tenure: 'tenure_band' }[profile];

  return (
    <ReportFrame title="Employee Data Reports" subtitle={labels[profile].toLowerCase()} onBack={onBack} reports={reports}
      csv={{ name: `employee-${profile}`, rows: (d) => d.headcount.rows, columns: [['Name', r => r.name], ['Department', r => r.department], ['Job title', r => r.job_title], [labels[profile], r => r[field]]] }}>
      {(d) => (
        <>
          <div className="flex gap-2">
            {Object.entries(labels).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setProfile(k)} aria-pressed={profile === k} className={`px-4 py-2 rounded-2xl text-xs font-bold ${profile === k ? 'bg-emerald-500 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>{l}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title={labels[profile]}><Donut data={toPairs(d.demographics[profile])} /></Card>
            <Card title="Counts"><Bars data={toPairs(d.demographics[profile])} bars={[['value', 'Employees', '#10B981']]} /></Card>
          </div>
          <Card title="Employees">
            <Table rows={d.headcount.rows} columns={[['Name', r => r.name], ['Department', r => r.department], ['Job title', r => r.job_title], [labels[profile], r => r[field]]]} />
          </Card>
        </>
      )}
    </ReportFrame>
  );
}
