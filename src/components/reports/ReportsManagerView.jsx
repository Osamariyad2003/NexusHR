import React, { useState } from 'react';
import ReportsHubView from './ReportsHubView';
import EmployeeDataReportsView from './EmployeeDataReportsView';
import TurnoverReportView from './TurnoverReportView';
import HeadcountReportView from './HeadcountReportView';
import OnboardingOffboardingReportView from './OnboardingOffboardingReportView';
import TimeOffReportView from './TimeOffReportView';
import RecruitmentPipelineReportView from './RecruitmentPipelineReportView';

export default function ReportsManagerView() {
  const [activeReportId, setActiveReportId] = useState('hub');

  const handleSelectReport = (reportId) => {
    setActiveReportId(reportId);
  };

  const handleBackToHub = () => {
    setActiveReportId('hub');
  };

  switch (activeReportId) {
    case 'hub':
      return <ReportsHubView onSelectReport={handleSelectReport} />;

    case 'headcount':
      return <HeadcountReportView onBack={handleBackToHub} />;

    case 'onboarding':
      return <OnboardingOffboardingReportView type="onboarding" onBack={handleBackToHub} />;

    case 'offboarding':
      return <OnboardingOffboardingReportView type="offboarding" onBack={handleBackToHub} />;

    case 'time-off-balance':
      return <TimeOffReportView variant="balance" onBack={handleBackToHub} />;

    case 'time-off-schedule':
      return <TimeOffReportView variant="schedule" onBack={handleBackToHub} />;

    case 'employee-data':
      return <EmployeeDataReportsView onBack={handleBackToHub} />;

    case 'turnover-rate':
      return <TurnoverReportView onBack={handleBackToHub} />;

    case 'recruitment-pipeline':
      return <RecruitmentPipelineReportView onBack={handleBackToHub} />;

    default:
      return <ReportsHubView onSelectReport={handleSelectReport} />;
  }
}
