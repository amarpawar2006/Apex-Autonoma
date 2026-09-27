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
  Check
} from 'lucide-react';
import { SocialAsset, ContentFormat } from '../types/campaign';

interface TodaysProductionViewProps {
  assets: SocialAsset[];
  onOpenProductionModal: (asset: SocialAsset) => void;
  onOpenAiGenerator: () => void;
}

export const TodaysProductionView: React.FC<TodaysProductionViewProps> = ({
  assets,
  onOpenProductionModal,
  onOpenAiGenerator
}) => {
  // Today's date in YYYY-MM-DD format
  const todayStr = new Date().toISOString().split('T')[0];

  // Available unique dates in the asset catalog
  const availableDates = Array.from(new Set(assets.map((a) => a.targetDate))).sort();

  // Active selected production date (defaults to today if present, or earliest available)
  const [selectedDate, setSelectedDate] = useState<string>(
    availableDates.includes(todayStr) ? todayStr : availableDates[0] || todayStr
  );

  // Filter assets by selected production date
  const todaysAssets = assets.filter((a) => a.targetDate === selectedDate);

  // Compute counts
  const readyCount = todaysAssets.filter(
    (a) => a.productionStatus === 'READY' || a.productionStatus === 'APPROVED'
  ).length;
  const needsMediaCount = todaysAssets.filter(
    (a) => !a.productionStatus || a.productionStatus === 'NOT_GENERATED' || a.productionStatus === 'FAILED'
  ).length;

  // Format greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning.';
    if (hour < 18) return 'Good afternoon.';
    return 'Good evening.';
  };

  // Format selected date nicely (e.g., Saturday, 27 September)
  const formatFriendlyDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      });
    } catch {
      return dateStr;
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <span className="text-xs text-[#86868B]">
              {readyCount === 1 ? 'ready' : 'ready'}
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-black/[0.06] shadow-[0_2px_8px_rgba(0,0,0,0.02)] space-y-1">
          <span className="text-xs font-medium text-[#86868B]">Awaiting generation</span>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-semibold text-orange-600">
              {needsMediaCount}
            </span>
            <span className="text-xs text-[#86868B]">needs media</span>
          </div>
        </div>
      </div>

      {/* Main Production Feed */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold text-[#86868B] uppercase tracking-wider">
            Today
          </h2>
          <span className="text-xs text-[#86868B]">
            Explicit asset trigger · Cost protected
          </span>
        </div>

        {todaysAssets.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-black/[0.06] shadow-sm space-y-4">
            <div className="w-12 h-12 bg-black/[0.03] rounded-2xl flex items-center justify-center mx-auto text-[#86868B]">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#1D1D1F]">
                No posts scheduled for this date
              </h3>
              <p className="text-xs text-[#6E6E73] max-w-sm mx-auto">
                Generate a new campaign with AI or choose another scheduled production day from the selector above.
              </p>
            </div>
            <button
              onClick={onOpenAiGenerator}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Create campaign for today</span>
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {todaysAssets.map((asset) => {
              const mediaStatus = getMediaStatusLabel(asset.productionStatus);
              const isApproved = asset.productionStatus === 'APPROVED';
              const isReady = asset.productionStatus === 'READY';
              const isGenerating = asset.productionStatus === 'GENERATING';

              return (
                <div
                  key={asset.id}
                  onClick={() => onOpenProductionModal(asset)}
                  className="group bg-white rounded-2xl p-6 sm:p-7 border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 cursor-pointer space-y-5"
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
                    </div>
                    <span className="text-[#6E6E73] font-medium text-xs">
                      {asset.postTimeIST || '6:30 PM'}
                    </span>
                  </div>

                  {/* Middle: Headline Title & Metadata */}
                  <div className="space-y-1.5">
                    <h3 className="text-lg sm:text-xl font-semibold text-[#1D1D1F] tracking-tight leading-snug group-hover:text-[#FF4500] transition-colors">
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
                    <div className="grid grid-cols-3 gap-4 sm:gap-8 text-xs">
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

                    {/* Primary Row Action */}
                    <div className="flex items-center space-x-2 self-end sm:self-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenProductionModal(asset)}
                        disabled={isGenerating}
                        className={`inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all shadow-sm active:scale-95 ${
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
    </div>
  );
};
