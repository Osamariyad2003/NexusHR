import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  Mail,
  Phone,
  Edit2,
  FileText,
  Trash2,
  Download,
  UploadCloud,
  Loader2,
  ChevronDown,
  Briefcase,
  User,
  KeyRound,
  UserX,
  UserCheck
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { useResource } from '../../hooks/useResource';
import DropdownMenu from '../common/DropdownMenu';
import { EmployeePayslips, EmployeeSalaryCard } from '../payroll/EmployeePayslips';

export const EmployeeDetailView = ({ employee, onBack, onUpdated }) => {
  const { showToast, currentUser, employees } = useApp();
  const canManagePeople = ['SUPER_ADMIN', 'HR_MANAGER'].includes(currentUser?.role);
  const isSelf = currentUser?.id === employee?.id;
  const [activeTab, setActiveTab] = useState('general');

  // General tab Edit mode state (Screen 24)
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);

  // The record shown; refreshed from the server response after each save
  const [record, setRecord] = useState(employee);
  const text = (value) => (value === undefined || value === null || value === '' ? '—' : value);
  const nameParts = (record.name || '').split(' ');
  const empData = {
    ...record,
    first_name: record.first_name || nameParts[0] || '',
    last_name: record.last_name || nameParts.slice(1).join(' '),
    department_name: record.department_name || record.department,
    // The profile API stores the emergency contact as { name, relationship, phone }
    emergency_contact: record.emergency_contact && typeof record.emergency_contact === 'object' ? record.emergency_contact.name : record.emergency_contact,
    line_manager: record.line_manager && typeof record.line_manager === 'object' ? record.line_manager : null
  };

  const formFromRecord = (r) => ({
    fullName: `${r.first_name || ''} ${r.last_name || ''}`.trim() || r.name || '',
    gender: r.gender || '',
    dob: r.dob || '',
    email: r.email || '',
    nationality: r.nationality || '',
    phone: r.phone || '',
    healthInsurance: r.health_insurance || '',
    maritalStatus: r.marital_status || '',
    taxId: r.tax_id || '',
    socialInsurance: r.social_insurance || ''
  });
  const [formState, setFormState] = useState(() => formFromRecord(empData));

  // Names for the ids on the record (office, line manager, default work schedule)
  const { rows: offices } = useResource('offices', { quiet: true });
  const { rows: schedules } = useResource('workSchedules', { quiet: true });
  const officeName = offices.find((o) => o.id === record.office_id)?.name || record.office || '';
  const manager = (employees || []).find((e) => e.id === record.manager_id) || null;
  const defaultSchedule = schedules.find((sc) => sc.is_default) || null;
  const contact = record.emergency_contact && typeof record.emergency_contact === 'object' ? record.emergency_contact : null;
  const { rows: departmentList } = useResource('departments', { quiet: true });
  const { rows: jobTitleList } = useResource('jobTitles', { quiet: true });

  // Job history (HR, managers, the person) and HR's "edit job" form
  const [jobHistory, setJobHistory] = useState(null);
  const loadJobHistory = useCallback(() => {
    api.getJobHistory(record.id).then(setJobHistory, () => setJobHistory([]));
  }, [record.id]);
  useEffect(() => { if (activeTab === 'job') loadJobHistory(); }, [activeTab, loadJobHistory]);
  const jobFormFrom = (r) => ({
    job_title: r.job_title || '', department_id: r.department_id || '', employment_type: r.employment_type || 'FULL_TIME',
    manager_id: r.manager_id || '', office_id: r.office_id || '', shift_start: r.shift_start || '09:00',
    effective_date: new Date().toISOString().slice(0, 10)
  });
  const [jobForm, setJobForm] = useState(null); // null = not editing
  const [jobError, setJobError] = useState('');
  const [savingJob, setSavingJob] = useState(false);
  const saveJob = async (e) => {
    e.preventDefault();
    setSavingJob(true);
    setJobError('');
    try {
      const updated = await api.updateEmployee(record.id, { ...jobForm, manager_id: jobForm.manager_id || null, office_id: jobForm.office_id || null });
      applySaved(updated);
      setJobForm(null);
      loadJobHistory();
      showToast('Job details saved.', 'success');
    } catch (err) {
      setJobError(err.message);
    } finally {
      setSavingJob(false);
    }
  };
  const CHANGE_LABELS = { JOINED: 'Joined', CHANGED: 'Job change', TERMINATED: 'Left', REHIRED: 'Rejoined' };
  const address = [record.address, record.city, record.state, record.post_code, record.country];

  // HR's Action and status menus (never on your own record: no self-suspension or self-termination)
  const canAdminister = canManagePeople && !isSelf;
  const [dialog, setDialog] = useState(null); // null | 'password' | 'terminate'
  const [dialogValue, setDialogValue] = useState('');
  const [dialogError, setDialogError] = useState('');
  const [dialogBusy, setDialogBusy] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const openDialog = (kind) => {
    setDialogError('');
    setDialogValue(kind === 'terminate' ? today : '');
    setDialog(kind);
  };
  const STATUS_LABELS = { ACTIVE: 'Active', ON_LEAVE: 'On leave', SUSPENDED: 'Suspended' };
  const changeStatus = async (status) => {
    if (status === record.status) return;
    if (status === 'SUSPENDED' && !window.confirm(`Suspend ${empData.first_name}? They are signed out everywhere and can't sign in until reactivated.`)) return;
    try {
      const updated = await api.updateEmployee(record.id, { status });
      applySaved(updated);
      showToast(`${empData.first_name} is now ${STATUS_LABELS[status].toLowerCase()}.`, 'success');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  const submitDialog = async (e) => {
    e.preventDefault();
    setDialogBusy(true);
    setDialogError('');
    try {
      if (dialog === 'password') {
        const updated = await api.updateEmployee(record.id, { password: dialogValue });
        applySaved(updated);
        showToast(`New password set. ${empData.first_name} must choose their own at the next sign-in.`, 'success');
      } else {
        const res = await api.terminateEmployee(record.id, dialogValue);
        applySaved(res.data);
        showToast(res.message, 'success');
      }
      setDialog(null);
    } catch (err) {
      setDialogError(err.message);
    } finally {
      setDialogBusy(false);
    }
  };
  const actionItems = [
    { label: 'Edit job', icon: <Briefcase className="w-4 h-4" />, onSelect: () => { setActiveTab('job'); setJobError(''); setJobForm(jobFormFrom(record)); } },
    { label: 'Edit personal info', icon: <User className="w-4 h-4" />, onSelect: () => { setActiveTab('general'); setIsEditingPersonalInfo(true); } },
    { label: 'Upload document', icon: <UploadCloud className="w-4 h-4" />, onSelect: () => setActiveTab('documents') },
    canAdminister && record.status !== 'TERMINATED' && { label: 'Set a new password…', icon: <KeyRound className="w-4 h-4" />, onSelect: () => openDialog('password') },
    canAdminister && { divider: true },
    canAdminister && (record.status === 'TERMINATED'
      ? { label: 'Reactivate employee', icon: <UserCheck className="w-4 h-4" />, onSelect: () => changeStatus('ACTIVE') }
      : { label: 'Terminate employee…', icon: <UserX className="w-4 h-4" />, danger: true, onSelect: () => openDialog('terminate') })
  ];

  // Time since joining, e.g. "3 years 7 months"
  const serviceTime = (() => {
    if (!record.join_date) return '';
    const start = new Date(`${record.join_date}T00:00:00`);
    const now = new Date();
    let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    if (now.getDate() < start.getDate()) months -= 1;
    if (months < 0) return 'Not started yet';
    const years = Math.floor(months / 12);
    const rest = months % 12;
    const part = (n, unit) => (n ? `${n} ${unit}${n === 1 ? '' : 's'}` : '');
    return [part(years, 'year'), part(rest, 'month')].filter(Boolean).join(' ') || 'Less than a month';
  })();

  // Documents stored for this person (HR and the person themselves)
  const canSeeDocuments = canManagePeople || isSelf;
  const [files, setFiles] = useState(null);
  const [uploading, setUploading] = useState(false);
  const loadFiles = useCallback(() => {
    if (!canSeeDocuments) return;
    api.listFiles('employee', record.id).then(setFiles, () => setFiles([]));
  }, [canSeeDocuments, record.id]);
  useEffect(() => { if (activeTab === 'documents') loadFiles(); }, [activeTab, loadFiles]);

  const uploadDocument = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true);
    try {
      await api.uploadFile('employee', record.id, file);
      showToast(`${file.name} uploaded.`, 'success');
      loadFiles();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (file) => {
    if (!window.confirm(`Delete ${file.name}? This can't be undone.`)) return;
    try {
      await api.deleteFile(file.id);
      showToast(`${file.name} deleted.`, 'success');
      loadFiles();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const applySaved = (updated) => {
    setRecord((prev) => ({ ...prev, ...updated }));
    onUpdated?.();
  };

  const handleSaveGeneral = async (e) => {
    e.preventDefault();
    const [firstName, ...rest] = formState.fullName.trim().split(/\s+/);
    if (!firstName || rest.length === 0) {
      setSaveError('Enter both a first and a last name.');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const updated = await api.updateEmployee(record.id, {
        first_name: firstName,
        last_name: rest.join(' '),
        email: formState.email,
        gender: formState.gender,
        dob: formState.dob,
        nationality: formState.nationality,
        phone: formState.phone,
        health_insurance: formState.healthInsurance,
        marital_status: formState.maritalStatus,
        tax_id: formState.taxId,
        social_insurance: formState.socialInsurance
      });
      applySaved(updated);
      setFormState(formFromRecord(updated));
      setIsEditingPersonalInfo(false);
      showToast('Personal info saved.', 'success');
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Back Navigation Button */}
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm font-bold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-xs transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Detail Employee</span>
        </button>
      </div>

      {/* Main Detail Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column Profile Summary Card */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200/90 p-6 shadow-card space-y-6 self-start">
          {/* Avatar & Title */}
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              {empData.avatar ? (
                <img
                  src={empData.avatar}
                  alt={`${empData.first_name} ${empData.last_name}`}
                  className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 shadow-md"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-700 border-4 border-slate-100 shadow-md flex items-center justify-center text-2xl font-black">
                  {(empData.first_name?.[0] || '') + (empData.last_name?.[0] || '')}
                </div>
              )}
            </div>
            <h3 className="text-xl font-black text-slate-900">{empData.first_name} {empData.last_name}</h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{empData.job_title}</p>
            <div className="mt-3 flex items-center gap-1">
              {canAdminister && record.status !== 'TERMINATED' ? (
                <div className="w-auto">
                  <DropdownMenu
                    ariaLabel="Change status"
                    label={<><Badge status={empData.status} size="sm" /><ChevronDown className="w-3.5 h-3.5 text-slate-400" /></>}
                    buttonClassName="flex items-center gap-1 rounded-full focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    menuClassName="left-1/2 -translate-x-1/2"
                    items={Object.entries(STATUS_LABELS).map(([status, label]) => ({
                      label: status === record.status ? `${label} (current)` : label,
                      disabled: status === record.status,
                      onSelect: () => changeStatus(status)
                    }))}
                  />
                </div>
              ) : (
                <Badge status={empData.status} size="sm" />
              )}
            </div>
          </div>

          {/* Contact Details */}
          <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
            <div className="flex items-center gap-3 text-slate-600">
              <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="truncate">{empData.email}</span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>{text(empData.phone)}</span>
            </div>
          </div>

          {/* Department, office, line manager */}
          <div className="pt-4 border-t border-slate-100 space-y-3 text-xs">
            <div className="p-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Department</span>
              <span className="font-bold text-slate-800">{text(empData.department_name)}</span>
            </div>
            <div className="p-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Office</span>
              <span className="font-bold text-slate-800">{text(officeName)}</span>
            </div>
            <div className="p-1.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Line Manager</span>
              {manager ? (
                <div className="flex items-center gap-2 mt-1">
                  {manager.avatar && <img src={manager.avatar} alt={manager.name} className="w-5 h-5 rounded-full object-cover" />}
                  <span className="font-bold text-slate-800">{manager.name}</span>
                </div>
              ) : (
                <span className="font-bold text-slate-800 block mt-1">—</span>
              )}
            </div>
          </div>

          {canManagePeople && (
            <div className="pt-2">
              <DropdownMenu
                label={<><span>Action</span><ChevronDown className="w-4 h-4" /></>}
                buttonClassName="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
                menuClassName="w-full"
                items={actionItems}
              />
            </div>
          )}
        </div>

        {/* Right Column Detailed Information Tabs */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden flex flex-col">
          
          {/* Navigation Tabs Header */}
          <div className="border-b border-slate-200 px-6 pt-4 flex items-center gap-8 overflow-x-auto scrollbar-none">
            {['general', 'job', 'payroll', 'documents'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-sm font-bold capitalize transition-all border-b-2 whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content Body */}
          <div className="p-6 space-y-8 flex-1">
            
            {/* ==================== 1. GENERAL TAB (Screen 23 & Screen 24 Edit Mode) ==================== */}
            {activeTab === 'general' && (
              <>
                {/* Personal Info Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <h4 className="text-base font-bold text-slate-900">Personal Info</h4>
                    {canManagePeople && <button
                      onClick={() => setIsEditingPersonalInfo(!isEditingPersonalInfo)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Edit Personal Info (Screen 24)"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>}
                  </div>

                  {isEditingPersonalInfo ? (
                    /* Screen 24: Form Inputs Edit Mode */
                    <form onSubmit={handleSaveGeneral} className="space-y-4 pt-2">
                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Full Name <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          value={formState.fullName}
                          onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Gender <span className="text-rose-500">*</span></label>
                          <select
                            value={formState.gender}
                            onChange={(e) => setFormState({ ...formState, gender: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">Not specified</option>
                            <option value="Female">Female</option>
                            <option value="Male">Male</option>
                            <option value="Non-binary">Non-binary</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Date of Birth <span className="text-rose-500">*</span></label>
                          <div className="relative">
                            <input
                              type="date"
                              max={new Date().toISOString().slice(0, 10)}
                              value={formState.dob}
                              onChange={(e) => setFormState({ ...formState, dob: e.target.value })}
                              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Email Address <span className="text-rose-500">*</span></label>
                          <input
                            type="email"
                            required
                            value={formState.email}
                            onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                          <label className="block text-xs font-bold text-slate-700 mt-2">Nationality <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            value={formState.nationality}
                            onChange={(e) => setFormState({ ...formState, nationality: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Phone Number <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            value={formState.phone}
                            onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                          <label className="block text-xs font-bold text-slate-700 mt-2">Health Care <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            value={formState.healthInsurance}
                            onChange={(e) => setFormState({ ...formState, healthInsurance: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Marital Status <span className="text-rose-500">*</span></label>
                          <select
                            value={formState.maritalStatus}
                            onChange={(e) => setFormState({ ...formState, maritalStatus: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                          >
                            <option value="">Not specified</option>
                            {['Single', 'Married', 'Domestic partnership', 'Separated', 'Divorced', 'Widowed'].map((m) => (
                              <option key={m} value={m}>{m}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="block text-xs font-bold text-slate-700">Personal Tax ID <span className="text-rose-500">*</span></label>
                          <input
                            type="text"
                            placeholder="Input here"
                            value={formState.taxId}
                            onChange={(e) => setFormState({ ...formState, taxId: e.target.value })}
                            className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-xs font-bold text-slate-700">Social Insurance <span className="text-rose-500">*</span></label>
                        <input
                          type="text"
                          placeholder="Input here"
                          value={formState.socialInsurance}
                          onChange={(e) => setFormState({ ...formState, socialInsurance: e.target.value })}
                          className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      {saveError && <p className="text-xs text-rose-600 font-medium">{saveError}</p>}
                      <div className="flex items-center justify-end gap-3 pt-4">
                        <button
                          type="button"
                          onClick={() => { setIsEditingPersonalInfo(false); setSaveError(''); setFormState(formFromRecord(empData)); }}
                          className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={saving}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 shadow-md disabled:opacity-60"
                        >
                          {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Read-Only Display Mode (Screen 23) */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Full Name</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{text(formState.fullName)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Gender</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{text(formState.gender)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Date of Birth</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{text(formState.dob)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Marital Status</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{formState.maritalStatus || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Nationality</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{text(formState.nationality)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Personal Tax ID</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{formState.taxId || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Email Address</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{text(formState.email)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Social Insurance</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{formState.socialInsurance || '-'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Health Insurance</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{text(formState.healthInsurance)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Phone Number</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{text(formState.phone)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Address */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="pb-2 border-b border-slate-100">
                    <h4 className="text-base font-bold text-slate-900">Address</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-xs">
                    {[['Street address', 0], ['City', 1], ['State/Province', 2], ['Post Code', 3], ['Country', 4]].map(([label, i]) => (
                      <div key={label} className={i === 0 ? 'sm:col-span-2' : ''}>
                        <span className="text-slate-400 block font-medium">{label}</span>
                        <span className="font-bold text-slate-800 mt-0.5 block">{text(address[i])}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Emergency contact (the person edits it in My profile) */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <div className="pb-2 border-b border-slate-100">
                    <h4 className="text-base font-bold text-slate-900">Emergency Contact</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-y-4 gap-x-8 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Full Name</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{text(contact?.name)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Relationship</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{text(contact?.relationship)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Phone</span>
                      <span className="font-bold text-slate-800 mt-0.5 block">{text(contact?.phone)}</span>
                    </div>
                  </div>
                  {isSelf && <p className="text-[11px] text-slate-400">Change your address and emergency contact in My profile (your picture, top right).</p>}
                </div>
              </>
            )}

            {/* ==================== 2. JOB TAB ==================== */}
            {activeTab === 'job' && (
              <div className="space-y-6">
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
                  <div className="pb-2 border-b border-slate-100">
                    <h4 className="text-base font-bold text-slate-900">Employment Information</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Employee ID</span>
                      <span className="font-bold text-slate-900 mt-1 block font-mono">{text(record.id)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Service Time</span>
                      <span className="font-bold text-slate-900 mt-1 block">{text(serviceTime)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Join Date</span>
                      <span className="font-bold text-slate-900 mt-1 block font-mono">{text(record.join_date)}</span>
                    </div>
                  </div>
                </div>

                {/* HR: change the job (recorded in the history from the effective date) */}
                {canManagePeople && (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="text-base font-bold text-slate-900">Current Job</h4>
                      {!jobForm && (
                        <button onClick={() => { setJobError(''); setJobForm(jobFormFrom(record)); }} className="px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 flex items-center gap-1.5">
                          <Edit2 className="w-3.5 h-3.5" /> Edit job
                        </button>
                      )}
                    </div>
                    {jobForm ? (
                      <form onSubmit={saveJob} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <label className="space-y-1">
                          <span className="block font-bold text-slate-700">Job title</span>
                          <input id="job-title" list="job-title-options" required maxLength={100} value={jobForm.job_title} onChange={(e) => setJobForm({ ...jobForm, job_title: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500" />
                          <datalist id="job-title-options">{jobTitleList.filter((t) => t.active !== false).map((t) => <option key={t.id} value={t.title} />)}</datalist>
                        </label>
                        <label className="space-y-1">
                          <span className="block font-bold text-slate-700">Department</span>
                          <select id="job-department" required value={jobForm.department_id} onChange={(e) => setJobForm({ ...jobForm, department_id: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500">
                            {departmentList.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        </label>
                        <label className="space-y-1">
                          <span className="block font-bold text-slate-700">Employment type</span>
                          <select id="job-employment-type" value={jobForm.employment_type} onChange={(e) => setJobForm({ ...jobForm, employment_type: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500">
                            <option value="FULL_TIME">Full time</option>
                            <option value="PART_TIME">Part time</option>
                            <option value="CONTRACTOR">Contractor</option>
                          </select>
                        </label>
                        <label className="space-y-1">
                          <span className="block font-bold text-slate-700">Line manager</span>
                          <select id="job-manager" value={jobForm.manager_id} onChange={(e) => setJobForm({ ...jobForm, manager_id: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500">
                            <option value="">No line manager</option>
                            {(employees || []).filter((u) => u.id !== record.id && u.status !== 'TERMINATED').map((u) => <option key={u.id} value={u.id}>{u.name || `${u.first_name} ${u.last_name}`}</option>)}
                          </select>
                        </label>
                        <label className="space-y-1">
                          <span className="block font-bold text-slate-700">Office</span>
                          <select id="job-office" value={jobForm.office_id} onChange={(e) => setJobForm({ ...jobForm, office_id: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500">
                            <option value="">No office</option>
                            {offices.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                          </select>
                        </label>
                        <label className="space-y-1">
                          <span className="block font-bold text-slate-700">Shift start</span>
                          <input type="time" required value={jobForm.shift_start} onChange={(e) => setJobForm({ ...jobForm, shift_start: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500" />
                        </label>
                        <label className="space-y-1 sm:col-span-2">
                          <span className="block font-bold text-slate-700">Effective from</span>
                          <input id="job-effective-date" type="date" required min={record.join_date || undefined} value={jobForm.effective_date} onChange={(e) => setJobForm({ ...jobForm, effective_date: e.target.value })} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 sm:w-56" />
                          <span className="block text-[11px] text-slate-400">A change of title, department, employment type or line manager is added to the job history from this date.</span>
                        </label>
                        {jobError && <p role="alert" className="sm:col-span-2 text-xs font-semibold text-rose-600">{jobError}</p>}
                        <div className="sm:col-span-2 flex justify-end gap-2">
                          <button type="button" onClick={() => setJobForm(null)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50">Cancel</button>
                          <button type="submit" disabled={savingJob} className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60">{savingJob ? 'Saving…' : 'Save job'}</button>
                        </div>
                      </form>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                        <div><span className="text-slate-400 font-medium block">Job title</span><span className="font-bold text-slate-900 mt-1 block">{text(record.job_title)}</span></div>
                        <div><span className="text-slate-400 font-medium block">Department</span><span className="font-bold text-slate-900 mt-1 block">{text(empData.department_name)}</span></div>
                        <div><span className="text-slate-400 font-medium block">Employment type</span><span className="font-bold text-slate-900 mt-1 block">{text(record.employment_type?.replace('_', ' '))}</span></div>
                      </div>
                    )}
                  </div>
                )}

                {/* Job history, newest first */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-4">
                  <div className="pb-2 border-b border-slate-100">
                    <h4 className="text-base font-bold text-slate-900">Job History</h4>
                  </div>
                  {jobHistory === null && <p className="text-xs text-slate-400">Loading job history…</p>}
                  {jobHistory?.length === 0 && <p className="text-xs text-slate-500">Job history is visible to HR, the employee's managers and the employee.</p>}
                  {jobHistory?.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs" data-testid="job-history">
                        <thead>
                          <tr className="text-slate-400 border-b border-slate-100">
                            <th className="pb-2 font-bold">Effective Date</th>
                            <th className="pb-2 font-bold">Event</th>
                            <th className="pb-2 font-bold">Job Title</th>
                            <th className="pb-2 font-bold">Department</th>
                            <th className="pb-2 font-bold">Employment Type</th>
                            <th className="pb-2 font-bold">Line Manager</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jobHistory.map((j) => (
                            <tr key={j.id} className="border-b border-slate-50 text-slate-800 font-medium">
                              <td className="py-2.5 font-mono">{text(j.effective_date)}</td>
                              <td className="py-2.5">{CHANGE_LABELS[j.change] || j.change}</td>
                              <td className="py-2.5">{text(j.job_title)}</td>
                              <td className="py-2.5">{text(j.department)}</td>
                              <td className="py-2.5">{text(j.employment_type?.replace('_', ' '))}</td>
                              <td className="py-2.5">{text(j.manager_name)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                  {jobHistory?.some((j) => j.derived) && (
                    <p className="text-[11px] text-slate-400">This record predates job history, so only the position on file is shown; changes from now on are added here.</p>
                  )}
                </div>

                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 space-y-3">
                  <h4 className="text-base font-bold text-slate-900">Work Schedule</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium block">Schedule</span>
                      <span className="font-bold text-slate-900 mt-1 block">{text(defaultSchedule?.name)}{defaultSchedule ? ' (company default)' : ''}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium block">Shift Start</span>
                      <span className="font-bold text-slate-900 mt-1 block font-mono">{text(record.shift_start)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==================== 3. PAYROLL TAB ==================== */}
            {activeTab === 'payroll' && (
              <div className="space-y-6">
                {canManagePeople || isSelf ? (
                  <>
                    <div className="bg-slate-50/70 rounded-2xl p-5 border border-slate-200/70 grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6 text-xs">
                      <div>
                        <span className="text-slate-400 block font-medium">Employee Status</span>
                        <span className="font-bold text-slate-900 block mt-0.5">{text(empData.status)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Job Title</span>
                        <span className="font-bold text-slate-900 block mt-0.5">{text(empData.job_title)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Employment Type</span>
                        <span className="font-bold text-slate-900 block mt-0.5">{text(empData.employment_type?.replace('_', ' '))}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Join Date</span>
                        <span className="font-bold text-slate-900 block mt-0.5 font-mono">{text(empData.join_date)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Shift Start</span>
                        <span className="font-bold text-slate-900 block mt-0.5 font-mono">{text(empData.shift_start)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">Department</span>
                        <span className="font-bold text-slate-900 block mt-0.5">{text(empData.department_name)}</span>
                      </div>
                    </div>
                    <EmployeeSalaryCard employee={record} canEdit={canManagePeople && !isSelf} isSelf={isSelf} onSaved={applySaved} />
                    <EmployeePayslips employeeId={record.id} />
                  </>
                ) : (
                  <p className="text-xs text-slate-500">Payroll details are visible only to HR and to the employee.</p>
                )}
              </div>
            )}

            {/* ==================== 4. DOCUMENTS TAB ==================== */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                {canSeeDocuments ? (
                  <div className="bg-white rounded-2xl border border-slate-200/80 p-6 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="text-base font-bold text-slate-900">Personal Documents</h4>
                      <label className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${uploading ? 'bg-slate-200 text-slate-500 cursor-wait' : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer'}`}>
                        {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                        <span>{uploading ? 'Uploading…' : 'Upload File'}</span>
                        <input type="file" data-testid="employee-document-input" className="hidden" disabled={uploading} onChange={uploadDocument} />
                      </label>
                    </div>
                    {files === null && <p className="text-xs text-slate-400">Loading documents…</p>}
                    {files?.length === 0 && (
                      <p className="text-xs text-slate-500">No documents yet. Upload contracts, IDs or certificates (PDF, Office files or images, up to 5 MB).</p>
                    )}
                    {files?.length > 0 && (
                      <ul className="divide-y divide-slate-100">
                        {files.map((f) => (
                          <li key={f.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                              <span className="font-bold text-slate-800 truncate">{f.name}</span>
                              <span className="text-slate-400 shrink-0">{Math.max(1, Math.round((f.size || 0) / 1024))} KB</span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button onClick={() => api.downloadFile(f.id, f.name).catch((err) => showToast(err.message, 'error'))} className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100" title="Download" aria-label={`Download ${f.name}`}>
                                <Download className="w-4 h-4" />
                              </button>
                              <button onClick={() => deleteDocument(f)} className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50" title="Delete" aria-label={`Delete ${f.name}`}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">Personal documents are visible only to HR and to the employee.</p>
                )}
                {canSeeDocuments && <EmployeePayslips employeeId={record.id} />}
              </div>
            )}

          </div>
        </div>
      </div>

      {dialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !dialogBusy) setDialog(null); }}>
          <form role="dialog" aria-label={dialog === 'password' ? 'Set a new password' : 'Terminate employee'} onSubmit={submitDialog} className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-black text-slate-900">
              {dialog === 'password' ? `Set a new password for ${empData.first_name}` : `Terminate ${empData.first_name} ${empData.last_name}`}
            </h3>
            {dialog === 'password' ? (
              <>
                <p className="text-xs text-slate-500">Give them this password yourself. They are signed out everywhere and must choose their own at the next sign-in.</p>
                <input id="action-new-password" type="text" required autoComplete="off" value={dialogValue} onChange={(e) => setDialogValue(e.target.value)} placeholder="At least 8 characters, upper and lower case, a digit" className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
              </>
            ) : (
              <>
                <p className="text-xs text-slate-500">Their access ends immediately and they are signed out everywhere. Payroll pays up to the last working day. The record is kept and can be reactivated.</p>
                <label className="block text-xs font-bold text-slate-700">
                  Last working day
                  <input id="action-terminated-on" type="date" required max={today} min={record.join_date || undefined} value={dialogValue} onChange={(e) => setDialogValue(e.target.value)} className="mt-1 w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:border-emerald-500" />
                </label>
              </>
            )}
            {dialogError && <p role="alert" className="text-xs font-semibold text-rose-600">{dialogError}</p>}
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDialog(null)} disabled={dialogBusy} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50">Cancel</button>
              <button type="submit" disabled={dialogBusy} className={`px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-60 ${dialog === 'terminate' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-900 hover:bg-slate-800'}`}>
                {dialogBusy ? 'Saving…' : dialog === 'password' ? 'Set password' : 'Terminate'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
