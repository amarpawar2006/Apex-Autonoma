import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  Eye,
  Layers,
  Video,
  Image as ImageIcon,
  ArrowUpRight
} from 'lucide-react';
import { SocialAsset, Platform, PostStatus, ContentFormat } from '../types/campaign';
import { generateICS } from '../services/exportService';

interface CalendarViewProps {
  assets: SocialAsset[];
  onSelectAsset: (asset: SocialAsset) => void;
  onUpdateStatus: (id: string, newStatus: PostStatus) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  assets,
  onSelectAsset,
  onUpdateStatus,
}) => {
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredAssets = assets.filter((asset) => {
    if (platformFilter !== 'all' && asset.platform !== platformFilter && !(asset.secondaryPlatforms || []).includes(platformFilter as any)) {
      return false;
    }
    if (statusFilter !== 'all' && asset.status !== statusFilter) {
      return false;
    }
    return true;
  });

  const handleExportICS = () => {
    const ics = generateICS(assets);
    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Apex_Engineering_Social_Calendar_${new Date().toISOString().split('T')[0]}.ics`;
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

  return (
    <div className="space-y-6 pb-20">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Publishing Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[#6E6E73] font-normal">
            Multi-platform schedule cadence · Lunch (11:30 AM) & evening commute (6:30 PM) releases
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleExportICS}
            className="w-full sm:w-auto justify-center flex items-center space-x-1.5 px-3.5 py-2.5 bg-white hover:bg-black/[0.02] border border-black/[0.08] text-xs font-medium text-[#1D1D1F] rounded-xl shadow-sm transition-all min-h-[40px]"
          >
            <Download className="w-3.5 h-3.5 text-[#6E6E73]" />
            <span>Export to iCal / Google (.ics)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-[#F2F2F7] text-[#1D1D1F] font-medium px-3 py-2 rounded-xl focus:outline-none cursor-pointer border-0"
          >
            <option value="all">All platforms</option>
            <option value="instagram">Instagram</option>
            <option value="linkedin">LinkedIn</option>
            <option value="twitter">X / Twitter</option>
            <option value="youtube">YouTube</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#F2F2F7] text-[#1D1D1F] font-medium px-3 py-2 rounded-xl focus:outline-none cursor-pointer border-0"
          >
            <option value="all">All statuses</option>
            <option value="draft">Draft</option>
            <option value="in_review">In review</option>
            <option value="approved">Approved</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
          </select>
        </div>

        <span className="text-[#86868B] text-xs px-1">
          {filteredAssets.length} scheduled posts
        </span>
      </div>

      {/* Grid of Scheduled Publishing Days */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.map((asset) => (
          <div
            key={asset.id}
            onClick={() => onSelectAsset(asset)}
            className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-[0_2px_10px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              {/* Card Top: Date & Platform Badges */}
              <div className="flex items-center justify-between text-xs pb-2 border-b border-black/[0.04]">
                <div className="flex items-center space-x-1.5 font-medium text-[#1D1D1F]">
                  <Clock className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>{asset.targetDate}</span>
                  <span className="text-[#86868B]">·</span>
                  <span className="text-[#86868B]">{asset.postTimeIST || '6:30 PM'}</span>
                </div>
                <span className="capitalize text-xs font-medium px-2 py-0.5 rounded-md bg-black/[0.04] text-[#1D1D1F]">
                  {asset.platform}
                </span>
              </div>

              {/* Title & Hook */}
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-[#86868B] block">
                  {asset.assetCode} · {getFormatBadge(asset.format)}
                </span>
                <h4 className="text-sm font-semibold text-[#1D1D1F] leading-snug group-hover:text-[#FF4500] transition-colors">
                  {asset.title}
                </h4>
                <p className="text-xs text-[#6E6E73] line-clamp-2 italic pt-0.5">
                  "{asset.hook}"
                </p>
              </div>
            </div>

            {/* Card Base: Status & Virality */}
            <div className="pt-3 border-t border-black/[0.04] flex items-center justify-between text-xs">
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium capitalize ${
                asset.status === 'approved' || asset.status === 'scheduled' || asset.status === 'published'
                  ? 'bg-emerald-50 text-emerald-700'
                  : asset.status === 'in_review'
                  ? 'bg-amber-50 text-amber-700'
                  : 'bg-black/[0.04] text-[#6E6E73]'
              }`}>
                {asset.status.replace('_', ' ')}
              </span>

              <span className="text-[#86868B] text-[11px]">
                Score: <strong className="text-[#1D1D1F] font-semibold">{asset.viralityScore}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
