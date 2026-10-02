import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  Download, 
  ExternalLink, 
  Filter, 
  Layers, 
  Video, 
  Image as ImageIcon,
  CheckCircle2,
  CalendarCheck
} from 'lucide-react';
import { SocialAsset, ContentFormat } from '../types/campaign';
import { generateICS } from '../services/exportService';

interface CalendarViewProps {
  assets: SocialAsset[];
  onSelectAsset: (asset: SocialAsset) => void;
  onUpdateStatus: (id: string, newStatus: any) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  assets = [],
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

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F5F5F7]">
            Publishing Calendar
          </h1>
          <p className="text-xs sm:text-sm text-[#9898A0] font-normal">
            Multi-platform schedule cadence · Lunch (11:30 AM) & evening commute (6:30 PM) releases
          </p>
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={handleExportICS}
            disabled={assets.length === 0}
            className="w-full sm:w-auto justify-center flex items-center space-x-1.5 px-3.5 py-2.5 bg-[#161922] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-semibold text-[#F5F5F7] rounded-xl shadow-sm transition-all min-h-[40px] disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-[#9898A0]" />
            <span>Export to iCal / Google (.ics)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#12141A] p-3.5 rounded-2xl border border-white/[0.08] shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={platformFilter}
            onChange={(e) => setPlatformFilter(e.target.value)}
            className="bg-[#161922] text-[#F5F5F7] font-medium px-3 py-2 rounded-xl focus:outline-none cursor-pointer border border-white/[0.06]"
          >
            <option value="all" className="bg-[#161922]">All platforms</option>
            <option value="instagram" className="bg-[#161922]">Instagram</option>
            <option value="linkedin" className="bg-[#161922]">LinkedIn</option>
            <option value="twitter" className="bg-[#161922]">X / Twitter</option>
            <option value="youtube" className="bg-[#161922]">YouTube</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#161922] text-[#F5F5F7] font-medium px-3 py-2 rounded-xl focus:outline-none cursor-pointer border border-white/[0.06]"
          >
            <option value="all" className="bg-[#161922]">All statuses</option>
            <option value="draft" className="bg-[#161922]">Draft</option>
            <option value="in_review" className="bg-[#161922]">In review</option>
            <option value="approved" className="bg-[#161922]">Approved</option>
            <option value="scheduled" className="bg-[#161922]">Scheduled</option>
            <option value="published" className="bg-[#161922]">Published</option>
          </select>
        </div>

        <span className="text-[#9898A0] text-xs px-1 font-mono">
          {filteredAssets.length} scheduled posts
        </span>
      </div>

      {/* Grid of Scheduled Publishing Days */}
      {filteredAssets.length === 0 ? (
        <div className="bg-[#12141A] rounded-3xl border border-white/[0.08] p-10 sm:p-14 text-center space-y-3 shadow-xl">
          <div className="w-12 h-12 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto text-[#9898A0] border border-white/[0.06]">
            <CalendarIcon className="w-6 h-6 text-[#FF4500]" />
          </div>
          <h3 className="text-base font-semibold text-[#F5F5F7]">No scheduled deliverables</h3>
          <p className="text-xs text-[#9898A0] max-w-sm mx-auto">
            No posts match your selected filters. Create or approve campaign deliverables to populate the publishing calendar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              onClick={() => onSelectAsset(asset)}
              className="bg-[#12141A] rounded-2xl border border-white/[0.08] hover:border-white/[0.16] p-5 shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer group flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* Card Top: Date & Platform Badges */}
                <div className="flex items-center justify-between text-xs pb-2 border-b border-white/[0.06]">
                  <div className="flex items-center space-x-1.5 font-medium text-[#F5F5F7]">
                    <Clock className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>{asset.targetDate}</span>
                    <span className="text-[#9898A0]">·</span>
                    <span className="text-[#9898A0]">{asset.postTimeIST || '6:30 PM'}</span>
                  </div>
                  <span className="capitalize text-xs font-medium px-2 py-0.5 rounded-md bg-white/[0.06] text-[#F5F5F7] border border-white/[0.08]">
                    {asset.platform}
                  </span>
                </div>

                {/* Title & Hook */}
                <div className="space-y-1">
                  <span className="text-[11px] font-mono text-[#9898A0] block">
                    {asset.assetCode} · {getFormatBadge(asset.format)}
                  </span>
                  <h4 className="text-sm font-semibold text-[#F5F5F7] leading-snug group-hover:text-[#FF4500] transition-colors">
                    {asset.title}
                  </h4>
                  <p className="text-xs text-[#9898A0] line-clamp-2 italic pt-0.5">
                    "{asset.hook}"
                  </p>
                </div>
              </div>

              {/* Card Base: Status & Virality */}
              <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium capitalize ${
                  asset.status === 'approved' || asset.status === 'scheduled' || asset.status === 'published'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : asset.status === 'in_review'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-white/[0.04] text-[#9898A0] border border-white/[0.06]'
                }`}>
                  {asset.status.replace('_', ' ')}
                </span>

                <span className="text-[#9898A0] text-[11px]">
                  Score: <strong className="text-[#F5F5F7] font-semibold">{asset.viralityScore}</strong>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
