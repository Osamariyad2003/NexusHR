import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../services/api';
import { useApp } from '../../context/AppContext';
import LoadState from '../common/LoadState';

// Integrations with no connector built yet; shown so admins know they're planned, never faked
const PLANNED = [
  { id: 'workable', name: 'Workable', badge: 'ATS', logoBg: 'bg-teal-700 text-white', logoText: 'W', description: 'Import candidates from Workable into Recruitment.' },
  { id: 'lever', name: 'Lever', badge: 'ATS', logoBg: 'bg-slate-900 text-white', logoText: 'L', description: 'Import candidates from Lever into Recruitment.' },
  { id: 'quickbooks', name: 'QuickBooks', badge: 'FINANCE', logoBg: 'bg-emerald-600 text-white', logoText: 'QB', description: 'Send approved payroll runs to QuickBooks Online.' }
];

const StatusPill = ({ ok, children }) => (
  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${ok ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{children}</span>
);

export default function IntegrationSettingsView() {
  const { showToast } = useApp();
  const [slack, setSlack] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [testing, setTesting] = useState(false);

  const load = useCallback(async () => {
    setError('');
    try {
      setSlack(await api.getSlackStatus());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const sendTest = async () => {
    setTesting(true);
    try {
      const res = await api.triggerSlackTestNotification();
      if (res?.skipped || res?.status === 'skipped') showToast(res.message || 'Slack notifications are switched off on the server.', 'info');
      else showToast(res?.message || 'Test message sent to Slack.', 'success');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  const slackReady = slack?.configured && slack?.enabled;

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-card space-y-6 font-sans">
      <div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Integration</h2>
        <p className="text-xs text-slate-500 mt-1">Connections are configured on the server (environment variables); this page shows their live status.</p>
      </div>

      <LoadState loading={loading} error={error} onRetry={load}>
        <div className="space-y-4">
          <div className="p-6 rounded-2xl border border-slate-200/80 bg-white flex flex-col sm:flex-row items-start justify-between gap-5">
            <div className="flex items-start gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-purple-700 text-white flex items-center justify-center font-black text-lg shrink-0">S</div>
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm">Slack</span>
                  <StatusPill ok={slackReady}>{slackReady ? 'Connected' : slack?.configured ? 'Switched off' : 'Not configured'}</StatusPill>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
                  Posts announcements and admin broadcasts to your Slack channel.
                  {slack?.webhook_url_masked ? ` Webhook: ${slack.webhook_url_masked}` : ' Set SLACK_WEBHOOK_URL and SLACK_NOTIFICATIONS_ENABLED=true on the server to connect.'}
                </p>
              </div>
            </div>
            <button type="button" onClick={sendTest} disabled={!slack?.configured || testing}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold disabled:opacity-50 shrink-0">
              {testing ? 'Sending…' : 'Send test message'}
            </button>
          </div>

          {PLANNED.map(item => (
            <div key={item.id} className="p-6 rounded-2xl border border-slate-200/80 bg-slate-50/40 flex flex-col sm:flex-row items-start justify-between gap-5">
              <div className="flex items-start gap-4 flex-1">
                <div className={`w-12 h-12 rounded-2xl ${item.logoBg} flex items-center justify-center font-black text-lg shrink-0 opacity-70`}>{item.logoText}</div>
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-500 tracking-wider">{item.badge}</span>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">{item.description}</p>
                </div>
              </div>
              <StatusPill ok={false}>Not available yet</StatusPill>
            </div>
          ))}
        </div>
      </LoadState>
    </div>
  );
}
