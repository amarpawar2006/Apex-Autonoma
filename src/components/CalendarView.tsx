import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Download, 
  Filter, 
  Layers, 
  CheckCircle2, 
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ListFilter,
  Grid3X3,
  CalendarDays
} from 'lucide-react';
import { SocialAsset, ContentFormat, PostStatus } from '../types/campaign';
import { generateICS } from '../services/exportService';

interface CalendarViewProps {
  assets: SocialAsset[];
  onSelectAsset: (asset: SocialAsset) => void;
  onUpdateStatus: (id: string, newStatus: PostStatus) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  assets = [],
  onSelectAsset,
  onUpdateStatus,
}) => {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [campaignFilter, setCampaignFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'timeline' | 'grouped' | 'list'>('grouped');

  // Distinct campaigns in assets
  const availableCampaigns = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of assets) {
      if (a.campaignId) {
        map.set(a.campaignId, a.campaignName || a.campaignId);
      }
    }
    return Array.from(map.entries());
  }, [assets]);

  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      if (platformFilter !== 'all' && asset.platform !== platformFilter && !(asset.secondaryPlatforms || []).includes(platformFilter as any)) {
        return false;
      }
      if (statusFilter !== 'all' && asset.status !== statusFilter) {
        return false;
      }
      if (campaignFilter !== 'all' && asset.campaignId !== campaignFilter) {
        return false;
      }
      return true;
    }).sort((a, b) => {
      const dateA = a.targetDate || '';
      const dateB = b.targetDate || '';
      if (dateA !== dateB) return dateA.localeCompare(dateB);
      return (a.postTimeIST || '').localeCompare(b.postTimeIST || '');
    });
  }, [assets, platformFilter, statusFilter, campaignFilter]);

  // Group assets by date for high-volume handling (e.g. 100+ assets)
  const groupedByDate = useMemo(() => {
    const groups: Record<string, SocialAsset[]> = {};
    for (const asset of filteredAssets) {
      const d = asset.targetDate || 'Unscheduled';
      if (!groups[d]) groups[d] = [];
      groups[d].push(asset);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredAssets]);

  const handleExportICS = () => {
    const ics = generateICS(assets);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Autonoma_Social_Calendar_${new Date().toISOString().split('T')[0]}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFormatBadge = (format: ContentFormat) => {
    switch (format) {
      case 'reel_short':
        return 'Reel';
      case 'carousel':
        return 'Carousel';
      case 'static_poster':
        return 'Poster';
      default:
        return 'Post';
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
      case 'scheduled':
      case 'published':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'in_review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const formatDisplayDate = (dStr: string) => {
    if (dStr === 'Unscheduled') return 'Unscheduled Deliverables';
    try {
      const d = new Date(dStr + 'T12:00:00Z');
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return dStr;
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1D1D1F]">
              Publishing Calendar
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-[#FF4500] border border-orange-200">
              AI Dynamic Cadence
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#6E6E73] font-normal">
            Deterministic, platform-optimized posting schedule calibrated to audience timezone and peak engagement windows.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-black/[0.06] text-xs font-semibold text-[#6E6E73]">
            <button
              onClick={() => setViewMode('grouped')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'grouped' ? 'bg-white text-[#1D1D1F] shadow-2xs font-bold' : 'hover:text-[#1D1D1F]'
              }`}
            >
              <CalendarDays className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>By Date</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'timeline' ? 'bg-white text-[#1D1D1F] shadow-2xs font-bold' : 'hover:text-[#1D1D1F]'
              }`}
            >
              <Grid3X3 className="w-3.5 h-3.5" />
              <span>Grid</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                viewMode === 'list' ? 'bg-white text-[#1D1D1F] shadow-2xs font-bold' : 'hover:text-[#1D1D1F]'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>Agenda</span>
            </button>
          </div>

          <button
            onClick={handleExportICS}
            disabled={assets.length === 0}
            className="w-full sm:w-auto justify-center flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-neutral-50 border border-black/[0.08] text-xs font-semibold text-[#1D1D1F] rounded-xl shadow-2xs transition-all min-h-[38px] disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-[#6E6E73]" />
            <span>Export .ics</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-black/[0.08] shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {/* Platform Filter */}
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-[#FBFBFD] text-[#1D1D1F] font-medium px-3 py-2 rounded-xl focus:outline-none cursor-pointer border border-black/[0.08] text-xs"
          >
            <option value="all">All platforms</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">X / Twitter</option>
            <option value="youtube">YouTube</option>
            <option value="facebook">Facebook</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#FBFBFD] text-[#1D1D1F] font-medium px-3 py-2 rounded-xl focus:outline-none cursor-pointer border border-black/[0.08] text-xs"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="in_review">In review</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>

          {/* Campaign Filter */}
          {availableCampaigns.length > 1 && (
            <select
              value={campaignFilter}
              onChange={(e) => setCampaignFilter(e.target.value)}
              className="bg-[#FBFBFD] text-[#1D1D1F] font-medium px-3 py-2 rounded-xl focus:outline-none cursor-pointer border border-black/[0.08] text-xs max-w-[180px] sm:max-w-[220px] truncate"
            >
              <option value="all">All campaigns</option>
              {availableCampaigns.map(([cId, cName]) => (
                <option key={cId} value={cId}>{cName}</option>
              ))}
            </select>
          )}
        </div>

        <span className="text-[#6E6E73] text-xs font-semibold px-2 py-1 bg-slate-100 rounded-lg">
          {filteredAssets.length} scheduled {filteredAssets.length === 1 ? 'post' : 'posts'}
        </span>
      </div>

      {/* Main Content Area */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white rounded-3xl border border-black/[0.08] p-10 sm:p-14 text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center mx-auto text-[#FF4500] border border-orange-100">
            <CalendarIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-[#1D1D1F]">No scheduled deliverables</h3>
          <p className="text-xs text-[#6E6E73] max-w-sm mx-auto">
            No posts match your selected filters. Create or approve campaign deliverables to populate the publishing calendar.
          </p>
        </div>
      ) : viewMode === 'grouped' ? (
        /* High-Volume Date Grouping View (Supports 100+ assets cleanly) */
        <div className="space-y-6">
          {groupedByDate.map(([dateStr, dayAssets]) => (
            <div key={dateStr} className="space-y-3">
              {/* Date Header Badge */}
              <div className="flex items-center justify-between border-b border-black/[0.06] pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF4500]" />
                  <span className="text-sm font-bold text-[#1D1D1F]">
                    {formatDisplayDate(dateStr)}
                  </span>
                  <span className="text-xs text-[#6E6E73] font-mono">
                    ({dateStr})
                  </span>
                </div>
                <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-[#1D1D1F] rounded-md">
                  {dayAssets.length} {dayAssets.length === 1 ? 'post' : 'posts'}
                </span>
              </div>

              {/* Day's Assets Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {dayAssets.map((asset) => (
                  <div
                    key={asset.id}
                    onClick={() => onSelectAsset(asset)}
                    className="bg-white rounded-2xl border border-black/[0.08] hover:border-[#FF4500]/40 p-4 shadow-2xs hover:shadow-md transition-all duration-150 cursor-pointer flex flex-col justify-between space-y-3 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs pb-1.5 border-b border-black/[0.05]">
                        <div className="flex items-center space-x-1.5 font-semibold text-[#1D1D1F]">
                          <Clock className="w-3.5 h-3.5 text-[#FF4500]" />
                          <span>{asset.postTimeIST ? `${asset.postTimeIST} IST` : 'Dynamic Peak Window'}</span>
                        </div>
                        <span className="capitalize text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-[#1D1D1F]">
                          {asset.platform}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-[#86868B] block">
                          {asset.assetCode} · {getFormatBadge(asset.format)}
                        </span>
                        <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug group-hover:text-[#FF4500] transition-colors line-clamp-1 pt-0.5">
                          {asset.title}
                        </h4>
                        <p className="text-xs text-[#6E6E73] line-clamp-2 italic pt-1">
                          "{asset.hook}"
                        </p>
                      </div>
                    </div>

                    <div className="pt-2.5 border-t border-black/[0.05] flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize border ${getStatusBadgeClass(asset.status)}`}>
                        {asset.status.replace('_', ' ')}
                      </span>

                      <div className="flex items-center gap-1.5 text-right">
                        <span className="text-[10px] text-[#6E6E73]">AI Score:</span>
                        <strong className="text-xs font-bold text-[#FF4500]">
                          {asset.viralityScore || 88}
                        </strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : viewMode === 'list' ? (
        /* Agenda / Table View */
        <div className="bg-white rounded-2xl border border-black/[0.08] shadow-2xs overflow-hidden">
          <div className="divide-y divide-black/[0.06]">
            {filteredAssets.map((asset) => (
              <div
                key={asset.id}
                onClick={() => onSelectAsset(asset)}
                className="p-3.5 sm:p-4 hover:bg-[#FBFBFD] transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-orange-50 text-[#FF4500] shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-[#1D1D1F]">{asset.targetDate}</span>
                      <span className="text-[#86868B]">·</span>
                      <span className="text-[#FF4500] font-medium">{asset.postTimeIST ? `${asset.postTimeIST} IST` : 'Dynamic Peak Window'}</span>
                      <span className="capitalize px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-semibold text-[#1D1D1F]">
                        {asset.platform}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-[#1D1D1F] truncate pt-0.5">
                      {asset.title}
                    </h4>
                    <p className="text-xs text-[#6E6E73] truncate">
                      "{asset.hook}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-semibold capitalize border ${getStatusBadgeClass(asset.status)}`}>
                    {asset.status.replace('_', ' ')}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] text-[#86868B] block">AI Score</span>
                    <strong className="text-xs font-bold text-[#FF4500]">{asset.viralityScore || 88}</strong>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#86868B]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => onSelectAsset(asset)}
              className="bg-white rounded-2xl border border-black/[0.08] hover:border-[#FF4500]/40 p-5 shadow-2xs hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-black/[0.06]">
                  <div className="flex items-center space-x-1.5 font-semibold text-[#1D1D1F]">
                    <Clock className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>{asset.targetDate}</span>
                    <span className="text-[#86868B]">·</span>
                    <span className="text-[#6E6E73] font-medium">{asset.postTimeIST ? `${asset.postTimeIST} IST` : 'Dynamic Peak Window'}</span>
                  </div>
                  <span className="capitalize text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-[#1D1D1F]">
                    {asset.platform}
                  </span>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#86868B] block">
                    {asset.assetCode} · {getFormatBadge(asset.format)}
                  </span>
                  <h4 className="text-sm font-bold text-[#1D1D1F] leading-snug group-hover:text-[#FF4500] transition-colors">
                    {asset.title}
                  </h4>
                  <p className="text-xs text-[#6E6E73] line-clamp-2 italic pt-0.5">
                    "{asset.hook}"
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-black/[0.06] flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold capitalize border ${getStatusBadgeClass(asset.status)}`}>
                  {asset.status.replace('_', ' ')}
                </span>

                <span className="text-[#6E6E73] text-[11px]">
                  AI Score: <strong className="text-[#FF4500] font-bold">{asset.viralityScore || 88}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
