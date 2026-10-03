import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Clock, 
  Copy, 
  ExternalLink, 
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  Check,
  ArrowUpRight
} from 'lucide-react';
import { SocialAsset, PostStatus } from '../types/campaign';

interface PostDetailModalProps {
  asset: SocialAsset | null;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: PostStatus) => void;
  onOpenStudioWithAsset: (assetId: string) => void;
  onOpenProductionModal?: (asset: SocialAsset) => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  asset,
  onClose,
  onUpdateStatus,
  onOpenStudioWithAsset,
  onOpenProductionModal,
}) => {
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [editingSchedule, setEditingSchedule] = useState<boolean>(false);
  const [targetDate, setTargetDate] = useState<string>(asset?.targetDate || '');
  const [postTime, setPostTime] = useState<string>(asset?.postTimeIST || '11:30 AM');
  const [savingSchedule, setSavingSchedule] = useState<boolean>(false);
  const [scheduleSaved, setScheduleSaved] = useState<boolean>(false);

  if (!asset) return null;

  const copyFullCaption = () => {
    navigator.clipboard.writeText(`${asset.caption}\n\n${asset.hashtags.map(h => '#' + h).join(' ')}`);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  const handleSaveSchedule = async () => {
    setSavingSchedule(true);
    try {
      asset.targetDate = targetDate;
      asset.postTimeIST = postTime;
      // Persist to server store and local cache
      const { autonomaDataService } = await import('../services/autonomaDataService');
      await autonomaDataService.updateAsset(asset);
      setScheduleSaved(true);
      setTimeout(() => {
        setScheduleSaved(false);
        setEditingSchedule(false);
      }, 1200);
    } catch (e) {
      console.warn('Schedule update note:', e);
      setEditingSchedule(false);
    } finally {
      setSavingSchedule(false);
    }
  };

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl max-w-2xl w-full p-4 sm:p-7 space-y-6 max-h-[92vh] overflow-y-auto text-[#1D1D1F] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
          <div className="flex items-center space-x-2 text-xs">
            <span className="font-mono font-semibold text-[#FF4500]">
              {asset.assetCode.replace(/^APEX-/, 'AUTO-')}
            </span>
            <span className="text-[#86868B]">·</span>
            <span className="capitalize font-medium text-[#1D1D1F]">
              {asset.platform}
            </span>
            <span className="text-[#86868B]">·</span>
            <span className="text-[#6E6E73]">
              {asset.format.replace('_', ' ')}
            </span>
          </div>

          <button 
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-xl transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Hook */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight text-[#1D1D1F]">
            {asset.title}
          </h2>
          <div className="p-4 bg-[#FBFBFD] rounded-2xl border border-black/[0.06] text-xs text-[#1D1D1F]">
            <span className="font-semibold text-[#FF4500] block mb-0.5">Hook:</span>
            <span className="italic leading-relaxed">"{asset.hook}"</span>
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 bg-[#FBFBFD] rounded-2xl border border-black/[0.04] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[#86868B] text-[11px] block">Scheduled Post</span>
              <button
                onClick={() => setEditingSchedule(!editingSchedule)}
                className="text-[10px] text-[#FF4500] hover:underline font-semibold"
              >
                {editingSchedule ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editingSchedule ? (
              <div className="space-y-1.5 pt-1">
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-black/[0.1] bg-white outline-none"
                />
                <input
                  type="text"
                  placeholder="e.g. 09:45 AM"
                  value={postTime}
                  onChange={(e) => setPostTime(e.target.value)}
                  className="w-full text-xs font-semibold px-2 py-1 rounded-lg border border-black/[0.1] bg-white outline-none"
                />
                <button
                  onClick={handleSaveSchedule}
                  disabled={savingSchedule}
                  className="w-full py-1 bg-[#FF4500] text-white rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1"
                >
                  {savingSchedule ? 'Saving…' : scheduleSaved ? 'Saved!' : 'Save'}
                </button>
              </div>
            ) : (
              <div>
                <span className="font-semibold text-[#1D1D1F] mt-0.5 block">{targetDate}</span>
                <span className="text-[10px] text-[#86868B] flex items-center gap-1">
                  <span>{postTime}</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-black/[0.04] font-mono">IST</span>
                </span>
              </div>
            )}
          </div>

          <div className="p-3.5 bg-[#FBFBFD] rounded-2xl border border-black/[0.04]">
            <span className="text-[#86868B] text-[11px] block">AI Content Score</span>
            <span className="font-semibold text-[#FF4500] mt-0.5 block">
              {(asset.viralityScore || (asset as any).aiContentScore) ? `${asset.viralityScore || (asset as any).aiContentScore} / 100` : 'Not available'}
            </span>
            <span className="text-[10px] text-[#86868B]">Opportunity index</span>
          </div>

          <div className="p-3.5 bg-[#FBFBFD] rounded-2xl border border-black/[0.04]">
            <span className="text-[#86868B] text-[11px] block">Est. Reach</span>
            <span className="font-semibold text-[#1D1D1F] mt-0.5 block">{asset.estimatedImpressions.toLocaleString()}</span>
            <span className="text-[10px] text-emerald-600 font-medium">+{asset.expectedLeads} leads</span>
          </div>

          <div className="p-3.5 bg-[#FBFBFD] rounded-2xl border border-black/[0.04]">
            <span className="text-[#86868B] text-[11px] block">Status</span>
            <select
              value={asset.status}
              onChange={(e) => onUpdateStatus(asset.id, e.target.value as PostStatus)}
              className="mt-1 bg-white text-[#1D1D1F] font-semibold text-[11px] px-2 py-0.5 rounded-lg border border-black/[0.08] focus:outline-none cursor-pointer"
            >
              <option value="draft">Draft</option>
              <option value="in_review">In review</option>
              <option value="approved">Approved</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {/* Caption */}
        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-[#86868B] font-medium">Full Caption & Hashtags</span>
            <button
              onClick={copyFullCaption}
              className="text-[#FF4500] hover:underline font-medium flex items-center space-x-1"
            >
              {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCaption ? 'Copied' : 'Copy caption'}</span>
            </button>
          </div>
          <div className="p-4 bg-[#F2F2F7] rounded-2xl text-[#1D1D1F] whitespace-pre-line leading-relaxed max-h-48 overflow-y-auto font-normal">
            {asset.caption}
            <div className="pt-3 text-[#6E6E73]">
              {asset.hashtags.map((h) => '#' + h).join(' ')}
            </div>
          </div>
        </div>

        {/* Share & Approval Quick Actions */}
        <div className="rounded-2xl border border-black/[0.06] bg-[#FBFBFD] p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#1D1D1F]">Share for Client Approval</span>
            <span className="text-[10px] text-[#86868B]">1-CLICK DISPATCH</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                `*Autonoma Creative for Approval*\n\n*${asset.title}* (${asset.platform.toUpperCase()})\n\n"${asset.hook}"\n\n${asset.caption}\n\n${asset.hashtags.map(h => '#' + h).join(' ')}\n\nStatus: ${asset.status.toUpperCase()}`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-2xs transition-all active:scale-95"
            >
              <span>Share via WhatsApp</span>
            </a>

            <a
              href={`mailto:?subject=${encodeURIComponent(`[Creative Approval] ${asset.title} (${asset.platform})`)}&body=${encodeURIComponent(
                `Hi,\n\nPlease review the following creative drafted in Autonoma for ${asset.platform.toUpperCase()}:\n\nTITLE: ${asset.title}\nHOOK: ${asset.hook}\nFORMAT: ${asset.format}\nTARGET DATE: ${asset.targetDate}\n\nCAPTION:\n${asset.caption}\n\nHASHTAGS:\n${asset.hashtags.map(h => '#' + h).join(' ')}\n\nSTATUS: ${asset.status}\n\nReply with approval or requested modifications.`
              )}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-black/[0.08] bg-white hover:bg-black/[0.03] text-[#1D1D1F] text-xs font-semibold shadow-2xs transition-all"
            >
              <span>Prefilled Email Draft</span>
            </a>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-black/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <button
            onClick={() => {
              onClose();
              onOpenStudioWithAsset(asset.id);
            }}
            className="w-full sm:w-auto justify-center px-3.5 py-2.5 bg-white hover:bg-neutral-50 text-[#1D1D1F] border border-black/[0.08] text-xs font-medium rounded-xl shadow-xs transition-colors flex items-center space-x-1.5 min-h-[40px]"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Open in Studio</span>
          </button>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            {onOpenProductionModal && (
              <button
                onClick={() => {
                  onClose();
                  onOpenProductionModal(asset);
                }}
                className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl shadow-xs transition-all flex items-center space-x-1.5 active:scale-95 min-h-[40px]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Production modal</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-medium rounded-xl transition-colors min-h-[40px]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
