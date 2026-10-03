// Client-side CSV export of what a screen is showing.

// Spreadsheet apps execute cells starting with = + - @ (CSV injection); prefix them with a quote
const safeCell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  const guarded = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
};

/**
 * Downloads rows as a CSV file.
 * columns: [{ header: 'Name', value: (row) => row.name }]
 */
export function downloadCsv(filename, rows, columns) {
  const lines = [
    columns.map((c) => safeCell(c.header)).join(','),
    ...rows.map((row) => columns.map((c) => safeCell(c.value(row))).join(','))
  ];
  // BOM so Excel opens UTF-8 names correctly
  const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = Object.assign(document.createElement('a'), { href: url, download: filename });
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export const todayStamp = () => new Date().toISOString().slice(0, 10);

// Exports a table's rows using their own fields as columns (images and colours left out)
export function downloadRowsCsv(name, rows) {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))]
    .filter((key) => !/avatar|image|img|photo|color|colour|initials/i.test(key));
  const header = (key) => key.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^\w/, (c) => c.toUpperCase());
  downloadCsv(`${name}-${todayStamp()}.csv`, rows, keys.map((key) => ({
    header: header(key),
    value: (row) => (row[key] !== null && typeof row[key] === 'object' ? JSON.stringify(row[key]) : row[key])
  })));
}

/**
 * Parses CSV text (RFC 4180: quoted fields, "" escapes, commas and line breaks inside quotes,
 * CRLF, a leading BOM) into objects keyed by the header row (lower-cased, trimmed).
 * Blank lines are skipped; values are trimmed.
 */
export function parseCsv(text) {
  const src = String(text || '').replace(/^﻿/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else if (ch === '"' && field === '') {
      quoted = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some(v => v.trim() !== '')) rows.push(row);
  if (!rows.length) return [];
  const header = rows[0].map(h => h.trim().toLowerCase());
  return rows.slice(1).map(r => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? '').trim()])));
}
