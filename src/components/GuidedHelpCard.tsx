import React, { useState } from 'react';
import { 
  Compass, 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Palette, 
  ShieldCheck, 
  FolderKanban, 
  Image as ImageIcon, 
  Share2,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { Company } from '../types/auth';
import { Campaign, SocialAsset } from '../types/campaign';
import { AppNavTab } from './Header';

interface GuidedHelpCardProps {
  company: Company | null;
  campaigns: Campaign[];
  assets: SocialAsset[];
  onNavigate: (tab: AppNavTab) => void;
  onOpenCompanySetup: (tab?: string) => void;
  onOpenAiGenerator: () => void;
  guidedHelpEnabled: boolean;
  setGuidedHelpEnabled: (enabled: boolean) => void;
}

export interface Milestone {
  id: string;
  number: number;
  title: string;
  description: string;
  completed: boolean;
  actionLabel: string;
  action: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

export const GuidedHelpCard: React.FC<GuidedHelpCardProps> = ({
  company,
  campaigns,
  assets,
  onNavigate,
  onOpenCompanySetup,
  onOpenAiGenerator,
  guidedHelpEnabled,
  setGuidedHelpEnabled
}) => {
  const [isMinimized, setIsMinimized] = useState<boolean>(false);

  // Compute status for the 6 Core Autonoma Milestones
  const hasWebsite = Boolean(company?.profile?.website || company?.profile?.description);
  const hasConfirmedContext = Boolean(company?.profile?.confirmedContext?.isActive);
  const hasBrandSystem = Boolean(
    company?.profile?.brandDesignSystem?.primaryColor && 
    (company?.profile?.brandDesignSystem?.visualStyleNotes || company?.profile?.brandDesignSystem?.logoUrl)
  );
  const hasCampaign = campaigns.length > 0;
  const hasGeneratedMedia = assets.some(a => a.productionStatus === 'READY' || a.productionStatus === 'APPROVED' || Boolean(a.generatedImageUrl || a.generatedVideoUrl));
  const hasSharedOrApproved = assets.some(a => a.status === 'approved' || a.status === 'scheduled' || a.status === 'in_review');

  const milestones: Milestone[] = [
    {
      id: 'website',
      number: 1,
      title: 'Add company website',
      description: 'Provide website URL or business description for brand intelligence.',
      completed: hasWebsite,
      actionLabel: 'Add website',
      action: () => onOpenCompanySetup('ai_context'),
      icon: Sparkles
    },
    {
      id: 'understanding',
      number: 2,
      title: 'Confirm company understanding',
      description: 'Review and activate Autonoma’s strategic understanding of your brand.',
      completed: hasConfirmedContext,
      actionLabel: 'Confirm understanding',
      action: () => onOpenCompanySetup('understanding'),
      icon: ShieldCheck
    },
    {
      id: 'design_system',
      number: 3,
      title: 'Save brand design system',
      description: 'Define your colors, fonts, visual direction and upload guidelines PDF.',
      completed: hasBrandSystem,
      actionLabel: 'Configure brand system',
      action: () => onNavigate('design_system'),
      icon: Palette
    },
    {
      id: 'first_campaign',
      number: 4,
      title: 'Create first campaign',
      description: 'Generate multi-concept, multi-platform social media campaigns with AI.',
      completed: hasCampaign,
      actionLabel: 'Generate campaign',
      action: () => onOpenAiGenerator(),
      icon: FolderKanban
    },
    {
      id: 'generate_image',
      number: 5,
      title: 'Generate first creative image',
      description: 'Produce high-converting visuals using your saved company design system.',
      completed: hasGeneratedMedia,
      actionLabel: 'Open studio',
      action: () => onNavigate('creative_studio'),
      icon: ImageIcon
    },
    {
      id: 'share_approval',
      number: 6,
      title: 'Share posts for approval',
      description: 'Review today’s production and share ready posts via WhatsApp or email.',
      completed: hasSharedOrApproved,
      actionLabel: 'Review production',
      action: () => onNavigate('todays_production'),
      icon: Share2
    }
  ];

  const completedCount = milestones.filter(m => m.completed).length;
  const totalCount = milestones.length;
  const percentComplete = Math.round((completedCount / totalCount) * 100);
  const nextMilestone = milestones.find(m => !m.completed);

  // If user turned guided help off completely
  if (!guidedHelpEnabled) {
    return (
      <div className="flex items-center justify-end mb-3">
        <button
          onClick={() => setGuidedHelpEnabled(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] bg-white hover:bg-slate-50 border border-black/[0.06] rounded-full transition-all shadow-2xs"
          title="Turn Guided Help ON"
        >
          <Compass className="h-3 w-3 text-[#FF4500]" />
          <span>Guided Help: OFF</span>
        </button>
      </div>
    );
  }

  // If all milestones completed
  if (completedCount === totalCount) {
    return (
      <div className="mb-5 flex items-center justify-between p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 text-xs text-emerald-950">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">All 6 Onboarding Milestones Complete!</span>
          <span className="hidden sm:inline text-emerald-800 text-[11px]">
            Your company workspace is fully configured and generating creatives.
          </span>
        </div>
        <button
          onClick={() => setGuidedHelpEnabled(false)}
          className="text-[11px] font-medium text-emerald-800 hover:text-emerald-950 hover:underline shrink-0"
        >
          Hide Guide
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-3xl border border-black/[0.07] bg-white shadow-2xs overflow-hidden transition-all">
      {/* Top Banner Bar */}
      <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-orange-50 text-[#FF4500] shrink-0">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FF4500]">
                Guided Setup
              </span>
              <span className="text-[11px] font-medium text-[#86868B]">
                · {completedCount} of {totalCount} completed ({percentComplete}%)
              </span>
            </div>
            {nextMilestone && (
              <h3 className="text-sm font-semibold text-[#1D1D1F] mt-0.5 flex items-center gap-1.5">
                <span>Next Recommended Step:</span>
                <span className="text-[#FF4500]">{nextMilestone.title}</span>
              </h3>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {nextMilestone && (
            <button
              onClick={nextMilestone.action}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#0A0B0E] hover:bg-black text-white px-3.5 py-2 text-xs font-semibold shadow-xs active:scale-95 transition-all"
            >
              <span>{nextMilestone.actionLabel}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 rounded-xl text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors"
            title={isMinimized ? 'Expand Guide' : 'Collapse Guide'}
          >
            {isMinimized ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>

          <button
            onClick={() => setGuidedHelpEnabled(false)}
            className="p-2 rounded-xl text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] transition-colors"
            title="Turn Guided Help OFF"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="h-1 w-full bg-slate-100">
        <div 
          className="h-full bg-gradient-to-r from-[#FF4500] to-orange-400 transition-all duration-300"
          style={{ width: `${percentComplete}%` }}
        />
      </div>

      {/* Expanded Milestone Grid */}
      {!isMinimized && (
        <div className="p-4 sm:p-5 pt-3 border-t border-black/[0.04] bg-[#FBFBFD]/60">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {milestones.map((m) => {
              const Icon = m.icon;
              return (
                <div
                  key={m.id}
                  onClick={() => { if (!m.completed) m.action(); }}
                  className={`p-3 rounded-2xl border transition-all text-xs flex flex-col justify-between gap-2.5 ${
                    m.completed
                      ? 'bg-emerald-50/40 border-emerald-200/60 text-emerald-950'
                      : m.id === nextMilestone?.id
                      ? 'bg-white border-[#FF4500]/30 shadow-xs ring-1 ring-[#FF4500]/20 cursor-pointer hover:border-[#FF4500]'
                      : 'bg-white border-black/[0.06] text-[#6E6E73] cursor-pointer hover:border-black/20'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${m.completed ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-[#1D1D1F]'}`}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                      <span className={`font-semibold text-xs ${m.completed ? 'text-emerald-900 line-through opacity-80' : 'text-[#1D1D1F]'}`}>
                        {m.number}. {m.title}
                      </span>
                    </div>
                    {m.completed ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 text-slate-300 shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] leading-relaxed opacity-75">
                    {m.description}
                  </p>

                  {!m.completed && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        m.action();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#FF4500] hover:underline self-start pt-1"
                    >
                      <span>{m.actionLabel}</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
