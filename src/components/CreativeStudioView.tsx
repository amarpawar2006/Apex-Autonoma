import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  CheckCircle2,
  Layers,
  Copy,
  Check,
  Sparkles,
  Palette
} from 'lucide-react';
import { SocialAsset, PostStatus } from '../types/campaign';
import { BrandDesignSystem } from '../types/auth';
import { autonomaDataService } from '../services/autonomaDataService';

interface CreativeStudioViewProps {
  assets: SocialAsset[];
  onUpdateStatus: (id: string, newStatus: PostStatus) => void;
  selectedAssetId?: string;
  onOpenAiGenerator?: () => void;
}

const DEFAULT_BRAND: BrandDesignSystem = {
  primaryColor: '#1D1D1F',
  secondaryColor: '#6B7280',
  accentColor: '#6B7280',
  backgroundColor: '#FFFFFF',
  textColor: '#1D1D1F',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  visualStyleNotes: 'Clean, professional, brand-neutral editorial design.'
};

const normalizeHex = (value: string | undefined, fallback: string) =>
  /^#[0-9a-fA-F]{6}$/.test(value || '') ? (value as string) : fallback;

const hexToRgba = (hex: string, alpha: number) => {
  const clean = hex.replace('#', '');
  const n = parseInt(clean, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const isDark = (hex: string) => {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return false;
  const n = parseInt(clean, 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
};

export const CreativeStudioView: React.FC<CreativeStudioViewProps> = ({
  assets = [],
  onUpdateStatus,
  selectedAssetId,
  onOpenAiGenerator
}) => {
  const [activeAssetId, setActiveAssetId] = useState<string>(selectedAssetId || (assets[0]?.id ?? ''));
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [companyName, setCompanyName] = useState('Your Brand');
  const [brand, setBrand] = useState<BrandDesignSystem>(DEFAULT_BRAND);
  const [brandLoaded, setBrandLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;
    autonomaDataService.getCompanyProfile()
      .then((result) => {
        if (!mounted) return;
        const profile = result.profile || result.company?.profile;
        setCompanyName(result.company?.name || 'Your Brand');
        setBrand({ ...DEFAULT_BRAND, ...(profile?.brandDesignSystem || {}) });
        setBrandLoaded(true);
      })
      .catch(() => {
        if (mounted) setBrandLoaded(true);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (selectedAssetId && assets.some((a) => a.id === selectedAssetId)) {
      setActiveAssetId(selectedAssetId);
    } else if (assets.length > 0 && !assets.some((a) => a.id === activeAssetId)) {
      setActiveAssetId(assets[0].id);
    }
  }, [assets, selectedAssetId, activeAssetId]);

  const activeAsset = assets.find((a) => a.id === activeAssetId) || assets[0];

  useEffect(() => {
    setCurrentSlideIndex(0);
    setCurrentSceneIndex(0);
    setPlaybackTime(0);
    setIsPlaying(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, [activeAssetId]);

  useEffect(() => {
    if (!isPlaying) return;
    const interval = window.setInterval(() => {
      setPlaybackTime((prev) => {
        const next = prev + 0.5;
        if (next >= 30) {
          setIsPlaying(false);
          return 0;
        }
        const sceneCount = Math.max(1, activeAsset?.videoScenes?.length || 1);
        const bucket = 30 / sceneCount;
        setCurrentSceneIndex(Math.min(sceneCount - 1, Math.floor(next / bucket)));
        return next;
      });
    }, 500);
    return () => window.clearInterval(interval);
  }, [isPlaying, activeAsset?.videoScenes?.length]);

  const palette = useMemo(() => {
    const primary = normalizeHex(brand.primaryColor, '#1D1D1F');
    const secondary = normalizeHex(brand.secondaryColor, '#6B7280');
    const accent = normalizeHex(brand.accentColor, primary);
    const background = normalizeHex(brand.backgroundColor, '#FFFFFF');
    const text = normalizeHex(brand.textColor, '#1D1D1F');
    return {
      primary,
      secondary,
      accent,
      background,
      text,
      muted: hexToRgba(text, 0.64),
      border: hexToRgba(text, 0.14),
      soft: hexToRgba(primary, 0.10),
      headingFont: brand.headingFont || 'Inter',
      bodyFont: brand.bodyFont || 'Inter'
    };
  }, [brand]);

  const speakCurrentScene = (text: string) => {
    if (isMuted || !('speechSynthesis' in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlay = () => {
    if (!activeAsset) return;
    if (!isPlaying) {
      setIsPlaying(true);
      const scene = activeAsset.videoScenes?.[currentSceneIndex];
      if (scene) speakCurrentScene(scene.narrationVoiceover);
    } else {
      setIsPlaying(false);
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  };

  const handleRestart = () => {
    if (!activeAsset) return;
    setPlaybackTime(0);
    setCurrentSceneIndex(0);
    setIsPlaying(true);
    const scene = activeAsset.videoScenes?.[0];
    if (scene) speakCurrentScene(scene.narrationVoiceover);
  };

  if (!assets.length || !activeAsset) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">Creative Studio</h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6E6E73]">Company-aware preview of campaign deliverables using the saved Brand Design System.</p>
        </div>
        <div className="rounded-3xl border border-black/[0.07] bg-white p-10 sm:p-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-black/[0.04] text-[#6E6E73]">
            <Layers className="h-7 w-7" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-[#1D1D1F]">No deliverables in this workspace</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#6E6E73]">Create a campaign first. New previews will use this company's saved colors, typography and creative direction.</p>
          {onOpenAiGenerator && (
            <button onClick={onOpenAiGenerator} className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-[#FF4500] px-4 py-2 text-xs font-semibold text-white">
              <Sparkles className="h-3.5 w-3.5" /> Create First Campaign
            </button>
          )}
        </div>
      </div>
    );
  }

  const isVideo = activeAsset.format === 'reel_short' || activeAsset.format === 'short_video';
  const slides = activeAsset.slides || [];
  const currentSlide = slides[currentSlideIndex] || slides[0];
  const scenes = activeAsset.videoScenes || [];
  const currentScene = scenes[currentSceneIndex] || scenes[0];
  const isApproved = activeAsset.status === 'approved' || activeAsset.status === 'scheduled';
  const previewTextColor = palette.text;
  const inverseText = isDark(palette.primary) ? '#FFFFFF' : '#111111';

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      <div className="flex flex-col gap-4 pt-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">Creative Studio</h1>
            <span className="inline-flex items-center gap-1 rounded-full border border-black/[0.07] bg-white px-2 py-1 text-[10px] font-medium text-[#6E6E73]">
              <Palette className="h-3 w-3" /> {brandLoaded ? 'Brand synced' : 'Loading brand…'}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-[#6E6E73]">Live preview for <strong className="text-[#1D1D1F]">{companyName}</strong> using the saved Brand Design System.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-black/[0.07] bg-white px-3.5 py-2 text-xs shadow-sm">
            <span className="text-[#86868B]">Asset:</span>
            <select value={activeAsset.id} onChange={(e) => setActiveAssetId(e.target.value)} className="max-w-[260px] bg-transparent font-medium text-[#1D1D1F] outline-none">
              {assets.map((a) => <option key={a.id} value={a.id}>[{a.assetCode.replace(/^APEX-/, 'AUTO-')}] {a.title.slice(0, 42)}</option>)}
            </select>
          </div>
          <button
            onClick={() => onUpdateStatus(activeAsset.id, isApproved ? 'in_review' : 'approved')}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${isApproved ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'bg-[#1D1D1F] text-white'}`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> {isApproved ? 'Approved ✓' : 'Approve Asset'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
        <div className="lg:col-span-7 rounded-3xl border border-black/[0.07] bg-white p-4 sm:p-8 shadow-sm">
          <div className="mx-auto mb-4 flex w-full max-w-md items-center justify-between text-xs text-[#6E6E73]">
            <span className="flex items-center gap-1.5 font-medium text-[#1D1D1F]"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: palette.accent }} />{activeAsset.format.replace(/_/g, ' ')}</span>
            <span>{isVideo ? '1080 × 1920 (9:16)' : '1080 × 1350 (4:5)'}</span>
          </div>

          {isVideo ? (
            <div
              className="relative mx-auto flex aspect-[9/16] w-full max-w-[330px] flex-col justify-between overflow-hidden rounded-[28px] border shadow-2xl"
              style={{ backgroundColor: palette.background, color: previewTextColor, borderColor: palette.border, fontFamily: `${palette.bodyFont}, Arial, sans-serif` }}
            >
              {activeAsset.generatedImageUrl && <img src={activeAsset.generatedImageUrl} alt="Generated creative" className="absolute inset-0 h-full w-full object-cover opacity-25" />}
              <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 90% 5%, ${hexToRgba(palette.accent, 0.18)}, transparent 45%)` }} />
              <div className="relative z-10 flex items-center justify-between p-5 text-[10px] font-medium">
                <span className="rounded-full px-2.5 py-1" style={{ backgroundColor: palette.primary, color: inverseText }}>{companyName.toUpperCase()}</span>
                <span style={{ color: palette.muted }}>{playbackTime.toFixed(1)}s / 30.0s</span>
              </div>
              <div className="relative z-10 px-6 text-center">
                <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-semibold" style={{ backgroundColor: palette.soft, color: palette.primary }}>SCENE {currentSceneIndex + 1}</span>
                <h2 className="mt-4 text-2xl font-bold leading-tight" style={{ color: palette.text, fontFamily: `${palette.headingFont}, Arial, sans-serif` }}>{currentScene?.hookText || activeAsset.hook}</h2>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: palette.muted }}>{currentScene?.onScreenCaption || activeAsset.caption.slice(0, 150)}</p>
              </div>
              <div className="relative z-10 p-5">
                <div className="rounded-2xl border p-4 text-xs leading-relaxed" style={{ backgroundColor: hexToRgba(palette.text, isDark(palette.background) ? 0.08 : 0.035), borderColor: palette.border, color: palette.text }}>
                  <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide" style={{ color: palette.accent }}>Visual direction</span>
                  {currentScene?.visualFocus || brand.visualStyleNotes || activeAsset.posterVisualPrompt || 'Follow the saved brand system.'}
                </div>
                <div className="mt-4 h-1 overflow-hidden rounded-full" style={{ backgroundColor: palette.border }}><div className="h-full transition-all" style={{ width: `${(playbackTime / 30) * 100}%`, backgroundColor: palette.accent }} /></div>
              </div>
            </div>
          ) : (
            <div
              className="relative mx-auto flex aspect-[4/5] w-full max-w-[420px] flex-col overflow-hidden rounded-[28px] border p-7 shadow-2xl"
              style={{ backgroundColor: palette.background, color: previewTextColor, borderColor: palette.border, fontFamily: `${palette.bodyFont}, Arial, sans-serif` }}
            >
              {activeAsset.generatedImageUrl && <img src={activeAsset.generatedImageUrl} alt="Generated creative" className="absolute inset-0 h-full w-full object-cover opacity-20" />}
              <div className="absolute inset-0" style={{ background: `radial-gradient(circle at 88% 8%, ${hexToRgba(palette.accent, 0.16)}, transparent 42%)` }} />
              <div className="relative z-10 flex items-center justify-between border-b pb-4" style={{ borderColor: palette.border }}>
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black" style={{ backgroundColor: palette.primary, color: inverseText }}>{companyName.slice(0, 1).toUpperCase()}</span>
                  <span className="text-xs font-semibold tracking-wide" style={{ color: palette.text }}>{companyName.toUpperCase()}</span>
                </div>
                <span className="text-xs font-semibold" style={{ color: palette.accent }}>{slides.length ? `${currentSlideIndex + 1}/${slides.length}` : activeAsset.platform.toUpperCase()}</span>
              </div>

              <div className="relative z-10 my-auto py-6">
                <span className="inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wide" style={{ backgroundColor: palette.soft, color: palette.primary }}>{currentSlide?.badge || activeAsset.strategicPurpose || 'CAMPAIGN CREATIVE'}</span>
                <h2 className="mt-5 text-3xl font-bold leading-[1.05]" style={{ color: palette.text, fontFamily: `${palette.headingFont}, Arial, sans-serif` }}>{currentSlide?.headline || activeAsset.title}</h2>
                {(currentSlide?.subtext || activeAsset.hook) && <p className="mt-4 text-sm leading-relaxed" style={{ color: palette.muted }}>{currentSlide?.subtext || activeAsset.hook}</p>}
                {Array.isArray(currentSlide?.body) && currentSlide.body.length > 0 && (
                  <div className="mt-5 space-y-2">
                    {currentSlide.body.slice(0, 3).map((item, idx) => <div key={idx} className="rounded-xl border px-3 py-2 text-xs" style={{ borderColor: palette.border, backgroundColor: hexToRgba(palette.text, isDark(palette.background) ? 0.07 : 0.025), color: palette.text }}>{String(item)}</div>)}
                  </div>
                )}
              </div>

              <div className="relative z-10 flex items-center justify-between border-t pt-4 text-[11px]" style={{ borderColor: palette.border, color: palette.muted }}>
                <span>{brand.visualStyleNotes || 'Brand-aligned creative'}</span>
                <span className="font-semibold" style={{ color: palette.accent }}>{activeAsset.platform.toUpperCase()}</span>
              </div>
            </div>
          )}

          <div className="mx-auto mt-6 flex w-full max-w-md items-center justify-between text-xs">
            {isVideo ? (
              <div className="flex w-full items-center justify-between">
                <div className="flex gap-2">
                  <button onClick={handleTogglePlay} aria-label={isPlaying ? 'Pause preview' : 'Play preview'} className="rounded-xl p-2.5 text-white" style={{ backgroundColor: palette.primary }}>{isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
                  <button onClick={handleRestart} aria-label="Restart preview" className="rounded-xl border border-black/[0.08] bg-white p-2.5 text-[#1D1D1F]"><RotateCcw className="h-4 w-4" /></button>
                  <button onClick={() => setIsMuted(!isMuted)} aria-label={isMuted ? 'Unmute preview narration' : 'Mute preview narration'} className="rounded-xl border border-black/[0.08] bg-white p-2.5 text-[#1D1D1F]">{isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
                </div>
                <span className="text-[#6E6E73]">Scene {currentSceneIndex + 1} of {scenes.length || 1}</span>
              </div>
            ) : (
              <div className="flex w-full items-center justify-between">
                <button disabled={currentSlideIndex === 0} onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))} className="inline-flex items-center gap-1 rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[#1D1D1F] disabled:opacity-30"><ChevronLeft className="h-3.5 w-3.5" />Prev</button>
                <div className="flex gap-1">{slides.map((_, idx) => <button key={idx} onClick={() => setCurrentSlideIndex(idx)} aria-label={`Go to slide ${idx + 1}`} aria-current={currentSlideIndex === idx ? 'true' : undefined} className="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-medium" style={currentSlideIndex === idx ? { backgroundColor: palette.primary, color: inverseText } : { backgroundColor: '#F5F5F7', color: '#6E6E73' }}>{idx + 1}</button>)}</div>
                <button disabled={currentSlideIndex >= Math.max(0, slides.length - 1)} onClick={() => setCurrentSlideIndex((prev) => Math.min(Math.max(0, slides.length - 1), prev + 1))} className="inline-flex items-center gap-1 rounded-xl border border-black/[0.08] bg-white px-3 py-2 text-[#1D1D1F] disabled:opacity-30">Next<ChevronRight className="h-3.5 w-3.5" /></button>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5 lg:col-span-5">
          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3">
              <span className="font-mono text-xs font-semibold" style={{ color: palette.primary }}>{activeAsset.assetCode.replace(/^APEX-/, 'AUTO-')}</span>
              <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">AI Content Score {activeAsset.viralityScore > 0 ? `${activeAsset.viralityScore}/100` : 'Not available'}</span>
            </div>
            <div className="mt-4">
              <span className="text-[11px] text-[#86868B]">Hook</span>
              <p className="mt-1 text-sm font-semibold leading-snug text-[#1D1D1F]">“{activeAsset.hook}”</p>
            </div>
            <div className="mt-4">
              <span className="text-[11px] text-[#86868B]">Target Persona</span>
              <p className="mt-1 text-xs text-[#1D1D1F]">{activeAsset.targetBuyerPersona || 'Audience from campaign context'}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-xl bg-[#F5F5F7] p-3"><span className="text-[11px] text-[#86868B]">AI-est. Reach</span><span className="mt-0.5 block font-semibold text-[#1D1D1F]">{(activeAsset.estimatedImpressions || activeAsset.targetReach) ? (activeAsset.estimatedImpressions || activeAsset.targetReach).toLocaleString() : 'Not available'}</span></div>
              <div className="rounded-xl bg-[#F5F5F7] p-3"><span className="text-[11px] text-[#86868B]">AI-est. Leads</span><span className="mt-0.5 block font-semibold text-[#1D1D1F]">{activeAsset.expectedLeads ? `${activeAsset.expectedLeads} inquiries` : 'Not available'}</span></div>
            </div>
          </div>

          <div className="rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1D1D1F]">Ready-to-Post Caption</span>
              <button
                onClick={() => {
                  const hashtags = (activeAsset.hashtags || []).map((h) => `#${h}`).join(' ');
                  navigator.clipboard.writeText(`${activeAsset.caption}\n\n${hashtags}`);
                  setCopiedCaption(true);
                  setTimeout(() => setCopiedCaption(false), 1600);
                }}
                className="inline-flex items-center gap-1 text-xs font-medium"
                style={{ color: palette.primary }}
              >
                {copiedCaption ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} {copiedCaption ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="mt-3 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#F5F5F7] p-3.5 text-xs leading-relaxed text-[#333]">{activeAsset.caption}</div>
            {!!activeAsset.hashtags?.length && <div className="mt-3 flex flex-wrap gap-1">{activeAsset.hashtags.map((h, i) => <span key={`${h}-${i}`} className="rounded-md border border-black/[0.05] bg-white px-2 py-0.5 text-[11px] text-[#6E6E73]">#{h}</span>)}</div>}
          </div>
        </div>
      </div>
    </div>
  );
};
