import React, { useEffect, useMemo, useState } from 'react';
import { PublicNav, PublicFooter } from './PublicNav';
import { ApexLogo } from '../ApexLogo';
import {
  AlertCircle,
  Building2,
  CheckCircle2,
  LockKeyhole,
  ShieldCheck
} from 'lucide-react';
import { AuthSessionResponse } from '../../types/auth';

interface InviteLandingPageProps {
  onLoginSuccess: (session: AuthSessionResponse) => void;
}

export const InviteLandingPage: React.FC<InviteLandingPageProps> = ({ onLoginSuccess }) => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const membershipId = params.get('membership') || params.get('membershipId') || params.get('invite') || '';
  const companyId = params.get('company') || params.get('companyId') || '';
  const token = params.get('token') || '';

  const [loading, setLoading] = useState(true);
  const [valid, setValid] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<{
    companyName: string;
    companyId: string;
    role: string;
    roleLabel: string;
    maskedEmail: string;
  } | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  useEffect(() => {
    if (!membershipId || !companyId || !token) {
      setLoading(false);
      setError('This invitation link is incomplete or expired. Ask your administrator to resend it.');
      return;
    }

    fetch(
      `/api/invite/details?membership=${encodeURIComponent(membershipId)}&company=${encodeURIComponent(companyId)}&token=${encodeURIComponent(token)}`
    )
      .then((res) => res.json())
      .then((data) => {
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
          setError(data.error || 'This invitation link is invalid or expired.');
        }
      })
      .catch((err) => setError(err?.message || 'Unable to validate invitation.'))
      .finally(() => setLoading(false));
  }, [membershipId, companyId, token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 10) {
      setError('Password must be at least 10 characters.');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match.');
      return;
    }

    setIsAccepting(true);
    try {
      const res = await fetch('/api/invite/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, membershipId, companyId })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to activate account.');
      }

      if (data.token) localStorage.setItem('autonoma_session_token', data.token);
      window.history.replaceState({}, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
      onLoginSuccess(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to activate account.');
    } finally {
      setIsAccepting(false);
    }
  };

  const goHome = () => {
    window.history.replaceState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col">
      <PublicNav currentPage="support" />

      <main className="flex-1 w-full max-w-lg mx-auto px-4 sm:px-6 py-12 flex items-center">
        <div className="w-full rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="flex justify-center"><ApexLogo variant="mark" size="md" /></div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#FF4500] font-bold">
              Workspace Invitation
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight">
              Join {inviteDetails?.companyName || 'Autonoma'}
            </h1>
            <p className="text-sm text-[#6E6E73]">
              Create your password to activate this administrator-provisioned account.
            </p>
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-[#6E6E73]">Validating secure invitation…</div>
          ) : !valid ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                <span>{error || 'Invitation invalid or expired.'}</span>
              </div>
              <button onClick={goHome} className="w-full py-2.5 rounded-xl bg-[#1D1D1F] text-white text-sm font-semibold">
                Return to Sign In
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-black/[0.06] bg-[#FBFBFD] p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-black/[0.04]">
                  <span className="text-[#86868B]">Workspace</span>
                  <span className="font-bold flex items-center gap-1 text-right">
                    <Building2 className="w-3.5 h-3.5 text-[#FF4500]" />
                    {inviteDetails?.companyName}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 pb-2 border-b border-black/[0.04]">
                  <span className="text-[#86868B]">Role</span>
                  <span className="font-semibold text-blue-700">{inviteDetails?.roleLabel}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[#86868B]">Account</span>
                  <span className="font-mono font-semibold">{inviteDetails?.maskedEmail}</span>
                </div>
              </div>

              <form onSubmit={handleAccept} className="space-y-4">
                {error && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                    <span>{error}</span>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mb-1.5">
                    Create password
                  </label>
                  <div className="relative">
                    <LockKeyhole className="absolute left-3 top-3 w-4 h-4 text-[#86868B]" />
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Minimum 10 characters"
                      className="w-full rounded-xl border border-black/[0.10] pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mb-1.5">
                    Confirm password
                  </label>
                  <div className="relative">
                    <CheckCircle2 className="absolute left-3 top-3 w-4 h-4 text-[#86868B]" />
                    <input
                      type="password"
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className="w-full rounded-xl border border-black/[0.10] pl-9 pr-3 py-2.5 text-sm outline-none focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/10"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isAccepting}
                  className="w-full min-h-[46px] rounded-xl bg-[#FF4500] hover:bg-[#EA3E00] text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isAccepting ? 'Activating Account…' : 'Set Password & Enter Workspace'}</span>
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
