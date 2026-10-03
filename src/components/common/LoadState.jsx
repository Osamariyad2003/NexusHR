import React from 'react';

/** Loading, error and empty states shared by screens that read from the server. */
export default function LoadState({ loading, error, empty, emptyText = 'Nothing here yet.', onRetry, children }) {
  if (loading) return <div className="py-10 text-center text-xs font-semibold text-slate-400">Loading…</div>;
  if (error) {
    return (
      <div className="py-8 text-center space-y-3">
        <p className="text-xs font-semibold text-rose-600">{error}</p>
        {onRetry && <button type="button" onClick={onRetry} className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">Try again</button>}
      </div>
    );
  }
  if (empty) return <div className="py-10 text-center text-xs font-semibold text-slate-400">{emptyText}</div>;
  return children;
}
