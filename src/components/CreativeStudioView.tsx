import React, { useState, useEffect } from 'react';
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
  Download, 
  Copy, 
  Check, 
  Eye, 
  Video, 
  Palette,
  Sparkles
} from 'lucide-react';
import { SocialAsset, PostStatus } from '../types/campaign';
import { ApexLogo } from './ApexLogo';

interface CreativeStudioViewProps {
  assets: SocialAsset[];
  onUpdateStatus: (id: string, newStatus: PostStatus) => void;
  selectedAssetId?: string;
  onOpenAiGenerator?: () => void;
}

export const CreativeStudioView: React.FC<CreativeStudioViewProps> = ({
  assets = [],
  onUpdateStatus,
  selectedAssetId,
  onOpenAiGenerator
}) => {
  const [activeAssetId, setActiveAssetId] = useState<string>(
    selectedAssetId || (assets[0]?.id ?? '')
  );
  
  const [currentSlideIndex, setCurrentSlideIndex] = useState<number>(0);

  // Video Reel Player State
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [playbackTime, setPlaybackTime] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);

  // Sync activeAssetId when assets change
  useEffect(() => {
    if (selectedAssetId && assets.some(a => a.id === selectedAssetId)) {
      setActiveAssetId(selectedAssetId);
    } else if (assets.length > 0 && !assets.some(a => a.id === activeAssetId)) {
      setActiveAssetId(assets[0].id);
    }
  }, [assets, selectedAssetId]);

  const activeAsset = assets.find((a) => a.id === activeAssetId) || assets[0];

  useEffect(() => {
    setCurrentSlideIndex(0);
    setCurrentSceneIndex(0);
    setPlaybackTime(0);
    setIsPlaying(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [activeAssetId]);

  useEffect(() => {
    let interval: any = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime((prev) => {
          const next = prev + 0.5;
          if (next >= 30) {
            setIsPlaying(false);
            return 0;
          }
          if (next < 4) setCurrentSceneIndex(0);
          else if (next < 11) setCurrentSceneIndex(1);
          else if (next < 20) setCurrentSceneIndex(2);
          else setCurrentSceneIndex(3);
          return next;
        });
      }, 500);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const speakCurrentScene = (text: string) => {
    if (isMuted || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleTogglePlay = () => {
    if (!activeAsset) return;
    if (!isPlaying) {
      setIsPlaying(true);
      const scene = activeAsset.videoScenes?.[currentSceneIndex];
      if (scene) {
        speakCurrentScene(scene.narrationVoiceover);
      }
    } else {
      setIsPlaying(false);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  const handleRestart = () => {
    if (!activeAsset) return;
    setPlaybackTime(0);
    setCurrentSceneIndex(0);
    setIsPlaying(true);
    const scene = activeAsset.videoScenes?.[0];
    if (scene) {
      speakCurrentScene(scene.narrationVoiceover);
    }
  };

  // Defensive Empty State Guard: Prevents blank crash when company has 0 assets
  if (!assets || assets.length === 0 || !activeAsset) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F5F5F7]">
            Creative Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#9898A0] font-normal mt-1">
            Interactive AES-DS renderer simulation for 4:5 carousels, 9:16 reels, and engineering posters
          </p>
        </div>

        <div className="bg-[#12141A] rounded-3xl border border-white/[0.08] p-10 sm:p-16 text-center space-y-4 shadow-xl">
          <div className="w-14 h-14 bg-white/[0.04] rounded-2xl flex items-center justify-center mx-auto text-[#FF4500] border border-white/[0.08]">
            <Layers className="w-7 h-7" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="text-lg font-semibold text-[#F5F5F7]">No deliverables in this workspace</h3>
            <p className="text-xs text-[#9898A0] leading-relaxed">
              This company workspace does not have generated content assets yet. Launch campaign generation to produce carousels, reels, and posters in the Creative Studio.
            </p>
          </div>
          {onOpenAiGenerator && (
            <div className="pt-2">
              <button
                onClick={onOpenAiGenerator}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-semibold rounded-xl shadow-lg shadow-[#FF4500]/20 transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Create First Campaign</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const isVideo = activeAsset.format === 'reel_short';
  const slides = activeAsset.slides || [];
  const currentSlide = slides[currentSlideIndex] || slides[0];
  const scenes = activeAsset.videoScenes || [];
  const currentScene = scenes[currentSceneIndex] || scenes[0];

  const isApproved = activeAsset.status === 'approved' || activeAsset.status === 'scheduled';

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#F5F5F7]">
            Creative Studio
          </h1>
          <p className="text-xs sm:text-sm text-[#9898A0] font-normal">
            Interactive AES-DS renderer simulation for 4:5 carousels, 9:16 reels, and engineering posters
          </p>
        </div>

        {/* Quick Asset Switcher Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-[#161922] px-3.5 py-2 rounded-xl border border-white/[0.08] shadow-sm flex items-center space-x-2 text-xs">
            <span className="text-[#9898A0]">Asset:</span>
            <select
              value={activeAsset.id}
              onChange={(e) => setActiveAssetId(e.target.value)}
              className="bg-transparent font-medium text-[#F5F5F7] focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id} className="bg-[#161922] text-[#F5F5F7]">
                  [{a.assetCode}] {a.title.slice(0, 30)}…
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onUpdateStatus(activeAsset.id, isApproved ? 'in_review' : 'approved')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5 active:scale-95 ${
              isApproved
                ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
                : 'bg-[#FF4500] hover:bg-[#EA3E00] text-white shadow-lg shadow-[#FF4500]/20'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isApproved ? 'Approved ✓' : 'Approve Asset'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Viewport Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual Viewport Canvas */}
        <div className="lg:col-span-7 bg-[#12141A] rounded-3xl border border-white/[0.08] shadow-xl p-4 sm:p-8 flex flex-col items-center justify-center min-h-[480px] sm:min-h-[580px] overflow-hidden">
          {/* Format Indicator */}
          <div className="w-full max-w-sm flex items-center justify-between text-xs text-[#9898A0] mb-4">
            <span className="flex items-center space-x-1.5 font-medium text-[#F5F5F7]">
              <span className="w-2 h-2 rounded-full bg-[#FF4500]"></span>
              <span className="capitalize">{(activeAsset.format || 'deliverable').replace(/_/g, ' ')}</span>
            </span>
            <span>
              {isVideo ? '1080 × 1920 (9:16)' : '1080 × 1350 (4:5)'}
            </span>
          </div>

          {/* VIEWPORT 1: 9:16 VERTICAL VIDEO REEL SIMULATOR */}
          {isVideo ? (
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[9/16] bg-black rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-4 group border border-white/[0.12]">
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px] pointer-events-none"></div>

              {/* Reel Top Bar */}
              <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-white/70">
                <span className="bg-black/60 px-2 py-0.5 rounded text-[#FF4500] font-bold">
                  APEX // {activeAsset.assetCode}
                </span>
                <span className="text-white/50">{playbackTime.toFixed(1)}s / 30.0s</span>
              </div>

              {/* Reel Center Scene */}
              <div className="relative z-10 text-center space-y-3 px-2">
                <span className="inline-block px-2.5 py-1 bg-[#FF4500]/20 border border-[#FF4500]/40 text-[#FF4500] text-[11px] font-mono font-bold rounded">
                  SCENE {currentSceneIndex + 1}
                </span>

                <h3 className="text-white font-bold text-base sm:text-lg tracking-tight leading-snug drop-shadow-md">
                  {currentScene?.onScreenCaption || (currentScene as any)?.onScreenText || activeAsset.hook}
                </h3>

                <p className="text-neutral-300 text-xs leading-relaxed italic drop-shadow-sm font-sans">
                  "{currentScene?.narrationVoiceover || (activeAsset.caption ? activeAsset.caption.slice(0, 80) + '…' : activeAsset.hook || '')}"
                </p>
              </div>

              {/* Reel Bottom Meta */}
              <div className="relative z-10 space-y-2">
                <div className="bg-black/70 backdrop-blur-md p-2.5 rounded-xl border border-white/10 text-[11px] text-neutral-300">
                  <span className="text-[#FF4500] font-mono text-[9px] uppercase tracking-wider block font-bold">Visual Direction</span>
                  <p className="line-clamp-2 text-[11px] mt-0.5">
                    {currentScene?.bRollPrompt || (currentScene as any)?.visualPrompt || activeAsset.posterVisualPrompt || 'Technical isometric animation'}
                  </p>
                </div>

                <div className="h-1 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[#FF4500] transition-all duration-300"
                    style={{ width: `${(playbackTime / 30) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* VIEWPORT 2: 4:5 CAROUSEL / POSTER SIMULATOR */
            <div className="relative w-full max-w-[320px] sm:max-w-[380px] aspect-[4/5] bg-black rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-6 group border border-white/[0.12]">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

              {/* Slide Top Bar */}
              <div className="relative z-10 flex items-center justify-between text-xs font-mono text-neutral-400 border-b border-white/10 pb-3">
                <div className="flex items-center space-x-2">
                  <ApexLogo variant="mark" size="sm" />
                  <span className="text-white font-semibold tracking-tight">AUTONOMA // AES-DS</span>
                </div>
                <span className="text-[#FF4500] font-bold">
                  {currentSlideIndex + 1}/{slides.length || 1}
                </span>
              </div>

              {/* Slide Content */}
              <div className="relative z-10 space-y-3 my-auto py-4">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#FF4500] block">
                  {currentSlide?.slideNumber ? `SLIDE ${currentSlide.slideNumber}` : 'KEY PROPOSITION'}
                </span>
                <h2 className="text-white font-bold text-lg sm:text-xl tracking-tight leading-snug">
                  {currentSlide?.headline || (currentSlide as any)?.header || activeAsset.title}
                </h2>
                <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed">
                  {Array.isArray(currentSlide?.body) ? currentSlide.body.join(' ') : (currentSlide?.body || activeAsset.hook)}
                </p>
              </div>

              {/* Slide Footer */}
              <div className="relative z-10 border-t border-white/10 pt-3 flex items-center justify-between text-[11px] font-mono text-neutral-400">
                <span>{activeAsset.speciesCode || 'AES-ENG'}</span>
                <span className="text-white/80">{activeAsset.platform.toUpperCase()} SPEC</span>
              </div>
            </div>
          )}

          {/* Viewport Playback / Pagination Controls */}
          <div className="w-full max-w-sm flex items-center justify-between mt-6 text-xs">
            {isVideo ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleTogglePlay}
                    className="p-2.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white rounded-xl shadow-lg shadow-[#FF4500]/20 transition-all active:scale-95"
                    title={isPlaying ? 'Pause simulation' : 'Play simulation'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                  </button>

                  <button
                    onClick={handleRestart}
                    className="p-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-[#F5F5F7] rounded-xl border border-white/[0.08] transition-colors"
                    title="Restart reel"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2.5 bg-white/[0.06] hover:bg-white/[0.1] text-[#F5F5F7] rounded-xl border border-white/[0.08] transition-colors"
                    title={isMuted ? 'Unmute voiceover' : 'Mute voiceover'}
                  >
                    {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                </div>

                <span className="text-[#9898A0] text-xs font-medium font-mono">
                  Scene {currentSceneIndex + 1} of {scenes.length || 1}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <button
                  disabled={currentSlideIndex === 0}
                  onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 bg-[#161922] rounded-xl text-[#F5F5F7] border border-white/[0.08] shadow-sm disabled:opacity-30 flex items-center space-x-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Prev</span>
                </button>

                <div className="flex items-center space-x-1">
                  {slides.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-medium transition-all ${
                        currentSlideIndex === idx
                          ? 'bg-[#FF4500] text-white shadow-sm'
                          : 'text-[#9898A0] hover:bg-white/[0.06]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentSlideIndex === (slides.length || 1) - 1}
                  onClick={() => setCurrentSlideIndex((prev) => Math.min((slides.length || 1) - 1, prev + 1))}
                  className="px-3 py-1.5 bg-[#161922] rounded-xl text-[#F5F5F7] border border-white/[0.08] shadow-sm disabled:opacity-30 flex items-center space-x-1"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Asset Details & Copy Deck */}
        <div className="lg:col-span-5 space-y-5">
          {/* Metadata Card */}
          <div className="bg-[#12141A] rounded-2xl border border-white/[0.08] p-5 shadow-xl space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <span className="font-mono text-xs font-semibold text-[#FF4500]">
                {activeAsset.assetCode}
              </span>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                Virality {activeAsset.viralityScore || 85}/100
              </span>
            </div>

            <div>
              <span className="text-[#9898A0] text-[11px] block">Hook</span>
              <p className="text-xs font-semibold text-[#F5F5F7] mt-0.5 leading-snug italic">
                "{activeAsset.hook}"
              </p>
            </div>

            <div>
              <span className="text-[#9898A0] text-[11px] block">Target Persona</span>
              <p className="text-xs text-[#F5F5F7] mt-0.5">
                {activeAsset.targetBuyerPersona || 'Target customer segment'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 bg-[#161922] rounded-xl border border-white/[0.06]">
                <span className="text-[#9898A0] text-[11px]">Est. Reach</span>
                <span className="font-semibold text-[#F5F5F7] block mt-0.5 font-mono">
                  {(activeAsset.estimatedImpressions || activeAsset.targetReach || 5000).toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-[#161922] rounded-xl border border-white/[0.06]">
                <span className="text-[#9898A0] text-[11px]">Expected Leads</span>
                <span className="font-semibold text-[#FF4500] block mt-0.5 font-mono">
                  +{activeAsset.expectedLeads || 12} Inquiries
                </span>
              </div>
            </div>
          </div>

          {/* Full Caption Box */}
          <div className="bg-[#12141A] rounded-2xl border border-white/[0.08] p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#F5F5F7]">Ready-to-Post Caption</span>
              <button
                onClick={() => {
                  const hashtagsStr = (activeAsset.hashtags || []).map(h => '#' + h).join(' ');
                  navigator.clipboard.writeText(`${activeAsset.caption}\n\n${hashtagsStr}`);
                  setCopiedCaption(true);
                  setTimeout(() => setCopiedCaption(false), 2000);
                }}
                className="text-xs font-medium text-[#FF4500] hover:underline flex items-center space-x-1"
              >
                {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCaption ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3.5 bg-[#161922] rounded-xl text-xs text-neutral-300 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-normal border border-white/[0.04]">
              {activeAsset.caption}
            </div>

            {activeAsset.hashtags && activeAsset.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 text-[11px] text-[#9898A0]">
                {activeAsset.hashtags.map((h, i) => (
                  <span key={i} className="bg-white/[0.04] px-2 py-0.5 rounded-md border border-white/[0.06]">
                    #{h}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
