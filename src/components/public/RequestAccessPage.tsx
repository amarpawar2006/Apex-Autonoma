import React, { useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { PublicFooter, PublicNav } from './PublicNav';

export const RequestAccessPage: React.FC = () => {
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [useCase, setUseCase] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!name.trim() || !company.trim() || !email.trim()) {
      setError('Name, company and work email are required.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/request-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          company: company.trim(),
          email: email.trim(),
          useCase: useCase.trim()
        })
      });
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.success) {
        throw new Error(json?.message || json?.error || 'Request could not be submitted.');
      }
      setDone(true);
    } catch (err: any) {
      setError(err?.message || 'Request could not be submitted. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col">
      <PublicNav currentPage="request-access" />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-[#090A0C] text-white border-b border-white/10">
          <div className="absolute -left-20 top-0 h-72 w-72 rounded-full bg-[#FF4500]/20 blur-3xl" />
          <div className="relative mx-auto max-w-5xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-white/70">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Controlled pilot access
              </div>
              <h1 className="mt-5 text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                Request access to Apex Autonoma.
              </h1>
              <p className="mt-4 max-w-xl text-sm leading-7 text-white/60">
                Tell us who you are and what you want Autonoma to run. Apex Engineering will review the request and provision a private company workspace when approved.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_.75fr]">
          <div className="rounded-3xl border border-black/[0.07] bg-white p-6 shadow-sm sm:p-8">
            {done ? (
              <div className="py-8 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <h2 className="mt-4 text-xl font-bold">Request received</h2>
                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6E6E73]">
                  Apex Engineering will review the request. Approved users receive a secure one-time setup link by email.
                </p>
                <button onClick={() => navigate('/login')} className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#FF4500] px-4 py-2.5 text-sm font-semibold text-white">
                  Already invited? Sign in <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">Your name</label>
                  <div className="relative">
                    <UserRound className="absolute left-3 top-3 h-4 w-4 text-[#86868B]" />
                    <input value={name} onChange={e => setName(e.target.value)} className="w-full rounded-xl border border-black/[0.09] bg-[#FBFBFD] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#FF4500]" placeholder="Your full name" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">Company / Brand</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-[#86868B]" />
                    <input value={company} onChange={e => setCompany(e.target.value)} className="w-full rounded-xl border border-black/[0.09] bg-[#FBFBFD] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#FF4500]" placeholder="Company or brand name" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">Work email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-[#86868B]" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full rounded-xl border border-black/[0.09] bg-[#FBFBFD] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#FF4500]" placeholder="you@company.com" />
                  </div>
                </div>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-[#6E6E73]">What do you want to use Autonoma for?</label>
                  <textarea rows={5} value={useCase} onChange={e => setUseCase(e.target.value)} className="w-full rounded-xl border border-black/[0.09] bg-[#FBFBFD] p-3 text-sm outline-none focus:border-[#FF4500]" placeholder="Campaigns, platforms, languages, team size, current workflow..." />
                </div>
                {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800">{error}</div>}
                <button disabled={submitting} type="submit" className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#FF4500] px-4 text-sm font-bold text-white transition hover:bg-[#EA3E00] disabled:opacity-50">
                  {submitting ? 'Submitting…' : 'Request Access'} <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>

          <aside className="space-y-4">
            {[
              ['Private company workspace', 'Your company context, campaigns and media stay scoped to your workspace.'],
              ['Administrator-provisioned access', 'There is no public self-signup. Approved users receive a secure setup invitation.'],
              ['Pilot-ready workflow', 'Company understanding, campaign strategy, multilingual content, creative production, calendars and exports.']
            ].map(([title, copy]) => (
              <div key={title} className="rounded-2xl border border-black/[0.07] bg-white p-5">
                <div className="text-sm font-bold">{title}</div>
                <p className="mt-2 text-xs leading-6 text-[#6E6E73]">{copy}</p>
              </div>
            ))}
          </aside>
        </section>
      </main>
      <PublicFooter />
    </div>
  );
};
