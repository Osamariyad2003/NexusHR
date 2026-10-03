import React, { useEffect, useState } from 'react';
import { ChevronLeft } from 'lucide-react';
import { AUDIENCE_LABELS } from './shared';

const inputClass = 'w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500';

/** Write or edit a post. Publish makes it visible to its audience; Save as draft keeps it HR-only. */
export default function NewsFormView({ initialNews, onBack, onSave }) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [audience, setAudience] = useState('ALL');
  const [pinned, setPinned] = useState(false);
  const [saving, setSaving] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(initialNews?.title || '');
    setContent(initialNews?.content || '');
    setCategory(initialNews?.category || '');
    setAudience(initialNews?.audience || 'ALL');
    setPinned(Boolean(initialNews?.pinned));
  }, [initialNews]);

  const submit = async (status) => {
    setSaving(status);
    setError('');
    try {
      await onSave({ title, content, category: category || null, audience, pinned, status });
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(null);
    }
  };

  const published = initialNews?.status === 'PUBLISHED';

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <button type="button" onClick={onBack} className="hover:text-emerald-600 font-bold flex items-center gap-1"><ChevronLeft className="w-3.5 h-3.5" /><span>Latest News</span></button>
        <span>&gt;</span><span className="text-slate-900 font-black">{initialNews?.id ? 'Edit post' : 'New post'}</span>
      </div>
      <form onSubmit={(e) => { e.preventDefault(); submit('PUBLISHED'); }} className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card space-y-5">
        {error && <div className="px-4 py-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">{error}</div>}
        <div className="space-y-1.5">
          <label htmlFor="news-title" className="text-xs font-bold text-slate-700 block">Title <span className="text-rose-500">*</span></label>
          <input id="news-title" required value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="news-audience" className="text-xs font-bold text-slate-700 block">Share with</label>
            <select id="news-audience" value={audience} onChange={(e) => setAudience(e.target.value)} className={inputClass}>
              {Object.entries(AUDIENCE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="news-category" className="text-xs font-bold text-slate-700 block">Category</label>
            <input id="news-category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Company, Benefits" className={inputClass} />
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-slate-700 sm:pt-7">
            <input type="checkbox" checked={pinned} onChange={(e) => setPinned(e.target.checked)} className="w-4 h-4 accent-emerald-500" />Pin to the top
          </label>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="news-content" className="text-xs font-bold text-slate-700 block">Content <span className="text-rose-500">*</span></label>
          <textarea id="news-content" required rows={14} value={content} onChange={(e) => setContent(e.target.value)} className={`${inputClass} resize-y font-medium leading-relaxed`} />
        </div>
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
          <button type="button" onClick={onBack} className="px-5 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700">Cancel</button>
          {!published && (
            <button type="button" disabled={Boolean(saving)} onClick={() => { if (title.trim() && content.trim()) submit('DRAFT'); else setError('A title and content are needed, even for a draft.'); }}
              className="px-5 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold text-slate-800 disabled:opacity-60">{saving === 'DRAFT' ? 'Saving…' : 'Save as draft'}</button>
          )}
          <button type="submit" disabled={Boolean(saving)} className="px-6 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold disabled:opacity-60">
            {saving === 'PUBLISHED' ? 'Publishing…' : published ? 'Save changes' : 'Publish'}
          </button>
        </div>
      </form>
    </div>
  );
}
