// Labels and helpers shared by the recruitment screens

export const JOB_STATUS = {
  ACTIVE: { label: 'Active', className: 'bg-emerald-100 text-emerald-800' },
  INACTIVE: { label: 'Inactive', className: 'bg-rose-100 text-rose-700' },
  CLOSED: { label: 'Closed', className: 'bg-slate-100 text-slate-600' }
};

export const EMPLOYMENT_TYPES = [
  { value: 'FULL_TIME', label: 'Full-time' },
  { value: 'PART_TIME', label: 'Part-time' },
  { value: 'CONTRACTOR', label: 'Contractor' },
  { value: 'INTERNSHIP', label: 'Internship' }
];

export const RATINGS = [
  { value: 'Strong No', emoji: '😠' },
  { value: 'No', emoji: '🙁' },
  { value: 'Not Sure', emoji: '😐' },
  { value: 'Yes', emoji: '🙂' },
  { value: 'Excellent', emoji: '🤩' }
];

// Stage colours cycle through a fixed palette in pipeline order
const STAGE_COLOURS = ['bg-slate-100 text-slate-700', 'bg-sky-100 text-sky-800', 'bg-violet-100 text-violet-800', 'bg-amber-100 text-amber-800', 'bg-teal-100 text-teal-800', 'bg-indigo-100 text-indigo-800'];
export const stageClass = (stage, stages = []) => {
  if (stage === 'Hired') return 'bg-emerald-100 text-emerald-800';
  if (stage === 'Rejected') return 'bg-rose-100 text-rose-700';
  const i = stages.findIndex(s => s.name === stage);
  return STAGE_COLOURS[(i < 0 ? 0 : i) % STAGE_COLOURS.length];
};

export const timeAgo = (iso) => {
  if (!iso) return '';
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
};

export const formatDate = (iso) => (iso ? new Date(iso.length === 10 ? `${iso}T00:00:00` : iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

// Fills {{first_name}} / {{job_title}} placeholders in email templates
export const fillTemplate = (text, candidate) => String(text || '')
  .replaceAll('{{first_name}}', candidate?.first_name || '')
  .replaceAll('{{last_name}}', candidate?.last_name || '')
  .replaceAll('{{job_title}}', candidate?.job_title || '');

export const initials = (name) => String(name || '?').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
