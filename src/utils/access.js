// Which screens each role can use. Mirrors what the server allows (it enforces the same rules),
// so nobody is shown a screen that can only fail. Screens not listed are open to everyone.
const HR = ['SUPER_ADMIN', 'HR_MANAGER'];
const MANAGERS = [...HR, 'PEOPLE_MANAGER'];

export const TAB_ROLES = {
  'checklist-setting': HR,
  'team-time-off': MANAGERS,
  'employee-time-off': HR,
  'time-off-settings': HR,
  'team-attendance': MANAGERS,
  'employee-attendance': HR,
  'attendance-settings': HR,
  'payroll-settings': HR,
  analytics: MANAGERS,
  reports: MANAGERS,
  'analytics-audit': HR,
  recruitment: MANAGERS,
  'recruitment-jobs': MANAGERS,
  'recruitment-candidates': MANAGERS,
  'recruitment-settings': MANAGERS
};

// Settings tabs that only HR can open (the others are readable by everyone, editable by HR)
export const SETTINGS_TAB_ROLES = { permission: HR, integration: HR, subscription: HR };

export const canSeeTab = (tab, role) => !TAB_ROLES[tab] || TAB_ROLES[tab].includes(role);
export const canSeeSettingsTab = (tab, role) => !SETTINGS_TAB_ROLES[tab] || SETTINGS_TAB_ROLES[tab].includes(role);
