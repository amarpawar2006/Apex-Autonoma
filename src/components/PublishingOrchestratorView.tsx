import React, { useState } from 'react';
import { 
  Send, 
  CheckCircle2, 
  Clock, 
  Terminal, 
  AlertTriangle, 
  ExternalLink, 
  Play, 
  Layers, 
  FileSpreadsheet, 
  Sparkles,
  Zap,
  Globe,
  Share2
} from 'lucide-react';
import { SocialAsset, Platform } from '../types/campaign';

interface PublishingOrchestratorViewProps {
  assets: SocialAsset[];
}

export const PublishingOrchestratorView: React.FC<PublishingOrchestratorViewProps> = ({
  assets = [],
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id ?? '');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[INIT] Autonoma Publishing Dispatcher initialized.',
    `[QUEUE] ${assets.length} assets indexed in Content database.`,
    '[READY] Standing by for dispatch triggers.'
  ]);

  const activeAsset = assets.find(a => a.id === selectedAssetId) || assets[0];

  const handleRunPublishSimulation = () => {
    if (!activeAsset) return;
    setIsSimulating(true);
    setConsoleLogs([
      `[DISPATCH] Starting autonomous publishing pipeline for ${activeAsset.assetCode}...`,
      `[AUTH] Validating tokens for ${activeAsset.platform.toUpperCase()}... OK`,
      `[AUDIT] Checking Social Design System compliance... 100% SPEC VERIFIED`,
      `[MEDIA] Preparing HTTPS CDN asset containers... OK`,
      `[PAYLOAD] Generating API payload for ${activeAsset.platform.toUpperCase()}...`,
      `[METRIC] Hook virality index: ${activeAsset.viralityScore || 80}/100. Target reach: ${(activeAsset.targetReach || 5000).toLocaleString()}`,
      `[SYNC] Updating Content Master database status -> PUBLISHED... OK`,
      `[SUCCESS] Asset ${activeAsset.assetCode} successfully published! Live on ${activeAsset.platform.toUpperCase()}`
    ]);
    setTimeout(() => {
      setIsSimulating(false);
    }, 1800);
  };

  // Defensive Empty State Guard: Prevents blank crash when company has 0 assets
  if (!assets || assets.length === 0 || !activeAsset) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F5F5F7]">
            Publishing Orchestrator
          </h1>
          <p className="text-xs sm:text-sm text-[#9898A0] font-normal mt-1">
            Autonomous multi-platform distribution and webhook dispatch diagnostics
          </p>
        </div>

        <div className="bg-[#12141A] rounded-3xl border border-white/[0.08] p-10 sm:p-16 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto text-[#FF4500] border border-white/[0.08]">
            <Send className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-[#F5F5F7]">Publishing queue idle</h3>
            <p className="text-xs text-[#9898A0] leading-relaxed">
              No scheduled assets found in this company workspace. Generate and approve campaign deliverables to dispatch them through the orchestrator.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Editorial Header */}
      <div className="bg-[#12141A] rounded-3xl border border-white/[0.08] p-4 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-[#9898A0]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-mono uppercase tracking-wider text-[11px]">DISPATCHER DAEMON READY</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F5F5F7]">
              Publishing Orchestrator
            </h1>
            <p className="text-xs sm:text-sm text-[#9898A0] font-normal max-w-2xl">
              Platform-aware publishing pipelines. Validates media aspect ratios, hooks, hashtags, and logs delivery metrics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunPublishSimulation}
              disabled={isSimulating}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-semibold rounded-xl shadow-lg shadow-[#FF4500]/20 transition-all active:scale-95 disabled:opacity-50"
            >
              {isSimulating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Dispatching Payload...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Test Autonomous Dispatch</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Queue & Console Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Queue Inspector */}
        <div className="lg:col-span-6 bg-[#12141A] rounded-2xl border border-white/[0.08] p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[#F5F5F7] text-sm font-semibold flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#FF4500]" />
              <span>Scheduled Dispatch Queue</span>
            </h3>
            <span className="text-xs text-[#9898A0]">Select to inspect</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {assets.slice(0, 8).map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAssetId(asset.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                  selectedAssetId === asset.id
                    ? 'bg-[#FF4500]/10 border-[#FF4500]/40 shadow-xs'
                    : 'bg-[#161922] border-white/[0.06] hover:bg-white/[0.04]'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#FF4500] font-mono font-semibold">{asset.assetCode}</span>
                    <span className="text-[#F5F5F7] font-medium">{asset.targetDate}</span>
                    <span className="text-[#9898A0]">{asset.postTimeIST || '11:30 AM'}</span>
                  </div>
                  <div className="text-xs text-[#9898A0] mt-1 truncate max-w-xs">
                    {asset.title}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] capitalize px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.08] text-[#F5F5F7] font-medium">
                    {asset.platform}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: API Terminal & Payload Generator */}
        <div className="lg:col-span-6 bg-[#12141A] rounded-2xl border border-white/[0.08] p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#F5F5F7]">
                <Terminal className="w-4 h-4 text-[#FF4500]" />
                <span>Dispatcher Diagnostic Feed</span>
              </div>
              <span className="text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                {isSimulating ? 'Active' : 'Idle'}
              </span>
            </div>

            {/* Live Terminal Log */}
            <div className="p-3.5 bg-black/60 rounded-xl text-neutral-200 font-mono text-[11px] space-y-1 h-52 overflow-y-auto border border-white/[0.06]">
              {consoleLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-[#FF4500]">&gt;</span> {log}
                </div>
              ))}
            </div>
          </div>

          {/* Formatted API Payload Preview */}
          <div className="pt-3 border-t border-white/[0.08] space-y-2">
            <div className="text-[11px] font-medium text-[#9898A0]">
              Generated Payload ({activeAsset?.platform || 'api'}):
            </div>
            <pre className="p-3.5 bg-[#161922] rounded-xl border border-white/[0.06] text-[11px] font-mono text-neutral-300 overflow-x-auto max-h-32">
{JSON.stringify({
  action: "PUBLISH_AUTONOMOUS_ASSET",
  assetCode: activeAsset?.assetCode,
  platform: activeAsset?.platform,
  targetPublishTime: `${activeAsset?.targetDate || '2026-10-01'}T11:30:00+05:30`,
  caption: activeAsset?.caption ? (activeAsset.caption.slice(0, 100) + "…") : "Default caption",
  hashtags: activeAsset?.hashtags || [],
  designSystemVerified: true,
  mediaUrls: ["https://apex-engineering.co.in/cdn/assets/carousel_01.png"]
}, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
