# NexusHR — Frontend

The web client for **NexusHR**, a multi-tenant HR platform: employee records, time off, attendance, payroll, recruitment, documents, reporting and company settings.

React 18 · Vite 5 · Tailwind CSS 3 · Recharts

> This repository is the **frontend only**. It cannot do anything past the sign-in screen without the NexusHR API running — see [Backend requirement](#backend-requirement).

![NexusHR dashboard](screenshots/dashboard/01-dashboard-v1-hr.jpg)

---

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

The dev server opens your browser automatically. If sign-in fails, the backend isn't running — see below.

**Requirements:** Node.js 18+ (developed on Node 24, npm 11).

---

## Backend requirement

`api.login()` has **no offline fallback**, so the auth screens are all you can reach without a server.

The API is a separate project (`NexusHR-Backend`) that listens on **port 3080**. Vite proxies to it:

| Browser request | Proxied to |
| --- | --- |
| `/api/*` | `http://localhost:3080/api/*` |
| `/ws` | `ws://localhost:3080/ws` |
| `/health` | `http://localhost:3080/health` |

Start it first, then this app:

```bash
cd ../NexusHR-Backend && npm start     # :3080
cd ../HRDashboard      && npm run dev  # :3000
```

Point at a different backend with `NEXUSHR_BACKEND_URL` (read at Vite startup, not a `VITE_` variable):

```bash
NEXUSHR_BACKEND_URL=http://localhost:4000 npm run dev
```

> **Port 3000 is fixed** (`strictPort: true`). Vite fails rather than falling back to 3001, because the backend's `CLIENT_ORIGIN` and the Google OAuth origin are both registered against `:3000`. If the port is busy, free it — don't change it.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 with HMR and the API proxy |
| `npm run build` | Production bundle into `dist/` |
| `npm run preview` | Serve `dist/` on :3000 with the same proxy |
| `npm test` | 9 unit tests via Node's built-in runner (`node --test`) |
| `npm run lint` | ⚠️ **Currently broken** — see note below |

> `npm run lint` is declared in `package.json` but **ESLint is not installed and there is no config file**, so the script fails. Either add `eslint` + a flat config, or drop the script.

### Tests

`tests/unit/utils.test.js` — no framework, just `node:test`. Nine cases covering the two pure utilities most likely to cause real damage:

- **CSV export/import** (`src/utils/csv.js`) — formula-injection neutralisation (`= + - @`), quoting of commas/quotes/newlines, UTF-8 BOM, CRLF, null handling.
- **Keyboard shortcuts** (`src/utils/shortcutDefinitions.js`) — physical-key matching across Windows/macOS, suppression while typing, no duplicate bindings.

```
ℹ tests 9   ℹ pass 9   ℹ fail 0
```

---

## Environment

Copy the template and fill it in:

```bash
cp .env.example .env
```

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API base, default `http://localhost:3000/api/v1` (proxied) |
| `VITE_WS_URL` | WebSocket origin for live notifications |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client for Sign in with Google |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe key for the subscription screen |
| `VITE_SLACK_*` | Slack integration IDs |
| `VITE_DEFAULT_TENANT_ID` | Fallback workspace |
| `VITE_ENABLE_MOCK_FALLBACK` | Dev-only demo data when the API is unreachable (see caveat) |

`.env` is **gitignored** — it carries real keys. `.env.example` is committed as the template.

> **Mock fallback caveat.** `VITE_ENABLE_MOCK_FALLBACK=true` only triggers on a genuine `NetworkError`. Behind the Vite proxy a dead backend returns **HTTP 500**, not a connection failure, so the fallback never fires in local dev and you'll see `HTTP 500: Request failed.` instead of a friendly message.

---

## Architecture

### No router — this surprises people

There is **no `react-router`**. Navigation is a single `activeTab` string in `src/App.jsx`.

Consequences worth knowing before you start:

- Every path serves the same SPA. There are no deep links or shareable screen URLs.
- Browser back/forward do **not** move between screens.
- The only URL parameter read is `?billing=`, which returns from Stripe to Settings → Subscription.

### State

Two React contexts, no external state library:

- **`AppContext`** — session, current user, dashboard metrics, employees, leave requests, departments, filters, toasts, theme.
- **`InboxContext`** — notifications and message threads.

Server resources go through **`useResource(name)`** (`src/hooks/useResource.js`), a generic list/create/update/remove hook over `/resources/*`, used by 16 resources (offices, job titles, work schedules, candidates, jobs, news, todos, checklists, …).

### Layouts

Two interchangeable shells, remembered in `localStorage` under `nexushr.layout`:

- **V1** — left sidebar (`Sidebar` + `Header`)
- **V2** — horizontal top nav with dropdowns (`TopNavHeader`)

Theme (`nexushr_theme`) is `light` or `dark` and defaults to dark.

### Auth & storage

| Key | Holds |
| --- | --- |
| `nexushr_token` | JWT — `localStorage` with "Remember Me", else `sessionStorage` |
| `nexushr.workspace` | Tenant domain, sent as `X-Tenant-Domain` |
| `nexushr_theme` | `light` \| `dark` |
| `nexushr.layout` | `v1` \| `v2` |

A `401` clears the token and ends the session; a `403` keeps it. `PASSWORD_CHANGE_REQUIRED` forces the password-change screen before anything else loads.

---

## Roles

Defined in `src/utils/access.js`. The client hides what a role can't use; the server enforces the same rules.

| Role | Scope |
| --- | --- |
| `SUPER_ADMIN` | Full control of the workspace |
| `HR_MANAGER` | People operations company-wide |
| `PEOPLE_MANAGER` | Their own department |
| `EMPLOYEE` | Self-service |

**HR only:** checklist settings, employee time off, time-off settings, employee attendance, attendance settings, payroll settings, audit trail, and the Permission / Integration / Subscription settings tabs.
**Managers and above:** team time off, team attendance, reports, all recruitment screens.

Navigation is filtered by `navFor(role)`; `setActiveTab` re-checks with `canSeeTab()` and rejects with a toast.

---

## Project layout

```
src/
├── App.jsx                 # shell, tab routing, global modals
├── context/                # AppContext, InboxContext
├── hooks/useResource.js    # generic CRUD over /resources/*
├── services/api.js         # the entire API client + mock data
├── utils/                  # access, csv, fileSecurity, keyboardShortcuts
└── components/
    ├── auth/               # login, register, OTP, password reset, onboarding wizard
    ├── layout/             # Sidebar, Header, TopNavHeader, navItems
    ├── dashboard/          # KPI cards, attendance chart, department donut, approvals
    ├── directory/          # roster, cards, org chart, employee detail
    ├── timeoff/ attendance/ payroll/ recruitment/
    ├── checklist/ documents/ news/ messages/ helpcenter/
    ├── reports/            # 8 reports + hub
    ├── settings/           # 12 modules incl. RBAC, Slack, Stripe billing
    ├── modals/ notifications/ profile/
    └── common/             # Avatar, Badge, Toast, Toggle, drawers
```

Lazy-loaded for bundle size: Documents, Checklist, News, Reports, Settings, Messages, Help Center, Notifications.

`db/schema.sql` is a reference copy of the backend schema (`tenants`, `departments`, `employees`, `attendance_records`, `leave_balances`, `leave_requests`, `audit_logs`) — the frontend never talks to a database directly.

---

## Features

**Dashboard** — headcount KPIs, attendance trends, department distribution, pending approvals, RBAC matrix.
**Employees** — roster with search and facets, card directory, org chart, full profile with Job / Payroll / Documents tabs, soft-delete termination.
**Time Off** — balances, requests with live balance checking, team and company approval queues, leave-type configuration.
**Attendance** — punch in/out against a server clock with a configurable grace window, personal log, team week grid, CSV export.
**Payroll** — monthly runs with per-employee breakdown, deductions, payslips, and segregation of duties (you cannot approve a draft you generated).
**Recruitment** — jobs, candidate roster and kanban, configurable pipeline stages, CV upload.
**Checklists** — onboarding/offboarding templates and per-employee task lists.
**Documents** — folders with role visibility, upload/download (10 MB cap; PDF/DOC/DOCX/JPEG/PNG).
**Reports** — headcount, turnover, time off, recruitment pipeline, onboarding/offboarding, employee data, each with CSV export.
**Settings** — company info, offices, departments, job titles, work schedules, RBAC, Slack, Stripe subscription, password, notifications.
**Cross-cutting** — audit trail, real-time notifications and messaging over WebSocket, Alt/Option keyboard shortcuts, light/dark themes.

---

## Screenshots

All 70 captures live in [`screenshots/`](screenshots/), grouped by feature. A representative tour:

### Authentication

| Sign in | Create account |
| --- | --- |
| ![Login](screenshots/auth/01-login-initial.jpg) | ![Register](screenshots/auth/09-register-form.jpg) |

| Password reset | One-time code |
| --- | --- |
| ![Forgot password](screenshots/auth/06-forgot-password.jpg) | ![OTP step](screenshots/auth/07-forgot-password-otp-step.jpg) |

Wrong password and unknown email return the **same** message — no user enumeration:

![Generic credential error](screenshots/auth/02-login-wrong-password.jpg)

### Employees

Roster with search and facet filters:

![Employee roster](screenshots/directory/01-employees-list.jpg)

| Card directory | Employee profile |
| --- | --- |
| ![Directory cards](screenshots/directory/15-directory-cards.jpg) | ![Employee detail](screenshots/directory/08-employee-detail-view.jpg) |

Create drawer, and the duplicate-email rejection that keeps your input:

| Add employee | Duplicate rejected |
| --- | --- |
| ![Add employee drawer](screenshots/directory/04-add-employee-drawer.jpg) | ![Duplicate email rejected](screenshots/directory/07-create-duplicate-email-rejected.jpg) |

Termination is a soft delete behind an explicit confirmation:

![Terminate confirmation](screenshots/directory/12-terminate-confirm-dialog.jpg)

### Time Off

| Balances and requests | Request form |
| --- | --- |
| ![My time off](screenshots/timeoff/01-my-time-off-balances-empty.jpg) | ![Request form](screenshots/timeoff/02-request-form.jpg) |

Balance is enforced live in the form *and* by the server:

![Insufficient balance](screenshots/timeoff/04-insufficient-balance-rejected.jpg)

Approval queue — note there are no Approve/Reject buttons on your **own** request:

![Team time off](screenshots/timeoff/07-team-time-off-self-approval-blocked.jpg)

### Attendance

| Personal log | Team week grid |
| --- | --- |
| ![My attendance](screenshots/attendance/01-my-attendance-open-session.jpg) | ![Team attendance](screenshots/attendance/02-team-attendance-week-grid.jpg) |

Grace-window and shift rules:

![Attendance settings](screenshots/attendance/03-attendance-settings.jpg)

### Payroll

| Monthly runs | Run detail |
| --- | --- |
| ![Payroll runs](screenshots/payroll/01-payroll-runs-list.jpg) | ![Payroll draft](screenshots/payroll/02-draft-generated-self-approval-blocked.jpg) |

The run detail shows segregation of duties — the approve button is disabled for the person who generated the draft, and employees without a salary on record are listed as skipped.

### Recruitment

| Jobs | Candidates | Pipeline stages |
| --- | --- | --- |
| ![Jobs](screenshots/recruitment/01-jobs-zero-counter-missing-openings.jpg) | ![Candidates](screenshots/recruitment/02-candidates-list.jpg) | ![Pipeline](screenshots/recruitment/03-settings-pipeline-stages.jpg) |

### Reports

| Reports hub | Headcount breakdown |
| --- | --- |
| ![Reports hub](screenshots/reports/01-reports-hub.jpg) | ![Headcount](screenshots/reports/03-headcount-chart-rendered.jpg) |

Append-only audit trail with actor, role, action and IP origin:

![Audit trail](screenshots/reports/04-audit-trail-records-test-actions.jpg)

### Settings

| Company info | Subscription (Stripe) | Roles |
| --- | --- | --- |
| ![Company info](screenshots/settings/01-company-info.jpg) | ![Subscription](screenshots/settings/02-subscription-stripe-test-mode.jpg) | ![Permissions](screenshots/settings/03-permission-roles.jpg) |

### Other modules

| Documents | News | Help Center |
| --- | --- | --- |
| ![Documents](screenshots/documents/01-documents-folders.jpg) | ![News](screenshots/news/01-news-list.jpg) | ![Help Center](screenshots/helpcenter/01-help-center.jpg) |

Checklists, with the empty states you'll see on a fresh tenant:

![Checklist to-dos](screenshots/checklist/01-todos-empty-state.jpg)

### Role-based access

The same app signed in as an **Employee** — Performance and Recruitment are gone from the sidebar, and "Add New" is hidden on the roster:

| Employee dashboard | Roster without create |
| --- | --- |
| ![Employee nav](screenshots/rbac/01-employee-dashboard-restricted-nav.jpg) | ![Add New hidden](screenshots/rbac/02-employee-add-new-hidden.jpg) |

Reaching a manager-only screen is rejected rather than rendered:

![Access denied](screenshots/rbac/03-access-denied-toast.jpg)

### Layout variants

The alternative **V2** top-nav shell (switch stored in `localStorage`):

![Home V2 top nav](screenshots/layout/01-dashboard-v2-switcher-removed.jpg)

### Profile and sign out

The avatar in the top-right opens your own profile — personal details, leave balances, password, emergency contact — and carries the **Sign out** control:

![Profile modal with sign out](screenshots/layout/03-profile-modal-sign-out-fixed.jpg)

---

## Security notes

Worth preserving if you touch these files:

- **CSV injection** — `src/utils/csv.js` prefixes cells starting with `= + - @` with a quote so spreadsheets don't execute them. Covered by test FE-U01 (P0).
- **Upload validation** — `src/utils/fileSecurity.js` enforces a 10 MB cap and a MIME/extension allow-list.
- **No user enumeration** — wrong password and unknown email return the same message; password reset never reveals whether an account exists.
- **Segregation of duties** — self-approval is blocked for both leave requests and payroll runs.

---

## QA

A full manual QA pass is documented in this repo:

| File | Contents |
| --- | --- |
| [`frontend-qa-report.md`](frontend-qa-report.md) | Findings by severity, console/API notes, verdict |
| [`qa/test-matrix.md`](qa/test-matrix.md) | ~100 cases with expected vs actual |
| [`qa/feature-inventory.md`](qa/feature-inventory.md) | Screen inventory, roles, architecture constraints |
| [`screenshots/`](screenshots/) | 70 screenshots across 16 feature folders |
| [`BUTTON_AUDIT.md`](BUTTON_AUDIT.md) | Every `<button>` in `src/` traced to its handler |

**Current verdict: NOT READY** — one P1 blocker (no logout control reachable in the UI) plus two P2s. Read the report before shipping.

---

## Known issues

| Severity | Issue |
| --- | --- |
| ~~P1~~ | ~~No sign-out control anywhere in the app.~~ **Fixed** — "Sign out" now lives in the profile modal (avatar → top right), verified working in both layouts. |
| P2 | Recruitment job status filter and "open jobs" counter compare against `'ACTIVE'`, which the API never returns (`PUBLISHED`/`OPEN`/`INTERVIEWING`) — both are permanently dead. |
| P2 | Registration accepts a 1-character password and advances through all five wizard steps before any policy is applied. |
| P3 | Google Sign-In returns 403 on localhost — `:3000` isn't an authorised JavaScript origin for the configured client ID. |
| P3 | Several destructive actions use native `window.confirm` instead of the app's own dialog component. |
| P3 | **No UI to switch from the V2 top-nav layout back to V1.** The switcher lived in `LayoutControlBar`, which is no longer rendered; clearing `nexushr.layout` from `localStorage` is the only way back. |
| — | `npm run lint` fails (ESLint not installed, no config). |

Full list with reproduction steps and root causes in [`frontend-qa-report.md`](frontend-qa-report.md).
