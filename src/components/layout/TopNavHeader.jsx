import React, { useState } from 'react';
import { Search, Bell, Clock, ChevronDown, Shield } from 'lucide-react';
import { useInbox } from '../../context/InboxContext';
import { useApp } from '../../context/AppContext';
import Avatar from '../common/Avatar';
import DropdownMenu from '../common/DropdownMenu';
import NotificationPopup from '../notifications/NotificationPopup';
import { navFor, FOOTER_ITEMS, isActiveItem } from './navItems';

/**
 * The top-bar layout: the same menu as the sidebar (navItems.js), with each group as a dropdown
 * of its screens, filtered to what this person's role may use.
 */
export const TopNavHeader = ({ activeTab, setActiveTab, onOpenPunchModal, onOpenProfileModal }) => {
  const { unread } = useInbox();
  const { searchQuery, setSearchQuery, activeSession, currentUser } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const menu = [...navFor(currentUser?.role), ...FOOTER_ITEMS];

  const itemClass = (active) => `flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
    active ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/20' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
  }`;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 flex items-center justify-between gap-4">
        <button type="button" className="flex items-center gap-2.5" onClick={() => setActiveTab('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
            <Shield className="w-5 h-5" />
          </div>
          <span className="text-base font-black tracking-tight text-slate-900">NexusHR</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="relative w-48 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              data-global-search
              aria-keyshortcuts="Alt+/"
              className="w-full pl-9 pr-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <button
            onClick={onOpenPunchModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700"
          >
            <Clock className="w-4 h-4 text-emerald-600" />
            <span className="hidden sm:inline">{activeSession ? 'PUNCHED IN' : 'PUNCHED OUT'}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              aria-label="View system notifications"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute top-1 right-1 h-4 min-w-[16px] px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
            <NotificationPopup
              isOpen={showNotifications}
              onClose={() => setShowNotifications(false)}
              onShowAll={() => { setShowNotifications(false); setActiveTab('notifications-all'); }}
              onOpenSettings={() => { setShowNotifications(false); setActiveTab('notification-settings'); }}
              onNavigate={(tab) => setActiveTab(tab)}
            />
          </div>

          <button type="button" onClick={onOpenProfileModal} title="Click to view & edit Profile" className="rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/40">
            <Avatar src={currentUser.avatar} name={currentUser.name} className="w-8 h-8 rounded-full border border-emerald-500 text-[11px]" />
          </button>
        </div>
      </div>

      {/* Navigation row: groups open a dropdown of their screens (it wraps rather than scrolls, so menus aren't clipped) */}
      <nav aria-label="Main" className="bg-slate-50/80 border-t border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 flex flex-wrap items-center gap-1 py-1">
          {menu.map((item) => {
            const Icon = item.icon;
            const active = isActiveItem(item, activeTab) || (item.id === 'settings' && activeTab === 'setting');
            if (!item.children) {
              return (
                <button key={item.id} type="button" onClick={() => setActiveTab(item.id)} className={itemClass(active)}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            }
            return (
              <div key={item.id} className="w-auto">
                <DropdownMenu
                  ariaLabel={`${item.label} menu`}
                  label={<><Icon className="w-3.5 h-3.5" /><span>{item.label}</span><ChevronDown className="w-3 h-3 opacity-70" /></>}
                  buttonClassName={itemClass(active)}
                  items={item.children.map((child) => ({
                    label: child.label,
                    onSelect: () => setActiveTab(child.id),
                    icon: <span className={`w-1.5 h-1.5 rounded-full ${activeTab === child.id ? 'bg-emerald-500' : 'bg-transparent'}`} />
                  }))}
                />
              </div>
            );
          })}
        </div>
      </nav>
    </header>
  );
};
