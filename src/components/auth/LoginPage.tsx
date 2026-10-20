import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { ApexLogo } from '../ApexLogo';
import { autonomaDataService } from '../../services/autonomaDataService';
import { AuthSessionResponse } from '../../types/auth';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSessionResponse) => void;
  onAwaitingApproval: (session: AuthSessionResponse) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'forgot'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await autonomaDataService.loginWithPassword(email.trim(), password);
      if (!res.success) {
        setError(res.message || res.error || 'Sign-in failed.');
        return;
      }
      onLoginSuccess(res);
    } catch (err: any) {
      setError(err?.message || 'Unable to sign in.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Enter the email address for your Autonoma account.');
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await autonomaDataService.requestPasswordReset(email.trim());
      setMessage(res.message || 'If this account exists, a reset link has been sent.');
    } catch (err: any) {
      setError(err?.message || 'Unable to request a password reset.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col selection:bg-[#FF4500] selection:text-white">
      <div
        className="fixed inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'linear-gradient(rgba(29,29,31,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(29,29,31,0.045) 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      <header className="relative z-10 border-b border-black/[0.07] bg-white/90 backdrop-blur-md px-4 sm:px-6 py-4 flex items-center justify-between">
        <ApexLogo variant="lockup" size="md" />
        <div className="flex items-center gap-2 text-[11px] text-[#6E6E73] font-medium">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Private workspace access</span>
        </div>
      </header>

      <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-md rounded-3xl border border-black/[0.08] bg-white p-6 sm:p-8 shadow-xl">
          <div className="text-center space-y-2 mb-6">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-orange-50 border border-orange-100 text-[#FF4500] flex items-center justify-center">
              {mode === 'login' ? <LockKeyhole className="w-6 h-6" /> : <KeyRound className="w-6 h-6" />}
            </div>
            <h1 className="text-2xl font-bold tracking-tight">
              {mode === 'login' ? 'Sign in to Autonoma' : 'Reset your password'}
            </h1>
            <p className="text-sm text-[#6E6E73]">
              {mode === 'login'
                ? 'Use the account created for you by your Autonoma administrator.'
                : 'We will email a secure one-time password reset link.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-900 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{message}</span>
            </div>
          )}

          <form onSubmit={mode === 'login' ? handleLogin : handleForgot} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73] mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-[#86868B]" />
                <input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  placeholder="you@company.com"
                  className="w-full rounded-xl border border-black/[0.10] bg-white pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/10"
                />
              </div>
            </div>

            {mode === 'login' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-[#6E6E73]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(null); setMessage(null); }}
                    className="text-[11px] font-semibold text-[#FF4500] hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <LockKeyhole className="absolute left-3 top-3 w-4 h-4 text-[#86868B]" />
                  <input
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null); }}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-black/[0.10] bg-white pl-9 pr-3.5 py-2.5 text-sm outline-none focus:border-[#FF4500] focus:ring-2 focus:ring-[#FF4500]/10"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[46px] rounded-xl bg-[#FF4500] hover:bg-[#EA3E00] text-white text-sm font-semibold shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />}
              <span>{mode === 'login' ? 'Sign In' : 'Send Reset Link'}</span>
            </button>
          </form>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setMessage(null); }}
              className="mt-3 w-full py-2 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F]"
            >
              Back to sign in
            </button>
          )}

          <div className="mt-6 pt-5 border-t border-black/[0.06] space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-[#1D1D1F]">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>No public signup</span>
            </div>
            <p className="text-[11px] leading-relaxed text-[#86868B]">
              Companies and user accounts are provisioned by the Autonoma Super Admin or an authorized Company Administrator.
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-black/[0.07] px-4 py-4 text-center text-[11px] text-[#86868B]">
        Apex Autonoma · Controlled multi-company access
      </footer>
    </div>
  );
};
