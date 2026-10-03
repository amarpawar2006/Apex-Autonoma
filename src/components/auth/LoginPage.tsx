import React, { useState, useEffect, useRef } from 'react';
import { 
  Building2, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  ShieldCheck
} from 'lucide-react';
import { ApexLogo } from '../ApexLogo';
import { autonomaDataService } from '../../services/autonomaDataService';
import { AuthSessionResponse } from '../../types/auth';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSessionResponse) => void;
  onAwaitingApproval: (session: AuthSessionResponse) => void;
}

declare global {
  interface Window {
    google?: any;
  }
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onAwaitingApproval
}) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [proposedCompanyName, setProposedCompanyName] = useState('');
  const [fullName, setFullName] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  // Single source of truth: OAuth client ID is fetched strictly from server GET /api/auth/config
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [isOauthConfigured, setIsOauthConfigured] = useState<boolean>(false);
  const [authConfigLoading, setAuthConfigLoading] = useState<boolean>(true);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // Fetch OAuth configuration from server on mount with zero client-side caching
  useEffect(() => {
    let isMounted = true;
    setAuthConfigLoading(true);

    fetch(`/api/auth/config?t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
      .then(res => res.json())
      .then((data: { clientId: string | null; configured: boolean }) => {
        if (!isMounted) return;
        const validId = (data.clientId || '').trim();
        if (data.configured && validId) {
          setGoogleClientId(validId);
          setIsOauthConfigured(true);
        } else {
          setGoogleClientId('');
          setIsOauthConfigured(false);
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('[Auth Config] Failed to fetch server OAuth configuration:', err);
        setGoogleClientId('');
        setIsOauthConfigured(false);
      })
      .finally(() => {
        if (isMounted) setAuthConfigLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Initialize Google Identity Services (GIS) strictly using server-provided client ID
  useEffect(() => {
    if (!googleClientId || !isOauthConfigured || !window.google?.accounts?.id || !googleBtnRef.current) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      // Clear any previous rendered button to avoid stale DOM bindings
      googleBtnRef.current.innerHTML = '';

      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'outline',
        size: 'large',
        shape: 'rectangular',
        width: 320,
        text: mode === 'signup' ? 'signup_with' : 'signin_with',
      });
    } catch (err) {
      console.warn('[GIS Init] Error rendering Google button:', err);
    }
  }, [googleClientId, isOauthConfigured, mode]);

  const handleGoogleCredentialResponse = async (response: any) => {
    if (!response.credential) {
      setError('No credential received from Google.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await autonomaDataService.loginWithGoogle(
        response.credential,
        mode === 'signup' ? proposedCompanyName : undefined
      );

      if (!res.success) {
        setError(res.error || 'Authentication failed. Please check your credentials.');
        setLoading(false);
        return;
      }

      if (res.status === 'PENDING' || res.status === 'REJECTED' || !res.activeCompany) {
        onAwaitingApproval(res);
      } else {
        onLoginSuccess(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with server.');
    } finally {
      setLoading(false);
    }
  };

  const handleDevLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await autonomaDataService.fixtureLogin({
        email: 'amarpawar2007@gmail.com',
        name: 'Amar Pawar',
        isSuperAdmin: true,
        role: 'SUPER_ADMIN'
      });

      if (!res.success) {
        setError(res.error || 'Development sign-in failed.');
        setLoading(false);
        return;
      }

      if (res.status === 'PENDING' || res.status === 'REJECTED' || !res.activeCompany) {
        onAwaitingApproval(res);
      } else {
        onLoginSuccess(res);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate with server via development login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col justify-between selection:bg-[#FF4500] selection:text-white">
      {/* Subtle background architectural blueprint grid */}
      <div 
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: `linear-gradient(rgba(29,29,31,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(29,29,31,0.045) 1px, transparent 1px)`,
          backgroundSize: '40px 40px'
        }}
      />

      {/* Top Header */}
      <header className="relative z-10 border-b border-black/[0.07] bg-white/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <ApexLogo variant="lockup" size="md" />
          <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-mono uppercase tracking-wider bg-[#FF4500]/10 text-[#FF4500] border border-[#FF4500]/20">
            Phase 2 Access
          </span>
        </div>

        <div className="flex items-center space-x-3 text-xs text-[#86868B]">
          <span className="flex items-center space-x-1.5 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Server Auth Active</span>
          </span>
        </div>
      </header>

      {/* Center Auth Card Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-white border border-black/[0.08] rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
          {/* Card Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-[#FF4500]/20 to-transparent border border-[#FF4500]/30 text-[#FF4500] mb-1">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#1D1D1F]">
              {mode === 'signin' ? 'Sign in to Autonoma' : 'Request Company Access'}
            </h1>
            <p className="text-xs sm:text-sm text-[#86868B] max-w-sm mx-auto">
              {mode === 'signin'
                ? 'Enter your verified account to access your permitted company workspace.'
                : 'Create a pending access request with your verified identity and company name.'}
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-[#F2F2F7] rounded-xl border border-black/[0.06] text-xs font-medium">
            <button
              onClick={() => { setMode('signin'); setError(null); }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signin'
                  ? 'bg-white text-[#1D1D1F] shadow-sm font-semibold'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); }}
              className={`py-2 rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-white text-[#1D1D1F] shadow-sm font-semibold'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Request Access
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start space-x-2.5 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div className="flex-1 leading-relaxed">{error}</div>
            </div>
          )}

          {/* Info Banner */}
          {infoMessage && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs flex items-start space-x-2.5">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
              <div className="flex-1 leading-relaxed">{infoMessage}</div>
            </div>
          )}

          {/* Signup Specific Inputs */}
          {mode === 'signup' && (
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-mono text-[#86868B] mb-1.5 uppercase tracking-wider">
                  Proposed Company / Organization Name *
                </label>
                <div className="relative">
                  <Building2 className="w-4 h-4 absolute left-3 top-3 text-[#6E6E73]" />
                  <input
                    type="text"
                    required
                    value={proposedCompanyName}
                    onChange={(e) => setProposedCompanyName(e.target.value)}
                    placeholder="e.g. Flightpath Aviation or Apex Pune"
                    className="w-full bg-white border border-black/[0.1] rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-[#1D1D1F] placeholder-[#A1A1A6] focus:outline-none focus:border-[#FF4500] focus:ring-1 focus:ring-[#FF4500]"
                  />
                </div>
                <p className="text-[10px] text-[#6E6E73] mt-1">
                  Super Admin will review and provision your company workspace upon approval.
                </p>
              </div>
            </div>
          )}

          {/* Verified Google Sign-In Container */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col items-center justify-center">
              {authConfigLoading ? (
                <div className="flex items-center space-x-2 text-xs text-[#86868B] py-3 font-mono">
                  <div className="w-3.5 h-3.5 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
                  <span>Loading OAuth configuration...</span>
                </div>
              ) : isOauthConfigured && googleClientId ? (
                <div ref={googleBtnRef} className="min-h-[44px] flex items-center justify-center" />
              ) : (
                <div className="w-full p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3 text-center">
                  <div className="flex items-center justify-center space-x-2 text-amber-800 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <span>Google OAuth Client ID Not Configured</span>
                  </div>
                  <p className="text-[11px] text-[#6E6E73] leading-relaxed">
                    Set <code className="text-[#1D1D1F] bg-black/[0.05] px-1 py-0.5 rounded font-mono">GOOGLE_CLIENT_ID</code> in AI Studio's environment configuration panel.
                  </p>
                  <button
                    type="button"
                    disabled
                    className="w-full py-2.5 px-4 bg-[#F5F5F7] border border-black/[0.08] rounded-xl text-xs text-[#86868B] font-medium cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    <Key className="w-3.5 h-3.5 opacity-40" />
                    <span>Sign in with Google (Disabled)</span>
                  </button>
                </div>
              )}
            </div>

            {loading && (
              <div className="flex items-center justify-center space-x-2 text-xs text-[#FF4500] py-2">
                <div className="w-4 h-4 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
                <span>Verifying credentials on server...</span>
              </div>
            )}

            {/* Development / Preview Environment Sign-In Option */}
            <div className="pt-3 border-t border-black/[0.08] space-y-2">
              <div className="flex items-center justify-between text-[10px] text-[#86868B] font-mono uppercase tracking-wider">
                <span>Preview Environment</span>
                <span className="text-emerald-400 font-semibold">Dev Access</span>
              </div>
              <button
                type="button"
                onClick={handleDevLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#FBFBFD] hover:bg-black/[0.03] active:bg-black/[0.05] border border-black/[0.10] hover:border-[#FF4500]/60 rounded-xl text-xs text-[#1D1D1F] font-medium transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <ShieldCheck className="w-4 h-4 text-[#FF4500]" />
                <span>Development Sign-In</span>
              </button>
              <p className="text-[10px] text-[#6E6E73] text-center">
                Signs in as verified Super Admin (<code className="text-[#86868B] font-mono">amarpawar2007@gmail.com</code>).
              </p>
            </div>
          </div>

          {/* Security & Access Notice */}
          <div className="pt-2 border-t border-black/[0.06] text-[11px] text-[#86868B] space-y-1.5">
            <div className="flex items-center space-x-1.5 text-emerald-400/90 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>Server-Enforced Access Control</span>
            </div>
            <p className="text-[10px] leading-relaxed text-[#6E6E73]">
              Membership, company isolation, and role restrictions are enforced server-side for protected reads, writes, exports, and AI actions.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-black/[0.07] px-6 py-4 text-center text-xs text-[#86868B] space-y-1">
        <p>Apex Autonoma • Social Intelligence & Enterprise Production Architecture</p>
        <p className="text-[10px] text-[#6E6E73]">
          Initial Super Admin identity configured server-side. Zero passwords stored in Sheets or local browser.
        </p>
      </footer>
    </div>
  );
};
