import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ArrowRight, 
  Sparkles, 
  Building2, 
  Target, 
  Users, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  X,
  ShieldCheck,
  HelpCircle
} from 'lucide-react';
import { Company } from '../types/auth';

interface CompanySetupChecklistProps {
  company: Company;
  onOpenSetup: (targetTab?: 'ai_context' | 'profile' | 'understanding' | 'members') => void;
  canEdit?: boolean;
}

export const CompanySetupChecklist: React.FC<CompanySetupChecklistProps> = ({
  company,
  onOpenSetup,
  canEdit = true
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  const profile = company.profile;

  const steps = [
    {
      id: 'ai_context',
      label: 'AI Strategic Context',
      tab: 'ai_context' as const,
      isComplete: Boolean(profile?.confirmedContext?.isActive || (profile?.website && profile?.confirmedContext)),
      help: 'Analyse company website or paste evidence to extract AI brand intelligence.',
      example: profile?.confirmedContext?.isActive 
        ? `Active v${profile.confirmedContext.version}` 
        : 'e.g. Website-first analysis & brand voice extraction'
    },
    {
      id: 'organization_identity',
      label: 'Organization Identity',
      tab: 'profile' as const,
      isComplete: Boolean(company.name && profile?.organizationType),
      help: 'Define company name, entity type, and public channels.',
      example: `e.g. ${company.name || 'Your Company'} (${profile?.organizationType || 'Business'})`
    },
    {
      id: 'purpose_offerings',
      label: 'Purpose & Offerings',
      tab: 'profile' as const,
      isComplete: Boolean(profile?.description?.trim() && (profile?.offerings?.trim() || profile?.description?.trim().length > 15)),
      help: 'Core business description and primary products/services.',
      example: 'e.g. Value proposition, deliverables, and service catalog'
    },
    {
      id: 'audience_geography',
      label: 'Audience & Geography',
      tab: 'profile' as const,
      isComplete: Boolean(profile?.audience?.trim() && (profile?.geography?.trim() || profile?.audience?.trim().length > 10)),
      help: 'Identified customer personas, demographics, and regional hubs.',
      example: 'e.g. Primary target demographics and operational regions'
    },
    {
      id: 'growth_goal',
      label: 'Growth Goal',
      tab: 'profile' as const,
      isComplete: Boolean(profile?.primaryGoal?.trim()),
      help: 'Main conversion objective and desired marketing outcome.',
      example: 'e.g. Inquiries, customer bookings, or sales pipeline'
    },
    {
      id: 'review_confirm',
      label: 'Review & Confirm',
      tab: 'understanding' as const,
      isComplete: Boolean(profile?.confirmedContext?.isActive),
      help: "Review Autonoma's Understanding and confirm to activate versioned context.",
      example: profile?.confirmedContext?.isActive 
        ? `✓ Confirmed (v${profile.confirmedContext.version})` 
        : 'Pending admin confirmation'
    }
  ];

  const completedCount = steps.filter(s => s.isComplete).length;
  const totalCount = steps.length;
  const isFullyComplete = completedCount === totalCount;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  // If dismissed or fully complete and collapsed, render nothing or a compact pill
  if (isDismissed) return null;

  if (isFullyComplete && isCollapsed) return null;

  return (
    <div className="bg-gradient-to-r from-[#14161B] via-[#161922] to-[#14161B] border border-white/[0.08] rounded-2xl shadow-xl overflow-hidden transition-all duration-200">
      {/* Top Banner Row */}
      <div className="px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4 border-b border-white/[0.06] bg-black/20">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-[#FF4500]/10 border border-[#FF4500]/20 flex items-center justify-center text-[#FF4500] shrink-0">
            {isFullyComplete ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Sparkles className="w-4 h-4 text-[#FF4500]" />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {isFullyComplete ? 'Company Profile & AI Context Complete' : `Complete Setup for ${company.name}`}
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                isFullyComplete 
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                  : 'bg-[#FF4500]/20 text-[#FF4500] border border-[#FF4500]/30'
              }`}>
                {completedCount}/{totalCount} Steps ({progressPercent}%)
              </span>
            </div>
            <p className="text-[11px] text-[#86868B] hidden sm:block truncate">
              {isFullyComplete 
                ? 'Your brand voice and strategic context are actively applied to every campaign.'
                : 'Complete key details so Autonoma generates strictly tailored campaign content without generic copy.'
              }
            </p>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 shrink-0">
          {!isFullyComplete && canEdit && (
            <button
              onClick={() => {
                const firstIncomplete = steps.find(s => !s.isComplete);
                onOpenSetup(firstIncomplete ? firstIncomplete.tab : 'ai_context');
              }}
              className="px-3 py-1.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 flex items-center space-x-1"
            >
              <span>Continue Setup</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand checklist' : 'Collapse checklist'}
            className="p-1.5 text-[#86868B] hover:text-white rounded-lg hover:bg-white/[0.04]"
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            title="Dismiss checklist banner"
            className="p-1.5 text-[#86868B] hover:text-white rounded-lg hover:bg-white/[0.04]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expandable Checklist Body */}
      {!isCollapsed && (
        <div className="p-4 sm:p-6 space-y-4">
          {/* Progress bar */}
          <div className="w-full bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isFullyComplete ? 'bg-emerald-500' : 'bg-gradient-to-r from-[#FF4500] to-orange-400'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {steps.map((step, idx) => {
              return (
                <div 
                  key={step.id}
                  onClick={() => canEdit && onOpenSetup(step.tab)}
                  className={`p-3.5 rounded-xl border transition-all text-xs flex flex-col justify-between space-y-2 ${
                    canEdit ? 'cursor-pointer hover:border-[#FF4500]/40' : ''
                  } ${
                    step.isComplete
                      ? 'bg-black/20 border-emerald-500/20'
                      : 'bg-black/40 border-white/[0.06] hover:bg-black/60'
                  }`}
                >
                  <div className="flex items-start space-x-2.5">
                    <div className="mt-0.5 shrink-0">
                      {step.isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#86868B]" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center space-x-1.5">
                        <span className={`font-semibold ${step.isComplete ? 'text-white' : 'text-white/90'}`}>
                          {idx + 1}. {step.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#86868B] leading-relaxed">
                        {step.help}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[10px] text-[#6E6E73] font-mono">
                    <span className="truncate max-w-[200px]" title={step.example}>
                      {step.isComplete ? '✓ Configured' : step.example}
                    </span>
                    {canEdit && !step.isComplete && (
                      <span className="text-[#FF4500] font-sans font-semibold shrink-0">
                        Set up →
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-[11px] text-[#86868B] flex items-center space-x-1.5 pt-1">
            <HelpCircle className="w-3.5 h-3.5 text-[#6E6E73] shrink-0" />
            <span>
              All existing campaigns and content remain fully accessible during setup. Settings are saved per-company in durable storage.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
