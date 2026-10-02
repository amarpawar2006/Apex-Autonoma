import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  Layers,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowUpRight,
  Check,
  Share2,
  Copy,
  Info,
  Send
} from 'lucide-react';
import { SocialAsset, ContentFormat, Campaign, PostStatus } from '../types/campaign';
import { WhatsAppPostingPackModal } from './WhatsAppPostingPackModal';

interface TodaysProductionViewProps {
  assets: SocialAsset[];
  campaigns?: Campaign[];
  companyName?: string;
  defaultWhatsAppRecipient?: string;
  activeCampaignFilter?: string;
  onOpenProductionModal: (asset: SocialAsset) => void;
  onOpenAiGenerator: () => void;
  onUpdateStatus?: (assetId: string, newStatus: PostStatus) => void;
}

export const TodaysProductionView: React.FC<TodaysProductionViewProps> = ({
  assets = [],
  campaigns = [],
  companyName = 'Apex Engineering Pune',
  defaultWhatsAppRecipient = '',
  activeCampaignFilter = 'all',
  onOpenProductionModal,
  onOpenAiGenerator,
  onUpdateStatus
}) => {
  // Today's date in YYYY-MM-DD format
  const todayStr = new Date().toISOString().split('T')[0];

  // Helper to validate real calendar date strings (rejects 1899 and invalid timestamps)
  const isValidDateStr = (dateStr?: string): boolean => {
    if (!dateStr || typeof dateStr !== 'string') return false;
    const clean = dateStr.trim();
    if (clean.startsWith('1899') || clean.toLowerCase().includes('invalid')) return false;
    const datePart = clean.split('T')[0];
    const parts = datePart.split('-').map(Number);
    if (parts.length === 3 && parts[0] > 1970 && parts[1] >= 1 && parts[1] <= 12 && parts[2] >= 1 && parts[2] <= 31) {
      return true;
    }
    const d = new Date(clean);
    return !isNaN(d.getTime()) && d.getFullYear() > 1970;
  };

  // Available unique dates in the asset catalog (excluding 1899 and invalid dates)
  const validDates = Array.from(
    new Set(
      assets
        .map((a) => a.targetDate)
        .filter((d): d is string => isValidDateStr(d))
        .map((d) => d.split('T')[0])
    )
  ).sort();

  const availableDates = validDates.length > 0 ? validDates : [todayStr];

  // Active selected production date (defaults to today if present, or earliest valid available)
  const [selectedDate, setSelectedDate] = useState<string>(
    availableDates.includes(todayStr) ? todayStr : availableDates[0] || todayStr
  );

  // WhatsApp Posting Pack Modal State
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [whatsAppInitialAssetId, setWhatsAppInitialAssetId] = useState<string | undefined>(undefined);
  const [copiedAllHeader, setCopiedAllHeader] = useState<boolean>(false);

  // Filter assets by selected production date and active campaign filter
  const todaysAssets = (activeCampaignFilter !== 'all'
    ? assets.filter((a) => a.campaignId === activeCampaignFilter)
    : assets
  ).filter((a) => {
    if (!a.targetDate) return selectedDate === todayStr;
    const assetDatePart = a.targetDate.split('T')[0];
    if (assetDatePart.startsWith('1899')) return selectedDate === todayStr;
    return assetDatePart === selectedDate;
  });

  // Compute counts
  const readyCount = todaysAssets.filter(
    (a) => a.productionStatus === 'READY' || a.productionStatus === 'APPROVED'
  ).length;
  const needsMediaCount = todaysAssets.filter(
    (a) => !a.productionStatus || a.productionStatus === 'NOT_GENERATED' || a.productionStatus === 'FAILED'
  ).length;
  const publishedCount = todaysAssets.filter((a) => a.status === 'published').length;

  // Format greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning.';
    if (hour < 18) return 'Good afternoon.';
    return 'Good evening.';
  };

  // Format selected date nicely (e.g., Monday, 28 September)
  const formatFriendlyDate = (dateStr?: string) => {
    if (!dateStr || typeof dateStr !== 'string') return 'Today';
    const clean = dateStr.trim();
    if (clean.startsWith('1899') || clean.toLowerCase().includes('invalid')) {
      if (clean.includes('T')) {
        const timePart = clean.split('T')[1]?.slice(0, 5);
        if (timePart) return `Scheduled for ${timePart} IST`;
      }
      return 'Today';
    }

    try {
      const datePart = clean.split('T')[0];
      const parts = datePart.split('-').map(Number);
      if (parts.length === 3 && parts[0] > 1970 && parts[1] >= 1 && parts[1] <= 12 && parts[2] >= 1 && parts[2] <= 31) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long'
          });
        }
      }
      const parsed = new Date(clean);
      if (!isNaN(parsed.getTime()) && parsed.getFullYear() > 1970) {
        return parsed.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        });
      }
      return 'Today';
    } catch {
      return 'Today';
    }
  };

  // Helper to cleanly format post times (stripping accidental 1899 dates if only time was entered)
  const formatPostTime = (timeStr?: string): string => {
    if (!timeStr) return '11:30 AM IST';
    if (timeStr.startsWith('1899') || timeStr.includes('T')) {
      const timeMatch = timeStr.match(/(\d{1,2}:\d{2}(?:\s*[AaPp][Mm])?)/);
      if (timeMatch) return `${timeMatch[1]} IST`;
      if (timeStr.includes('T')) {
        const t = timeStr.split('T')[1]?.slice(0, 5);
        if (t) return `${t} IST`;
      }
      return '11:30 AM IST';
    }
    return timeStr;
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

  const getFormatIcon = (format: ContentFormat) => {
    switch (format) {
      case 'carousel':
        return <Layers className="w-4 h-4 text-[#FF4500]" />;
      case 'reel_short':
        return <Video className="w-4 h-4 text-purple-600" />;
      default:
        return <ImageIcon className="w-4 h-4 text-blue-600" />;
    }
  };

  const getPrimaryButtonText = (asset: SocialAsset) => {
    if (asset.productionStatus === 'APPROVED') {
      return 'Ready to post';
    }
    if (asset.productionStatus === 'READY') {
      return 'Review media';
    }
    if (asset.productionStatus === 'GENERATING') {
      return 'Generating…';
    }
    switch (asset.format) {
      case 'reel_short':
        return 'Generate video';
      case 'carousel':
        return 'Generate carousel';
      default:
        return 'Generate image';
    }
  };

  const getMediaStatusLabel = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'Approved', color: 'text-emerald-600 font-medium' };
      case 'READY':
        return { label: 'Ready for review', color: 'text-blue-600 font-medium' };
      case 'GENERATING':
        return { label: 'Generating…', color: 'text-amber-600 font-medium' };
      case 'FAILED':
        return { label: 'Needs retry', color: 'text-red-600 font-medium' };
      default:
        return { label: 'Not generated', color: 'text-[#86868B]' };
    }
  };

  // Open WhatsApp modal for all posts or a single post
  const handleOpenWhatsAppModal = (assetId?: string) => {
    setWhatsAppInitialAssetId(assetId);
    setIsWhatsAppModalOpen(true);
  };

  // Quick 1-click "Copy all posting details" from the main page
  const handleCopyAllPostingDetails = async () => {
    if (todaysAssets.length === 0) return;

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://apex-autonoma.ai.studio';
      const todayPageUrl = `${origin}/?tab=todays_production&date=${selectedDate}`;

      const header = 
        `📦 *AUTONOMA DAILY POSTING PACK*\n` +
        `🏢 *Workspace:* ${companyName}\n` +
        `📅 *Date:* ${formatFriendlyDate(selectedDate)}\n` +
        `📊 *Total Deliverables:* ${todaysAssets.length} post${todaysAssets.length > 1 ? 's' : ''}\n` +
        `🔗 *Today Production Hub:* ${todayPageUrl}\n` +
        `ℹ️ *Note:* Media download links require active workspace access.\n` +
        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

      const postsText = todaysAssets.map((asset, idx) => {
        const isApproved = asset.status === 'approved' || asset.status === 'published' || asset.productionStatus === 'APPROVED';
        const approvalBadge = isApproved ? 'Approved ✓' : 'Draft / In Review';
        const creativeBadge = asset.productionStatus === 'APPROVED'
          ? 'Approved Media ✓'
          : asset.productionStatus === 'READY'
          ? 'Media Ready for Review'
          : 'Not Generated';

        const campName = asset.campaignName || campaigns.find(c => c.id === asset.campaignId)?.name || 'Autonoma Campaign';

        let p = 
          `📌 *POST ${idx + 1} OF ${todaysAssets.length}*\n` +
          `🆔 *Code:* ${asset.assetCode || asset.id}\n` +
          `📋 *Campaign:* ${campName}\n` +
          `📱 *Platform:* ${asset.platform.toUpperCase()} · *Format:* ${asset.format.replace('_', ' ').toUpperCase()}\n` +
          `⏰ *Planned Posting Time:* ${formatPostTime(asset.postTimeIST)}\n` +
          `🚦 *Approval Status:* ${approvalBadge}\n` +
          `🎨 *Creative Status:* ${creativeBadge}\n\n` +
          `📝 *TITLE / HOOK:*\n${asset.title}\n` +
          (asset.hook ? `"${asset.hook}"\n\n` : `\n`) +
          `✍️ *CAPTION:*\n${asset.caption || '(No caption provided)'}\n\n`;

        if (asset.hashtags && asset.hashtags.length > 0) {
          p += `🏷️ *HASHTAGS:*\n${asset.hashtags.map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}\n\n`;
        }
        if (asset.callToAction) {
          p += `🎯 *CALL TO ACTION:*\n${asset.callToAction}\n\n`;
        }
        p += `🌐 *DESTINATION URL:*\nhttps://apex-engineering.co.in\n\n`;

        if (asset.posterVisualPrompt) {
          p += `🎬 *Visual Prompt:* ${asset.posterVisualPrompt}\n\n`;
        }
        if (asset.videoGenerationPrompt) {
          p += `🎬 *Video Prompt:* ${asset.videoGenerationPrompt}\n\n`;
        }

        if (asset.generatedImageUrl) {
          p += `🖼️ *Creative Download:* ${asset.generatedImageUrl} (Workspace access required)\n`;
        } else if (asset.generatedVideoUrl) {
          p += `🎥 *Creative Download:* ${asset.generatedVideoUrl} (Workspace access required)\n`;
        } else {
          p += `⚠️ Creative media not generated yet.\n`;
        }

        p += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
        return p;
      }).join('\n\n');

      const fullText = header + postsText;
      await navigator.clipboard.writeText(fullText);
      setCopiedAllHeader(true);
      setTimeout(() => setCopiedAllHeader(false), 2400);
    } catch (e) {
      console.warn('Copy posting details failed:', e);
    }
  };

  return (
    <div className="space-y-8 pb-20 max-w-5xl mx-auto">
      {/* Top Editorial Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pt-2">
        <div className="space-y-1">
          <p className="text-sm font-medium text-[#86868B] tracking-normal">
            {getGreeting()}
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#1D1D1F]">
            Today's Production
          </h1>
          <p className="text-base text-[#6E6E73] font-normal pt-0.5">
            {formatFriendlyDate(selectedDate)}
          </p>
        </div>

        {/* Date Selector Pill */}
        <div className="flex items-center gap-2 self-start md:self-end">
          <div className="flex items-center space-x-2 bg-white px-3.5 py-2 rounded-xl border border-black/[0.06] shadow-sm text-xs text-[#1D1D1F]">
            <CalendarIcon className="w-3.5 h-3.5 text-[#86868B]" />
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent font-medium focus:outline-none cursor-pointer pr-1"
            >
              {availableDates.map((d) => (
                <option key={d} value={d}>
                  {d === todayStr ? `Today (${formatFriendlyDate(d)})` : formatFriendlyDate(d)}
                </option>
              ))}
            </select>
          </div>

          {availableDates.includes(todayStr) && selectedDate !== todayStr && (
            <button
              onClick={() => setSelectedDate(todayStr)}
              className="px-3 py-2 text-xs font-medium text-[#FF4500] bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors"
            >
              Jump to today
            </button>
          )}
        </div>
      </div>

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1">
          <span className="text-xs font-medium text-[#86868B]">Scheduled today</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-semibold text-[#1D1D1F]">
              {todaysAssets.length}
            </span>
            <span className="text-xs text-[#86868B]">
              {todaysAssets.length === 1 ? 'post' : 'posts'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1">
          <span className="text-xs font-medium text-[#86868B]">Production ready</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-semibold text-emerald-600">
              {readyCount}
            </span>
            <span className="text-xs text-[#86868B]">ready</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1">
          <span className="text-xs font-medium text-[#86868B]">Awaiting media</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-semibold text-orange-600">
              {needsMediaCount}
            </span>
            <span className="text-xs text-[#86868B]">needs media</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1">
          <span className="text-xs font-medium text-[#86868B]">Marked as posted</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-semibold text-purple-600">
              {publishedCount}
            </span>
            <span className="text-xs text-[#86868B]">posted</span>
          </div>
        </div>
      </div>

      {/* Manual WhatsApp Sharing & Posting Pack Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-[#1D1D1F]">
                Manual WhatsApp Distribution
              </h3>
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Ready to Send
              </span>
            </div>
            <p className="text-xs text-[#6E6E73] mt-0.5">
              Prepares complete post text, hashtags, download links, and prompts for your team on WhatsApp.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Copy all posting details */}
          <button
            type="button"
            onClick={handleCopyAllPostingDetails}
            disabled={todaysAssets.length === 0}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-[#F5F5F7] hover:bg-black/[0.05] text-[#1D1D1F] text-xs font-medium rounded-xl transition-colors disabled:opacity-40"
            title="Copy complete plain text posting pack for today"
          >
            {copiedAllHeader ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-600 font-semibold">Posting Details Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#86868B]" />
                <span>Copy all posting details</span>
              </>
            )}
          </button>

          {/* Share today's posts to WhatsApp */}
          <button
            type="button"
            onClick={() => handleOpenWhatsAppModal()}
            disabled={todaysAssets.length === 0}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-40"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share today's posts ({todaysAssets.length})</span>
          </button>
        </div>
      </div>

      {/* Main Production Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
            Today's Scheduled Posts ({todaysAssets.length})
          </h2>
          <span className="text-xs text-[#86868B]">
            Manual WhatsApp sharing does not auto-post · Use "Mark as posted" separately
          </span>
        </div>

        {todaysAssets.length === 0 ? (
          /* Useful No-Posts-Today State */
          <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-black/[0.06] shadow-sm space-y-4 animate-in fade-in duration-200">
            <div className="w-14 h-14 bg-black/[0.03] rounded-3xl flex items-center justify-center mx-auto text-[#86868B]">
              <CalendarIcon className="w-7 h-7" />
            </div>
            <div className="space-y-1.5 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-[#1D1D1F]">
                No posts scheduled for {formatFriendlyDate(selectedDate)}
              </h3>
              <p className="text-xs text-[#6E6E73] leading-relaxed">
                There are no campaign deliverables targeted for this calendar date. You can generate a new campaign with AI, or jump to scheduled dates with active assets.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              {availableDates.length > 0 && selectedDate !== availableDates[0] && (
                <button
                  onClick={() => setSelectedDate(availableDates[0])}
                  className="px-4 py-2 bg-[#F5F5F7] hover:bg-black/[0.05] text-[#1D1D1F] text-xs font-medium rounded-xl transition-colors"
                >
                  View earliest scheduled date ({formatFriendlyDate(availableDates[0])})
                </button>
              )}

              {availableDates.includes(todayStr) && selectedDate !== todayStr && (
                <button
                  onClick={() => setSelectedDate(todayStr)}
                  className="px-4 py-2 bg-orange-50 hover:bg-orange-100 text-[#FF4500] text-xs font-medium rounded-xl transition-colors"
                >
                  Jump to today
                </button>
              )}

              <button
                onClick={onOpenAiGenerator}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl transition-all shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create campaign for today</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {todaysAssets.map((asset) => {
              const mediaStatus = getMediaStatusLabel(asset.productionStatus);
              const isApproved = asset.productionStatus === 'APPROVED' || asset.status === 'approved' || asset.status === 'published';
              const isReady = asset.productionStatus === 'READY';
              const isGenerating = asset.productionStatus === 'GENERATING';
              const isPublished = asset.status === 'published';

              return (
                <div
                  key={asset.id}
                  onClick={() => onOpenProductionModal(asset)}
                  className="group bg-white rounded-2xl p-4 sm:p-7 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 cursor-pointer space-y-4 sm:space-y-5"
                >
                  {/* Top Bar: Platform & Scheduled Time */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="capitalize font-semibold text-[#1D1D1F] flex items-center space-x-1.5">
                        {getFormatIcon(asset.format)}
                        <span>{asset.platform}</span>
                      </span>
                      {asset.secondaryPlatforms && asset.secondaryPlatforms.length > 0 && (
                        <span className="text-[#86868B] text-[11px]">
                          +{asset.secondaryPlatforms.length} cross-post
                        </span>
                      )}
                      {isPublished && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                          Marked as Posted
                        </span>
                      )}
                    </div>
                    <span className="text-[#6E6E73] font-medium text-xs">
                      {formatPostTime(asset.postTimeIST)}
                    </span>
                  </div>

                  {/* Middle: Headline Title & Metadata */}
                  <div className="space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-semibold text-[#1D1D1F] tracking-tight leading-snug group-hover:text-[#FF4500] transition-colors break-words">
                      {asset.title}
                    </h3>
                    <p className="text-xs text-[#86868B] flex flex-wrap items-center gap-2 font-normal">
                      <span>{getFormatLabel(asset.format)}</span>
                      <span>·</span>
                      <span className="font-mono text-[11px] text-[#6E6E73]">{asset.assetCode}</span>
                      {asset.hook && (
                        <>
                          <span>·</span>
                          <span className="line-clamp-1 italic text-[#6E6E73]">
                            "{asset.hook}"
                          </span>
                        </>
                      )}
                    </p>
                  </div>

                  {/* Bottom: Hierarchy Matrix & Primary CTA */}
                  <div className="pt-2 border-t border-black/[0.04] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    {/* Status Matrix */}
                    <div className="grid grid-cols-3 gap-2 sm:gap-8 text-xs">
                      <div>
                        <span className="block text-[#86868B] text-[11px]">Content</span>
                        <span className="font-medium text-emerald-600 flex items-center space-x-1 mt-0.5">
                          <span>Ready</span>
                          <Check className="w-3 h-3" />
                        </span>
                      </div>

                      <div>
                        <span className="block text-[#86868B] text-[11px]">Media</span>
                        <span className={`block mt-0.5 ${mediaStatus.color}`}>
                          {mediaStatus.label}
                        </span>
                      </div>

                      <div>
                        <span className="block text-[#86868B] text-[11px]">Approval</span>
                        <span className={`block mt-0.5 font-medium ${isApproved ? 'text-emerald-600' : 'text-[#86868B]'}`}>
                          {isApproved ? 'Approved ✓' : 'Waiting'}
                        </span>
                      </div>
                    </div>

                    {/* Post Actions: Share this post, Mark as posted, and Primary media review */}
                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end" onClick={(e) => e.stopPropagation()}>
                      {/* "Share this post" to WhatsApp */}
                      <button
                        type="button"
                        onClick={() => handleOpenWhatsAppModal(asset.id)}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/60 rounded-xl text-xs font-medium transition-colors shadow-2xs"
                        title="Share this specific post to WhatsApp"
                      >
                        <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Share this post</span>
                      </button>

                      {/* Explicit "Mark as posted" button */}
                      {onUpdateStatus && (
                        <button
                          type="button"
                          onClick={() => onUpdateStatus(asset.id, isPublished ? 'approved' : 'published')}
                          className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors border ${
                            isPublished
                              ? 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100'
                              : 'bg-white hover:bg-black/[0.04] text-[#6E6E73] border-black/[0.08]'
                          }`}
                          title="Keep 'Mark as posted' separate from opening WhatsApp"
                        >
                          {isPublished ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
                              <span>Marked posted</span>
                            </>
                          ) : (
                            <span>Mark as posted</span>
                          )}
                        </button>
                      )}

                      {/* Primary Media Button */}
                      <button
                        onClick={() => onOpenProductionModal(asset)}
                        disabled={isGenerating}
                        className={`justify-center inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-sm active:scale-95 ${
                          isApproved
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : isReady
                            ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                            : 'bg-[#FF4500] hover:bg-[#EA3E00] text-white'
                        }`}
                      >
                        {isApproved ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : isReady ? (
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5" />
                        )}
                        <span>{getPrimaryButtonText(asset)}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* WhatsApp Posting Pack Modal */}
      {isWhatsAppModalOpen && (
        <WhatsAppPostingPackModal
          isOpen={isWhatsAppModalOpen}
          onClose={() => {
            setIsWhatsAppModalOpen(false);
            setWhatsAppInitialAssetId(undefined);
          }}
          scope="today"
          assets={assets}
          selectedDate={selectedDate}
          campaigns={campaigns}
          companyName={companyName}
          defaultRecipientNumber={defaultWhatsAppRecipient}
          activeCampaignFilter={activeCampaignFilter}
          initialSelectedAssetId={whatsAppInitialAssetId}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  );
};
