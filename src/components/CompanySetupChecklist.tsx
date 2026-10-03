import React, { useState } from 'react';
import { CheckCircle2, Circle, ArrowRight, Sparkles, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Company } from '../types/auth';

interface CompanySetupChecklistProps {
  company: Company;
  onOpenSetup: (targetTab?: 'ai_context' | 'profile' | 'understanding' | 'members') => void;
  canEdit?: boolean;
}

export const CompanySetupChecklist: React.FC<CompanySetupChecklistProps> = ({
  company, onOpenSetup, canEdit = true
}) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const profile = company.profile;

  const steps = [
    { id: 'ai_context', label: 'AI Strategic Context', tab: 'ai_context' as const, complete: Boolean(profile?.confirmedContext?.isActive || (profile?.website && profile?.confirmedContext)) },
    { id: 'organization_identity', label: 'Organization Identity', tab: 'profile' as const, complete: Boolean(company.name && profile?.organizationType) },
    { id: 'purpose_offerings', label: 'Purpose & Offerings', tab: 'profile' as const, complete: Boolean(profile?.description?.trim() && (profile?.offerings?.trim() || profile?.description?.trim().length > 15)) },
    { id: 'audience_geography', label: 'Audience & Geography', tab: 'profile' as const, complete: Boolean(profile?.audience?.trim() && (profile?.geography?.trim() || profile?.audience?.trim().length > 10)) },
    { id: 'growth_goal', label: 'Growth Goal', tab: 'profile' as const, complete: Boolean(profile?.primaryGoal?.trim()) },
    { id: 'review_confirm', label: 'Review & Confirm', tab: 'understanding' as const, complete: Boolean(profile?.confirmedContext?.isActive) }
  ];

  const completedCount = steps.filter((s) => s.complete).length;
  const totalCount = steps.length;
  const fullyComplete = completedCount === totalCount;
  const percent = Math.round((completedCount / totalCount) * 100);
  const firstIncomplete = steps.find((s) => !s.complete);

  // Guided Setup is the single onboarding surface once the profile is complete.
  // Avoid showing a second contradictory 6/6 panel.
  if (isDismissed || fullyComplete) return null;

  return (
    <section className="rounded-2xl border border-black/[0.07] bg-white shadow-2xs overflow-hidden" aria-label="Company profile setup progress">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs font-semibold text-[#1D1D1F]">Complete company profile</h3>
              <span className="text-[10px] font-mono text-[#6E6E73]">{completedCount}/{totalCount} · {percent}%</span>
            </div>
            <p className="text-[11px] text-[#6E6E73] truncate">Finish strategic context so every generated campaign stays company-specific.</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {canEdit && firstIncomplete && (
            <button type="button" onClick={() => onOpenSetup(firstIncomplete.tab)} className="inline-flex items-center gap-1 rounded-xl bg-[#1D1D1F] px-3 py-1.5 text-[11px] font-semibold text-white">
              Continue <ArrowRight className="h-3 w-3" />
            </button>
          )}
          <button type="button" aria-label={isCollapsed ? 'Expand profile setup details' : 'Collapse profile setup details'} onClick={() => setIsCollapsed(!isCollapsed)} className="p-2 rounded-lg text-[#6E6E73] hover:bg-black/[0.04]">
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
          <button type="button" aria-label="Dismiss profile setup reminder" onClick={() => setIsDismissed(true)} className="p-2 rounded-lg text-[#6E6E73] hover:bg-black/[0.04]">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="h-1 bg-black/[0.04]"><div className="h-full bg-[#FF4500]" style={{ width: `${percent}%` }} /></div>
      {!isCollapsed && (
        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 border-t border-black/[0.04] bg-[#FBFBFD]">
          {steps.map((step, idx) => (
            <button key={step.id} type="button" disabled={!canEdit} onClick={() => onOpenSetup(step.tab)} className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-white px-3 py-2.5 text-left disabled:cursor-default">
              {step.complete ? <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> : <Circle className="h-4 w-4 text-[#86868B] shrink-0" />}
              <span className="text-[11px] font-medium text-[#1D1D1F]">{idx + 1}. {step.label}</span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
};
