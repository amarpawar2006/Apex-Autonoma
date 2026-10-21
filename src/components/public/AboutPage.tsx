import React from 'react';
import { PublicNav, PublicFooter } from './PublicNav';
import {
  ArrowRight,
  BrainCircuit,
  Building2,
  CalendarRange,
  CheckCircle2,
  Database,
  Download,
  FileText,
  Linkedin,
  MessageCircle,
  Share2,
  Globe2,
  Image,
  Languages,
  Layers3,
  LockKeyhole,
  MessageSquare,
  Palette,
  RefreshCw,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WandSparkles,
  Workflow
} from 'lucide-react';

const FeatureCard = ({
  icon: Icon,
  title,
  children
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="group rounded-3xl border border-black/[0.07] bg-white p-5 sm:p-6 shadow-[0_1px_0_rgba(0,0,0,0.02)] transition-all duration-300 hover:-translate-y-1 hover:border-black/[0.12] hover:shadow-xl">
    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl border border-black/[0.06] bg-[#F7F7F8] text-[#FF4500] transition-transform duration-300 group-hover:scale-105">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="text-sm font-bold tracking-tight text-[#1D1D1F]">{title}</h3>
    <p className="mt-2 text-xs leading-6 text-[#6E6E73]">{children}</p>
  </div>
);

const Step = ({
  index,
  title,
  children
}: {
  index: string;
  title: string;
  children: React.ReactNode;
}) => (
  <div className="relative rounded-3xl border border-white/10 bg-white/[0.04] p-5 sm:p-6 backdrop-blur-sm">
    <div className="mb-5 flex items-center justify-between">
      <span className="font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-[#FF6A2B]">Step {index}</span>
      <span className="h-2 w-2 rounded-full bg-[#FF4500] shadow-[0_0_18px_rgba(255,69,0,0.9)]" />
    </div>
    <h3 className="text-base font-semibold text-white">{title}</h3>
    <p className="mt-2 text-xs leading-6 text-white/55">{children}</p>
  </div>
);

export const AboutPage: React.FC = () => {
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const getPublicShareUrl = () => `${window.location.origin}/`;
  const openShare = (url: string) => window.open(url, '_blank', 'noopener,noreferrer,width=760,height=640');
  const shareLinkedIn = () => openShare(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(getPublicShareUrl())}`);
  const shareWhatsApp = () => openShare(`https://wa.me/?text=${encodeURIComponent('Apex Autonoma - AI Campaign Operating System ' + getPublicShareUrl())}`);
  const shareNative = async () => {
    const url = getPublicShareUrl();
    if (navigator.share) {
      await navigator.share({
        title: 'Apex Autonoma',
        text: 'AI Campaign Operating System by Apex Engineering',
        url
      }).catch(() => undefined);
      return;
    }
    await navigator.clipboard?.writeText(url).catch(() => undefined);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] font-sans">
      <PublicNav currentPage="about" />

      <main className="overflow-hidden">
        {/* Hero */}
        <section className="relative border-b border-black/[0.06] bg-[#090A0C] text-white">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-[#FF4500]/20 blur-3xl" />
            <div className="absolute right-0 top-0 h-96 w-96 rounded-full bg-blue-600/10 blur-3xl" />
            <div
              className="absolute inset-0 opacity-[0.08]"
              style={{
                backgroundImage:
                  'linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.18) 1px,transparent 1px)',
                backgroundSize: '52px 52px'
              }}
            />
          </div>

          <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.05fr_.95fr] lg:items-center lg:px-8 lg:py-28">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-[11px] font-semibold text-white/75 backdrop-blur">
                <Sparkles className="h-3.5 w-3.5 text-[#FF6A2B]" />
                AI Campaign Operating System by Apex Engineering
              </div>

              <h1 className="max-w-4xl text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                Turn company context into
                <span className="block bg-gradient-to-r from-[#FF6A2B] via-[#FF9B73] to-white bg-clip-text text-transparent">
                  campaign-ready execution.
                </span>
              </h1>

              <p className="mt-6 max-w-2xl text-sm leading-7 text-white/60 sm:text-base">
                Autonoma brings company intelligence, campaign strategy, multi-platform content, multilingual variants,
                brand-safe creative production, calendars, approvals and export workflows into one controlled workspace.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-[#FF4500] px-5 text-sm font-bold text-white shadow-[0_12px_36px_rgba(255,69,0,.25)] transition hover:bg-[#EA3E00] active:scale-[.98]"
                >
                  Sign in to Autonoma
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/request-access')}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-5 text-sm font-semibold text-white/80 transition hover:bg-white/[0.09]"
                >
                  <MessageSquare className="h-4 w-4" />
                  Request Access
                </button>
              </div>

              <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[11px] font-medium text-white/50">
                {[
                  'Private tenant workspaces',
                  'Human approval controls',
                  'Text-safe creative composition',
                  'Email + password access'
                ].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            {/* Product mockup */}
            <div className="relative mx-auto w-full max-w-2xl lg:max-w-none">
              <div className="absolute -inset-5 rounded-[40px] bg-gradient-to-br from-[#FF4500]/20 via-transparent to-blue-500/10 blur-2xl" />
              <div className="relative overflow-hidden rounded-[28px] border border-white/12 bg-[#111318] shadow-2xl">
                <div className="flex h-11 items-center justify-between border-b border-white/[0.08] px-4">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                    <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                  </div>
                  <span className="text-[9px] font-mono uppercase tracking-[0.22em] text-white/35">Autonoma workspace</span>
                </div>

                <div className="grid min-h-[430px] grid-cols-[74px_1fr] sm:grid-cols-[150px_1fr]">
                  <aside className="border-r border-white/[0.07] p-3">
                    <div className="mb-5 h-8 rounded-xl bg-[#FF4500]" />
                    <div className="space-y-2">
                      {['Today', 'Campaigns', 'Creative', 'Calendar', 'Publishing'].map((item, index) => (
                        <div
                          key={item}
                          className={`rounded-lg px-2.5 py-2 text-[10px] ${index === 1 ? 'bg-white/[0.08] text-white' : 'text-white/35'}`}
                        >
                          <span className="hidden sm:inline">{item}</span>
                          <span className="sm:hidden">•</span>
                        </div>
                      ))}
                    </div>
                  </aside>

                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[9px] font-mono uppercase tracking-[0.18em] text-[#FF6A2B]">Live campaign workspace</div>
                        <div className="mt-1 text-sm font-bold">Q4 Demand Generation</div>
                        <div className="mt-1 text-[10px] text-white/35">Strategy → content → creative → calendar</div>
                      </div>
                      <span className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-2 py-1 text-[9px] font-bold text-emerald-300">
                        READY
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-3 gap-2">
                      {[
                        ['Platforms', 'Multi-channel'],
                        ['Languages', 'Localized'],
                        ['Status', 'Reviewable']
                      ].map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-white/[0.07] bg-white/[0.035] p-3">
                          <div className="text-[8px] uppercase tracking-[0.14em] text-white/30">{label}</div>
                          <div className="mt-1 text-[10px] font-semibold text-white/75">{value}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-[1.2fr_.8fr]">
                      <div className="rounded-2xl border border-white/[0.07] bg-white/[0.035] p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-semibold">Content matrix</span>
                          <Layers3 className="h-3.5 w-3.5 text-[#FF6A2B]" />
                        </div>
                        <div className="mt-4 space-y-2">
                          {[88, 72, 93, 64].map((width, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="w-10 text-[8px] text-white/30">{['LinkedIn','Instagram','Facebook','X'][index]}</span>
                              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                                <div className="h-full rounded-full bg-gradient-to-r from-[#FF4500] to-[#FF906B]" style={{ width: `${width}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-4">
                        <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/30">Creative system</div>
                        <div className="mt-3 aspect-[4/5] rounded-xl border border-white/[0.08] bg-gradient-to-br from-[#FF4500]/35 via-[#241814] to-[#0D0E11] p-3">
                          <div className="h-2 w-14 rounded bg-white/60" />
                          <div className="mt-2 h-2 w-20 rounded bg-white/25" />
                          <div className="mt-auto" />
                        </div>
                        <div className="mt-2 text-[9px] text-white/35">Visual + deterministic brand text</div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {['Approve', 'Export', 'WhatsApp'].map((item) => (
                        <div key={item} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2 py-2 text-center text-[9px] text-white/45">
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Product thesis */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-end">
            <div>
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF4500]">One operating system</span>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                Marketing work usually breaks between strategy and execution.
              </h2>
            </div>
            <p className="max-w-2xl text-sm leading-7 text-[#6E6E73]">
              Autonoma keeps the company context, campaign brief, platform variants, language choices, creative rules,
              asset status and calendar together. The goal is not more random AI output. It is a repeatable,
              reviewable operating flow your team can actually run.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard icon={BrainCircuit} title="Company Intelligence">
              Capture offerings, audience, geography, positioning, tone, CTA, constraints and approved company context so generation stays grounded.
            </FeatureCard>
            <FeatureCard icon={Target} title="Campaign Strategy">
              Turn one business objective into structured campaign direction, content pillars, audiences, cadence and deliverable planning.
            </FeatureCard>
            <FeatureCard icon={Languages} title="Platform + Language Matrix">
              Generate native variants for multiple platforms and languages while preserving one strategic concept and company context.
            </FeatureCard>
            <FeatureCard icon={WandSparkles} title="Creative Production">
              Generate supporting visuals, then apply exact brand typography and copy with deterministic composition for download-ready creative.
            </FeatureCard>
          </div>
        </section>

        {/* Workflow */}
        <section className="bg-[#0C0D10] py-16 text-white sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl">
              <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF6A2B]">How Autonoma works</span>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                From company DNA to a ready-to-publish campaign workspace.
              </h2>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Step index="01" title="Understand the company">
                Confirm the business profile, audience, positioning, claims, brand voice and source material before campaign generation.
              </Step>
              <Step index="02" title="Build the campaign">
                Define objective, duration, platforms, languages and deliverable formats. Autonoma converts the brief into a structured campaign.
              </Step>
              <Step index="03" title="Produce and review">
                Generate copy, visuals and branded compositions. Review assets individually and control approval status before execution.
              </Step>
              <Step index="04" title="Schedule and export">
                Work from the calendar, export campaign packs, download final creatives and share posting-ready content with the team.
              </Step>
            </div>
          </div>
        </section>

        {/* Capability matrix */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="text-center">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-[#FF4500]">Built for real operations</span>
            <h2 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-[-0.035em] sm:text-4xl">
              More than a content generator.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#6E6E73]">
              The differentiator is the system around generation: tenant isolation, brand context, structured assets,
              human review, deterministic design and reusable campaign data.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FeatureCard icon={Building2} title="Multi-company workspaces">
              Separate companies, memberships and campaigns with Super Admin, Company Admin and Team Member access controls.
            </FeatureCard>
            <FeatureCard icon={Palette} title="Brand Design System">
              Save brand colors, typography, logo, creative rules and visual direction so production stays consistent.
            </FeatureCard>
            <FeatureCard icon={Image} title="Text-safe visual generation">
              AI produces the visual layer while exact headlines, CTAs, logos and typography are composed deterministically.
            </FeatureCard>
            <FeatureCard icon={CalendarRange} title="Campaign calendar">
              See target dates, production status and planned content across the campaign instead of managing isolated prompts.
            </FeatureCard>
            <FeatureCard icon={RefreshCw} title="Recoverable generation">
              Failed generation preserves the campaign shell and user input so work can be retried without rebuilding the brief from scratch.
            </FeatureCard>
            <FeatureCard icon={Download} title="Client-ready export">
              Download final creative files and campaign information, or prepare WhatsApp-ready posting packs for operational handoff.
            </FeatureCard>
            <FeatureCard icon={Database} title="Durable company data">
              Supabase-backed persistence keeps companies, users, memberships, campaigns and assets outside the browser-only lifecycle.
            </FeatureCard>
            <FeatureCard icon={Users} title="Controlled onboarding">
              No public signup. Workspace access is provisioned by administrators and activated through secure password setup.
            </FeatureCard>
            <FeatureCard icon={ShieldCheck} title="Human-in-the-loop governance">
              AI accelerates production, but campaign content and media remain visible and reviewable before external use.
            </FeatureCard>
          </div>
        </section>

        {/* Security / access */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="overflow-hidden rounded-[32px] border border-black/[0.08] bg-white">
            <div className="grid lg:grid-cols-[.9fr_1.1fr]">
              <div className="bg-[#121316] p-7 text-white sm:p-10">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF4500]">
                  <LockKeyhole className="h-5 w-5" />
                </div>
                <h2 className="mt-5 text-2xl font-black tracking-[-0.03em]">Private by design.</h2>
                <p className="mt-3 text-sm leading-7 text-white/55">
                  Autonoma is built as a controlled workspace product, not an anonymous public generator.
                  Accounts are provisioned by administrators and access is scoped to permitted company workspaces.
                </p>
              </div>
              <div className="grid gap-5 p-7 sm:grid-cols-2 sm:p-10">
                {[
                  ['Email + password', 'No dependency on Google Sign-In for normal user access.'],
                  ['Role-based access', 'Super Admin, Company Admin and Team Member permissions.'],
                  ['Workspace isolation', 'Campaign reads and writes are scoped to the active company.'],
                  ['Durable sessions', 'Server-managed sessions and persisted membership state support returning users.']
                ].map(([title, copy]) => (
                  <div key={title}>
                    <div className="flex items-center gap-2 text-sm font-bold">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      {title}
                    </div>
                    <p className="mt-2 text-xs leading-6 text-[#6E6E73]">{copy}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Transparent AI */}
        <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8">
          <div className="rounded-3xl border border-black/[0.07] bg-[#FBFBFD] p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-orange-50 text-[#FF4500]">
                <Workflow className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">AI acceleration with operational controls</h3>
                <p className="mt-2 max-w-4xl text-xs leading-6 text-[#6E6E73]">
                  Autonoma treats AI output as production input, not unquestionable truth. Business claims, translations,
                  captions, generated media and campaign recommendations should be reviewed by the responsible user before publishing.
                  The product is designed to preserve context, expose outputs and make correction practical.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[34px] bg-gradient-to-br from-[#FF4500] via-[#F4511E] to-[#16171A] p-7 text-white sm:p-10 lg:p-12">
            <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                  <Rocket className="h-3.5 w-3.5" />
                  Apex Autonoma
                </div>
                <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">
                  Build campaigns like a system, not a folder full of prompts.
                </h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
                  Bring strategy, content, creative production, approvals and campaign operations into one controlled workspace.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
                <button
                  onClick={() => navigate('/login')}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-bold text-[#1D1D1F] transition hover:bg-white/90"
                >
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={() => navigate('/request-access')}
                  className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl border border-white/20 bg-black/10 px-5 text-sm font-semibold text-white transition hover:bg-black/20"
                >
                  Request Access
                </button>
              </div>
            </div>
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-4 text-[11px] font-semibold text-[#6E6E73]">
            <button onClick={() => navigate('/privacy')} className="inline-flex items-center gap-1.5 hover:text-[#1D1D1F]">
              <FileText className="h-3.5 w-3.5" />
              Privacy Policy
            </button>
            <span className="text-black/15">•</span>
            <button onClick={() => navigate('/terms')} className="hover:text-[#1D1D1F]">Terms of Service</button>
            <span className="text-black/15">•</span>
            <button onClick={() => navigate('/support')} className="hover:text-[#1D1D1F]">Support</button>
          </div>
        </section>
      </main>

      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[70] flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 rounded-2xl border border-black/[0.08] bg-white/95 p-1.5 shadow-xl backdrop-blur-xl">
          <button
            type="button"
            onClick={shareLinkedIn}
            aria-label="Share Autonoma on LinkedIn"
            title="Share on LinkedIn"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
          >
            <Linkedin className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={shareWhatsApp}
            aria-label="Share Autonoma on WhatsApp"
            title="Share on WhatsApp"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
          >
            <MessageCircle className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={shareNative}
            aria-label="Share or copy Autonoma link"
            title="Share / Copy link"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-[#1D1D1F] transition hover:bg-[#F5F5F7]"
          >
            <Share2 className="h-4 w-4" />
          </button>
        </div>

        <a
          href="/Apex-Autonoma-Brochure.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-[#FF4500] px-4 sm:px-5 text-sm font-bold text-white shadow-[0_12px_36px_rgba(255,69,0,.3)] transition hover:-translate-y-0.5 hover:bg-[#EA3E00] active:translate-y-0"
          aria-label="Download Apex Autonoma brochure"
        >
          <Download className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          <span>Download Brochure</span>
        </a>
      </div>

      <PublicFooter />
    </div>
  );
};
