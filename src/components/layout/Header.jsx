import React, { useState } from 'react';
import {
  Search,
  Bell,
  MessageSquare,
  Clock,
  Plus,
  Menu,
  X
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Badge } from '../common/Badge';
import NotificationPopup from '../notifications/NotificationPopup';
import { useInbox } from '../../context/InboxContext';
import Avatar from '../common/Avatar';

export const Header = ({ onOpenPunchModal, onOpenLeaveModal, onOpenProfileModal, onToggleMobileSidebar, setActiveTab }) => {
  const { searchQuery, setSearchQuery, activeSession, currentUser } = useApp();
  const [showNotifications, setShowNotifications] = useState(false);
  const { unread, unreadMessages } = useInbox();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 flex items-center justify-between gap-4 transition-all font-sans">
      {/* Left Area: Mobile Toggle, Global Search & Top Quick Links */}
      <div className="flex items-center gap-4 flex-1 max-w-2xl">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label="Toggle mobile navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Search Bar */}
        <div className="relative w-full max-w-xs sm:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search anything..."
            data-global-search
            aria-keyshortcuts="Alt+/"
            className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Top Header Quick Links matching Figma Top Bar */}
        <div className="hidden md:flex items-center gap-5 text-xs font-semibold text-slate-600">
          <button
            onClick={() => setActiveTab && setActiveTab('documents')}
            className="hover:text-emerald-600 transition-colors"
          >
            Documents
          </button>
          <button
            onClick={() => setActiveTab && setActiveTab('news')}
            className="hover:text-emerald-600 transition-colors"
          >
            News
          </button>
          <button
            onClick={() => setActiveTab && setActiveTab('payroll')}
            className="hover:text-emerald-600 transition-colors"
          >
            Payslip
          </button>
          <button
            onClick={() => setActiveTab && setActiveTab('analytics')}
            className="hover:text-emerald-600 transition-colors"
          >
            Report
          </button>
        </div>
      </div>

      {/* Right Area: Messages, Notifications, Punch & Profile */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Quick Shift Punch Action Widget */}
        <button
          onClick={onOpenPunchModal}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 transition-all shadow-card hover:shadow-card-hover group"
          title="Click to record Shift Punch event"
        >
          <div className="relative">
            <Clock className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            {activeSession && (
              <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            )}
          </div>
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Shift Clock</span>
            <span className="text-xs font-semibold text-slate-800">
              {activeSession ? 'PUNCHED IN' : 'PUNCHED OUT'}
            </span>
          </div>
          <Badge
            status={activeSession ? activeSession.status : 'CANCELLED'}
            text={activeSession ? activeSession.status : 'OFFLINE'}
            size="xs"
            className="hidden md:inline-flex ml-1"
          />
        </button>

        {/* Leave Request Button */}
        <button
          onClick={onOpenLeaveModal}
          className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Apply Leave</span>
        </button>

        {/* Messages Header Link (Screen 129 & 130) */}
        <button
          onClick={() => setActiveTab && setActiveTab('messages')}
          className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
          title={unreadMessages ? `Messages (${unreadMessages} unread)` : 'Messages'}
        >
          <MessageSquare className="w-5 h-5" />
          {unreadMessages > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-emerald-500 text-[10px] font-bold text-white flex items-center justify-center">{unreadMessages}</span>}
        </button>

        {/* Notifications Popover Trigger (Screen 126) */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            aria-label="View system notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unread > 0 && <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center">{unread}</span>}
          </button>

          {/* Screen 126: Notification Dropdown Popup */}
          <NotificationPopup
            isOpen={showNotifications}
            onClose={() => setShowNotifications(false)}
            onShowAll={() => {
              setShowNotifications(false);
              if (setActiveTab) setActiveTab('notifications-all');
            }}
            onOpenSettings={() => {
              setShowNotifications(false);
              if (setActiveTab) setActiveTab('notification-settings');
            }}
            onNavigate={(tab) => setActiveTab && setActiveTab(tab)}
          />
        </div>

        {/* User Profile Avatar */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <button
            onClick={onOpenProfileModal}
            className="group flex items-center gap-2 text-left focus:outline-none"
            title="Click to view & edit Profile"
          >
            <Avatar src={currentUser.avatar} name={currentUser.name} className="w-9 h-9 rounded-full border-2 border-emerald-500/30 group-hover:border-emerald-500 transition-colors text-xs" />
          </button>
        </div>
      </div>
    </header>
  );
};
