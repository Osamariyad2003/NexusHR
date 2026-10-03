import React, { useState } from 'react';
import {
  LayoutGrid,
  Users,
  ClipboardList,
  Clock,
  Calendar,
  CreditCard,
  TrendingUp,
  Briefcase,
  ChevronDown,
  ChevronRight,
  Shield,
  HelpCircle,
  Settings,
  Sun,
  Moon,
  ChevronLeft,
  Folder,
  Newspaper
} from 'lucide-react';
import clsx from 'clsx';
import { useApp } from '../../context/AppContext';
import { NAV_ITEMS, navFor } from './navItems';
import DropdownMenu from '../common/DropdownMenu';

export const Sidebar = ({ activeTab, setActiveTab, collapsed, setCollapsed, mobileOpen, setMobileOpen }) => {
  const { themeMode, setThemeMode, currentUser } = useApp();
  const [openSubmenus, setOpenSubmenus] = useState({
    employees: true,
    checklist: false,
    timeOff: false,
    attendance: false,
    payroll: false,
    performance: false,
    recruitment: false,
  });

  const toggleSubmenu = (key) => {
    setOpenSubmenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const navItems = NAV_ITEMS;

  // Only the screens this person's role can use (the server enforces the same rules)
  const visibleNav = navFor(currentUser?.role);

  return (
    <aside
      className={clsx(
        'fixed lg:static inset-y-0 left-0 z-40 bg-white text-slate-700 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-200 shadow-sm font-sans',
        collapsed ? 'w-20' : 'w-64',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      {/* Brand Header matching Figma Screens */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5 overflow-hidden cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20 flex-shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
          {!collapsed && (
            <span className="font-black text-slate-900 text-lg tracking-tight leading-none">
              NexusHR
            </span>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation Items */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleNav.map((item) => {
          const Icon = item.icon;
          const isMainActive = activeTab === item.id || (item.children && item.children.some(c => c.id === activeTab));
          const isSubmenuOpen = openSubmenus[item.id];

          if (!item.hasDropdown) {
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={clsx(
                  'w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-150 group shadow-sm',
                  isMainActive
                    ? 'bg-emerald-500 text-white shadow-emerald-500/25'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={clsx('w-5 h-5 flex-shrink-0', isMainActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600')} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && <LayoutGrid className={clsx('w-4 h-4', isMainActive ? 'text-white' : 'text-slate-300')} />}
              </button>
            );
          }

          // Collapsed to icons there's no room for the submenu, so the icon opens it as a dropdown beside the bar
          if (collapsed) {
            return (
              <DropdownMenu
                key={item.id}
                side
                ariaLabel={`${item.label} menu`}
                title={item.label}
                label={<Icon className={clsx('w-5 h-5 flex-shrink-0', isMainActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600')} />}
                buttonClassName={clsx(
                  'w-full flex items-center justify-center px-4 py-3 rounded-2xl transition-all duration-150 group',
                  isMainActive ? 'bg-emerald-500 shadow-sm shadow-emerald-500/25' : 'hover:bg-slate-50'
                )}
                items={item.children.map((sub) => ({
                  label: sub.label,
                  onSelect: () => { setActiveTab(sub.id); setMobileOpen(false); },
                  icon: <span className={clsx('w-1.5 h-1.5 rounded-full', activeTab === sub.id ? 'bg-emerald-500' : 'bg-transparent')} />
                }))}
              />
            );
          }

          return (
            <div key={item.id} className="space-y-1">
              <button
                onClick={() => {
                  if (item.children && item.children.length > 0) {
                    setActiveTab(item.children[0].id);
                  }
                  toggleSubmenu(item.id);
                }}
                className={clsx(
                  'w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-150 group',
                  isMainActive
                    ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/25'
                    : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon className={clsx('w-5 h-5 flex-shrink-0', isMainActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600')} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
                {!collapsed && (
                  <ChevronDown
                    className={clsx(
                      'w-4 h-4 transition-transform duration-200',
                      isMainActive ? 'text-white' : 'text-slate-400',
                      isSubmenuOpen && 'transform rotate-180'
                    )}
                  />
                )}
              </button>

              {/* Submenu Accordion Items matching Screens */}
              {!collapsed && isSubmenuOpen && item.children && (
                <div className="pl-10 pr-2 py-1 space-y-1 border-l-2 border-slate-100 ml-5">
                  {item.children.map((sub) => {
                    const isSubActive = activeTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setActiveTab(sub.id);
                          setMobileOpen(false);
                        }}
                        className={clsx(
                          'w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors block truncate',
                          isSubActive
                            ? 'text-slate-900 font-bold bg-slate-100/80'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        )}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        {/* System Settings & Help Center Section matching Screens */}
        <div className="pt-4 space-y-1 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('helpcenter')}
            className={clsx(
              'w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold transition-colors',
              activeTab === 'helpcenter'
                ? 'bg-emerald-50 text-emerald-700 font-black'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center gap-3">
              <HelpCircle className={clsx('w-4 h-4', activeTab === 'helpcenter' ? 'text-emerald-600' : 'text-slate-400')} />
              {!collapsed && <span>Help Center</span>}
            </div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={clsx(
              'w-full flex items-center justify-between px-4 py-2.5 rounded-2xl text-xs font-bold transition-colors',
              (activeTab === 'settings' || activeTab === 'setting')
                ? 'bg-emerald-50 text-emerald-700 font-black'
                : 'text-slate-600 hover:bg-slate-50'
            )}
          >
            <div className="flex items-center gap-3">
              <Settings className={clsx('w-4 h-4', (activeTab === 'settings' || activeTab === 'setting') ? 'text-emerald-600' : 'text-slate-400')} />
              {!collapsed && <span>Setting</span>}
            </div>
          </button>
        </div>
      </div>

      {/* Light / Dark Mode Toggle Footer */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-100 bg-slate-50/50">
          <div className="p-1 rounded-2xl bg-slate-200/60 flex items-center">
            <button
              onClick={() => setThemeMode('light')}
              className={clsx(
                'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                themeMode === 'light' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span>Light</span>
            </button>
            <button
              onClick={() => setThemeMode('dark')}
              className={clsx(
                'flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5',
                themeMode === 'dark' ? 'bg-slate-900 text-white shadow-xs' : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Moon className="w-3.5 h-3.5 text-indigo-400" />
              <span>Dark</span>
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};
