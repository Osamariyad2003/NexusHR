import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { canSeeSettingsTab } from '../../utils/access';
import {
  Info,
  Building2,
  Globe,
  Briefcase,
  Clock,
  ShieldCheck,
  Share2,
  Zap,
  Lock,
  Bell
} from 'lucide-react';
import CompanyInfoSettingsView from './CompanyInfoSettingsView';
import OfficesSettingsView from './OfficesSettingsView';
import DepartmentTreeSettingsView from './DepartmentTreeSettingsView';
import JobTitlesSettingsView from './JobTitlesSettingsView';
import WorkScheduleSettingsView from './WorkScheduleSettingsView';
import { RbacSettingsView } from './RbacSettingsView';
import IntegrationSettingsView from './IntegrationSettingsView';
import SubscriptionSettingsView from './SubscriptionSettingsView';
import PasswordSettingsView from './PasswordSettingsView';
import NotificationSettingsView from './NotificationSettingsView';

export default function SystemSettingsManagerView({ initialTab }) {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState(initialTab || 'company-info');
  useEffect(() => { if (initialTab) setActiveTab(initialTab); }, [initialTab]);

  const settingsTabs = [
    { id: 'company-info', label: 'Company Info', icon: Info },
    { id: 'offices', label: 'Offices', icon: Building2 },
    { id: 'department', label: 'Department', icon: Globe },
    { id: 'job-titles', label: 'Job Titles', icon: Briefcase },
    { id: 'work-schedule', label: 'Work Schedule', icon: Clock },
    { id: 'permission', label: 'Permission', icon: ShieldCheck },
    { id: 'integration', label: 'Integration', icon: Share2 },
    { id: 'subscription', label: 'Subscription', icon: Zap },
    { id: 'password', label: 'Password', icon: Lock },
    { id: 'notification', label: 'Notification', icon: Bell }
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Settings Page Header matching Figma Screens 107-125 */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
          Settings
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
          Manage your dashboard here
        </p>
      </div>

      {/* Main Settings Grid: Left Sub-Nav + Right Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Left Sub-Navigation List matching Figma Screens 107-125 */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200/80 p-3 shadow-card space-y-1">
          {settingsTabs.filter(t => canSeeSettingsTab(t.id, currentUser?.role)).map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-50 text-emerald-700 shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Main Panel Content */}
        <div className="lg:col-span-3">
          {activeTab === 'company-info' && <CompanyInfoSettingsView />}
          {activeTab === 'offices' && <OfficesSettingsView />}
          {activeTab === 'department' && <DepartmentTreeSettingsView />}
          {activeTab === 'job-titles' && <JobTitlesSettingsView />}
          {activeTab === 'work-schedule' && <WorkScheduleSettingsView />}
          {activeTab === 'permission' && canSeeSettingsTab('permission', currentUser?.role) && <RbacSettingsView />}
          {activeTab === 'integration' && canSeeSettingsTab('integration', currentUser?.role) && <IntegrationSettingsView />}
          {activeTab === 'subscription' && canSeeSettingsTab('subscription', currentUser?.role) && <SubscriptionSettingsView />}
          {activeTab === 'password' && <PasswordSettingsView />}
          {activeTab === 'notification' && <NotificationSettingsView />}
        </div>

      </div>
    </div>
  );
}
