/**
 * NexusHR Platform API Client
 * Talks to the NexusHR backend at VITE_API_BASE_URL (SRS Section 7 & 8):
 * - POST /auth/login, /auth/logout
 * - GET  /dashboard/metrics
 * - GET  /employees (with debounced search & facet filtering)
 * - POST /employees (provision employee profile)
 * - DELETE /employees/{id} (soft delete TERMINATED protocol)
 * - POST /attendance/punch (punch in/out with 15-min grace window & server time validation)
 * - GET  /attendance/records, /attendance/active-session, /attendance/trends
 * - GET  /timeoff/requests
 * - POST /timeoff/requests (atomic balance check)
 * - PATCH /timeoff/requests/{id}/status (APPROVE / REJECT)
 * - GET  /departments
 * - GET  /audit/logs
 *
 * When the backend is unreachable and VITE_ENABLE_MOCK_FALLBACK=true,
 * calls fall back to the in-memory MockNexusApi below.
 */

const INITIAL_TENANT_ID = "t1001-nexus-corp";

const INITIAL_DEPARTMENTS = [
  { id: "dept-1", code: "ENG", name: "Software Engineering", headcount: 142, manager: "Sarah Jenkins", managerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150", budget: "$1,250,000", color: "#6366F1" },
  { id: "dept-2", code: "PROD", name: "Product & Design", headcount: 68, manager: "Marcus Vance", managerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150", budget: "$650,000", color: "#8B5CF6" },
  { id: "dept-3", code: "HR", name: "Human Capital & People", headcount: 34, manager: "Aisha Patel", managerAvatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150", budget: "$380,000", color: "#EC4899" },
  { id: "dept-4", code: "FIN", name: "Finance & Accounting", headcount: 56, manager: "David Chen", managerAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150", budget: "$520,000", color: "#10B981" },
  { id: "dept-5", code: "MKT", name: "Global Marketing", headcount: 82, manager: "Robert Kim", managerAvatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150", budget: "$780,000", color: "#F59E0B" },
  { id: "dept-6", code: "OPS", name: "Customer Operations", headcount: 104, manager: "Claire Dubois", managerAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150", budget: "$890,000", color: "#3B82F6" },
];

const INITIAL_EMPLOYEES = [
  {
    id: "emp-101",
    tenant_id: INITIAL_TENANT_ID,
    first_name: "Sarah",
    last_name: "Jenkins",
    email: "sarah.jenkins@nexushr.io",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    job_title: "Principal Software Architect",
    department_id: "dept-1",
    department_name: "Software Engineering",
    role: "HR_MANAGER",
    employment_type: "FULL_TIME",
    status: "ACTIVE",
    join_date: "2021-03-15",
    shift_start: "09:00",
    leave_balances: { ANNUAL: 18, SICK: 10, MATERNITY: 0, UNPAID: 30 }
  },
  {
    id: "emp-102",
    tenant_id: INITIAL_TENANT_ID,
    first_name: "Marcus",
    last_name: "Vance",
    email: "marcus.vance@nexushr.io",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    job_title: "Senior Product Designer",
    department_id: "dept-2",
    department_name: "Product & Design",
    role: "PEOPLE_MANAGER",
    employment_type: "FULL_TIME",
    status: "ACTIVE",
    join_date: "2022-01-10",
    shift_start: "09:00",
    leave_balances: { ANNUAL: 12, SICK: 8, MATERNITY: 0, UNPAID: 30 }
  },
  {
    id: "emp-103",
    tenant_id: INITIAL_TENANT_ID,
    first_name: "Elena",
    last_name: "Rostova",
    email: "elena.rostova@nexushr.io",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    job_title: "Lead DevOps Engineer",
    department_id: "dept-1",
    department_name: "Software Engineering",
    role: "EMPLOYEE",
    employment_type: "FULL_TIME",
    status: "ACTIVE",
    join_date: "2020-11-01",
    shift_start: "09:00",
    leave_balances: { ANNUAL: 5, SICK: 12, MATERNITY: 0, UNPAID: 30 }
  },
  {
    id: "emp-104",
    tenant_id: INITIAL_TENANT_ID,
    first_name: "David",
    last_name: "Chen",
    email: "david.chen@nexushr.io",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    job_title: "Financial Controller",
    department_id: "dept-4",
    department_name: "Finance & Accounting",
    role: "PEOPLE_MANAGER",
    employment_type: "FULL_TIME",
    status: "ACTIVE",
    join_date: "2019-06-20",
    shift_start: "09:00",
    leave_balances: { ANNUAL: 22, SICK: 9, MATERNITY: 0, UNPAID: 30 }
  },
  {
    id: "emp-105",
    tenant_id: INITIAL_TENANT_ID,
    first_name: "Aisha",
    last_name: "Patel",
    email: "aisha.patel@nexushr.io",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    job_title: "Talent Acquisition Lead",
    department_id: "dept-3",
    department_name: "Human Capital & People",
    role: "HR_MANAGER",
    employment_type: "FULL_TIME",
    status: "ON_LEAVE",
    join_date: "2021-08-01",
    shift_start: "09:00",
    leave_balances: { ANNUAL: 2, SICK: 15, MATERNITY: 90, UNPAID: 30 }
  },
  {
    id: "emp-106",
    tenant_id: INITIAL_TENANT_ID,
    first_name: "Robert",
    last_name: "Kim",
    email: "robert.kim@nexushr.io",
    avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    job_title: "Marketing Growth Manager",
    department_id: "dept-5",
    department_name: "Global Marketing",
    role: "EMPLOYEE",
    employment_type: "FULL_TIME",
    status: "ACTIVE",
    join_date: "2023-02-14",
    shift_start: "09:00",
    leave_balances: { ANNUAL: 15, SICK: 7, MATERNITY: 0, UNPAID: 30 }
  },
  {
    id: "emp-107",
    tenant_id: INITIAL_TENANT_ID,
    first_name: "Claire",
    last_name: "Dubois",
    email: "claire.dubois@nexushr.io",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    job_title: "Customer Success Director",
    department_id: "dept-6",
    department_name: "Customer Operations",
    role: "PEOPLE_MANAGER",
    employment_type: "FULL_TIME",
    status: "ACTIVE",
    join_date: "2020-04-12",
    shift_start: "09:00",
    leave_balances: { ANNUAL: 19, SICK: 10, MATERNITY: 0, UNPAID: 30 }
  }
];

const INITIAL_ATTENDANCE_RECORDS = [
  {
    id: "att-801",
    employee_id: "emp-101",
    employee_name: "Sarah Jenkins",
    department_name: "Software Engineering",
    date: "2026-09-24",
    check_in: "2026-09-24T08:52:00Z",
    check_out: null,
    status: "PRESENT",
    late_minutes: 0,
    is_modified: false
  },
  {
    id: "att-802",
    employee_id: "emp-102",
    employee_name: "Marcus Vance",
    department_name: "Product & Design",
    date: "2026-09-24",
    check_in: "2026-09-24T09:04:00Z",
    check_out: "2026-09-24T17:01:00Z",
    status: "PRESENT",
    late_minutes: 0,
    is_modified: false
  },
  {
    id: "att-803",
    employee_id: "emp-103",
    employee_name: "Elena Rostova",
    department_name: "Software Engineering",
    date: "2026-09-24",
    check_in: "2026-09-24T09:28:00Z",
    check_out: "2026-09-24T17:30:00Z",
    status: "LATE",
    late_minutes: 28,
    is_modified: false
  },
  {
    id: "att-804",
    employee_id: "emp-104",
    employee_name: "David Chen",
    department_name: "Finance & Accounting",
    date: "2026-09-23",
    check_in: "2026-09-23T08:58:00Z",
    check_out: null,
    status: "INCOMPLETE_RECONCILIATION",
    late_minutes: 0,
    is_modified: true
  },
  {
    id: "att-805",
    employee_id: "emp-106",
    employee_name: "Robert Kim",
    department_name: "Global Marketing",
    date: "2026-09-24",
    check_in: "2026-09-24T08:55:00Z",
    check_out: "2026-09-24T17:00:00Z",
    status: "PRESENT",
    late_minutes: 0,
    is_modified: false
  }
];

const INITIAL_LEAVE_REQUESTS = [
  {
    id: "lreq-901",
    tenant_id: INITIAL_TENANT_ID,
    employee_id: "emp-103",
    employee_name: "Elena Rostova",
    employee_avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    department_name: "Software Engineering",
    leave_type: "ANNUAL",
    start_date: "2026-10-05",
    end_date: "2026-10-09",
    days_requested: 5,
    reason: "Attending Cloud Architecture World Conference in San Francisco",
    status: "PENDING",
    is_urgent: false,
    created_at: "2026-09-24T09:30:00Z"
  },
  {
    id: "lreq-902",
    tenant_id: INITIAL_TENANT_ID,
    employee_id: "emp-106",
    employee_name: "Robert Kim",
    employee_avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150",
    department_name: "Global Marketing",
    leave_type: "SICK",
    start_date: "2026-09-28",
    end_date: "2026-09-29",
    days_requested: 2,
    reason: "Scheduled dental surgery recovery procedure",
    status: "PENDING",
    is_urgent: true,
    created_at: "2026-09-24T11:15:00Z"
  },
  {
    id: "lreq-903",
    tenant_id: INITIAL_TENANT_ID,
    employee_id: "emp-102",
    employee_name: "Marcus Vance",
    employee_avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    department_name: "Product & Design",
    leave_type: "ANNUAL",
    start_date: "2026-10-12",
    end_date: "2026-10-16",
    days_requested: 5,
    reason: "Family autumn vacation commitment",
    status: "PENDING",
    is_urgent: true,
    created_at: "2026-09-23T16:00:00Z"
  },
  {
    id: "lreq-904",
    tenant_id: INITIAL_TENANT_ID,
    employee_id: "emp-107",
    employee_name: "Claire Dubois",
    employee_avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150",
    department_name: "Customer Operations",
    leave_type: "UNPAID",
    start_date: "2026-11-02",
    end_date: "2026-11-04",
    days_requested: 3,
    reason: "Personal house relocation and settlement",
    status: "PENDING",
    is_urgent: false,
    created_at: "2026-09-22T14:20:00Z"
  }
];

const INITIAL_AUDIT_LOGS = [
  {
    id: "audit-701",
    timestamp: "2026-09-24T14:22:10Z",
    actor_name: "Sarah Jenkins",
    actor_role: "HR_MANAGER",
    action: "LEAVE_STATUS_MUTATED",
    entity_type: "LEAVE_REQUEST",
    entity_id: "lreq-899",
    details: "APPROVED 5 days ANNUAL leave for David Chen",
    ip_address: "192.168.1.104"
  },
  {
    id: "audit-702",
    timestamp: "2026-09-24T12:05:44Z",
    actor_name: "System Background Worker",
    actor_role: "SYSTEM",
    action: "ATTENDANCE_RECONCILIATION_FLAGGED",
    entity_type: "ATTENDANCE_RECORD",
    entity_id: "att-804",
    details: "Unclosed punch session >16h marked as INCOMPLETE_RECONCILIATION (REQ-ATT-002)",
    ip_address: "127.0.0.1"
  },
  {
    id: "audit-703",
    timestamp: "2026-09-24T08:52:00Z",
    actor_name: "Sarah Jenkins",
    actor_role: "HR_MANAGER",
    action: "SHIFT_PUNCH_REGISTERED",
    entity_type: "ATTENDANCE_RECORD",
    entity_id: "att-801",
    details: "PUNCH_IN arrival at 08:52 AM. Flagged as PRESENT (within 15m grace period BR-ATT-001)",
    ip_address: "192.168.1.104"
  },
  {
    id: "audit-704",
    timestamp: "2026-09-23T16:40:12Z",
    actor_name: "Sarah Jenkins",
    actor_role: "HR_MANAGER",
    action: "EMPLOYEE_PROVISIONED",
    entity_type: "EMPLOYEE",
    entity_id: "emp-107",
    details: "Provisioned profile for Claire Dubois (Customer Operations)",
    ip_address: "192.168.1.104"
  }
];

const INITIAL_ATTENDANCE_TRENDS = [
  { day: "Mon", present: 450, late: 18, absent: 8, on_leave: 10 },
  { day: "Tue", present: 462, late: 12, absent: 4, on_leave: 8 },
  { day: "Wed", present: 458, late: 15, absent: 5, on_leave: 8 },
  { day: "Thu", present: 452, late: 22, absent: 8, on_leave: 4 },
  { day: "Fri", present: 440, late: 28, absent: 10, on_leave: 8 },
  { day: "Sat", present: 85, late: 5, absent: 2, on_leave: 0 },
  { day: "Sun", present: 42, late: 1, absent: 1, on_leave: 0 },
];

const delay = (ms = 150) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory stand-in for the backend, used only as an offline fallback
class MockNexusApi {
  constructor() {
    this.employees = [...INITIAL_EMPLOYEES];
    this.leaveRequests = [...INITIAL_LEAVE_REQUESTS];
    this.departments = [...INITIAL_DEPARTMENTS];
    this.attendanceRecords = [...INITIAL_ATTENDANCE_RECORDS];
    this.auditLogs = [...INITIAL_AUDIT_LOGS];
    this.activeUserSession = {
      employee_id: "emp-101",
      check_in: "2026-09-24T08:52:00Z",
      status: "PRESENT"
    };
  }

  // Server-Authoritative UTC Time Synchronizer (BR-ATT-001 anti-tampering)
  getAuthoritativeServerTime() {
    return new Date();
  }

  // Multi-Tenant Isolation & Authorization Scope Validator (BR-TEN-001)
  verifyTenantBoundary(tenantId, requiredRole = null, userRole = "HR_MANAGER") {
    if (tenantId && tenantId !== INITIAL_TENANT_ID) {
      const err = new Error("HTTP 403 Forbidden: Cross-tenant access violation (BR-TEN-001).");
      err.status = 403;
      throw err;
    }
  }

  async getDashboardMetrics() {
    await delay(120);
    const totalCount = 486;
    const presentToday = 452;
    const onLeaveCount = 24;
    const pendingCount = this.leaveRequests.filter((r) => r.status === "PENDING").length;
    const urgentCount = this.leaveRequests.filter((r) => r.status === "PENDING" && r.is_urgent).length;
    const turnoutPct = Number(((presentToday / (totalCount - onLeaveCount)) * 100).toFixed(1));

    return {
      status: "success",
      data: {
        total_employees: { value: totalCount, change_pct: 12.4, direction: "UP" },
        present_today: { value: presentToday, turnout_pct: turnoutPct, status: turnoutPct >= 90.0 ? "OPTIMAL" : "SUB_OPTIMAL" },
        on_leave: { value: onLeaveCount, pending_count: pendingCount },
        pending_reviews: { value: pendingCount, urgent_priority: urgentCount }
      }
    };
  }

  async getEmployees({ search = "", department = "ALL", status = "ALL", role = "ALL", tenantId = INITIAL_TENANT_ID }) {
    await delay(150);
    this.verifyTenantBoundary(tenantId);
    let result = [...this.employees];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          e.first_name.toLowerCase().includes(q) ||
          e.last_name.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.job_title.toLowerCase().includes(q)
      );
    }

    if (department !== "ALL") {
      result = result.filter((e) => e.department_id === department || e.department_name === department);
    }
    if (status !== "ALL") {
      result = result.filter((e) => e.status === status);
    }
    if (role !== "ALL") {
      result = result.filter((e) => e.role === role);
    }

    return { status: "success", count: result.length, data: result };
  }

  async createEmployee(employeeData) {
    await delay(200);
    this.verifyTenantBoundary(employeeData.tenant_id);

    const existing = this.employees.find((e) => e.email.toLowerCase() === employeeData.email.toLowerCase());
    if (existing) {
      const error = new Error("HTTP 409 Conflict: An employee with this email already exists in this tenant.");
      error.status = 409;
      throw error;
    }

    const newEmp = {
      id: `emp-${Date.now()}`,
      tenant_id: INITIAL_TENANT_ID,
      ...employeeData,
      status: "ACTIVE",
      join_date: this.getAuthoritativeServerTime().toISOString().split("T")[0],
      shift_start: "09:00",
      leave_balances: { ANNUAL: 20, SICK: 10, MATERNITY: 0, UNPAID: 30 }
    };

    this.employees.unshift(newEmp);

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: this.getAuthoritativeServerTime().toISOString(),
      actor_name: "Sarah Jenkins",
      actor_role: "HR_MANAGER",
      action: "EMPLOYEE_PROVISIONED",
      entity_type: "EMPLOYEE",
      entity_id: newEmp.id,
      details: `Provisioned employee profile for ${newEmp.first_name} ${newEmp.last_name}`,
      ip_address: "192.168.1.104"
    });

    return { status: "success", data: newEmp };
  }

  async terminateEmployee(employeeId) {
    await delay(180);
    const emp = this.employees.find((e) => e.id === employeeId);
    if (!emp) throw new Error("Employee not found");

    emp.status = "TERMINATED";

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: this.getAuthoritativeServerTime().toISOString(),
      actor_name: "Sarah Jenkins",
      actor_role: "HR_MANAGER",
      action: "EMPLOYEE_TERMINATED",
      entity_type: "EMPLOYEE",
      entity_id: emp.id,
      details: `Terminated employee ${emp.first_name} ${emp.last_name} per REQ-EMP-003 Soft-Delete Protocol`,
      ip_address: "192.168.1.104"
    });

    return {
      status: "success",
      message: `Employee ${emp.first_name} ${emp.last_name} status updated to TERMINATED. JWT sessions revoked per REQ-EMP-003.`
    };
  }

  async registerPunchEvent({ employeeId, nowTimestamp = null }) {
    await delay(180);
    // Use server authoritative UTC timestamp to enforce BR-ATT-001 anti-tampering
    const now = nowTimestamp ? new Date(nowTimestamp) : this.getAuthoritativeServerTime();
    
    if (this.activeUserSession) {
      const checkInTime = new Date(this.activeUserSession.check_in);
      const durationHours = ((now - checkInTime) / (1000 * 60 * 60)).toFixed(2);
      const completedSession = {
        ...this.activeUserSession,
        check_out: now.toISOString(),
        duration_hours: durationHours
      };

      this.activeUserSession = null;

      this.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: now.toISOString(),
        actor_name: "Sarah Jenkins",
        actor_role: "HR_MANAGER",
        action: "SHIFT_PUNCH_OUT",
        entity_type: "ATTENDANCE_RECORD",
        entity_id: "att-801",
        details: `Punched out at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${durationHours} hrs)`,
        ip_address: "192.168.1.104"
      });

      return {
        action: "PUNCH_OUT",
        status: "success",
        data: completedSession,
        message: `Punched out at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Total shift duration: ${durationHours} hrs.`
      };
    } else {
      const shiftStart = new Date(now);
      shiftStart.setHours(9, 0, 0, 0);
      const diffInMinutes = Math.floor((now - shiftStart) / (1000 * 60));
      let punctualityStatus = "PRESENT";
      let lateMinutes = 0;

      // BR-ATT-001: Strict <=15 mins Grace Period evaluation
      if (diffInMinutes > 15) {
        punctualityStatus = "LATE";
        lateMinutes = diffInMinutes;
      }

      this.activeUserSession = {
        employee_id: employeeId,
        check_in: now.toISOString(),
        status: punctualityStatus,
        late_minutes: lateMinutes
      };

      this.auditLogs.unshift({
        id: `audit-${Date.now()}`,
        timestamp: now.toISOString(),
        actor_name: "Sarah Jenkins",
        actor_role: "HR_MANAGER",
        action: "SHIFT_PUNCH_IN",
        entity_type: "ATTENDANCE_RECORD",
        entity_id: `att-${Date.now()}`,
        details: `Punched in at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Status: ${punctualityStatus}`,
        ip_address: "192.168.1.104"
      });

      return {
        action: "PUNCH_IN",
        status: "success",
        data: this.activeUserSession,
        message: punctualityStatus === "LATE"
          ? `Punched in at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Flagged as LATE (+${lateMinutes} mins after grace window).`
          : `Punched in at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. Status: PRESENT.`
      };
    }
  }

  async submitLeaveRequest(requestPayload) {
    await delay(200);
    const { employeeId, leaveType, startDate, endDate, daysRequested, reason } = requestPayload;
    const emp = this.employees.find((e) => e.id === employeeId);
    if (!emp) throw new Error("Employee record not found");

    const availableBalance = emp.leave_balances[leaveType] || 0;
    if (availableBalance < daysRequested) {
      const err = new Error(`HTTP 422 Unprocessable Entity: Insufficient ${leaveType} leave balance. Available: ${availableBalance} days, Requested: ${daysRequested} days.`);
      err.status = 422;
      throw err;
    }

    emp.leave_balances[leaveType] -= daysRequested;

    const newReq = {
      id: `lreq-${Date.now()}`,
      tenant_id: INITIAL_TENANT_ID,
      employee_id: employeeId,
      employee_name: `${emp.first_name} ${emp.last_name}`,
      employee_avatar: emp.avatar,
      department_name: emp.department_name,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      days_requested: daysRequested,
      reason,
      status: "PENDING",
      is_urgent: false,
      created_at: this.getAuthoritativeServerTime().toISOString()
    };

    this.leaveRequests.unshift(newReq);

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: this.getAuthoritativeServerTime().toISOString(),
      actor_name: `${emp.first_name} ${emp.last_name}`,
      actor_role: emp.role,
      action: "LEAVE_SUBMITTED",
      entity_type: "LEAVE_REQUEST",
      entity_id: newReq.id,
      details: `Submitted ${daysRequested}d ${leaveType} leave request`,
      ip_address: "192.168.1.104"
    });

    return { status: "success", data: newReq };
  }

  async updateLeaveRequestStatus(requestId, { action, reason }) {
    await delay(180);
    const target = this.leaveRequests.find((r) => r.id === requestId);
    if (!target) throw new Error("HTTP 404: Leave request not found.");
    if (target.status !== "PENDING") throw new Error("HTTP 409 Conflict: Request already settled.");
    if (action === "REJECT" && (!reason || !reason.trim())) {
      const err = new Error("HTTP 422 Unprocessable Entity: Rejection reason is required.");
      err.status = 422;
      throw err;
    }

    target.status = action === "APPROVE" ? "APPROVED" : "REJECTED";
    if (reason) target.rejection_reason = reason;

    if (action === "REJECT") {
      const emp = this.employees.find((e) => e.id === target.employee_id);
      if (emp && emp.leave_balances[target.leave_type] !== undefined) {
        emp.leave_balances[target.leave_type] += target.days_requested;
      }
    }

    this.auditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: this.getAuthoritativeServerTime().toISOString(),
      actor_name: "Sarah Jenkins",
      actor_role: "HR_MANAGER",
      action: `LEAVE_${target.status}`,
      entity_type: "LEAVE_REQUEST",
      entity_id: target.id,
      details: `${target.status} leave request for ${target.employee_name} (${target.days_requested}d)`,
      ip_address: "192.168.1.104"
    });

    return {
      status: "success",
      data: target,
      message: `Leave request ${target.id} successfully updated to ${target.status}.`
    };
  }

  async logout() {
    return { status: "success" };
  }

  async getLeaveRequests() {
    await delay(100);
    return [...this.leaveRequests];
  }

  async getActiveSession() {
    return this.activeUserSession;
  }

  async getAttendanceRecords(employeeId) {
    await delay(100);
    return employeeId ? this.attendanceRecords.filter((r) => r.employee_id === employeeId) : this.attendanceRecords;
  }

  async getAttendanceTrends() {
    await delay(100);
    return INITIAL_ATTENDANCE_TRENDS;
  }

  async getDepartmentDistribution() {
    await delay(100);
    return this.departments;
  }

  async getAuditLogs() {
    await delay(100);
    return this.auditLogs;
  }

  // Slack Webhook Notifications Integration
  async getSlackStatus() {
    await delay(100);
    return { status: "success", enabled: true, configured: true };
  }

  async triggerSlackTestNotification() {
    await delay(150);
    return { status: "success", message: "Slack test broadcast delivered." };
  }

  // Stripe Payment Gateway & Billing Integration
  async getBillingPlans() {
    await delay(100);
    return [
      { id: "plan_starter", name: "Starter Growth", price_monthly: 49, price_annual: 470, currency: "USD", employee_limit: 25 },
      { id: "plan_professional", name: "Professional Scale", price_monthly: 149, price_annual: 1430, currency: "USD", employee_limit: 100 },
      { id: "plan_enterprise", name: "Enterprise Custom", price_monthly: 399, price_annual: 3830, currency: "USD", employee_limit: 1000 }
    ];
  }

  async getSubscriptionStatus() {
    await delay(100);
    return {
      id: "sub_179042200001",
      plan_name: "Professional Scale",
      status: "ACTIVE",
      billing_interval: "MONTHLY",
      amount: 149.00,
      currency: "USD",
      payment_method: { brand: "visa", last4: "4242" }
    };
  }

  async createStripeCheckoutSession(planId, interval = "MONTHLY") {
    await delay(200);
    return {
      status: "success",
      session_id: `cs_test_${Date.now()}`,
      checkout_url: `http://localhost:3000/settings?billing_status=success`
    };
  }
}

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/v1").replace(/\/$/, "");
// Demo data is a local-development aid only: production builds never fall back, whatever .env says
const MOCK_FALLBACK_ENABLED = Boolean(import.meta.env.DEV) && import.meta.env.VITE_ENABLE_MOCK_FALLBACK === "true";
const TOKEN_STORAGE_KEY = "nexushr_token";
const WORKSPACE_STORAGE_KEY = "nexushr.workspace";

export class ApiError extends Error {
  // code: the server's machine-readable reason when it sends one (e.g. PASSWORD_CHANGE_REQUIRED)
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

// The server could not be reached at all (offline, server down, DNS) — as opposed to an HTTP error
export class NetworkError extends Error {
  constructor() {
    super("Can't reach the NexusHR server. Check your connection and try again.");
    this.status = 0;
  }
}

export class NexusApi {
  constructor() {
    this.mock = new MockNexusApi();
    this.usingMock = false;
  }

  // "Remember me" sessions live in localStorage (kept after the browser closes); others in
  // sessionStorage (gone when it closes)
  getToken() {
    try {
      return localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
      return null;
    }
  }

  // remember: true/false at sign-in; left out, a replacement token (e.g. after a password change)
  // is kept wherever the current one is
  setToken(token, { remember } = {}) {
    try {
      const keep = remember ?? !sessionStorage.getItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      if (token) (keep ? localStorage : sessionStorage).setItem(TOKEN_STORAGE_KEY, token);
    } catch {
      // Storage unavailable (private mode); the session just won't survive a reload
    }
  }

  // The company workspace (login page "Workspace" field); empty means the server's first company
  getWorkspace() {
    try {
      return localStorage.getItem(WORKSPACE_STORAGE_KEY) || "";
    } catch {
      return "";
    }
  }

  setWorkspace(domain) {
    try {
      const clean = String(domain || "").trim().toLowerCase();
      if (clean) localStorage.setItem(WORKSPACE_STORAGE_KEY, clean);
      else localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    } catch {
      // Storage unavailable: the workspace applies to this page only
    }
  }

  // Session and workspace headers sent with every API call
  authHeaders({ withWorkspace = true } = {}) {
    const headers = {};
    const token = this.getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
    const workspace = withWorkspace ? this.getWorkspace() : "";
    if (workspace) headers["X-Tenant-Domain"] = workspace;
    return headers;
  }

  // signOutOn401: false for calls where 401 means "wrong credentials entered", not "session expired".
  // withWorkspace: false for calls that must not be tied to a remembered workspace (company sign-up).
  async request(path, { method = "GET", body, query, signOutOn401 = true, withWorkspace = true } = {}) {
    const url = new URL(`${API_BASE_URL}${path}`);
    Object.entries(query || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
    });

    const headers = { "Content-Type": "application/json", ...this.authHeaders({ withWorkspace }) };
    const token = this.getToken();

    let res;
    try {
      res = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
    } catch {
      throw new NetworkError();
    }
    const payload = await res.json().catch(() => ({}));

    if (!res.ok) {
      // 401 = no valid session (sign in again); 403 = signed in but not allowed, keep the session
      if (res.status === 401 && token && signOutOn401) {
        this.setToken(null);
        this.onUnauthorized?.();
      }
      // The account must choose a new password before anything else works
      if (res.status === 403 && payload.code === "PASSWORD_CHANGE_REQUIRED") this.onPasswordChangeRequired?.();
      throw new ApiError(payload.message || `HTTP ${res.status}: Request failed.`, res.status, payload.code);
    }
    return payload;
  }

  // Runs the HTTP call. Only in local development with VITE_ENABLE_MOCK_FALLBACK=true, and only when
  // the server can't be reached at all, it answers from the in-memory demo data instead; the app then
  // shows a "demo data" banner (onDemoModeChange). Everywhere else the error reaches the screen.
  async withFallback(httpCall, mockCall) {
    try {
      const result = await httpCall();
      this.setDemoMode(false);
      return result;
    } catch (err) {
      if (!(err instanceof NetworkError) || !MOCK_FALLBACK_ENABLED) throw err;
      if (!this.usingMock) console.warn(`[NexusHR] Backend unreachable at ${API_BASE_URL}; using demo data.`);
      this.setDemoMode(true);
      return mockCall();
    }
  }

  setDemoMode(on) {
    if (this.usingMock === on) return;
    this.usingMock = on;
    this.onDemoModeChange?.(on);
  }

  // Auth
  async login({ email, password, remember = true }) {
    // Always the real server: there is no demo login, so no build can "sign in" without one
    const res = await this.request("/auth/login", { method: "POST", body: { email, password }, signOutOn401: false });
    this.setToken(res.token, { remember });
    return res;
  }

  // Sign in with Google: credential is Google's ID token; the server verifies it and signs in the
  // existing account with that email in the current workspace (it never creates accounts)
  async googleLogin({ credential, remember = true }) {
    const res = await this.request("/auth/google", { method: "POST", body: { credential }, signOutOn401: false });
    this.setToken(res.token, { remember });
    return res;
  }

  // Creates a new company workspace and its first administrator in one call. The request carries no
  // remembered workspace; the answer's token belongs to the new company, so its workspace is
  // remembered before the token (every later call then goes to the right company).
  // emailCode: the 6-digit code emailed by requestSignupCode (proves the address is theirs)
  async register({ name, email, password, companyName, workspace, industry, companySize, emailCode }) {
    const res = await this.request("/auth/register", {
      method: "POST",
      withWorkspace: false,
      signOutOn401: false,
      body: { name, email, password, company_name: companyName, workspace, industry, company_size: companySize, email_code: emailCode }
    });
    if (res.tenant) this.setWorkspace(res.tenant.domain);
    this.setToken(res.token);
    return res;
  }

  // Password recovery (sign-in page "Forgot password"), within the workspace typed on the login page.
  // 1. Emails a 6-digit code if the address has an account (the answer never says whether it does)
  forgotPassword(email) {
    return this.request("/auth/forgot-password", { method: "POST", body: { email }, signOutOn401: false });
  }

  // 2. Exchanges a correct code for a single-use recovery token
  verifyResetCode(email, otp) {
    return this.request("/auth/verify-otp", { method: "POST", body: { email, otp }, signOutOn401: false }).then((res) => res.recovery_token);
  }

  // 3. Sets the new password; every session of that account ends
  resetPassword(recoveryToken, password) {
    return this.request("/auth/reset-password", { method: "POST", body: { recovery_token: recoveryToken, password }, signOutOn401: false });
  }

  // Emails a sign-up verification code (valid 10 minutes; a new one after 60 s). The answer never
  // says whether the address is already in use.
  requestSignupCode(email) {
    return this.request("/auth/register/request-code", { method: "POST", body: { email }, withWorkspace: false, signOutOn401: false });
  }

  // Whether a workspace name is free; { available, domain }
  checkWorkspace(domain) {
    return this.request("/tenant/check-domain", { query: { domain }, withWorkspace: false });
  }

  // Restores the signed-in user from a stored token; null when there is no valid session
  async getCurrentUser() {
    if (!this.getToken()) return null;
    try {
      return await this.withFallback(() => this.request("/auth/me").then((res) => res.data), () => null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return null;
      throw err;
    }
  }

  async logout() {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } catch {
      // Logging out locally is enough if the backend is down
    }
    this.setToken(null);
  }

  // Dashboard
  getDashboardMetrics() {
    return this.withFallback(() => this.request("/dashboard/metrics"), () => this.mock.getDashboardMetrics());
  }

  getAttendanceTrends() {
    return this.withFallback(
      () => this.request("/attendance/trends").then((res) => res.data),
      () => this.mock.getAttendanceTrends()
    );
  }

  getDepartmentDistribution() {
    return this.withFallback(
      () => this.request("/departments").then((res) => res.data),
      () => this.mock.getDepartmentDistribution()
    );
  }

  // Employees
  getEmployees(filters = {}) {
    const { search, department, status, role } = filters;
    return this.withFallback(
      () => this.request("/employees", { query: { search, department, status, role } }),
      () => this.mock.getEmployees(filters)
    );
  }

  createEmployee(employeeData) {
    return this.withFallback(
      () => this.request("/employees", { method: "POST", body: employeeData }),
      () => this.mock.createEmployee(employeeData)
    );
  }

  // terminatedOn: the last working day (YYYY-MM-DD, not in the future); defaults to today on the server
  terminateEmployee(employeeId, terminatedOn) {
    return this.withFallback(
      () => this.request(`/employees/${encodeURIComponent(employeeId)}`, { method: "DELETE", body: terminatedOn ? { terminated_on: terminatedOn } : undefined }),
      () => this.mock.terminateEmployee(employeeId)
    );
  }

  // Attendance
  registerPunchEvent({ employeeId }) {
    return this.withFallback(
      () => this.request("/attendance/punch", { method: "POST" }),
      () => this.mock.registerPunchEvent({ employeeId })
    );
  }

  getActiveSession() {
    return this.withFallback(
      () => this.request("/attendance/active-session").then((res) => res.data),
      () => this.mock.getActiveSession()
    );
  }

  // Pass employeeId to fetch one person's records instead of everything the caller may see
  getAttendanceRecords(employeeId) {
    const query = employeeId ? `?employeeId=${encodeURIComponent(employeeId)}` : "";
    return this.withFallback(
      () => this.request(`/attendance/records${query}`).then((res) => res.data),
      () => this.mock.getAttendanceRecords(employeeId)
    );
  }

  // Leave
  getLeaveRequests() {
    return this.withFallback(
      () => this.request("/timeoff/requests").then((res) => res.data),
      () => this.mock.getLeaveRequests()
    );
  }

  submitLeaveRequest(payload) {
    return this.withFallback(
      () => this.request("/timeoff/requests", { method: "POST", body: payload }),
      () => this.mock.submitLeaveRequest(payload)
    );
  }

  updateLeaveRequestStatus(requestId, { action, reason }) {
    return this.withFallback(
      () => this.request(`/timeoff/requests/${encodeURIComponent(requestId)}/status`, { method: "PATCH", body: { action, reason } }),
      () => this.mock.updateLeaveRequestStatus(requestId, { action, reason })
    );
  }

  // The calls below have no mock fallback: they change real records, and faking success would mislead.

  // Job history, newest first (HR, the person's managers and the person themselves)
  getJobHistory(employeeId) {
    return this.request(`/employees/${encodeURIComponent(employeeId)}/job-history`).then((res) => res.data);
  }

  // fields may include effective_date (YYYY-MM-DD) for a job change; it defaults to today
  updateEmployee(employeeId, fields) {
    return this.request(`/employees/${encodeURIComponent(employeeId)}`, { method: "PUT", body: fields }).then((res) => res.data);
  }

  // The signed-in person's own profile, exactly as on record
  getMyProfile() {
    return this.request("/profile/me").then((res) => res.data);
  }

  // Name, phone, address, bio, emergency contact; an empty value clears the field
  updateMyProfile(fields) {
    return this.request("/profile/me", { method: "PUT", body: fields }).then((res) => res.data);
  }

  // Signs out every other device; the response carries a fresh token for this one
  async changePassword(currentPassword, newPassword) {
    // The server answers a wrong current password with 401; that must not sign the user out
    const res = await this.request("/profile/change-password", { method: "POST", body: { currentPassword, newPassword }, signOutOn401: false });
    if (res.token) this.setToken(res.token);
    return res;
  }

  getMyLeaveBalances() {
    return this.request("/timeoff/my-balances").then((res) => res.data);
  }

  cancelLeaveRequest(requestId) {
    return this.request(`/timeoff/requests/${encodeURIComponent(requestId)}/cancel`, { method: "PATCH" });
  }

  getTenantInfo() {
    return this.request("/tenant/info").then((res) => res.data);
  }

  updateTenantInfo(fields) {
    return this.request("/tenant/info", { method: "PATCH", body: fields }).then((res) => res.data);
  }

  // Payroll: HR-defined deductions, monthly runs, payslips
  getPayrollSettings() {
    return this.request("/payroll/settings").then((res) => res.data);
  }

  savePayrollSettings(settings) {
    return this.request("/payroll/settings", { method: "PUT", body: settings }).then((res) => res.data);
  }

  getPayrollRuns() {
    return this.request("/payroll/runs").then((res) => res.data);
  }

  generatePayrollRun(period) {
    return this.request("/payroll/runs/generate", { method: "POST", body: { period } });
  }

  approvePayrollRun(runId) {
    return this.request(`/payroll/runs/${encodeURIComponent(runId)}/approve`, { method: "POST" });
  }

  deletePayrollRun(runId) {
    return this.request(`/payroll/runs/${encodeURIComponent(runId)}`, { method: "DELETE" });
  }

  getPayslips(employeeId) {
    return this.request(`/payroll/payslips/${encodeURIComponent(employeeId)}`).then((res) => res.data);
  }

  // Opens the printable payslip in a new tab. The tab is opened before the fetch so pop-up
  // blockers treat it as a response to the click; the document needs the auth header, hence a blob.
  async openPayslip(employeeId, runId) {
    const tab = window.open("", "_blank");
    try {
      const res = await fetch(`${API_BASE_URL}/payroll/payslips/${encodeURIComponent(employeeId)}/${encodeURIComponent(runId)}?format=html`, {
        headers: this.authHeaders()
      }).catch(() => { throw new NetworkError(); });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        if (res.status === 401) this.onUnauthorized?.();
        throw new ApiError(payload.message || `HTTP ${res.status}: Could not open the payslip.`, res.status);
      }
      const url = URL.createObjectURL(new Blob([await res.text()], { type: "text/html" }));
      if (tab) {
        tab.location.href = url;
      } else {
        // Pop-up blocked: download the payslip instead of navigating away from the app
        const link = document.createElement("a");
        link.href = url;
        link.download = `payslip-${employeeId}-${runId}.html`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      tab?.close();
      throw err;
    }
  }

  // Records behind the settings, recruitment, checklist, news and document screens
  // (backend: routes/resources.routes.js). No mock fallback: these change real records.
  listResource(name) {
    return this.request(`/resources/${encodeURIComponent(name)}`).then((res) => res.data);
  }

  createResource(name, fields) {
    return this.request(`/resources/${encodeURIComponent(name)}`, { method: "POST", body: fields });
  }

  updateResource(name, id, fields) {
    return this.request(`/resources/${encodeURIComponent(name)}/${encodeURIComponent(id)}`, { method: "PATCH", body: fields });
  }

  deleteResource(name, id) {
    return this.request(`/resources/${encodeURIComponent(name)}/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  // Settings-style resources (one object per company, or per person)
  saveResourceSettings(name, fields) {
    return this.request(`/resources/${encodeURIComponent(name)}`, { method: "PUT", body: fields });
  }

  // Named operations on one record, e.g. resourceAction('candidates', id, 'move', { stage })
  resourceAction(name, id, action, body = {}) {
    return this.request(`/resources/${encodeURIComponent(name)}/${encodeURIComponent(id)}/${encodeURIComponent(action)}`, { method: "POST", body });
  }

  getRoles() {
    return this.request("/access/roles").then((res) => res.data);
  }

  // Inbox: my notifications and direct messages (backend routes/inbox.routes.js)
  getNotifications() {
    return this.request("/notifications");
  }

  markNotificationRead(id) {
    return this.request(`/notifications/${encodeURIComponent(id)}/read`, { method: "POST" });
  }

  markAllNotificationsRead() {
    return this.request("/notifications/read-all", { method: "POST" });
  }

  getMessageThreads() {
    return this.request("/messages/threads").then((res) => res.data);
  }

  getConversation(userId) {
    return this.request(`/messages/with/${encodeURIComponent(userId)}`).then((res) => res.data);
  }

  sendMessage(toId, text) {
    return this.request("/messages/send", { method: "POST", body: { to_id: toId, text } }).then((res) => res.data);
  }

  markConversationRead(userId) {
    return this.request(`/messages/with/${encodeURIComponent(userId)}/read`, { method: "POST" });
  }

  // WebSocket address on the API host (the server reads the session token from ?token=)
  wsUrl(path) {
    const u = new URL(API_BASE_URL);
    return `${u.protocol === "https:" ? "wss" : "ws"}://${u.host}${path}?token=${encodeURIComponent(this.getToken() || "")}`;
  }

  // HR: set or add days of one leave type for chosen employees (mode 'SET' | 'ADD')
  grantLeaveAllowance({ leaveType, days, mode, employeeIds }) {
    return this.request("/timeoff/allowances", { method: "POST", body: { leave_type: leaveType, days, mode, employee_ids: employeeIds } });
  }

  // Files (CVs, employee documents, document folders); stored on the server, max 5 MB
  async uploadFile(ownerType, ownerId, file) {
    const form = new FormData();
    form.append("owner_type", ownerType);
    form.append("owner_id", ownerId);
    form.append("file", file);
    const token = this.getToken();
    let res;
    try {
      res = await fetch(`${API_BASE_URL}/files`, { method: "POST", headers: this.authHeaders(), body: form });
    } catch {
      throw new NetworkError();
    }
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (res.status === 401) this.onUnauthorized?.();
      throw new ApiError(payload.message || `HTTP ${res.status}: Upload failed.`, res.status);
    }
    return payload;
  }

  listFiles(ownerType, ownerId) {
    return this.request("/files", { query: { owner_type: ownerType, owner_id: ownerId } }).then((res) => res.data);
  }

  deleteFile(id) {
    return this.request(`/files/${encodeURIComponent(id)}`, { method: "DELETE" });
  }

  // Downloads a stored file through the authenticated API and saves it with its original name
  async downloadFile(id, name) {
    const token = this.getToken();
    let res;
    try {
      res = await fetch(`${API_BASE_URL}/files/${encodeURIComponent(id)}/download`, { headers: this.authHeaders() });
    } catch {
      throw new NetworkError();
    }
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      if (res.status === 401) this.onUnauthorized?.();
      throw new ApiError(payload.message || `HTTP ${res.status}: Download failed.`, res.status);
    }
    const url = URL.createObjectURL(await res.blob());
    const link = document.createElement("a");
    link.href = url;
    link.download = name || "download";
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  // Audit
  getAuditLogs() {
    return this.withFallback(
      () => this.request("/audit/logs").then((res) => res.data),
      () => this.mock.getAuditLogs()
    );
  }

  // Slack Webhook Notifications Integration
  getSlackStatus() {
    return this.withFallback(() => this.request("/integrations/slack/status"), () => this.mock.getSlackStatus());
  }

  triggerSlackTestNotification() {
    return this.withFallback(
      () => this.request("/integrations/slack/test", { method: "POST" }),
      () => this.mock.triggerSlackTestNotification()
    );
  }

  // Billing (real Stripe; no demo fallback: nothing here may pretend a payment happened).
  // Payment itself happens on Stripe's hosted Checkout page; card details never pass through NexusHR.
  getBillingPlans() {
    return this.request("/integrations/billing/plans").then((res) => res.data);
  }

  // { status: NONE | ACTIVE | TRIALING | PAST_DUE | CANCELED | ..., plan_id, interval, amount, current_period_end, cancel_at_period_end, configured, mode }
  getBilling() {
    return this.request("/integrations/billing/subscription").then((res) => res.data);
  }

  // Returns { checkout_url } on Stripe; the browser goes there and Stripe sends it back to returnUrl
  startCheckout(planId, interval, returnUrl) {
    return this.request("/integrations/billing/checkout-session", {
      method: "POST",
      body: { planId, interval, successUrl: returnUrl, cancelUrl: `${returnUrl.split("?")[0]}?billing=cancelled` }
    });
  }

  // After Stripe sends the browser back: the server checks the session with Stripe
  confirmCheckout(sessionId) {
    return this.request("/integrations/billing/checkout-session/confirm", { method: "POST", body: { session_id: sessionId } });
  }

  changePlan(planId, interval) {
    return this.request("/integrations/billing/change-plan", { method: "POST", body: { planId, interval } });
  }

  cancelSubscription() {
    return this.request("/integrations/billing/cancel-subscription", { method: "POST" });
  }

  resumeSubscription() {
    return this.request("/integrations/billing/resume-subscription", { method: "POST" });
  }

  getInvoices() {
    return this.request("/integrations/billing/invoices").then((res) => res.data);
  }

  // Stripe's Billing Portal (update the card, download invoices); returns its URL
  openBillingPortal(returnUrl) {
    return this.request("/integrations/billing/portal-session", { method: "POST", body: { returnUrl } }).then((res) => res.url);
  }
}

export const api = new NexusApi();
