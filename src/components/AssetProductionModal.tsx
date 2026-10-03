import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Layers,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Download,
  Copy,
  Check,
  RefreshCw,
  Edit3,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Sliders,
  AlertCircle,
  Play,
  Share2,
  FileText,
  Palette,
  ArrowUpRight
} from 'lucide-react';
import { SocialAsset, ProductionStatus, CarouselSlide, VideoScene } from '../types/campaign';
import { ApexLogo } from './ApexLogo';
import {
  generateAssetImage,
  generateAssetVideo,
  pollVideoStatus,
  downloadGeneratedVideo,
  uploadAssetMedia,
  renderDeterministicSlideCanvas,
  renderDeterministicPosterCanvas,
  downloadDataUrl,
  downloadAllCarouselSlides,
  BrandRenderOptions
} from '../services/mediaProductionService';
import { autonomaDataService } from '../services/autonomaDataService';

interface AssetProductionModalProps {
  asset: SocialAsset | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateAsset: (updatedAsset: SocialAsset) => void;
  onOpenSettings?: () => void;
  customApiKey?: string;
}

type ProductionModalTab = 'preview' | 'content' | 'generation' | 'posting';

function formatScheduleTime(raw?: string): string {
  if (!raw) return 'Time not set';
  if (/^1899-12-30T\d{2}:\d{2}:\d{2}/.test(raw)) {
    const match = raw.match(/T(\d{2}):(\d{2})/);
    if (match) {
      let hour = Number(match[1]);
      const minute = match[2];
      const suffix = hour >= 12 ? 'PM' : 'AM';
      hour = hour % 12 || 12;
      return `${String(hour).padStart(2, '0')}:${minute} ${suffix}`;
    }
  }
  return raw;
}

export const AssetProductionModal: React.FC<AssetProductionModalProps> = ({
  asset,
  isOpen,
  onClose,
  onUpdateAsset,
  onOpenSettings,
  customApiKey
}) => {
  // Local state for production workflow (unconditionally declared at top level)
  const [activeTab, setActiveTab] = useState<ProductionModalTab>('preview');
  const [productionStatus, setProductionStatus] = useState<ProductionStatus>(
    asset?.productionStatus || 'NOT_GENERATED'
  );
  const [isEditingPrompt, setIsEditingPrompt] = useState<boolean>(false);
  const [activePrompt, setActivePrompt] = useState<string>(
    asset?.generatedImagePrompt ||
      asset?.posterVisualPrompt ||
      asset?.videoGenerationPrompt ||
      (asset
        ? `Create a professional, brand-safe social visual for ${asset.title}. Follow the active company's saved Brand Design System, typography direction, palette, imagery style and creative rules. If no brand system exists, use a clean neutral editorial layout.`
        : '')
  );
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationError, setGenerationError] = useState<string | null>(asset?.productionError || null);
  const [isBillingRequired, setIsBillingRequired] = useState<boolean>(false);

  // Media previews
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(asset?.generatedImageUrl || null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(asset?.generatedVideoUrl || null);
  const [deterministicCanvasUrl, setDeterministicCanvasUrl] = useState<string | null>(null);

  // Carousel slide state
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [slideVisuals, setSlideVisuals] = useState<Record<number, string>>(
    asset?.carouselSlideVisuals || {}
  );
  const [generatingSlideIndex, setGeneratingSlideIndex] = useState<number | null>(null);

  // Copy status feedback
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);
  const [copiedHashtags, setCopiedHashtags] = useState<boolean>(false);
  const [copiedCTA, setCopiedCTA] = useState<boolean>(false);
  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedVoiceover, setCopiedVoiceover] = useState<boolean>(false);
  const [copiedStoryboard, setCopiedStoryboard] = useState<boolean>(false);
  const [activeImageProviderName, setActiveImageProviderName] = useState<string>('AI Image');
  const [activeVideoProviderName, setActiveVideoProviderName] = useState<string>('Video Provider');
  const [activeImageProviderId, setActiveImageProviderId] = useState<string | undefined>();
  const [activeVideoProviderId, setActiveVideoProviderId] = useState<string | undefined>();
  const [activeImageModel, setActiveImageModel] = useState<string | undefined>();
  const [activeVideoModel, setActiveVideoModel] = useState<string | undefined>();
  const [brandRenderOptions, setBrandRenderOptions] = useState<BrandRenderOptions>({});
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);

  useEffect(() => {
    Promise.all([
      autonomaDataService.getAiProviders().catch(() => null),
      autonomaDataService.getCompanyProfile().catch(() => null)
    ]).then(([providersRes, companyRes]) => {
      const defImg = providersRes?.aiProviders?.defaults?.image;
      const defVid = providersRes?.aiProviders?.defaults?.video;
      const providers = providersRes?.aiProviders?.providers || {};

      setActiveImageProviderId(defImg);
      setActiveVideoProviderId(defVid);
      setActiveImageModel(defImg ? providers?.[defImg]?.selectedModel : undefined);
      setActiveVideoModel(defVid ? providers?.[defVid]?.selectedModel : undefined);

      if (defImg === 'openai') setActiveImageProviderName(`OpenAI ${providers?.openai?.selectedModel || 'Image'}`);
      else if (defImg === 'nvidia') setActiveImageProviderName(`NVIDIA ${providers?.nvidia?.selectedModel || 'NIM'}`);
      else if (defImg === 'gemini') setActiveImageProviderName('Google Gemini Image');
      else setActiveImageProviderName('Configured Image Provider');

      if (defVid === 'google_veo') setActiveVideoProviderName(`Google ${providers?.google_veo?.selectedModel || 'Veo'}`);
      else if (defVid === 'nvidia') setActiveVideoProviderName('NVIDIA video (not enabled in this build)');
      else setActiveVideoProviderName('Configured Video Provider');

      const company = companyRes?.company;
      const profile = companyRes?.profile || company?.profile || {};
      const brand = profile?.brandDesignSystem || {};
      setBrandRenderOptions({
        companyName: company?.name || 'Your Brand',
        website: profile?.website || '',
        primaryColor: brand.primaryColor,
        secondaryColor: brand.secondaryColor,
        accentColor: brand.accentColor,
        backgroundColor: brand.backgroundColor,
        textColor: brand.textColor,
        headingFont: brand.headingFont,
        bodyFont: brand.bodyFont
      });
    });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isGenerating && !isUploadingMedia) onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, isGenerating, isUploadingMedia, onClose]);

  const isCarousel = asset?.format === 'carousel';
  const isVideo = asset?.format === 'reel_short';
  const isImageOrPoster = !isCarousel && !isVideo;

  // Sync state when asset prop changes
  useEffect(() => {
    if (!asset) return;
    setProductionStatus(asset.productionStatus || 'NOT_GENERATED');
    setGeneratedImageUrl(asset.generatedImageUrl || null);
    setGeneratedVideoUrl(asset.generatedVideoUrl || null);
    setSlideVisuals(asset.carouselSlideVisuals || {});
    setGenerationError(asset.productionError || null);
    setActivePrompt(
      asset.generatedImagePrompt ||
        asset.posterVisualPrompt ||
        asset.videoGenerationPrompt ||
        `Create a professional, brand-safe social visual for ${asset.title}. Follow the active company's saved Brand Design System, typography direction, palette, imagery style and creative rules. If no brand system exists, use a clean neutral editorial layout.`
    );
  }, [asset]);

  // Generate deterministic preview for carousel or poster
  useEffect(() => {
    if (!asset) return;
    let isMounted = true;
    async function updateCanvas() {
      if (!asset) return;
      if (isCarousel && asset.slides && asset.slides[activeSlideIndex]) {
        try {
          const currentSlide = asset.slides[activeSlideIndex];
          const visual = slideVisuals[currentSlide.slideNumber];
          const url = await renderDeterministicSlideCanvas(currentSlide, asset.slides.length, {
            ...brandRenderOptions,
            assetTitle: asset.title,
            assetCode: asset.assetCode,
            supportingImageUrl: visual
          });
          if (isMounted) setDeterministicCanvasUrl(url);
        } catch (e) {
          console.error('Failed to render slide canvas:', e);
        }
      } else if (isImageOrPoster) {
        try {
          const url = await renderDeterministicPosterCanvas(asset, generatedImageUrl || undefined, brandRenderOptions);
          if (isMounted) setDeterministicCanvasUrl(url);
        } catch (e) {
          console.error('Failed to render poster canvas:', e);
        }
      }
    }
    updateCanvas();
    return () => {
      isMounted = false;
    };
  }, [asset, activeSlideIndex, slideVisuals, generatedImageUrl, isCarousel, isImageOrPoster, brandRenderOptions]);

  // Handler: Real Server-Side Image Generation
  const handleGenerateImage = async () => {
    if (!asset || isGenerating) return; // Prevent double-click
    setIsGenerating(true);
    setGenerationError(null);
    setIsBillingRequired(false);
    setProductionStatus('GENERATING');

    const result = await generateAssetImage(activePrompt, '3:4', asset.assetCode, customApiKey, {
      providerId: activeImageProviderId,
      modelName: activeImageModel,
      platform: asset.platform,
      language: asset.language,
      objective: asset.strategicPurpose,
      assetId: asset.id,
      campaignId: asset.campaignId
    });

    const generatedUrl = result.dataUrl || result.fileUrl;
    if (result.success && generatedUrl) {
      setGeneratedImageUrl(generatedUrl);
      setProductionStatus('READY');
      const updated: SocialAsset = {
        ...asset,
        productionStatus: 'READY',
        generatedImageUrl: generatedUrl,
        generatedImagePrompt: activePrompt,
        productionError: undefined
      };
      onUpdateAsset(updated);
    } else {
      setProductionStatus('FAILED');
      setGenerationError(result.error || 'Image generation failed');
      setIsBillingRequired(Boolean(result.isBillingRequired));
      const updated: SocialAsset = {
        ...asset,
        productionStatus: 'FAILED',
        productionError: result.error || 'Image generation failed'
      };
      onUpdateAsset(updated);
    }
    setIsGenerating(false);
  };

  // Handler: Generate visual for individual carousel slide
  const handleGenerateSlideVisual = async (slideNumber: number) => {
    if (!asset || generatingSlideIndex !== null) return;
    setGeneratingSlideIndex(slideNumber);
    setGenerationError(null);

    const slide = asset.slides?.find((s) => s.slideNumber === slideNumber);
    const slidePrompt =
      slide?.visualPrompt ||
      `Create a clean brand-aligned supporting visual for ${slide?.headline || asset.title}. Follow the active company's saved Brand Design System. Avoid unrelated brand colors or identities.`;

    const result = await generateAssetImage(slidePrompt, '16:9', `${asset.assetCode.replace(/^APEX-/, 'AUTO-')}-S${slideNumber}`, customApiKey, {
      providerId: activeImageProviderId,
      modelName: activeImageModel,
      platform: asset.platform,
      language: asset.language,
      objective: asset.strategicPurpose,
      assetId: asset.id,
      campaignId: asset.campaignId
    });

    const generatedUrl = result.dataUrl || result.fileUrl;
    if (result.success && generatedUrl) {
      const nextVisuals = { ...slideVisuals, [slideNumber]: generatedUrl };
      setSlideVisuals(nextVisuals);
      const updated: SocialAsset = {
        ...asset,
        carouselSlideVisuals: nextVisuals
      };
      onUpdateAsset(updated);
    } else {
      setGenerationError(
        `Slide visual error: ${result.error || 'Failed to generate visual'}`
      );
      setIsBillingRequired(Boolean(result.isBillingRequired));
    }
    setGeneratingSlideIndex(null);
  };

  // Handler: Video Generation (Veo 3.1)
  const handleGenerateVideo = async () => {
    if (!asset || isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    setIsBillingRequired(false);
    setProductionStatus('GENERATING');

    const result = await generateAssetVideo(activePrompt, '9:16', asset.assetCode, customApiKey, {
      providerId: activeVideoProviderId,
      modelName: activeVideoModel,
      platform: asset.platform,
      assetId: asset.id,
      campaignId: asset.campaignId
    });

    if (result.success && result.fileUrl && !result.operationName) {
      setProductionStatus('READY');
      const updated: SocialAsset = {
        ...asset,
        productionStatus: 'READY',
        generatedVideoUrl: result.fileUrl,
        videoGenerationPrompt: activePrompt,
        productionError: undefined
      };
      onUpdateAsset(updated);
      setIsGenerating(false);
    } else if (result.success && result.operationName) {
      setProductionStatus('GENERATING');
      pollVideoOperation(result.operationName);
    } else {
      setProductionStatus('FAILED');
      setGenerationError(result.error || 'Video generation failed');
      setIsBillingRequired(Boolean(result.isBillingRequired));
      const updated: SocialAsset = {
        ...asset,
        productionStatus: 'FAILED',
        productionError: result.error
      };
      onUpdateAsset(updated);
      setIsGenerating(false);
    }
  };

  // Video Polling
  const pollVideoOperation = async (opName: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const status = await pollVideoStatus(opName, customApiKey);
      if (status.done) {
        clearInterval(interval);
        setIsGenerating(false);
        if (status.error) {
          setProductionStatus('FAILED');
          setGenerationError(status.error);
        } else if (asset) {
          const downloaded = await downloadGeneratedVideo(opName, asset.assetCode, customApiKey);
          if (!downloaded.success || !downloaded.videoUrl) {
            setProductionStatus('FAILED');
            setGenerationError(downloaded.error || 'Video completed but the generated file could not be retrieved.');
            const updated: SocialAsset = {
              ...asset,
              productionStatus: 'FAILED',
              videoJobOperationName: opName,
              productionError: downloaded.error || 'Video file retrieval failed'
            };
            onUpdateAsset(updated);
          } else {
            setProductionStatus('READY');
            const updated: SocialAsset = {
              ...asset,
              productionStatus: 'READY',
              generatedVideoUrl: downloaded.videoUrl,
              videoJobOperationName: opName,
              videoGenerationPrompt: activePrompt,
              productionError: undefined
            };
            onUpdateAsset(updated);
          }
        }
      } else if (attempts >= 36) {
        clearInterval(interval);
        setIsGenerating(false);
        const timeoutMessage = 'Video generation is taking longer than expected. The provider may still finish the job; retry status later or generate again.';
        setProductionStatus('FAILED');
        setGenerationError(timeoutMessage);
        if (asset) {
          onUpdateAsset({
            ...asset,
            productionStatus: 'FAILED',
            videoJobOperationName: opName,
            productionError: timeoutMessage
          });
        }
      }
    }, 10000);
  };

  // Handler: Approve Asset
  const handleApprove = () => {
    if (!asset) return;
    setProductionStatus('APPROVED');
    const updated: SocialAsset = {
      ...asset,
      productionStatus: 'APPROVED',
      productionApprovedAt: new Date().toISOString(),
      status: 'approved'
    };
    onUpdateAsset(updated);
  };

  // Handler: Single Download
  const handleDownloadSingle = () => {
    if (!asset) return;
    if (generatedImageUrl) {
      downloadDataUrl(`${asset.assetCode.replace(/^APEX-/, 'AUTO-')}-production.png`, generatedImageUrl);
    } else if (deterministicCanvasUrl) {
      downloadDataUrl(`${asset.assetCode.replace(/^APEX-/, 'AUTO-')}-canvas.png`, deterministicCanvasUrl);
    }
  };

  // Handler: Download All Slides
  const handleDownloadAllSlides = async () => {
    if (!asset) return;
    await downloadAllCarouselSlides(asset, slideVisuals, brandRenderOptions);
  };

  const handleUploadFinishedMedia = async (file: File) => {
    if (!asset) return;
    setIsUploadingMedia(true);
    setGenerationError(null);
    try {
      const uploaded = await uploadAssetMedia(file, {
        assetId: asset.id,
        campaignId: asset.campaignId,
        assetCode: asset.assetCode,
        mediaType: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE'
      });
      if (!uploaded.success || !uploaded.fileUrl) {
        throw new Error(uploaded.error || 'Media upload failed');
      }
      const isUploadedVideo = file.type.startsWith('video/');
      const updated: SocialAsset = {
        ...asset,
        productionStatus: 'READY',
        productionError: undefined,
        ...(isUploadedVideo
          ? { generatedVideoUrl: uploaded.fileUrl }
          : { generatedImageUrl: uploaded.fileUrl })
      };
      if (isUploadedVideo) {
        setGeneratedVideoUrl(uploaded.fileUrl);
      } else {
        setGeneratedImageUrl(uploaded.fileUrl);
      }
      setProductionStatus('READY');
      onUpdateAsset(updated);
    } catch (err: any) {
      setGenerationError(err?.message || 'Media upload failed');
      setProductionStatus('FAILED');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Apply deterministic design directly
  const handleApplyDeterministicDesign = () => {
    if (!asset || !deterministicCanvasUrl) return;
    setGeneratedImageUrl(deterministicCanvasUrl);
    setProductionStatus('READY');
    const updated: SocialAsset = {
      ...asset,
      productionStatus: 'READY',
      generatedImageUrl: deterministicCanvasUrl,
      productionError: undefined
    };
    onUpdateAsset(updated);
    setGenerationError(null);
  };

  // Copy helper
  const copyToClipboard = (text: string, setCopied: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Rules of Hooks compliance: Early return happens strictly AFTER all hooks are evaluated
  if (!isOpen || !asset) {
    return null;
  }

  const isApproved = productionStatus === 'APPROVED';
  const isReady = productionStatus === 'READY';

  return (
    <div role="dialog" aria-modal="true" aria-label="Asset production" onMouseDown={(e) => { if (e.target === e.currentTarget && !isGenerating && !isUploadingMedia) onClose(); }} className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-6 bg-black/40 backdrop-blur-md overflow-y-auto">
      <div className="bg-white rounded-3xl border border-black/[0.08] shadow-2xl w-full max-w-5xl my-4 text-[#1D1D1F] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header Deck */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-black/[0.06] flex items-center justify-between gap-4 bg-white sticky top-0 z-10">
          <div className="flex items-center space-x-3 min-w-0">
            <ApexLogo variant="mark" size="sm" className="shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center space-x-2 text-xs">
                <span className="font-mono font-semibold text-[#FF4500]">
                  {asset.assetCode.replace(/^APEX-/, 'AUTO-')}
                </span>
                <span className="text-[#86868B]">·</span>
                <span className="capitalize text-[#1D1D1F] font-medium">
                  {asset.platform}
                </span>
                <span className="text-[#86868B]">·</span>
                <span className="text-[#6E6E73]">
                  {asset.format.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-base font-semibold text-[#1D1D1F] truncate max-w-lg mt-0.5">
                {asset.title}
              </h2>
            </div>
          </div>

          {/* Right Header: Status Badge & Close */}
          <div className="flex items-center space-x-3 flex-shrink-0">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium inline-flex items-center space-x-1.5 ${
                isApproved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : isReady
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : isGenerating
                  ? 'bg-amber-50 text-amber-700 border border-amber-200'
                  : 'bg-black/[0.04] text-[#6E6E73]'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isApproved
                    ? 'bg-emerald-500'
                    : isReady
                    ? 'bg-blue-500'
                    : isGenerating
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-neutral-400'
                }`}
              />
              <span>
                {isApproved
                  ? 'Approved'
                  : isReady
                  ? 'Ready for review'
                  : isGenerating
                  ? 'Generating…'
                  : 'Needs media'}
              </span>
            </span>

            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Apple Segmented View Switcher */}
        <div className="px-4 sm:px-6 py-2.5 bg-[#FBFBFD] border-b border-black/[0.06] flex items-center justify-between gap-4 overflow-x-auto no-scrollbar w-full max-w-full">
          <div className="p-1 bg-black/[0.04] rounded-xl flex items-center space-x-1 text-xs shrink-0">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'preview'
                  ? 'bg-white text-[#1D1D1F] shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Preview
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'content'
                  ? 'bg-white text-[#1D1D1F] shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Content
            </button>
            <button
              onClick={() => setActiveTab('generation')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'generation'
                  ? 'bg-white text-[#1D1D1F] shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Generation
            </button>
            <button
              onClick={() => setActiveTab('posting')}
              className={`px-3.5 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'posting'
                  ? 'bg-white text-[#1D1D1F] shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              Posting
            </button>
          </div>

          {/* Quick Schedule Metadata */}
          <div className="hidden sm:flex items-center space-x-3 text-xs text-[#86868B]">
            <span>Scheduled: <strong className="text-[#1D1D1F] font-medium">{asset.targetDate}</strong> ({formatScheduleTime(asset.postTimeIST)})</span>
            <span>·</span>
            <span>AI Content Score: <strong className="text-[#FF4500] font-medium">{asset.viralityScore}/100</strong></span>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Diagnostic Alert if generation error occurred */}
          {generationError && (
            <div className="p-4 bg-orange-50/60 rounded-2xl border border-orange-200 text-xs text-orange-950 space-y-2">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-[#FF4500] flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <div className="font-semibold text-orange-900">
                    {isBillingRequired
                      ? isVideo
                        ? 'Video generation requires paid API quota'
                        : 'Image generation requires paid API quota'
                      : 'Generation notice'}
                  </div>
                  <p className="text-[#6E6E73] leading-relaxed">
                    {generationError}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1 pl-6">
                {isImageOrPoster && deterministicCanvasUrl && (
                  <button
                    onClick={handleApplyDeterministicDesign}
                    className="px-3 py-1.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white font-medium rounded-xl shadow-sm transition-colors text-xs"
                  >
                    Use Brand System design
                  </button>
                )}
                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-[#1D1D1F] font-medium rounded-xl border border-black/[0.08] shadow-sm transition-colors text-xs flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>Configure AI Providers</span>
                  </button>
                )}
                <button
                  onClick={() => copyToClipboard(activePrompt, setCopiedPrompt)}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-50 text-[#1D1D1F] font-medium rounded-xl border border-black/[0.08] shadow-sm transition-colors text-xs"
                >
                  {copiedPrompt ? 'Prompt copied' : 'Copy prompt for AI Studio Web'}
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: PREVIEW */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Visual Viewport Box */}
                <div className="flex-1 w-full bg-[#F5F5F7] rounded-3xl p-6 flex flex-col items-center justify-center min-h-[420px] border border-black/[0.04]">
                  {/* Generated Image */}
                  {generatedImageUrl ? (
                    <div className="space-y-3 flex flex-col items-center max-w-sm">
                      <div className="rounded-2xl overflow-hidden shadow-xl border border-black/[0.06] bg-black">
                        <img
                          src={generatedImageUrl}
                          alt="Production Media"
                          className="w-full h-auto object-cover max-h-[440px]"
                        />
                      </div>
                      <span className="text-xs text-[#86868B] font-medium flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Production media ready</span>
                      </span>
                    </div>
                  ) : isCarousel && deterministicCanvasUrl ? (
                    /* Carousel Slide Preview */
                    <div className="space-y-4 flex flex-col items-center w-full max-w-sm">
                      <div className="rounded-2xl overflow-hidden shadow-xl border border-black/[0.06] bg-black aspect-[4/5] w-full">
                        <img
                          src={deterministicCanvasUrl}
                          alt={`Slide ${activeSlideIndex + 1}`}
                          className="w-full h-full object-contain"
                        />
                      </div>

                      {/* Slide Stepper */}
                      <div className="flex items-center space-x-3 text-xs">
                        <button
                          disabled={activeSlideIndex === 0}
                          onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                          aria-label="Previous carousel slide"
                          className="p-1.5 bg-white rounded-lg border border-black/[0.08] shadow-sm disabled:opacity-30 hover:bg-neutral-50"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-[#6E6E73] font-medium">
                          Slide <strong className="text-[#1D1D1F]">{activeSlideIndex + 1}</strong> of{' '}
                          {asset.slides?.length || 1}
                        </span>
                        <button
                          disabled={activeSlideIndex >= (asset.slides?.length || 1) - 1}
                          onClick={() =>
                            setActiveSlideIndex((prev) =>
                              Math.min((asset.slides?.length || 1) - 1, prev + 1)
                            )
                          }
                          aria-label="Next carousel slide"
                          className="p-1.5 bg-white rounded-lg border border-black/[0.08] shadow-sm disabled:opacity-30 hover:bg-neutral-50"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>

                        <button
                          disabled={generatingSlideIndex !== null}
                          onClick={() =>
                            handleGenerateSlideVisual(
                              asset.slides?.[activeSlideIndex]?.slideNumber || activeSlideIndex + 1
                            )
                          }
                          className="ml-2 px-3 py-1.5 bg-white hover:bg-neutral-50 border border-black/[0.08] text-xs font-medium rounded-xl shadow-sm text-[#FF4500] flex items-center space-x-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {generatingSlideIndex === (asset.slides?.[activeSlideIndex]?.slideNumber || activeSlideIndex + 1)
                              ? 'Generating…'
                              : 'Generate visual'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : deterministicCanvasUrl ? (
                    /* Deterministic Poster Preview */
                    <div className="space-y-3 flex flex-col items-center max-w-sm">
                      <div className="rounded-2xl overflow-hidden shadow-xl border border-black/[0.06] bg-black aspect-[4/5] w-full">
                        <img
                          src={deterministicCanvasUrl}
                          alt="Brand-system poster"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-xs text-[#86868B] font-medium">
                        Brand System Deterministic Design
                      </span>
                    </div>
                  ) : isVideo && asset.generatedVideoUrl ? (
                    <div className="space-y-3 w-full max-w-sm">
                      <div className="rounded-2xl overflow-hidden shadow-xl border border-black/[0.06] bg-black aspect-[9/16] w-full">
                        <video
                          src={asset.generatedVideoUrl}
                          controls
                          playsInline
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <span className="text-xs text-[#86868B] font-medium">Generated video ready for review</span>
                    </div>
                  ) : isVideo ? (
                    /* Video Initial Preview Placeholder */
                    <div className="text-center p-8 space-y-3">
                      <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-3xl flex items-center justify-center mx-auto">
                        <Video className="w-7 h-7" />
                      </div>
                      <h4 className="font-semibold text-base text-[#1D1D1F]">
                        Reel & Video Storyboard Ready
                      </h4>
                      <p className="text-xs text-[#6E6E73] max-w-xs mx-auto">
                        Hook, 3-scene camera direction, voiceover narration, and prompts are synthesized.
                      </p>
                    </div>
                  ) : null}
                </div>

                {/* Right Column: Production Methods Deck */}
                <div className="w-full lg:w-80 space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold uppercase text-[#86868B] tracking-wider">
                      Production Method
                    </h3>
                    <p className="text-xs text-[#6E6E73]">
                      Choose how this asset is materialized.
                    </p>
                  </div>

                  {isVideo ? (
                    /* Video Methods */
                    <div className="space-y-2.5">
                      <div className="bg-[#FBFBFD] p-4 rounded-2xl border border-black/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-[#1D1D1F]">Generate with {activeVideoProviderName}</span>
                          <span className="text-[10px] text-[#6E6E73] bg-black/[0.04] px-2 py-0.5 rounded-md font-mono">{activeVideoProviderName}</span>
                        </div>
                        <p className="text-xs text-[#6E6E73]">
                          Invokes configured video synthesis pipeline. Requires server provider configuration.
                        </p>
                        <button
                          onClick={handleGenerateVideo}
                          disabled={isGenerating}
                          className="w-full py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>{isGenerating ? 'Calling Video API…' : 'Generate video'}</span>
                        </button>
                      </div>

                      <div className="bg-[#FBFBFD] p-4 rounded-2xl border border-black/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-[#1D1D1F]">External Video Generation</span>
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">Free</span>
                        </div>
                        <p className="text-xs text-[#6E6E73]">
                          Copy the production-ready prompt, storyboard, and voiceover to generate manually in Google AI Studio or Runway.
                        </p>
                        <button
                          onClick={() => copyToClipboard(activePrompt, setCopiedPrompt)}
                          className="w-full py-2 bg-white hover:bg-neutral-50 border border-black/[0.08] text-[#1D1D1F] text-xs font-medium rounded-xl transition-all shadow-sm"
                        >
                          {copiedPrompt ? 'Prompt copied' : 'Copy video prompt'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Image & Carousel Methods */
                    <div className="space-y-2.5">
                      {/* Method 1: Brand System Design */}
                      <div className="bg-[#FBFBFD] p-4 rounded-2xl border border-black/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-[#1D1D1F]">Brand System Design</span>
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">Free</span>
                        </div>
                        <p className="text-xs text-[#6E6E73]">
                          Deterministic typography, colors, layout and safe areas. Zero hallucination.
                        </p>
                        <button
                          onClick={handleApplyDeterministicDesign}
                          className="w-full py-2 bg-white hover:bg-neutral-50 border border-black/[0.08] text-[#1D1D1F] text-xs font-medium rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5"
                        >
                          <Palette className="w-3.5 h-3.5 text-[#FF4500]" />
                          <span>Apply Brand System design</span>
                        </button>
                      </div>

                      {/* Method 2: AI Image */}
                      <div className="bg-[#FBFBFD] p-4 rounded-2xl border border-black/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-[#1D1D1F]">Generate with {activeImageProviderName}</span>
                          <span className="text-[10px] text-[#6E6E73] bg-black/[0.04] px-2 py-0.5 rounded-md font-mono">{activeImageProviderName}</span>
                        </div>
                        <p className="text-xs text-[#6E6E73]">
                          Synthesizes visual creative using configured provider ({activeImageProviderName}).
                        </p>
                        <button
                          onClick={handleGenerateImage}
                          disabled={isGenerating}
                          className="w-full py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>{isGenerating ? 'Synthesizing…' : generatedImageUrl ? 'Regenerate image' : 'Generate image'}</span>
                        </button>
                      </div>

                      {/* Method 3: External AI */}
                      <div className="bg-[#FBFBFD] p-4 rounded-2xl border border-black/[0.06] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-xs text-[#1D1D1F]">External AI</span>
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">BYOK</span>
                        </div>
                        <p className="text-xs text-[#6E6E73]">
                          Copy the optimized prompt to generate in Midjourney or AI Studio Web.
                        </p>
                        <button
                          onClick={() => copyToClipboard(activePrompt, setCopiedPrompt)}
                          className="w-full py-2 bg-white hover:bg-neutral-50 border border-black/[0.08] text-[#1D1D1F] text-xs font-medium rounded-xl transition-all shadow-sm"
                        >
                          {copiedPrompt ? 'Prompt copied' : 'Copy prompt'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: CONTENT */}
          {activeTab === 'content' && (
            <div className="space-y-6 max-w-3xl">
              {/* Hook Card */}
              <div className="bg-[#FBFBFD] p-5 rounded-2xl border border-black/[0.06] space-y-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#FF4500]">
                  Primary Hook (First 3 Seconds / Slide 1)
                </span>
                <p className="text-base font-semibold text-[#1D1D1F] leading-snug">
                  "{asset.hook}"
                </p>
              </div>

              {/* Caption Section */}
              <div className="bg-[#FBFBFD] p-5 rounded-2xl border border-black/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                    Full Caption
                  </span>
                  <button
                    onClick={() => copyToClipboard(asset.caption, setCopiedCaption)}
                    className="text-xs font-medium text-[#FF4500] hover:underline flex items-center space-x-1"
                  >
                    {copiedCaption ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCaption ? 'Copied' : 'Copy caption'}</span>
                  </button>
                </div>
                <p className="text-xs text-[#1D1D1F] whitespace-pre-line leading-relaxed font-normal">
                  {asset.caption}
                </p>
              </div>

              {/* Hashtags & CTA */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-[#FBFBFD] p-5 rounded-2xl border border-black/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                      Hashtags
                    </span>
                    <button
                      onClick={() =>
                        copyToClipboard(asset.hashtags.map((h) => `#${h}`).join(' '), setCopiedHashtags)
                      }
                      className="text-xs font-medium text-[#FF4500] hover:underline"
                    >
                      {copiedHashtags ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {asset.hashtags.map((tag, idx) => (
                      <span key={idx} className="text-xs text-[#6E6E73] bg-white px-2 py-0.5 rounded-md border border-black/[0.06]">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="bg-[#FBFBFD] p-5 rounded-2xl border border-black/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                      Call to Action
                    </span>
                    <button
                      onClick={() => copyToClipboard(asset.callToAction, setCopiedCTA)}
                      className="text-xs font-medium text-[#FF4500] hover:underline"
                    >
                      {copiedCTA ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-xs font-semibold text-[#1D1D1F] pt-1">
                    {asset.callToAction}
                  </p>
                </div>
              </div>

              {/* Target Persona & Content Intelligence */}
              <div className="bg-[#FBFBFD] p-5 rounded-2xl border border-black/[0.06] space-y-2 text-xs">
                <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                  Target Buyer Persona & Intelligence
                </span>
                <p className="text-xs text-[#1D1D1F] font-medium">
                  {asset.targetBuyerPersona}
                </p>
                {asset.viralityRationale && (
                  <p className="text-xs text-[#6E6E73] pt-1 leading-relaxed">
                    Strategy: {asset.viralityRationale}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: GENERATION */}
          {activeTab === 'generation' && (
            <div className="space-y-6 max-w-3xl">
              {/* Generation Prompt Box */}
              <div className="bg-[#FBFBFD] p-5 rounded-2xl border border-black/[0.06] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-[#FF4500]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                      {isVideo ? 'Video Generation Prompt' : 'Image Generation Prompt'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setIsEditingPrompt(!isEditingPrompt)}
                      className="text-xs text-[#6E6E73] hover:text-[#1D1D1F] font-medium flex items-center space-x-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{isEditingPrompt ? 'Lock' : 'Edit prompt'}</span>
                    </button>
                    <button
                      onClick={() => copyToClipboard(activePrompt, setCopiedPrompt)}
                      className="text-xs text-[#FF4500] hover:underline font-medium flex items-center space-x-1"
                    >
                      {copiedPrompt ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {isEditingPrompt ? (
                  <textarea
                    value={activePrompt}
                    onChange={(e) => setActivePrompt(e.target.value)}
                    rows={4}
                    className="w-full bg-white border border-black/[0.1] rounded-xl p-3 text-xs text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20 resize-none font-mono"
                  />
                ) : (
                  <p className="text-xs text-[#1D1D1F] font-mono leading-relaxed bg-white p-3 rounded-xl border border-black/[0.06]">
                    {activePrompt}
                  </p>
                )}

                <div className="flex items-center justify-between text-[11px] text-[#86868B] pt-1">
                  <span>Target Model: <strong className="text-[#1D1D1F] font-medium">{isVideo ? (activeVideoModel || activeVideoProviderName) : (activeImageModel || activeImageProviderName)}</strong></span>
                  <span>Cost Protection: Explicit trigger only</span>
                </div>
              </div>

              {/* Video Storyboard Breakdown (if video asset) */}
              {isVideo && asset.videoScenes && asset.videoScenes.length > 0 && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
                    Storyboard & Scene Breakdown
                  </span>
                  <div className="space-y-3">
                    {asset.videoScenes.map((scene) => (
                      <div
                        key={scene.sceneNumber}
                        className="bg-[#FBFBFD] p-4 rounded-2xl border border-black/[0.06] space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between text-[#FF4500] font-medium">
                          <span>Scene {scene.sceneNumber} · {scene.timestamp}</span>
                          <span className="text-[#86868B]">{scene.visualFocus}</span>
                        </div>
                        <div className="font-semibold text-[#1D1D1F]">
                          "{scene.hookText}"
                        </div>
                        <p className="text-[#6E6E73] text-[11px]">
                          Voiceover: {scene.narrationVoiceover}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: POSTING */}
          {activeTab === 'posting' && (
            <div className="space-y-6 max-w-3xl">
              <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-800 font-semibold text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Ready to Post Package</span>
                </div>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  Autonomous publishing is disabled by design. Copy your complete production package below to post manually to Instagram, LinkedIn, X, or YouTube.
                </p>
              </div>

              {/* Quick Copy Action Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => copyToClipboard(asset.caption, setCopiedCaption)}
                  className="p-4 bg-[#FBFBFD] hover:bg-neutral-100 rounded-2xl border border-black/[0.06] text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs text-[#86868B] block">Primary Caption</span>
                    <span className="text-xs font-semibold text-[#1D1D1F] block mt-0.5 truncate max-w-[200px]">
                      {asset.caption.slice(0, 35)}…
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[#FF4500]">
                    {copiedCaption ? 'Copied ✓' : 'Copy'}
                  </span>
                </button>

                <button
                  onClick={() =>
                    copyToClipboard(asset.hashtags.map((h) => `#${h}`).join(' '), setCopiedHashtags)
                  }
                  className="p-4 bg-[#FBFBFD] hover:bg-neutral-100 rounded-2xl border border-black/[0.06] text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs text-[#86868B] block">Hashtags</span>
                    <span className="text-xs font-semibold text-[#1D1D1F] block mt-0.5">
                      {asset.hashtags.length} tags
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[#FF4500]">
                    {copiedHashtags ? 'Copied ✓' : 'Copy'}
                  </span>
                </button>

                <button
                  onClick={() => copyToClipboard(asset.callToAction, setCopiedCTA)}
                  className="p-4 bg-[#FBFBFD] hover:bg-neutral-100 rounded-2xl border border-black/[0.06] text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs text-[#86868B] block">Call to Action</span>
                    <span className="text-xs font-semibold text-[#1D1D1F] block mt-0.5 truncate max-w-[200px]">
                      {asset.callToAction}
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[#FF4500]">
                    {copiedCTA ? 'Copied ✓' : 'Copy'}
                  </span>
                </button>

                <button
                  onClick={handleDownloadSingle}
                  className="p-4 bg-[#FBFBFD] hover:bg-neutral-100 rounded-2xl border border-black/[0.06] text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs text-[#86868B] block">Media File</span>
                    <span className="text-xs font-semibold text-[#1D1D1F] block mt-0.5">
                      1080×1350 High-Res PNG
                    </span>
                  </div>
                  <span className="text-xs font-medium text-[#FF4500] flex items-center space-x-1">
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="px-4 sm:px-6 py-3 border-t border-black/[0.06] bg-white flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-[#6E6E73] mr-1">Already generated media elsewhere?</span>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#1D1D1F] hover:bg-black/[0.03]">
            <ArrowUpRight className="h-3.5 w-3.5 text-[#FF4500]" />
            <span>{isUploadingMedia ? 'Uploading…' : 'Upload finished media'}</span>
            <input
              type="file"
              className="sr-only"
              accept="image/png,image/jpeg,image/webp,video/mp4"
              disabled={isUploadingMedia || isGenerating}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUploadFinishedMedia(file);
                e.currentTarget.value = '';
              }}
            />
          </label>
          <span className="text-[10px] text-[#86868B]">PNG, JPG, WEBP or MP4 · max 100 MB</span>
        </div>

        {/* Modal Bottom Operational Footer */}
        <div className="px-4 sm:px-6 py-3.5 border-t border-black/[0.06] bg-[#FBFBFD] flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky bottom-0">
          <div className="flex items-center space-x-2 text-xs text-[#86868B]">
            <span>Asset Status:</span>
            <span className="font-medium text-[#1D1D1F] capitalize">{productionStatus.toLowerCase().replace('_', ' ')}</span>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full sm:w-auto">
            {/* Primary Download Button */}
            {isCarousel ? (
              <button
                onClick={handleDownloadAllSlides}
                className="flex-1 sm:flex-none justify-center px-3.5 py-2.5 bg-white hover:bg-neutral-50 text-[#1D1D1F] border border-black/[0.08] text-xs font-medium rounded-xl shadow-xs transition-all flex items-center space-x-1.5 min-h-[40px]"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Download slides</span>
              </button>
            ) : (
              <button
                onClick={handleDownloadSingle}
                className="flex-1 sm:flex-none justify-center px-3.5 py-2.5 bg-white hover:bg-neutral-50 text-[#1D1D1F] border border-black/[0.08] text-xs font-medium rounded-xl shadow-xs transition-all flex items-center space-x-1.5 min-h-[40px]"
              >
                <Download className="w-3.5 h-3.5 shrink-0" />
                <span>Download file</span>
              </button>
            )}

            {/* Approve Button */}
            <button
              onClick={handleApprove}
              className={`flex-1 sm:flex-none justify-center px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all shadow-xs flex items-center space-x-1.5 min-h-[40px] ${
                isApproved
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-white hover:bg-neutral-50 text-[#1D1D1F] border border-black/[0.08]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{isApproved ? 'Approved' : 'Approve asset'}</span>
            </button>

            {/* Primary Action Button */}
            {isVideo ? (
              <button
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl shadow-xs transition-all flex items-center space-x-1.5 active:scale-95 min-h-[40px]"
              >
                <Video className="w-3.5 h-3.5 shrink-0" />
                <span>{isGenerating ? 'Calling Veo…' : 'Generate video'}</span>
              </button>
            ) : (
              <button
                onClick={handleGenerateImage}
                disabled={isGenerating}
                className="flex-1 sm:flex-none justify-center px-4 py-2.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl shadow-xs transition-all flex items-center space-x-1.5 active:scale-95 min-h-[40px]"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>{isGenerating ? 'Synthesizing…' : generatedImageUrl ? 'Regenerate image' : 'Generate image'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
