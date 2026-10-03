import React, { useState } from 'react';
import { ReportFrame, useReports, Card, Table, Filter } from './ReportParts';

const fmt = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** Balances left per employee and type (variant "balance"), or upcoming approved/pending leave ("schedule"). */
export default function TimeOffReportView({ variant = 'balance', onBack }) {
  const reports = useReports();
  const [dept, setDept] = useState('ALL');
  const schedule = variant === 'schedule';

  if (schedule) {
    const rows = (d) => d.time_off.schedule.filter(r => dept === 'ALL' || r.department === dept);
    return (
      <ReportFrame title="Time Off Schedule" subtitle="upcoming approved and pending leave" onBack={onBack} reports={reports}
        csv={{ name: 'time-off-schedule', rows, columns: [['Name', r => r.name], ['Department', r => r.department], ['Type', r => r.type], ['From', r => r.from], ['To', r => r.to], ['Days', r => r.days], ['Status', r => r.status]] }}>
        {(d) => (
          <>
            <Filter label="Department" value={dept} onChange={setDept} options={[...new Set(d.time_off.schedule.map(r => r.department))]} />
            <Card>
              <Table rows={rows(d)} empty="No upcoming leave." columns={[['Name', r => r.name], ['Department', r => r.department], ['Type', r => r.type], ['From', r => fmt(r.from)], ['To', r => fmt(r.to)], ['Days', r => r.days], ['Status', r => r.status[0] + r.status.slice(1).toLowerCase()]]} />
            </Card>
          </>
        )}
      </ReportFrame>
    );
  }

  const rows = (d) => d.time_off.balances.filter(r => dept === 'ALL' || r.department === dept);
  return (
    <ReportFrame title="Time Off Balance" subtitle="days left per leave type" onBack={onBack} reports={reports}
      csv={{ name: 'time-off-balance', rows, columns: [['Name', r => r.name], ['Department', r => r.department], ...(reports.data?.time_off.types || []).map(t => [t.name, r => r.balances[t.code]]), ['Taken this year', r => r.taken_this_year]] }}>
      {(d) => (
        <>
          <Filter label="Department" value={dept} onChange={setDept} options={[...new Set(d.time_off.balances.map(r => r.department))]} />
          <Card>
            <Table rows={rows(d)} columns={[['Name', r => r.name], ['Department', r => r.department], ...d.time_off.types.map(t => [t.name, r => r.balances[t.code]]), ['Taken this year', r => r.taken_this_year]]} />
          </Card>
        </>
      )}
    </ReportFrame>
  );
}
