import React, { useCallback, useEffect, useState } from 'react';
import { X, FileText, Trash2, Upload, Mail, Phone } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { RATINGS, stageClass, formatDate, timeAgo, fillTemplate, initials } from './shared';

const inputClass = 'w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500';
const TABS = [['profile', 'Profile'], ['email', 'Email'], ['evaluation', 'Evaluation'], ['comments', 'Comments'], ['activity', 'Activity']];

/**
 * One candidate: profile and CV files, email (saved to the record; delivery isn't set up), evaluations,
 * comments and the activity history. Every change is saved on the server; `onChanged` refreshes lists.
 */
export const CandidateDetailDrawer = ({ candidate: initial, stages, templates = [], onClose, onChanged, act }) => {
  const { showToast, currentUser } = useApp();
  const [candidate, setCandidate] = useState(initial);
  const [tab, setTab] = useState('profile');
  const [files, setFiles] = useState([]);
  const [busy, setBusy] = useState(false);
  const [rating, setRating] = useState('');
  const [evalComment, setEvalComment] = useState('');
  const [commentText, setCommentText] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const loadFiles = useCallback(() => api.listFiles('candidate', initial.id).then(setFiles, () => setFiles([])), [initial.id]);

  useEffect(() => {
    setCandidate(initial);
    loadFiles();
    const mine = (initial.evaluations || []).find(e => e.by_id === currentUser?.id);
    setRating(mine?.rating || '');
    setEvalComment(mine?.comment || '');
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial.id]);

  const run = async (action, payload, after) => {
    setBusy(true);
    try {
      const updated = await act(candidate, action, payload);
      if (updated) setCandidate(updated);
      after?.();
      onChanged?.();
    } catch { /* toast already shown */ } finally {
      setBusy(false);
    }
  };

  const pickTemplate = (id) => {
    setTemplateId(id);
    const t = templates.find(x => x.id === id);
    if (t) { setSubject(fillTemplate(t.subject, candidate)); setBody(fillTemplate(t.body, candidate)); }
  };

  const uploadCv = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const res = await api.uploadFile('candidate', candidate.id, file);
      showToast(res.message, 'success');
      await loadFiles();
      onChanged?.();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const removeFile = async (f) => {
    if (!window.confirm(`Delete "${f.name}"?`)) return;
    try {
      const res = await api.deleteFile(f.id);
      showToast(res.message, 'success');
      await loadFiles();
      onChanged?.();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label={candidate.name}>
      <div className="absolute inset-0" onClick={onClose} />
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-xl bg-white shadow-2xl flex flex-col font-sans">
          <div className="p-6 border-b border-slate-100 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-800 font-black flex items-center justify-center">{initials(candidate.name)}</div>
                <div>
                  <h2 className="text-lg font-black text-slate-900">{candidate.name}</h2>
                  <p className="text-xs text-slate-500">{candidate.job_title} · applied {formatDate(candidate.applied_date)}</p>
                </div>
              </div>
              <button type="button" onClick={onClose} aria-label="Close" className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Stage</span>
              <select value={candidate.stage} disabled={busy} aria-label="Move to stage"
                onChange={(e) => run('move', { stage: e.target.value })}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border-0 focus:outline-none focus:ring-2 focus:ring-emerald-500 ${stageClass(candidate.stage, stages)}`}>
                {stages.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
              </select>
              {candidate.average_rating && <span className="text-xs font-bold text-amber-600 ml-auto">★ {candidate.average_rating} average</span>}
            </div>
            <div className="flex gap-1 border-b border-slate-100 -mb-4">
              {TABS.map(([id, label]) => (
                <button key={id} type="button" onClick={() => setTab(id)}
                  className={`px-3 py-2 text-xs font-bold border-b-2 -mb-px ${tab === id ? 'border-emerald-500 text-slate-900' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
            {tab === 'profile' && (
              <>
                <div className="space-y-2">
                  <p className="flex items-center gap-2 text-slate-700"><Mail className="w-4 h-4 text-slate-400" />{candidate.email}</p>
                  <p className="flex items-center gap-2 text-slate-700"><Phone className="w-4 h-4 text-slate-400" />{candidate.phone || '—'}</p>
                  <p className="text-slate-500">Source: <span className="font-bold text-slate-700">{candidate.source || 'Unknown'}</span></p>
                  {candidate.interview_at && <p className="text-slate-500">Interview: <span className="font-bold text-slate-700">{new Date(candidate.interview_at).toLocaleString()}</span></p>}
                </div>
                {candidate.cover_letter && (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">Cover letter</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{candidate.cover_letter}</p>
                  </div>
                )}
                {candidate.notes && (
                  <div className="space-y-1">
                    <p className="font-bold text-slate-700">Notes</p>
                    <p className="text-slate-600 whitespace-pre-wrap">{candidate.notes}</p>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-slate-700">CV & files</p>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 font-bold text-slate-700 cursor-pointer hover:bg-slate-50">
                      <Upload className="w-3.5 h-3.5" /> Upload
                      <input type="file" className="hidden" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" aria-label="Upload a file" disabled={busy}
                        onChange={(e) => { uploadCv(e.target.files?.[0]); e.target.value = ''; }} />
                    </label>
                  </div>
                  {files.length === 0 && <p className="text-slate-400">No files yet.</p>}
                  {files.map(f => (
                    <div key={f.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-200">
                      <button type="button" onClick={() => api.downloadFile(f.id, f.name).catch(err => showToast(err.message, 'error'))}
                        className="flex items-center gap-2 font-semibold text-slate-700 hover:text-emerald-600">
                        <FileText className="w-4 h-4 text-slate-400" />{f.name}
                        <span className="text-slate-400 font-normal">({Math.ceil(f.size / 1024)} KB)</span>
                      </button>
                      <button type="button" onClick={() => removeFile(f)} title={`Delete ${f.name}`} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {tab === 'email' && (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); run('email', { subject, body }, () => { setSubject(''); setBody(''); setTemplateId(''); }); }}>
                <p className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                  Email delivery isn't set up yet. Messages are saved to this candidate's history but not sent.
                </p>
                <div className="space-y-1.5">
                  <label htmlFor="mail-template" className="font-bold text-slate-700 block">Template</label>
                  <select id="mail-template" value={templateId} onChange={(e) => pickTemplate(e.target.value)} className={inputClass}>
                    <option value="">No template</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="mail-subject" className="font-bold text-slate-700 block">Subject</label>
                  <input id="mail-subject" required value={subject} onChange={(e) => setSubject(e.target.value)} className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="mail-body" className="font-bold text-slate-700 block">Message</label>
                  <textarea id="mail-body" required rows={8} value={body} onChange={(e) => setBody(e.target.value)} className={`${inputClass} resize-none font-medium`} />
                </div>
                <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold disabled:opacity-60">Save to history</button>
                {(candidate.emails || []).slice().reverse().map(m => (
                  <div key={m.id} className="p-3 rounded-xl border border-slate-200 space-y-1">
                    <p className="font-bold text-slate-800">{m.subject}</p>
                    <p className="text-slate-400">{m.by} · {timeAgo(m.at)} · {m.delivered ? 'sent' : 'not sent'}</p>
                  </div>
                ))}
              </form>
            )}

            {tab === 'evaluation' && (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (rating) run('evaluate', { rating, comment: evalComment }); }}>
                <p className="font-bold text-slate-700">Your evaluation</p>
                <div className="flex gap-2">
                  {RATINGS.map(r => (
                    <button key={r.value} type="button" onClick={() => setRating(r.value)} aria-pressed={rating === r.value}
                      className={`flex-1 p-2 rounded-xl border text-center ${rating === r.value ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                      <div className="text-xl">{r.emoji}</div>
                      <div className="text-[10px] font-bold text-slate-600">{r.value}</div>
                    </button>
                  ))}
                </div>
                <textarea rows={3} value={evalComment} onChange={(e) => setEvalComment(e.target.value)} placeholder="Why? (optional)" aria-label="Evaluation comment" className={`${inputClass} resize-none font-medium`} />
                <button type="submit" disabled={!rating || busy} className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold disabled:opacity-60">Submit evaluation</button>
                <div className="space-y-2 pt-2">
                  {(candidate.evaluations || []).map(ev => (
                    <div key={ev.id} className="p-3 rounded-xl border border-slate-200">
                      <p className="font-bold text-slate-800">{RATINGS.find(r => r.value === ev.rating)?.emoji} {ev.rating} · {ev.by}</p>
                      {ev.comment && <p className="text-slate-600 mt-1">{ev.comment}</p>}
                      <p className="text-slate-400 mt-1">{timeAgo(ev.at)}</p>
                    </div>
                  ))}
                  {!(candidate.evaluations || []).length && <p className="text-slate-400">No evaluations yet.</p>}
                </div>
              </form>
            )}

            {tab === 'comments' && (
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (commentText.trim()) run('comment', { text: commentText }, () => setCommentText('')); }}>
                <textarea rows={3} value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment for the hiring team" aria-label="Comment" className={`${inputClass} resize-none font-medium`} />
                <button type="submit" disabled={!commentText.trim() || busy} className="px-5 py-2.5 rounded-2xl bg-slate-900 text-white font-bold disabled:opacity-60">Add comment</button>
                {(candidate.comments || []).slice().reverse().map(c => (
                  <div key={c.id} className="p-3 rounded-xl border border-slate-200">
                    <p className="text-slate-700 whitespace-pre-wrap">{c.text}</p>
                    <p className="text-slate-400 mt-1">{c.by} · {timeAgo(c.at)}</p>
                  </div>
                ))}
                {!(candidate.comments || []).length && <p className="text-slate-400">No comments yet.</p>}
              </form>
            )}

            {tab === 'activity' && (
              <ol className="space-y-3">
                {(candidate.activity || []).slice().reverse().map(a => (
                  <li key={a.id} className="flex gap-3">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-slate-700">{a.text}</p>
                      <p className="text-slate-400">{a.by} · {timeAgo(a.at)}</p>
                    </div>
                  </li>
                ))}
                {!(candidate.activity || []).length && <p className="text-slate-400">No activity yet.</p>}
              </ol>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
