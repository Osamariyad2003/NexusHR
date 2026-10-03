import React, { useState } from 'react';
import { api } from '../../services/api';
import { GoogleSignInButton } from './GoogleSignInButton';
import { Eye, EyeOff, Check, AlertCircle, ShieldCheck } from 'lucide-react';

export const LoginForm = ({ onLogin, onGoogleLogin, onSwitchToRegister, onForgotPassword, errorMsg }) => {
  const [email, setEmail] = useState('');
  // Company workspace (for servers hosting several companies); remembered on this browser
  const [workspace, setWorkspace] = useState(() => api.getWorkspace());
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const isValidEmail = email.trim().includes('@') && email.trim().includes('.');

  const handleSubmit = (e) => {
    e.preventDefault();
    setFieldError('');

    if (!email.trim()) {
      setFieldError('Please enter your email address.');
      return;
    }

    if (!password) {
      setFieldError('Please enter your password.');
      return;
    }

    api.setWorkspace(workspace);
    // The password is sent exactly as typed (spaces can be part of it)
    onLogin({ email: email.trim(), password, rememberMe });
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white text-slate-900 font-sans">
      {/* Left Split: Hero Image & Dark Brand Banner (Matching Figma Images 1, 2, 3) */}
      <div className="w-full md:w-1/2 bg-slate-900 flex flex-col justify-between p-8 lg:p-12 relative overflow-hidden">
        {/* Background Hero Image */}
        <div className="absolute inset-0 z-0 opacity-40 mix-blend-overlay">
          <img
            src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&auto=format&fit=crop"
            alt="Team collaboration"
            className="w-full h-full object-cover"
          />
        </div>

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-bold shadow-md shadow-emerald-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <span className="font-black text-white text-xl tracking-tight">NexusHR</span>
        </div>

        {/* Hero Text */}
        <div className="relative z-10 my-auto py-12 max-w-lg space-y-4">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Let’s empower your employees today.
          </h1>
          <p className="text-sm sm:text-base text-slate-300">
            We help to complete all your conveyancing needs easily
          </p>
        </div>

        {/* Footer */}
        <div className="relative z-10 text-xs text-slate-400">
          <span>&copy; 2025 NexusHR. All rights reserved.</span>
        </div>
      </div>

      {/* Right Split: Clean Login Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-between p-8 lg:p-16 bg-white overflow-y-auto">
        <div className="max-w-md w-full mx-auto my-auto space-y-8">
          {/* Header Title */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Login first to your account
            </h2>
          </div>

          {/* Error Alert Display (Matching Image 3) */}
          {(errorMsg || fieldError) && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-semibold text-rose-700 flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <span>{errorMsg || fieldError}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Workspace (company) */}
            <div className="space-y-1.5">
              <label htmlFor="login-workspace" className="block text-xs font-bold text-slate-700">Workspace</label>
              <input
                id="login-workspace"
                type="text"
                value={workspace}
                onChange={(e) => setWorkspace(e.target.value)}
                placeholder="Your company's workspace, e.g. acme (leave empty if you don't have one)"
                autoCapitalize="none"
                autoComplete="organization"
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Input your registered email"
                  autoComplete="username"
                  className={`w-full px-4 py-3 bg-white border rounded-2xl text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-2 transition-all ${
                    errorMsg
                      ? 'border-rose-500 focus:ring-rose-500/20'
                      : isValidEmail
                      ? 'border-emerald-500 focus:ring-emerald-500/20'
                      : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                  }`}
                />
                {isValidEmail && !errorMsg && (
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
                  autoComplete="current-password"
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

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 rounded-md"
                />
                <span>Remember Me</span>
              </label>
              <button type="button" onClick={onForgotPassword} className="text-slate-400 hover:text-slate-600 transition-colors">
                Forgot Password
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!email || !password}
              className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-md transition-all ${
                email && password
                  ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              Login
            </button>
          </form>

          {/* Sign in with Google (existing accounts only; the server verifies Google's token) */}
          <GoogleSignInButton
            onCredential={(credential) => {
              api.setWorkspace(workspace);
              onGoogleLogin?.({ credential, rememberMe });
            }}
          />

          {/* Switch to Register link */}
          <div className="text-center text-xs text-slate-500 font-medium">
            You're new in here?{' '}
            <button
              type="button"
              onClick={onSwitchToRegister}
              className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
            >
              Create Account
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
    </div>
  );
};
