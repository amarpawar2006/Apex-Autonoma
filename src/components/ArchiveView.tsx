import React, { useState, useMemo } from 'react';
import {
  Archive,
  RotateCcw,
  Trash2,
  Search,
  FolderKanban,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  Video,
  Image as ImageIcon,
  Check,
  X,
  Info,
  ShieldAlert
} from 'lucide-react';
import { Campaign, SocialAsset, Platform, ContentFormat } from '../types/campaign';
import {
  isCampaignActive,
  isAssetActive,
  isAssetIndividuallyArchived,
  isAssetHiddenByParentCampaign
} from '../utils/archiveUtils';

interface ArchiveViewProps {
  campaigns: Campaign[];
  assets: SocialAsset[];
  onRestoreCampaign: (campaignId: string) => Promise<void>;
  onDeleteCampaignPermanently: (campaignId: string) => Promise<void>;
  onRestoreAsset: (assetId: string) => Promise<void>;
  onRestoreMultipleAssets?: (assetIds: string[]) => Promise<void>;
  onDeleteAssetPermanently: (assetId: string) => Promise<void>;
  onDeleteMultipleAssetsPermanently?: (assetIds: string[]) => Promise<void>;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({
  campaigns,
  assets,
  onRestoreCampaign,
  onDeleteCampaignPermanently,
  onRestoreAsset,
  onRestoreMultipleAssets,
  onDeleteAssetPermanently,
  onDeleteMultipleAssetsPermanently,
}) => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'content'>('campaigns');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAssetIds, setSelectedAssetIds] = useState<string[]>([]);
  
  // Modals state
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<SocialAsset | null>(null);
  const [batchDeleteConfirmOpen, setBatchDeleteConfirmOpen] = useState(false);
  const [blockedRestoreAsset, setBlockedRestoreAsset] = useState<{ asset: SocialAsset; parentCampaignName: string } | null>(null);
  
  // Loading & Feedback
  const [busyActionId, setBusyActionId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const campaignMap = useMemo(() => {
    const map = new Map<string, Campaign>();
    campaigns.forEach(c => map.set(c.id, c));
    return map;
  }, [campaigns]);

  // Archived campaigns (status === 'ARCHIVED')
  const archivedCampaigns = useMemo(() => {
    return campaigns.filter(c => !isCampaignActive(c));
  }, [campaigns]);

  // Archived assets (either individually archived or hidden by archived parent)
  const archivedAssets = useMemo(() => {
    return assets.filter(a => !isAssetActive(a, campaignMap));
  }, [assets, campaignMap]);

  // Filtered campaigns
  const filteredCampaigns = useMemo(() => {
    if (!searchQuery.trim()) return archivedCampaigns;
    const q = searchQuery.toLowerCase();
    return archivedCampaigns.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.campaignCode.toLowerCase().includes(q) ||
      c.brief.toLowerCase().includes(q)
    );
  }, [archivedCampaigns, searchQuery]);

  // Filtered assets
  const filteredAssets = useMemo(() => {
    if (!searchQuery.trim()) return archivedAssets;
    const q = searchQuery.toLowerCase();
    return archivedAssets.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.assetCode.toLowerCase().includes(q) ||
      a.hook.toLowerCase().includes(q) ||
      (a.campaignName && a.campaignName.toLowerCase().includes(q))
    );
  }, [archivedAssets, searchQuery]);

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback(null);
    }, 4000);
  };

  const handleRestoreCampaign = async (campaign: Campaign) => {
    if (busyActionId) return;
    setBusyActionId(`restore-c-${campaign.id}`);
    try {
      await onRestoreCampaign(campaign.id);
      showFeedback('success', `Campaign "${campaign.name}" restored to active status.`);
    } catch (err: any) {
      showFeedback('error', err?.message || `Failed to restore campaign "${campaign.name}"`);
    } finally {
      setBusyActionId(null);
    }
  };

  const handleConfirmDeleteCampaign = async () => {
    if (!campaignToDelete || busyActionId) return;
    const target = campaignToDelete;
    setBusyActionId(`delete-c-${target.id}`);
    try {
      await onDeleteCampaignPermanently(target.id);
      setCampaignToDelete(null);
      showFeedback('success', `Campaign "${target.name}" and associated deliverables permanently deleted.`);
    } catch (err: any) {
      showFeedback('error', err?.message || `Failed to delete campaign "${target.name}"`);
    } finally {
      setBusyActionId(null);
    }
  };

  const handleRestoreAsset = async (asset: SocialAsset) => {
    if (busyActionId) return;

    // Check if parent campaign is archived
    if (asset.campaignId) {
      const parent = campaignMap.get(asset.campaignId);
      if (parent && parent.status === 'ARCHIVED') {
        setBlockedRestoreAsset({
          asset,
          parentCampaignName: parent.name
        });
        return;
      }
    }

    setBusyActionId(`restore-a-${asset.id}`);
    try {
      await onRestoreAsset(asset.id);
      showFeedback('success', `Content item "${asset.title}" restored.`);
    } catch (err: any) {
      showFeedback('error', err?.message || `Failed to restore "${asset.title}"`);
    } finally {
      setBusyActionId(null);
    }
  };

  const handleConfirmDeleteAsset = async () => {
    if (!assetToDelete || busyActionId) return;
    const target = assetToDelete;
    setBusyActionId(`delete-a-${target.id}`);
    try {
      await onDeleteAssetPermanently(target.id);
      setAssetToDelete(null);
      setSelectedAssetIds(prev => prev.filter(id => id !== target.id));
      showFeedback('success', `Content item "${target.title}" permanently deleted.`);
    } catch (err: any) {
      showFeedback('error', err?.message || `Failed to delete "${target.title}"`);
    } finally {
      setBusyActionId(null);
    }
  };

  const handleBatchRestore = async () => {
    if (selectedAssetIds.length === 0 || busyActionId) return;

    // Check if any selected asset belongs to an archived parent campaign
    const blocked = selectedAssetIds.find(id => {
      const a = assets.find(item => item.id === id);
      if (!a?.campaignId) return false;
      const parent = campaignMap.get(a.campaignId);
      return parent && parent.status === 'ARCHIVED';
    });

    if (blocked) {
      const a = assets.find(item => item.id === blocked)!;
      const parent = campaignMap.get(a.campaignId!)!;
      setBlockedRestoreAsset({
        asset: a,
        parentCampaignName: parent.name
      });
      return;
    }

    setBusyActionId('batch-restore');
    try {
      if (onRestoreMultipleAssets) {
        await onRestoreMultipleAssets(selectedAssetIds);
      } else {
        for (const id of selectedAssetIds) {
          await onRestoreAsset(id);
        }
      }
      showFeedback('success', `Restored ${selectedAssetIds.length} content items.`);
      setSelectedAssetIds([]);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to restore selected items');
    } finally {
      setBusyActionId(null);
    }
  };

  const handleConfirmBatchDelete = async () => {
    if (selectedAssetIds.length === 0 || busyActionId) return;
    setBusyActionId('batch-delete');
    try {
      if (onDeleteMultipleAssetsPermanently) {
        await onDeleteMultipleAssetsPermanently(selectedAssetIds);
      } else {
        for (const id of selectedAssetIds) {
          await onDeleteAssetPermanently(id);
        }
      }
      showFeedback('success', `Permanently deleted ${selectedAssetIds.length} content items.`);
      setSelectedAssetIds([]);
      setBatchDeleteConfirmOpen(false);
    } catch (err: any) {
      showFeedback('error', err?.message || 'Failed to permanently delete selected items');
    } finally {
      setBusyActionId(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedAssetIds.length === filteredAssets.length) {
      setSelectedAssetIds([]);
    } else {
      setSelectedAssetIds(filteredAssets.map(a => a.id));
    }
  };

  const toggleSelectAsset = (id: string) => {
    setSelectedAssetIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const formatArchiveDate = (isoString?: string) => {
    if (!isoString) return 'Previously archived';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-2xl bg-zinc-200 text-zinc-700 flex items-center justify-center">
              <Archive className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
                Archive
              </h1>
              <p className="text-xs sm:text-sm text-[#6E6E73] mt-0.5">
                Safely inspect, restore, or permanently delete archived campaigns and content items.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-black/[0.04] p-1 rounded-2xl self-start sm:self-auto">
          <button
            onClick={() => {
              setActiveTab('campaigns');
              setSelectedAssetIds([]);
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'campaigns'
                ? 'bg-white text-[#1D1D1F] shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Campaigns</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/[0.06] font-semibold">
              {archivedCampaigns.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeTab === 'content'
                ? 'bg-white text-[#1D1D1F] shadow-xs'
                : 'text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Content</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-black/[0.06] font-semibold">
              {archivedAssets.length}
            </span>
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center space-x-2.5 text-xs animate-in fade-in duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Search Bar */}
      <div className="bg-white rounded-2xl border border-black/[0.06] p-3.5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              activeTab === 'campaigns'
                ? 'Search archived campaigns…'
                : 'Search archived content deliverables…'
            }
            className="w-full pl-9 pr-4 py-2 bg-[#F5F5F7] rounded-xl text-xs text-[#1D1D1F] placeholder-[#86868B] border-0 focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20"
          />
        </div>

        {activeTab === 'content' && selectedAssetIds.length > 0 && (
          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-[#6E6E73] font-medium mr-1">
              {selectedAssetIds.length} selected
            </span>
            <button
              onClick={handleBatchRestore}
              disabled={Boolean(busyActionId)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-[#F5F5F7] hover:bg-black/[0.06] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restore selected</span>
            </button>
            <button
              onClick={() => setBatchDeleteConfirmOpen(true)}
              disabled={Boolean(busyActionId)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-600" />
              <span>Delete permanently</span>
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: CAMPAIGNS */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          {filteredCampaigns.length === 0 ? (
            <div className="bg-white rounded-3xl border border-black/[0.06] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-[#86868B] flex items-center justify-center mx-auto">
                <FolderKanban className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1D1D1F]">
                {archivedCampaigns.length === 0
                  ? 'No archived campaigns'
                  : 'No campaigns match your search'}
              </h3>
              <p className="text-xs text-[#6E6E73] max-w-md mx-auto">
                {archivedCampaigns.length === 0
                  ? 'When you archive campaigns from the Campaigns list or Strategy view, they will safely appear here for restoration or permanent removal.'
                  : 'Try clearing your search query to see all archived campaigns.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredCampaigns.map(camp => {
                const childAssets = assets.filter(a => a.campaignId === camp.id);
                const isBusy = busyActionId?.includes(camp.id);

                return (
                  <div
                    key={camp.id}
                    className="bg-white rounded-3xl border border-black/[0.06] p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                  >
                    <div className="space-y-2 min-w-0 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#86868B] bg-black/[0.04] px-2 py-0.5 rounded-md">
                          {camp.campaignCode}
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                          Archived
                        </span>
                        <span className="text-xs text-[#86868B]">·</span>
                        <span className="text-xs text-[#86868B]">
                          Archived on: <strong className="text-[#1D1D1F]">{formatArchiveDate(camp.archivedAt)}</strong>
                        </span>
                        <span className="text-xs text-[#86868B]">·</span>
                        <span className="text-xs text-[#86868B]">
                          <strong className="text-[#1D1D1F]">{childAssets.length}</strong> associated content deliverables
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
                        {camp.name}
                      </h3>
                      <p className="text-xs text-[#6E6E73] line-clamp-2 leading-relaxed">
                        {camp.brief}
                      </p>
                      <div className="text-[11px] text-[#86868B] flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-[#86868B]" />
                        <span>Planned timeframe: {camp.startDate} to {camp.endDate}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 pt-2 md:pt-0 border-t md:border-t-0 border-black/[0.04] shrink-0 self-end md:self-auto">
                      <button
                        onClick={() => handleRestoreCampaign(camp)}
                        disabled={isBusy}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-black/[0.04] text-[#1D1D1F] border border-black/[0.08] text-xs font-semibold rounded-xl shadow-2xs transition-colors disabled:opacity-50 min-h-[36px]"
                        title="Restore campaign and reactivate its eligible deliverables"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Restore</span>
                      </button>

                      <button
                        onClick={() => setCampaignToDelete(camp)}
                        disabled={isBusy}
                        className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 min-h-[36px]"
                        title="Permanently delete campaign and associated content"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-600" />
                        <span>Delete permanently</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONTENT */}
      {activeTab === 'content' && (
        <div className="space-y-4">
          {filteredAssets.length === 0 ? (
            <div className="bg-white rounded-3xl border border-black/[0.06] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-zinc-100 text-[#86868B] flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-semibold text-[#1D1D1F]">
                {archivedAssets.length === 0
                  ? 'No archived content items'
                  : 'No content items match your search'}
              </h3>
              <p className="text-xs text-[#6E6E73] max-w-md mx-auto">
                {archivedAssets.length === 0
                  ? 'Individual assets can be archived from the Content Master Sheet or Post Detail screen.'
                  : 'Try clearing your search query to see all archived content items.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-black/[0.06] shadow-xs overflow-hidden">
              {/* Header row with Select All */}
              <div className="p-3.5 sm:px-5 bg-[#FBFBFD] border-b border-black/[0.06] flex items-center justify-between text-xs text-[#6E6E73]">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={selectedAssetIds.length === filteredAssets.length && filteredAssets.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded text-[#FF4500] focus:ring-[#FF4500] cursor-pointer"
                  />
                  <span className="font-semibold text-[#1D1D1F]">
                    Select All ({filteredAssets.length})
                  </span>
                </div>
                <span>Showing {filteredAssets.length} archived deliverables</span>
              </div>

              {/* Table / List Rows */}
              <div className="divide-y divide-black/[0.04]">
                {filteredAssets.map(asset => {
                  const parentCamp = asset.campaignId ? campaignMap.get(asset.campaignId) : undefined;
                  const isParentArchived = parentCamp ? parentCamp.status === 'ARCHIVED' : false;
                  const isIndividuallyArchived = isAssetIndividuallyArchived(asset);
                  const isSelected = selectedAssetIds.includes(asset.id);
                  const isBusy = busyActionId?.includes(asset.id);

                  return (
                    <div
                      key={asset.id}
                      className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                        isSelected ? 'bg-orange-50/40' : 'hover:bg-black/[0.01]'
                      }`}
                    >
                      <div className="flex items-start space-x-3 min-w-0 max-w-2xl">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectAsset(asset.id)}
                          className="w-4 h-4 rounded text-[#FF4500] focus:ring-[#FF4500] cursor-pointer mt-1 shrink-0"
                        />

                        <div className="space-y-1.5 min-w-0">
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-[#FF4500] bg-orange-50 px-1.5 py-0.5 rounded">
                              {asset.assetCode}
                            </span>
                            <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-[#1D1D1F] capitalize bg-black/[0.04] px-2 py-0.5 rounded">
                              {getFormatIcon(asset.format)}
                              <span>{asset.platform} · {asset.format.replace('_', ' ')}</span>
                            </span>

                            {/* Archive Reason / State Badge */}
                            {isIndividuallyArchived ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-700 border border-zinc-200">
                                Individually archived
                              </span>
                            ) : isParentArchived ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                                Hidden by parent campaign
                              </span>
                            ) : null}

                            {/* Parent Campaign Indicator */}
                            {parentCamp && (
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                isParentArchived
                                  ? 'bg-amber-100/70 text-amber-900 border border-amber-200'
                                  : 'bg-zinc-100 text-zinc-700'
                              }`}>
                                Campaign: {parentCamp.name} {isParentArchived ? '(Archived)' : ''}
                              </span>
                            )}
                          </div>

                          {/* Title and hook */}
                          <h4 className="text-sm font-semibold text-[#1D1D1F] line-clamp-1">
                            {asset.title}
                          </h4>
                          <p className="text-xs text-[#6E6E73] line-clamp-1 italic">
                            "{asset.hook}"
                          </p>

                          {/* Preserved Planned Time */}
                          <div className="text-[11px] text-[#86868B] flex flex-wrap items-center gap-3 pt-0.5">
                            <span>Planned Date: <strong className="text-[#1D1D1F]">{asset.targetDate}</strong> ({asset.postTimeIST || '11:30 AM'})</span>
                            <span>·</span>
                            <span>Archived: {formatArchiveDate(asset.archivedAt || parentCamp?.archivedAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Item Actions */}
                      <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto pt-2 md:pt-0 border-t md:border-t-0 border-black/[0.04]">
                        <button
                          onClick={() => handleRestoreAsset(asset)}
                          disabled={isBusy}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-white hover:bg-black/[0.04] text-[#1D1D1F] border border-black/[0.08] text-xs font-semibold rounded-xl shadow-2xs transition-colors disabled:opacity-50 min-h-[34px]"
                          title={
                            isParentArchived
                              ? `Parent campaign "${parentCamp?.name}" is archived. Restore the campaign first.`
                              : 'Restore to active content'
                          }
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Restore</span>
                        </button>

                        <button
                          onClick={() => setAssetToDelete(asset)}
                          disabled={isBusy}
                          className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50 min-h-[34px]"
                          title="Permanently delete item"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-600" />
                          <span>Delete permanently</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: PERMANENT DELETE CAMPAIGN CONFIRMATION */}
      {campaignToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150 text-[#1D1D1F]">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
                  Permanently Delete Campaign?
                </h3>
                <p className="text-xs text-[#6E6E73]">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-4 bg-red-50/50 rounded-2xl border border-red-200/60 text-xs space-y-2 text-red-950">
              <p className="font-semibold text-red-900">
                You are about to permanently delete:
              </p>
              <ul className="list-disc pl-5 space-y-1">
                <li>
                  Campaign: <strong>{campaignToDelete.name}</strong> ({campaignToDelete.campaignCode})
                </li>
                <li>
                  <strong>
                    {assets.filter(a => a.campaignId === campaignToDelete.id).length}
                  </strong>{' '}
                  associated content deliverables and dependent scheduling references.
                </li>
              </ul>
              <p className="text-[11px] text-red-800 pt-1">
                Shared brand typography, design templates, and global settings will remain intact.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-black/[0.06]">
              <button
                onClick={() => setCampaignToDelete(null)}
                disabled={Boolean(busyActionId)}
                className="px-4 py-2 bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteCampaign}
                disabled={Boolean(busyActionId)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{busyActionId ? 'Deleting…' : 'Delete permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: PERMANENT DELETE SINGLE ASSET CONFIRMATION */}
      {assetToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150 text-[#1D1D1F]">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
                  Permanently Delete Content Deliverable?
                </h3>
                <p className="text-xs text-[#6E6E73]">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-4 bg-[#FBFBFD] rounded-2xl border border-black/[0.06] text-xs space-y-1.5 text-[#1D1D1F]">
              <span className="font-mono font-semibold text-[#FF4500] text-[11px] block">
                {assetToDelete.assetCode}
              </span>
              <p className="font-semibold text-sm">
                {assetToDelete.title}
              </p>
              <p className="text-xs text-[#6E6E73] italic">
                "{assetToDelete.hook}"
              </p>
              <p className="text-[11px] text-[#86868B] pt-1">
                Parent campaign and other content will be preserved. Dependent queued references will be removed.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-black/[0.06]">
              <button
                onClick={() => setAssetToDelete(null)}
                disabled={Boolean(busyActionId)}
                className="px-4 py-2 bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteAsset}
                disabled={Boolean(busyActionId)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{busyActionId ? 'Deleting…' : 'Delete permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: BATCH PERMANENT DELETE CONFIRMATION */}
      {batchDeleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150 text-[#1D1D1F]">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
                  Permanently Delete {selectedAssetIds.length} Content Items?
                </h3>
                <p className="text-xs text-[#6E6E73]">
                  This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-4 bg-red-50/50 rounded-2xl border border-red-200/60 text-xs space-y-2 text-red-950">
              <p>
                You are about to permanently remove <strong>{selectedAssetIds.length} deliverables</strong> from the operational database.
              </p>
              <p className="text-[11px] text-red-800">
                All associated scheduling and delivery queue entries will be purged. Shared branding remains intact.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-black/[0.06]">
              <button
                onClick={() => setBatchDeleteConfirmOpen(false)}
                disabled={Boolean(busyActionId)}
                className="px-4 py-2 bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmBatchDelete}
                disabled={Boolean(busyActionId)}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{busyActionId ? 'Deleting…' : 'Delete permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PARENT CAMPAIGN ARCHIVED BLOCKER */}
      {blockedRestoreAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-lg w-full p-6 space-y-5 animate-in zoom-in-95 duration-150 text-[#1D1D1F]">
            <div className="flex items-center space-x-3 text-amber-600">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold tracking-tight text-[#1D1D1F]">
                  Parent Campaign Is Archived
                </h3>
                <p className="text-xs text-[#6E6E73]">
                  Restoration prerequisite
                </p>
              </div>
            </div>

            <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-200/70 text-xs space-y-2 text-amber-950">
              <p>
                Cannot restore <strong>"{blockedRestoreAsset.asset.title}"</strong> because its parent campaign <strong>"{blockedRestoreAsset.parentCampaignName}"</strong> remains archived.
              </p>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                To restore this deliverable, you must first restore the parent campaign from the <strong>Campaigns</strong> tab of the Archive.
              </p>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-black/[0.06]">
              <button
                onClick={() => setBlockedRestoreAsset(null)}
                className="px-4 py-2 bg-[#1D1D1F] hover:bg-black text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
