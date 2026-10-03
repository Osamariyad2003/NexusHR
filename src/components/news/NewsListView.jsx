import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Pin } from 'lucide-react';
import LoadState from '../common/LoadState';
import { AUDIENCE_LABELS, newsDate } from './shared';

export default function NewsListView({ newsList, loading, error, onRetry, canWrite, onSelectNews, onEditNews, onCreateNews, onDeleteNews }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const q = search.trim().toLowerCase();
  const filtered = newsList.filter(n =>
    (statusFilter === 'ALL' || n.status === statusFilter) &&
    (!q || `${n.title} ${n.content} ${n.category || ''}`.toLowerCase().includes(q)));

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Latest News</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{filtered.length} post(s)</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {canWrite && (
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status"
              className="px-3 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold">
              <option value="ALL">All posts</option><option value="PUBLISHED">Published</option><option value="DRAFT">Drafts</option>
            </select>
          )}
          <div className="relative w-56">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search news"
              className="w-full pl-4 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          {canWrite && (
            <button type="button" onClick={onCreateNews} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md">
              <Plus className="w-4 h-4" /><span>Write news</span>
            </button>
          )}
        </div>
      </div>

      <LoadState loading={loading} error={error} onRetry={onRetry} empty={!filtered.length} emptyText={newsList.length ? 'No posts match.' : 'No news yet.'}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((item) => (
            <div key={item.id} role="button" tabIndex={0} onClick={() => onSelectNews(item)} onKeyDown={(e) => e.key === 'Enter' && onSelectNews(item)}
              className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {item.pinned && <Pin className="w-3.5 h-3.5 text-emerald-600" aria-label="Pinned" />}
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${item.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{item.status === 'PUBLISHED' ? 'Published' : 'Draft'}</span>
                  {item.category && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{item.category}</span>}
                  {item.audience !== 'ALL' && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-100 text-violet-700">{AUDIENCE_LABELS[item.audience]}</span>}
                </div>
                {canWrite && (
                  <div className="flex gap-1.5 shrink-0">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onEditNews(item); }} title={`Edit ${item.title}`} className="p-1.5 rounded-lg bg-blue-600 text-white"><Edit2 className="w-3 h-3" /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteNews(item); }} title={`Delete ${item.title}`} className="p-1.5 rounded-lg bg-rose-500 text-white"><Trash2 className="w-3 h-3" /></button>
                  </div>
                )}
              </div>
              <h3 className="text-base font-black text-slate-900">{item.title}</h3>
              <p className="text-xs text-slate-500 line-clamp-2">{item.content}</p>
              <div className="flex items-center gap-2 pt-1">
                {item.author_avatar ? <img src={item.author_avatar} alt="" className="w-6 h-6 rounded-full object-cover" /> : <div className="w-6 h-6 rounded-full bg-slate-200" />}
                <span className="text-xs font-semibold text-slate-600">{item.author_name}</span>
                <span className="text-xs text-slate-400">· {newsDate(item)}</span>
              </div>
            </div>
          ))}
        </div>
      </LoadState>
    </div>
  );
}
