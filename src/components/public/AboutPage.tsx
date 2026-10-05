import React from 'react';
import { PublicNav, PublicFooter } from './PublicNav';
import { 
  Building2, 
  Palette, 
  Target, 
  Layers, 
  Globe2, 
  Sparkles, 
  Calendar, 
  CheckCircle2, 
  Send, 
  ShieldCheck, 
  ArrowRight,
  Shield,
  FileText,
  HelpCircle,
  LogIn
} from 'lucide-react';

export const AboutPage: React.FC = () => {
  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
      <PublicNav currentPage="about" />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        {/* Hero Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-[#FF4500] text-xs font-semibold">
            <span>Apex Engineering · Pune, India · Working Globally</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
            Apex Autonoma — AI Campaign Operating System
          </h1>
          <p className="text-sm sm:text-base text-[#6E6E73] leading-relaxed">
            A deterministic, multi-tenant creative and marketing operating system designed to transform company intelligence into calibrated, multi-platform brand campaigns with rigorous governance.
          </p>
        </div>

        {/* Core Capabilities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F]">Company Intelligence</h3>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Analyzes core company DNA, products, value propositions, buyer personas, market positioning, and tone guardrails to inform all downstream marketing decisions.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F]">Brand Design Systems</h3>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Enforces mathematical color palettes, typography hierarchies, layout grids, safe margins, and explicit creative rules without aesthetic drift or hallucination.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F]">Campaign Strategy</h3>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Structures multi-week strategic initiatives into content pillars, recommended posting frequencies, audience targeting, and synchronized messaging arcs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F]">Multi-Platform Content</h3>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Synthesizes platform-native creatives calibrated specifically for LinkedIn, Instagram, X/Twitter, Facebook, YouTube Shorts, and WhatsApp.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F]">Multi-Language Content</h3>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Produces culturally nuanced, localized campaigns in English, Hindi, Marathi, German, Spanish, French, and regional business dialects.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F]">Creative Production & AI Media</h3>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Integrates state-of-the-art visual generation pipelines including Cloudflare Workers AI FLUX Schnell, OpenAI, Google Gemini Flash, and Google Veo video storyboarding.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F]">Content Calendar & Cadence</h3>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Visualizes daily production quotas, scheduling slots, and editorial timelines to ensure sustained, predictable brand presence across channels.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F]">Approvals & Governance</h3>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Enforces a strict two-stage review workflow (Draft &rarr; In Review &rarr; Approved) with complete audit logging so no creative is deployed without human oversight.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Send className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F]">Publishing Readiness</h3>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              One-click export to Google Sheets Master Content plans, WhatsApp posting packs, and media package downloads ready for immediate execution.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-black/[0.06] shadow-2xs space-y-2.5">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 text-neutral-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-[#1D1D1F]">Multi-Company Workspaces</h3>
            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Strict multi-tenant workspace isolation with role-based access control (Super Admin, Company Admin, and Team Member) backed by durable Supabase PostgreSQL.
            </p>
          </div>
        </div>

        {/* Google Sign-In & Verification Disclosure */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-black/[0.06] shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 text-[#1D1D1F]">
            <Shield className="w-5 h-5 text-[#FF4500]" />
            <h2 className="text-base font-bold">Google Sign-In & Identity Usage</h2>
          </div>
          <div className="text-xs sm:text-sm text-[#6E6E73] leading-relaxed space-y-3">
            <p>
              Apex Autonoma uses Google Sign-In exclusively to authenticate user identity and ensure secure access to authorized company workspaces. During sign-in, Autonoma receives your basic identity profile (verified email address, full name, and avatar picture).
            </p>
            <p>
              We do not use your Google credentials for advertising, marketing profiling, or reselling. Additional Google capabilities (such as Google Drive or Workspace exports), if enabled in future releases, require explicit, granular authorization from the user.
            </p>
            <p className="text-[11px] text-[#86868B] italic">
              Apex Engineering strictly adheres to the Google API Services User Data Policy, including the Limited Use requirements.
            </p>
          </div>
        </div>

        {/* Engineering Philosophy / Realistic AI Disclaimer */}
        <div className="bg-[#FBFBFD] p-6 rounded-2xl border border-black/[0.06] text-xs text-[#6E6E73] space-y-2 leading-relaxed">
          <h4 className="font-bold text-[#1D1D1F] text-xs">Engineering Rigor & Transparent AI</h4>
          <p>
            Autonoma treats artificial intelligence as an assistive acceleration pipeline, not an infallible replacement for strategic judgment. All marketing copy, claims, and media assets are surfaced with human-in-the-loop review controls before external distribution.
          </p>
        </div>

        {/* Fast Action Links */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4 text-xs font-semibold">
          <button
            onClick={() => navigate('/privacy')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-neutral-50 rounded-xl border border-black/[0.08] text-[#1D1D1F] transition-all shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-[#FF4500]" />
            <span>Privacy Policy</span>
          </button>
          <button
            onClick={() => navigate('/terms')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-neutral-50 rounded-xl border border-black/[0.08] text-[#1D1D1F] transition-all shadow-2xs"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Terms of Service</span>
          </button>
          <button
            onClick={() => navigate('/support')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-white hover:bg-neutral-50 rounded-xl border border-black/[0.08] text-[#1D1D1F] transition-all shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
            <span>Support & Help</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-1.5 px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white rounded-xl transition-all shadow-xs"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In to Autonoma</span>
          </button>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
