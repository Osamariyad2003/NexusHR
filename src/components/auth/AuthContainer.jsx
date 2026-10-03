import React, { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { ForgotPassword } from './ForgotPassword';
import { OtpVerification } from './OtpVerification';
import { UpdatePassword } from './UpdatePassword';
import { PasswordSuccess } from './PasswordSuccess';
import { CompanyOnboardingWizard } from './CompanyOnboardingWizard';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';

export const AuthContainer = () => {
  const { login, loginWithGoogle, registerCompany } = useApp();
  const [authMode, setAuthMode] = useState('LOGIN'); // 'LOGIN' | 'REGISTER' | 'FORGOT' | 'OTP' | 'UPDATE' | 'SUCCESS' | 'ONBOARDING'
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  // Held in memory only until onboarding completes and the account is created
  const [userPassword, setUserPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  // Single-use proof that the emailed recovery code was right; memory only
  const [recoveryToken, setRecoveryToken] = useState('');

  const handleLoginSubmit = async ({ email, password, rememberMe }) => {
    setErrorMsg('');
    try {
      await login({ email, password, rememberMe });
    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  const handleRegisterSubmit = ({ name, email, password }) => {
    setErrorMsg('');
    setUserEmail(email);
    setUserName(name);
    setUserPassword(password);
    setAuthMode('ONBOARDING');
  };

  if (authMode === 'REGISTER') {
    return (
      <RegisterForm
        onRegister={handleRegisterSubmit}
        initial={{ name: userName, email: userEmail }}
        onSwitchToLogin={() => setAuthMode('LOGIN')}
        errorMsg={errorMsg}
      />
    );
  }

  // Password recovery: email -> 6-digit code -> single-use recovery token -> new password.
  // Each handler throws back to its screen, which shows the server's message.
  if (authMode === 'FORGOT') {
    return (
      <ForgotPassword
        onSendOtp={async ({ email, workspace }) => {
          api.setWorkspace(workspace); // the code is checked within this workspace
          await api.forgotPassword(email);
          setUserEmail(email);
          setAuthMode('OTP');
        }}
        onBackToLogin={() => setAuthMode('LOGIN')}
      />
    );
  }

  if (authMode === 'OTP') {
    return (
      <OtpVerification
        email={userEmail}
        onVerify={async (code) => {
          setRecoveryToken(await api.verifyResetCode(userEmail, code));
          setAuthMode('UPDATE');
        }}
        onResend={() => api.forgotPassword(userEmail)}
        onBackToLogin={() => setAuthMode('FORGOT')}
      />
    );
  }

  if (authMode === 'UPDATE') {
    return (
      <UpdatePassword
        onSubmit={async (password) => {
          await api.resetPassword(recoveryToken, password);
          setRecoveryToken('');
          setAuthMode('SUCCESS');
        }}
      />
    );
  }

  if (authMode === 'SUCCESS') {
    return (
      <PasswordSuccess
        onBackToLogin={() => setAuthMode('LOGIN')}
      />
    );
  }

  if (authMode === 'ONBOARDING') {
    return (
      <CompanyOnboardingWizard
        email={userEmail}
        // Throws back to the wizard on failure (e.g. the workspace name was just taken, or a wrong
        // email code), so it can show the message and keep what was typed
        onComplete={(data) => registerCompany({
          name: userName,
          email: userEmail,
          password: userPassword,
          companyName: data.companyName,
          workspace: data.workspace,
          industry: data.industry,
          companySize: data.companySize,
          emailCode: data.emailCode
        })}
        onCancel={() => setAuthMode('REGISTER')}
      />
    );
  }

  return (
    <LoginForm
      onLogin={handleLoginSubmit}
      onGoogleLogin={async (args) => {
        setErrorMsg('');
        try {
          await loginWithGoogle(args);
        } catch (err) {
          setErrorMsg(err.message);
        }
      }}
      onSwitchToRegister={() => setAuthMode('REGISTER')}
      onForgotPassword={() => { setErrorMsg(''); setAuthMode('FORGOT'); }}
      errorMsg={errorMsg}
    />
  );
};
