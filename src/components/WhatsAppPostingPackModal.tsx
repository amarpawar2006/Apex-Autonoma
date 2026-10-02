import React, { useState, useMemo } from 'react';
import {
  X,
  Copy,
  Check,
  Share2,
  Download,
  Clock,
  Layers,
  Video,
  Image as ImageIcon,
  FileText,
  Info,
  Calendar,
  Phone,
  MessageSquare
} from 'lucide-react';
import { SocialAsset, ContentFormat, Campaign, PostStatus, Platform } from '../types/campaign';

export interface WhatsAppPostingPackModalProps {
  isOpen: boolean;
  onClose: () => void;
  scope?: 'today' | 'campaign';
  campaign?: Campaign;
  assets: SocialAsset[];
  selectedDate?: string;
  campaigns?: Campaign[];
  companyName?: string;
  defaultRecipientNumber?: string;
  activeCampaignFilter?: string;
  initialSelectedAssetId?: string;
  onUpdateStatus?: (assetId: string, newStatus: PostStatus) => void;
}

// Maximum safe characters for WhatsApp URL intent to prevent browser URL truncation
const SAFE_WHATSAPP_CHAR_LIMIT = 1750;

export const WhatsAppPostingPackModal: React.FC<WhatsAppPostingPackModalProps> = ({
  isOpen,
  onClose,
  scope = 'today',
  campaign,
  assets,
  selectedDate = new Date().toISOString().split('T')[0],
  campaigns = [],
  companyName = 'Apex Engineering Pune',
  defaultRecipientNumber = '',
  activeCampaignFilter = 'all',
  initialSelectedAssetId,
  onUpdateStatus
}) => {
  if (!isOpen) return null;

  // Recipient selection state: 'choose_chat' (user picks in WhatsApp) or 'company_number' (pre-populates saved company phone)
  const hasSavedNumber = Boolean(defaultRecipientNumber && defaultRecipientNumber.trim());
  const [recipientMode, setRecipientMode] = useState<'choose_chat' | 'company_number'>(
    hasSavedNumber ? 'company_number' : 'choose_chat'
  );
  const [companyPhoneInput, setCompanyPhoneInput] = useState<string>(defaultRecipientNumber || '');
  const [isEditingPhone, setIsEditingPhone] = useState<boolean>(false);

  // Filter mode when on Today page and an active campaign filter is in effect
  const isFiltered = scope === 'today' && activeCampaignFilter !== 'all';
  const [filterMode, setFilterMode] = useState<'current' | 'all'>(
    isFiltered ? 'current' : 'all'
  );

  // Available candidate assets based on scope
  const candidateAssets = useMemo(() => {
    if (scope === 'campaign') {
      const campId = campaign?.id;
      const filtered = campId ? assets.filter((a) => a.campaignId === campId) : assets;
      // Sort in chronological order by targetDate, then postTimeIST
      return [...filtered].sort((a, b) => {
        if (a.targetDate !== b.targetDate) {
          return a.targetDate.localeCompare(b.targetDate);
        }
        return (a.postTimeIST || '').localeCompare(b.postTimeIST || '');
      });
    }

    // scope === 'today'
    const todayAssets = assets.filter((a) => a.targetDate === selectedDate);
    if (filterMode === 'current' && isFiltered) {
      return todayAssets.filter((a) => a.campaignId === activeCampaignFilter);
    }
    return todayAssets;
  }, [scope, campaign, assets, selectedDate, filterMode, isFiltered, activeCampaignFilter]);

  // Selected asset IDs for inclusion in the posting pack
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (initialSelectedAssetId && candidateAssets.some((a) => a.id === initialSelectedAssetId)) {
      return [initialSelectedAssetId];
    }
    return candidateAssets.map((a) => a.id);
  });

  // Active view tab in modal: 'pack' (preview & WhatsApp actions) or 'selection' (checklist & media downloads)
  const [activeTab, setActiveTab] = useState<'pack' | 'selection'>('pack');

  // Currently active message part index for partitioned WhatsApp URLs
  const [activePartIndex, setActivePartIndex] = useState<number>(0);

  // Copy feedback states
  const [copiedPart, setCopiedPart] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [nativeShareStatus, setNativeShareStatus] = useState<string | null>(null);

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    setSelectedIds(candidateAssets.map((a) => a.id));
  };

  const handleDeselectAll = () => {
    setSelectedIds([]);
  };

  // Helper to format date nicely
  const formatFriendlyDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-').map(Number);
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  // Resolve campaign name for an asset
  const getCampaignName = (asset: SocialAsset) => {
    if (asset.campaignName) return asset.campaignName;
    if (campaign?.name && asset.campaignId === campaign.id) return campaign.name;
    if (asset.campaignId) {
      const match = campaigns.find((c) => c.id === asset.campaignId);
      if (match?.name) return match.name;
    }
    return 'Autonoma Campaign';
  };

  // The assets selected for the pack in order
  const activeSelectedAssets = useMemo(() => {
    return candidateAssets.filter((a) => selectedIds.includes(a.id));
  }, [candidateAssets, selectedIds]);

  // Unique list of destination channels across all active selected assets
  const activeDestinationChannels = useMemo(() => {
    const channelSet = new Set<string>();
    activeSelectedAssets.forEach((asset) => {
      if (asset.platform) channelSet.add(asset.platform);
      if (Array.isArray(asset.secondaryPlatforms)) {
        asset.secondaryPlatforms.forEach((p) => channelSet.add(p));
      }
    });
    return Array.from(channelSet).map((p) => p.toUpperCase());
  }, [activeSelectedAssets]);

  // Group active selected assets by targetDate (especially useful for campaign scope)
  const groupedByDate = useMemo(() => {
    const map = new Map<string, SocialAsset[]>();
    activeSelectedAssets.forEach((asset) => {
      const dateKey = asset.targetDate || selectedDate;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(asset);
    });
    return map;
  }, [activeSelectedAssets, selectedDate]);

  // Construct origin URL for the Today or Campaign page
  const hubPageUrl = useMemo(() => {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://apex-autonoma.ai.studio';
      if (scope === 'campaign' && campaign) {
        return `${origin}/?tab=campaigns&campaignId=${campaign.id}`;
      }
      return `${origin}/?tab=todays_production&date=${selectedDate}`;
    } catch {
      return `https://apex-autonoma.ai.studio`;
    }
  }, [scope, campaign, selectedDate]);

  // Build a single post block with cross-post destinations & any channel-specific captions
  const buildSinglePostBlock = (asset: SocialAsset, postNumber: number, totalPosts: number): string => {
    const isApproved = asset.status === 'approved' || asset.status === 'published' || asset.productionStatus === 'APPROVED';
    const approvalBadge = isApproved ? 'Approved ✓' : 'Draft / In Review';
    
    let creativeBadge = 'Not Generated';
    if (asset.productionStatus === 'APPROVED') creativeBadge = 'Approved Media ✓';
    else if (asset.productionStatus === 'READY') creativeBadge = 'Media Ready for Review';
    else if (asset.productionStatus === 'GENERATING') creativeBadge = 'Generating…';
    else if (asset.productionStatus === 'FAILED') creativeBadge = 'Media Failed (Needs Retry)';

    // Cross-post destinations
    const primaryPlatform = asset.platform ? asset.platform.toUpperCase() : 'POST';
    const secondaryList = (asset.secondaryPlatforms || []).map((p) => p.toUpperCase());
    const allChannels = [primaryPlatform, ...secondaryList.filter((p) => p !== primaryPlatform)];
    const formatLabel = asset.format ? asset.format.replace('_', ' ').toUpperCase() : 'POST';
    const plannedTime = asset.postTimeIST || '11:30 AM IST';
    const campName = getCampaignName(asset);

    let postBlock = 
      `📌 *DELIVERABLE ${postNumber} OF ${totalPosts}*\n` +
      `🆔 *Asset Code:* ${asset.assetCode || asset.id}\n` +
      `📋 *Campaign:* ${campName}\n` +
      `📅 *Planned Date:* ${formatFriendlyDate(asset.targetDate || selectedDate)} · ⏰ *Time:* ${plannedTime}\n` +
      `📱 *Channels:* ${allChannels.join(', ')} (Primary: ${primaryPlatform})\n` +
      `📐 *Format:* ${formatLabel}\n` +
      `🚦 *Approval:* ${approvalBadge} · 🎨 *Creative:* ${creativeBadge}\n\n` +
      `📝 *TITLE / HOOK:*\n${asset.title}\n` +
      (asset.hook ? `"${asset.hook}"\n\n` : `\n`) +
      `✍️ *CAPTION:*\n${asset.caption || '(No caption provided)'}\n\n`;

    // Check for saved channel-specific captions (if available on the asset without inventing variants)
    const channelCaptions = (asset as any).platformCaptions as Record<string, string> | undefined;
    if (channelCaptions && typeof channelCaptions === 'object') {
      const nonPrimaryEntries = Object.entries(channelCaptions).filter(
        ([chan, cap]) => chan.toLowerCase() !== asset.platform.toLowerCase() && cap && cap.trim() !== asset.caption.trim()
      );
      if (nonPrimaryEntries.length > 0) {
        postBlock += `🌐 *CHANNEL-SPECIFIC CAPTIONS:*\n`;
        nonPrimaryEntries.forEach(([chan, cap]) => {
          postBlock += `• *${chan.toUpperCase()}:*\n${cap.trim()}\n\n`;
        });
      }
    }

    if (asset.hashtags && asset.hashtags.length > 0) {
      const hashStr = asset.hashtags.map((h) => (h.startsWith('#') ? h : `#${h}`)).join(' ');
      postBlock += `🏷️ *HASHTAGS:*\n${hashStr}\n\n`;
    }

    if (asset.callToAction) {
      postBlock += `🎯 *CALL TO ACTION:*\n${asset.callToAction}\n\n`;
    }

    postBlock += `🌐 *DESTINATION URL:*\nhttps://apex-engineering.co.in\n\n`;

    // Production instructions & Prompts
    const hasPrompts = asset.posterVisualPrompt || asset.videoGenerationPrompt || (asset.slides && asset.slides.length > 0) || (asset.videoScenes && asset.videoScenes.length > 0);
    if (hasPrompts) {
      postBlock += `🎬 *CREATIVE PRODUCTION & PROMPTS:*\n`;
      if (asset.posterVisualPrompt) {
        postBlock += `• Visual Prompt: ${asset.posterVisualPrompt}\n`;
      }
      if (asset.videoGenerationPrompt) {
        postBlock += `• Video Prompt: ${asset.videoGenerationPrompt}\n`;
      }
      if (asset.slides && asset.slides.length > 0) {
        postBlock += `• Carousel (${asset.slides.length} slides):\n`;
        asset.slides.forEach((sl) => {
          postBlock += `  - Slide ${sl.slideNumber}: ${sl.headline} [${sl.layout}]\n`;
        });
      }
      if (asset.videoScenes && asset.videoScenes.length > 0) {
        postBlock += `• Video Scenes (${asset.videoScenes.length} scenes):\n`;
        asset.videoScenes.forEach((sc) => {
          postBlock += `  - Scene ${sc.sceneNumber} (${sc.timestamp}): "${sc.hookText}" [${sc.visualFocus || 'B-roll'}]\n`;
        });
      }
      postBlock += `\n`;
    }

    // Creative download links
    const hasMediaLink = asset.generatedImageUrl || asset.generatedVideoUrl;
    postBlock += `🖼️ *CREATIVE DOWNLOAD:*\n`;
    if (asset.generatedImageUrl) {
      postBlock += `• Image Asset: ${asset.generatedImageUrl} (Workspace access required)\n`;
    }
    if (asset.generatedVideoUrl) {
      postBlock += `• Video Asset: ${asset.generatedVideoUrl} (Workspace access required)\n`;
    }
    if (!hasMediaLink) {
      postBlock += `⚠️ Creative media not generated yet. Visit the Autonoma Studio to review or generate visuals.\n`;
    }

    postBlock += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
    return postBlock;
  };

  // Build the complete, unchunked plain text posting pack preserving all UTF-8 characters, Marathi/Hindi, emojis, and newlines
  const buildFullPostingPackText = (): string => {
    if (activeSelectedAssets.length === 0) {
      return `📦 *AUTONOMA POSTING PACK*\n🏢 *Workspace:* ${companyName}\n\n⚠️ No posts selected. Please select at least one post.`;
    }

    const sections: string[] = [];

    // Header section
    const scopeTitle = scope === 'campaign' 
      ? `CAMPAIGN POSTING PACK: ${campaign?.name || 'Campaign'}`
      : `DAILY POSTING PACK: ${formatFriendlyDate(selectedDate)}`;

    sections.push(
      `📦 *AUTONOMA ${scopeTitle}*\n` +
      `🏢 *Workspace:* ${companyName}\n` +
      `📊 *Scope:* ${scope === 'campaign' ? 'Entire Campaign' : 'Today\'s Production'} (${activeSelectedAssets.length} deliverables)\n` +
      `📱 *Destination Channels:* ${activeDestinationChannels.join(', ') || 'All Platforms'}\n` +
      `🔗 *Production Hub:* ${hubPageUrl}\n` +
      `ℹ️ *Note:* Media download links require authorized workspace access.\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
    );

    if (scope === 'campaign') {
      // Group by planned date
      let counter = 1;
      const sortedDates = Array.from(groupedByDate.keys()).sort();
      sortedDates.forEach((dateKey) => {
        const postsOnDate = groupedByDate.get(dateKey) || [];
        sections.push(`📅 *PLANNED DATE: ${formatFriendlyDate(dateKey)}* (${postsOnDate.length} item${postsOnDate.length > 1 ? 's' : ''})`);
        postsOnDate.forEach((asset) => {
          sections.push(buildSinglePostBlock(asset, counter++, activeSelectedAssets.length));
        });
      });
    } else {
      activeSelectedAssets.forEach((asset, idx) => {
        sections.push(buildSinglePostBlock(asset, idx + 1, activeSelectedAssets.length));
      });
    }

    return sections.join('\n\n');
  };

  const fullPostingPackText = useMemo(() => {
    return buildFullPostingPackText();
  }, [activeSelectedAssets, companyName, scope, campaign, selectedDate, activeDestinationChannels, groupedByDate, hubPageUrl]);

  // Intelligent chunking into numbered message parts to stay well within WhatsApp URL parameters (~1750 chars)
  const messageParts = useMemo((): { title: string; text: string; postIndices: number[] }[] => {
    if (activeSelectedAssets.length === 0) {
      return [{ title: 'Empty', text: fullPostingPackText, postIndices: [] }];
    }

    const scopeHeader = scope === 'campaign'
      ? `📦 *AUTONOMA CAMPAIGN PACK (${campaign?.name || 'Campaign'})*`
      : `📦 *AUTONOMA TODAY'S POSTS (${formatFriendlyDate(selectedDate)})*`;

    // Header snippet for each part
    const headerPrefix = (partNum: number, totalParts: number) =>
      `${scopeHeader} [Part ${partNum} of ${totalParts}]\n` +
      `🏢 *Workspace:* ${companyName} · 📱 *Channels:* ${activeDestinationChannels.join(', ')}\n` +
      `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;

    // Try single part first
    if (fullPostingPackText.length <= SAFE_WHATSAPP_CHAR_LIMIT) {
      return [{
        title: 'Complete Pack',
        text: fullPostingPackText,
        postIndices: activeSelectedAssets.map((_, i) => i + 1)
      }];
    }

    // Partition by individual posts
    const parts: { title: string; text: string; postIndices: number[] }[] = [];
    let currentPartText = '';
    let currentIndices: number[] = [];

    // Pre-build individual post blocks
    const postBlocks = activeSelectedAssets.map((asset, idx) => {
      return {
        index: idx + 1,
        text: buildSinglePostBlock(asset, idx + 1, activeSelectedAssets.length)
      };
    });

    for (const post of postBlocks) {
      const prospectiveLength = currentPartText.length + post.text.length + 100;
      if (prospectiveLength > SAFE_WHATSAPP_CHAR_LIMIT && currentIndices.length > 0) {
        parts.push({
          title: `Posts ${currentIndices.join(', ')}`,
          text: currentPartText.trim(),
          postIndices: [...currentIndices]
        });
        currentPartText = '';
        currentIndices = [];
      }

      // If an individual post by itself exceeds the safe limit, split that single post
      if (post.text.length > SAFE_WHATSAPP_CHAR_LIMIT) {
        const midPoint = Math.floor(post.text.length / 2);
        const splitIdx = post.text.lastIndexOf('\n\n', midPoint) > 0 ? post.text.lastIndexOf('\n\n', midPoint) : midPoint;
        const partA = post.text.substring(0, splitIdx);
        const partB = `[Continued: Deliverable ${post.index}]\n\n` + post.text.substring(splitIdx).trim();

        parts.push({
          title: `Deliverable ${post.index} (1/2)`,
          text: partA.trim(),
          postIndices: [post.index]
        });
        currentPartText = partB + '\n\n';
        currentIndices = [post.index];
      } else {
        currentPartText += (currentPartText ? '\n\n' : '') + post.text;
        currentIndices.push(post.index);
      }
    }

    if (currentPartText.trim()) {
      parts.push({
        title: `Posts ${currentIndices.join(', ')}`,
        text: currentPartText.trim(),
        postIndices: [...currentIndices]
      });
    }

    // Now prepend the numbered part header
    const totalParts = parts.length;
    return parts.map((p, idx) => ({
      ...p,
      title: `Part ${idx + 1} of ${totalParts}: ${p.title}`,
      text: headerPrefix(idx + 1, totalParts) + p.text
    }));
  }, [activeSelectedAssets, fullPostingPackText, companyName, selectedDate, scope, campaign, activeDestinationChannels]);

  // Active message part text
  const currentPart = messageParts[activePartIndex] || messageParts[0];

  // Helper to build WhatsApp target URL based on recipient mode
  const getWhatsAppUrl = (textToShare: string): string => {
    const encoded = encodeURIComponent(textToShare);
    if (recipientMode === 'company_number' && companyPhoneInput.trim()) {
      const cleanPhone = companyPhoneInput.replace(/[^\d+]/g, '').replace(/^\+/, '');
      if (cleanPhone) {
        return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
      }
    }
    return `https://api.whatsapp.com/send?text=${encoded}`;
  };

  // Open in WhatsApp with URL-encoded prepared text
  const handleOpenWhatsApp = (textToShare: string) => {
    // Note: Opening WhatsApp does not mark content as posted!
    const url = getWhatsAppUrl(textToShare);
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Copy specific part
  const handleCopyPart = async (idx: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPart(idx);
      setTimeout(() => setCopiedPart(null), 2200);
    } catch {
      // Fallback
    }
  };

  // Copy full uninterrupted posting pack
  const handleCopyAll = async () => {
    try {
      await navigator.clipboard.writeText(fullPostingPackText);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2400);
    } catch {
      // Fallback
    }
  };

  // Download creative asset
  const handleDownloadCreative = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Native share sheet if supported
  const handleNativeShare = async (asset: SocialAsset) => {
    if (!navigator.share) {
      setNativeShareStatus('Native sharing is not supported on this browser.');
      setTimeout(() => setNativeShareStatus(null), 3000);
      return;
    }

    const shareText = `*${asset.title}*\n\n${asset.caption}\n\n${(asset.hashtags || []).map(h => h.startsWith('#') ? h : `#${h}`).join(' ')}\n\n${asset.callToAction || ''}`;

    try {
      await navigator.share({
        title: asset.title,
        text: shareText,
        url: asset.generatedImageUrl || asset.generatedVideoUrl || hubPageUrl
      });
      setNativeShareStatus('Shared successfully via system sheet.');
      setTimeout(() => setNativeShareStatus(null), 3000);
    } catch (e: any) {
      if (e?.name !== 'AbortError') {
        setNativeShareStatus('Native share cancelled.');
        setTimeout(() => setNativeShareStatus(null), 2500);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Top Bar */}
        <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-black/[0.06] flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg sm:text-xl font-semibold text-[#1D1D1F] tracking-tight">
                  {scope === 'campaign' ? 'Campaign WhatsApp Posting Pack' : 'Today\'s WhatsApp Posting Pack'}
                </h2>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                  {scope === 'campaign' ? 'Campaign Scope' : 'Daily Scope'}
                </span>
              </div>
              <p className="text-xs text-[#6E6E73] mt-0.5">
                {companyName} · {scope === 'campaign' ? (campaign?.name || 'All Campaign Posts') : formatFriendlyDate(selectedDate)}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scope, Items Count & Destination Channels Summary Strip */}
        <div className="bg-[#F5F5F7] border-b border-black/[0.05] px-5 sm:px-7 py-3 text-xs text-[#1D1D1F] flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-lg border border-black/[0.06] font-medium text-[#1D1D1F]">
              <Calendar className="w-3.5 h-3.5 text-[#FF4500]" />
              <span>
                Scope: <strong>{scope === 'campaign' ? `Entire Campaign (${campaign?.name || 'All Dates'})` : `Today (${formatFriendlyDate(selectedDate)})`}</strong>
              </span>
            </div>

            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-lg border border-black/[0.06] font-medium text-[#1D1D1F]">
              <Layers className="w-3.5 h-3.5 text-blue-600" />
              <span>
                Content Items: <strong>{activeSelectedAssets.length}</strong> of {candidateAssets.length} selected
              </span>
            </div>

            <div className="flex items-center space-x-1.5 bg-white px-2.5 py-1 rounded-lg border border-black/[0.06] font-medium text-[#1D1D1F]">
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Destination Channels: <strong>{activeDestinationChannels.join(', ') || 'All Channels'}</strong>
              </span>
            </div>
          </div>

          {scope === 'campaign' && (
            <span className="text-[11px] text-[#6E6E73] font-medium">
              Grouped chronologically by planned date
            </span>
          )}
        </div>

        {/* Recipient Selection Bar (Send to company number vs Choose another chat) */}
        <div className="bg-white border-b border-black/[0.06] px-5 sm:px-7 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-semibold text-[#1D1D1F] flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              WhatsApp Recipient:
            </span>

            <div className="flex items-center space-x-1.5 bg-[#F5F5F7] p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setRecipientMode('choose_chat')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  recipientMode === 'choose_chat'
                    ? 'bg-white text-[#1D1D1F] shadow-2xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                Choose another chat
              </button>

              <button
                type="button"
                onClick={() => setRecipientMode('company_number')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
                  recipientMode === 'company_number'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                <Phone className="w-3 h-3" />
                <span>Send to company number</span>
              </button>
            </div>
          </div>

          {recipientMode === 'company_number' && (
            <div className="flex items-center space-x-2 text-xs">
              <span className="text-[#86868B]">Target number:</span>
              {isEditingPhone ? (
                <div className="flex items-center space-x-1.5">
                  <input
                    type="text"
                    value={companyPhoneInput}
                    onChange={(e) => setCompanyPhoneInput(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="border border-black/[0.15] rounded-lg px-2 py-0.5 text-xs font-mono w-40 focus:ring-1 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(false)}
                    className="px-2 py-0.5 bg-emerald-600 text-white rounded-md text-[11px] font-medium"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 font-mono text-[#1D1D1F] font-semibold bg-[#F5F5F7] px-2 py-0.5 rounded-lg border border-black/[0.04]">
                  <span>{companyPhoneInput || <em className="text-[#86868B] font-sans font-normal">None saved</em>}</span>
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className="text-[10px] text-[#FF4500] hover:underline font-sans ml-1"
                  >
                    {companyPhoneInput ? 'Edit' : 'Add number'}
                  </button>
                </div>
              )}
            </div>
          )}

          {recipientMode === 'choose_chat' && (
            <span className="text-[11px] text-[#86868B]">
              WhatsApp will let you choose any contact, team member, or group.
            </span>
          )}
        </div>

        {/* Plain Language Guidance & Access Banner */}
        <div className="bg-amber-50/70 border-b border-amber-200/60 px-5 sm:px-7 py-2.5 text-[11px] text-amber-900 flex flex-col sm:flex-row sm:items-center justify-between gap-2 shrink-0">
          <div className="flex items-center space-x-2">
            <Info className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>
              <strong>Manual sharing:</strong> Opens WhatsApp with your prepared text ready to send. You choose the recipient and press Send.
            </span>
          </div>
          <span className="text-amber-800 font-medium">
            Opening WhatsApp does not publish or mark content as sent.
          </span>
        </div>

        {/* Controls Bar: Filter Toggle & Tabs */}
        <div className="px-5 sm:px-7 py-3 border-b border-black/[0.06] bg-[#FBFBFC] flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Filter Mode Toggle if page filter is active and scope is today */}
          {isFiltered ? (
            <div className="flex items-center space-x-1.5 bg-white p-1 rounded-xl border border-black/[0.06] text-xs">
              <button
                type="button"
                onClick={() => setFilterMode('current')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterMode === 'current'
                    ? 'bg-[#1D1D1F] text-white shadow-2xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                Current selection ({assets.filter(a => a.targetDate === selectedDate && a.campaignId === activeCampaignFilter).length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  filterMode === 'all'
                    ? 'bg-[#1D1D1F] text-white shadow-2xs'
                    : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                }`}
              >
                All today ({assets.filter(a => a.targetDate === selectedDate).length})
              </button>
            </div>
          ) : (
            <div className="text-xs text-[#86868B] font-medium flex items-center space-x-1.5">
              <span>{scope === 'campaign' ? 'Campaign deliverables:' : 'Scheduled for today:'}</span>
              <span className="font-semibold text-[#1D1D1F]">{candidateAssets.length} total deliverables</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center space-x-1 bg-black/[0.03] p-1 rounded-xl text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('pack')}
              className={`px-3.5 py-1 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'pack'
                  ? 'bg-white text-[#1D1D1F] shadow-2xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Prepared Pack & WhatsApp</span>
              {messageParts.length > 1 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  {messageParts.length} parts
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('selection')}
              className={`px-3.5 py-1 rounded-lg font-medium transition-all flex items-center space-x-1.5 ${
                activeTab === 'selection'
                  ? 'bg-white text-[#1D1D1F] shadow-2xs'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Select Posts & Media ({activeSelectedAssets.length})</span>
            </button>
          </div>
        </div>

        {/* Modal Main Content Area */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">

          {/* TAB 1: PREPARED PACK & WHATSAPP CHUNKS */}
          {activeTab === 'pack' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Part selector if pack has multiple parts due to URL limits */}
              {messageParts.length > 1 && (
                <div className="bg-[#F5F5F7] p-3.5 rounded-2xl border border-black/[0.04] space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#1D1D1F] flex items-center space-x-1.5">
                      <span>Message partitioned into {messageParts.length} parts</span>
                      <span className="text-[#86868B] font-normal">(safeguards WhatsApp URL limit)</span>
                    </span>
                    <span className="text-[11px] text-[#6E6E73]">
                      Click each part to send sequentially
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    {messageParts.map((part, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePartIndex(idx)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center space-x-1.5 ${
                          activePartIndex === idx
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white text-[#1D1D1F] border border-black/[0.06] hover:bg-black/[0.02]'
                        }`}
                      >
                        <span>Part {idx + 1}</span>
                        <span className={`text-[10px] ${activePartIndex === idx ? 'text-emerald-100' : 'text-[#86868B]'}`}>
                          ({part.postIndices.length} {part.postIndices.length === 1 ? 'post' : 'posts'})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Toolbar for Current Part */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-black/[0.06] shadow-2xs">
                <div className="space-y-0.5">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-semibold text-[#1D1D1F]">
                      {currentPart.title}
                    </span>
                    <span className="text-[11px] font-mono text-[#86868B]">
                      {currentPart.text.length} chars · Formatted for WhatsApp
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6E6E73]">
                    Preserves complete Marathi/Hindi characters, emojis, bullet points, and destination channels.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => handleCopyPart(activePartIndex, currentPart.text)}
                    className="inline-flex items-center space-x-1.5 px-3 py-2 bg-white hover:bg-black/[0.03] border border-black/[0.08] text-[#1D1D1F] rounded-xl text-xs font-medium transition-colors shadow-2xs"
                  >
                    {copiedPart === activePartIndex ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-600 font-semibold">Part Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-[#86868B]" />
                        <span>Copy Part {activePartIndex + 1}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenWhatsApp(currentPart.text)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Open in WhatsApp</span>
                  </button>
                </div>
              </div>

              {/* Text Preview Box (Raw, exact preservation) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#86868B]">
                  <span className="font-semibold uppercase tracking-wider text-[10px]">
                    Message Text Preview
                  </span>
                  <span>Exact formatting sent to WhatsApp</span>
                </div>
                <div className="bg-[#1D1D1F] text-[#F5F5F7] rounded-2xl p-4 sm:p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto border border-black/[0.1] selection:bg-emerald-500 selection:text-white">
                  {currentPart.text}
                </div>
              </div>

              {/* Global "Copy All Posting Details" button */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-black/[0.06]">
                <div className="text-xs text-[#86868B]">
                  Need the full, unchunked posting pack for your clipboard or docs?
                </div>
                <button
                  type="button"
                  onClick={handleCopyAll}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2 bg-[#F5F5F7] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-medium rounded-xl transition-colors"
                >
                  {copiedAll ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Entire Posting Pack Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-[#86868B]" />
                      <span>Copy all posting details (All {activeSelectedAssets.length} deliverables)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: POST SELECTION & MEDIA ATTACHMENTS */}
          {activeTab === 'selection' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#1D1D1F]">
                    Selected Deliverables for Sharing
                  </h3>
                  <p className="text-xs text-[#6E6E73] mt-0.5">
                    Toggle deliverables to include or exclude from the prepared WhatsApp pack.
                  </p>
                </div>

                <div className="flex items-center space-x-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="text-[#FF4500] hover:underline font-medium"
                  >
                    Select all
                  </button>
                  <span className="text-[#86868B]">·</span>
                  <button
                    type="button"
                    onClick={handleDeselectAll}
                    className="text-[#86868B] hover:text-[#1D1D1F] font-medium"
                  >
                    Deselect all
                  </button>
                </div>
              </div>

              {nativeShareStatus && (
                <div className="p-3 bg-blue-50 text-blue-800 text-xs rounded-xl border border-blue-200">
                  {nativeShareStatus}
                </div>
              )}

              {/* List of Posts */}
              <div className="space-y-3">
                {candidateAssets.map((asset) => {
                  const isSelected = selectedIds.includes(asset.id);
                  const isApproved = asset.status === 'approved' || asset.status === 'published' || asset.productionStatus === 'APPROVED';
                  const isPublished = asset.status === 'published';
                  const hasMedia = Boolean(asset.generatedImageUrl || asset.generatedVideoUrl);
                  const primaryPlatform = asset.platform ? asset.platform.toUpperCase() : 'POST';
                  const secondaryPlatforms = (asset.secondaryPlatforms || []).map((p) => p.toUpperCase());
                  const allChannels = [primaryPlatform, ...secondaryPlatforms.filter((p) => p !== primaryPlatform)];

                  return (
                    <div
                      key={asset.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isSelected
                          ? 'bg-white border-black/[0.1] shadow-2xs'
                          : 'bg-[#F9F9FB] border-black/[0.04] opacity-75'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(asset.id)}
                            className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                          />
                          <div className="space-y-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-mono text-[10px] text-[#86868B] uppercase">
                                {asset.assetCode}
                              </span>
                              <span className="text-[11px] font-semibold text-[#1D1D1F]">
                                {allChannels.join(', ')} · {asset.format.replace('_', ' ')}
                              </span>
                              <span className="text-[11px] text-[#6E6E73]">
                                {formatFriendlyDate(asset.targetDate || selectedDate)} · {asset.postTimeIST || '11:30 AM'}
                              </span>

                              {/* Approval badge */}
                              {isApproved ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                                  Approved ✓
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-200/60">
                                  Draft / Review
                                </span>
                              )}

                              {/* Creative status badge */}
                              {hasMedia ? (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200/60">
                                  Media Ready
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                                  Missing Creative
                                </span>
                              )}

                              {isPublished && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  Marked as Posted
                                </span>
                              )}
                            </div>

                            <h4 className="text-sm font-semibold text-[#1D1D1F]">
                              {asset.title}
                            </h4>
                            <p className="text-xs text-[#6E6E73] line-clamp-2 leading-relaxed">
                              {asset.caption}
                            </p>
                          </div>
                        </div>

                        {/* Direct Deliverable Actions */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2 shrink-0">
                          {/* Separate "Mark as posted" button */}
                          {onUpdateStatus && (
                            <button
                              type="button"
                              onClick={() => onUpdateStatus(asset.id, isPublished ? 'approved' : 'published')}
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                                isPublished
                                  ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                  : 'bg-zinc-100 hover:bg-emerald-50 hover:text-emerald-700 text-[#6E6E73]'
                              }`}
                              title="Toggles publication status without sending"
                            >
                              {isPublished ? 'Unmark posted' : 'Mark as posted'}
                            </button>
                          )}

                          {/* Download creative if available */}
                          {asset.generatedImageUrl && (
                            <button
                              type="button"
                              onClick={() => handleDownloadCreative(asset.generatedImageUrl!, `${asset.assetCode || 'creative'}.jpg`)}
                              className="p-1.5 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-lg transition-colors"
                              title="Download creative image"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}

                          {/* Native file share on mobile/supported browsers */}
                          {typeof navigator !== 'undefined' && 'share' in navigator && (
                            <button
                              type="button"
                              onClick={() => handleNativeShare(asset)}
                              className="p-1.5 text-[#6E6E73] hover:text-emerald-600 hover:bg-black/[0.04] rounded-lg transition-colors"
                              title="Share via device system share sheet"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-5 sm:px-7 py-4 border-t border-black/[0.06] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-[#86868B] flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span>
              {activeSelectedAssets.length} deliverable{activeSelectedAssets.length === 1 ? '' : 's'} included in WhatsApp pack
            </span>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors rounded-xl"
            >
              Close
            </button>

            <button
              type="button"
              onClick={() => handleOpenWhatsApp(currentPart.text)}
              disabled={activeSelectedAssets.length === 0}
              className="inline-flex items-center space-x-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all active:scale-95 disabled:opacity-40"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>
                {scope === 'campaign'
                  ? `Share entire campaign (${activeSelectedAssets.length}) to WhatsApp`
                  : `Share today's posts (${activeSelectedAssets.length}) to WhatsApp`}
              </span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
