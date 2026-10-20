import React, { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, LockKeyhole } from 'lucide-react';
import { ApexLogo } from '../ApexLogo';
import { autonomaDataService } from '../../services/autonomaDataService';
import { AuthSessionResponse } from '../../types/auth';

interface ResetPasswordPageProps {
  onLoginSuccess: (session: AuthSessionResponse) => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onLoginSuccess }) => {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const email = params.get('email') || '';
  const token = params.get('token') || '';
  const [validating, setValidating] = useState(true);
  const [valid, setValid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    autonomaDataService.validatePasswordResetToken(email, token)
      .then((res) => {
        if (!mounted) return;
        setValid(Boolean(res.success && res.valid));
      })
      .catch(() => mounted && setValid(false))
      .finally(() => mounted && setValidating(false));
    return () => { mounted = false; };
  }, [email, token]);

  const handleSubmit = async (e: React.FormEvent) => {
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

    setSaving(true);
    try {
      const res = await autonomaDataService.resetPassword(email, token, password);
      if (!res.success) {
        setError(res.message || res.error || 'Password reset failed.');
        return;
      }
      window.history.replaceState({}, '', '/');
      onLoginSuccess(res);
    } catch (err: any) {
      setError(err?.message || 'Password reset failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col">
      <header className="border-b border-black/[0.07] bg-white/90 backdrop-blur-md px-4 sm:px-6 py-4">
        <ApexLogo variant="lockup" size="md" />
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl bg-white border border-black/[0.08] shadow-xl p-6 sm:p-8">
          <div className="text-center mb-6 space-y-2">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 flex items-center justify-center text-[#FF4500]">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Create a new password</h1>
            <p className="text-sm text-[#6E6E73]">{email || 'Autonoma account'}</p>
          </div>

          {validating ? (
            <div className="py-8 text-center text-sm text-[#6E6E73]">
              Validating secure reset link…
            </div>
          ) : !valid ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                <span>This password reset link is invalid or expired. Return to sign in and request a new one.</span>
              </div>
              <button
                onClick={() => {
                  window.history.replaceState({}, '', '/');
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }}
                className="w-full py-2.5 rounded-xl bg-[#1D1D1F] text-white text-sm font-semibold"
              >
                Return to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73]">
                  New password
                </label>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 w-4 h-4 text-[#86868B]" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.10] pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/10"
                    placeholder="Minimum 10 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73]">
                  Confirm password
                </label>
                <div className="relative">
                  <CheckCircle2 className="absolute left-3 top-3 w-4 h-4 text-[#86868B]" />
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.10] pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/10"
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full min-h-[46px] rounded-xl bg-[#FF4500] hover:bg-[#EA3E00] text-white text-sm font-semibold disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Set Password & Sign In'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};
