import React, { useState } from 'react';
import { JobListView } from './JobListView';
import { JobDetailView } from './JobDetailView';

export const RecruitmentManagerView = () => {
  const [selectedJob, setSelectedJob] = useState(null);

  if (selectedJob) {
    return (
      <JobDetailView
        job={selectedJob}
        onBack={() => setSelectedJob(null)}
      />
    );
  }

  return (
    <JobListView
      onSelectJob={(job) => setSelectedJob(job)}
    />
  );
};
