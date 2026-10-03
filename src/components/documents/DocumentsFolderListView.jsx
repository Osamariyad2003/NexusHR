import React, { useState } from 'react';
import { Folder, Plus, Search, Share2, Trash2 } from 'lucide-react';
import LoadState from '../common/LoadState';
import { VISIBILITY_OPTIONS, formatSize, formatDate } from './shared';

export const DocumentsFolderListView = ({ folders, canEdit, onSelectFolder, onNewFolder, onShare }) => {
  const [search, setSearch] = useState('');
  const q = search.trim().toLowerCase();
  const list = folders.rows.filter(f => !q || `${f.name} ${f.description || ''}`.toLowerCase().includes(q));

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Documents</h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">{list.length} folder(s)</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-56 sm:w-72">
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search folders"
              className="w-full pl-4 pr-9 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          </div>
          {canEdit && <button type="button" onClick={onNewFolder} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-md"><Plus className="w-4 h-4" />New Folder</button>}
        </div>
      </div>

      <LoadState loading={folders.loading} error={folders.error} onRetry={folders.reload} empty={!list.length} emptyText={folders.rows.length ? 'No folders match.' : 'No folders yet.'}>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map(f => (
            <div key={f.id} role="button" tabIndex={0} onClick={() => onSelectFolder(f)} onKeyDown={(e) => e.key === 'Enter' && onSelectFolder(f)}
              className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all cursor-pointer space-y-3">
              <div className="flex items-start justify-between">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 flex items-center justify-center"><Folder className="w-5 h-5 text-emerald-600" /></div>
                {canEdit && (
                  <div className="flex gap-1.5">
                    <button type="button" onClick={(e) => { e.stopPropagation(); onShare(f); }} title={`Share ${f.name}`} className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"><Share2 className="w-3.5 h-3.5" /></button>
                    <button type="button" onClick={(e) => { e.stopPropagation(); if (window.confirm(`Delete "${f.name}" and its ${f.file_count} file(s)?`)) folders.remove(f.id).catch(() => {}); }} title={`Delete ${f.name}`} className="p-1.5 rounded-lg bg-rose-500 text-white"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">{f.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">{f.description || 'No description'}</p>
              </div>
              <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400">
                <span>{f.file_count} file(s) · {formatSize(f.total_size)}</span>
                <span>{f.last_upload_at ? `Updated ${formatDate(f.last_upload_at)}` : 'Empty'}</span>
              </div>
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-md bg-violet-50 text-violet-700">Visible to: {VISIBILITY_OPTIONS.find(o => o.value === f.visibility)?.label}</span>
            </div>
          ))}
        </div>
      </LoadState>
    </div>
  );
};
