/**
 * Global keyboard shortcuts. Alt on Windows/Linux, Option on macOS.
 * Keys are matched by physical key (`event.code`) because Option+Shift+W on a Mac types "„",
 * not "W", so matching on `event.key` would miss every shortcut there.
 * The Help Center's shortcut table renders from this same list. Kept free of React so it can be
 * unit-tested with plain Node.
 */
export const SHORTCUTS = [
  { id: 'search', codes: ['Slash', 'NumpadDivide'], shift: false, win: 'Alt + /', mac: 'Option + /', title: 'Global Search to search an employee' },
  { id: 'dashboard', codes: ['Digit0', 'Numpad0'], shift: true, win: 'Alt + Shift + 0', mac: 'Option + Shift + 0', title: 'Open Dashboard', tab: 'dashboard' },
  { id: 'news', codes: ['KeyW'], shift: true, win: 'Alt + Shift + W', mac: 'Option + Shift + W', title: 'Open News', tab: 'news' },
  { id: 'employees', codes: ['KeyE'], shift: true, win: 'Alt + Shift + E', mac: 'Option + Shift + E', title: 'Open Employees', tab: 'employees' },
  { id: 'checklists', codes: ['KeyL'], shift: true, win: 'Alt + Shift + L', mac: 'Option + Shift + L', title: 'Open Checklists', tab: 'checklist' },
  { id: 'time-off', codes: ['KeyT'], shift: true, win: 'Alt + Shift + T', mac: 'Option + Shift + T', title: 'Open Time off request', tab: 'leave' },
  { id: 'attendance', codes: ['KeyC'], shift: true, win: 'Alt + Shift + C', mac: 'Option + Shift + C', title: 'Open Attendance', tab: 'attendance' },
  { id: 'payroll', codes: ['KeyP'], shift: true, win: 'Alt + Shift + P', mac: 'Option + Shift + P', title: 'Open Payroll', tab: 'payroll' },
];

export const matchShortcut = (event) =>
  event.altKey && !event.ctrlKey && !event.metaKey && !event.repeat
    ? SHORTCUTS.find((s) => s.shift === event.shiftKey && s.codes.includes(event.code)) || null
    : null;
