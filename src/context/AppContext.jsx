import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  // Authentication Session State: signed out unless a stored token is confirmed by the backend
  const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(api.getToken()));
  const [currentUser, setCurrentUser] = useState(null);

  // Global State Variables
  const [metrics, setMetrics] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [attendanceTrends, setAttendanceTrends] = useState([]);
  const [departments, setDepartments] = useState([]);

  // Global Session and Alert State
  const [activeSession, setActiveSession] = useState(null);
  // True while the app shows local demo data because the server is unreachable (development only)
  const [demoMode, setDemoMode] = useState(false);
  const [toast, setToast] = useState(null);

  // Loading & Skeleton State Management
  const [loading, setLoading] = useState(false);
  const [skeletonLoading, setSkeletonLoading] = useState(false);

  // Filters State for Employee Roster
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');

  const triggerSkeletonLoading = useCallback((durationMs = 500) => {
    setSkeletonLoading(true);
    const timer = setTimeout(() => {
      setSkeletonLoading(false);
    }, durationMs);
    return () => clearTimeout(timer);
  }, []);

  // Theme Mode State ('dark' or 'light', default to 'dark')
  const [themeMode, setThemeMode] = useState(() => {
    return localStorage.getItem('nexushr_theme') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('nexushr_theme', themeMode);
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [themeMode]);

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const toSessionUser = (user) => ({
    id: user.id,
    name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    role: user.role,
    email: user.email,
    avatar: user.avatar || null, // no photo on record: screens show initials
    department: user.department || user.department_name,
    job_title: user.job_title || '',
    // Someone else set this password (HR, a temporary password): a new one is needed before the app opens
    mustChangePassword: Boolean(user.must_change_password)
  });

  // After the person edits their own profile, keep the header and menus in step
  const updateCurrentUser = useCallback((user) => {
    setCurrentUser((prev) => (prev && user ? { ...prev, ...toSessionUser(user) } : prev));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const endSession = useCallback(() => {
    setIsAuthenticated(false);
    setCurrentUser(null);
  }, []);

  // Restore the session from a stored token, and sign out whenever the backend rejects it
  useEffect(() => {
    api.onDemoModeChange = setDemoMode;
    api.onUnauthorized = () => {
      endSession();
      showToast('Your session has expired. Please sign in again.', 'info');
    };
    api.onPasswordChangeRequired = () => setCurrentUser((prev) => (prev ? { ...prev, mustChangePassword: true } : prev));
    if (api.getToken()) {
      api.getCurrentUser()
        .then((user) => (user ? setCurrentUser(toSessionUser(user)) : endSession()))
        .catch(() => endSession());
    }
    return () => { api.onUnauthorized = null; api.onDemoModeChange = null; api.onPasswordChangeRequired = null; };
  }, [endSession]);

  // Credentials are verified by the backend; its error message is shown on failure
  const login = async ({ email, password, rememberMe = true }) => {
    const normalizedEmail = email ? email.toLowerCase().trim() : '';
    const { user } = await api.login({ email: normalizedEmail, password, remember: rememberMe });
    const sessionUser = toSessionUser(user);
    setCurrentUser(sessionUser);
    setIsAuthenticated(true);
    if (sessionUser.mustChangePassword) showToast('Please choose your own password to continue.', 'info');
    else showToast(`Welcome back, ${sessionUser.name}!`, 'success');
  };

  const loginWithGoogle = async ({ credential, rememberMe = true }) => {
    const { user } = await api.googleLogin({ credential, remember: rememberMe });
    const sessionUser = toSessionUser(user);
    setCurrentUser(sessionUser);
    setIsAuthenticated(true);
    if (sessionUser.mustChangePassword) showToast('Please choose your own password to continue.', 'info');
    else showToast(`Welcome back, ${sessionUser.name}!`, 'success');
  };

  // First sign-in with a password someone else set: replace it, then open the app. The server
  // answers with a new session token (older sessions end), which api.changePassword stores.
  const completeRequiredPasswordChange = async (currentPassword, newPassword) => {
    await api.changePassword(currentPassword, newPassword);
    const user = await api.getCurrentUser();
    if (!user) { endSession(); return; }
    setCurrentUser(toSessionUser(user));
    showToast(`Password saved. Welcome, ${user.name || user.first_name || ''}!`.replace(', !', '!'), 'success');
  };

  // Company sign-up: creates the workspace and its first administrator, then signs them in
  const registerCompany = async ({ name, email, password, companyName, workspace, industry, companySize, emailCode }) => {
    const { user, tenant } = await api.register({
      name: name.trim(), email: email.toLowerCase().trim(), password, companyName: companyName.trim(), workspace, industry, companySize, emailCode
    });
    const sessionUser = toSessionUser(user);
    setCurrentUser(sessionUser);
    setIsAuthenticated(true);
    showToast(`Welcome to NexusHR, ${sessionUser.name}! Your workspace "${tenant?.domain || workspace}" is ready.`, 'success');
  };

  const logout = () => {
    api.logout();
    endSession();
    showToast('Logged out of session safely.', 'info');
  };

  // Refresh Metrics
  const loadDashboardMetrics = useCallback(async () => {
    try {
      const res = await api.getDashboardMetrics();
      if (res.status === 'success') {
        setMetrics(res.data);
      }
    } catch (err) {
      console.error('Failed to load metrics:', err);
      showToast('Failed to connect to NexusHR API gateway.', 'error');
    }
  }, []);

  // Load Employees with Filters
  const loadEmployees = useCallback(async () => {
    try {
      const res = await api.getEmployees({
        search: searchQuery,
        department: deptFilter,
        status: statusFilter,
        role: roleFilter,
      });
      setEmployees(res.data);
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  }, [searchQuery, deptFilter, statusFilter, roleFilter]);

  const loadLeaveRequests = useCallback(async () => {
    try {
      setLeaveRequests(await api.getLeaveRequests());
    } catch (err) {
      console.error('Failed to load leave requests:', err);
    }
  }, []);

  // Initial Data Ingestion (re-runs when the signed-in user changes)
  // Nothing loads until a required password change is done (the server refuses it anyway)
  const readyForData = Boolean(currentUser) && !currentUser.mustChangePassword;
  useEffect(() => {
    if (!readyForData) return;
    const initializeData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          loadDashboardMetrics(),
          loadLeaveRequests(),
          api.getAttendanceTrends().then(setAttendanceTrends),
          api.getDepartmentDistribution().then(setDepartments),
          api.getActiveSession().then(setActiveSession)
        ]);
      } catch (err) {
        console.error('Failed to load initial data:', err);
        showToast('Failed to connect to NexusHR API gateway.', 'error');
      } finally {
        setLoading(false);
      }
    };
    initializeData();
  }, [loadDashboardMetrics, loadLeaveRequests, currentUser?.id, readyForData]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (readyForData) loadEmployees();
  }, [loadEmployees, currentUser?.id, readyForData]); // eslint-disable-line react-hooks/exhaustive-deps

  // Punch Event Handler (BR-ATT-001)
  const handlePunchEvent = async () => {
    try {
      const res = await api.registerPunchEvent({ employeeId: currentUser.id });
      setActiveSession(res.action === 'PUNCH_OUT' ? null : res.data);
      showToast(res.message, res.data?.status === 'LATE' ? 'warning' : 'success');
      await loadDashboardMetrics();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Submit Leave Request (REQ-LEV-001, BR-LEV-001)
  const handleLeaveSubmission = async (payload) => {
    try {
      const res = await api.submitLeaveRequest(payload);
      await loadLeaveRequests();
      showToast(`Leave request submitted successfully. Days requested: ${payload.daysRequested}.`, 'success');
      await loadDashboardMetrics();
      await loadEmployees();
      return res;
    } catch (err) {
      showToast(err.message, 'error');
      throw err;
    }
  };

  // Update Leave Request Status
  const handleLeaveStatusUpdate = async (requestId, action, reason = '') => {
    const previousRequests = [...leaveRequests];
    setLeaveRequests(prev =>
      prev.map(r => r.id === requestId ? { ...r, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' } : r)
    );

    try {
      const res = await api.updateLeaveRequestStatus(requestId, { action, reason });
      await loadLeaveRequests();
      showToast(res.message, action === 'APPROVE' ? 'success' : 'info');
      await loadDashboardMetrics();
      await loadEmployees();
    } catch (err) {
      setLeaveRequests(previousRequests);
      showToast(err.message, 'error');
    }
  };

  // Terminate Employee (REQ-EMP-003)
  const handleTerminateEmployee = async (employeeId) => {
    try {
      const res = await api.terminateEmployee(employeeId);
      showToast(res.message, 'warning');
      await loadEmployees();
      await loadDashboardMetrics();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <AppContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        updateCurrentUser,
        login,
        loginWithGoogle,
        registerCompany,
        completeRequiredPasswordChange,
        logout,
        metrics,
        employees,
        leaveRequests,
        attendanceTrends,
        departments,
        activeSession,
        loading,
        toast,
        searchQuery,
        setSearchQuery,
        deptFilter,
        setDeptFilter,
        statusFilter,
        setStatusFilter,
        roleFilter,
        setRoleFilter,
        handlePunchEvent,
        handleLeaveSubmission,
        loadLeaveRequests,
        demoMode,
        handleLeaveStatusUpdate,
        handleTerminateEmployee,
        showToast,
        loadEmployees,
        themeMode,
        setThemeMode,
        setLoading,
        skeletonLoading,
        setSkeletonLoading,
        triggerSkeletonLoading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
