import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Check, 
  ExternalLink, 
  Search, 
  SlidersHorizontal, 
  Code2, 
  Calendar, 
  Sparkles, 
  Eye, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Video, 
  Image as ImageIcon,
  ArrowUpRight,
  Filter,
  X
} from 'lucide-react';
import { SocialAsset, PostStatus, Platform, ContentFormat, Campaign } from '../types/campaign';
import { ANNUAL_QUARTER_PLANS } from '../data/initialCampaigns';
import { exportToGoogleSheetsCSV, exportToGoogleSheetsTSV, downloadCSV, GOOGLE_APPS_SCRIPT_CONNECTOR_CODE } from '../services/exportService';

interface ContentMasterSheetViewProps {
  assets: SocialAsset[];
  onSelectAsset: (asset: SocialAsset) => void;
  onUpdateStatus: (id: string, newStatus: PostStatus) => void;
  onOpenAiGenerator: () => void;
  onOpenProductionModal: (asset: SocialAsset) => void;
  campaigns?: Campaign[];
  selectedCampaignId?: string;
  onSelectCampaignFilter?: (campaignId: string) => void;
}

export const ContentMasterSheetView: React.FC<ContentMasterSheetViewProps> = ({
  assets = [],
  onSelectAsset,
  onUpdateStatus,
  onOpenAiGenerator,
  onOpenProductionModal,
  campaigns = [],
  selectedCampaignId = 'all',
  onSelectCampaignFilter,
}) => {
  const [activeTab, setActiveTab] = useState<'month_inventory' | 'annual_strategy'>('month_inventory');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [productionFilter, setProductionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedTsv, setCopiedTsv] = useState<boolean>(false);
  const [showAppsScriptModal, setShowAppsScriptModal] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [mobileDisplayMode, setMobileDisplayMode] = useState<'cards' | 'table'>('cards');

  // Filtered Assets
  const filteredAssets = assets.filter((asset) => {
    if (selectedCampaignId && selectedCampaignId !== 'all' && asset.campaignId !== selectedCampaignId) {
      return false;
    }
    if (platformFilter !== 'all' && asset.platform !== platformFilter && !(asset.secondaryPlatforms || []).includes(platformFilter as any)) {
      return false;
    }
    if (formatFilter !== 'all' && asset.format !== formatFilter) {
      return false;
    }
    if (statusFilter !== 'all' && asset.status !== statusFilter) {
      return false;
    }
    if (productionFilter !== 'all' && (asset.productionStatus || 'NOT_GENERATED') !== productionFilter) {
      return false;
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      const match = 
        asset.title.toLowerCase().includes(q) ||
        asset.assetCode.toLowerCase().includes(q) ||
        asset.hook.toLowerCase().includes(q) ||
        asset.speciesCode.toLowerCase().includes(q) ||
        (asset.campaignName && asset.campaignName.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });

  const handleCopyTSV = () => {
    const tsv = exportToGoogleSheetsTSV(filteredAssets);
    navigator.clipboard.writeText(tsv);
    setCopiedTsv(true);
    setTimeout(() => setCopiedTsv(false), 2000);
  };

  const handleDownloadCSV = () => {
    const csv = exportToGoogleSheetsCSV(assets);
    downloadCSV(`Apex_Engineering_Content_Master_Sheet_${new Date().toISOString().split('T')[0]}.csv`, csv);
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CONNECTOR_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

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

  const getFormatBadge = (format: ContentFormat) => {
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

  const getProductionStateInfo = (status?: string) => {
    switch (status) {
      case 'APPROVED':
        return { label: 'Approved', dot: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-700' };
      case 'READY':
        return { label: 'Ready for review', dot: 'bg-blue-500', pill: 'bg-blue-50 text-blue-700' };
      case 'GENERATING':
        return { label: 'Generating…', dot: 'bg-amber-500 animate-pulse', pill: 'bg-amber-50 text-amber-700' };
      case 'FAILED':
        return { label: 'Needs retry', dot: 'bg-red-500', pill: 'bg-red-50 text-red-700' };
      default:
        return { label: 'Needs media', dot: 'bg-neutral-400', pill: 'bg-black/[0.04] text-[#6E6E73]' };
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Content Master Sheet
          </h1>
          <p className="text-sm text-[#6E6E73] font-normal">
            Strategic inventory for Apex Engineering · {assets.length} planned assets
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Segmented view switch */}
          <div className="p-1 bg-black/[0.04] rounded-xl flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('month_inventory')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                activeTab === 'month_inventory'
                  ? 'bg-white text-[#1D1D1F] font-medium shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Inventory ({assets.length})
            </button>
            <button
              onClick={() => setActiveTab('annual_strategy')}
              className={`px-3 py-1.5 text-xs rounded-lg transition-all ${
                activeTab === 'annual_strategy'
                  ? 'bg-white text-[#1D1D1F] font-medium shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Annual Strategy
            </button>
          </div>

          <button
            onClick={handleCopyTSV}
            title="Copy as TSV to paste directly into Google Sheets"
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-black/[0.02] border border-black/[0.08] text-xs font-medium text-[#1D1D1F] rounded-xl shadow-sm transition-all"
          >
            {copiedTsv ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#6E6E73]" />}
            <span>{copiedTsv ? 'Copied' : 'Copy TSV'}</span>
          </button>

          <button
            onClick={handleDownloadCSV}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-black/[0.02] border border-black/[0.08] text-xs font-medium text-[#1D1D1F] rounded-xl shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#6E6E73]" />
            <span>Download CSV</span>
          </button>

          <button
            onClick={() => setShowAppsScriptModal(true)}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-black/[0.02] border border-black/[0.08] text-xs font-medium text-[#1D1D1F] rounded-xl shadow-sm transition-all"
          >
            <Code2 className="w-3.5 h-3.5 text-[#6E6E73]" />
            <span>Apps Script</span>
          </button>

          <button
            onClick={onOpenAiGenerator}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl shadow-sm transition-all active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create asset</span>
          </button>
        </div>
      </div>

      {activeTab === 'month_inventory' ? (
        <div className="space-y-4">
          {/* Apple-style Filter and Search Bar */}
          <div className="bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search by title, hook, or asset ID…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#F2F2F7] border-0 rounded-xl pl-9 pr-8 py-2 text-xs text-[#1D1D1F] placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#86868B] hover:text-[#1D1D1F]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Dropdowns */}
            <div className="flex flex-wrap items-center gap-2">
              {campaigns.length > 0 && (
                <select
                  value={selectedCampaignId || 'all'}
                  onChange={(e) => onSelectCampaignFilter?.(e.target.value)}
                  className="bg-[#F2F2F7] text-[#1D1D1F] font-medium px-3 py-2 rounded-xl focus:outline-none cursor-pointer border-0 max-w-[180px] truncate"
                >
                  <option value="all">All campaigns</option>
                  {campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.campaignCode}: {c.name}
                    </option>
                  ))}
                </select>
              )}

              <select
                value={platformFilter}
                onChange={(e) => setPlatformFilter(e.target.value)}
                className="bg-[#F2F2F7] text-[#1D1D1F] font-medium px-3 py-2 rounded-xl focus:outline-none cursor-pointer border-0"
              >
                <option value="all">All platforms</option>
                <option value="instagram">Instagram</option>
                <option value="facebook">Facebook</option>
                <option value="linkedin">LinkedIn</option>
                <option value="twitter">X / Twitter</option>
                <option value="youtube">YouTube</option>
                <option value="threads">Threads</option>
                <option value="reddit">Reddit</option>
                <option value="snapchat">Snapchat</option>
                <option value="pinterest">Pinterest</option>
              </select>

              <select
                value={formatFilter}
                onChange={(e) => setFormatFilter(e.target.value)}
                className="bg-[#F2F2F7] text-[#1D1D1F] font-medium px-3 py-2 rounded-xl focus:outline-none cursor-pointer border-0"
              >
                <option value="all">All formats</option>
                <option value="carousel">Carousel</option>
                <option value="reel_short">Reel / Short</option>
                <option value="static_poster">Poster</option>
                <option value="infographic_flyer">Infographic</option>
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

              <select
                value={productionFilter}
                onChange={(e) => setProductionFilter(e.target.value)}
                className="bg-[#F2F2F7] text-[#1D1D1F] font-medium px-3 py-2 rounded-xl focus:outline-none cursor-pointer border-0"
              >
                <option value="all">All media states</option>
                <option value="NOT_GENERATED">Needs media</option>
                <option value="GENERATING">Generating…</option>
                <option value="READY">Ready for review</option>
                <option value="APPROVED">Approved</option>
                <option value="FAILED">Needs retry</option>
              </select>
            </div>

            {/* Mobile View Mode Switcher */}
            <div className="flex md:hidden items-center justify-between w-full pt-2 border-t border-black/[0.04]">
              <span className="text-[11px] text-[#86868B]">
                Showing {filteredAssets.length} of {assets.length}
              </span>
              <div className="p-0.5 bg-black/[0.04] rounded-xl flex items-center space-x-1 text-xs">
                <button
                  type="button"
                  onClick={() => setMobileDisplayMode('cards')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    mobileDisplayMode === 'cards'
                      ? 'bg-white text-[#1D1D1F] shadow-xs'
                      : 'text-[#6E6E73]'
                  }`}
                >
                  Cards
                </button>
                <button
                  type="button"
                  onClick={() => setMobileDisplayMode('table')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    mobileDisplayMode === 'table'
                      ? 'bg-white text-[#1D1D1F] shadow-xs'
                      : 'text-[#6E6E73]'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>

            <span className="text-[#86868B] text-xs hidden lg:inline-block px-1">
              {filteredAssets.length} of {assets.length}
            </span>
          </div>

          {/* Mobile Responsive Cards (Active on < md when mobileDisplayMode === 'cards') */}
          <div className={`md:hidden space-y-3 ${mobileDisplayMode === 'cards' ? 'block' : 'hidden'}`}>
            {filteredAssets.length === 0 ? (
              <div className="bg-white rounded-2xl border border-black/[0.06] p-8 text-center text-xs text-[#86868B]">
                No matching content assets found.
              </div>
            ) : (
              filteredAssets.map((asset) => {
                const prodState = getProductionStateInfo(asset.productionStatus);
                const isApproved = asset.productionStatus === 'APPROVED';
                const isReady = asset.productionStatus === 'READY';
                const isGenerating = asset.productionStatus === 'GENERATING';

                return (
                  <div
                    key={asset.id}
                    onClick={() => onSelectAsset(asset)}
                    className="bg-white rounded-2xl p-4 border border-black/[0.06] shadow-sm space-y-3 cursor-pointer hover:border-black/[0.12] transition-colors"
                  >
                    {/* Card Top: Code, Platform, Format, Approval */}
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2 min-w-0">
                        <span className="font-mono font-semibold text-[#FF4500] text-[11px]">
                          {asset.assetCode}
                        </span>
                        <span className="capitalize font-medium text-[#1D1D1F] flex items-center space-x-1">
                          {getFormatIcon(asset.format)}
                          <span>{asset.platform}</span>
                        </span>
                        <span className="text-[#86868B] text-[11px]">
                          · {getFormatBadge(asset.format)}
                        </span>
                      </div>

                      {/* Approval selector */}
                      <div onClick={(e) => e.stopPropagation()}>
                        <select
                          value={asset.status}
                          onChange={(e) => onUpdateStatus(asset.id, e.target.value as PostStatus)}
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-lg border-0 cursor-pointer ${
                            asset.status === 'approved' || asset.status === 'scheduled' || asset.status === 'published'
                              ? 'bg-emerald-50 text-emerald-700'
                              : asset.status === 'in_review'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-black/[0.04] text-[#6E6E73]'
                          }`}
                        >
                          <option value="draft">Draft</option>
                          <option value="in_review">In review</option>
                          <option value="approved">Approved</option>
                          <option value="scheduled">Scheduled</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>

                    {/* Title & Hook */}
                    <div className="space-y-1">
                      <h4 className="text-sm font-semibold text-[#1D1D1F] tracking-tight">
                        {asset.title}
                      </h4>
                      <p className="text-xs text-[#6E6E73] italic line-clamp-2">
                        "{asset.hook}"
                      </p>
                    </div>

                    {/* Schedule & Media State */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/[0.04] text-xs">
                      <div className="flex items-center space-x-1.5 text-[11px] text-[#86868B]">
                        <Clock className="w-3 h-3 text-[#FF4500]" />
                        <span>{asset.targetDate}</span>
                        <span>·</span>
                        <span>{asset.postTimeIST || '6:30 PM'}</span>
                      </div>

                      <div className="flex items-center space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${prodState.pill}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${prodState.dot}`} />
                          <span>{prodState.label}</span>
                        </span>

                        <button
                          onClick={() => onOpenProductionModal(asset)}
                          disabled={isGenerating}
                          className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all shadow-xs active:scale-95 ${
                            isApproved
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : isReady
                              ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                              : 'bg-[#FF4500] hover:bg-[#EA3E00] text-white'
                          }`}
                        >
                          <span>
                            {isApproved
                              ? 'Ready'
                              : isReady
                              ? 'Review'
                              : 'Produce'}
                          </span>
                          <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Database Spreadsheet Table */}
          <div className={`bg-white rounded-2xl border border-black/[0.06] shadow-[0_2px_12px_rgba(0,0,0,0.03)] overflow-hidden w-full max-w-full ${
            mobileDisplayMode === 'table' ? 'block' : 'hidden md:block'
          }`}>
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left text-xs whitespace-nowrap">
                <thead className="bg-[#FBFBFD] border-b border-black/[0.06] text-[#86868B] sticky top-0 font-medium">
                  <tr>
                    <th className="py-3 px-3.5 w-10 text-center font-normal">#</th>
                    <th className="py-3 px-3.5">Asset ID</th>
                    <th className="py-3 px-4 min-w-[260px]">Title & Hook</th>
                    <th className="py-3 px-3.5">Platform</th>
                    <th className="py-3 px-3.5">Format</th>
                    <th className="py-3 px-3.5">Schedule</th>
                    <th className="py-3 px-3.5">Approval</th>
                    <th className="py-3 px-3.5">Media state</th>
                    <th className="py-3 px-3.5 text-center">Score</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04]">
                  {filteredAssets.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-[#86868B]">
                        No matching content assets found.
                      </td>
                    </tr>
                  ) : (
                    filteredAssets.map((asset, index) => {
                      const prodState = getProductionStateInfo(asset.productionStatus);
                      const isApproved = asset.productionStatus === 'APPROVED';
                      const isReady = asset.productionStatus === 'READY';
                      const isGenerating = asset.productionStatus === 'GENERATING';

                      return (
                        <tr 
                          key={asset.id} 
                          className="hover:bg-[#F5F5F7]/80 transition-colors cursor-pointer group"
                          onClick={() => onSelectAsset(asset)}
                        >
                          <td className="py-3.5 px-3.5 text-center text-[#86868B] font-mono text-[11px]">
                            {String(index + 1).padStart(2, '0')}
                          </td>

                          <td className="py-3.5 px-3.5 font-mono text-[11px] font-semibold text-[#1D1D1F]">
                            {asset.assetCode}
                          </td>

                          <td className="py-3.5 px-4 max-w-sm truncate">
                            <div className="flex items-center space-x-1.5 mb-0.5">
                              {asset.strategicPurpose && (
                                <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-orange-50 text-[#FF4500] border border-orange-100/60 shrink-0">
                                  {asset.strategicPurpose}
                                </span>
                              )}
                              <span className="font-medium text-[#1D1D1F] truncate group-hover:text-[#FF4500] transition-colors">
                                {asset.title}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#86868B] truncate">
                              "{asset.hook}"
                            </div>
                          </td>

                          <td className="py-3.5 px-3.5">
                            <div className="flex items-center space-x-1.5 capitalize text-[#1D1D1F] font-medium">
                              <span>{asset.platform}</span>
                              {asset.secondaryPlatforms && asset.secondaryPlatforms.length > 0 && (
                                <span className="text-[10px] text-[#86868B] font-normal">
                                  +{asset.secondaryPlatforms.length}
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-3.5">
                            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-black/[0.04] text-[#1D1D1F] font-medium text-[11px]">
                              {getFormatIcon(asset.format)}
                              <span>{getFormatBadge(asset.format)}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-3.5 text-[#6E6E73]">
                            <div className="font-medium text-[#1D1D1F]">{asset.targetDate}</div>
                            <div className="text-[10px] text-[#86868B]">{asset.postTimeIST || '6:30 PM'}</div>
                          </td>

                          {/* Approval status dropdown */}
                          <td className="py-3.5 px-3.5" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={asset.status}
                              onChange={(e) => onUpdateStatus(asset.id, e.target.value as PostStatus)}
                              className={`text-[11px] font-medium px-2 py-1 rounded-lg focus:outline-none cursor-pointer border-0 ${
                                asset.status === 'approved' || asset.status === 'scheduled' || asset.status === 'published'
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : asset.status === 'in_review'
                                  ? 'bg-amber-50 text-amber-700'
                                  : 'bg-black/[0.04] text-[#6E6E73]'
                              }`}
                            >
                              <option value="draft">Draft</option>
                              <option value="in_review">In review</option>
                              <option value="approved">Approved</option>
                              <option value="scheduled">Scheduled</option>
                              <option value="published">Published</option>
                            </select>
                          </td>

                          {/* Production State Badge */}
                          <td className="py-3.5 px-3.5" onClick={(e) => e.stopPropagation()}>
                            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium ${prodState.pill}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${prodState.dot}`}></span>
                              <span>{prodState.label}</span>
                            </span>
                          </td>

                          {/* Virality score */}
                          <td className="py-3.5 px-3.5 text-center font-medium text-[#1D1D1F]">
                            {asset.viralityScore}
                          </td>

                          {/* Row Context Action */}
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => onOpenProductionModal(asset)}
                              disabled={isGenerating}
                              className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm active:scale-95 ${
                                isApproved
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  : isReady
                                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                                  : 'bg-[#FF4500] hover:bg-[#EA3E00] text-white'
                              }`}
                            >
                              <span>
                                {isApproved
                                  ? 'Ready'
                                  : isReady
                                  ? 'Review'
                                  : asset.format === 'reel_short'
                                  ? 'Generate video'
                                  : asset.format === 'carousel'
                                  ? 'Generate carousel'
                                  : 'Generate image'}
                              </span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Annual Strategy Matrix (Quarterly Roadmap) */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ANNUAL_QUARTER_PLANS.map((q) => (
            <div 
              key={q.quarter}
              className="bg-white rounded-2xl p-6 border border-black/[0.06] shadow-sm space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                <div className="space-y-0.5">
                  <span className="text-xs font-semibold text-[#FF4500] uppercase tracking-wider">
                    {q.quarter} · Strategic Plan
                  </span>
                  <h3 className="text-lg font-semibold text-[#1D1D1F]">
                    {q.title}
                  </h3>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-md bg-black/[0.04] text-[#6E6E73]">
                  {q.targetMonthlyAssets} assets/mo
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-[#86868B] block mb-1">Theme & Strategic Direction</span>
                  <p className="text-[#1D1D1F] font-medium leading-relaxed">
                    {q.theme}
                  </p>
                </div>

                <div className="p-3 bg-[#FBFBFD] rounded-xl border border-black/[0.04]">
                  <span className="text-[#86868B] block text-[11px]">Quarterly Goal & Reach Target</span>
                  <span className="font-medium text-[#1D1D1F] mt-0.5 block leading-relaxed">{q.quarterlyGoal}</span>
                </div>

                <div>
                  <span className="text-[#86868B] block mb-1.5">Key Campaigns & Anchor Assets</span>
                  <div className="flex flex-wrap gap-1.5">
                    {(q.keyCampaigns || q.flagshipDeliverables || []).map((item: string, idx: number) => (
                      <span 
                        key={idx} 
                        className="px-2.5 py-1 rounded-md bg-black/[0.03] text-[#1D1D1F] text-[11px]"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Google Apps Script Modal */}
      {showAppsScriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md">
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div className="flex items-center space-x-2">
                <Code2 className="w-5 h-5 text-[#FF4500]" />
                <h3 className="font-semibold text-base text-[#1D1D1F]">
                  Google Apps Script 2-Way Sync
                </h3>
              </div>
              <button 
                onClick={() => setShowAppsScriptModal(false)}
                className="text-[#86868B] hover:text-[#1D1D1F] p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#6E6E73] leading-relaxed">
              Deploy this Google Apps Script inside your Google Sheet (<strong>Extensions &gt; Apps Script</strong>) to synchronize live campaigns and production assets directly into your spreadsheet.
            </p>

            <div className="relative">
              <pre className="p-4 bg-[#F2F2F7] rounded-xl text-[11px] font-mono text-[#1D1D1F] overflow-x-auto max-h-60 border border-black/[0.04]">
                {GOOGLE_APPS_SCRIPT_CONNECTOR_CODE}
              </pre>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowAppsScriptModal(false)}
                className="px-4 py-2 bg-black/[0.04] text-[#1D1D1F] hover:bg-black/[0.08] text-xs font-medium rounded-xl transition-colors"
              >
                Close
              </button>
              <button
                onClick={handleCopyScript}
                className="px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl transition-colors shadow-sm flex items-center space-x-1.5"
              >
                {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedScript ? 'Script copied' : 'Copy script'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
