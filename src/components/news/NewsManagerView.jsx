import React, { useState } from 'react';
import NewsListView from './NewsListView';
import NewsDetailView from './NewsDetailView';
import NewsFormView from './NewsFormView';
import { useApp } from '../../context/AppContext';
import { useResource } from '../../hooks/useResource';

/** News: list, read, write (HR). Posts are stored on the server; drafts are visible to HR only. */
export default function NewsManagerView() {
  const { currentUser } = useApp();
  const news = useResource('news');
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [editing, setEditing] = useState(null);
  const canWrite = ['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role);

  const selected = news.rows.find(n => n.id === selectedId);
  const back = () => { setView('list'); setSelectedId(null); setEditing(null); };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.title}"?`)) return;
    try {
      await news.remove(item.id);
      back();
    } catch { /* toast shown */ }
  };

  const handleSave = async (fields) => {
    const saved = editing?.id ? await news.update(editing.id, fields) : await news.create(fields);
    setSelectedId(saved?.id || null);
    setEditing(null);
    setView(saved?.id ? 'detail' : 'list');
  };

  return (
    <div className="w-full">
      {view === 'list' && (
        <NewsListView
          newsList={news.rows}
          loading={news.loading}
          error={news.error}
          onRetry={news.reload}
          canWrite={canWrite}
          onSelectNews={(item) => { setSelectedId(item.id); setView('detail'); }}
          onEditNews={(item) => { setEditing(item); setView('form'); }}
          onCreateNews={() => { setEditing(null); setView('form'); }}
          onDeleteNews={handleDelete}
        />
      )}
      {view === 'detail' && selected && (
        <NewsDetailView news={selected} canWrite={canWrite} onBack={back}
          onEdit={(item) => { setEditing(item); setView('form'); }} onDelete={handleDelete} />
      )}
      {view === 'form' && <NewsFormView initialNews={editing} onBack={back} onSave={handleSave} />}
    </div>
  );
}
