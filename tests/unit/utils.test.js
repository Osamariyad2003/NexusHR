// Frontend unit tests for pure utilities. Run: npm test (Node's built-in runner, no extra deps).
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { SHORTCUTS, matchShortcut } from '../../src/utils/shortcutDefinitions.js';
import { downloadCsv, downloadRowsCsv, parseCsv } from '../../src/utils/csv.js';

// ---- CSV export: capture what would be downloaded -------------------------------------------
let downloads;
beforeEach(() => {
  downloads = [];
  globalThis.Blob = class { constructor(parts) { this.text = parts.join(''); } };
  globalThis.URL.createObjectURL = (blob) => { downloads.push({ blob }); return 'blob:test'; };
  globalThis.URL.revokeObjectURL = () => {};
  globalThis.document = {
    createElement: () => ({ click() {}, remove() {} }),
    body: { appendChild: (link) => { downloads.at(-1).filename = link.download; } }
  };
});
const csvLines = () => downloads.at(-1).blob.text.replace(/^﻿/, '').split('\r\n');

test('FE-U01 [P0] CSV cells that start with = + - @ are neutralised (spreadsheet formula injection)', () => {
  downloadCsv('x.csv', [{ v: '=HYPERLINK("http://evil","click")' }, { v: '+1+1' }, { v: '-2+3' }, { v: '@SUM(A1)' }], [{ header: 'V', value: (r) => r.v }]);
  const [, ...cells] = csvLines();
  for (const cell of cells) assert.match(cell, /^"?'/, `unguarded cell: ${cell}`);
});

test('FE-U02 [P1] CSV quotes commas, quotes and newlines, and starts with a UTF-8 BOM', () => {
  downloadCsv('x.csv', [{ v: 'Doe, "Jane"\nHR' }], [{ header: 'Name', value: (r) => r.v }]);
  const text = downloads.at(-1).blob.text;
  assert.ok(text.startsWith('﻿'));
  assert.ok(text.includes('"Doe, ""Jane""\nHR"'));
});

test('FE-U03 [P2] row export leaves out images/colours and serialises nested objects', () => {
  downloadRowsCsv('report', [{ name: 'A', avatar: 'http://img', color: '#fff', stats: { a: 1 } }]);
  const [header, row] = csvLines();
  assert.equal(header, 'Name,Stats');
  assert.equal(row, 'A,"{""a"":1}"');
  assert.match(downloads.at(-1).filename, /^report-\d{4}-\d{2}-\d{2}\.csv$/);
});

test('FE-U04 [P2] empty and null values export as empty cells, not "undefined"/"null"', () => {
  downloadCsv('x.csv', [{ a: null, b: undefined }], [{ header: 'A', value: (r) => r.a }, { header: 'B', value: (r) => r.b }]);
  assert.equal(csvLines()[1], ',');
});

// ---- Keyboard shortcuts ------------------------------------------------------------------------
const ev = (code, { alt = true, shift = true, ctrl = false, meta = false, repeat = false } = {}) =>
  ({ code, altKey: alt, shiftKey: shift, ctrlKey: ctrl, metaKey: meta, repeat });

test('FE-U05 [P1] every documented shortcut matches its physical key (Windows Alt / macOS Option)', () => {
  for (const s of SHORTCUTS) {
    for (const code of s.codes) assert.equal(matchShortcut(ev(code, { shift: s.shift }))?.id, s.id, `${s.win} (${code})`);
  }
});

test('FE-U06 [P1] shortcuts never fire while typing, with AltGr (Ctrl+Alt), Cmd, or key repeat', () => {
  assert.equal(matchShortcut(ev('KeyP', { alt: false })), null, 'Shift+P while typing');
  assert.equal(matchShortcut(ev('KeyP', { ctrl: true })), null, 'AltGr / Ctrl+Alt');
  assert.equal(matchShortcut(ev('KeyP', { meta: true })), null, 'Cmd');
  assert.equal(matchShortcut(ev('KeyP', { repeat: true })), null, 'held key');
  assert.equal(matchShortcut(ev('KeyW', { shift: false })), null, 'Alt+W without Shift');
});

test('FE-U07 [P2] shortcut table has no duplicate key bindings', () => {
  const bindings = SHORTCUTS.flatMap((s) => s.codes.map((c) => `${s.shift}:${c}`));
  assert.equal(new Set(bindings).size, bindings.length);
});

test('FE-U08 [P1] CSV import parses quotes, embedded commas/newlines, CRLF and a BOM', () => {
  const text = '﻿First_Name,Last_Name,Email,Source\r\n"Ana","O""Neil","ana@x.io","Referral, internal"\r\nBo,"Multi\nLine",bo@x.io,\r\n\r\n';
  const rows = parseCsv(text);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { first_name: 'Ana', last_name: 'O"Neil', email: 'ana@x.io', source: 'Referral, internal' });
  assert.equal(rows[1].last_name, 'Multi\nLine');
  assert.equal(rows[1].source, '');
});

test('FE-U09 [P2] CSV import of an empty file or header-only file returns no rows', () => {
  assert.deepEqual(parseCsv(''), []);
  assert.deepEqual(parseCsv('first_name,last_name,email\n'), []);
});
