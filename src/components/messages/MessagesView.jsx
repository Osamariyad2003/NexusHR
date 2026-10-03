import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Send, Plus, ChevronLeft } from 'lucide-react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import { useInbox } from '../../context/InboxContext';
import LoadState from '../common/LoadState';

const initials = (n) => String(n || '?').split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase();
const timeLabel = (iso) => {
  const d = new Date(iso);
  return d.toDateString() === new Date().toDateString()
    ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
};
const Avatar = ({ user, size = 'w-10 h-10' }) => (user?.avatar
  ? <img src={user.avatar} alt="" className={`${size} rounded-full object-cover`} />
  : <div className={`${size} rounded-full bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center`}>{initials(user?.name)}</div>);

/** One-to-one messages with colleagues; new messages arrive live. */
export default function MessagesView() {
  const { currentUser, employees, showToast } = useApp();
  const { onDirectMessage, refresh: refreshInbox } = useInbox();
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [active, setActive] = useState(null); // { user, messages }
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState('');
  const [picking, setPicking] = useState(false);
  const bottom = useRef(null);
  const activeId = active?.user.id;

  const loadThreads = useCallback(async () => {
    setError('');
    try {
      setThreads(await api.getMessageThreads());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const openConversation = useCallback(async (userId) => {
    try {
      const conv = await api.getConversation(userId);
      setActive(conv);
      setPicking(false);
      if (conv.messages.some(m => m.to_id === currentUser.id && !m.read_at)) {
        await api.markConversationRead(userId);
        loadThreads();
        refreshInbox();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }, [currentUser?.id, loadThreads, refreshInbox, showToast]);

  useEffect(() => { loadThreads(); }, [loadThreads]);
  useEffect(() => { bottom.current?.scrollIntoView({ block: 'end' }); }, [active?.messages.length]);

  // Live: append to the open conversation, otherwise refresh the thread list
  useEffect(() => onDirectMessage((m) => {
    const partner = m.from_id === currentUser.id ? m.to_id : m.from_id;
    if (partner === activeId) {
      setActive(a => (a && !a.messages.some(x => x.id === m.id) ? { ...a, messages: [...a.messages, m] } : a));
      if (m.to_id === currentUser.id) api.markConversationRead(partner).then(() => refreshInbox(), () => {});
    }
    loadThreads();
  }), [onDirectMessage, activeId, currentUser?.id, loadThreads, refreshInbox]);

  const send = async (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !active) return;
    setSending(true);
    try {
      const m = await api.sendMessage(active.user.id, text);
      setActive(a => (a.messages.some(x => x.id === m.id) ? a : { ...a, messages: [...a.messages, m] }));
      setDraft('');
      loadThreads();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const q = search.trim().toLowerCase();
  const shownThreads = threads.filter(t => !q || t.user.name.toLowerCase().includes(q));
  const colleagues = employees.filter(e => e.id !== currentUser?.id && !['TERMINATED', 'SUSPENDED'].includes(e.status))
    .map(e => ({ id: e.id, name: `${e.first_name || ''} ${e.last_name || ''}`.trim() || e.name, avatar: e.avatar, job_title: e.job_title }))
    .filter(e => !q || e.name.toLowerCase().includes(q));

  return (
    <div className="space-y-6 font-sans">
      <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Messages</h1>
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-card overflow-hidden grid grid-cols-1 md:grid-cols-3 min-h-[560px]">
        <div className={`border-r border-slate-100 flex flex-col ${active ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 space-y-3 border-b border-slate-100">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={picking ? 'Find a colleague' : 'Search conversations'} className="w-full pl-4 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              </div>
              <button type="button" onClick={() => { setPicking(!picking); setSearch(''); }} title="New message" aria-pressed={picking} className={`p-2.5 rounded-2xl ${picking ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white'}`}><Plus className="w-4 h-4" /></button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {picking ? (
              colleagues.map(c => (
                <button key={c.id} type="button" onClick={() => openConversation(c.id)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left">
                  <Avatar user={c} />
                  <div className="min-w-0"><p className="text-sm font-bold text-slate-900 truncate">{c.name}</p><p className="text-xs text-slate-400 truncate">{c.job_title}</p></div>
                </button>
              ))
            ) : (
              <LoadState loading={loading} error={error} onRetry={loadThreads} empty={!shownThreads.length} emptyText="No conversations yet. Press + to message a colleague.">
                {shownThreads.map(t => (
                  <button key={t.user.id} type="button" onClick={() => openConversation(t.user.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-left ${activeId === t.user.id ? 'bg-emerald-50' : 'hover:bg-slate-50'}`}>
                    <Avatar user={t.user} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${t.unread ? 'font-black text-slate-900' : 'font-bold text-slate-800'}`}>{t.user.name}</p>
                        <span className="text-[10px] text-slate-400 shrink-0">{timeLabel(t.last_message.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-slate-500 truncate">{t.last_message.from_me ? 'You: ' : ''}{t.last_message.text}</p>
                        {t.unread > 0 && <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center">{t.unread}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </LoadState>
            )}
          </div>
        </div>

        <div className={`md:col-span-2 flex flex-col ${active ? 'flex' : 'hidden md:flex'}`}>
          {active ? (
            <>
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <button type="button" onClick={() => setActive(null)} aria-label="Back to conversations" className="md:hidden p-1.5 rounded-lg hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></button>
                <Avatar user={active.user} />
                <div><p className="text-sm font-black text-slate-900">{active.user.name}</p><p className="text-xs text-slate-400">{active.user.active ? active.user.job_title : 'No longer active'}</p></div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
                {active.messages.map(m => {
                  const mine = m.from_id === currentUser.id;
                  return (
                    <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${mine ? 'bg-emerald-500 text-white rounded-br-md' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-md'}`}>
                        <p className="whitespace-pre-wrap break-words">{m.text}</p>
                        <p className={`text-[10px] mt-1 ${mine ? 'text-emerald-100' : 'text-slate-400'}`}>{timeLabel(m.created_at)}{mine && m.read_at ? ' · Read' : ''}</p>
                      </div>
                    </div>
                  );
                })}
                {!active.messages.length && <p className="text-center text-xs text-slate-400 py-8">Say hello to {active.user.name.split(' ')[0]}.</p>}
                <div ref={bottom} />
              </div>
              <form onSubmit={send} className="p-4 border-t border-slate-100 flex gap-2">
                <input value={draft} onChange={(e) => setDraft(e.target.value)} disabled={!active.user.active} maxLength={4000} aria-label="Message"
                  placeholder={active.user.active ? 'Write a message' : 'This person can no longer receive messages'}
                  className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20" />
                <button type="submit" disabled={!draft.trim() || sending || !active.user.active} aria-label="Send" className="px-4 rounded-2xl bg-slate-900 text-white disabled:opacity-40"><Send className="w-4 h-4" /></button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-sm text-slate-400">Choose a conversation, or press + to start one.</div>
          )}
        </div>
      </div>
    </div>
  );
}
