import React, { useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';
import { Platform, ContentFormat, Campaign, SocialAsset } from '../types/campaign';
import { createAutonomaCampaign } from '../services/campaignService';
import { autonomaDataService } from '../services/autonomaDataService';

interface AiCampaignGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCampaignCreated: (result: { campaign: Campaign; assets: SocialAsset[] }) => void;
  onViewCampaignDetail?: (campaign: Campaign) => void;
}

export const AiCampaignGeneratorModal: React.FC<AiCampaignGeneratorModalProps> = ({
  isOpen,
  onClose,
  onCampaignCreated,
  onViewCampaignDetail,
}) => {
  // Primary field: Natural Language Business Objective
  const [brief, setBrief] = useState<string>(
    'Promote Apex Microcommerce to small Indian businesses currently taking orders on WhatsApp. Focus on affordability, simplicity and eliminating manual order management.'
  );

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
  const [language, setLanguage] = useState<string>('English');

  // Advanced Options (collapsible)
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [targetAudience, setTargetAudience] = useState<string>('');
  const [primaryCta, setPrimaryCta] = useState<string>('');
  const [productsEmphasized, setProductsEmphasized] = useState<string>('');
  const [customAssetCount, setCustomAssetCount] = useState<number | ''>('');
  const [postingFrequency, setPostingFrequency] = useState<string>('Daily at 11:30 AM IST');
  const [tone, setTone] = useState<string>('Authoritative, pragmatic & conversion-focused');

  // Loading & Result States
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{ campaign: Campaign; assets: SocialAsset[] } | null>(null);
  const [pendingCommitResult, setPendingCommitResult] = useState<{ campaign: Campaign; assets: SocialAsset[] } | null>(null);

  if (!isOpen) return null;

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

  const handleCreateCampaign = async () => {
    if (!brief.trim()) return;

    setIsLoading(true);
    setError(null);

    const step1 = setTimeout(() => {
      setLoadingStep('Synthesizing content pillars, format mix & calibrated narrative sequence…');
    }, 1500);

    const step2 = setTimeout(() => {
      setLoadingStep('Structuring content deliverables (ZERO image/video calls)…');
    }, 3000);

    try {
      // 1. FIRST: Synthesize campaign intelligence via Gemini (or reuse pending if retrying commit)
      let result = pendingCommitResult;
      if (!result) {
        setLoadingStep('Analyzing business objective & market friction…');
        result = await createAutonomaCampaign({
          brief: brief.trim(),
          platforms: selectedPlatforms,
          autoPlatforms: letAutonomaDecidePlatforms,
          formats: selectedFormats,
          autoFormats: letAutonomaDecideFormats,
          duration,
          startDate: duration === 'custom' ? customStartDate : undefined,
          endDate: duration === 'custom' ? customEndDate : undefined,
          languages: [language],
          advancedOptions: {
            targetAudience: targetAudience.trim() || undefined,
            primaryCta: primaryCta.trim() || undefined,
            productsEmphasized: productsEmphasized.trim() || undefined,
            assetCount: typeof customAssetCount === 'number' && customAssetCount > 0 ? customAssetCount : undefined,
            postingFrequency: postingFrequency.trim() || undefined,
            tone: tone.trim() || undefined,
          }
        });
        setPendingCommitResult(result);
      }

      // 2. SAVING CAMPAIGN... Atomic write to authoritative server database & Google Sheets write-through
      setLoadingStep('SAVING CAMPAIGN... Committing campaign and deliverables to database and Google Sheets…');
      const commitRes = await autonomaDataService.commitCampaign(result.campaign, result.assets);

      // 3. ONLY AFTER BOTH SUCCEED: Update parent React state, clear pending cache, and show CAMPAIGN SAVED
      setPendingCommitResult(null);
      const persistedResult = {
        campaign: commitRes.campaign,
        assets: commitRes.assets
      };

      onCampaignCreated(persistedResult);
      setCreatedResult(persistedResult);
    } catch (err: any) {
      console.error('[Campaign Director] Campaign creation and persistence failed:', err);
      setError(err?.message || 'Campaign could not be saved to the operational database and Google Sheets.');
    } finally {
      clearTimeout(step1);
      clearTimeout(step2);
      setIsLoading(false);
      setLoadingStep('');
    }
  };

  const handleResetAndClose = () => {
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
    'Marathi',
    'Hindi',
    'Marathi + English',
    'Hindi + English',
    'Auto'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-2xl w-full p-4 sm:p-7 space-y-6 max-h-[92vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        
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
                  <span className="text-[#86868B] block font-medium">Platforms</span>
                  <span className="text-[#1D1D1F] font-semibold capitalize mt-0.5 block">
                    {createdResult.campaign.platforms.join(', ')}
                  </span>
                </div>
                <div>
                  <span className="text-[#86868B] block font-medium">Format Strategy</span>
                  <span className="text-[#1D1D1F] font-semibold capitalize mt-0.5 block">
                    {createdResult.campaign.formats.map(f => f.replace('_', ' ')).join(', ')}
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
                <h2 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
                  Create a campaign
                </h2>
                <p className="text-sm text-[#6E6E73] font-normal leading-relaxed">
                  Tell Autonoma what you want to achieve. We'll build the social strategy, format mix and production plan.
                </p>
              </div>
              <button 
                onClick={onClose}
                disabled={isLoading}
                className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-xl transition-colors -mr-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Form Fields */}
            <div className="space-y-6">
              {/* Primary field: Natural Language Business Objective */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#1D1D1F] block">
                  What do you want to achieve?
                </label>
                <textarea
                  value={brief}
                  onChange={(e) => setBrief(e.target.value)}
                  disabled={isLoading}
                  rows={3}
                  placeholder="Promote Apex Microcommerce to small Indian businesses currently taking orders on WhatsApp. Focus on affordability, simplicity and eliminating manual order management."
                  className="w-full bg-[#F5F5F7] border-0 rounded-2xl p-4 text-sm text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20 resize-none transition-all leading-relaxed"
                />
              </div>

              {/* Platforms (Multi-select chips) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#1D1D1F]">
                    Platforms
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setLetAutonomaDecidePlatforms(!letAutonomaDecidePlatforms);
                      if (!letAutonomaDecidePlatforms) {
                        setSelectedPlatforms(['instagram', 'facebook', 'linkedin']);
                      }
                    }}
                    className={`text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${
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
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          isSelected
                            ? 'bg-[#1D1D1F] text-white shadow-sm'
                            : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05]'
                        }`}
                      >
                        {plat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content Formats (Multi-select chips) */}
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

              {/* Campaign Duration */}
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

              {/* Language selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#1D1D1F] block">
                  Language
                </label>
                <div className="flex flex-wrap gap-2">
                  {languagesList.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setLanguage(lang)}
                      disabled={isLoading}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                        language === lang
                          ? 'bg-[#FF4500] text-white shadow-sm'
                          : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F]'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Collapsible Advanced Options */}
              <div className="border-t border-black/[0.06] pt-3">
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center justify-between w-full py-1 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                >
                  <span>Advanced Options</span>
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
                          Asset count override (optional)
                        </label>
                        <input
                          type="number"
                          min={1}
                          max={8}
                          value={customAssetCount}
                          onChange={(e) => setCustomAssetCount(e.target.value ? Number(e.target.value) : '')}
                          placeholder="Auto (1–6 based on duration)"
                          className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] border-0 focus:outline-none"
                        />
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
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-700 text-xs p-3.5 rounded-2xl border border-red-200 flex flex-col space-y-1">
                <div className="flex items-center space-x-2 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-red-600" />
                  <span>CAMPAIGN NOT SAVED</span>
                </div>
                <div className="text-[11px] text-red-600 pl-4">{error}</div>
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
