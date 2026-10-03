// The app's navigation, shared by both layouts (left sidebar and top bar) so they always match.
// Each screen also passes canSeeTab (utils/access.js), and the server enforces the same rules.
import { Briefcase, Calendar, ClipboardList, Clock, CreditCard, Folder, LayoutGrid, Newspaper, TrendingUp, Users, HelpCircle, Settings } from 'lucide-react';
import { canSeeTab } from '../../utils/access';

export const NAV_ITEMS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: LayoutGrid,
    hasDropdown: false,
  },
  {
    id: 'employees',
    label: 'Employees',
    icon: Users,
    hasDropdown: true,
    children: [
      { id: 'employees', label: 'Manage Employees' },
      { id: 'employees-directory', label: 'Directory' },
      { id: 'employees-org', label: 'ORG Chart' },
    ]
  },
  {
    id: 'checklist',
    label: 'Checklist',
    icon: ClipboardList,
    hasDropdown: true,
    children: [
      { id: 'checklist-todos', label: 'To-Dos' },
      { id: 'checklist-onboarding', label: 'Onboarding' },
      { id: 'checklist-offboarding', label: 'Offboarding' },
      { id: 'checklist-setting', label: 'Setting' },
    ]
  },
  {
    id: 'timeOff',
    label: 'Time Off',
    icon: Clock,
    hasDropdown: true,
    children: [
      { id: 'leave', label: 'My Time Off' },
      { id: 'team-time-off', label: 'Team Time Off' },
      { id: 'employee-time-off', label: 'Employee Time Off' },
      { id: 'time-off-settings', label: 'Settings' },
    ]
  },
  {
    id: 'attendance',
    label: 'Attendance',
    icon: Calendar,
    hasDropdown: true,
    children: [
      { id: 'attendance', label: 'My Attendance' },
      { id: 'team-attendance', label: 'Team Attendance' },
      { id: 'employee-attendance', label: 'Employee Attendance' },
      { id: 'attendance-settings', label: 'Settings' },
    ]
  },
  {
    id: 'payroll',
    label: 'Payroll',
    icon: CreditCard,
    hasDropdown: true,
    children: [
      { id: 'payroll', label: 'Employee Payroll' },
      { id: 'payroll-settings', label: 'Settings' },
    ]
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: TrendingUp,
    hasDropdown: true,
    children: [
      { id: 'analytics', label: 'KPI Scorecards' },
      { id: 'analytics-audit', label: 'Audit Trail' },
    ]
  },
  {
    id: 'recruitment',
    label: 'Recruitment',
    icon: Briefcase,
    hasDropdown: true,
    children: [
      { id: 'recruitment-jobs', label: 'Jobs' },
      { id: 'recruitment-candidates', label: 'Candidates' },
      { id: 'recruitment-settings', label: 'Settings' },
    ]
  },
  {
    id: 'documents',
    label: 'Documents',
    icon: Folder,
    hasDropdown: false,
  },
  {
    id: 'news',
    label: 'News',
    icon: Newspaper,
    hasDropdown: false,
  },
];

// Shown at the end: help for everyone, settings for those who may use a settings tab
export const FOOTER_ITEMS = [
  { id: 'helpcenter', label: 'Help Center', icon: HelpCircle },
  { id: 'settings', label: 'Setting', icon: Settings }
];

/** The menu for one role: groups keep only the screens it may use; empty groups disappear. */
export const navFor = (role) => NAV_ITEMS
  .map((item) => (item.children ? { ...item, children: item.children.filter((c) => canSeeTab(c.id, role)) } : item))
  .filter((item) => (item.children ? item.children.length > 0 : canSeeTab(item.id, role)));

/** Whether a menu entry (or one of its screens) is the screen being shown. */
export const isActiveItem = (item, activeTab) => activeTab === item.id || Boolean(item.children?.some((c) => c.id === activeTab));
