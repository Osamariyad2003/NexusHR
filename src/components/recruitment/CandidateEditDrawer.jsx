import React from 'react';
import RecordDrawer from '../common/RecordDrawer';

/** Edit a candidate's details, interview time and notes. */
export default function CandidateEditDrawer({ candidate, jobs, sources = [], onClose, onSave }) {
  const toLocalInput = (iso) => (iso ? new Date(new Date(iso).getTime() - new Date(iso).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');
  const fields = [
    { name: 'first_name', label: 'First name', required: true },
    { name: 'last_name', label: 'Last name', required: true },
    { name: 'email', label: 'Email', type: 'email', required: true },
    { name: 'phone', label: 'Phone', type: 'tel' },
    { name: 'job_id', label: 'Job', type: 'select', required: true, options: jobs.map(j => ({ value: j.id, label: j.title })) },
    { name: 'source', label: 'Source', type: 'select', options: sources.map(s => ({ value: s.title, label: s.title })), placeholder: 'Unknown' },
    { name: 'interview_at', label: 'Interview date and time', type: 'datetime-local' },
    { name: 'notes', label: 'Notes', type: 'textarea' }
  ];
  return (
    <RecordDrawer
      isOpen={Boolean(candidate)}
      title="Edit Candidate"
      fields={fields}
      initial={candidate ? { ...candidate, interview_at: toLocalInput(candidate.interview_at) } : {}}
      onClose={onClose}
      onSubmit={(v) => onSave({
        ...v,
        phone: v.phone || null,
        source: v.source || null,
        interview_at: v.interview_at ? new Date(v.interview_at).toISOString() : null
      })}
    />
  );
}
