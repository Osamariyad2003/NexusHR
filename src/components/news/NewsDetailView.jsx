import React from 'react';
import { ChevronLeft, Edit2, Trash2 } from 'lucide-react';
import { AUDIENCE_LABELS, newsDate } from './shared';

export default function NewsDetailView({ news, canWrite, onBack, onEdit, onDelete }) {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <button type="button" onClick={onBack} className="hover:text-emerald-600 font-bold flex items-center gap-1"><ChevronLeft className="w-3.5 h-3.5" /><span>Latest News</span></button>
          <span>&gt;</span><span className="text-slate-900 font-black truncate max-w-xs">{news.title}</span>
        </div>
        {canWrite && (
          <div className="flex gap-2">
            <button type="button" onClick={() => onEdit(news)} className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-blue-600 text-white text-xs font-bold"><Edit2 className="w-3.5 h-3.5" />Edit</button>
            <button type="button" onClick={() => onDelete(news)} className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-rose-500 text-white text-xs font-bold"><Trash2 className="w-3.5 h-3.5" />Delete</button>
          </div>
        )}
      </div>
      <article className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-card space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${news.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{news.status === 'PUBLISHED' ? 'Published' : 'Draft'}</span>
          {news.category && <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">{news.category}</span>}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-100 text-violet-700">Shared with: {AUDIENCE_LABELS[news.audience] || 'Everyone'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900">{news.title}</h1>
        <div className="flex items-center gap-3">
          {news.author_avatar ? <img src={news.author_avatar} alt="" className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-slate-200" />}
          <div>
            <p className="text-sm font-bold text-slate-800">{news.author_name}</p>
            <p className="text-xs text-slate-400">{newsDate(news)}{news.updated_at ? ` · edited ${new Date(news.updated_at).toLocaleDateString()}` : ''}</p>
          </div>
        </div>
        <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{news.content}</div>
      </article>
    </div>
  );
}
