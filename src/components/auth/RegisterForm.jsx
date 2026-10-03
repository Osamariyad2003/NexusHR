import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Check, Users, LayoutGrid } from 'lucide-react';

export const RegisterForm = ({ onRegister, onSwitchToLogin, errorMsg, initial = {} }) => {
  // Kept when the person comes back from the company step
  const [name, setName] = useState(initial.name || '');
  const [email, setEmail] = useState(initial.email || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const isValidEmail = email.trim().includes('@') && email.trim().includes('.');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    onRegister({ name: name.trim(), email: email.trim(), password });
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white text-slate-900 font-sans">
      {/* Left Split: Create Account Form (Matching Figma Images 4 & 5) */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 lg:p-16 bg-white overflow-y-auto">
        <div className="max-w-md w-full mx-auto my-auto space-y-8">
          {/* Headline & Subhead */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug">
              Manage employees easily starting from now!
            </h2>
            <p className="text-sm text-slate-500 font-medium">
              Get started for free today!
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Input your full name"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Work Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Work Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@company.com"
                  className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${
                    isValidEmail
                      ? 'border-emerald-500 focus:ring-emerald-500/20'
                      : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {isValidEmail && (
                  <Check className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
                )}
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Input your password account"
                  className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!name || !email || !password}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all ${
                name && email && password
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Create Account
            </button>
          </form>

          {/* Social sign-in (Google/Apple) is not implemented; the fake buttons that signed in with fixed demo credentials were removed */}

          {/* Switch to Login link */}
          <div className="text-center text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onSwitchToLogin}
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Login Here
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 text-center text-[11px] text-slate-400 space-x-4">
          <span>&copy; 2025 NexusHR. All rights reserved.</span>
          <a href="#terms" className="hover:text-slate-600 font-semibold">Terms & Conditions</a>
          <a href="#privacy" className="hover:text-slate-600 font-semibold">Privacy Policy</a>
        </div>
      </div>

      {/* Right Split: Vibrant Emerald Green Hero & Dashboard Card Preview (Matching Figma Images 4 & 5) */}
      <div className="w-full md:w-1/2 bg-emerald-600 text-white flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden">
        {/* Hero Title */}
        <div className="space-y-3 z-10 max-w-md">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Let’s empower your employees today.
          </h1>
          <p className="text-sm text-emerald-100">
            We help to complete all your conveyancing needs easily
          </p>
        </div>

        {/* Dashboard Preview Card Mockup (Matching Figma Right Side Component) */}
        <div className="my-8 z-10 bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border border-white/20 transform rotate-1 hover:rotate-0 transition-transform duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2 font-bold text-sm">
              <span className="text-emerald-600">✳ Humanline</span>
            </div>
            <div className="text-xs text-slate-400 font-mono">Q Search...</div>
          </div>
          
          <div className="mt-4 space-y-3">
            <h3 className="text-lg font-black text-slate-900">Hi there</h3>
            <p className="text-xs text-slate-400">This is your HR report so far</p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Total Employees</span>
                <div className="text-xl font-black text-slate-900 mt-1">3,540</div>
                <span className="text-[10px] font-bold text-emerald-600">+25.5%</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Job Applicants</span>
                <div className="text-xl font-black text-slate-900 mt-1">1,150</div>
                <span className="text-[10px] font-bold text-emerald-600">+4.10%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="z-10 text-xs text-emerald-200">
          <span>Enterprise Management Cockpit Suite v1.0</span>
        </div>
      </div>
    </div>
  );
};
