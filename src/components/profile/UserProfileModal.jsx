import React, { useCallback, useEffect, useState } from 'react';
import { X, User, Shield, CheckCircle, AlertCircle, FileText, Heart, LogOut } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { Badge } from '../common/Badge';
import Avatar from '../common/Avatar';

const inputClass = 'w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500';
const labelClass = 'block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1';
const buttonClass = 'px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-xs sm:text-sm font-semibold shadow-md transition-all';
const BAR_COLORS = ['bg-emerald-500', 'bg-indigo-500', 'bg-pink-500', 'bg-amber-500', 'bg-sky-500'];

const TABS = [
  ['personal', 'Personal Info', User],
  ['leave', 'Leave Balances', FileText],
  ['security', 'Security & Password', Shield],
  ['emergency', 'Emergency Contact', Heart]
];

const personalFrom = (p) => ({
  first_name: p.first_name || '', last_name: p.last_name || '', phone: p.phone || '', bio: p.bio || '',
  address: p.address || '', city: p.city || '', state: p.state || '', post_code: p.post_code || '', country: p.country || ''
});
const contactFrom = (p) => ({ name: p.emergency_contact?.name || '', relationship: p.emergency_contact?.relationship || '', phone: p.emergency_contact?.phone || '' });

/** The signed-in person's own profile: loaded from and saved to their record. */
export default function UserProfileModal({ isOpen, onClose }) {
  const { currentUser, updateCurrentUser, logout } = useApp();
  const [activeTab, setActiveTab] = useState('personal');
  const [profile, setProfile] = useState(null);
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [formData, setFormData] = useState(personalFrom({}));
  const [emergencyContact, setEmergencyContact] = useState(contactFrom({}));
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const load = useCallback(async () => {
    setLoadError('');
    try {
      const [me, policy] = await Promise.all([api.getMyProfile(), api.listResource('leavePolicy').catch(() => null)]);
      setProfile(me);
      setFormData(personalFrom(me));
      setEmergencyContact(contactFrom(me));
      setLeaveTypes(policy?.leave_types || []);
    } catch (err) {
      setLoadError(err.message || 'Could not load your profile.');
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    setSuccessMsg('');
    setErrorMsg('');
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    load();
  }, [isOpen, load]);

  // Escape closes it, like the app's other dialogs
  useEffect(() => {
    if (!isOpen) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const flash = (ok, text) => {
    setSuccessMsg(ok ? text : '');
    setErrorMsg(ok ? '' : text);
  };

  const save = async (fields, doneText) => {
    setSaving(true);
    try {
      const updated = await api.updateMyProfile(fields);
      setProfile((p) => ({ ...p, ...updated }));
      updateCurrentUser(updated);
      flash(true, doneText);
    } catch (err) {
      flash(false, err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSavePersonal = (e) => {
    e.preventDefault();
    if (!formData.first_name.trim() || !formData.last_name.trim()) { flash(false, 'First and last name are required.'); return; }
    const trimmed = Object.fromEntries(Object.entries(formData).map(([k, v]) => [k, v.trim()]));
    save(trimmed, 'Profile saved.');
  };

  const handleSaveContact = (e) => {
    e.preventDefault();
    save({ emergency_contact: emergencyContact }, Object.values(emergencyContact).some((v) => v.trim()) ? 'Emergency contact saved.' : 'Emergency contact removed.');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) { flash(false, 'New password and confirm password do not match.'); return; }
    setSaving(true);
    try {
      // The server checks the current password and the password policy
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      flash(true, 'Password updated. You have been signed out on all other devices.');
    } catch (err) {
      flash(false, err.message);
    } finally {
      setSaving(false);
    }
  };

  // Leave types switched on in the time off settings, plus any other type the person holds days of
  const balances = profile?.leave_balances || {};
  const named = leaveTypes.filter((t) => t.enabled !== false);
  const shownTypes = [
    ...named.map((t) => ({ code: t.code, name: t.name })),
    ...Object.keys(balances).filter((code) => typeof balances[code] === 'number' && !named.some((t) => t.code === code)).map((code) => ({ code, name: code }))
  ];
  const most = Math.max(1, ...shownTypes.map((t) => balances[t.code] || 0));

  const name = profile?.name || currentUser?.name || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto font-sans">
      <div role="dialog" aria-label="My profile" className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">

        <div className="relative h-32 bg-gradient-to-r from-emerald-600 to-teal-700 p-6 flex items-end">
          <button onClick={onClose} aria-label="Close" className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pb-4 pt-0 relative flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12">
          <div className="flex items-end gap-4">
            <Avatar src={profile?.avatar || currentUser?.avatar} name={name} className="w-24 h-24 rounded-2xl text-2xl border-4 border-white dark:border-slate-900 shadow-md" />
            <div className="mb-1">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{name}</h2>
              {(profile?.job_title || currentUser?.job_title) && (
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{profile?.job_title || currentUser?.job_title}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-1">
            {currentUser?.role && <Badge status="ACTIVE" text={currentUser.role} size="sm" />}
            {(profile?.department || currentUser?.department) && (
              <span className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold">
                {profile?.department || currentUser?.department}
              </span>
            )}
            {/* The app's only sign-out control: reachable from the avatar in both layouts */}
            <button
              type="button"
              onClick={() => { onClose(); logout(); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>

        <div className="flex items-center border-b border-slate-200 dark:border-slate-800 px-6 gap-6 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 overflow-x-auto">
          {TABS.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => { setActiveTab(id); setSuccessMsg(''); setErrorMsg(''); }}
              className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                activeTab === id ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 font-bold' : 'border-transparent hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {successMsg && (
          <div role="status" className="mx-6 mt-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold rounded-xl flex items-center gap-2">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div role="alert" className="mx-6 mt-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-semibold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loadError && (
            <div className="text-xs text-rose-600 space-y-2">
              <p>{loadError}</p>
              <button onClick={load} className="font-bold underline">Try again</button>
            </div>
          )}
          {!loadError && !profile && <p className="text-xs text-slate-400">Loading your profile…</p>}

          {profile && activeTab === 'personal' && (
            <form onSubmit={handleSavePersonal} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="profile-first-name">First Name</label>
                  <input id="profile-first-name" type="text" maxLength={50} value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="profile-last-name">Last Name</label>
                  <input id="profile-last-name" type="text" maxLength={50} value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="profile-email">Email Address</label>
                  <input id="profile-email" type="email" disabled value={profile.email || ''} title="Ask HR to change your email address" className="w-full px-3 py-2 bg-slate-200/60 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed" />
                </div>
                <div>
                  <label className={labelClass} htmlFor="profile-phone">Phone Number</label>
                  <input id="profile-phone" type="tel" maxLength={30} value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} placeholder="Not set" className={inputClass} />
                </div>
              </div>
              <div>
                <label className={labelClass} htmlFor="profile-address">Street address</label>
                <input id="profile-address" type="text" maxLength={300} value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} placeholder="Not set" className={inputClass} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[['city', 'City', 100], ['state', 'State/Province', 100], ['post_code', 'Post code', 12], ['country', 'Country', 60]].map(([key, label, max]) => (
                  <div key={key}>
                    <label className={labelClass} htmlFor={`profile-${key}`}>{label}</label>
                    <input id={`profile-${key}`} type="text" maxLength={max} value={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.value })} placeholder="Not set" className={inputClass} />
                  </div>
                ))}
              </div>
              <div>
                <label className={labelClass} htmlFor="profile-bio">Bio</label>
                <textarea id="profile-bio" rows={3} maxLength={1000} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} placeholder="A few words about you (optional)" className={inputClass} />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={saving} className={buttonClass}>{saving ? 'Saving…' : 'Save Profile Changes'}</button>
              </div>
            </form>
          )}

          {profile && activeTab === 'leave' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Days of leave left</h3>
              {shownTypes.length === 0 ? (
                <p className="text-xs text-slate-500">No leave balances on record. Ask HR to set them up.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {shownTypes.map((t, i) => {
                    const days = balances[t.code] ?? 0;
                    return (
                      <div key={t.code} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">{t.name}</span>
                          <span className="text-sm font-bold text-slate-800 dark:text-slate-100">{days} {days === 1 ? 'day' : 'days'}</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${BAR_COLORS[i % BAR_COLORS.length]}`} style={{ width: `${Math.round((days / most) * 100)}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {profile && activeTab === 'security' && (
            <div className="space-y-6">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Change Account Password</h3>
                <div>
                  <label className={labelClass} htmlFor="profile-current-password">Current Password</label>
                  <input id="profile-current-password" type="password" required autoComplete="current-password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} className={inputClass} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass} htmlFor="profile-new-password">New Password</label>
                    <input id="profile-new-password" type="password" required autoComplete="new-password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="profile-confirm-password">Confirm New Password</label>
                    <input id="profile-confirm-password" type="password" required autoComplete="new-password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={saving} className={buttonClass}>{saving ? 'Updating…' : 'Update Password'}</button>
                </div>
              </form>
              <hr className="border-slate-200 dark:border-slate-800" />
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">Two-Factor Authentication (2FA)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Not available yet. Your account is protected by your password.</p>
              </div>
            </div>
          )}

          {profile && activeTab === 'emergency' && (
            <form onSubmit={handleSaveContact} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Primary Emergency Contact</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass} htmlFor="profile-contact-name">Contact Name</label>
                  <input id="profile-contact-name" type="text" maxLength={100} value={emergencyContact.name} onChange={(e) => setEmergencyContact({ ...emergencyContact, name: e.target.value })} placeholder="Not set" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass} htmlFor="profile-contact-relationship">Relationship</label>
                  <input id="profile-contact-relationship" type="text" maxLength={100} value={emergencyContact.relationship} onChange={(e) => setEmergencyContact({ ...emergencyContact, relationship: e.target.value })} placeholder="e.g. Partner, Parent" className={inputClass} />
                </div>
              </div>
              <div className="sm:w-1/2 sm:pr-2">
                <label className={labelClass} htmlFor="profile-contact-phone">Emergency Phone</label>
                <input id="profile-contact-phone" type="tel" maxLength={100} value={emergencyContact.phone} onChange={(e) => setEmergencyContact({ ...emergencyContact, phone: e.target.value })} placeholder="Not set" className={inputClass} />
              </div>
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={saving} className={buttonClass}>{saving ? 'Saving…' : 'Save Emergency Contact'}</button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
