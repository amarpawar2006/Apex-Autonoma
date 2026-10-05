import React from 'react';
import { PublicNav, PublicFooter } from './PublicNav';
import { Shield, Lock, Eye, Database, Server, Mail, UserCheck, AlertTriangle } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans">
      <PublicNav currentPage="privacy" />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-semibold">
            <span>Last Updated: October 5, 2026</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F]">
            Privacy Policy
          </h1>
          <p className="text-sm text-[#6E6E73] leading-relaxed">
            Apex Autonoma is operated by Apex Engineering (Pune, India). This Privacy Policy explains our practices regarding the collection, use, disclosure, and protection of personal data and workspace intelligence.
          </p>
        </div>

        {/* Mandatory Google API User Data Policy Disclosure Banner */}
        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-6 space-y-3 text-xs leading-relaxed text-amber-950">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Google API Services User Data Policy & Limited Use Disclosure</span>
          </div>
          <p className="font-medium">
            <strong>Autonoma does not sell Google user data.</strong> Google user data is used only to provide requested Autonoma functionality, including user identity authentication and authorized workspace access.
          </p>
          <p>
            Apex Autonoma&apos;s use and transfer to any other app of information received from Google APIs will adhere to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF4500] underline font-semibold"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>
        </div>

        {/* Section 1: Information We Collect */}
        <section className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8 space-y-4 shadow-2xs">
          <h2 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-[#FF4500]" />
            <span>1. Information We Collect</span>
          </h2>
          <div className="text-xs sm:text-sm text-[#6E6E73] space-y-3 leading-relaxed">
            <p>
              <strong>Account Identity & Google Sign-In Data:</strong> When you authenticate via Google Sign-In, we collect your verified email address, full name, and avatar profile picture. We use this information solely to establish your authenticated session and associate your account with authorized company workspaces.
            </p>
            <p>
              <strong>Company & Workspace Information:</strong> Business descriptions, brand design systems (palettes, typography, voice, rules), market positioning, and target customer personas provided during workspace setup.
            </p>
            <p>
              <strong>Campaigns, Content & Media:</strong> Strategic briefs, generated social posts, captions, hashtags, custom visual prompts, deterministic SVG layouts, and generated creative media files.
            </p>
            <p>
              <strong>Server, Session & Technical Records:</strong> Session tokens (30-day cryptographic identifiers), client IP addresses, browser user-agents, request timestamps, and transaction latency to ensure operational security.
            </p>
            <p>
              <strong>Activity & Audit Records:</strong> Authoritative log of key administrative operations (e.g., user invitations, role updates, campaign approvals, deletion events) maintaining actor ID, severity, and outcome.
            </p>
            <p>
              <strong>Issue Reports:</strong> Diagnostic reports and problem descriptions submitted voluntarily by users for technical troubleshooting.
            </p>
          </div>
        </section>

        {/* Section 2: How We Use Your Information */}
        <section className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8 space-y-4 shadow-2xs">
          <h2 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#FF4500]" />
            <span>2. How Your Information Is Accessed, Used and Stored</span>
          </h2>
          <div className="text-xs sm:text-sm text-[#6E6E73] space-y-3 leading-relaxed">
            <p>
              We process your data exclusively to operate and deliver the Autonoma platform:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-[#6E6E73]">
              <li>Authenticating your identity securely and maintaining session continuity across devices.</li>
              <li>Synthesizing calibrated marketing campaigns, carousels, and publishing assets based strictly on your company&apos;s saved Brand System.</li>
              <li>Dispatching workspace onboarding invitations via transactional email.</li>
              <li>Maintaining immutable audit logs for enterprise governance and compliance.</li>
              <li>Preventing unauthorized access, fraudulent activity, and abuse.</li>
            </ul>
            <p className="pt-2 font-medium text-[#1D1D1F]">
              We do not train general-purpose foundation models on your private company intellectual property or proprietary brand materials.
            </p>
          </div>
        </section>

        {/* Section 3: Third-Party Processors & Infrastructure */}
        <section className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8 space-y-4 shadow-2xs">
          <h2 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
            <Server className="w-4 h-4 text-[#FF4500]" />
            <span>3. Third-Party Service Providers & Subprocessors</span>
          </h2>
          <div className="text-xs sm:text-sm text-[#6E6E73] space-y-3 leading-relaxed">
            <p>
              Autonoma partners with trusted enterprise infrastructure providers to deliver high-availability services:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-[#FBFBFD] border border-black/[0.06] space-y-1">
                <span className="font-semibold text-[#1D1D1F] block">Supabase Inc.</span>
                <span className="text-[#86868B]">Authoritative PostgreSQL database, encrypted object storage for generated creatives, and session persistence.</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FBFBFD] border border-black/[0.06] space-y-1">
                <span className="font-semibold text-[#1D1D1F] block">Google LLC</span>
                <span className="text-[#86868B]">Identity authentication (Google OAuth), Google Gemini generation APIs, and Google Cloud infrastructure.</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FBFBFD] border border-black/[0.06] space-y-1">
                <span className="font-semibold text-[#1D1D1F] block">Cloudflare, Inc.</span>
                <span className="text-[#86868B]">Edge inference runtime and Workers AI FLUX image synthesis.</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FBFBFD] border border-black/[0.06] space-y-1">
                <span className="font-semibold text-[#1D1D1F] block">OpenAI, LLC</span>
                <span className="text-[#86868B]">Text and image generation models when explicitly selected by workspace administrators.</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FBFBFD] border border-black/[0.06] space-y-1">
                <span className="font-semibold text-[#1D1D1F] block">Resend, Inc.</span>
                <span className="text-[#86868B]">Transactional email delivery for workspace invitations and administrative alerts.</span>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Data Retention & Security */}
        <section className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8 space-y-4 shadow-2xs">
          <h2 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#FF4500]" />
            <span>4. Data Retention, Security & Deletion</span>
          </h2>
          <div className="text-xs sm:text-sm text-[#6E6E73] space-y-3 leading-relaxed">
            <p>
              <strong>Security Standards:</strong> All data in transit is encrypted using modern TLS 1.3 protocol. Database tables and storage buckets are encrypted at rest using AES-256. API keys and secrets are never returned to client browsers or exposed in public logs.
            </p>
            <p>
              <strong>Data Retention:</strong> Active workspace assets, campaigns, and membership records are retained for the duration of the company&apos;s active account. Session tokens expire automatically after 30 days of inactivity.
            </p>
            <p>
              <strong>Account Deletion & Data Erasure:</strong> You have the right to request deletion of your user account, company workspaces, and generated media at any time. Submit your deletion request to{' '}
              <a href="mailto:support@apex-engineering.co.in" className="text-[#FF4500] font-semibold underline">
                support@apex-engineering.co.in
              </a>
              . All associated records in Supabase will be permanently purged within 30 days of verified request.
            </p>
          </div>
        </section>

        {/* Section 5: Your Rights */}
        <section className="bg-white rounded-2xl border border-black/[0.06] p-6 sm:p-8 space-y-4 shadow-2xs">
          <h2 className="text-base font-bold text-[#1D1D1F] flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#FF4500]" />
            <span>5. Your Rights</span>
          </h2>
          <div className="text-xs sm:text-sm text-[#6E6E73] space-y-2 leading-relaxed">
            <p>
              Depending on your jurisdiction, you may have the right to access the personal information we hold about you, request rectification of inaccurate data, request data portability (CSV export), or object to processing.
            </p>
            <p>
              For inquiries regarding data protection or to exercise your rights, contact our privacy officer at{' '}
              <span className="font-mono text-[#1D1D1F]">privacy@apex-engineering.co.in</span>.
            </p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
};
