export const AUDIENCE_LABELS = { ALL: 'Everyone', MANAGERS: 'Managers only', HR: 'HR only' };

export const newsDate = (item) => {
  const iso = item.published_at || item.created_at;
  return iso ? new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
};
