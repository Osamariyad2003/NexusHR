# HRDashboard button audit

Updated 2026-09-27: every `<button>` in `src/` was parsed and its click (or form submit) handler traced to what it actually calls.

| Result | Buttons |
|---|---|
| Working (saves, loads, navigates, downloads or changes what's shown) | 334 |
| Fake success (claims to do something it doesn't) | **0** |
| Disabled on purpose: needs a backend that doesn't exist yet (tooltip says "not available yet") | 37 |
| No click handler at all | 78 |
| Total | 449 |

## What was fixed

- **Payslips** are real: HR sets each employee's salary and the payroll deductions (Payroll Settings), generates a monthly draft run, reviews it and approves it; approved payslips appear on the employee's Payroll and Documents tabs and open as a printable page (print or save as PDF).
- **Payroll page** lists real runs (generate draft, approve, delete draft, CSV export, open any payslip). The old hard-coded list and per-employee mock page are gone.
- **Employees**: real employees (the header search and Alt + / filter them), real Add New Profile, real personal-info Save, CSV download, working pagination.
- **My Attendance**: real check in/out and shift history. **My Time Off**: real balances, requests, submit and cancel.
- **Company Info** loads and saves the real company profile. **CSV downloads** on the time-off and report pages export the table shown.
- Buttons whose feature needs a missing backend (file storage, email, Google Calendar, the settings screens that only hold demo data) are **disabled** instead of showing a fake "success".

## Disabled until their backend exists (37)

- **settings/DepartmentTreeSettingsView.jsx**: 41 [Not available yet], 66 [Not available yet], 79 [Not available yet], 92 [Not available yet], 106 [Not available yet], 119 [Not available yet], 133 [Not available yet], 146 [Not available yet], 159 [Not available yet], 172 [Not available yet]
- **documents/DocumentDetailView.jsx**: 56 Download, 65 Download, 135 [View Document (not available , 141 [Download File (not available 
- **recruitment/JobDetailView.jsx**: 196 Add Candidates, 231 [Share Job Link (not available, 239 [Activity History (not availab, 499 Save
- **timeoff/TimeOffSettingsView.jsx**: 181 [Not available yet], 278 [Not available yet], 573 Save & Assign Employee, 588 Create
- **attendance/AttendanceSettingsView.jsx**: 252 Save General Settings, 345 Save Location Changes
- **recruitment/CandidateDetailDrawer.jsx**: 262 Send Email, 328 Submit
- **settings/RbacSettingsView.jsx**: 417 [icon], 423 [icon]
- **settings/SubscriptionSettingsView.jsx**: 213 [icon], 219 [icon]
- **attendance/TeamAttendanceView.jsx**: 167 [Not available yet]
- **checklist/ChecklistSettingsView.jsx**: 153 [Share Template (not available
- **directory/AddNewProfileDrawer.jsx**: 130 {saving ? 'Creating…' : 'Creat
- **directory/EmployeeDetailView.jsx**: 633 Upload File
- **reports/HeadcountReportView.jsx**: 97 Import Data
- **settings/JobTitlesSettingsView.jsx**: 116 [Edit Job Title (not available
- **timeoff/MyTimeOffView.jsx**: 106 Sync With Google (coming soon)

## Still without a handler (78)

Not part of this pass: mostly pagination on demo tables, rich-text editor toolbars and icon-only row actions on screens that still show demo data.

- **directory/EmployeeDetailView.jsx** (9): lines 200, 424, 457, 479, 504, 537, 569, 651, 665
- **timeoff/EmployeeTimeOffView.jsx** (8): lines 173, 177, 319, 320, 321, 322, 324, 325
- **checklist/TaskEditDrawer.jsx** (7): lines 174, 177, 180, 184, 187, 190, 193
- **news/NewsDetailView.jsx** (7): lines 87, 90, 93, 97, 100, 103, 106
- **news/NewsFormView.jsx** (7): lines 116, 119, 122, 126, 129, 132, 135
- **messages/MessagesView.jsx** (6): lines 329, 445, 452, 459, 466, 511
- **timeoff/TeamTimeOffView.jsx** (6): lines 340, 341, 342, 343, 345, 346
- **recruitment/RecruitmentSettingsView.jsx** (4): lines 221, 284, 401, 490
- **attendance/TeamAttendanceView.jsx** (3): lines 182, 183, 184
- **documents/DocumentsFolderListView.jsx** (3): lines 207, 210, 213
- **recruitment/JobDetailView.jsx** (3): lines 351, 386, 428
- **checklist/ToDoListView.jsx** (2): lines 218, 224
- **reports/TimeOffReportView.jsx** (2): lines 329, 339
- **attendance/AttendanceSettingsView.jsx** (1): lines 285
- **auth/CompanyOnboardingWizard.jsx** (1): lines 368
- **checklist/OnboardingChecklistView.jsx** (1): lines 393
- **checklist/TemplateDetailView.jsx** (1): lines 188
- **documents/DocumentDetailView.jsx** (1): lines 164
- **documents/NewFolderDrawer.jsx** (1): lines 85
- **recruitment/AddCandidateDrawer.jsx** (1): lines 311
- **recruitment/CandidatesRosterView.jsx** (1): lines 254
- **recruitment/JobListView.jsx** (1): lines 237
- **settings/OfficesSettingsView.jsx** (1): lines 89
- **timeoff/TimeOffSettingsView.jsx** (1): lines 254
