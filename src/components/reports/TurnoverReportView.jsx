import React from 'react';
import { ReportFrame, useReports, Card, Stat, Bars, Table, monthLabel } from './ReportParts';

/** Turnover: leavers over average headcount, per month and for the last 12 months. */
export default function TurnoverReportView({ onBack }) {
  const reports = useReports();
  return (
    <ReportFrame title="Employee Turnover Rate" subtitle="leavers ÷ average headcount" onBack={onBack} reports={reports}
      csv={{ name: 'turnover', rows: (d) => d.turnover.monthly, columns: [['Month', r => r.month], ['Headcount', r => r.headcount], ['Joined', r => r.joined], ['Left', r => r.left], ['Turnover %', r => r.turnover_pct]] }}>
      {(d) => (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Stat label="Turnover, last 12 months" value={`${d.turnover.annual_pct}%`} />
            <Stat label="Retention" value={`${d.turnover.retention_pct}%`} />
            <Stat label="Leavers, last 12 months" value={d.movements.left_last_12_months} />
          </div>
          <Card title="Monthly turnover (%)">
            <Bars data={d.turnover.monthly.map(m => ({ ...m, name: monthLabel(m.month) }))} bars={[['turnover_pct', 'Turnover %', '#6366F1']]} />
          </Card>
          <Card title="By month">
            <Table rows={[...d.turnover.monthly].reverse()} columns={[['Month', r => monthLabel(r.month)], ['Headcount at month end', r => r.headcount], ['Joined', r => r.joined], ['Left', r => r.left], ['Turnover', r => `${r.turnover_pct}%`]]} />
          </Card>
        </>
      )}
    </ReportFrame>
  );
}
