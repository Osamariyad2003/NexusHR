export const VISIBILITY_OPTIONS = [
  { value: 'ALL', label: 'Everyone', description: 'Every employee can see and download the files.' },
  { value: 'MANAGERS', label: 'Managers and HR', description: 'People managers and HR administrators only.' },
  { value: 'HR', label: 'HR only', description: 'HR administrators only.' }
];

export const formatSize = (bytes) => {
  if (!bytes) return '0 KB';
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

export const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—');
