import React, { useState, useEffect, useRef } from 'react';
import { PublicNav, PublicFooter } from './PublicNav';
import { ApexLogo } from '../ApexLogo';
import { 
  Building2, 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  Mail, 
  UserCheck, 
  LogIn 
} from 'lucide-react';
import { AuthSessionResponse } from '../../types/auth';

interface InviteLandingPageProps {
  onLoginSuccess: (session: AuthSessionResponse) => void;
}

export const InviteLandingPage: React.FC<InviteLandingPageProps> = ({ onLoginSuccess }) => {
  const [membershipId, setMembershipId] = useState<string>('');
  const [companyId, setCompanyId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [valid, setValid] = useState<boolean>(false);
  const [inviteDetails, setInviteDetails] = useState<{
    companyName: string;
    companyId: string;
    role: string;
    roleLabel: string;
    maskedEmail: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState<boolean>(false);
  const [googleClientId, setGoogleClientId] = useState<string>('');
  const [isOauthConfigured, setIsOauthConfigured] = useState<boolean>(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  // 1. Extract params from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mId = params.get('membership') || params.get('membershipId') || params.get('invite') || '';
    const cId = params.get('company') || params.get('companyId') || '';

    setMembershipId(mId);
    setCompanyId(cId);

    if (!mId || !cId) {
      setLoading(false);
      setValid(false);
      setError('Invalid invitation link: Missing membership or company parameters.');
      return;
    }

    // 2. Validate invite on server
    fetch(`/api/invite/details?membership=${encodeURIComponent(mId)}&company=${encodeURIComponent(cId)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.valid) {
          setValid(true);
          setInviteDetails({
            companyName: data.companyName,
            companyId: data.companyId,
            role: data.role,
            roleLabel: data.roleLabel,
            maskedEmail: data.maskedEmail
          });
        } else {
          setValid(false);
          setError(data.error || 'This invitation link is invalid or has expired.');
        }
      })
      .catch(err => {
        setValid(false);
        setError('Failed to validate invitation: ' + (err?.message || 'Network error'));
      })
      .finally(() => {
        setLoading(false);
      });

    // 3. Fetch Google OAuth Client ID
    fetch(`/api/auth/config?t=${Date.now()}`)
      .then(res => res.json())
      .then((cfg: { clientId: string | null; configured: boolean }) => {
        if (cfg.configured && cfg.clientId) {
          setGoogleClientId(cfg.clientId.trim());
          setIsOauthConfigured(true);
        }
      })
      .catch(() => {});
  }, []);

  // 4. Initialize Google Identity Services button once valid and Google Client ID is loaded
  useEffect(() => {
    if (!valid || !googleClientId || !isOauthConfigured || !window.google?.accounts?.id || !googleBtnRef.current) {
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      googleBtnRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: 'filled_black',
        size: 'large',
        shape: 'rectangular',
        width: 320,
        text: 'continue_with'
      });
    } catch (err) {
      console.warn('[GIS Init] Error rendering Google button on invite page:', err);
    }
  }, [valid, googleClientId, isOauthConfigured]);

  const handleGoogleResponse = async (response: any) => {
    if (!response.credential) {
      setError('No credential received from Google.');
      return;
    }

    setIsAccepting(true);
    setError(null);

    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credential: response.credential,
          membershipId,
          companyId
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to accept invitation.');
      }

      // Store session token in localStorage for client persistence
      if (data.token) {
        localStorage.setItem('autonoma_session_token', data.token);
      }

      // Remove query parameters from URL and enter workspace
      window.history.pushState({}, '', '/');
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to accept invitation');
    } finally {
      setIsAccepting(false);
    }
  };

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
      <PublicNav currentPage="support" />

      <main className="flex-1 max-w-lg mx-auto px-4 sm:px-6 py-16 flex flex-col justify-center">
        <div className="bg-white rounded-3xl border border-black/[0.08] p-7 sm:p-9 shadow-xl space-y-6">
          {/* Logo & Header */}
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <ApexLogo variant="mark" size="md" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF4500] font-bold">
                Workspace Invitation
              </span>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#1D1D1F]">
                Join {inviteDetails?.companyName || 'Workspace'}
              </h1>
              <p className="text-xs text-[#6E6E73]">
                Apex Autonoma · AI Campaign Operating System
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3 text-xs text-[#86868B]">
              <div className="w-5 h-5 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
              <span>Validating invitation credentials...</span>
            </div>
          ) : !valid ? (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl space-y-2 text-xs text-red-900">
                <div className="flex items-center space-x-2 font-bold">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>Invalid Invitation</span>
                </div>
                <p className="leading-relaxed">
                  {error || 'This invitation link is invalid, expired, or has already been used.'}
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="w-full py-2.5 bg-black/[0.04] hover:bg-black/[0.06] text-[#1D1D1F] font-semibold text-xs rounded-xl transition-all"
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Invitation Summary Card */}
              <div className="rounded-2xl border border-black/[0.06] bg-[#FBFBFD] p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.04]">
                  <span className="text-[#86868B]">Workspace</span>
                  <span className="font-bold text-[#1D1D1F] flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-[#FF4500]" />
                    {inviteDetails?.companyName}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-2 border-b border-black/[0.04]">
                  <span className="text-[#86868B]">Assigned Role</span>
                  <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                    {inviteDetails?.roleLabel}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#86868B]">Invited Email</span>
                  <span className="font-mono text-[#1D1D1F] font-semibold">
                    {inviteDetails?.maskedEmail}
                  </span>
                </div>
              </div>

              {/* Error notice if mismatch or rejection */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-red-900">
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Authentication Notice</span>
                  </div>
                  <p className="leading-relaxed">{error}</p>
                </div>
              )}

              {/* Google Sign-In Action */}
              <div className="space-y-3 pt-1">
                <div className="text-center text-xs text-[#6E6E73]">
                  Please authenticate with the Google account associated with <strong>{inviteDetails?.maskedEmail}</strong>:
                </div>

                <div className="flex justify-center min-h-[44px]">
                  {isAccepting ? (
                    <div className="w-full py-3 bg-[#1D1D1F] text-white text-xs font-semibold rounded-xl flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Accepting invitation & activating workspace...</span>
                    </div>
                  ) : (
                    <div ref={googleBtnRef} className="w-full flex justify-center" />
                  )}
                </div>

                <p className="text-[11px] text-[#86868B] text-center leading-relaxed">
                  Signing in verifies your email identity. No passwords needed.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
