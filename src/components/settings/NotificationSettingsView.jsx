import React from 'react';
import { useResource } from '../../hooks/useResource';
import LoadState from '../common/LoadState';
import Toggle from '../common/Toggle';

// Each person's own preferences; the notification centre only sends the kinds switched on here
const PREFERENCES = [
  { id: 'leave_updates', title: 'My leave requests', description: 'When your leave request is approved, rejected or cancelled.' },
  { id: 'approvals', title: 'Approvals waiting for me', description: 'When someone on your team (or anyone, for HR) submits leave for you to review.' },
  { id: 'payroll', title: 'Payslips', description: 'When a payroll run is approved and your payslip is ready.' },
  { id: 'news', title: 'Company news', description: 'When a news post is published.' },
  { id: 'attendance', title: 'Attendance', description: 'When a shift of yours is flagged for review (for example, a missed clock-out).' },
  { id: 'email_digest', title: 'Daily email digest', description: 'A once-a-day summary by email. Email sending must be set up by your administrator.' }
];

export default function NotificationSettingsView() {
  const { data, loading, error, reload, save } = useResource('notificationPreferences', { settings: true });

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-card space-y-6 font-sans">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Notification</h2>
        <p className="text-xs text-slate-500 mt-1">Choose which notifications you receive. Changes save immediately and apply only to you.</p>
      </div>
      <LoadState loading={loading} error={error} onRetry={reload}>
        <div className="divide-y divide-slate-100">
          {data && PREFERENCES.map(p => (
            <div key={p.id} className="py-4 flex items-center justify-between gap-6">
              <div>
                <p className="text-sm font-bold text-slate-900">{p.title}</p>
                <p className="text-xs text-slate-500">{p.description}</p>
              </div>
              <Toggle on={Boolean(data[p.id])} label={p.title}
                onChange={(on) => save({ [p.id]: on }, `${p.title}: ${on ? 'on' : 'off'}.`).catch(() => {})} />
            </div>
          ))}
        </div>
      </LoadState>
    </div>
  );
}
