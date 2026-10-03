import React, { useCallback, useEffect, useState } from 'react';
import { ChevronLeft, FileText, Download, Trash2, Upload, Share2 } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import LoadState from '../common/LoadState';
import { VISIBILITY_OPTIONS, formatSize, formatDate } from './shared';

/** Files in one folder: upload (HR), download, delete (HR). Stored on the server, max 5 MB each. */
export const DocumentDetailView = ({ folder, canEdit, onBack, onChanged, onShare }) => {
  const { showToast } = useApp();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setFiles(await api.listFiles('folder', folder.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [folder.id]);
  useEffect(() => { load(); }, [load]);

  const upload = async (list) => {
    setUploading(true);
    for (const file of list) {
      try {
        const res = await api.uploadFile('folder', folder.id, file);
        showToast(res.message, 'success');
      } catch (err) {
        showToast(`${file.name}: ${err.message}`, 'error');
      }
    }
    setUploading(false);
    await load();
    onChanged?.();
  };

  const remove = async (f) => {
    if (!window.confirm(`Delete "${f.name}"?`)) return;
    try {
      showToast((await api.deleteFile(f.id)).message, 'success');
      await load();
      onChanged?.();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const download = (f) => api.downloadFile(f.id, f.name).catch(err => showToast(err.message, 'error'));

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Documents</h1>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 mt-1">
            <button type="button" onClick={onBack} className="hover:text-emerald-600 font-bold flex items-center gap-1"><ChevronLeft className="w-3.5 h-3.5" /><span>Folders</span></button>
            <span>&gt;</span><span className="text-slate-900 font-black">{folder.name}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-violet-50 text-violet-700">Visible to: {VISIBILITY_OPTIONS.find(o => o.value === folder.visibility)?.label}</span>
          {canEdit && <button type="button" onClick={onShare} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"><Share2 className="w-3.5 h-3.5" />Share</button>}
          {files.length > 0 && <button type="button" onClick={() => files.forEach((f, i) => setTimeout(() => download(f), i * 400))} className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"><Download className="w-3.5 h-3.5" />Download all</button>}
          {canEdit && (
            <label className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold cursor-pointer ${uploading ? 'opacity-60' : ''}`}>
              <Upload className="w-4 h-4" />{uploading ? 'Uploading…' : 'Upload files'}
              <input type="file" multiple className="hidden" aria-label="Upload files" disabled={uploading}
                accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.png,.jpg,.jpeg" onChange={(e) => { upload([...e.target.files]); e.target.value = ''; }} />
            </label>
          )}
        </div>
      </div>
      {folder.description && <p className="text-sm text-slate-600">{folder.description}</p>}

      <LoadState loading={loading} error={error} onRetry={load} empty={!files.length} emptyText={canEdit ? 'No files yet. Upload the first one (max 5 MB each).' : 'No files in this folder yet.'}>
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead><tr className="bg-slate-50/60 text-[11px] font-bold uppercase tracking-wider text-slate-400"><th className="py-4 px-6">Name</th><th className="py-4 px-4">Size</th><th className="py-4 px-4">Uploaded</th><th className="py-4 px-4">By</th><th className="py-4 px-6 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {files.map(f => (
                <tr key={f.id} className="hover:bg-slate-50/60">
                  <td className="py-4 px-6"><span className="flex items-center gap-2 font-bold text-slate-800"><FileText className="w-4 h-4 text-slate-400" />{f.name}</span></td>
                  <td className="py-4 px-4 text-slate-500">{formatSize(f.size)}</td>
                  <td className="py-4 px-4 text-slate-500">{formatDate(f.created_at)}</td>
                  <td className="py-4 px-4 text-slate-500">{f.uploaded_by}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button type="button" onClick={() => download(f)} title={`Download ${f.name}`} className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"><Download className="w-3.5 h-3.5" /></button>
                      {canEdit && <button type="button" onClick={() => remove(f)} title={`Delete ${f.name}`} className="p-2 rounded-xl bg-rose-500 text-white"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </LoadState>
    </div>
  );
};
