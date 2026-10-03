import React, { useEffect, useState } from 'react';
import { X, FileText, Upload } from 'lucide-react';
import { api } from '../../services/api';
import { parseCsv } from '../../utils/csv';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500';
const EMPTY = { first_name: '', last_name: '', email: '', phone: '', job_id: '', source: '', cover_letter: '' };

/**
 * Adds candidates: one at a time (with an optional CV upload) or many from a CSV file with the
 * columns first_name, last_name, email, phone, source. Calls onCreated() after saving.
 */
export const AddCandidateDrawer = ({ isOpen, onClose, onCreated, jobs, sources = [], defaultJobId = '', defaultMode = 'manual' }) => {
  const [mode, setMode] = useState(defaultMode);
  const [form, setForm] = useState(EMPTY);
  const [cvFile, setCvFile] = useState(null);
  const [csvRows, setCsvRows] = useState(null);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return undefined;
    setMode(defaultMode);
    setForm({ ...EMPTY, job_id: defaultJobId || jobs.find(j => j.status === 'ACTIVE')?.id || '' });
    setCvFile(null);
    setCsvRows(null);
    setReport(null);
    setError('');
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submitManual = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.createResource('candidates', { ...form, phone: form.phone || null, source: form.source || null });
      if (cvFile) {
        try {
          await api.uploadFile('candidate', res.data.id, cvFile);
        } catch (err) {
          // The candidate is saved; say exactly what didn't work
          setError(`${res.data.name} was added, but the CV upload failed: ${err.message}`);
          onCreated?.(res.data, res.message);
          return;
        }
      }
      onCreated?.(res.data, res.message);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const readCsv = async (file) => {
    setReport(null);
    setError('');
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length) throw new Error('The file has no rows.');
      const missing = ['first_name', 'last_name', 'email'].filter(c => !(c in rows[0]));
      if (missing.length) throw new Error(`Missing column(s): ${missing.join(', ')}. Expected: first_name, last_name, email, phone, source.`);
      setCsvRows(rows);
    } catch (err) {
      setCsvRows(null);
      setError(err.message);
    }
  };

  const submitImport = async (e) => {
    e.preventDefault();
    if (!csvRows || !form.job_id) return;
    setSaving(true);
    const results = [];
    for (const [i, row] of csvRows.entries()) {
      try {
        await api.createResource('candidates', {
          first_name: row.first_name, last_name: row.last_name, email: row.email,
          phone: row.phone || null, source: row.source || null, job_id: form.job_id
        });
        results.push({ row: i + 2, ok: true, name: `${row.first_name} ${row.last_name}` });
      } catch (err) {
        results.push({ row: i + 2, ok: false, name: `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email, message: err.message });
      }
    }
    setReport(results);
    setSaving(false);
    if (results.some(r => r.ok)) onCreated?.(null, `${results.filter(r => r.ok).length} of ${results.length} candidate(s) imported.`);
  };

  const jobOptions = jobs.filter(j => j.status !== 'CLOSED');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label="Add candidate">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg bg-white shadow-2xl flex flex-col font-sans">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-slate-900">{mode === 'manual' ? 'New Candidate' : 'Import Candidates'}</h2>
              <div className="flex items-center gap-3 pt-1">
                {[['manual', 'Add manually'], ['import', 'Import CSV']].map(([m, label]) => (
                  <button key={m} type="button" onClick={() => { setMode(m); setError(''); }}
                    className={`text-xs font-bold ${mode === m ? 'text-emerald-600 underline' : 'text-slate-400 hover:text-slate-600'}`}>{label}</button>
                ))}
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-5 h-5" /></button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto space-y-5">
            {error && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{error}</div>}

            <div className="space-y-1.5">
              <label htmlFor="cand-job" className="text-xs font-bold text-slate-700 block">Job <span className="text-rose-500">*</span></label>
              <select id="cand-job" required value={form.job_id} onChange={set('job_id')} className={inputClass}>
                <option value="" disabled>Select a job…</option>
                {jobOptions.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
            </div>

            {mode === 'manual' ? (
              <form id="candidate-form" onSubmit={submitManual} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="cand-first" className="text-xs font-bold text-slate-700 block">First name <span className="text-rose-500">*</span></label>
                    <input id="cand-first" required value={form.first_name} onChange={set('first_name')} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="cand-last" className="text-xs font-bold text-slate-700 block">Last name <span className="text-rose-500">*</span></label>
                    <input id="cand-last" required value={form.last_name} onChange={set('last_name')} className={inputClass} />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="cand-email" className="text-xs font-bold text-slate-700 block">Email <span className="text-rose-500">*</span></label>
                  <input id="cand-email" type="email" required value={form.email} onChange={set('email')} className={inputClass} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="cand-phone" className="text-xs font-bold text-slate-700 block">Phone</label>
                    <input id="cand-phone" type="tel" value={form.phone} onChange={set('phone')} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="cand-source" className="text-xs font-bold text-slate-700 block">Source</label>
                    <select id="cand-source" value={form.source} onChange={set('source')} className={inputClass}>
                      <option value="">Unknown</option>
                      {sources.map(s => <option key={s.id} value={s.title}>{s.title}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 block">CV</span>
                  <label className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-600 cursor-pointer hover:bg-slate-100">
                    <span>{cvFile ? cvFile.name : 'Choose a file'}</span>
                    <FileText className="w-4 h-4 text-slate-400" />
                    <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" className="hidden" aria-label="CV file"
                      onChange={(e) => setCvFile(e.target.files?.[0] || null)} />
                  </label>
                  <p className="text-[10px] text-slate-400">Max 5 MB. PDF, Word, PNG or JPEG.</p>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="cand-cover" className="text-xs font-bold text-slate-700 block">Cover letter</label>
                  <textarea id="cand-cover" rows={4} value={form.cover_letter} onChange={set('cover_letter')} className={`${inputClass} resize-none font-medium`} />
                </div>
              </form>
            ) : (
              <form id="candidate-form" onSubmit={submitImport} className="space-y-4">
                <label className="flex flex-col items-center justify-center gap-2 p-8 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-semibold text-slate-500 cursor-pointer hover:bg-slate-50">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span>Choose a CSV file</span>
                  <span className="text-[10px] text-slate-400">Columns: first_name, last_name, email, phone, source</span>
                  <input type="file" accept=".csv,text/csv" className="hidden" aria-label="CSV file" onChange={(e) => e.target.files?.[0] && readCsv(e.target.files[0])} />
                </label>
                {csvRows && !report && <p className="text-xs font-semibold text-slate-700">{csvRows.length} candidate(s) ready to import.</p>}
                {report && (
                  <div className="space-y-1 text-xs">
                    {report.map(r => (
                      <p key={r.row} className={r.ok ? 'text-emerald-700' : 'text-rose-700'}>
                        Row {r.row} · {r.name}: {r.ok ? 'imported' : r.message}
                      </p>
                    ))}
                  </div>
                )}
              </form>
            )}
          </div>

          <div className="p-6 border-t border-slate-100 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold">{report ? 'Close' : 'Cancel'}</button>
            {!report && (
              <button type="submit" form="candidate-form" disabled={saving || (mode === 'import' && !csvRows) || !form.job_id}
                className="px-6 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md disabled:opacity-60">
                {saving ? 'Saving…' : mode === 'manual' ? 'Add candidate' : 'Import'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
