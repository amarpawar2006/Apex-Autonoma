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
  Palette 
} from 'lucide-react';
import { SocialAsset, PostStatus } from '../types/campaign';
import { APEX_COMPANY_DATA } from '../data/apexCompanyData';
import { ApexLogo } from './ApexLogo';

interface CreativeStudioViewProps {
  assets: SocialAsset[];
  onUpdateStatus: (id: string, newStatus: PostStatus) => void;
  selectedAssetId?: string;
}

export const CreativeStudioView: React.FC<CreativeStudioViewProps> = ({
  assets,
  onUpdateStatus,
  selectedAssetId,
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
    setPlaybackTime(0);
    setCurrentSceneIndex(0);
    setIsPlaying(true);
    const scene = activeAsset.videoScenes?.[0];
    if (scene) {
      speakCurrentScene(scene.narrationVoiceover);
    }
  };

  const isVideo = activeAsset.format === 'reel_short';
  const slides = activeAsset.slides || [];
  const currentSlide = slides[currentSlideIndex] || slides[0];
  const scenes = activeAsset.videoScenes || [];
  const currentScene = scenes[currentSceneIndex] || scenes[0];

  const isApproved = activeAsset.status === 'approved' || activeAsset.status === 'scheduled';

  return (
    <div className="space-y-6 pb-20">
      {/* Editorial Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-2">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Creative Studio
          </h1>
          <p className="text-sm text-[#6E6E73] font-normal">
            Interactive AES-DS renderer simulation for 4:5 carousels, 9:16 reels, and engineering posters
          </p>
        </div>

        {/* Quick Asset Switcher Dropdown */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-white px-3.5 py-2 rounded-xl border border-black/[0.08] shadow-sm flex items-center space-x-2 text-xs">
            <span className="text-[#86868B]">Asset:</span>
            <select
              value={activeAsset.id}
              onChange={(e) => setActiveAssetId(e.target.value)}
              className="bg-transparent font-medium text-[#1D1D1F] focus:outline-none cursor-pointer max-w-[220px] truncate"
            >
              {assets.map((a) => (
                <option key={a.id} value={a.id}>
                  [{a.assetCode}] {a.title.slice(0, 30)}…
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => onUpdateStatus(activeAsset.id, isApproved ? 'in_review' : 'approved')}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium shadow-sm transition-all flex items-center space-x-1.5 active:scale-95 ${
              isApproved
                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                : 'bg-[#FF4500] hover:bg-[#EA3E00] text-white'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{isApproved ? 'Approved' : 'Approve asset'}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Viewport Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Visual Viewport Canvas */}
        <div className="lg:col-span-7 bg-white rounded-3xl border border-black/[0.06] shadow-sm p-4 sm:p-8 flex flex-col items-center justify-center min-h-[480px] sm:min-h-[580px] overflow-hidden">
          {/* Format Indicator */}
          <div className="w-full max-w-sm flex items-center justify-between text-xs text-[#86868B] mb-4">
            <span className="flex items-center space-x-1.5 font-medium text-[#1D1D1F]">
              <span className="w-2 h-2 rounded-full bg-[#FF4500]"></span>
              <span className="capitalize">{activeAsset.format.replace('_', ' ')}</span>
            </span>
            <span>
              {isVideo ? '1080 × 1920 (9:16)' : '1080 × 1350 (4:5)'}
            </span>
          </div>

          {/* VIEWPORT 1: 9:16 VERTICAL VIDEO REEL SIMULATOR (Preserving authentic AES-DS output) */}
          {isVideo ? (
            <div className="relative w-full max-w-[280px] sm:max-w-[320px] aspect-[9/16] bg-zinc-950 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-4 group border border-black/[0.2]">
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
                <div className="text-[10px] font-mono uppercase tracking-widest text-[#FF4500] font-bold">
                  SCENE {currentSceneIndex + 1} · {currentScene?.visualFocus}
                </div>
                <h3 className="text-base sm:text-lg font-bold font-mono text-white leading-tight">
                  "{currentScene?.hookText}"
                </h3>
                <div className="p-2.5 bg-black/70 border-l-2 border-[#FF4500] text-left text-[11px] font-mono text-white/90">
                  <span className="text-[#FF4500] font-bold block mb-0.5">VOICEOVER:</span>
                  <p className="italic">"{currentScene?.narrationVoiceover}"</p>
                </div>
              </div>

              {/* Reel Bottom */}
              <div className="relative z-10 space-y-2 text-white">
                <div className="flex items-center space-x-2">
                  <ApexLogo variant="mark" size="sm" className="bg-white rounded p-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-bold font-mono">Apex Engineering</div>
                    <div className="text-[10px] text-white/60">Commerce Systems Architecture</div>
                  </div>
                </div>

                <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-[#FF4500] h-full transition-all duration-300"
                    style={{ width: `${(playbackTime / 30) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* VIEWPORT 2: 4:5 CAROUSEL / POSTER SIMULATOR (Preserving authentic AES-DS output) */
            <div className="relative w-full max-w-[340px] aspect-[4/5] bg-[#0A0B0E] rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-6 border border-black/[0.2] text-white font-mono">
              <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

              {/* Slide Header */}
              <div className="relative z-10 flex items-center justify-between text-xs pb-3 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="w-4 h-4 bg-[#FF4500] text-black font-black text-[10px] flex items-center justify-center">/\</span>
                  <span className="font-bold tracking-wider text-xs">APEX ENGINEERING</span>
                </div>
                <span className="text-[#FF4500] text-[10px] font-bold">
                  {currentSlideIndex + 1}/{slides.length || 1}
                </span>
              </div>

              {/* Slide Content */}
              <div className="relative z-10 space-y-3 my-auto">
                <span className="text-[10px] uppercase text-[#FF4500] tracking-widest block font-bold">
                  {currentSlide?.headline || activeAsset.title}
                </span>
                <p className="text-xs text-zinc-300 leading-relaxed font-sans">
                  {currentSlide?.bodyCopy || activeAsset.hook}
                </p>
                {currentSlide?.visualPrompt && (
                  <div className="p-2.5 bg-black/60 border border-white/10 text-[10px] text-[#86868B] italic">
                    Visual: {currentSlide.visualPrompt.slice(0, 80)}…
                  </div>
                )}
              </div>

              {/* Slide Footer */}
              <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-zinc-400">
                <span>apex-engineering.co.in</span>
                <span className="text-[#FF4500] font-bold flex items-center space-x-1">
                  <span>SWIPE</span>
                  <span>➔</span>
                </span>
              </div>
            </div>
          )}

          {/* Viewport Playback / Slide Navigation Bar */}
          <div className="w-full max-w-sm mt-6 flex items-center justify-between bg-[#F2F2F7] rounded-2xl p-2.5 text-xs">
            {isVideo ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleTogglePlay}
                    className="px-3 py-1.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white font-medium rounded-xl flex items-center space-x-1.5 shadow-sm transition-all"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Pause' : 'Play reel'}</span>
                  </button>

                  <button
                    onClick={handleRestart}
                    className="p-1.5 bg-white rounded-xl text-[#6E6E73] hover:text-[#1D1D1F] border border-black/[0.06] shadow-sm"
                    title="Restart playback"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-1.5 bg-white rounded-xl text-[#6E6E73] hover:text-[#1D1D1F] border border-black/[0.06] shadow-sm"
                    title={isMuted ? 'Unmute voiceover' : 'Mute voiceover'}
                  >
                    {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                </div>

                <span className="text-[#86868B] text-xs font-medium">
                  Scene {currentSceneIndex + 1} of {scenes.length}
                </span>
              </div>
            ) : (
              <div className="flex items-center justify-between w-full">
                <button
                  disabled={currentSlideIndex === 0}
                  onClick={() => setCurrentSlideIndex((prev) => Math.max(0, prev - 1))}
                  className="px-3 py-1.5 bg-white rounded-xl text-[#1D1D1F] border border-black/[0.06] shadow-sm disabled:opacity-30 flex items-center space-x-1"
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
                          : 'text-[#6E6E73] hover:bg-black/[0.04]'
                      }`}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>

                <button
                  disabled={currentSlideIndex === slides.length - 1}
                  onClick={() => setCurrentSlideIndex((prev) => Math.min(slides.length - 1, prev + 1))}
                  className="px-3 py-1.5 bg-white rounded-xl text-[#1D1D1F] border border-black/[0.06] shadow-sm disabled:opacity-30 flex items-center space-x-1"
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
          <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <span className="font-mono text-xs font-semibold text-[#FF4500]">
                {activeAsset.assetCode}
              </span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                Virality {activeAsset.viralityScore}/100
              </span>
            </div>

            <div>
              <span className="text-[#86868B] text-[11px] block">Hook</span>
              <p className="text-xs font-semibold text-[#1D1D1F] mt-0.5 leading-snug italic">
                "{activeAsset.hook}"
              </p>
            </div>

            <div>
              <span className="text-[#86868B] text-[11px] block">Target Buyer Persona</span>
              <p className="text-xs text-[#1D1D1F] mt-0.5">
                {activeAsset.targetBuyerPersona}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 bg-[#FBFBFD] rounded-xl border border-black/[0.04]">
                <span className="text-[#86868B] text-[11px]">Est. Reach</span>
                <span className="font-semibold text-[#1D1D1F] block mt-0.5">{activeAsset.estimatedImpressions.toLocaleString()}</span>
              </div>
              <div className="p-3 bg-[#FBFBFD] rounded-xl border border-black/[0.04]">
                <span className="text-[#86868B] text-[11px]">Expected RFQs</span>
                <span className="font-semibold text-[#FF4500] block mt-0.5">+{activeAsset.expectedLeads} Leads</span>
              </div>
            </div>
          </div>

          {/* Full Caption Box */}
          <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1D1D1F]">Ready-to-Post Caption</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`${activeAsset.caption}\n\n${activeAsset.hashtags.map(h => '#' + h).join(' ')}`);
                  setCopiedCaption(true);
                  setTimeout(() => setCopiedCaption(false), 2000);
                }}
                className="text-xs font-medium text-[#FF4500] hover:underline flex items-center space-x-1"
              >
                {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCaption ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="p-3.5 bg-[#F2F2F7] rounded-xl text-xs text-[#1D1D1F] leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap font-normal">
              {activeAsset.caption}
            </div>

            <div className="flex flex-wrap gap-1 text-[11px] text-[#6E6E73]">
              {activeAsset.hashtags.map((h, i) => (
                <span key={i} className="bg-black/[0.03] px-2 py-0.5 rounded-md">
                  #{h}
                </span>
              ))}
            </div>
          </div>

          {/* Design System Verification */}
          <div className="bg-white rounded-2xl border border-black/[0.06] p-5 shadow-sm space-y-2 text-xs">
            <span className="font-semibold text-[#1D1D1F] block">
              AES-DS Compliance Audit
            </span>
            <div className="space-y-1 text-[#6E6E73]">
              <div className="flex items-center space-x-2 text-emerald-600">
                <span>✓</span>
                <span>Typography: Space Grotesk / Syne / JetBrains Mono</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-600">
                <span>✓</span>
                <span>Palette: Void Black (#0A0B0E) & High-Vis Orange (#FF4500)</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-600">
                <span>✓</span>
                <span>Brutalist Pill-Less Sharp Block safe zones</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
