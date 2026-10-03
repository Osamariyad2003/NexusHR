import React from 'react';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';
import RecordDrawer from '../common/RecordDrawer';
import { EMPLOYMENT_TYPES } from './shared';

/** Create or edit a job posting. `onSave(payload)` returns a promise (errors stay in the drawer). */
export const CreateJobModal = ({ isOpen, job, onClose, onSave }) => {
  const { employees, departments } = useApp();
  const { rows: offices } = useResource('offices', { quiet: true });

  const fields = [
    { name: 'title', label: 'Job title', required: true, placeholder: 'e.g. Senior Product Designer' },
    { name: 'employment_type', label: 'Employment type', type: 'select', required: true, options: EMPLOYMENT_TYPES },
    { name: 'department_id', label: 'Department', type: 'select', options: departments.map(d => ({ value: d.id, label: d.name })), placeholder: 'No department' },
    { name: 'office_id', label: 'Office', type: 'select', options: offices.map(o => ({ value: o.id, label: o.name })), placeholder: 'No office' },
    { name: 'location', label: 'Location note', placeholder: 'e.g. Hybrid, 3 days in office' },
    { name: 'openings', label: 'Number of openings', type: 'number', required: true },
    { name: 'closing_date', label: 'Expected closing date', type: 'date' },
    { name: 'salary_range', label: 'Salary range', placeholder: 'e.g. $90,000 - $110,000' },
    { name: 'description', label: 'Job description', type: 'textarea' },
    {
      name: 'hiring_team', label: 'Hiring team', type: 'multiselect',
      options: employees.filter(e => e.status !== 'TERMINATED' && e.role !== 'EMPLOYEE').map(e => ({ value: e.id, label: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name }))
    }
  ];

  const initial = job?.id ? job : { employment_type: 'FULL_TIME', openings: 1, hiring_team: [] };

  return (
    <RecordDrawer
      isOpen={isOpen}
      title={job?.id ? 'Edit Job' : 'Create New Job'}
      submitLabel={job?.id ? 'Save' : 'Publish job'}
      fields={fields}
      initial={initial}
      onClose={onClose}
      onSubmit={(values) => onSave({
        ...values,
        openings: Number(values.openings) || 1,
        department_id: values.department_id || null,
        office_id: values.office_id || null,
        closing_date: values.closing_date || null
      })}
    />
  );
};
