import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Calendar, 
  Sparkles, 
  Layers, 
  Video, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink, 
  TrendingUp, 
  Users, 
  Lightbulb, 
  ShieldCheck, 
  Target, 
  Compass, 
  Share2, 
  Plus, 
  ChevronRight,
  Filter
} from 'lucide-react';
import { Campaign, CampaignStatus, SocialAsset, ContentFormat, Platform } from '../types/campaign';
import { getCampaignAssetMetrics } from '../services/campaignService';

interface CampaignDetailViewProps {
  campaign: Campaign;
  assets: SocialAsset[];
  onBack: () => void;
  onOpenCreateAsset: (campaignId: string) => void;
  onSelectAsset: (asset: SocialAsset) => void;
  onOpenProductionModal: (asset: SocialAsset) => void;
  onUpdateCampaignStatus: (campaignId: string, status: CampaignStatus) => void;
  onNavigateToMasterSheet: (campaignId: string) => void;
}

export const CampaignDetailView: React.FC<CampaignDetailViewProps> = ({
  campaign,
  assets,
  onBack,
  onOpenCreateAsset,
  onSelectAsset,
  onOpenProductionModal,
  onUpdateCampaignStatus,
  onNavigateToMasterSheet,
}) => {
  const [assetFilter, setAssetFilter] = useState<'all' | 'needs_media' | 'ready' | 'approved'>('all');

  // Filter assets specifically belonging to this campaign
  const campaignAssets = assets.filter((a) => a.campaignId === campaign.id);
  const metrics = getCampaignAssetMetrics(campaignAssets);

  const displayedAssets = campaignAssets.filter((a) => {
    if (assetFilter === 'needs_media') {
      return !a.productionStatus || a.productionStatus === 'NOT_GENERATED' || a.productionStatus === 'FAILED';
    }
    if (assetFilter === 'ready') {
      return a.productionStatus === 'READY';
    }
    if (assetFilter === 'approved') {
      return a.status === 'approved' || a.status === 'scheduled' || a.status === 'published';
    }
    return true;
  });

  const getFormatIcon = (format: ContentFormat) => {
    switch (format) {
      case 'reel_short':
        return <Video className="w-3.5 h-3.5 text-purple-600" />;
      case 'carousel':
        return <Layers className="w-3.5 h-3.5 text-[#FF4500]" />;
      default:
        return <ImageIcon className="w-3.5 h-3.5 text-blue-600" />;
    }
  };

  const getFormatLabel = (format: ContentFormat) => {
    switch (format) {
      case 'reel_short':
        return 'Reel';
      case 'carousel':
        return 'Carousel';
      case 'static_poster':
        return 'Poster';
      case 'infographic_flyer':
        return 'Infographic';
      default:
        return 'Post';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Navigation & Header */}
      <div className="space-y-4">
        <button
          onClick={onBack}
          className="inline-flex items-center space-x-1.5 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors -ml-1 py-1 px-2 rounded-lg hover:bg-black/[0.04]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>All Campaigns</span>
        </button>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="font-mono text-xs font-semibold text-[#86868B] bg-black/[0.04] px-2 py-0.5 rounded-md">
                {campaign.campaignCode}
              </span>

              {/* Status Switcher */}
              <select
                value={campaign.status}
                onChange={(e) => onUpdateCampaignStatus(campaign.id, e.target.value as CampaignStatus)}
                className="text-xs font-medium bg-[#F5F5F7] border-0 rounded-lg px-2.5 py-1 text-[#1D1D1F] focus:ring-2 focus:ring-[#FF4500]/20 cursor-pointer"
              >
                <option value="ACTIVE">● Active</option>
                <option value="DRAFT">○ Draft</option>
                <option value="PAUSED">⏸ Paused</option>
                <option value="COMPLETED">✓ Completed</option>
                <option value="ARCHIVED">🗄 Archived</option>
              </select>

              <span className="text-xs text-[#86868B] flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-[#86868B]" />
                {campaign.startDate} to {campaign.endDate}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F] break-words">
              {campaign.name}
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6E73] max-w-3xl leading-relaxed">
              {campaign.brief}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto self-start lg:self-auto">
            <button
              onClick={() => onNavigateToMasterSheet(campaign.id)}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-black/[0.03] border border-black/[0.08] text-xs font-medium text-[#1D1D1F] rounded-xl shadow-sm transition-all min-h-[38px]"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#6E6E73]" />
              <span>Open in Master Sheet</span>
            </button>

            <button
              onClick={() => onOpenCreateAsset(campaign.id)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl shadow-sm transition-all active:scale-95 min-h-[38px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Asset</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row (Apple Style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-2xl border border-black/[0.06] p-4 sm:p-5 space-y-1 shadow-sm">
          <span className="text-xs font-medium text-[#86868B]">Deliverables</span>
          <div className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            {metrics.total}
          </div>
          <span className="text-[11px] text-[#6E6E73]">
            {metrics.approved} approved · {metrics.ready} ready
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-5 space-y-1 shadow-sm">
          <span className="text-xs font-medium text-[#86868B]">Media Status</span>
          <div className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            {metrics.ready + metrics.approved} <span className="text-xs font-normal text-[#86868B]">/ {metrics.total}</span>
          </div>
          <span className="text-[11px] text-amber-600 font-medium">
            {metrics.needsMedia} need generation
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-5 space-y-1 shadow-sm">
          <span className="text-xs font-medium text-[#86868B]">Est. Total Reach</span>
          <div className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
            {metrics.totalReach.toLocaleString()}
          </div>
          <span className="text-[11px] text-[#6E6E73]">
            ~{metrics.totalImpressions.toLocaleString()} impressions
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-black/[0.06] p-5 space-y-1 shadow-sm">
          <span className="text-xs font-medium text-[#86868B]">Avg. Virality Index</span>
          <div className="text-2xl font-semibold tracking-tight text-[#FF4500]">
            {metrics.averageVirality}<span className="text-xs font-normal text-[#86868B]">/100</span>
          </div>
          <span className="text-[11px] text-[#6E6E73]">
            High problem-first resonance
          </span>
        </div>
      </div>

      {/* Strategic Dossier Grid */}
      {campaign.strategy && (
        <div className="bg-white rounded-3xl border border-black/[0.06] p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-black/[0.05] pb-4">
            <div className="flex items-center space-x-2.5">
              <div className="w-7 h-7 rounded-xl bg-orange-50 text-[#FF4500] flex items-center justify-center font-bold text-xs">
                <Compass className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
                Strategic Campaign Blueprint
              </h2>
            </div>
            <span className="text-xs text-[#86868B] font-medium">
              Inferred automatically by Autonoma
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Core Insight */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                Core Market Insight
              </span>
              <p className="text-xs text-[#1D1D1F] leading-relaxed bg-[#F5F5F7] p-3.5 rounded-2xl">
                {campaign.strategy.coreInsight || 'Businesses lose 60% of potential conversions due to friction in manual messaging and delayed follow-ups.'}
              </p>
            </div>

            {/* Value Proposition */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Value Proposition
              </span>
              <p className="text-xs text-[#1D1D1F] leading-relaxed bg-[#F5F5F7] p-3.5 rounded-2xl">
                {campaign.strategy.valueProposition || 'Turn WhatsApp chats into an automated commerce engine with instant UPI checkout and zero spreadsheet chaos.'}
              </p>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                Target Audience & Personas
              </span>
              <div className="bg-[#F5F5F7] p-3.5 rounded-2xl space-y-2">
                <p className="text-xs text-[#1D1D1F]">
                  {campaign.strategy.targetAudience}
                </p>
                {campaign.strategy.buyerPersonas && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {campaign.strategy.buyerPersonas.map((bp, idx) => (
                      <span key={idx} className="text-[10px] bg-white px-2 py-0.5 rounded-md text-[#6E6E73] font-medium border border-black/[0.04]">
                        {bp}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Pillars */}
          {campaign.strategy.contentPillars && campaign.strategy.contentPillars.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-black/[0.04]">
              <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider block">
                Content Pillars & Narrative Sequence
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {campaign.strategy.contentPillars.map((pillar, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-[#F5F5F7] border border-black/[0.02] space-y-1">
                    <span className="text-[10px] font-mono font-semibold text-[#FF4500]">
                      PILLAR 0{idx + 1}
                    </span>
                    <p className="text-xs font-medium text-[#1D1D1F] leading-snug">
                      {pillar}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Posting Cadence */}
          {campaign.strategy.recommendedPostingSchedule && (
            <div className="flex items-center space-x-2 text-xs text-[#6E6E73] pt-2">
              <Clock className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>Recommended Posting Cadence: <strong className="text-[#1D1D1F]">{campaign.strategy.recommendedPostingSchedule}</strong></span>
            </div>
          )}
        </div>
      )}

      {/* Campaign Assets Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
              Campaign Assets ({campaignAssets.length})
            </h2>
            <p className="text-xs text-[#6E6E73]">
              All content deliverables assigned to this campaign
            </p>
          </div>

          {/* Filter pills */}
          <div className="flex items-center space-x-1.5 self-start sm:self-auto">
            {(['all', 'needs_media', 'ready', 'approved'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setAssetFilter(filter)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  assetFilter === filter
                    ? 'bg-[#1D1D1F] text-white shadow-sm'
                    : 'bg-white border border-black/[0.06] text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                {filter === 'all' && `All (${campaignAssets.length})`}
                {filter === 'needs_media' && `Needs Media (${metrics.needsMedia})`}
                {filter === 'ready' && `Ready (${metrics.ready})`}
                {filter === 'approved' && `Approved (${metrics.approved})`}
              </button>
            ))}
          </div>
        </div>

        {/* Assets Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedAssets.map((asset) => {
            const hasMedia = asset.productionStatus === 'READY' || asset.productionStatus === 'APPROVED';

            return (
              <div
                key={asset.id}
                className="bg-white rounded-2xl border border-black/[0.06] hover:border-black/[0.12] p-5 space-y-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {/* Top: Format & Platform & Strategic Purpose */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="inline-flex items-center space-x-1.5 font-medium text-[#1D1D1F]">
                        {getFormatIcon(asset.format)}
                        <span>{getFormatLabel(asset.format)}</span>
                      </span>

                      <span className="font-mono text-[10px] text-[#86868B]">
                        {asset.assetCode}
                      </span>
                    </div>

                    {asset.strategicPurpose && (
                      <div className="flex items-center space-x-1.5">
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-orange-50 text-[#FF4500] border border-orange-100">
                          {asset.strategicPurpose}
                        </span>
                        {asset.angle && (
                          <span className="text-[10px] text-[#86868B] truncate max-w-[150px]" title={asset.angle}>
                            · {asset.angle}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Title & Hook */}
                  <div className="space-y-1">
                    <h3 
                      onClick={() => onSelectAsset(asset)}
                      className="text-sm font-semibold text-[#1D1D1F] hover:text-[#FF4500] cursor-pointer line-clamp-2 leading-snug"
                    >
                      {asset.title}
                    </h3>
                    <p className="text-xs text-[#6E6E73] line-clamp-2 leading-relaxed">
                      "{asset.hook}"
                    </p>
                  </div>

                  {/* Realistic Organic Reach & Virality */}
                  <div className="flex items-center space-x-2 text-[11px] text-[#86868B] pt-0.5">
                    <span>Est. Reach: <strong className="text-[#1D1D1F] font-medium">{asset.targetReach ? asset.targetReach.toLocaleString() : '1,850'}</strong></span>
                    <span>·</span>
                    <span>Resonance: <strong className="text-[#FF4500] font-medium">{asset.viralityScore}/100</strong></span>
                  </div>
                </div>

                {/* Bottom: Status & Quick Action */}
                <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between">
                  <div>
                    {hasMedia ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700">
                        Media ready
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700">
                        Needs media
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onOpenProductionModal(asset)}
                      className="px-2.5 py-1 text-xs font-medium text-[#FF4500] hover:bg-orange-50 rounded-lg transition-colors"
                    >
                      {hasMedia ? 'View Media' : 'Generate'}
                    </button>
                    <button
                      onClick={() => onSelectAsset(asset)}
                      className="p-1 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-lg transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
