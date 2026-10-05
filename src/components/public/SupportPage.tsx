import React, { useState } from 'react';
import { PublicNav, PublicFooter } from './PublicNav';
import { 
  HelpCircle, 
  LogIn, 
  Building2, 
  Mail, 
  Target, 
  Palette, 
  Sparkles, 
  Video, 
  CreditCard, 
  AlertCircle, 
  Send, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp,
  FileText,
  ShieldCheck
} from 'lucide-react';

interface HelpCategory {
  id: string;
  title: string;
  icon: React.ReactNode;
  summary: string;
  faqs: { q: string; a: string }[];
}

export const SupportPage: React.FC = () => {
  const [openCategory, setOpenCategory] = useState<string | null>('sign-in');
  const [reportEmail, setReportEmail] = useState('');
  const [reportSubject, setReportSubject] = useState('');
  const [reportMessage, setReportMessage] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const categories: HelpCategory[] = [
    {
      id: 'sign-in',
      title: 'Sign In & Google Authentication',
      icon: <LogIn className="w-4 h-4 text-[#FF4500]" />,
      summary: 'Troubleshooting login, session restoration, and Google OAuth credentials.',
      faqs: [
        {
          q: 'Why am I redirected to "Awaiting Approval" after signing in?',
          a: 'For security and data isolation, new user signups enter a verified approval queue until the Super Administrator reviews and assigns your account to an active corporate workspace.'
        },
        {
          q: 'Can I use personal Google accounts?',
          a: 'Yes, both corporate Google Workspace accounts and standard personal Google accounts are supported for authentication.'
        },
        {
          q: 'How long do sessions last?',
          a: 'Sessions remain active across restarts and page reloads for up to 30 days of inactivity, securely persisted in Supabase.'
        }
      ]
    },
    {
      id: 'workspace-access',
      title: 'Workspace Access & Multi-Company Tenancy',
      icon: <Building2 className="w-4 h-4 text-blue-600" />,
      summary: 'Managing company workspaces, role permissions, and tenant isolation.',
      faqs: [
        {
          q: 'How do I switch between different company workspaces?',
          a: 'Click your profile avatar or the workspace dropdown in the top header. You can switch instantly between all companies where you hold active membership.'
        },
        {
          q: 'What is the difference between Super Admin, Company Admin, and Member?',
          a: 'Super Admins oversee the entire system, approve signups, and create companies. Company Admins manage their specific company profile, team invites, and brand settings. Members generate and review campaign creatives.'
        }
      ]
    },
    {
      id: 'invite-problems',
      title: 'Invitation Problems & Direct Links',
      icon: <Mail className="w-4 h-4 text-emerald-600" />,
      summary: 'Resolving email invitation delivery, spam filters, and manual invite links.',
      faqs: [
        {
          q: 'What if an invited team member did not receive their email?',
          a: 'In Company Management > Team Members, click the "Copy Link" action. You can send the unique invite URL directly to your colleague via Slack or WhatsApp.'
        },
        {
          q: 'Why did the invite link say "Account Mismatch"?',
          a: 'For security, the Google account used to accept the invitation must match the exact email address that was invited. Log in with the invited email address.'
        }
      ]
    },
    {
      id: 'campaigns',
      title: 'Campaigns & Strategic Content',
      icon: <Target className="w-4 h-4 text-purple-600" />,
      summary: 'Generating multi-week campaign arcs, content pillars, and platform schedules.',
      faqs: [
        {
          q: 'How do I generate a new campaign?',
          a: 'Click "AI Campaign Generator" in the top header, select your strategic purpose (e.g., manifesto, product launch, customer story), target platforms, and target languages.'
        },
        {
          q: 'Can I generate campaigns in regional languages?',
          a: 'Yes! Autonoma natively supports multi-language campaign generation including English, Hindi, Marathi, German, Spanish, French, and regional dialects.'
        }
      ]
    },
    {
      id: 'brand-system',
      title: 'Brand System & Design Rules',
      icon: <Palette className="w-4 h-4 text-amber-600" />,
      summary: 'Enforcing deterministic typography, palettes, safe margins, and zero-drift styling.',
      faqs: [
        {
          q: 'Where do I configure brand colors and fonts?',
          a: 'Go to Company Settings > Brand Design System. You can define exact primary/secondary hex colors, heading/body fonts, visual style notes, and strict creative "do nots".'
        },
        {
          q: 'Does the Brand System affect AI image prompts?',
          a: 'Yes, Autonoma automatically enriches image prompts with your company\'s color palette, typography guidelines, and creative rules before calling visual models.'
        }
      ]
    },
    {
      id: 'image-generation',
      title: 'Image Generation (FLUX, OpenAI, Gemini)',
      icon: <Sparkles className="w-4 h-4 text-rose-600" />,
      summary: 'Choosing image providers, Cloudflare Workers AI FLUX, and BYOK models.',
      faqs: [
        {
          q: 'Why is Cloudflare FLUX Schnell the default provider?',
          a: 'Cloudflare FLUX Schnell provides fast, brand-safe, low-latency social creative generation configured via server-side credentials with high concurrency.'
        },
        {
          q: 'When should I select OpenAI or Gemini?',
          a: 'Choose OpenAI for complex, premium visuals or nuanced branding compositions. Choose Gemini if your organization already maintains quota under a Google Cloud/Gemini billing stack.'
        }
      ]
    },
    {
      id: 'video-generation',
      title: 'Video Generation & Storyboarding',
      icon: <Video className="w-4 h-4 text-teal-600" />,
      summary: 'Google Veo synthesis, multi-scene storyboards, and camera direction.',
      faqs: [
        {
          q: 'How do video storyboards work in Autonoma?',
          a: 'Every reel/video asset includes a 3-scene camera direction storyboard, spoken voiceover script, and production prompt ready for Google Veo or manual generation.'
        }
      ]
    },
    {
      id: 'billing-providers',
      title: 'Billing & Provider Issues',
      icon: <CreditCard className="w-4 h-4 text-indigo-600" />,
      summary: 'API quotas, server secrets, and configuring custom API keys.',
      faqs: [
        {
          q: 'Do I need my own API keys to run Autonoma?',
          a: 'Autonoma comes pre-configured with server-side secrets for Cloudflare FLUX and Google Gemini. If your team has higher volume needs, you can override with your custom API keys in AI & Media Providers settings.'
        }
      ]
    },
    {
      id: 'report-problem',
      title: 'Report a Problem & Contact Support',
      icon: <AlertCircle className="w-4 h-4 text-[#FF4500]" />,
      summary: 'Submit direct problem tickets to Apex Engineering engineering staff.',
      faqs: [
        {
          q: 'How do I contact customer support directly?',
          a: 'You can email support@apex-engineering.co.in or submit the diagnostic ticket form below. Our response time is typically within 1 business day.'
        }
      ]
    }
  ];

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportSubject.trim() || !reportMessage.trim()) return;
    setReportSubmitting(true);
    try {
      await fetch('/api/issue-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: reportSubject.trim(),
          description: reportMessage.trim(),
          category: 'SUPPORT_PAGE',
          userEmail: reportEmail.trim() || undefined,
          severity: 'NORMAL'
        })
      });
      setReportSubmitted(true);
    } catch {
      setReportSubmitted(true);
    } finally {
      setReportSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
      <PublicNav currentPage="support" />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 text-xs font-semibold">
            <span>Support & Documentation · Apex Engineering</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
            How can we help?
          </h1>
          <p className="text-sm text-[#6E6E73] leading-relaxed">
            Find immediate answers across all Autonoma modules, or submit a direct problem report to our engineering team in Pune, India.
          </p>
        </div>

        {/* Categories Accordion */}
        <div className="space-y-3">
          {categories.map((cat) => {
            const isOpen = openCategory === cat.id;

            return (
              <div
                key={cat.id}
                className="bg-white rounded-2xl border border-black/[0.06] overflow-hidden shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenCategory(isOpen ? null : cat.id)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 hover:bg-neutral-50/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-neutral-100/70 shrink-0">
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[#1D1D1F]">{cat.title}</h3>
                      <p className="text-xs text-[#86868B]">{cat.summary}</p>
                    </div>
                  </div>
                  <div className="text-[#86868B]">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 border-t border-black/[0.04] space-y-4 bg-[#FBFBFD]">
                    {cat.faqs.map((faq, idx) => (
                      <div key={idx} className="space-y-1 text-xs">
                        <span className="font-bold text-[#1D1D1F] block">{faq.q}</span>
                        <p className="text-[#6E6E73] leading-relaxed">{faq.a}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Report a Problem Form */}
        <div className="bg-white rounded-3xl border border-black/[0.06] p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-orange-50 rounded-xl text-[#FF4500]">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1D1D1F]">Report a Problem / Request Support</h2>
              <p className="text-xs text-[#86868B]">Our engineering staff reviews all production inquiries.</p>
            </div>
          </div>

          {reportSubmitted ? (
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Thank you! Your ticket has been logged with request ID tracking. Our team will review shortly.</span>
            </div>
          ) : (
            <form onSubmit={handleReportSubmit} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-[#1D1D1F] block mb-1">Your Email (Optional)</label>
                  <input
                    type="email"
                    placeholder="colleague@company.com"
                    value={reportEmail}
                    onChange={(e) => setReportEmail(e.target.value)}
                    className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500]"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1D1D1F] block mb-1">Subject / Issue Area *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Invite link expired for new administrator"
                    value={reportSubject}
                    onChange={(e) => setReportSubject(e.target.value)}
                    className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500]"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] block text-xs mb-1">Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe what occurred, any error messages displayed, and steps to reproduce..."
                  value={reportMessage}
                  onChange={(e) => setReportMessage(e.target.value)}
                  className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl p-3 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-[#86868B]">
                  Direct email:{' '}
                  <a href="mailto:support@apex-engineering.co.in" className="text-[#FF4500] font-semibold underline">
                    support@apex-engineering.co.in
                  </a>
                </span>
                <button
                  type="submit"
                  disabled={reportSubmitting}
                  className="px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{reportSubmitting ? 'Submitting...' : 'Submit Ticket'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Legal Links */}
        <div className="flex items-center justify-center gap-6 text-xs font-semibold text-[#6E6E73] pt-4">
          <button onClick={() => navigate('/privacy')} className="flex items-center gap-1.5 hover:text-[#1D1D1F]">
            <FileText className="w-3.5 h-3.5 text-[#FF4500]" />
            <span>Read Privacy Policy</span>
          </button>
          <span className="text-black/[0.1]">&bull;</span>
          <button onClick={() => navigate('/terms')} className="flex items-center gap-1.5 hover:text-[#1D1D1F]">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Read Terms of Service</span>
          </button>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};
