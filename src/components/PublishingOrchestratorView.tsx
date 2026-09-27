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
  assets,
}) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id ?? '');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    '[INIT] Apex Autonoma Publishing Dispatcher initialized.',
    '[QUEUE] 22 assets indexed in Content Master Sheet database.',
    '[READY] Standing by for dispatch triggers.'
  ]);

  const activeAsset = assets.find(a => a.id === selectedAssetId) || assets[0];

  const handleRunPublishSimulation = () => {
    if (!activeAsset) return;
    setIsSimulating(true);
    setConsoleLogs([
      `[DISPATCH] Starting autonomous publishing pipeline for ${activeAsset.assetCode}...`,
      `[AUTH] Validating OAuth tokens for ${activeAsset.platform.toUpperCase()}... OK`,
      `[AUDIT] Checking Apex Social Design System compliance... 100% SPEC VERIFIED`,
      `[MEDIA] Preparing public HTTPS CDN asset containers... OK`,
      `[PAYLOAD] Generating API payload for ${activeAsset.platform.toUpperCase()}...`,
      `[METRIC] Hook virality index: ${activeAsset.viralityScore}/100. Target reach: ${activeAsset.targetReach.toLocaleString()}`,
      `[SYNC] Updating Google Sheets Content Master database status -> PUBLISHED... OK`,
      `[SUCCESS] Asset ${activeAsset.assetCode} successfully published! Live on ${activeAsset.platform.toUpperCase()}`
    ]);
    setTimeout(() => {
      setIsSimulating(false);
    }, 1800);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Editorial Header */}
      <div className="bg-white rounded-3xl border border-black/[0.06] p-4 sm:p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-[#86868B]">
              <Send className="w-3.5 h-3.5 text-[#FF4500]" />
              <span className="font-medium text-[#1D1D1F]">Multi-Platform Dispatch</span>
              <span>·</span>
              <span>Official Developer APIs</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
              Publishing Orchestrator
            </h1>
            <p className="text-xs sm:text-sm text-[#6E6E73] mt-1 max-w-2xl leading-relaxed">
              Connects Apex Engineering to Instagram, YouTube, LinkedIn, X, and your Google Sheets database. Built on developer APIs with zero server cost.
            </p>
          </div>

          <button
            onClick={handleRunPublishSimulation}
            disabled={isSimulating}
            className="w-full sm:w-auto justify-center flex items-center space-x-2 px-5 py-2.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white font-medium text-xs rounded-xl shadow-sm transition-all disabled:opacity-50 self-start lg:self-center active:scale-95 min-h-[40px]"
          >
            <Play className="w-3.5 h-3.5 fill-white shrink-0" />
            <span>{isSimulating ? 'Dispatching to cloud…' : 'Simulate auto-publish'}</span>
          </button>
        </div>
      </div>

      {/* 4 Connected Channels Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { name: 'Instagram Professional', endpoint: 'Meta Graph API v19.0', cost: '₹0 (Free tier)', status: 'Connected', desc: 'Direct carousel & video reel container publishing' },
          { name: 'YouTube Studio', endpoint: 'YouTube Data API v3', cost: '₹0 (Free tier)', status: 'Connected', desc: 'Direct 9:16 Shorts & 4K deep-dive video inserts' },
          { name: 'LinkedIn Company', endpoint: 'LinkedIn Posts v2 API', cost: '₹0 (Free tier)', status: 'Connected', desc: 'Multi-image carousels & B2B thought leadership' },
          { name: 'Google Sheets DB', endpoint: 'Apps Script Webhook', cost: '₹0 (Free forever)', status: 'Connected', desc: 'Real-time master database sync & lead logging' },
        ].map((item, idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-[#1D1D1F]">{item.name}</span>
              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                {item.status}
              </span>
            </div>
            <div className="text-[11px] font-mono text-[#FF4500]">{item.endpoint}</div>
            <p className="text-xs text-[#6E6E73] leading-relaxed">{item.desc}</p>
            <div className="text-[11px] text-[#86868B] pt-2 border-t border-black/[0.04]">
              Cost: <strong className="text-[#1D1D1F] font-medium">{item.cost}</strong>
            </div>
          </div>
        ))}
      </div>

      {/* Queue & Console Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Queue Inspector */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[#1D1D1F] text-sm font-semibold flex items-center space-x-2">
              <Clock className="w-4 h-4 text-[#FF4500]" />
              <span>Scheduled Dispatch Queue</span>
            </h3>
            <span className="text-xs text-[#86868B]">Select to inspect</span>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {assets.slice(0, 8).map((asset) => (
              <div
                key={asset.id}
                onClick={() => setSelectedAssetId(asset.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between text-xs ${
                  selectedAssetId === asset.id
                    ? 'bg-orange-50/50 border-[#FF4500]/40 shadow-xs'
                    : 'bg-[#FBFBFD] border-black/[0.04] hover:bg-neutral-50 hover:border-black/[0.08]'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[#FF4500] font-mono font-semibold">{asset.assetCode}</span>
                    <span className="text-[#1D1D1F] font-medium">{asset.targetDate}</span>
                    <span className="text-[#86868B]">{asset.postTimeIST}</span>
                  </div>
                  <div className="text-xs text-[#6E6E73] mt-1 truncate max-w-xs">
                    {asset.title}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] capitalize px-2 py-0.5 rounded-md bg-white border border-black/[0.06] text-[#6E6E73] font-medium">
                    {asset.platform}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: API Terminal & Payload Generator */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-black/[0.06] p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2 text-xs font-semibold text-[#1D1D1F]">
                <Terminal className="w-4 h-4 text-[#FF4500]" />
                <span>Dispatcher Diagnostic Feed</span>
              </div>
              <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {isSimulating ? 'Active' : 'Idle'}
              </span>
            </div>

            {/* Live Terminal Log */}
            <div className="p-3.5 bg-[#1D1D1F] rounded-xl text-neutral-200 font-mono text-[11px] space-y-1 h-52 overflow-y-auto">
              {consoleLogs.map((log, i) => (
                <div key={i} className="leading-relaxed">
                  <span className="text-[#FF4500]">&gt;</span> {log}
                </div>
              ))}
            </div>
          </div>

          {/* Formatted API Payload Preview */}
          <div className="pt-3 border-t border-black/[0.06] space-y-2">
            <div className="text-[11px] font-medium text-[#86868B]">
              Generated Payload ({activeAsset?.platform}):
            </div>
            <pre className="p-3.5 bg-[#FBFBFD] rounded-xl border border-black/[0.06] text-[11px] font-mono text-[#1D1D1F] overflow-x-auto max-h-32">
{JSON.stringify({
  action: "PUBLISH_AUTONOMOUS_ASSET",
  assetCode: activeAsset?.assetCode,
  platform: activeAsset?.platform,
  targetPublishTime: `${activeAsset?.targetDate}T11:30:00+05:30`,
  caption: activeAsset?.caption.slice(0, 100) + "…",
  hashtags: activeAsset?.hashtags,
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
