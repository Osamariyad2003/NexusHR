import React, { useEffect, useRef, useState } from 'react';

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

// Loads Google Identity Services once per page
let scriptPromise = null;
const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = resolve;
    script.onerror = () => { scriptPromise = null; reject(new Error('Could not load Google sign-in.')); };
    document.head.appendChild(script);
  });
  return scriptPromise;
};

/**
 * Google's own "Sign in with Google" button. It hands Google's ID token (credential) to
 * onCredential; the server verifies it and signs in the matching existing account. Renders
 * nothing when no Google client ID is configured (VITE_GOOGLE_CLIENT_ID).
 */
export const GoogleSignInButton = ({ onCredential }) => {
  const container = useRef(null);
  const callback = useRef(onCredential);
  callback.current = onCredential;
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return undefined;
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !container.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: ({ credential }) => callback.current(credential),
          ux_mode: 'popup',
          // Chrome's built-in sign-in dialog (FedCM) instead of a popup window: no cross-window messaging,
          // so no "Cross-Origin-Opener-Policy would block window.postMessage" warnings
          use_fedcm_for_button: true,
          auto_select: false,
          cancel_on_tap_outside: true
        });
        window.google.accounts.id.renderButton(container.current, {
          type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', width: container.current.offsetWidth || 320
        });
      })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, []);

  if (!CLIENT_ID) return null;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
        <span className="h-px flex-1 bg-slate-200" />or<span className="h-px flex-1 bg-slate-200" />
      </div>
      <div ref={container} data-testid="google-signin" className="flex justify-center min-h-[44px]" />
      {failed && <p className="text-[11px] text-center text-slate-400">Google sign-in couldn't load. Check your connection, or sign in with your password.</p>}
    </div>
  );
};
