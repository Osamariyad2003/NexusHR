# NexusHR Frontend — Feature Inventory

Derived from source inspection of `src/` on 2026-10-03. This is the basis for the test matrix.

## Architecture facts that shape testing

| Fact | Implication for QA |
| --- | --- |
| **No router.** Navigation is `activeTab` state in `src/App.jsx`; there is no `react-router`. | "Direct URL access", "deep links", "protected routes by URL" are **not applicable** — every URL serves the same SPA. The only URL parameter honoured is `?billing=` (returns to Settings → Subscription). Back/forward do not change screens. |
| **Backend required.** `api.login()` never falls back to mock data. | Nothing beyond the auth screens can be tested without the NexusHR backend. It lives in a **separate repo** (`D:/Web Projects/NexusHR-Backend`) on port **3080**; Vite proxies `/api`, `/ws`, `/health` to it. |
| **Mock fallback disabled.** `VITE_ENABLE_MOCK_FALLBACK=false`, and it is dev-only regardless. | Demo-mode banner path is not exercisable in this configuration without an env change. |
| **Data lives in Neon cloud Postgres**, not a local DB. | Create/update/delete tests persist to shared cloud data. |
| **Two layout variants.** `v1` (left sidebar) and `v2` (top nav), persisted in `localStorage` under `nexushr.layout`. | Every screen must be checked in both layouts. |
| **Theme.** `themeMode` in `localStorage` (`nexushr_theme`), **defaults to dark**. | Light mode is a second visual surface to check. |
| **Session storage.** Token in `localStorage` ("Remember Me") or `sessionStorage` (otherwise), key `nexushr_token`. | Session persistence/expiry is testable by manipulating storage. |

## Roles

From `src/utils/access.js`. `SUPER_ADMIN`, `HR_MANAGER`, `PEOPLE_MANAGER`, `EMPLOYEE`.
Seed accounts (password `Password123!`): `admin@nexushr.io` (HR_MANAGER), `marcus.vance@nexushr.io` (PEOPLE_MANAGER), `elena.rostova@nexushr.io` (EMPLOYEE). **No SUPER_ADMIN account exists in the seed**, so that role is not directly testable.

Restricted tabs (`TAB_ROLES`):

- **HR only** (`SUPER_ADMIN`, `HR_MANAGER`): `checklist-setting`, `employee-time-off`, `time-off-settings`, `employee-attendance`, `attendance-settings`, `payroll-settings`, `analytics-audit`
- **Managers+** (`+PEOPLE_MANAGER`): `team-time-off`, `team-attendance`, `analytics`, `reports`, `recruitment`, `recruitment-jobs`, `recruitment-candidates`, `recruitment-settings`
- **Settings sub-tabs HR only** (`SETTINGS_TAB_ROLES`): `permission`, `integration`, `subscription`

Guarding is client-side in `setActiveTab` (toast "You don't have access to that screen.") plus server-side enforcement.

## Screen inventory (27 navigable screens)

| # | Nav path | Tab id | Component |
| --- | --- | --- | --- |
| 1 | Dashboard | `dashboard` | KpiCards, AttendanceChart, DepartmentDonut, PendingApprovals |
| 2 | Employees → Manage Employees | `employees` | EmployeeDirectory |
| 3 | Employees → Directory | `employees-directory` | DirectoryCardsView |
| 4 | Employees → ORG Chart | `employees-org` | OrgChartView |
| 5 | Checklist → To-Dos | `checklist-todos` | ToDoListView |
| 6 | Checklist → Onboarding | `checklist-onboarding` | OnboardingChecklistView |
| 7 | Checklist → Offboarding | `checklist-offboarding` | OnboardingChecklistView |
| 8 | Checklist → Setting | `checklist-setting` | ChecklistSettingsView (HR) |
| 9 | Time Off → My Time Off | `leave` | MyTimeOffView |
| 10 | Time Off → Team Time Off | `team-time-off` | TeamTimeOffView (Mgr+) |
| 11 | Time Off → Employee Time Off | `employee-time-off` | EmployeeTimeOffView (HR) |
| 12 | Time Off → Settings | `time-off-settings` | TimeOffSettingsView (HR) |
| 13 | Attendance → My Attendance | `attendance` | MyAttendanceView |
| 14 | Attendance → Team Attendance | `team-attendance` | TeamAttendanceView (Mgr+) |
| 15 | Attendance → Employee Attendance | `employee-attendance` | TeamAttendanceView (HR) |
| 16 | Attendance → Settings | `attendance-settings` | AttendanceSettingsView (HR) |
| 17 | Payroll → Employee Payroll | `payroll` | PayrollManagerView |
| 18 | Payroll → Settings | `payroll-settings` | PayrollSettingsView (HR) |
| 19 | Performance → KPI Scorecards | `analytics` | ReportsManagerView (Mgr+) |
| 20 | Performance → Audit Trail | `analytics-audit` | AuditLogsView (HR) |
| 21 | Recruitment → Jobs | `recruitment-jobs` | RecruitmentManagerView (Mgr+) |
| 22 | Recruitment → Candidates | `recruitment-candidates` | CandidatesRosterView (Mgr+) |
| 23 | Recruitment → Settings | `recruitment-settings` | RecruitmentSettingsView (Mgr+) |
| 24 | Documents | `documents` | DocumentsManagerView (lazy) |
| 25 | News | `news` | NewsManagerView (lazy) |
| 26 | Help Center | `helpcenter` | HelpCenterManagerView (lazy) |
| 27 | Setting | `settings` | SystemSettingsManagerView (lazy) |

Reachable but not in the sidebar: `notifications-all` (NotificationViewAll), `messages` (MessagesView), `departments` (DepartmentGrid).

## Global modals / overlays

PunchModal, LeaveRequestModal, WelcomeModal, UserProfileModal, NotificationPopup, Toast, RecordDrawer, ShareModal, RejectReasonModal, NewEmployeeModal, AddNewProfileDrawer, AddCandidateDrawer, CandidateDetailDrawer, CandidateEditDrawer, CreateJobModal, ToDoDetailDrawer, NewWorkScheduleDrawer.

## Settings sub-modules (12)

CompanyInfo, DepartmentTree, JobTitles, Offices, WorkSchedule (+NewWorkScheduleDrawer), Password, Notification, Rbac (HR), Integration (HR, Slack), Subscription (HR, **Stripe billing**), System settings manager shell.

## Reports sub-modules (7)

ReportsHub, Headcount, Turnover, TimeOff, RecruitmentPipeline, OnboardingOffboarding, EmployeeData.

## Cross-cutting features

- **CRUD via generic resource hook** (`useResource`) for 16 resources: `attendanceSettings, candidates, checklists, checklistTemplates, departments, documentFolders, jobs, jobTitles, leavePolicy, news, notificationPreferences, offices, recruitmentSettings, todos, workSchedules`.
- **File upload/download** — `uploadFile`/`downloadFile`; client validation in `utils/fileSecurity.js` (10 MB cap; PDF/DOC/DOCX/JPEG/PNG allow-list). Used in EmployeeDetail, DocumentDetail, AddCandidate, CandidateDetail.
- **CSV export** — `utils/csv.js`, with CSV-injection guarding (`= + - @` prefixed with a quote) and UTF-8 BOM.
- **Payments** — Stripe checkout, plan change, cancel/resume, invoices, billing portal (SubscriptionSettingsView).
- **Real-time** — WebSocket (`api.wsUrl`) for notifications and messages.
- **Keyboard shortcuts** — Alt/Option combos (`utils/keyboardShortcuts.js`, listed in Help Center).
- **Pagination** — MyAttendanceView, EmployeeDirectory, MyTimeOffView.
- **Search/filter** — global header search; employee roster search + department/status/role facets in AppContext.
- **Loading states** — SkeletonView, ComponentLoader, LoadState; 350 ms artificial skeleton on every tab change.
- **AI features** — **none**. Keyword matches in App/WelcomeModal/PayrollManagerView are incidental words, not AI integrations.

## Not applicable / not implemented

- URL routing, deep links, browser back/forward navigation between screens.
- SUPER_ADMIN role (no seed account).
- Demo/mock fallback mode (disabled by env).
