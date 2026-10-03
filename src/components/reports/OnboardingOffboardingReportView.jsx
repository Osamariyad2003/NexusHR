import React from 'react';
import { ReportFrame, useReports, Card, Stat, Bars, Table, monthLabel } from './ReportParts';

const fmt = (iso) => (iso ? new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

/** Joiners (by join date) or leavers (by last working day) per month, last 12 months. */
export default function OnboardingOffboardingReportView({ type = 'onboarding', onBack }) {
  const reports = useReports();
  const off = type === 'offboarding';
  const list = (d) => (off ? d.movements.leavers : d.movements.joiners);
  const columns = [['Name', r => r.name], ['Department', r => r.department], ['Job title', r => r.job_title], ['Type', r => r.type], [off ? 'Last working day' : 'Join date', r => fmt(off ? r.terminated_on : r.join_date)]];

  return (
    <ReportFrame title={off ? 'Offboarding' : 'Onboarding'} subtitle="last 12 months" onBack={onBack} reports={reports}
      csv={{ name: type, rows: list, columns: columns.map(([h, f]) => [h, r => (h.includes('day') || h.includes('date') ? (off ? r.terminated_on : r.join_date) : f(r))]) }}>
      {(d) => (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Stat label={off ? 'Left in the last 12 months' : 'Joined in the last 12 months'} value={off ? d.movements.left_last_12_months : d.movements.joined_last_12_months} />
            <Stat label="Current headcount" value={d.headcount.total} />
          </div>
          <Card title={off ? 'Leavers per month' : 'Joiners per month'}>
            <Bars data={d.movements.monthly.map(m => ({ ...m, name: monthLabel(m.month) }))} bars={[[off ? 'left' : 'joined', off ? 'Left' : 'Joined', off ? '#EC4899' : '#10B981']]} />
          </Card>
          <Card title={off ? 'Leavers' : 'Joiners'}>
            <Table rows={list(d)} columns={columns} empty={off ? 'Nobody left in the last 12 months.' : 'Nobody joined in the last 12 months.'} />
          </Card>
        </>
      )}
    </ReportFrame>
  );
}
