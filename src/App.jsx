import React, { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthContainer } from './components/auth/AuthContainer';
import { RequiredPasswordChange } from './components/auth/RequiredPasswordChange';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { TopNavHeader } from './components/layout/TopNavHeader';
import { useKeyboardShortcuts } from './utils/keyboardShortcuts';
import { KpiCards } from './components/dashboard/KpiCards';
import { AttendanceChart } from './components/dashboard/AttendanceChart';
import { DepartmentDonut } from './components/dashboard/DepartmentDonut';
import { PendingApprovals } from './components/dashboard/PendingApprovals';
import { EmployeeDirectory } from './components/directory/EmployeeDirectory';
import { DirectoryCardsView } from './components/directory/DirectoryCardsView';
import { OrgChartView } from './components/directory/OrgChartView';
import { MyTimeOffView } from './components/timeoff/MyTimeOffView';
import { TeamTimeOffView } from './components/timeoff/TeamTimeOffView';
import { EmployeeTimeOffView } from './components/timeoff/EmployeeTimeOffView';
import { TimeOffSettingsView } from './components/timeoff/TimeOffSettingsView';
import { MyAttendanceView } from './components/attendance/MyAttendanceView';
import { TeamAttendanceView } from './components/attendance/TeamAttendanceView';
import { AttendanceSettingsView } from './components/attendance/AttendanceSettingsView';
import { PayrollManagerView } from './components/payroll/PayrollManagerView';
import { PayrollSettingsView } from './components/payroll/PayrollSettingsView';
import { RecruitmentManagerView } from './components/recruitment/RecruitmentManagerView';
import { CandidatesRosterView } from './components/recruitment/CandidatesRosterView';
import { RecruitmentSettingsView } from './components/recruitment/RecruitmentSettingsView';
import UserProfileModal from './components/profile/UserProfileModal';
import { InboxProvider } from './context/InboxContext';
import { canSeeTab } from './utils/access';

import { DepartmentGrid } from './components/departments/DepartmentGrid';
import { AuditLogsView } from './components/analytics/AuditLogsView';
import { SkeletonView } from './components/dashboard/SkeletonView';
import { PunchModal } from './components/modals/PunchModal';
import { LeaveRequestModal } from './components/modals/LeaveRequestModal';
import { WelcomeModal } from './components/modals/WelcomeModal';
import { Toast } from './components/common/Toast';
import { Shield } from 'lucide-react';
import { Badge } from './components/common/Badge';

// Lazy Loaded Components for Code-Splitting and Bundle Optimization
const DocumentsManagerView = lazy(() => import('./components/documents/DocumentsManagerView'));
const ChecklistManagerView = lazy(() => import('./components/checklist/ChecklistManagerView'));
const NewsManagerView = lazy(() => import('./components/news/NewsManagerView'));
const ReportsManagerView = lazy(() => import('./components/reports/ReportsManagerView'));
const SystemSettingsManagerView = lazy(() => import('./components/settings/SystemSettingsManagerView'));
const NotificationViewAll = lazy(() => import('./components/notifications/NotificationViewAll'));
const MessagesView = lazy(() => import('./components/messages/MessagesView'));
const HelpCenterManagerView = lazy(() => import('./components/helpcenter/HelpCenterManagerView'));

const ComponentLoader = () => (
  <div className="py-12 flex items-center justify-center space-x-2 animate-pulse text-emerald-600 font-bold text-xs">
    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <span className="ml-2 text-slate-600">Loading Module...</span>
  </div>
);

const MainLayout = () => {
  const {
    isAuthenticated,
    logout,
    toast,
    currentUser,
    skeletonLoading,
    setSkeletonLoading,
    triggerSkeletonLoading,
    demoMode,
    showToast
  } = useApp();
  // Back from Stripe (?billing=...): open Settings > Subscription, which confirms the payment
  const [billingReturn, setBillingReturn] = useState(() => new URLSearchParams(window.location.search).has('billing'));
  const [activeTab, setActiveTabState] = useState(() => (billingReturn ? 'settings' : 'dashboard'));
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Helper for Tab Changes with State Managed Skeleton Loading Effect
  const setActiveTab = (newTab) => {
    // Shortcuts, header links and notifications can't open a screen this role can't use
    if (!canSeeTab(newTab, currentUser?.role)) {
      showToast("You don't have access to that screen.", 'info');
      return;
    }
    setBillingReturn(false);
    if (newTab !== activeTab) {
      triggerSkeletonLoading(350);
      setActiveTabState(newTab);
    }
  };

  // Figma Switcher & State Toggles
  // 'v1' (left sidebar) or 'v2' (top bar with dropdown menus); remembered on this browser
  const [layoutVariant, setLayoutVariantState] = useState(() => {
    try { return localStorage.getItem('nexushr.layout') === 'v2' ? 'v2' : 'v1'; } catch { return 'v1'; }
  });
  const setLayoutVariant = (v) => {
    setLayoutVariantState(v);
    try { localStorage.setItem('nexushr.layout', v); } catch { /* storage unavailable */ }
  };
  const [skeletonMode, setSkeletonMode] = useState(false);
  const [isWelcomeModalOpen, setIsWelcomeModalOpen] = useState(false);

  // Modal Dialog States
  const [isPunchModalOpen, setIsPunchModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Alt/Option shortcuts (listed in Help Center > Keyboard Shortcuts); only once signed in
  useKeyboardShortcuts({ enabled: isAuthenticated && Boolean(currentUser), navigate: setActiveTab });

  // This layout outlives logout, so a new sign-in starts on the dashboard rather than on the
  // previous person's screen (which their role may not be allowed to see)
  const lastUserId = useRef(currentUser?.id);
  useEffect(() => {
    if (!currentUser?.id || currentUser.id === lastUserId.current) return;
    if (lastUserId.current !== undefined) setActiveTabState('dashboard');
    lastUserId.current = currentUser.id;
  }, [currentUser?.id]);

  // Render Auth Flow if user is logged out (Matching Image 1 - 5)
  if (!isAuthenticated) {
    return (
      <>
        <AuthContainer />
        <Toast toast={toast} onClose={() => {}} />
      </>
    );
  }

  // Stored token is being verified; the user profile is not known yet
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <ComponentLoader />
      </div>
    );
  }

  // A password someone else set must be replaced before anything else
  if (currentUser.mustChangePassword) {
    return (
      <>
        <RequiredPasswordChange />
        <Toast toast={toast} onClose={() => {}} />
      </>
    );
  }

  return (
    <InboxProvider>
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 font-sans">
      {/* Never let demo data pass for real data (only possible in local development) */}
      {demoMode && (
        <div role="alert" className="sticky top-0 z-50 bg-amber-500 text-slate-900 text-xs font-bold text-center px-4 py-2">
          Can't reach the NexusHR server: showing local demo data. Nothing you do here is saved.
        </div>
      )}
      {/* Top Header Layout (V2 Horizontal Nav) vs Left Sidebar Layout (V1) */}
      {layoutVariant === 'v2' ? (
        <TopNavHeader
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenPunchModal={() => setIsPunchModalOpen(true)}
          onOpenProfileModal={() => setIsProfileModalOpen(true)}
        />
      ) : (
        /* V1 Left Sidebar Container */
        <div className="flex-1 flex min-w-0">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            collapsed={sidebarCollapsed}
            setCollapsed={setSidebarCollapsed}
            mobileOpen={mobileSidebarOpen}
            setMobileOpen={setMobileSidebarOpen}
          />

          {mobileSidebarOpen && (
            <div
              onClick={() => setMobileSidebarOpen(false)}
              className="fixed inset-0 z-30 bg-slate-900/50 backdrop-blur-xs lg:hidden"
            />
          )}

          <div className="flex-1 flex flex-col min-w-0">
            <Header
              onOpenPunchModal={() => setIsPunchModalOpen(true)}
              onOpenLeaveModal={() => setIsLeaveModalOpen(true)}
              onOpenProfileModal={() => setIsProfileModalOpen(true)}
              onToggleMobileSidebar={() => setMobileSidebarOpen(!mobileSidebarOpen)}
              setActiveTab={setActiveTab}
            />

            <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
              {(skeletonMode || skeletonLoading) ? (
                <SkeletonView variant={layoutVariant} />
              ) : (
                <Suspense fallback={<SkeletonView variant={layoutVariant} />}>
                  {activeTab === 'dashboard' && (
                    <>
                      {/* Top Banner Alert */}
                      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5 z-10">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md">
                            <Shield className="w-3.5 h-3.5 text-emerald-300" />
                            <span>NexusHR Enterprise Specification v1.0.0</span>
                          </div>
                          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                            Operational Cockpit & Headcount Intelligence (Home V1)
                          </h1>
                          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                            Real-time workforce headcount metrics, grace window punctuality algorithms, and manager approval queues.
                          </p>
                        </div>
                        <div className="flex items-center gap-3 z-10 self-start md:self-auto">
                          <button
                            onClick={() => setIsWelcomeModalOpen(true)}
                            className="px-3.5 py-2.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 text-xs font-bold border border-emerald-500/40 backdrop-blur-sm transition-all"
                          >
                            Welcome App Popup
                          </button>
                          <button
                            onClick={() => setIsPunchModalOpen(true)}
                            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
                          >
                            Shift Clock Punch
                          </button>
                        </div>
                      </div>

                      {/* 1. KPI Metric Cards */}
                      <KpiCards variant="v1" />

                      {/* 2. Charts Grid */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <AttendanceChart />
                        </div>
                        <div className="lg:col-span-1">
                          <DepartmentDonut />
                        </div>
                      </div>

                      {/* 3. Pending Approvals Stream & RBAC Compliance Matrix */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <PendingApprovals />
                        </div>
                        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/90 p-5 shadow-card flex flex-col justify-between">
                          <div className="flex items-center justify-between gap-2 mb-3">
                            <h3 className="font-bold text-slate-900 text-base">RBAC Compliance Matrix</h3>
                            <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">v1.0 Baseline</span>
                          </div>
                          <div className="space-y-2.5 text-xs">
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                              <span className="font-semibold text-slate-700">Super Admin</span>
                              <Badge status="OPTIMAL" text="Full Control" size="xs" />
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                              <span className="font-semibold text-slate-700">HR Manager</span>
                              <Badge status="ACTIVE" text="Read / Write" size="xs" />
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                              <span className="font-semibold text-slate-700">People Manager</span>
                              <Badge status="ON_LEAVE" text="Direct Reports" size="xs" />
                            </div>
                            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                              <span className="font-semibold text-slate-700">Employee</span>
                              <Badge status="CANCELLED" text="Self Profile" size="xs" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  {activeTab === 'employees' && <EmployeeDirectory />}
                  {activeTab === 'employees-directory' && <DirectoryCardsView />}
                  {activeTab === 'employees-org' && <OrgChartView />}

                  {activeTab === 'attendance' && <MyAttendanceView />}
                  {activeTab === 'team-attendance' && <TeamAttendanceView title="Team Attendance" />}
                  {activeTab === 'employee-attendance' && <TeamAttendanceView title="Employee Attendance" />}
                  {activeTab === 'attendance-settings' && <AttendanceSettingsView />}

                  {activeTab === 'leave' && <MyTimeOffView />}
                  {activeTab === 'team-time-off' && <TeamTimeOffView />}
                  {activeTab === 'employee-time-off' && <EmployeeTimeOffView />}
                  {activeTab === 'time-off-settings' && <TimeOffSettingsView />}

                  {activeTab === 'payroll' && <PayrollManagerView />}
                  {activeTab === 'payroll-settings' && <PayrollSettingsView />}
                  {activeTab === 'departments' && <DepartmentGrid />}
                  {(activeTab === 'recruitment' || activeTab === 'recruitment-jobs') && <RecruitmentManagerView />}
                  {activeTab === 'recruitment-candidates' && <CandidatesRosterView />}
                  {activeTab === 'recruitment-settings' && <RecruitmentSettingsView />}
                  {activeTab === 'documents' && <DocumentsManagerView />}
                  {(activeTab === 'checklist' || activeTab.startsWith('checklist-')) && <ChecklistManagerView activeSubTab={activeTab} />}
                  {activeTab === 'news' && <NewsManagerView />}
                  {(activeTab === 'analytics' || activeTab === 'reports') && <ReportsManagerView />}
                  {activeTab === 'analytics-audit' && <AuditLogsView />}
                  {(activeTab === 'settings' || activeTab === 'setting' || activeTab === 'notification-settings') && <SystemSettingsManagerView initialTab={activeTab === 'notification-settings' ? 'notification' : billingReturn ? 'subscription' : undefined} />}
                  {activeTab === 'notifications-all' && <NotificationViewAll onNavigate={setActiveTab} />}
                  {activeTab === 'messages' && <MessagesView />}
                  {(activeTab === 'helpcenter' || activeTab === 'help-center') && <HelpCenterManagerView />}
                </Suspense>
              )}
            </main>
          </div>
        </div>
      )}

      {/* Main Container Area for V2 Top Nav */}
      {layoutVariant === 'v2' && (
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {skeletonMode ? (
            <SkeletonView variant="v2" />
          ) : (
            <Suspense fallback={<ComponentLoader />}>
              {activeTab === 'dashboard' && (
                <>
                  {/* Top Banner Alert for Home V2 */}
                  <div className="bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white rounded-2xl p-6 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 z-10">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white text-xs font-semibold backdrop-blur-md">
                        <Shield className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Figma Baseline Screen 17 (Home V2)</span>
                      </div>
                      <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                        Employment Type Breakdown & Workforce Analytics (Home V2)
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
                        Permanent, Contract, Freelance, and Internship headcount breakdown with horizontal drop-down navigation.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 z-10 self-start md:self-auto">
                      <button
                        onClick={() => setIsWelcomeModalOpen(true)}
                        className="px-3.5 py-2.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-300 text-xs font-bold border border-emerald-500/40 backdrop-blur-sm transition-all"
                      >
                        Welcome App Popup
                      </button>
                      <button
                        onClick={() => setIsPunchModalOpen(true)}
                        className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all"
                      >
                        Shift Clock Punch
                      </button>
                    </div>
                  </div>

                  {/* KPI Metric Cards */}
                  <KpiCards variant="v2" />

                  {/* Charts Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2">
                      <AttendanceChart />
                    </div>
                    <div className="lg:col-span-1">
                      <DepartmentDonut />
                    </div>
                  </div>

                  {/* Approvals */}
                  <PendingApprovals />
                </>
              )}

              {activeTab === 'employees' && <EmployeeDirectory />}
              {activeTab === 'employees-directory' && <DirectoryCardsView />}
              {activeTab === 'employees-org' && <OrgChartView />}
              {activeTab === 'attendance' && <MyAttendanceView />}
              {activeTab === 'team-attendance' && <TeamAttendanceView title="Team Attendance" />}
              {activeTab === 'employee-attendance' && <TeamAttendanceView title="Employee Attendance" />}
              {activeTab === 'attendance-settings' && <AttendanceSettingsView />}
              {activeTab === 'leave' && <MyTimeOffView />}
              {activeTab === 'team-time-off' && <TeamTimeOffView />}
              {activeTab === 'employee-time-off' && <EmployeeTimeOffView />}
              {activeTab === 'time-off-settings' && <TimeOffSettingsView />}
              {activeTab === 'payroll' && <PayrollManagerView />}
              {activeTab === 'payroll-settings' && <PayrollSettingsView />}
              {activeTab === 'departments' && <DepartmentGrid />}
              {(activeTab === 'recruitment' || activeTab === 'recruitment-jobs') && <RecruitmentManagerView />}
              {activeTab === 'recruitment-candidates' && <CandidatesRosterView />}
              {activeTab === 'recruitment-settings' && <RecruitmentSettingsView />}
              {activeTab === 'documents' && <DocumentsManagerView />}
              {(activeTab === 'checklist' || activeTab.startsWith('checklist-')) && <ChecklistManagerView activeSubTab={activeTab} />}
              {activeTab === 'news' && <NewsManagerView />}
              {(activeTab === 'analytics' || activeTab === 'reports') && <ReportsManagerView />}
              {activeTab === 'analytics-audit' && <AuditLogsView />}
              {(activeTab === 'settings' || activeTab === 'setting' || activeTab === 'notification-settings') && <SystemSettingsManagerView initialTab={activeTab === 'notification-settings' ? 'notification' : billingReturn ? 'subscription' : undefined} />}
              {activeTab === 'notifications-all' && <NotificationViewAll onNavigate={setActiveTab} />}
              {activeTab === 'messages' && <MessagesView />}
              {(activeTab === 'helpcenter' || activeTab === 'help-center') && <HelpCenterManagerView />}
            </Suspense>
          )}
        </main>
      )}

      {/* Global Interactive Modals */}
      <PunchModal isOpen={isPunchModalOpen} onClose={() => setIsPunchModalOpen(false)} />
      <LeaveRequestModal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} />
      <WelcomeModal isOpen={isWelcomeModalOpen} onClose={() => setIsWelcomeModalOpen(false)} />
      <UserProfileModal isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

      {/* Notification Toast Alert */}
      <Toast toast={toast} onClose={() => {}} />
    </div>
    </InboxProvider>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
