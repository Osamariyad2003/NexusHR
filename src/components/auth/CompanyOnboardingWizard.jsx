import React, { useEffect, useState } from 'react';
import { ShieldCheck, Info, Check, Lock, AlertCircle, Loader2, Mail } from 'lucide-react';
import { api } from '../../services/api';

// Same rule as the server: lower-case letters, digits and dashes, 2-40 characters, starting with a letter or digit
const WORKSPACE_PATTERN = /^[a-z0-9][a-z0-9-]{1,39}$/;
const toWorkspace = (name) => name.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');

const optionClass = (selected) => `p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
  selected ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
}`;
const Radio = ({ selected }) => (
  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`}>
    {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
  </div>
);

const COMPANY_SIZES = ['1-10', '11-50', '51-100', '101-200', '201-500', '500+'];
const INDUSTRIES = ['Crypto', 'E-Commerce', 'Fintech', 'Health Tech', 'Software Outsourcing', 'Other'];
const ROLES = ['CEO/Owner/Founder', 'HR Manager', 'HR Staff', 'IT/Tech Manager', 'IT/Tech Staff', 'Other'];
const GOALS = [
  { id: 'Onboarding new employees', desc: 'I want to onboard a lot of new employees in a consistent and systematic way.' },
  { id: 'Online time tracking', desc: 'I want to track and approve time attendance and time off online, from anywhere.' },
  { id: 'Performance management', desc: 'I want to manage and maintain employee performance in a continuous and objective way.' },
  { id: 'Employee engagement', desc: 'I want to keep my employees happy, engaged, active, and motivated.' },
  { id: 'Recruitment', desc: 'I want to hire the best talents to improve business performance and employer branding.' }
];
const TITLES = {
  1: 'We need some of your Company Information',
  2: 'We can now create a workspace for your team.',
  3: 'What is your role in your company?',
  4: 'What will you mainly use NexusHR for?',
  5: 'Check your email'
};
const LAST_STEP = 5;
const RESEND_AFTER_MS = 60_000;

/**
 * Company sign-up, after the account step: company name, workspace name (checked live), size,
 * industry, role and goal, then the code emailed to the person (proves the address is theirs).
 * onComplete creates the company; if it throws, the message is shown on the step it concerns and
 * everything typed is kept.
 */
export const CompanyOnboardingWizard = ({ email, onComplete, onCancel }) => {
  const [step, setStep] = useState(1); // 1 … LAST_STEP

  const [companyName, setCompanyName] = useState('');
  const [workspace, setWorkspace] = useState('');
  const [workspaceEdited, setWorkspaceEdited] = useState(false);
  // The last availability answer: { name, available (true/false/null = unknown), reason }
  const [workspaceCheck, setWorkspaceCheck] = useState(null);
  const [companySize, setCompanySize] = useState('1-10');
  const [industry, setIndustry] = useState('');
  const [role, setRole] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  // Email verification: the code typed, when the last code was sent, and a clock for "Resend in N s"
  const [emailCode, setEmailCode] = useState('');
  const [codeSentAt, setCodeSentAt] = useState(null);
  const [sendingCode, setSendingCode] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const resendIn = codeSentAt ? Math.max(0, Math.ceil((codeSentAt + RESEND_AFTER_MS - now) / 1000)) : 0;
  useEffect(() => {
    if (step !== LAST_STEP || resendIn === 0) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step, resendIn]);

  const sendCode = async () => {
    setSendingCode(true);
    setError('');
    try {
      await api.requestSignupCode(email);
      setCodeSentAt(Date.now());
      setNow(Date.now());
      setEmailCode('');
    } catch (err) {
      setError(err.message || 'Could not send the code. Please try again.');
    } finally {
      setSendingCode(false);
    }
  };

  const handleNameChange = (val) => {
    setCompanyName(val);
    if (!workspaceEdited) setWorkspace(toWorkspace(val));
  };

  // Live "is this workspace name free?" check, shortly after typing stops
  const workspaceValid = WORKSPACE_PATTERN.test(workspace);
  useEffect(() => {
    if (!workspaceValid) return undefined;
    let current = true;
    const timer = setTimeout(async () => {
      try {
        const res = await api.checkWorkspace(workspace);
        if (current) setWorkspaceCheck({ name: workspace, available: Boolean(res.available), reason: res.reason });
      } catch {
        if (current) setWorkspaceCheck({ name: workspace, available: null, reason: 'Could not check the name right now. You can still continue.' });
      }
    }, 400);
    return () => { current = false; clearTimeout(timer); };
  }, [workspace, workspaceValid]);

  const checked = workspaceCheck?.name === workspace ? workspaceCheck : null;
  const workspaceProblem = !workspace
    ? 'Choose a workspace name.'
    : !workspaceValid
      ? 'Use 2-40 lower-case letters, digits or dashes, starting with a letter or digit.'
      : checked?.available === false
        ? (checked.reason || 'This workspace name is already taken.')
        : '';

  // What still blocks Continue on the current step
  const stepProblem = () => {
    if (step === 1) {
      if (!companyName.trim()) return 'Type the name of your company.';
      if (workspaceProblem) return workspaceProblem;
      if (!checked) return 'Still checking the workspace name. Try again in a moment.';
    }
    if (step === 2 && !industry) return 'Choose your industry.';
    if (step === 3 && (!role || (role === 'Other' && !customRole.trim()))) return 'Choose your role.';
    if (step === 4 && !primaryGoal) return 'Choose what you will mainly use NexusHR for.';
    if (step === LAST_STEP && !/^\d{6}$/.test(emailCode)) return 'Type the 6-digit code from the email.';
    return '';
  };

  const handleNext = async () => {
    const problem = stepProblem();
    if (problem) { setError(problem); return; }
    setError('');
    if (step < LAST_STEP) {
      setStep(step + 1);
      // The code is sent on reaching its step, so it can't expire while the company steps are filled in
      if (step + 1 === LAST_STEP && !codeSentAt) sendCode();
      return;
    }
    setSubmitting(true);
    try {
      await onComplete({
        companyName: companyName.trim(),
        workspace,
        companySize,
        industry,
        emailCode
      });
    } catch (err) {
      const message = err.message || 'Could not create the workspace. Please try again.';
      setError(message);
      if (err.status === 409 || /workspace/i.test(message)) {
        // The name was taken meanwhile, or refused: back to the step where it can be changed
        setWorkspaceCheck(null);
        setStep(1);
      } else if (err.status === 429 && /code/i.test(message)) {
        // Too many wrong codes: that code is spent, a new one is needed
        setEmailCode('');
        setCodeSentAt((sent) => (sent ? sent - RESEND_AFTER_MS : sent));
      }
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    setError('');
    if (step > 1) setStep(step - 1);
    else onCancel();
  };

  const workspaceSummary = (label, locked) => (
    <div className="space-y-1">
      <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</label>
      <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-sm font-bold text-slate-800">
        <span>{workspace}</span>
        {locked && <Lock className="w-4 h-4 text-slate-400" />}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col justify-between p-6 lg:p-10 font-sans">
      {/* Brand Header */}
      <div className="flex items-center gap-2.5">
        <div className="h-9 w-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-600/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-black text-slate-900 text-lg tracking-tight">NexusHR</span>
      </div>

      <div className="my-auto max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center py-8">

        {/* Left: progress, headline, navigation */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              {Array.from({ length: LAST_STEP }, (_, i) => i + 1).map((s) => (
                <div key={s} className={`h-2.5 rounded-full transition-all duration-300 ${s <= step ? 'w-8 bg-emerald-500' : 'w-4 bg-slate-200'}`} />
              ))}
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block font-mono">STEP {step} OF {LAST_STEP}</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight animate-fadeIn">{TITLES[step]}</h1>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              This data is needed so that we can easily provide solutions according to your company’s capacity
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4">
            <button
              type="button"
              onClick={handleBack}
              disabled={submitting}
              className="px-6 py-3 rounded-2xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 disabled:opacity-60 transition-colors shadow-xs"
            >
              {step === 1 ? 'Back' : 'Go Back'}
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={submitting}
              className="px-8 py-3 rounded-2xl text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-60 shadow-md transition-all flex items-center gap-2"
            >
              {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {step === LAST_STEP ? (submitting ? 'Creating workspace…' : 'Launch Workspace') : 'Continue'}
            </button>
          </div>
          {error && (
            <p role="alert" className="text-xs font-semibold text-rose-600 flex items-start gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>

        {/* Right: the step's form */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-8 sm:p-10 shadow-xl border border-slate-200/80 space-y-6 animate-fadeIn">

          {step === 1 && (
            <div className="space-y-5 animate-fadeIn">
              <h2 className="text-xl font-bold text-slate-900">Type the name of your company</h2>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="onboarding-company" className="block text-xs font-bold text-slate-700">Company Name <span className="text-rose-500">*</span></label>
                  <input
                    id="onboarding-company"
                    type="text"
                    required
                    maxLength={100}
                    value={companyName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Acme Ltd"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="onboarding-workspace" className="block text-xs font-bold text-slate-700">Workspace name <span className="text-rose-500">*</span></label>
                  <input
                    id="onboarding-workspace"
                    type="text"
                    maxLength={40}
                    autoCapitalize="none"
                    spellCheck={false}
                    value={workspace}
                    onChange={(e) => { setWorkspaceEdited(true); setWorkspace(e.target.value.toLowerCase().replace(/\s+/g, '-')); }}
                    placeholder="e.g. acme"
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {workspace && (
                    <p
                      data-testid="workspace-status"
                      className={`text-[11px] font-semibold pt-1 ${workspaceProblem ? 'text-rose-600' : checked?.available ? 'text-emerald-600' : 'text-slate-400'}`}
                    >
                      {workspaceProblem || (checked?.available ? 'Available' : checked ? checked.reason : 'Checking…')}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1">
                    <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>Your team types this in the Workspace field when they sign in.</span>
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  <label className="block text-xs font-bold text-slate-900">What is the size of your company</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {COMPANY_SIZES.map((size) => (
                      <button type="button" key={size} onClick={() => setCompanySize(size)} className={optionClass(companySize === size)}>
                        <span>{size}</span>
                        <Radio selected={companySize === size} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fadeIn">
              {workspaceSummary('Workspace', true)}
              <div className="space-y-3 pt-3">
                <h2 className="text-xl font-bold text-slate-900">What is your industry?</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {INDUSTRIES.map((ind) => (
                    <button type="button" key={ind} onClick={() => setIndustry(ind)} className={optionClass(industry === ind)}>
                      <span>{ind}</span>
                      <Radio selected={industry === ind} />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fadeIn">
              {workspaceSummary('Your Workspace')}
              <div className="space-y-3 pt-2">
                <h2 className="text-xl font-bold text-slate-900">Choose role</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {ROLES.map((r) => (
                    <button type="button" key={r} onClick={() => setRole(r)} className={optionClass(role === r)}>
                      <span>{r}</span>
                      <Radio selected={role === r} />
                    </button>
                  ))}
                </div>
                {role === 'Other' && (
                  <div className="space-y-1.5 pt-3 animate-fadeIn">
                    <label htmlFor="onboarding-role" className="block text-xs font-bold text-slate-700">Input Your Role <span className="text-rose-500">*</span></label>
                    <input
                      id="onboarding-role"
                      type="text"
                      required
                      maxLength={60}
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      placeholder="e.g. Office Manager"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5 animate-fadeIn">
              {workspaceSummary('Your Workspace')}
              <div className="space-y-3 pt-2">
                <h2 className="text-xl font-bold text-slate-900">Choose according to your needs</h2>
                <div className="space-y-3">
                  {GOALS.map((g) => {
                    const isSelected = primaryGoal === g.id;
                    return (
                      <button
                        type="button"
                        key={g.id}
                        onClick={() => setPrimaryGoal(g.id)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-start justify-between gap-4 transition-all ${
                          isSelected ? 'border-emerald-500 bg-emerald-50/40 ring-2 ring-emerald-500/20' : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <div className="space-y-1">
                          <h4 className="font-bold text-sm text-slate-900">{g.id}</h4>
                          <p className="text-xs text-slate-500">{g.desc}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {step === LAST_STEP && (
            <div className="space-y-5 animate-fadeIn">
              {workspaceSummary('Your Workspace')}
              <div className="space-y-3 pt-2">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-emerald-600" />
                  <span>Enter the code we emailed you</span>
                </h2>
                <p data-testid="code-status" className="text-xs text-slate-500">
                  {sendingCode
                    ? <>Sending a code to <span className="font-semibold text-slate-700">{email}</span>…</>
                    : codeSentAt
                      ? <>We sent a 6-digit code to <span className="font-semibold text-slate-700">{email}</span>. It is valid for 10 minutes.</>
                      : <>We need to send a code to <span className="font-semibold text-slate-700">{email}</span>.</>}
                </p>
                <div className="space-y-1.5">
                  <label htmlFor="onboarding-email-code" className="block text-xs font-bold text-slate-700">Verification code <span className="text-rose-500">*</span></label>
                  <input
                    id="onboarding-email-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleNext(); }}
                    placeholder="123456"
                    className="w-full sm:w-48 px-4 py-3 bg-white border border-slate-200 rounded-2xl text-lg font-mono tracking-[0.4em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-500">Didn't get it? Check your spam folder, or</span>
                  <button
                    type="button"
                    onClick={sendCode}
                    disabled={sendingCode || resendIn > 0}
                    className="font-bold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {resendIn > 0 ? `resend in ${resendIn} s` : codeSentAt ? 'resend code' : 'send code'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="text-center text-[11px] text-slate-400 space-x-4 pt-4">
        <span>&copy; {new Date().getFullYear()} NexusHR. All rights reserved.</span>
        <a href="#terms" className="font-semibold hover:text-slate-600">Terms & Conditions</a>
        <a href="#privacy" className="font-semibold hover:text-slate-600">Privacy Policy</a>
      </div>
    </div>
  );
};
