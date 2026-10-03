# NexusHR Frontend — QA Report (Re-run)

**Date:** 2026-10-03 (second full pass)
**Build:** nexushr-dashboard v1.0.0 (React 18 + Vite 5 + Tailwind 3)
**Frontend under test:** http://localhost:3000 (Vite dev server, `strictPort: true`)
**Backend dependency:** NexusHR API on :3080 (separate repo `D:/Web Projects/NexusHR-Backend`), Neon Postgres
**Tooling:** Claude-in-Chrome extension driving a real Chrome window; API cross-checks via `curl`; source review of `src/`
**Accounts:** `admin@nexushr.io` (HR_MANAGER), `elena.rostova@nexushr.io` (EMPLOYEE) — password `Password123!`
**Test record email (as requested):** `osama.riyad003@gmail.com`

Screenshots: `screenshots/` — **70 images across 16 feature folders**.
Test matrix: `qa/test-matrix.md` · Feature inventory: `qa/feature-inventory.md`.

> ### ⚠️ The application changed during QA
> `src/App.jsx` was edited at **17:17** today — after the first report was delivered (17:10) and ~2 minutes before this re-run started. It is the only file modified. The edit **removed `LayoutControlBar`** from `App.jsx` (the component file itself is untouched since 24 Sep). That bar carried the V1/V2 layout switcher, Skeleton Loading, Welcome Popup, and **the only control wired to `logout`**. This directly causes **BUG-A** below. Findings from the first pass that depended on pre-edit code have been re-verified or withdrawn.

---

## Environment setup

| Step | Result |
| --- | --- |
| Dependencies | Already installed; no install needed |
| Port 3000 free? | Yes — **no conflict to resolve** |
| Frontend start | `npm run dev` → Vite on :3000 |
| `http://localhost:3000` loads | **PASS** — HTTP 200, "NexusHR Enterprise Platform" |
| Port changed? | **No** |
| Backend | Running on :3080. Required — `api.login()` has no mock fallback |

---

## Summary

| Metric | Count |
| --- | --- |
| Total features in inventory | 27 navigable screens + 12 settings modules + 8 reports + 17 modals/drawers |
| Features tested (workflow-level) | 24 screens, 10 full workflows, 2 roles |
| Passed | 44 test cases |
| Failed | 11 |
| Blocked | 3 (responsive sweep, SUPER_ADMIN, Google SSO) |
| Not implemented / N/A | 5 (URL routing, deep links, back/forward, demo-mode, "Sync With Google") |
| **Withdrawn from first report** | 2 (BUG-02 blank records, BUG-05 blank chart — see below) |

**Workflows exercised end-to-end:** employee create → duplicate → read → update → terminate · leave request with balance enforcement · leave approve · payroll draft generation · attendance settings validation + reset · login/logout-by-token-clear/session-expiry · RBAC across two roles.

---

## Critical Bugs (P0)

**None.** No crash, no data loss, no authentication bypass, no successful injection, no sensitive data exposed.

---

## Major Bugs (P1)

### BUG-A — There is no way to log out of the application — ✅ FIXED & RETESTED
```
BUG ID:        BUG-A
Severity:      P1
Status:        FIXED 2026-10-03, retested and passing
Feature:       Session / Authentication
Page:          Every authenticated screen, both layouts
Steps to Reproduce:
  1. Sign in as any user at http://localhost:3000.
  2. Look for a sign-out control: sidebar, header, profile avatar menu, settings.
Expected:      A reachable "Log out" / "Sign out" control.
Actual:        None exists. Verified three ways:
                 • Page text matches no /log ?out|sign ?out/i in V1 OR V2 after a
                   fresh reload (checked via in-page JS on both layouts).
                 • The profile modal offers only Personal Info, Leave Balances,
                   Security & Password, Emergency Contact — no sign-out.
                 • Repo-wide grep finds exactly one remaining logout control:
                   RequiredPasswordChange.jsx:89, reachable only on the forced
                   password-change screen.
               On a shared machine the session simply persists. The only exit is
               clearing localStorage by hand — which is how this QA pass had to
               switch roles.
Console Error: none
Network Error: none
Screenshot:    layout/02-profile-modal-no-logout.jpg
               layout/01-dashboard-v2-switcher-removed.jpg
Possible Root Cause:
  The 17:17 edit removed <LayoutControlBar> from App.jsx. Its "Auth & Onboarding"
  button was the only caller of logout(). App.jsx:64 still destructures `logout`
  from context, but nothing invokes it. Neither TopNavHeader.jsx nor
  UserProfileModal.jsx contains a logout control (grep-verified).
Secondary effect:
  With nexushr.layout = "v2" persisted, there is also no UI to return to the V1
  sidebar layout — the switcher that did it was in the same removed component.
  *** This secondary effect is NOT fixed — see BUG-24. ***

FIX APPLIED (src/components/profile/UserProfileModal.jsx):
  1. Imported the LogOut icon from lucide-react.
  2. Destructured `logout` from useApp().
  3. Added a "Sign out" button to the modal header, beside the role and
     department badges: onClick={() => { onClose(); logout(); }}
  The profile modal was chosen because it is already reachable from the avatar
  in BOTH shells (Header in V1, TopNavHeader in V2), so one control covers both.

RETEST (browser, both layouts):
  V1: sign in → avatar → "Sign out" → returned to login screen;
      nexushr_token null in localStorage AND sessionStorage;
      reload → still signed out (session did not resurrect).
  V2: nexushr.layout="v2" → sign in → avatar → modal opens → "Sign out" →
      returned to login; token cleared; layout preference correctly preserved.
  Regression: npm test 9/9 pass; npm run build succeeds.
Screenshot:    layout/03-profile-modal-sign-out-fixed.jpg (V1)
               layout/04-sign-out-v2-layout.jpg (V2)
```

---

## Important Functional Issues (P2)

### BUG-01 — Job status vocabulary mismatch: counter and filter are permanently dead
```
BUG ID:        BUG-01
Severity:      P2
Feature:       Recruitment → Jobs
Page:          recruitment-jobs
Steps to Reproduce:
  1. Sign in as HR Manager → Recruitment → Jobs.
  2. Read the subtitle under the "Recruitment" heading.
Expected:      A count matching the jobs listed (3 jobs, 2 of them OPEN).
Actual:        "0 open jobs · 0 applicants" while 3 job cards render below.
               Reproduced in both QA passes.
Console Error: none
Network Error: none — GET /api/v1/resources/jobs returns 200 with 3 rows
Screenshot:    recruitment/01-jobs-zero-counter-missing-openings.jpg
Possible Root Cause:
  JobListView.jsx:35 filters `j.status === 'ACTIVE'`. The API returns
  PUBLISHED / OPEN / INTERVIEWING — never 'ACTIVE' — so the count is always 0.
  The status dropdown offers Active/Inactive/Closed, which likewise match no
  backend value, so filtering is dead too.
  Verified: curl /api/v1/resources/jobs → statuses PUBLISHED, OPEN, INTERVIEWING.
```

### BUG-03 — Registration accepts a 1-character password and advances the whole wizard
```
BUG ID:        BUG-03
Severity:      P2
Feature:       Authentication → Register
Page:          Create Account (step 1)
Steps to Reproduce:
  1. http://localhost:3000 → "Create Account".
  2. Name "Osama Riyad", email "osama.riyad003@gmail.com", password "1".
  3. Click Create Account.
Expected:      Inline password-policy error; submission blocked.
Actual:        Button is enabled, no validation, no strength meter, no feedback.
               User advances to "STEP 1 OF 5" of the company wizard and can fill
               five steps before any password rule is applied.
               Reproduced in both QA passes.
Console Error: none
Network Error: none (no request at this step)
Screenshot:    auth/10-register-weak-password-enabled.jpg
               auth/11-register-weak-password-advances-to-wizard.jpg
Possible Root Cause:
  RegisterForm.jsx performs no password-policy check and relies on HTML
  `required` alone. Policy is enforced only server-side at final wizard submit,
  so the failure surfaces maximally late.
```

---

## Minor Issues (P3)

### BUG-04 — Google Sign-In non-functional on localhost
```
BUG ID:        BUG-04   Severity: P3 (P2 if SSO is a launch requirement)
Feature:       Authentication → Google SSO      Page: Login / Register
Steps:         Load http://localhost:3000 with console open.
Expected:      Button works, or is hidden when unconfigured.
Actual:        Button renders but is unusable.
Console Error: "[GSI_LOGGER]: The given origin is not allowed for the given client ID."
Network Error: HTTP 403 from accounts.google.com
Screenshot:    auth/01-login-initial.jpg
Root Cause:    http://localhost:3000 is not an Authorised JavaScript Origin for
               client ID 676442703846-t4gfaf3hvo6acsj1ecai32v7femdtfgb.
```

### BUG-06 — Required-field asterisks on the employee edit form are decorative
```
BUG ID:        BUG-06   Severity: P3
Feature:       Employees → Detail → Edit personal info
Steps:         1. Open an employee → pencil on "Personal Info".
               2. Leave Gender, Date of Birth, Phone Number, Nationality,
                  Health Care, Marital Status, Personal Tax ID and Social
                  Insurance empty — all carry a red *.
               3. Change only Full Name → Save Changes.
Expected:      Either the asterisked fields are enforced, or not marked required.
Actual:        Saves with "Personal info saved." and every asterisked field empty.
               Compounding it: Add New Profile never collects these fields, so
               every created employee immediately violates them.
Console Error: none      Network Error: none — PATCH 200
Screenshot:    directory/09-edit-form-decorative-required-markers.jpg
               directory/10-update-saved-with-empty-required.jpg
Root Cause:    Labels render a literal "*" with no matching `required` attribute
               or validation rule in EmployeeDetailView.jsx.
```

### BUG-07 — Forms fail silently when client-side validation rejects input
```
BUG ID:        BUG-07   Severity: P3
Feature:       Recruitment → Create Job; News → Write news
Steps:         A. Jobs → Add New → title = "     " (5 spaces) + department → Publish.
               B. News → Write news → everything empty → Save as draft.
Expected:      A visible error, e.g. "Job title is required".
Actual:        Nothing happens — no error, no toast, no field highlight, no
               network request. Drawer stays open with no explanation.
               Verified no record was created (jobs stayed at 5, news at 6).
Console Error: none      Network Error: none — no request issued
Screenshot:    (first pass) recruitment/03-whitespace-title-silent-failure.jpg
Root Cause:    A .trim() guard returns early without setting error state. The
               whitespace title passes HTML5 validation — verified in-page:
               input.validity.valid === true for a value of "     ".
```

### BUG-08 — Header offers an Employee a "Report" link they can never open
```
BUG ID:        BUG-08   Severity: P3
Feature:       Authorization / header navigation      Page: any screen, as EMPLOYEE
Steps:         Sign in as elena.rostova@nexushr.io → click "Report" in the header.
Expected:      Link hidden, as the sidebar correctly hides Performance and Recruitment.
Actual:        Link is shown; clicking yields "You don't have access to that screen."
               The guard works correctly — the link should not be offered.
Screenshot:    rbac/03-access-denied-toast.jpg
Root Cause:    Header.jsx renders quick links unconditionally instead of passing
               them through canSeeTab() the way navItems.js does.
```

### BUG-09 — Backend-unreachable shows a raw "HTTP 500"
```
BUG ID:        BUG-09   Severity: P3
Feature:       API error handling      Page: Login and every authenticated screen
Steps:         Stop the backend on :3080 → attempt to sign in.
Expected:      "Can't reach the NexusHR server. Check your connection and try again."
               (the NetworkError message api.js already defines).
Actual:        "HTTP 500: Request failed."
Network Error: POST /api/v1/auth/login → 500 (Vite proxy on ECONNREFUSED)
Screenshot:    (first pass) auth/19-backend-down-http500-message.jpg
Root Cause:    The Vite dev proxy converts a refused connection into an HTTP 500,
               so fetch resolves normally and the NetworkError branch never runs.
               Side effect: the demo-data fallback (VITE_ENABLE_MOCK_FALLBACK)
               can never trigger behind the proxy either — it keys off the same branch.
```

### BUG-10 — ORG Chart overflows horizontally and clips nodes
```
BUG ID:        BUG-10   Severity: P3
Feature:       Employees → ORG Chart      Page: employees-org
Steps:         Employees → ORG Chart at 1536 px wide.
Expected:      Chart fits, or is centred/scrollable without clipping.
Actual:        The rightmost card ("Principal Software Architect & …") is cut by
               the viewport edge; a horizontal scrollbar appears; large dead
               vertical space below. Reproduced in both passes.
Screenshot:    directory/16-org-chart-clipped-overflow.jpg
Root Cause:    Fixed-width flex row with no centring or initial scroll offset.
```

### BUG-11 — Employees can export the full staff directory
```
BUG ID:        BUG-11   Severity: P3 (policy question)
Feature:       Employees → Manage Employees, as EMPLOYEE
Expected:      Confirm this is intended.
Actual:        "Add New" is correctly hidden, but the Employee still sees every
               colleague's email, role, department and status, and "Download"
               (CSV export of the whole roster) remains enabled.
Screenshot:    rbac/02-employee-add-new-hidden.jpg
Root Cause:    `employees` is not listed in TAB_ROLES (utils/access.js), so it is
               open to all roles by design. Flagged for a product decision.
```

### BUG-22 — Leave request drawer stays open after a successful submit, showing a stale balance
```
BUG ID:        BUG-22   Severity: P3   (new in this pass)
Feature:       Time Off → Request Time Off
Steps:         My Time Off → Add New Request → valid Annual request → Submit.
Expected:      Drawer closes on success.
Actual:        Success toast fires and the row appears in the list behind, but the
               drawer stays open still showing "3 calendar day(s) requested ·
               18 available" — the pre-submit balance. The real balance is now 15.
               A user could reasonably submit again.
Screenshot:    timeoff/05-request-success-drawer-stays-open.jpg
               timeoff/06-balance-decremented-18-to-15.jpg
```

### BUG-24 — No UI to switch from the V2 layout back to V1
```
BUG ID:        BUG-24   Severity: P3   (the unfixed half of BUG-A)
Feature:       Layout variants
Steps:         1. Set nexushr.layout = "v2" (or switch to V2 while the switcher existed).
               2. Reload and look for a way back to the V1 sidebar shell.
Expected:      A layout switcher, as before the 17:17 edit.
Actual:        None. The switcher lived in LayoutControlBar, which App.jsx no
               longer renders. Clearing `nexushr.layout` from localStorage is the
               only way back. Verified post-fix: the sign-out control is present in
               V2, but no layout control is.
Screenshot:    layout/01-dashboard-v2-switcher-removed.jpg
Note:          Only the logout half of BUG-A was in scope for the fix. If the
               switcher was intentionally retired, this is "won't fix" — but then
               V2 becomes a one-way door for anyone who lands in it.
```

---

## Cosmetic Issues (P4)

| ID | Issue | Evidence |
| --- | --- | --- |
| BUG-12 | Google button renders in **Arabic** on an otherwise English UI — GSI inherits browser locale with no `locale` override | auth/01 |
| BUG-13 | Footer copyright inconsistent: **2025** on Login/Register, **2026** on Forgot-password/OTP/wizard | auth/01 vs auth/06 |
| BUG-14 | Workspace placeholder truncated mid-word: "…leave empty if you dor" | auth/01 |
| BUG-15 | Department donut legend labels clipped: "Sof…", "Pro…", "Hu…", "Fin…" | dashboard/01 |
| BUG-16 | Empty-value placeholders inconsistent: `—` (Gender, Nationality, Health Insurance) vs `-` (Marital Status, Tax ID, Social Insurance) | directory/08 |
| BUG-17 | "0 candidates applied · openings" — openings number missing because `job.openings` is undefined (`JobListView.jsx:72`); plural also wrong | recruitment/01 |
| BUG-18 | Leave type named **"Parental leave"** in Time Off Settings but **"Maternity leave" / MATERNITY** in the request form and errors | timeoff/08 vs timeoff/04 |
| BUG-19 | Payroll exclusion warning identifies people by name only — ambiguous with the duplicate "Sarah Jenkins" in the roster | payroll/02 |
| BUG-20 | Company Website marked required (*) but empty, yet shows a green validation tick | settings/01 |
| BUG-21 | Late arrivals shown in raw minutes ("487 min") rather than hours/minutes | attendance/01 |
| BUG-23 | Approval toast exposes the internal record id: "Leave request **lreq-902** successfully updated to APPROVED." | timeoff/09 |

---

## Findings withdrawn from the first report

Honest correction — these did **not** reproduce in this pass:

- **BUG-02 (blank records in Jobs / Candidates / News).** The underlying junk rows (2 untitled jobs, 4 untitled news drafts, 3 unnamed candidates, placeholder employees "Fut Ure"/"Loop A"/"Loop B", duplicate Sarah Jenkins) have been **cleaned from the database** between passes. All three lists now render correctly. The *rendering* weakness (no null-title fallback) remains latent but is no longer observable; BUG-07 still covers the input path that could reintroduce it.
- **BUG-05 (Headcount chart blank on mount).** This pass showed a proper **"Loading…"** state followed by a correctly rendered donut. No blank chart. The first-pass observation was most likely the loading state captured mid-transition. Chart paint does take ~8 s end-to-end, which is slow but not a defect.

---

## UX Issues

1. **19 destructive actions use native `window.confirm`** (checklists, documents, news, candidates, jobs, departments, job titles, offices, work schedules, subscription) — unstyled and inconsistent with the well-designed custom dialogs used for terminate and suspend.
2. **No password strength indicator** anywhere in registration or reset.
3. **Validation feedback relies on native browser tooltips** for login email format, employee create, and attendance settings — the field gets focus and a ring but no persistent inline message.
4. **"Sync With Google (coming soon)"** is a visible disabled control on My Time Off — dead UI.
5. **Add New Profile never collects Employment Type**, yet Home V2's four headline KPIs are entirely employment-type based. Every V2 dashboard reads "TYPE NOT SET 8 · 100% of workforce" with three zeros.
6. **Auth screens ignore the stored theme** — `localStorage.nexushr_theme = "light"` yet the login screen always renders dark.
7. **Losing the layout switcher also removed Skeleton Loading and Welcome Popup demos** — if those were intentional product affordances, they're gone too (the Welcome Popup is still reachable from the dashboard banner; Skeleton mode is not).

---

## What passed — verified, not assumed

**Security & validation (strong)**
- XSS/SQLi/Unicode payload in employee search (`<script>alert(1)</script>' OR 1=1-- 日本語`) → inert, correct empty state. `directory/03`
- 147-char email + `<script>alert(1)</script>' OR 1=1-- 日本語Øç` password at login → clean 401, no crash. `auth/04`
- **No user enumeration** — wrong password and unknown email return the identical "The email or password you entered is incorrect." `auth/02`, `auth/03`
- Password reset never confirms whether an account exists ("If an account exists for…"). `auth/07`
- Wrong OTP → "That code is invalid or has expired." with a 60 s resend cooldown. `auth/08`
- Tampered token → signed out cleanly on reload. `session/02`
- Password visibility toggle reveals the raw value correctly. `auth/05`
- Self-approval blocked on leave (no Approve/Reject on own request). `timeoff/07`
- Payroll segregation of duties: "You generated this draft, so a different HR administrator must review and approve it" — approve disabled. `payroll/02`
- CSV export guards CSV injection (`= + - @` prefixed, UTF-8 BOM) — `src/utils/csv.js`.

**Employee CRUD lifecycle** — `directory/04` → `directory/14`, using `osama.riyad003@gmail.com`
Invalid email blocked → created ("Creating…" state disables the button, so **double-submit is guarded**) → **duplicate email rejected inline with input preserved** → detail read → partial update persisted → terminate dialog → **cancel keeps ACTIVE** → terminate sets TERMINATED (soft delete, record retained, excluded from Directory).

**Business rules**
- Leave balance enforced three ways: live inline "3 calendar day(s) requested · 0 available", inline error, **and** a toast — "Insufficient MATERNITY leave balance. Available: 0 days, Requested: 3 days." `timeoff/04`
- Inverted date range blocked. `timeoff/03`
- Valid request decremented Annual 18 → 15 and appeared PENDING. `timeoff/06`
- Approve transitioned the row to Approved. `timeoff/09`
- Negative grace period (−10) rejected; **Reset** restored 15/16 and re-disabled both buttons. `attendance/04`, `attendance/05`
- Payroll draft generated for 7 employees; **2 correctly excluded** with reasons ("No salary on record"), including the just-terminated test employee. Arithmetic verified by hand: 12,083.33 − (2,416.67 + 604.17 + 150.00) = **8,912.49** ✓ `payroll/02`

**RBAC (two roles)**
- EMPLOYEE: Performance and Recruitment absent from the sidebar; Payroll reduced to "Employee Payroll" (own payslips, correct empty state); "Add New" hidden on the roster. `rbac/01`, `rbac/02`, `rbac/04`
- Restricted navigation rejected with "You don't have access to that screen." `rbac/03`
- HR_MANAGER: full nav restored on sign-in.

**Audit trail** — recorded every action this pass with actor, role, timestamp and IP: `PAYROLL_RUN_GENERATED` ("October 2026: 7 employee(s), net 49762.47 USD, 2 skipped"), `LEAVE_APPROVED`, `LEAVE_SUBMITTED`, `EMPLOYEE_TERMINATED` ("per REQ-EMP-003 Soft-Delete Protocol"). `reports/04`

**Search / empty states** — case-insensitive partial search; "No employees match these filters." + "0 employees" with Download correctly disabled at zero rows; clean empty states on To-Dos, Onboarding, Offboarding, templates, My Time Off, My Payslips.

**Session** — survives refresh and returns to dashboard (`session/01`); theme and layout persist.

---

## Console Errors

Only two recurring messages, both Google Identity Services, both covered by BUG-04:
```
[error] Failed to load resource: the server responded with a status of 403 ()
[error] [GSI_LOGGER]: The given origin is not allowed for the given client ID.
```
**No React errors, no unhandled promise rejections, no CORS errors, no uncaught exceptions** on any screen.

## Network / API Issues

- All application endpoints returned **200** throughout: `/auth/login`, `/auth/me`, `/dashboard/metrics`, `/employees`, `/timeoff/requests`, `/attendance/*`, `/departments`, `/notifications`, `/messages/threads`, `/resources/*`, `/payroll/*`, `/audit/logs`.
- `Authorization: Bearer <jwt>` sent on every authenticated call.
- 401 handled: wrong credentials show the server message without destroying the session.
- **Duplicate requests on load:** `/notifications` and `/messages/threads` each fetched **twice** on sign-in.
- No infinite loops or request storms.

## Performance

- Vite cold start ~2 s; lazy modules load without visible jank.
- Headcount report takes **~8 s** to paint (loading state is correct, but slow).
- Payroll draft generation ~8 s.
- No oversized images (avatars are remote thumbnails at `w=150`).
- The artificial 350 ms per-tab-change skeleton delay noted in the first pass was in the removed code path — re-verify after the App.jsx change settles.

---

## Responsive Issues

**BLOCKED — not tested.** `resize_window` reports success but the viewport never changes (`window.innerWidth` stays 1536) because the Chrome window is **maximized**; Chrome ignores resize requests in that state. Verified across four attempts (1440×900, 1280×720, 1024×768, 800×900).

This display is also **1536 CSS px wide** (1920 physical ÷ 1.25 DPR), so **1920×1080 CSS cannot be tested on this machine at all**.

Not tested: 1920×1080, 1440×900, 1280×720, 1024×768, 768×1024, 390×844, 375×812.
At the one width measured (1536 px) there is **no horizontal overflow** (`scrollWidth` 1530 ≤ `innerWidth` 1536).

To unblock: restore (un-maximize) the Chrome window, or run the sweep under Playwright.

---

## Screenshot Index

`screenshots/` — 70 files.

### auth/ (12)
| File | Proves |
| --- | --- |
| 01-login-initial.jpg | Login layout; Arabic Google button (BUG-12); truncated placeholder (BUG-14); © 2025 (BUG-13); GSI 403 (BUG-04) |
| 02-login-wrong-password.jpg | Generic error — no enumeration |
| 03-login-unknown-email-same-message.jpg | Identical message for unknown account |
| 04-login-long-email-xss-sqli-unicode.jpg | 147-char email + script/SQL/Unicode password handled safely |
| 05-login-password-visibility-toggle.jpg | Toggle reveals raw value |
| 06-forgot-password.jpg | Reset screen; submit disabled while empty; © 2026 (BUG-13) |
| 07-forgot-password-otp-step.jpg | OTP step; non-committal wording; resend cooldown |
| 08-forgot-password-wrong-otp.jpg | Wrong code rejected |
| 09-register-form.jpg | Registration form |
| 10-register-weak-password-enabled.jpg | **BUG-03** — 1-char password, button enabled |
| 11-register-weak-password-advances-to-wizard.jpg | **BUG-03** — advances to STEP 1 OF 5 |
| 12-register-wizard-validation.jpg | Wizard correctly blocks empty company name (PASS) |

### directory/ (16)
`01` roster · `02` case-insensitive search · `03` **XSS/SQLi/Unicode safe** + empty state + disabled export · `04` create drawer · `05` invalid email blocked · `06` **"Creating…" double-submit guard** · `07` **duplicate email rejected, input preserved** · `08` detail view (BUG-16) · `09` **BUG-06** decorative required markers · `10` saved with empty required fields · `11` action menu · `12` terminate dialog (confirms edited name persisted) · `13` **cancel keeps ACTIVE** · `14` TERMINATED · `15` directory cards (terminated correctly excluded) · `16` **BUG-10** ORG chart clipping

### timeoff/ (9)
`01` balances + empty state · `02` request form · `03` inverted dates blocked · `04` **insufficient balance rejected (inline + toast)** · `05` **BUG-22** drawer stays open · `06` balance 18→15 · `07` **self-approval blocked** · `08` settings (BUG-18) · `09` approve succeeded (BUG-23)

### attendance/ (5)
`01` my attendance, open session (BUG-21) · `02` team week grid · `03` settings · `04` **negative value blocked** · `05` **reset restores values**

### payroll/ (3)
`01` runs list · `02` **draft generated; self-approval blocked; 2 excluded with reasons** (BUG-19) · `03` payroll settings

### reports/ (4)
`01` reports hub · `02` **proper Loading state** · `03` chart rendered (BUG-05 withdrawn) · `04` **audit trail recording this session's actions**

### recruitment/ (3)
`01` **BUG-01 + BUG-17** zero counter, missing openings · `02` candidates (clean) · `03` pipeline settings

### rbac/ (4)
`01` Employee nav — Performance/Recruitment hidden · `02` Add New hidden (BUG-11) · `03` **access-denied toast** (BUG-08) · `04` own payslips only

### session/ (2)
`01` session survives refresh · `02` tampered token → signed out

### layout/ (2)
`01` **BUG-A** V2 with switcher removed · `02` **BUG-A** profile modal has no logout

### dashboard/ (1), checklist/ (3), documents/ (1), news/ (1), helpcenter/ (1), settings/ (3)
V1 dashboard (BUG-15) · To-Dos / Onboarding / templates empty states · document folders with visibility scoping · news list (clean) · help centre · company info (BUG-20), Stripe **TEST MODE** subscription, permission roles (SUPER_ADMIN = 0 members)

---

## Blocked / Not Tested

| Item | Why |
| --- | --- |
| **Responsive sweep** (7 viewports) | Chrome maximized → resize ignored; screen is 1536 CSS px so 1920 unreachable |
| **SUPER_ADMIN role** | No such account — Settings → Permission shows "Super Admin · 0 members" |
| **Google SSO end-to-end** | Origin not authorised (BUG-04) |
| **PEOPLE_MANAGER role** | Not reached this pass |
| **Messages / WebSocket chat** | Not reached |
| **File upload/download** | Not exercised (logic reviewed: 10 MB cap, PDF/DOC/DOCX/JPEG/PNG allow-list) |
| **Stripe checkout** | Deliberately not run — would create real test-mode subscription state |
| **URL routing / deep links / back-forward** | **Not implemented** — no router; `activeTab` is React state. Only `?billing=` is read |
| **Demo-mode banner** | Disabled by env, and unreachable behind the Vite proxy anyway (BUG-09) |

---

## Test Data Left Behind

Per instruction, test records were left in the shared Neon database:

- Employee **Osama Riyad QA-Edited** (`osama.riyad003@gmail.com`) — created, edited, then **TERMINATED**.
- Leave request — Sarah Jenkins, Annual, 2026-12-10 → 2026-12-12, 3 days, **PENDING**.
- Robert Kim's sick-leave request transitioned Pending → **Approved**.
- **October 2026 payroll draft** generated (7 employees, net $49,762.47) — unapproved.
- An **unclosed punch-in session** for Sarah Jenkins from the first pass, still open.
- Attendance settings were modified during boundary testing but **restored** to 15 / 16 via Reset.

---

## Final Verdict

# READY WITH MINOR ISSUES

*(Updated after the BUG-A fix. The verdict below was **NOT READY** while logout was missing; the blocker has since been fixed and retested, so the verdict reverts.)*

**The P1 blocker is resolved.** "Sign out" now lives in the profile modal, reachable from the avatar in both shells. Retested end to end in V1 and V2: the session ends, the token is cleared from `localStorage` and `sessionStorage`, and it does not resurrect on reload. `npm test` is 9/9 and `npm run build` succeeds. What remains is the P2/P3 list — real, worth fixing, but none of it blocks a release.

Everything that was strong in the first pass is still strong, and in places stronger. There are no P0 failures. Injection payloads remain inert, there is no user enumeration, sessions expire correctly on a tampered token, self-approval is blocked on both leave and payroll, leave balances are enforced on client and server with three layers of feedback, payroll arithmetic is correct to the cent, and the audit trail captured every single action this pass took. The employee CRUD lifecycle — create, duplicate-reject, read, update, cancel-delete, terminate — completed cleanly end to end with `osama.riyad003@gmail.com`, including a double-submit guard I had not credited before. Two findings from the first report did not reproduce and have been withdrawn rather than carried forward.

But an HR platform in which **no user can sign out** is not shippable, and that is the state of the build as it stands right now. It is not a cosmetic gap: on any shared or unattended machine the session persists until someone clears browser storage by hand. During this QA pass I had to clear `localStorage` through the console to switch roles, because the product offers no other way. The regression traces to a single edit made to `App.jsx` at 17:17 today that removed `LayoutControlBar` without relocating the `logout` call it owned — so the fix is small and well understood. Restore a sign-out control (the profile modal is the natural home), and the verdict returns to **READY WITH MINOR ISSUES**, with BUG-01 and BUG-03 as the next two to clear.

The verdict is additionally qualified by the untested responsive dimension, blocked by a tooling constraint rather than any application fault. For a desktop-only release that is tolerable; for an HR dashboard users will open on phones and tablets, it should be closed before sign-off.

**Fix order:** ~~BUG-A (P1, blocking)~~ ✅ done → BUG-01 → BUG-03 → BUG-24 → responsive sweep.
