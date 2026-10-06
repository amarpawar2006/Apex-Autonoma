import React, { useEffect, useRef, useState } from 'react';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  RotateCcw,
  ArrowRight,
  Layers,
  Video,
  Image as ImageIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Globe,
  Calendar,
  Layers2,
  FolderKanban,
  FileSpreadsheet,
  Database,
  ShieldCheck,
  Undo2,
  Edit3,
  HelpCircle,
  AlertCircle,
  TrendingUp,
  Target
} from 'lucide-react';
import { Platform, ContentFormat, Campaign, SocialAsset } from '../types/campaign';
import { calculateOptimalAssetCount, createAutonomaCampaign } from '../services/campaignService';
import { autonomaDataService } from '../services/autonomaDataService';
import { improveBriefWithAI, ImproveBriefResponse } from '../services/geminiService';
import { ExistingDataImportSection } from './campaign/ExistingDataImportSection';

interface AiCampaignGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: (result: { campaign: Campaign; assets: SocialAsset[] }) => void;
  onViewCampaignDetail?: (campaign: Campaign) => void;
}

export const GOAL_OPTIONS = [
  'More enquiries/leads',
  'More sales/orders',
  'More followers',
  'More engagement',
  'More website visits',
  'More registrations',
  'More reach and shares',
  'Customer education',
  'Community participation'
] as const;

export type CampaignGoal = typeof GOAL_OPTIONS[number];

const GOAL_EXAMPLES: Record<CampaignGoal, string> = {
  'More enquiries/leads':
    'Promote our 2-day business consultation to B2B founders struggling with fragmented manual tools. Focus on real workflow teardowns and booking discovery audits.',
  'More sales/orders':
    'Introduce our new seasonal collection or direct product offer with simple WhatsApp checkout. Emphasize fast delivery and zero order friction.',
  'More followers':
    'Build founder and brand authority by sharing actionable teardowns of common industry mistakes and practical blueprints.',
  'More engagement':
    'Spark thoughtful discussions and polls asking operators to share their biggest daily bottleneck and how they currently solve it.',
  'More website visits':
    'Drive curious decision-makers to read our complete case study and explore the interactive architecture system on our site.',
  'More registrations':
    'Invite boutique operators and founders to our upcoming live walkthrough showing automated operations in action.',
  'More reach and shares':
    'Publish a high-resonance manifesto challenging generic industry clichés and articulating the real friction customers experience.',
  'Customer education':
    'Demystify how structured rules and data eliminate repetitive manual work, explaining complex concepts with simple visuals.',
  'Community participation':
    'Invite our community of creators and business leaders to contribute their best tips, featuring user stories and mutual learning.'
};

export const AiCampaignGeneratorModal: React.FC<AiCampaignGeneratorModalProps> = ({
  isOpen,
  onClose,
  onCampaignCreated,
  onViewCampaignDetail,
}) => {
  // Goal Selection State
  const [primaryGoal, setPrimaryGoal] = useState<CampaignGoal>('More enquiries/leads');
  const [secondaryGoals, setSecondaryGoals] = useState<CampaignGoal[]>([]);

  // Primary field: Natural Language Business Objective
  const [brief, setBrief] = useState<string>('');
  const modalScrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    requestAnimationFrame(() => {
      modalScrollRef.current?.scrollTo({ top: 0, behavior: 'auto' });
      modalScrollRef.current?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // AI Brief Improvement & Rewriting State
  const [isImprovingBrief, setIsImprovingBrief] = useState<boolean>(false);
  const [improveError, setImproveError] = useState<string | null>(null);
  const [proposedRewrite, setProposedRewrite] = useState<ImproveBriefResponse | null>(null);
  const [originalBriefSnapshot, setOriginalBriefSnapshot] = useState<string | null>(null);
  const [isEditingRewrite, setIsEditingRewrite] = useState<boolean>(false);
  const [editedRewriteText, setEditedRewriteText] = useState<string>('');

  // Platform selection (Default: Instagram + Facebook + LinkedIn)
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>([
    'instagram',
    'facebook',
    'linkedin'
  ]);
  const [letAutonomaDecidePlatforms, setLetAutonomaDecidePlatforms] = useState<boolean>(false);

  // Format selection (Default: "Let Autonoma decide" ON)
  const [selectedFormats, setSelectedFormats] = useState<ContentFormat[]>([
    'carousel',
    'reel_short',
    'static_poster'
  ]);
  const [letAutonomaDecideFormats, setLetAutonomaDecideFormats] = useState<boolean>(true);

  // Campaign Duration
  type DurationOption = 'single' | '3_days' | '7_days' | '30_days' | 'custom';
  const [duration, setDuration] = useState<DurationOption>('7_days');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );

  // Language options
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [customLanguage, setCustomLanguage] = useState<string>('');
  const [languageStyle, setLanguageStyle] = useState<string>('Natural');

  // Custom Platform
  const [customPlatform, setCustomPlatform] = useState<string>('');
  const [hasCustomPlatform, setHasCustomPlatform] = useState<boolean>(false);

  // Advanced Options (collapsible)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [primaryCta, setPrimaryCta] = useState<string>('');
  const [productsEmphasized, setProductsEmphasized] = useState<string>('');
  const [customAssetCount, setCustomAssetCount] = useState<number | ''>('');
  const [postingFrequency, setPostingFrequency] = useState<string>('Dynamic Platform Peak Windows (IST)');
  const [tone, setTone] = useState<string>('Authoritative, pragmatic & conversion-focused');
  const [additionalInstructions, setAdditionalInstructions] = useState<string>('');

  // Loading & Result States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{ campaign: Campaign; assets: SocialAsset[] } | null>(null);
  const [pendingCommitResult, setPendingCommitResult] = useState<{ campaign: Campaign; assets: SocialAsset[] } | null>(null);

  // Approved imported business context & sources
  const [approvedImportedContext, setApprovedImportedContext] = useState<string>('');
  const [, setApprovedImportedSourceIds] = useState<string[]>([]);

  // Request sequence tracker to prevent late response from an earlier request replacing current campaign
  const activeRequestIdRef = React.useRef<number>(0);
  // Persisted shell ref to ensure retries reuse the exact same campaign ID without duplicates
  const activeCampaignShellRef = React.useRef<Campaign | null>(null);

  // Reset to clean draft on fresh open
  React.useEffect(() => {
    if (isOpen) {
      activeRequestIdRef.current += 1;
      setBrief('');
      setPrimaryGoal('More enquiries/leads');
      setSecondaryGoals([]);
      setSelectedLanguages(['English']);
      setCustomLanguage('');
      setLanguageStyle('Natural');
      setCustomPlatform('');
      setHasCustomPlatform(false);
      setAdditionalInstructions('');
      setIsImprovingBrief(false);
      setImproveError(null);
      setProposedRewrite(null);
      setOriginalBriefSnapshot(null);
      setIsEditingRewrite(false);
      setEditedRewriteText('');
      setTargetAudience('');
      setPrimaryCta('');
      setProductsEmphasized('');
      setCustomAssetCount('');
      setError(null);
      setCreatedResult(null);
      setPendingCommitResult(null);
      setIsLoading(false);
      setLoadingStep('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Toggle primary goal
  const handleSelectPrimaryGoal = (goal: CampaignGoal) => {
    setPrimaryGoal(goal);
    // If the new primary was in secondary, remove it
    setSecondaryGoals((prev) => prev.filter((g) => g !== goal));
  };

  // Toggle secondary goal
  const handleToggleSecondaryGoal = (goal: CampaignGoal) => {
    if (goal === primaryGoal) return;
    setSecondaryGoals((prev) =>
      prev.includes(goal) ? prev.filter((g) => g !== goal) : [...prev, goal]
    );
  };

  // Toggle platform
  const handleTogglePlatform = (platform: Platform) => {
    if (letAutonomaDecidePlatforms) {
      setLetAutonomaDecidePlatforms(false);
    }
    setSelectedPlatforms((prev) =>
      prev.includes(platform) ? prev.filter((p) => p !== platform) : [...prev, platform]
    );
  };

  // Toggle format
  const handleToggleFormat = (format: ContentFormat) => {
    if (letAutonomaDecideFormats) {
      setLetAutonomaDecideFormats(false);
    }
    setSelectedFormats((prev) =>
      prev.includes(format) ? prev.filter((f) => f !== format) : [...prev, format]
    );
  };

  // Handle "Improve with AI" action
  const handleImproveBrief = async () => {
    if (!brief.trim()) return;

    activeRequestIdRef.current += 1;
    const reqId = activeRequestIdRef.current;
    setIsImprovingBrief(true);
    setImproveError(null);

    try {
      const response = await improveBriefWithAI({
        brief: brief.trim(),
        primaryGoal,
        secondaryGoals,
      });

      if (reqId !== activeRequestIdRef.current) return;

      setProposedRewrite(response);
      setEditedRewriteText(response.rewrittenBrief);
      setIsEditingRewrite(false);
    } catch (err: any) {
      if (reqId !== activeRequestIdRef.current) return;
      console.warn('[Campaign Director] Improve brief error:', err);
      setImproveError(err?.message || 'Could not improve brief with AI. You can continue editing manually.');
    } finally {
      if (reqId === activeRequestIdRef.current) {
        setIsImprovingBrief(false);
      }
    }
  };

  // Accept proposed rewrite
  const handleAcceptRewrite = () => {
    if (!proposedRewrite) return;
    const finalRewrite = isEditingRewrite ? editedRewriteText : proposedRewrite.rewrittenBrief;
    
    // Preserve current brief in snapshot for Undo
    setOriginalBriefSnapshot(brief);
    setBrief(finalRewrite);

    // Apply suggested audience/CTA if empty
    if (proposedRewrite.suggestedAudience && !targetAudience.trim()) {
      setTargetAudience(proposedRewrite.suggestedAudience);
    }
    if (proposedRewrite.suggestedPrimaryCta && !primaryCta.trim()) {
      setPrimaryCta(proposedRewrite.suggestedPrimaryCta);
    }

    setProposedRewrite(null);
    setIsEditingRewrite(false);
    setImproveError(null);
  };

  // Undo rewrite
  const handleUndoRewrite = () => {
    if (originalBriefSnapshot !== null) {
      setBrief(originalBriefSnapshot);
      setOriginalBriefSnapshot(null);
    }
  };

  // Dismiss proposed rewrite
  const handleDismissRewrite = () => {
    setProposedRewrite(null);
    setIsEditingRewrite(false);
    setImproveError(null);
  };

  const handleCreateCampaign = async () => {
    if (!brief.trim()) return;

    activeRequestIdRef.current += 1;
    const reqId = activeRequestIdRef.current;

    setIsLoading(true);
    setError(null);

    const step1 = setTimeout(() => {
      if (reqId === activeRequestIdRef.current) {
        setLoadingStep('Synthesizing content pillars, format mix & calibrated narrative sequence…');
      }
    }, 1500);

    const step2 = setTimeout(() => {
      if (reqId === activeRequestIdRef.current) {
        setLoadingStep('Structuring content deliverables (ZERO image/video calls)…');
      }
    }, 3000);

    try {
      const effectivePlatformList = [...selectedPlatforms];
      if (hasCustomPlatform && customPlatform.trim() && !effectivePlatformList.includes(customPlatform.trim())) {
        effectivePlatformList.push(customPlatform.trim());
      }

      const effectiveLanguages = selectedLanguages
        .filter((lang) => lang !== 'Other / Custom Language')
        .map((lang) => lang.trim())
        .filter(Boolean);
      if (selectedLanguages.includes('Other / Custom Language') && customLanguage.trim()) {
        effectiveLanguages.push(customLanguage.trim());
      }
      if (effectiveLanguages.length === 0) effectiveLanguages.push('English');

      const customDaysSpan = duration === 'custom'
        ? Math.max(1, Math.round((new Date(customEndDate).getTime() - new Date(customStartDate).getTime()) / 86400000))
        : duration === 'single' ? 1 : duration === '3_days' ? 3 : duration === '30_days' ? 30 : 7;
      const conceptCountEstimate = calculateOptimalAssetCount(
        duration,
        Math.max(1, effectivePlatformList.length),
        customDaysSpan,
        typeof customAssetCount === 'number' && customAssetCount > 0 ? customAssetCount : undefined,
        Math.max(1, effectiveLanguages.length)
      );
      const estimatedDeliverables = conceptCountEstimate * Math.max(1, effectivePlatformList.length) * Math.max(1, effectiveLanguages.length);
      if (estimatedDeliverables > 36) {
        setError(`This setup would create ${estimatedDeliverables} deliverables (${conceptCountEstimate} concepts × ${effectivePlatformList.length} platforms × ${effectiveLanguages.length} languages). Reduce the concept count, platforms, or languages to 36 or fewer for one reliable generation run.`);
        return;
      }

      const now = new Date();
      const campaignCodeSuffix = Math.floor(100 + Math.random() * 900);
      const campaignId = activeCampaignShellRef.current?.id || `cmp-${Date.now()}`;
      const campaignCode = activeCampaignShellRef.current?.campaignCode || `CMP-2026-${campaignCodeSuffix}`;
      const campaignName = activeCampaignShellRef.current?.name || brief.trim().slice(0, 50);

      const optionsPayload = {
        brief: brief.trim(),
        primaryGoal,
        secondaryGoals,
        importedCampaignContext: approvedImportedContext || undefined,
        platforms: effectivePlatformList,
        autoPlatforms: letAutonomaDecidePlatforms,
        formats: selectedFormats,
        autoFormats: letAutonomaDecideFormats,
        duration,
        startDate: duration === 'custom' ? customStartDate : undefined,
        endDate: duration === 'custom' ? customEndDate : undefined,
        languages: effectiveLanguages,
        customLanguage: selectedLanguages.includes('Other / Custom Language') ? customLanguage.trim() : undefined,
        customPlatform: hasCustomPlatform && customPlatform.trim() ? customPlatform.trim() : undefined,
        languageStyle,
        additionalInstructions: additionalInstructions.trim() || undefined,
        campaignIdOverride: campaignId,
        campaignCodeOverride: campaignCode,
        advancedOptions: {
          targetAudience: targetAudience.trim() || undefined,
          primaryCta: primaryCta.trim() || undefined,
          productsEmphasized: productsEmphasized.trim() || undefined,
          assetCount: typeof customAssetCount === 'number' && customAssetCount > 0 ? customAssetCount : undefined,
          postingFrequency: postingFrequency.trim() || undefined,
          tone: tone.trim() || undefined,
          customLanguage: selectedLanguages.includes('Other / Custom Language') ? customLanguage.trim() : undefined,
          customPlatform: hasCustomPlatform && customPlatform.trim() ? customPlatform.trim() : undefined,
          languageStyle,
          additionalInstructions: additionalInstructions.trim() || undefined,
        }
      };

      // Part 1: SAVE CAMPAIGN SHELL IMMEDIATELY with status = GENERATING
      setLoadingStep('INITIALIZING CAMPAIGN SHELL... Persisting campaign record…');
      const initialShell: Campaign = {
        id: campaignId,
        campaignCode,
        name: campaignName,
        brief: brief.trim(),
        objective: primaryGoal,
        status: 'ACTIVE',
        generationStatus: 'GENERATING',
        lastGenerationAttemptAt: now.toISOString(),
        platforms: effectivePlatformList,
        formats: selectedFormats,
        languages: effectiveLanguages,
        startDate: duration === 'custom' && customStartDate ? customStartDate : now.toISOString().split('T')[0],
        endDate: duration === 'custom' && customEndDate ? customEndDate : new Date(now.getTime() + 7 * 86400000).toISOString().split('T')[0],
        createdAt: activeCampaignShellRef.current?.createdAt || now.toISOString(),
        updatedAt: now.toISOString(),
        assetCount: 0,
        generationOptions: optionsPayload
      };

      const savedShell = await autonomaDataService.saveCampaign(initialShell);
      activeCampaignShellRef.current = savedShell;
      // Campaign creation is immediately persisted and visible in UI!
      onCampaignCreated({ campaign: savedShell, assets: [] });

      if (reqId !== activeRequestIdRef.current) return;

      // Part 1: Invoke AI synthesis
      setLoadingStep('Analyzing business objective & synthesizing deliverables via Gemini…');
      const result = await createAutonomaCampaign(optionsPayload);

      if (reqId !== activeRequestIdRef.current) return;

      result.campaign.generationStatus = 'READY';
      result.campaign.lastGenerationError = undefined;
      result.campaign.lastGenerationAttemptAt = new Date().toISOString();

      // Part 1: On success, commit populated campaign & assets (status = READY)
      setLoadingStep('SAVING DELIVERABLES... Committing deliverables to database and Google Sheets…');
      const commitRes = await autonomaDataService.commitCampaign(result.campaign, result.assets);

      if (reqId !== activeRequestIdRef.current) return;

      const persistedResult = {
        campaign: commitRes.campaign,
        assets: commitRes.assets
      };

      activeCampaignShellRef.current = null;
      onCampaignCreated(persistedResult);
      setCreatedResult(persistedResult);
    } catch (err: any) {
      if (reqId !== activeRequestIdRef.current) return;
      console.error('[Campaign Director] Campaign synthesis timed out or failed:', err);
      const errMsg = err?.message || 'Campaign synthesis request timed out.';
      
      // Part 1: On timeout/failure status = GENERATION_FAILED; Campaign SHELL REMAINS PERSISTED
      if (activeCampaignShellRef.current) {
        const failedShell: Campaign = {
          ...activeCampaignShellRef.current,
          generationStatus: 'GENERATION_FAILED',
          lastGenerationError: errMsg,
          lastGenerationAttemptAt: new Date().toISOString()
        };
        await autonomaDataService.saveCampaign(failedShell).catch(() => null);
        activeCampaignShellRef.current = failedShell;
        onCampaignCreated({ campaign: failedShell, assets: [] });
      }

      setError(errMsg);
    } finally {
      clearTimeout(step1);
      clearTimeout(step2);
      if (reqId === activeRequestIdRef.current) {
        setIsLoading(false);
        setLoadingStep('');
      }
    }
  };

  const handleRetrySynthesis = async () => {
    const shell = activeCampaignShellRef.current;
    if (!shell?.id) {
      await handleCreateCampaign();
      return;
    }
    setIsLoading(true);
    setError(null);
    setLoadingStep('Retrying campaign synthesis using the saved campaign shell…');
    try {
      const result = await autonomaDataService.retryCampaignGeneration(shell.id);
      activeCampaignShellRef.current = null;
      onCampaignCreated(result);
      setCreatedResult(result);
    } catch (err: any) {
      setError(err?.message || 'Campaign synthesis retry failed. Your saved campaign remains intact.');
    } finally {
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleResetAndClose = () => {
    activeCampaignShellRef.current = null;
    setCreatedResult(null);
    setPendingCommitResult(null);
    setError(null);
    onClose();
  };

  const availablePlatforms: { id: Platform; label: string }[] = [
    { id: 'instagram', label: 'Instagram' },
    { id: 'facebook', label: 'Facebook' },
    { id: 'linkedin', label: 'LinkedIn' },
    { id: 'twitter', label: 'X' },
    { id: 'youtube', label: 'YouTube' },
    { id: 'threads', label: 'Threads' },
    { id: 'reddit', label: 'Reddit' },
    { id: 'snapchat', label: 'Snapchat' },
    { id: 'pinterest', label: 'Pinterest' },
  ];

  const availableFormats: { id: ContentFormat; label: string }[] = [
    { id: 'static_poster', label: 'Static posts' },
    { id: 'carousel', label: 'Carousels' },
    { id: 'reel_short', label: 'Reels' },
    { id: 'story', label: 'Stories' },
    { id: 'founder_card', label: 'LinkedIn posts' },
    { id: 'short_video', label: 'YouTube Shorts' },
  ];

  const languagesList = [
    'English',
    'Hindi',
    'Marathi',
    'Bengali',
    'Telugu',
    'Tamil',
    'Gujarati',
    'Urdu',
    'Kannada',
    'Odia',
    'Malayalam',
    'Punjabi',
    'Assamese',
    'Mixed / Hinglish',
    'Mixed / Marathi + English',
    'Other / Custom Language'
  ];

  const languageStyles = [
    'Natural',
    'Professional',
    'Conversational',
    'Local / colloquial',
    'Formal'
  ];

  const showViralityNote = primaryGoal === 'More reach and shares' || secondaryGoals.includes('More reach and shares');

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="create-campaign-title" className="fixed inset-0 z-[300] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/45 backdrop-blur-md overflow-y-auto">
      <div ref={modalScrollRef} tabIndex={-1} className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-2xl w-full p-4 sm:p-7 space-y-6 max-h-[calc(100vh-1.5rem)] sm:max-h-[92vh] overflow-y-auto overscroll-contain animate-in fade-in zoom-in-95 duration-200">
        
        {/* If Campaign was just created, show Apple-style summary confirmation */}
        {createdResult ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-semibold text-[#1D1D1F] tracking-tight">
                      Campaign Strategy Synthesized
                    </h2>
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] tracking-wide">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>CAMPAIGN SAVED</span>
                    </span>
                  </div>
                  <p className="text-xs text-[#6E6E73] mt-0.5">
                    {createdResult.campaign.campaignCode} · {createdResult.assets.length} content deliverables persisted to durable operational database
                  </p>
                </div>
              </div>
              <button
                onClick={handleResetAndClose}
                aria-label="Close campaign dialog"
                className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-[#F5F5F7] rounded-2xl p-5 space-y-4">
              <div>
                <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                  Campaign Title
                </span>
                <h3 className="text-base font-semibold text-[#1D1D1F] mt-0.5">
                  {createdResult.campaign.name}
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-[#86868B] block font-medium">Primary Goal</span>
                  <span className="text-[#1D1D1F] font-semibold mt-0.5 block">
                    {primaryGoal}
                  </span>
                </div>
                <div>
                  <span className="text-[#86868B] block font-medium">Platforms</span>
                  <span className="text-[#1D1D1F] font-semibold capitalize mt-0.5 block">
                    {createdResult.campaign.platforms.join(', ')}
                  </span>
                </div>
              </div>

              {createdResult.campaign.strategy?.coreInsight && (
                <div className="pt-2 border-t border-black/[0.06] text-xs">
                  <span className="text-[#86868B] block font-medium">Core Market Insight</span>
                  <p className="text-[#1D1D1F] mt-1 leading-relaxed">
                    {createdResult.campaign.strategy.coreInsight}
                  </p>
                </div>
              )}
            </div>

            {/* Generated Deliverables Narrative Preview */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-semibold text-[#86868B] uppercase tracking-wider">
                <span>Narrative Sequence Deliverables ({createdResult.assets.length})</span>
                <span className="text-emerald-600 font-medium normal-case">Zero generic "Part X" titles</span>
              </div>
              <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                {createdResult.assets.map((ast, idx) => (
                  <div key={ast.id} className="p-2.5 rounded-xl bg-[#F5F5F7] flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 truncate">
                      <span className="font-mono text-[10px] text-[#86868B]">0{idx + 1}</span>
                      {ast.strategicPurpose && (
                        <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-orange-100 text-[#FF4500] shrink-0">
                          {ast.strategicPurpose}
                        </span>
                      )}
                      <span className="font-medium text-[#1D1D1F] truncate" title={ast.title}>
                        {ast.title}
                      </span>
                    </div>
                    <span className="text-[10px] font-medium text-[#86868B] capitalize ml-2 shrink-0">
                      {ast.platform}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200/60 rounded-2xl p-4 text-xs text-[#FF4500] space-y-1">
              <span className="font-semibold block">Content Intelligence Created</span>
              <p className="text-orange-950/80">
                All {createdResult.assets.length} post concepts have been structured with hooks, captions, slides, and scripts. Media generation remains on-demand to safeguard API quotas.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <button
                onClick={handleResetAndClose}
                className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
              >
                Close
              </button>

              {onViewCampaignDetail && (
                <button
                  onClick={() => {
                    const camp = createdResult.campaign;
                    handleResetAndClose();
                    onViewCampaignDetail(camp);
                  }}
                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#1D1D1F] hover:bg-black text-white text-xs font-medium rounded-xl transition-all shadow-sm"
                >
                  <FolderKanban className="w-3.5 h-3.5" />
                  <span>View Campaign Details</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Normal Create Form */
          <>
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h2 id="create-campaign-title" className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
                  Create a campaign
                </h2>
                <p className="text-sm text-[#6E6E73] font-normal leading-relaxed">
                  Select your primary campaign goal and describe what you want to achieve. Use AI to improve clarity and structure.
                </p>
              </div>
              <button 
                onClick={onClose}
                disabled={isLoading}
                aria-label="Close campaign dialog"
                className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-xl transition-colors -mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Form Fields */}
            <div className="space-y-6">

              {/* 1. SELECTABLE GOAL CHIPS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1D1D1F] flex items-center space-x-1.5">
                    <Target className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>Primary Goal (Select one required)</span>
                  </label>
                  <span className="text-[11px] text-[#86868B]">
                    Required: 1 primary
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {GOAL_OPTIONS.map((goal) => {
                    const isPrimary = primaryGoal === goal;
                    return (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => handleSelectPrimaryGoal(goal)}
                        disabled={isLoading}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                          isPrimary
                            ? 'bg-[#1D1D1F] text-white shadow-sm ring-2 ring-[#1D1D1F]/20'
                            : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05]'
                        }`}
                      >
                        {isPrimary && <Check className="w-3 h-3 text-emerald-400" />}
                        <span>{goal}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Secondary Goals (Optional multi-select) */}
                <div className="pt-1 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-[#86868B] font-medium">
                      Secondary goals (optional):
                    </span>
                    {secondaryGoals.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSecondaryGoals([])}
                        className="text-[#FF4500] hover:underline"
                      >
                        Clear secondary
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {GOAL_OPTIONS.filter((g) => g !== primaryGoal).map((secGoal) => {
                      const isSelected = secondaryGoals.includes(secGoal);
                      return (
                        <button
                          key={secGoal}
                          type="button"
                          onClick={() => handleToggleSecondaryGoal(secGoal)}
                          disabled={isLoading}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                            isSelected
                              ? 'bg-orange-50 text-[#FF4500] border border-orange-200'
                              : 'bg-white border border-black/[0.06] text-[#86868B] hover:text-[#1D1D1F]'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}
                          {secGoal}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Virality / Reach Ambition Disclosure */}
                {showViralityNote && (
                  <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 flex items-start space-x-2 animate-in fade-in duration-200">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                    <span>
                      <strong>Reach & Sharing Ambition:</strong> Autonoma calibrates hook architecture, format dwell-time, and platform-native distribution to maximize reach and shares. Virality is an ambition of strong problem-resonance, not an algorithmic guarantee.
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Natural Language Campaign Description & AI Brief Rewriting */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1D1D1F] block">
                    What do you want to achieve?
                  </label>

                  <div className="flex items-center space-x-2">
                    {/* Undo button if a rewrite was accepted */}
                    {originalBriefSnapshot !== null && (
                      <button
                        type="button"
                        onClick={handleUndoRewrite}
                        className="inline-flex items-center space-x-1 text-xs text-[#6E6E73] hover:text-[#1D1D1F] font-medium transition-colors"
                        title="Revert to your original text prior to accepting AI rewrite"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Undo rewrite</span>
                      </button>
                    )}

                    {/* "Improve with AI" Button */}
                    <button
                      type="button"
                      onClick={handleImproveBrief}
                      disabled={isLoading || isImprovingBrief || !brief.trim()}
                      className="inline-flex items-center space-x-1.5 px-3 py-1 bg-orange-50 hover:bg-orange-100 text-[#FF4500] border border-orange-200/60 rounded-xl text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
                    >
                      {isImprovingBrief ? (
                        <div className="w-3 h-3 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>{isImprovingBrief ? 'Improving…' : 'Improve with AI'}</span>
                    </button>
                  </div>
                </div>

                {/* Textarea */}
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  disabled={isLoading}
                  rows={3}
                  placeholder={`Example only — ${GOAL_EXAMPLES[primaryGoal] || 'Describe what you want to achieve...'}`}
                  className="w-full bg-[#F5F5F7] border-0 rounded-2xl p-4 text-sm text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20 resize-none transition-all leading-relaxed"
                />

                {/* Contextual guidance prompt */}
                <p className="text-[11px] text-[#86868B] flex items-center justify-between">
                  <span>{brief.length === 0 ? 'Example shown above — enter your own campaign objective.' : 'Your campaign brief'}</span>
                  <span>{brief.length} characters</span>
                </p>

                {/* AI Error State with Retry */}
                {improveError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center justify-between gap-2 animate-in fade-in duration-200">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                      <span>{improveError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleImproveBrief}
                      className="px-2.5 py-1 bg-white border border-red-300 rounded-lg text-[11px] font-semibold text-red-800 hover:bg-red-100 transition-colors shrink-0"
                    >
                      Retry
                    </button>
                  </div>
                )}

                {/* PROPOSED REWRITE COMPARISON CARD (Shows proposed rewrite before replacing anything) */}
                {proposedRewrite && (
                  <div className="bg-orange-50/60 border border-orange-200/80 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-[#FF4500]" />
                        <span className="text-xs font-semibold text-[#1D1D1F]">
                          Proposed AI Brief Refinement
                        </span>
                        <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-100 text-[#FF4500]">
                          Preview
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleDismissRewrite}
                        className="text-[#86868B] hover:text-[#1D1D1F] p-1"
                        title="Dismiss without replacing"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Key Improvements */}
                    {proposedRewrite.keyImprovements && proposedRewrite.keyImprovements.length > 0 && (
                      <div className="space-y-1 text-xs">
                        <span className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                          Key Improvements
                        </span>
                        <ul className="space-y-0.5 list-disc list-inside text-[#1D1D1F] text-[11px]">
                          {proposedRewrite.keyImprovements.map((imp, i) => (
                            <li key={i}>{imp}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Rewritten Text (Editable or Viewable) */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-[11px] font-medium text-[#86868B] uppercase tracking-wider">
                          Proposed Text
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingRewrite(!isEditingRewrite)}
                          className="inline-flex items-center space-x-1 text-[11px] text-[#FF4500] font-medium hover:underline"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>{isEditingRewrite ? 'Finish editing' : 'Edit rewrite'}</span>
                        </button>
                      </div>

                      {isEditingRewrite ? (
                        <textarea
                          value={editedRewriteText}
                          onChange={(e) => setEditedRewriteText(e.target.value)}
                          rows={3}
                          className="w-full bg-white border border-orange-300 rounded-xl p-3 text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20"
                        />
                      ) : (
                        <div className="bg-white border border-orange-200/80 rounded-xl p-3 text-xs text-[#1D1D1F] leading-relaxed">
                          {editedRewriteText || proposedRewrite.rewrittenBrief}
                        </div>
                      )}
                    </div>

                    {/* Focused Questions for Essential Missing Details */}
                    {proposedRewrite.focusedQuestions && proposedRewrite.focusedQuestions.length > 0 && (
                      <div className="pt-2 border-t border-orange-200/60 space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-xs font-semibold text-orange-950">
                          <HelpCircle className="w-3.5 h-3.5 text-[#FF4500]" />
                          <span>Questions to consider for maximum sharpness:</span>
                        </div>
                        <ul className="space-y-1 text-[11px] text-orange-900/90 pl-5 list-disc">
                          {proposedRewrite.focusedQuestions.map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Accept, Edit & Dismiss Actions */}
                    <div className="flex items-center justify-end space-x-2 pt-2 border-t border-orange-200/60">
                      <button
                        type="button"
                        onClick={handleDismissRewrite}
                        className="px-3 py-1.5 text-xs text-[#6E6E73] hover:text-[#1D1D1F] transition-colors rounded-lg font-medium"
                      >
                        Keep Original
                      </button>

                      <button
                        type="button"
                        onClick={handleAcceptRewrite}
                        className="inline-flex items-center space-x-1.5 px-4 py-1.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept Rewrite</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Platforms (Multi-select chips) */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <label className="text-xs font-semibold text-[#1D1D1F] block">
                      Target Platforms
                    </label>
                    <span className="text-[10px] text-[#86868B] block mt-0.5">
                      Shapes native copy style, audience expectation, and format conventions (no live API connection required).
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setLetAutonomaDecidePlatforms(!letAutonomaDecidePlatforms);
                      if (!letAutonomaDecidePlatforms) {
                        setSelectedPlatforms(['instagram', 'facebook', 'linkedin']);
                        setHasCustomPlatform(false);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium shrink-0 ${
                      letAutonomaDecidePlatforms
                        ? 'bg-orange-50 text-[#FF4500]'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04]'
                    }`}
                  >
                    ✦ Let Autonoma decide
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availablePlatforms.map((plat) => {
                    const isSelected = selectedPlatforms.includes(plat.id) && !letAutonomaDecidePlatforms;
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => handleTogglePlatform(plat.id)}
                        disabled={isLoading}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-[#1D1D1F] text-white shadow-sm'
                            : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05]'
                        }`}
                      >
                        {plat.label}
                      </button>
                    );
                  })}

                  {/* Other / Custom Platform button */}
                  <button
                    type="button"
                    onClick={() => {
                      setHasCustomPlatform(!hasCustomPlatform);
                      if (letAutonomaDecidePlatforms) setLetAutonomaDecidePlatforms(false);
                    }}
                    disabled={isLoading}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      hasCustomPlatform
                        ? 'bg-[#1D1D1F] text-white shadow-sm'
                        : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05]'
                    }`}
                  >
                    + Other Platform
                  </button>
                </div>

                {/* Custom Platform free text input */}
                {hasCustomPlatform && (
                  <div className="pt-1.5 animate-in fade-in duration-150">
                    <input
                      type="text"
                      value={customPlatform}
                      onChange={(e) => setCustomPlatform(e.target.value)}
                      placeholder="e.g. Reddit, Discord, Telegram, Quora, Substack, WhatsApp Channel..."
                      className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] border border-black/[0.08] focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20"
                    />
                  </div>
                )}
              </div>

              {/* 4. Content Formats (Multi-select chips) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1D1D1F]">
                    Content Formats
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLetAutonomaDecideFormats(!letAutonomaDecideFormats);
                      if (!letAutonomaDecideFormats) {
                        setSelectedFormats(['carousel', 'reel_short', 'static_poster']);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
                      letAutonomaDecideFormats
                        ? 'bg-orange-50 text-[#FF4500]'
                        : 'text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04]'
                    }`}
                  >
                    ✦ Let Autonoma decide {letAutonomaDecideFormats && '(Active)'}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2">
                  {availableFormats.map((fmt) => {
                    const isSelected = selectedFormats.includes(fmt.id) && !letAutonomaDecideFormats;
                    return (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => handleToggleFormat(fmt.id)}
                        disabled={isLoading}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-[#1D1D1F] text-white shadow-sm'
                            : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05]'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. Campaign Duration */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#1D1D1F] block">
                  Campaign Duration
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'single' as DurationOption, label: 'Single post' },
                    { id: '3_days' as DurationOption, label: '3 days' },
                    { id: '7_days' as DurationOption, label: '7 days' },
                    { id: '30_days' as DurationOption, label: '30 days' },
                    { id: 'custom' as DurationOption, label: 'Custom' },
                  ].map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setDuration(dur.id)}
                      disabled={isLoading}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all text-center ${
                        duration === dur.id
                          ? 'bg-[#1D1D1F] text-white shadow-sm'
                          : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range Picker */}
                {duration === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div>
                      <label className="text-[11px] text-[#86868B] block mb-1">Start date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full bg-[#F5F5F7] px-3 py-2 rounded-xl text-xs text-[#1D1D1F] border-0 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#86868B] block mb-1">End date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full bg-[#F5F5F7] px-3 py-2 rounded-xl text-xs text-[#1D1D1F] border-0 focus:outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 6. Language selection */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#1D1D1F] block">
                    Language
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {languagesList.map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => setSelectedLanguages((prev) => {
                          const isSelected = prev.includes(lang);
                          if (isSelected && prev.length === 1) return prev;
                          return isSelected ? prev.filter((item) => item !== lang) : [...prev, lang];
                        })}
                        disabled={isLoading}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          selectedLanguages.includes(lang)
                            ? 'bg-[#FF4500] text-white shadow-sm'
                            : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
                        }`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>

                  {/* Other / Custom Language Free-Text Input */}
                  {selectedLanguages.includes('Other / Custom Language') && (
                    <div className="pt-1.5 animate-in fade-in duration-150">
                      <input
                        type="text"
                        value={customLanguage}
                        onChange={(e) => setCustomLanguage(e.target.value)}
                        placeholder="e.g. Konkani, Nepali, French, German, Arabic, Spanish..."
                        className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] border border-black/[0.08] focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20"
                      />
                    </div>
                  )}
                  <div className="text-[11px] text-[#6E6E73] bg-[#F5F5F7] rounded-xl px-3 py-2">
                    Selected: <strong>{selectedLanguages.filter(l => l !== 'Other / Custom Language').join(', ')}{selectedLanguages.includes('Other / Custom Language') && customLanguage.trim() ? `${selectedLanguages.length > 1 ? ', ' : ''}${customLanguage.trim()}` : ''}</strong>. Each concept will be localized separately for every selected language and platform.
                  </div>
                </div>

                {/* Language Style (Register) Selection */}
                <div className="space-y-1.5 pt-1 border-t border-black/[0.04]">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-[#86868B]">
                      Language Style (Register)
                    </label>
                    <span className="text-[10px] text-[#86868B]">
                      Tone of language phrasing
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {languageStyles.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setLanguageStyle(style)}
                        disabled={isLoading}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                          languageStyle === style
                            ? 'bg-[#1D1D1F] text-white shadow-sm'
                            : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05]'
                        }`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 7. Collapsible Advanced Options */}
              <div className="border-t border-black/[0.06] pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full py-1 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                >
                  <span>Advanced Options (Audience, CTA, Tone)</span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showAdvanced && (
                  <div className="space-y-4 pt-3 animate-in fade-in duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="text-[#86868B] font-medium block">
                          Target audience
                        </label>
                        <input
                          type="text"
                          value={targetAudience}
                          onChange={(e) => setTargetAudience(e.target.value)}
                          placeholder="e.g. SMB Founders, Retail Boutique Owners in India"
                          className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] border-0 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#86868B] font-medium block">
                          Primary CTA
                        </label>
                        <input
                          type="text"
                          value={primaryCta}
                          onChange={(e) => setPrimaryCta(e.target.value)}
                          placeholder="e.g. Comment 'STORE' for live demo"
                          className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] border-0 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#86868B] font-medium block">
                          Products / Services to emphasize
                        </label>
                        <input
                          type="text"
                          value={productsEmphasized}
                          onChange={(e) => setProductsEmphasized(e.target.value)}
                          placeholder="e.g. Apex Microcommerce 48-Hour launch"
                          className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] border-0 focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[#86868B] font-medium block">
                          Concept count override (optional)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={customAssetCount}
                          onChange={(e) => setCustomAssetCount(e.target.value ? Number(e.target.value) : '')}
                          placeholder="Auto concepts based on duration"
                          className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] border-0 focus:outline-none"
                        />
                        <p className="text-[10px] text-[#86868B]">This is the number of campaign ideas. Autonoma creates a platform-native version in every selected language for every selected platform.</p>
                      </div>

                      <div className="space-y-1 sm:col-span-2">
                        <label className="text-[#86868B] font-medium block">
                          Brand tone
                        </label>
                        <input
                          type="text"
                          value={tone}
                          onChange={(e) => setTone(e.target.value)}
                          placeholder="Authoritative, pragmatic & conversion-focused"
                          className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] border-0 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 8. Use Existing Data — Optional */}
              <div className="border-t border-black/[0.06] pt-3">
                <ExistingDataImportSection
                  campaignId={activeCampaignShellRef.current?.id}
                  onApprovedContextChange={(ctxText, ids) => {
                    setApprovedImportedContext(ctxText);
                    setApprovedImportedSourceIds(ids);
                  }}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Error Message */}
            {/* Resilient Error & Retry Banner */}
            {error && (
              <div className="bg-amber-50 text-amber-900 text-xs p-4 rounded-2xl border border-amber-200/90 flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2 font-semibold text-amber-800">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span>CAMPAIGN SHELL PERSISTED (SYNTHESIS INCOMPLETE)</span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900">
                    GENERATION FAILED
                  </span>
                </div>
                <div className="text-[11px] text-amber-800 leading-relaxed font-normal">
                  {error}
                </div>
                <p className="text-[11px] text-[#6E6E73]">
                  Your campaign shell is safely saved in the database. You can retry synthesis now using the same campaign ID without creating duplicates.
                </p>
                <div className="pt-1 flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleRetrySynthesis}
                    disabled={isLoading}
                    className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Retry Synthesis</span>
                  </button>
                  {activeCampaignShellRef.current && (
                    <button
                      type="button"
                      onClick={() => {
                        const camp = activeCampaignShellRef.current;
                        handleResetAndClose();
                        if (camp && onViewCampaignDetail) onViewCampaignDetail(camp);
                      }}
                      className="inline-flex items-center space-x-1 px-3 py-1.5 bg-white text-[#1D1D1F] border border-black/[0.08] hover:bg-black/[0.03] text-xs font-medium rounded-xl transition-all"
                    >
                      <FolderKanban className="w-3.5 h-3.5 text-[#6E6E73]" />
                      <span>View in Campaigns</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="space-y-2 pt-2 animate-in fade-in duration-200">
                <div className="flex items-center space-x-2.5 text-xs text-[#FF4500] font-medium">
                  <div className="w-3.5 h-3.5 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
                  <span>{loadingStep || 'Synthesizing campaign strategy…'}</span>
                </div>
                <p className="text-[11px] text-[#86868B]">
                  Autonoma is generating the campaign structure, format mix, and content intelligence. No media generation is invoked.
                </p>
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-black/[0.06]">
              <div className="text-[11px] text-[#86868B] hidden sm:block">
                Creates first-class Campaign entity · Preserves existing assets
              </div>

              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors rounded-xl min-h-[40px]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleCreateCampaign}
                  disabled={isLoading || !brief.trim()}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-50 min-h-[40px]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{pendingCommitResult ? 'Retry Saving Campaign' : 'Create Campaign'}</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
