# NexusHR Frontend — Feature Test Matrix (Re-run)

Executed 2026-10-03, second full pass, against http://localhost:3000 (backend :3080, Neon Postgres).
Test record email: `osama.riyad003@gmail.com`. Screenshot paths relative to `screenshots/`.
Status: **PASS** · **FAIL** · **BLOCKED** · **N/A** (not implemented) · **WITHDRAWN** (first-pass finding that did not reproduce).

## 1. Authentication

| ID | Feature | Workflow | Expected Result | Actual Result | Status | Screenshot |
| -- | ------- | -------- | --------------- | ------------- | ------ | ---------- |
| AUTH-01 | Login | Load app signed out | Login form renders | Renders; submit disabled while empty | PASS | auth/01 |
| AUTH-02 | Login | Empty credentials | Blocked | Submit disabled | PASS | auth/01 |
| AUTH-03 | Login | Valid HR credentials | Signed in to dashboard | Dashboard; all data 200 | PASS | dashboard/01 |
| AUTH-04 | Login | Wrong password | Generic error | "The email or password you entered is incorrect." (401) | PASS | auth/02 |
| AUTH-05 | Login | Unknown email | Same message (no enumeration) | Identical message | PASS | auth/03 |
| AUTH-06 | Login | 147-char email + script/SQL/Unicode password | Handled safely | Clean 401, no crash | PASS | auth/04 |
| AUTH-07 | Login | Password visibility toggle | Reveals password | Reveals raw value | PASS | auth/05 |
| AUTH-08 | Forgot password | Submit registered email | Code sent, OTP step | OTP step; non-committal wording | PASS | auth/07 |
| AUTH-09 | Forgot password | Wrong OTP | Rejected | "That code is invalid or has expired." | PASS | auth/08 |
| AUTH-10 | Forgot password | Resend throttle | Cooldown | 60 s countdown | PASS | auth/07 |
| AUTH-11 | Register | 1-char password | Blocked with message | **Accepted; advances to wizard** | **FAIL** BUG-03 | auth/10, auth/11 |
| AUTH-12 | Register | Wizard, empty required | Blocked | Stays on step 1, shows error | PASS | auth/12 |
| AUTH-13 | **Logout** | Find and use a sign-out control | Control exists and ends session | **FIXED** — "Sign out" in profile modal; token cleared from both storages; survives reload. Retested V1 + V2 | **PASS** (was FAIL BUG-A) | layout/03, layout/04 |
| AUTH-14 | Session | Refresh while authenticated | Restored | Restored, lands on dashboard | PASS | session/01 |
| AUTH-15 | Session | Tampered token + reload | Signed out | Signed out cleanly | PASS | session/02 |
| AUTH-16 | Session | Refresh while unauthenticated | Stays on login | Stays | PASS | session/02 |
| AUTH-17 | Google SSO | Click Google sign-in | Works | **403, origin not allowed** | **FAIL** BUG-04 | auth/01 |
| AUTH-18 | Error handling | Backend down, attempt login | Connection message | **"HTTP 500: Request failed."** | **FAIL** BUG-09 | (first pass) |
| AUTH-19 | Security | Sensitive data exposed in UI? | None | None found | PASS | — |

## 2. Dashboard

| ID | Feature | Workflow | Expected | Actual | Status | Screenshot |
| -- | --- | --- | --- | --- | --- | --- |
| DASH-01 | Dashboard V1 | Initial load | KPIs, charts, approvals | All render | PASS | dashboard/01 |
| DASH-02 | KPI cards | Values match API | Consistent | Match; TERMINATIONS reflected the test termination (1, 12.5%) | PASS | rbac/01 |
| DASH-03 | Attendance chart | Renders trend | Accurate | Matches `/attendance/trends` | PASS | dashboard/01 |
| DASH-04 | Department donut | Legend readable | Full labels | **Labels clipped** ("Sof…") | **FAIL** BUG-15 | dashboard/01 |
| DASH-05 | Dashboard V2 | Top-nav layout | Renders | Renders; employment-type KPIs all zero | PASS (data gap) | layout/01 |
| DASH-06 | Layout switcher | Switch V2 → V1 | Switcher available | **Switcher removed from App.jsx** | **FAIL** BUG-24 | layout/01 |
| DASH-07 | Theme | Light/dark persists | Persists | Persists via localStorage | PASS | — |

## 3. Employees — full CRUD (using osama.riyad003@gmail.com)

| ID | Feature | Workflow | Expected | Actual | Status | Screenshot |
| -- | --- | --- | --- | --- | --- | --- |
| EMP-01 | List | Load roster | Table + filters | Renders, paginated | PASS | directory/01 |
| EMP-02 | Search | Partial, lowercase "sarah" | Case-insensitive | 2 results, "1–2 of 2" | PASS | directory/02 |
| EMP-03 | Search | XSS/SQLi/Unicode payload | Inert | No execution; "No employees match these filters."; export disabled | PASS | directory/03 |
| EMP-04 | Create | Open drawer | Form renders | Renders | PASS | directory/04 |
| EMP-05 | Create | Invalid email | Blocked | Blocked, focus to email | PASS | directory/05 |
| EMP-06 | Create | Double-click submit | Guarded | Button shows disabled "Creating…" | PASS | directory/06 |
| EMP-07 | Create | Valid record | Created | Record created with osama.riyad003@gmail.com | PASS | directory/06 |
| EMP-08 | Create | Duplicate email | Rejected | "An employee with this email already exists in this tenant."; input preserved | PASS | directory/07 |
| EMP-09 | Read | Detail view | Tabs render | General/Job/Payroll/Documents; `—` vs `-` inconsistency | PASS (BUG-16) | directory/08 |
| EMP-10 | Update | Required fields enforced | Enforced or unmarked | **Asterisked fields save empty** | **FAIL** BUG-06 | directory/09, 10 |
| EMP-11 | Update | Partial change saved | Persisted | "Personal info saved."; name updated (confirmed in terminate dialog) | PASS | directory/10, 12 |
| EMP-12 | Delete | Terminate dialog | Confirmation with consequences | Clear custom dialog | PASS | directory/12 |
| EMP-13 | Delete | Cancel terminate | No change | Stays ACTIVE | PASS | directory/13 |
| EMP-14 | Delete | Confirm terminate | Soft delete | TERMINATED; record kept; excluded from Directory | PASS | directory/14, 15 |
| EMP-15 | Directory | Card view | Renders | 8 people; terminated excluded | PASS | directory/15 |
| EMP-16 | ORG chart | Load | Fits viewport | **Clipped at right edge** | **FAIL** BUG-10 | directory/16 |
| EMP-17 | Export | CSV download | Available | Present; disabled at 0 rows | PASS | directory/03 |

## 4. Time Off

| ID | Feature | Workflow | Expected | Actual | Status | Screenshot |
| -- | --- | --- | --- | --- | --- | --- |
| TO-01 | My Time Off | Load | Balances + list | Renders; "You have no leave requests yet." | PASS | timeoff/01 |
| TO-02 | Request | Open form | Renders | Renders | PASS | timeoff/02 |
| TO-03 | Request | End before start | Blocked | Blocked, focus to To field | PASS | timeoff/03 |
| TO-04 | Request | Exceed balance (0 available) | Rejected | Inline hint + inline error + toast | PASS | timeoff/04 |
| TO-05 | Request | Valid submission | Created, balance drops | PENDING; 18 → 15 days | PASS | timeoff/06 |
| TO-06 | Request | Drawer after success | Closes | **Stays open with stale balance** | **FAIL** BUG-22 | timeoff/05 |
| TO-07 | Team Time Off | Load as HR | All requests | 4 requests with Approve/Reject | PASS | timeoff/07 |
| TO-08 | Approval | Self-approval | Prevented | No buttons on own request | PASS | timeoff/07 |
| TO-09 | Approval | Approve a request | Status changes | Pending → Approved; toast leaks record id | PASS (BUG-23) | timeoff/09 |
| TO-10 | Settings | Leave types config | Editable | Renders; naming inconsistency | PASS (BUG-18) | timeoff/08 |

## 5. Attendance

| ID | Feature | Workflow | Expected | Actual | Status | Screenshot |
| -- | --- | --- | --- | --- | --- | --- |
| ATT-01 | My Attendance | Load | Stats + log | Renders; late in raw minutes | PASS (BUG-21) | attendance/01 |
| ATT-02 | Team Attendance | Weekly grid | Renders | 8 people, week nav, CSV export | PASS | attendance/02 |
| ATT-03 | Settings | Load | Rules form | Renders | PASS | attendance/03 |
| ATT-04 | Settings | Negative grace period (−10) | Rejected | Blocked by min validation | PASS | attendance/04 |
| ATT-05 | Settings | Reset | Restores saved values | 15/16 restored, buttons re-disabled | PASS | attendance/05 |

## 6. Payroll

| ID | Feature | Workflow | Expected | Actual | Status | Screenshot |
| -- | --- | --- | --- | --- | --- | --- |
| PAY-01 | Runs list | Load | Runs with statuses | PROCESSED / COMPLETED | PASS | payroll/01 |
| PAY-02 | Generate | Create October draft | Draft created | 7 employees, gross $67,749.99, net $49,762.47 | PASS | payroll/02 |
| PAY-03 | Run detail | Approve own draft | Prevented | Button disabled + explanation | PASS | payroll/02 |
| PAY-04 | Run detail | Exclusion warnings | Listed with reasons | "2 employee(s) not included — No salary on record" | PASS (BUG-19) | payroll/02 |
| PAY-05 | Calculations | Verify arithmetic | Correct | 12,083.33 − 3,170.84 = 8,912.49 ✓ | PASS | payroll/02 |
| PAY-06 | Settings | Load | Currency, pay day, deductions | Renders | PASS | payroll/03 |
| PAY-07 | Employee view | Own payslips | Scoped to self | "My Payslips", empty state | PASS | rbac/04 |

## 7. Recruitment

| ID | Feature | Workflow | Expected | Actual | Status | Screenshot |
| -- | --- | --- | --- | --- | --- | --- |
| REC-01 | Jobs | Load list | Counts match listing | **"0 open jobs · 0 applicants" with 3 listed** | **FAIL** BUG-01 | recruitment/01 |
| REC-02 | Jobs | Openings count | "N openings" | **"· openings"** (number missing) | **FAIL** BUG-17 | recruitment/01 |
| REC-03 | Jobs | Blank-title records | Not shown / fallback | No longer present (data cleaned) | WITHDRAWN BUG-02 | recruitment/01 |
| REC-04 | Create job | Whitespace-only title | Error message | **Silent no-op, no feedback** | **FAIL** BUG-07 | (first pass) |
| REC-05 | Candidates | Load | Roster with filters | 3 of 3, all named | PASS | recruitment/02 |
| REC-06 | Settings | Pipeline stages | Reorder/lock/delete | Renders correctly | PASS | recruitment/03 |

## 8. Reports / Performance

| ID | Feature | Workflow | Expected | Actual | Status | Screenshot |
| -- | --- | --- | --- | --- | --- | --- |
| REP-01 | Reports hub | Load | Report cards | 8 reports render | PASS | reports/01 |
| REP-02 | Headcount | Loading state | Shown | Proper "Loading…" state | PASS | reports/02 |
| REP-03 | Headcount | Chart renders | Donut renders | Renders correctly (~8 s, slow) | PASS — WITHDRAWN BUG-05 | reports/03 |
| REP-04 | Headcount | Filters + CSV | Available | Department/Type/Office + Download CSV | PASS | reports/03 |
| REP-05 | Audit trail | Load | Immutable log | Recorded all 4 of this pass's actions with actor/role/IP | PASS | reports/04 |

## 9. Other modules

| ID | Feature | Workflow | Expected | Actual | Status | Screenshot |
| -- | --- | --- | --- | --- | --- | --- |
| CHK-01 | To-Dos | Load | Empty state | "Nothing here." / 0 open | PASS | checklist/01 |
| CHK-02 | Onboarding | Load | Empty state | "No onboarding checklists with this status." | PASS | checklist/02 |
| CHK-03 | Templates | Load | Empty state | "No templates yet." | PASS | checklist/03 |
| DOC-01 | Documents | Folder list | Folders + visibility | 1 folder, "Visible to: Managers and HR" | PASS | documents/01 |
| NEWS-01 | News | Load | Posts render | 2 posts, both titled | PASS — WITHDRAWN BUG-02 | news/01 |
| NEWS-02 | News | Save empty draft | Error message | **Silent no-op** | **FAIL** BUG-07 | (first pass) |
| HELP-01 | Help Center | Load | Topic cards | 9 cards render | PASS | helpcenter/01 |
| SET-01 | Company Info | Load | Form renders | Renders; empty required shows green tick | PASS (BUG-20) | settings/01 |
| SET-02 | Subscription | Load | Plans + billing | Stripe **TEST MODE**, 3 plans, Invoices tab | PASS | settings/02 |
| SET-03 | Permission | Load | Roles + members | 4 roles; SUPER_ADMIN 0 members | PASS | settings/03 |

## 10. Authorization (RBAC)

| ID | Role | Workflow | Expected | Actual | Status | Screenshot |
| -- | --- | --- | --- | --- | --- | --- |
| RBAC-01 | EMPLOYEE | Inspect nav | Restricted groups hidden | Performance + Recruitment absent | PASS | rbac/01 |
| RBAC-02 | EMPLOYEE | Employee roster actions | Create hidden | "Add New" hidden | PASS | rbac/02 |
| RBAC-03 | EMPLOYEE | Payroll | Own payslips only | "My Payslips"; Settings hidden | PASS | rbac/04 |
| RBAC-04 | EMPLOYEE | Open manager-only screen | Rejected | "You don't have access to that screen." | PASS | rbac/03 |
| RBAC-05 | EMPLOYEE | Restricted link visible? | Hidden | **Header "Report" link still shown** | **FAIL** BUG-08 | rbac/03 |
| RBAC-06 | EMPLOYEE | Directory export | Per policy | Full roster + CSV export available | REVIEW BUG-11 | rbac/02 |
| RBAC-07 | HR_MANAGER | Inspect nav | Full nav | All groups restored | PASS | dashboard/01 |
| RBAC-08 | PEOPLE_MANAGER | All screens | — | Not reached this pass | BLOCKED | — |
| RBAC-09 | SUPER_ADMIN | All screens | — | **No such account exists** | BLOCKED | settings/03 |
| RBAC-10 | Any | Restricted page by direct URL | — | **N/A — app has no router** | N/A | — |

## 11. Browser / state

| ID | Feature | Workflow | Expected | Actual | Status |
| -- | --- | --- | --- | --- | --- |
| BR-01 | Initial load | Cold load | Loads | HTTP 200, ~2 s | PASS |
| BR-02 | Refresh | Authenticated | Session restored | Restored | PASS |
| BR-03 | Refresh | Unauthenticated | Stays on login | Stays | PASS |
| BR-04 | Back / forward | Between screens | — | **N/A — no router** | N/A |
| BR-05 | Deep links | Direct route | — | **N/A — no router** (only `?billing=`) | N/A |
| BR-06 | localStorage | Token, theme, layout | Persist | All persist | PASS |
| BR-07 | sessionStorage | Without "Remember Me" | Session-scoped token | Implemented in api.js | PASS (code) |
| BR-08 | Layout switch | V1 ↔ V2 | Switcher available | **Still removed** — logout fixed, switcher not | **FAIL** BUG-24 |

## 12. Responsive

| ID | Viewport | Expected | Actual | Status |
| -- | --- | --- | --- | --- |
| RES-01 | 1920×1080 | No overflow | **Screen is 1536 CSS px — unreachable** | BLOCKED |
| RES-02 | 1440×900 | No overflow | Resize ignored (window maximized) | BLOCKED |
| RES-03 | 1280×720 | No overflow | Resize ignored | BLOCKED |
| RES-04 | 1024×768 | No overflow | Resize ignored | BLOCKED |
| RES-05 | 768×1024 | Tablet layout | Not tested | BLOCKED |
| RES-06 | 390×844 | Mobile menu | Not tested | BLOCKED |
| RES-07 | 375×812 | Mobile menu | Not tested | BLOCKED |
| RES-08 | 1536×686 (actual) | No horizontal overflow | `scrollWidth` 1530 ≤ `innerWidth` 1536 | PASS |

## 13. API integration & console

| ID | Check | Expected | Actual | Status |
| -- | --- | --- | --- | --- |
| API-01 | Endpoints / methods | Correct | All verified correct | PASS |
| API-02 | Auth header | Bearer token | Sent on every call | PASS |
| API-03 | Response parsing | Correct | Correct | PASS |
| API-04 | 401 handling | Session ends | Correct | PASS |
| API-05 | 403 handling | Session kept | Correct (code-verified) | PASS |
| API-06 | Validation errors | Surfaced inline | Surfaced (except BUG-07) | PARTIAL |
| API-07 | Backend unreachable | Friendly message | **Raw HTTP 500** | FAIL BUG-09 |
| API-08 | Duplicate requests | None | `/notifications`, `/messages/threads` fetched **twice** on load | FAIL (minor) |
| API-09 | Infinite request loops | None | None observed | PASS |
| API-10 | JS / React errors | None | None | PASS |
| API-11 | Unhandled promises | None | None | PASS |
| API-12 | CORS errors | None | None (proxied same-origin) | PASS |
