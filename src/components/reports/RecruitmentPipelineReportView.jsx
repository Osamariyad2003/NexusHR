import React from 'react';
import { ReportFrame, useReports, Card, Stat, Bars, Donut, Table, toPairs } from './ReportParts';

/** Candidates per stage, source and job, from the recruitment records. */
export default function RecruitmentPipelineReportView({ onBack }) {
  const reports = useReports();
  return (
    <ReportFrame title="Recruitment Pipeline" subtitle="all candidates" onBack={onBack} reports={reports}
      csv={{ name: 'recruitment-pipeline', rows: (d) => d.recruitment.by_job, columns: [['Job', r => r.title], ['Status', r => r.status], ['Applicants', r => r.applicants], ['Hired', r => r.hired]] }}>
      {(d) => (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Stat label="Candidates" value={d.recruitment.total} />
            <Stat label="Hired" value={d.recruitment.by_stage.Hired || 0} />
            <Stat label="Open jobs" value={d.recruitment.by_job.filter(j => j.status === 'ACTIVE').length} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Candidates per stage"><Bars data={Object.entries(d.recruitment.by_stage).map(([name, value]) => ({ name, value }))} bars={[['value', 'Candidates', '#6366F1']]} /></Card>
            <Card title="Where candidates come from"><Donut data={toPairs(d.recruitment.by_source)} /></Card>
          </div>
          <Card title="Jobs">
            <Table rows={d.recruitment.by_job} columns={[['Job', r => r.title], ['Status', r => r.status[0] + r.status.slice(1).toLowerCase()], ['Applicants', r => r.applicants], ['Hired', r => r.hired]]} />
          </Card>
        </>
      )}
    </ReportFrame>
  );
}
