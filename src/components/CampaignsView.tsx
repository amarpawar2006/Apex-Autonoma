import React, { useState } from 'react';
import { 
  Sparkles, 
  Layers, 
  Clock, 
  Plus, 
  Search, 
  Calendar, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  ChevronRight, 
  Eye, 
  Filter, 
  SlidersHorizontal,
  FolderKanban,
  FileSpreadsheet,
  PauseCircle,
  PlayCircle,
  Archive,
  BarChart3
} from 'lucide-react';
import { Campaign, CampaignStatus, SocialAsset, Platform } from '../types/campaign';
import { getCampaignAssetMetrics } from '../services/campaignService';

interface CampaignsViewProps {
  campaigns: Campaign[];
  assets: SocialAsset[];
  onOpenCreateCampaign: () => void;
  onSelectCampaign: (campaign: Campaign) => void;
  onFilterByCampaign: (campaignId: string) => void;
  onUpdateCampaignStatus: (campaignId: string, status: CampaignStatus) => void;
}

export const CampaignsView: React.FC<CampaignsViewProps> = ({
  campaigns,
  assets,
  onOpenCreateCampaign,
  onSelectCampaign,
  onFilterByCampaign,
  onUpdateCampaignStatus,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | CampaignStatus>('ALL');

  // Filter campaigns
  const filteredCampaigns = campaigns.filter(c => {
    if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        c.name.toLowerCase().includes(q) ||
        c.campaignCode.toLowerCase().includes(q) ||
        c.brief.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const getStatusBadge = (status: CampaignStatus) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Active
          </span>
        );
      case 'DRAFT':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
            Draft
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
            Paused
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
            Completed
          </span>
        );
      case 'ARCHIVED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-50 text-zinc-500 border border-zinc-200">
            Archived
          </span>
        );
    }
  };

  const getPlatformIcon = (platform: Platform) => {
    switch (platform) {
      case 'instagram':
        return <span key={platform} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 border border-pink-100">IG</span>;
      case 'linkedin':
        return <span key={platform} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">LI</span>;
      case 'youtube':
        return <span key={platform} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-red-50 text-red-700 border border-red-100">YT</span>;
      case 'twitter':
        return <span key={platform} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 border border-zinc-200">X</span>;
      case 'facebook':
        return <span key={platform} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">FB</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Workspace Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]">
              Campaigns
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-black/[0.05] text-[#6E6E73]">
              {campaigns.length} total
            </span>
          </div>
          <p className="text-sm text-[#6E6E73] mt-1 font-normal">
            Strategic social intelligence initiatives powered by Autonoma & Gemini
          </p>
        </div>

        <button
          onClick={onOpenCreateCampaign}
          className="inline-flex items-center space-x-2 px-4 py-2.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-sm font-medium rounded-2xl shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search campaigns by name, brief, code…"
            className="w-full pl-9 pr-4 py-2 bg-[#F5F5F7] rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] border-0 focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20"
          />
        </div>

        {/* Status Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          {(['ALL', 'ACTIVE', 'DRAFT', 'PAUSED', 'COMPLETED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === st
                  ? 'bg-[#1D1D1F] text-white shadow-sm'
                  : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05]'
              }`}
            >
              {st === 'ALL' ? 'All Campaigns' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Campaigns Grid / List */}
      <div className="grid grid-cols-1 gap-5">
        {filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-3xl border border-black/[0.06] p-12 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF4500] flex items-center justify-center mx-auto">
              <FolderKanban className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-[#1D1D1F]">No campaigns found</h3>
              <p className="text-xs text-[#6E6E73] max-w-sm mx-auto">
                No campaigns matched your current filters. Create a new campaign to let Autonoma design your social strategy.
              </p>
            </div>
            <button
              onClick={onOpenCreateCampaign}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-[#FF4500] text-white text-xs font-medium rounded-xl hover:bg-[#EA3E00] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Campaign</span>
            </button>
          </div>
        ) : (
          filteredCampaigns.map((camp) => {
            // Find assets belonging to this campaign
            const campAssets = assets.filter(a => a.campaignId === camp.id);
            const metrics = getCampaignAssetMetrics(campAssets);

            return (
              <div
                key={camp.id}
                className="group bg-white rounded-3xl border border-black/[0.06] hover:border-black/[0.12] p-6 sm:p-7 transition-all duration-200 hover:shadow-lg space-y-5"
              >
                {/* Top Row: Code, Status, Platforms, and Dates */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-semibold text-[#86868B] tracking-tight bg-black/[0.04] px-2 py-0.5 rounded-md">
                      {camp.campaignCode}
                    </span>
                    {getStatusBadge(camp.status)}
                    <span className="text-xs text-[#86868B]">·</span>
                    <span className="text-xs text-[#86868B] flex items-center">
                      <Calendar className="w-3.5 h-3.5 mr-1 shrink-0" />
                      <span>{camp.startDate} to {camp.endDate}</span>
                    </span>
                  </div>

                  {/* Platforms */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {camp.platforms.map((p) => getPlatformIcon(p))}
                  </div>
                </div>

                {/* Middle: Title & Brief */}
                <div className="space-y-1.5">
                  <h3 
                    onClick={() => onSelectCampaign(camp)}
                    className="text-xl font-semibold text-[#1D1D1F] group-hover:text-[#FF4500] transition-colors cursor-pointer tracking-tight"
                  >
                    {camp.name}
                  </h3>
                  <p className="text-sm text-[#6E6E73] font-normal leading-relaxed line-clamp-2">
                    {camp.brief}
                  </p>
                </div>

                {/* Progress Breakdown Bar */}
                <div className="space-y-2 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[#6E6E73]">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="font-medium text-[#1D1D1F]">{metrics.total} Assets</span>
                      <span>·</span>
                      <span className="text-amber-600 font-medium">{metrics.needsMedia} Need media</span>
                      <span>·</span>
                      <span className="text-blue-600 font-medium">{metrics.ready} Ready</span>
                      <span>·</span>
                      <span className="text-emerald-600 font-medium">{metrics.approved} Approved</span>
                    </div>

                    <div className="flex items-center space-x-2 text-[11px] shrink-0">
                      <span>Est. Reach: <strong className="text-[#1D1D1F]">{metrics.totalReach.toLocaleString()}</strong></span>
                      <span>·</span>
                      <span>Virality: <strong className="text-[#FF4500]">{metrics.averageVirality}/100</strong></span>
                    </div>
                  </div>

                  {/* Visual Progress Track */}
                  <div className="h-2 w-full bg-black/[0.04] rounded-full overflow-hidden flex">
                    <div 
                      style={{ width: `${metrics.total > 0 ? (metrics.approved / metrics.total) * 100 : 0}%` }} 
                      className="bg-emerald-500 h-full transition-all"
                      title="Approved"
                    />
                    <div 
                      style={{ width: `${metrics.total > 0 ? (metrics.ready / metrics.total) * 100 : 0}%` }} 
                      className="bg-blue-500 h-full transition-all"
                      title="Ready"
                    />
                    <div 
                      style={{ width: `${metrics.total > 0 ? (metrics.needsMedia / metrics.total) * 100 : 0}%` }} 
                      className="bg-amber-400 h-full transition-all"
                      title="Needs Media"
                    />
                  </div>
                </div>

                {/* Bottom Row: Actions */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-black/[0.04]">
                  <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => onSelectCampaign(camp)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#F5F5F7] hover:bg-black/[0.06] text-[#1D1D1F] text-xs font-medium rounded-xl transition-colors min-h-[38px]"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#6E6E73]" />
                      <span>Campaign Strategy</span>
                    </button>

                    <button
                      onClick={() => onFilterByCampaign(camp.id)}
                      className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-[#F5F5F7] hover:bg-black/[0.06] text-[#1D1D1F] text-xs font-medium rounded-xl transition-colors min-h-[38px]"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#6E6E73]" />
                      <span>View in Content Sheet</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-2">
                    {camp.status === 'ACTIVE' ? (
                      <button
                        onClick={() => onUpdateCampaignStatus(camp.id, 'PAUSED')}
                        title="Pause Campaign"
                        className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-lg transition-colors text-xs flex items-center space-x-1"
                      >
                        <PauseCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Pause</span>
                      </button>
                    ) : camp.status === 'PAUSED' ? (
                      <button
                        onClick={() => onUpdateCampaignStatus(camp.id, 'ACTIVE')}
                        title="Resume Campaign"
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors text-xs flex items-center space-x-1 font-medium"
                      >
                        <PlayCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Resume</span>
                      </button>
                    ) : null}

                    <button
                      onClick={() => onSelectCampaign(camp)}
                      className="inline-flex items-center space-x-1 text-xs font-medium text-[#FF4500] hover:text-[#EA3E00] px-2 py-1"
                    >
                      <span>Drilldown</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
