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
  ArrowUpRight,
  Layout,
  FileDown,
  CheckCircle
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
  renderComposedCanvas,
  exportCreative,
  downloadAllComposedSlides,
  isTextSafeFormat,
  getRecommendedTemplate,
  persistComposedCreative,
  CompositionTemplateId,
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

export type ImageProviderOptionId = 'cloudflare' | 'openai' | 'nvidia' | 'gemini';

export interface ImageProviderOption {
  id: ImageProviderOptionId;
  title: string;
  badge?: string;
  helperText: string;
  exampleHint?: string;
}

export const IMAGE_PROVIDER_OPTIONS: ImageProviderOption[] = [
  {
    id: 'cloudflare',
    title: 'Cloudflare FLUX',
    badge: 'Default',
    helperText: 'Best for everyday campaign images. Fast, low-cost / free-first, and suitable for most social creatives.'
  },
  {
    id: 'openai',
    title: 'OpenAI',
    helperText: 'Use for advanced imaging when you want more polished outputs, stronger prompt-following, and better results for complex or premium visuals.',
    exampleHint: 'Examples: premium product visuals, high-quality posters, nuanced compositions, refined branding scenes.'
  },
  {
    id: 'nvidia',
    title: 'NVIDIA NIM',
    helperText: 'Use the configured NVIDIA image model for fast production visuals when NVIDIA capacity is available.'
  },
  {
    id: 'gemini',
    title: 'Gemini',
    helperText: 'Use this when you already have Gemini billing and want image generation under your Gemini stack.'
  }
];

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

  // Image provider selector state (Default is Cloudflare FLUX)
  const [selectedImageProvider, setSelectedImageProvider] = useState<ImageProviderOptionId>('cloudflare');
  const [providersData, setProvidersData] = useState<Record<string, any>>({});

  const isCarousel = asset?.format === 'carousel';
  const isVideo = asset?.format === 'reel_short';
  const isTextSafe = isTextSafeFormat(asset?.format);
  const isImageOrPoster = !isCarousel && !isVideo;

  // Deterministic Composition & Overlay State
  const [compositionMode, setCompositionMode] = useState<'DETERMINISTIC_COMPOSITION' | 'AI_BACKGROUND_ONLY'>(
    asset?.compositionMode || (isTextSafe ? 'DETERMINISTIC_COMPOSITION' : 'AI_BACKGROUND_ONLY')
  );
  const [generatedBackgroundUrl, setGeneratedBackgroundUrl] = useState<string | null>(
    asset?.generatedBackgroundUrl || null
  );
  const [composedAssetUrl, setComposedAssetUrl] = useState<string | null>(
    asset?.composedAssetUrl || null
  );
  const [compositionTemplate, setCompositionTemplate] = useState<CompositionTemplateId>(
    (asset?.compositionTemplate as CompositionTemplateId) || getRecommendedTemplate(asset?.format)
  );
  const [finalRenderableReady, setFinalRenderableReady] = useState<boolean>(
    Boolean(asset?.finalRenderableReady || asset?.composedAssetUrl)
  );
  const [previewViewMode, setPreviewViewMode] = useState<'composed' | 'background'>('composed');
  const [exportFormat, setExportFormat] = useState<'png' | 'jpeg' | 'pdf'>('png');
  const [isComposingLayout, setIsComposingLayout] = useState<boolean>(false);
  const [showCopyEditor, setShowCopyEditor] = useState<boolean>(false);

  // Editable copy state for layout customization
  const [customHeadline, setCustomHeadline] = useState<string>(asset?.title || '');
  const [customHook, setCustomHook] = useState<string>(asset?.hook || '');
  const [customCta, setCustomCta] = useState<string>(asset?.callToAction || '');

  // Media previews
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(
    asset?.composedAssetUrl || asset?.generatedImageUrl || null
  );
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(asset?.generatedVideoUrl || null);
  const [deterministicCanvasUrl, setDeterministicCanvasUrl] = useState<string | null>(null);

  // Carousel slide state
  const [activeSlideIndex, setActiveSlideIndex] = useState<number>(0);
  const [slideVisuals, setSlideVisuals] = useState<Record<number, string>>(
    asset?.carouselSlideVisuals || asset?.carouselSlideBackgrounds || {}
  );
  const [carouselSlideBackgrounds, setCarouselSlideBackgrounds] = useState<Record<number, string>>(
    asset?.carouselSlideBackgrounds || asset?.carouselSlideVisuals || {}
  );
  const [carouselSlideComposedUrls, setCarouselSlideComposedUrls] = useState<Record<number, string>>(
    asset?.carouselSlideComposedUrls || {}
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
  const [activeImageProviderName, setActiveImageProviderName] = useState<string>('Cloudflare FLUX');
  const [activeVideoProviderName, setActiveVideoProviderName] = useState<string>('Video Provider');
  const [activeImageProviderId, setActiveImageProviderId] = useState<string | undefined>('cloudflare');
  const [activeVideoProviderId, setActiveVideoProviderId] = useState<string | undefined>();
  const [activeImageModel, setActiveImageModel] = useState<string | undefined>('@cf/black-forest-labs/flux-1-schnell');
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

      setProvidersData(providers);

      const configuredImageProviders = (['cloudflare', 'openai', 'nvidia', 'gemini'] as ImageProviderOptionId[])
        .filter((id) => Boolean(providers?.[id]?.hasKey));
      const preferredImageProvider =
        (defImg === 'cloudflare' || defImg === 'openai' || defImg === 'nvidia' || defImg === 'gemini') && providers?.[defImg]?.hasKey
          ? defImg
          : configuredImageProviders[0];

      if (preferredImageProvider) {
        setSelectedImageProvider(preferredImageProvider);
      }

      setActiveImageProviderId(preferredImageProvider || defImg || 'cloudflare');
      setActiveVideoProviderId(defVid);
      setActiveImageModel(defImg ? providers?.[defImg]?.selectedModel : '@cf/black-forest-labs/flux-1-schnell');
      setActiveVideoModel(defVid ? providers?.[defVid]?.selectedModel : undefined);

      if (defImg === 'cloudflare') setActiveImageProviderName('Cloudflare FLUX');
      else if (defImg === 'openai') setActiveImageProviderName(`OpenAI ${providers?.openai?.selectedModel || 'Image'}`);
      else if (defImg === 'nvidia') setActiveImageProviderName(`NVIDIA ${providers?.nvidia?.selectedModel || 'NIM'}`);
      else if (defImg === 'gemini') setActiveImageProviderName('Google Gemini Image');
      else setActiveImageProviderName('Cloudflare FLUX');

      if (defVid === 'google_veo') setActiveVideoProviderName(`Google ${providers?.google_veo?.selectedModel || 'Veo'}`);
      else if (defVid === 'nvidia') setActiveVideoProviderName('NVIDIA video (not enabled in this build)');
      else setActiveVideoProviderName('Configured Video Provider');

      const company = companyRes?.company;
      const profile: any = companyRes?.profile || company?.profile || {};
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
        bodyFont: brand.bodyFont,
        logoUrl: brand.logoUrl
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

  // Sync state when asset prop changes
  useEffect(() => {
    if (!asset) return;
    setProductionStatus(asset.productionStatus || 'NOT_GENERATED');
    const bg = asset.generatedBackgroundUrl || (asset.composedAssetUrl ? asset.generatedBackgroundUrl : asset.generatedImageUrl) || null;
    setGeneratedBackgroundUrl(bg);
    setComposedAssetUrl(asset.composedAssetUrl || null);
    setGeneratedImageUrl(asset.composedAssetUrl || asset.generatedImageUrl || null);
    setGeneratedVideoUrl(asset.generatedVideoUrl || null);
    setSlideVisuals(asset.carouselSlideVisuals || asset.carouselSlideBackgrounds || {});
    setCarouselSlideBackgrounds(asset.carouselSlideBackgrounds || asset.carouselSlideVisuals || {});
    setCarouselSlideComposedUrls(asset.carouselSlideComposedUrls || {});
    setCompositionMode(asset.compositionMode || (isTextSafe ? 'DETERMINISTIC_COMPOSITION' : 'AI_BACKGROUND_ONLY'));
    setCompositionTemplate((asset.compositionTemplate as CompositionTemplateId) || getRecommendedTemplate(asset.format));
    setFinalRenderableReady(Boolean(asset.finalRenderableReady || asset.composedAssetUrl));
    setGenerationError(asset.productionError || null);
    setCustomHeadline(asset.title || '');
    setCustomHook(asset.hook || '');
    setCustomCta(asset.callToAction || '');

    const defaultBgPrompt = `Clean supporting background visual for "${asset.title}". High-end commercial aesthetic, photographic composition, clean negative space for brand typography, lighting and mood aligned with brand palette. [NO text, NO letters, NO logos, NO watermarks].`;

    setActivePrompt(
      asset.generatedImagePrompt ||
        asset.posterVisualPrompt ||
        asset.videoGenerationPrompt ||
        defaultBgPrompt
    );
  }, [asset, isTextSafe]);

  // Generate deterministic preview for carousel or poster
  useEffect(() => {
    if (!asset) return;
    let isMounted = true;
    async function updateCanvas() {
      if (!asset) return;
      if (isCarousel && asset.slides && asset.slides[activeSlideIndex]) {
        try {
          const currentSlide = asset.slides[activeSlideIndex];
          const visual = slideVisuals[currentSlide.slideNumber] || generatedBackgroundUrl || undefined;
          const url = await renderComposedCanvas({
            ...brandRenderOptions,
            template: 'carousel_slide',
            assetTitle: customHeadline || asset.title,
            assetCode: asset.assetCode,
            headline: currentSlide.headline,
            subheadline: currentSlide.subtext,
            callToAction: customCta || asset.callToAction,
            format: 'carousel',
            platform: asset.platform,
            supportingImageUrl: visual,
            slide: currentSlide,
            slideIndex: activeSlideIndex,
            totalSlides: asset.slides.length
          });
          if (isMounted) setDeterministicCanvasUrl(url);
        } catch (e) {
          console.error('Failed to render slide canvas:', e);
        }
      } else if (isImageOrPoster) {
        try {
          const url = await renderComposedCanvas({
            ...brandRenderOptions,
            template: compositionTemplate,
            assetTitle: customHeadline || asset.title,
            assetCode: asset.assetCode,
            headline: customHeadline || asset.title,
            subheadline: asset.strategicPurpose || asset.angle,
            hook: customHook || asset.hook,
            caption: asset.caption,
            callToAction: customCta || asset.callToAction,
            platform: asset.platform,
            format: asset.format,
            supportingImageUrl: generatedBackgroundUrl || undefined
          });
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
  }, [
    asset,
    activeSlideIndex,
    slideVisuals,
    generatedBackgroundUrl,
    compositionTemplate,
    customHeadline,
    customHook,
    customCta,
    isCarousel,
    isImageOrPoster,
    brandRenderOptions
  ]);

  // Handler: Real Server-Side Image Generation (Visual/Background Only for Text-Safe Formats)
  const handleGenerateImage = async () => {
    if (!asset || isGenerating) return;
    setIsGenerating(true);
    setGenerationError(null);
    setIsBillingRequired(false);
    setProductionStatus('GENERATING');

    const currentModel = providersData[selectedImageProvider]?.selectedModel || (
      selectedImageProvider === 'cloudflare'
        ? '@cf/black-forest-labs/flux-1-schnell'
        : selectedImageProvider === 'openai'
        ? 'gpt-image-2'
        : selectedImageProvider === 'nvidia'
        ? 'stabilityai/stable-diffusion-3-medium'
        : 'gemini-3.1-flash-lite-image'
    );

    const result = await generateAssetImage(activePrompt, '3:4', asset.assetCode, customApiKey, {
      providerId: selectedImageProvider,
      modelName: currentModel,
      platform: asset.platform,
      format: asset.format,
      language: asset.language,
      objective: asset.strategicPurpose,
      assetId: asset.id,
      campaignId: asset.campaignId
    });

    const generatedUrl = result.fileUrl || result.dataUrl;
    if (result.success && generatedUrl) {
      setGeneratedBackgroundUrl(generatedUrl);

      // Automatically compose the final creative, but persist only a durable media URL.
      // Canvas data URLs stay browser-local and are never stored in the asset/database row.
      let composedPreviewUrl = '';
      let composedDurableUrl = '';
      try {
        composedPreviewUrl = await renderComposedCanvas({
          ...brandRenderOptions,
          template: compositionTemplate,
          assetTitle: customHeadline || asset.title,
          assetCode: asset.assetCode,
          headline: customHeadline || asset.title,
          subheadline: asset.strategicPurpose || asset.angle,
          hook: customHook || asset.hook,
          caption: asset.caption,
          callToAction: customCta || asset.callToAction,
          platform: asset.platform,
          format: asset.format,
          supportingImageUrl: generatedUrl
        });
        composedDurableUrl = await persistComposedCreative(composedPreviewUrl, {
          assetId: asset.id,
          campaignId: asset.campaignId,
          assetCode: asset.assetCode
        });
        setComposedAssetUrl(composedDurableUrl);
        setDeterministicCanvasUrl(composedPreviewUrl);
        setFinalRenderableReady(true);
      } catch (composeErr: any) {
        console.warn('Auto-composition note:', composeErr);
        setFinalRenderableReady(false);
        setGenerationError(
          composeErr?.message ||
          'The visual was generated, but the final branded creative could not be saved. Use Apply Brand Layout to retry.'
        );
      }

      const finalUrl = composedDurableUrl || generatedUrl;
      setGeneratedImageUrl(finalUrl);
      setProductionStatus(composedDurableUrl ? 'READY' : 'NOT_GENERATED');

      const updated: SocialAsset = {
        ...asset,
        productionStatus: composedDurableUrl ? 'READY' : 'NOT_GENERATED',
        generatedBackgroundUrl: generatedUrl,
        composedAssetUrl: composedDurableUrl || undefined,
        generatedImageUrl: finalUrl,
        compositionMode: 'DETERMINISTIC_COMPOSITION',
        compositionTemplate,
        finalRenderableReady: Boolean(composedDurableUrl),
        composedAt: composedDurableUrl ? new Date().toISOString() : undefined,
        generatedImagePrompt: activePrompt,
        productionError: composedDurableUrl ? undefined : 'Final brand composition is not durably saved yet.'
      };
      onUpdateAsset(updated);
    } else {
      setProductionStatus('FAILED');
      setGenerationError(result.error || 'Image visual generation failed');
      setIsBillingRequired(Boolean(result.isBillingRequired));
      const updated: SocialAsset = {
        ...asset,
        productionStatus: 'FAILED',
        productionError: result.error || 'Image visual generation failed'
      };
      onUpdateAsset(updated);
    }
    setIsGenerating(false);
  };

  // Handler: Apply Brand Layout / Recompose Deterministic Overlay
  const handleApplyBrandLayout = async (targetTemplate?: CompositionTemplateId) => {
    if (!asset || isComposingLayout) return;
    setIsComposingLayout(true);
    setGenerationError(null);
    const tmpl = targetTemplate || compositionTemplate;

    try {
      let composedPreviewUrl = '';
      let nextSlideComposed = { ...carouselSlideComposedUrls };

      if (isCarousel && asset.slides && asset.slides[activeSlideIndex]) {
        const currentSlide = asset.slides[activeSlideIndex];
        const visual = slideVisuals[currentSlide.slideNumber] || generatedBackgroundUrl || undefined;
        composedPreviewUrl = await renderComposedCanvas({
          ...brandRenderOptions,
          template: 'carousel_slide',
          assetTitle: customHeadline || asset.title,
          assetCode: asset.assetCode,
          headline: currentSlide.headline,
          subheadline: currentSlide.subtext,
          callToAction: customCta || asset.callToAction,
          format: 'carousel',
          platform: asset.platform,
          supportingImageUrl: visual,
          slide: currentSlide,
          slideIndex: activeSlideIndex,
          totalSlides: asset.slides.length
        });
      } else {
        composedPreviewUrl = await renderComposedCanvas({
          ...brandRenderOptions,
          template: tmpl,
          assetTitle: customHeadline || asset.title,
          assetCode: asset.assetCode,
          headline: customHeadline || asset.title,
          subheadline: asset.strategicPurpose || asset.angle,
          hook: customHook || asset.hook,
          caption: asset.caption,
          callToAction: customCta || asset.callToAction,
          platform: asset.platform,
          format: asset.format,
          supportingImageUrl: generatedBackgroundUrl || undefined
        });
      }

      const composedDurableUrl = await persistComposedCreative(composedPreviewUrl, {
        assetId: asset.id,
        campaignId: asset.campaignId,
        assetCode: asset.assetCode,
        filename: isCarousel && asset.slides?.[activeSlideIndex]
          ? `${asset.assetCode}-slide-${asset.slides[activeSlideIndex].slideNumber}.png`
          : `${asset.assetCode}-final.png`
      });

      if (isCarousel && asset.slides && asset.slides[activeSlideIndex]) {
        const currentSlide = asset.slides[activeSlideIndex];
        nextSlideComposed = { ...nextSlideComposed, [currentSlide.slideNumber]: composedDurableUrl };
        setCarouselSlideComposedUrls(nextSlideComposed);
      }

      setComposedAssetUrl(composedDurableUrl);
      setDeterministicCanvasUrl(composedPreviewUrl);
      setGeneratedImageUrl(composedDurableUrl);
      setFinalRenderableReady(true);
      setProductionStatus('READY');

      const updated: SocialAsset = {
        ...asset,
        productionStatus: 'READY',
        composedAssetUrl: composedDurableUrl,
        generatedImageUrl: composedDurableUrl,
        generatedBackgroundUrl: generatedBackgroundUrl || undefined,
        carouselSlideComposedUrls: isCarousel ? nextSlideComposed : asset.carouselSlideComposedUrls,
        compositionMode: 'DETERMINISTIC_COMPOSITION',
        compositionTemplate: tmpl,
        finalRenderableReady: true,
        composedAt: new Date().toISOString(),
        productionError: undefined
      };
      onUpdateAsset(updated);
    } catch (err: any) {
      setGenerationError(err?.message || 'Failed to apply brand layout');
    } finally {
      setIsComposingLayout(false);
    }
  };

  // Handler: Generate visual for individual carousel slide
  const handleGenerateSlideVisual = async (slideNumber: number) => {
    if (!asset || generatingSlideIndex !== null) return;
    setGeneratingSlideIndex(slideNumber);
    setGenerationError(null);

    const slide = asset.slides?.find((s) => s.slideNumber === slideNumber);
    const slidePrompt =
      slide?.visualPrompt ||
      `Clean supporting background visual for "${slide?.headline || asset.title}". Commercial lighting, brand color palette, clean negative space. [NO text, NO letters, NO logos].`;

    const currentModel = providersData[selectedImageProvider]?.selectedModel || (
      selectedImageProvider === 'cloudflare'
        ? '@cf/black-forest-labs/flux-1-schnell'
        : selectedImageProvider === 'openai'
        ? 'gpt-image-2'
        : selectedImageProvider === 'nvidia'
        ? 'stabilityai/stable-diffusion-3-medium'
        : 'gemini-3.1-flash-lite-image'
    );

    const result = await generateAssetImage(slidePrompt, '16:9', `${asset.assetCode.replace(/^APEX-/, 'AUTO-')}-S${slideNumber}`, customApiKey, {
      providerId: selectedImageProvider,
      modelName: currentModel,
      platform: asset.platform,
      format: 'carousel',
      language: asset.language,
      objective: asset.strategicPurpose,
      assetId: asset.id,
      campaignId: asset.campaignId
    });

    const generatedUrl = result.dataUrl || result.fileUrl;
    if (result.success && generatedUrl) {
      const nextVisuals = { ...slideVisuals, [slideNumber]: generatedUrl };
      setSlideVisuals(nextVisuals);
      setCarouselSlideBackgrounds(nextVisuals);

      // Auto-compose slide
      let composedSlideUrl = generatedUrl;
      try {
        if (slide) {
          composedSlideUrl = await renderComposedCanvas({
            ...brandRenderOptions,
            template: 'carousel_slide',
            assetTitle: customHeadline || asset.title,
            assetCode: asset.assetCode,
            headline: slide.headline,
            subheadline: slide.subtext,
            callToAction: customCta || asset.callToAction,
            format: 'carousel',
            platform: asset.platform,
            supportingImageUrl: generatedUrl,
            slide,
            slideIndex: (slide.slideNumber || 1) - 1,
            totalSlides: asset.slides?.length || 1
          });
        }
      } catch (e) {
        console.warn('Slide auto-compose note:', e);
      }

      const nextComposed = { ...carouselSlideComposedUrls, [slideNumber]: composedSlideUrl };
      setCarouselSlideComposedUrls(nextComposed);
      setDeterministicCanvasUrl(composedSlideUrl);
      setFinalRenderableReady(true);

      const updated: SocialAsset = {
        ...asset,
        carouselSlideVisuals: nextVisuals,
        carouselSlideBackgrounds: nextVisuals,
        carouselSlideComposedUrls: nextComposed,
        composedAssetUrl: composedSlideUrl,
        finalRenderableReady: true
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

  // Handler: Final Creative Download (PNG, JPG, PDF)
  const handleDownloadFinal = async () => {
    if (!asset) return;
    const targetUrl = composedAssetUrl || deterministicCanvasUrl || generatedImageUrl;
    if (!targetUrl) return;
    await exportCreative(
      targetUrl,
      `${asset.assetCode.replace(/^APEX-/, 'AUTO-')}-final`,
      exportFormat
    );
  };

  // Handler: Download Background Only
  const handleDownloadBackgroundOnly = async () => {
    if (!asset) return;
    const targetUrl = generatedBackgroundUrl || (isCarousel ? slideVisuals[activeSlideIndex + 1] : null);
    if (!targetUrl) return;
    await exportCreative(
      targetUrl,
      `${asset.assetCode.replace(/^APEX-/, 'AUTO-')}-background`,
      'png'
    );
  };

  // Handler: Download All Slides
  const handleDownloadAllSlides = async () => {
    if (!asset) return;
    await downloadAllCarouselSlides(asset, slideVisuals, brandRenderOptions, exportFormat);
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

  // Apply deterministic design directly (legacy alias to handleApplyBrandLayout)
  const handleApplyDeterministicDesign = () => {
    handleApplyBrandLayout();
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
    <div role="dialog" aria-modal="true" aria-label="Asset production" onMouseDown={(e) => { if (e.target === e.currentTarget && !isGenerating && !isUploadingMedia) onClose(); }} className="fixed inset-0 z-[500] flex items-stretch sm:items-center justify-center p-0 sm:p-6 bg-black/40 backdrop-blur-md overflow-hidden sm:overflow-y-auto">
      <div className="bg-white rounded-none sm:rounded-3xl border-0 sm:border border-black/[0.08] shadow-2xl w-full max-w-5xl sm:my-4 text-[#1D1D1F] flex flex-col h-[100dvh] sm:h-auto sm:max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 sm:space-y-6 min-h-0">
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
                        : selectedImageProvider === 'gemini'
                        ? 'Gemini image generation requires paid API quota'
                        : 'Image generation requires configured provider credentials'
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
              {/* 3-Step Production Pipeline Status */}
              {isTextSafe && (
                <div className="bg-[#FBFBFD] border border-black/[0.06] rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1D1D1F] uppercase tracking-wider text-[11px]">Production Pipeline:</span>
                    <span className="text-[#86868B] text-[11px]">(Text-Safe Brand Overlay)</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Step 1 */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-xs ${
                      generatedBackgroundUrl ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {generatedBackgroundUrl ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />}
                      <span>1. Background Visual {generatedBackgroundUrl ? 'Ready' : 'Pending'}</span>
                    </div>
                    {/* Step 2 */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-xs ${
                      finalRenderableReady ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60' : 'bg-neutral-100 text-neutral-600'
                    }`}>
                      {finalRenderableReady ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />}
                      <span>2. Brand Layout {finalRenderableReady ? 'Applied' : 'Pending'}</span>
                    </div>
                    {/* Step 3 */}
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium text-xs ${
                      finalRenderableReady ? 'bg-blue-50 text-blue-700 border border-blue-200/60' : 'bg-neutral-100 text-neutral-500'
                    }`}>
                      {finalRenderableReady ? <CheckCircle className="w-3.5 h-3.5 text-blue-600" /> : <div className="w-1.5 h-1.5 rounded-full bg-neutral-400" />}
                      <span>3. Final Asset {finalRenderableReady ? 'Ready for Export' : 'Incomplete'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col lg:flex-row gap-6 items-start">
                {/* Visual Viewport Box */}
                <div className="flex-1 w-full bg-[#F5F5F7] rounded-3xl p-6 flex flex-col items-center justify-center min-h-[440px] border border-black/[0.04]">
                  {/* Viewport Top Mode Bar */}
                  <div className="w-full flex items-center justify-between pb-3 border-b border-black/[0.06] mb-4">
                    <span className="text-xs font-semibold text-[#86868B] uppercase tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5 text-[#FF4500]" />
                      <span>{previewViewMode === 'composed' ? 'Final Composed Creative' : 'Raw AI Visual Background'}</span>
                    </span>
                    {isTextSafe && generatedBackgroundUrl && (
                      <div className="p-0.5 bg-black/[0.04] rounded-lg flex items-center text-[11px] font-medium">
                        <button
                          onClick={() => setPreviewViewMode('composed')}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            previewViewMode === 'composed' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                          }`}
                        >
                          Final Composed
                        </button>
                        <button
                          onClick={() => setPreviewViewMode('background')}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                            previewViewMode === 'background' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                          }`}
                        >
                          Raw Visual
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Mode A: View Raw Visual Background Only */}
                  {previewViewMode === 'background' && generatedBackgroundUrl ? (
                    <div className="space-y-3 flex flex-col items-center max-w-sm">
                      <div className="rounded-2xl overflow-hidden shadow-xl border border-black/[0.06] bg-black aspect-[4/5] w-full">
                        <img
                          src={generatedBackgroundUrl}
                          alt="AI Background Visual"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-[#86868B] font-medium">Text-Free AI Background</span>
                        <button
                          onClick={handleDownloadBackgroundOnly}
                          className="text-[#FF4500] hover:underline font-semibold flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download background</span>
                        </button>
                      </div>
                    </div>
                  ) : isCarousel ? (
                    /* Mode B: Carousel Slide Composed View */
                    <div className="space-y-4 flex flex-col items-center w-full max-w-sm">
                      <div className="rounded-2xl overflow-hidden shadow-xl border border-black/[0.06] bg-black aspect-[4/5] w-full">
                        {deterministicCanvasUrl ? (
                          <img
                            src={deterministicCanvasUrl}
                            alt={`Slide ${activeSlideIndex + 1}`}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-white/50 text-xs">
                            Rendering slide composition…
                          </div>
                        )}
                      </div>

                      {/* Slide Stepper & Slide Visual Generator */}
                      <div className="flex flex-wrap items-center justify-center gap-2 text-xs w-full">
                        <div className="flex items-center space-x-2 bg-white px-2.5 py-1.5 rounded-xl border border-black/[0.08] shadow-xs">
                          <button
                            disabled={activeSlideIndex === 0}
                            onClick={() => setActiveSlideIndex((prev) => Math.max(0, prev - 1))}
                            aria-label="Previous carousel slide"
                            className="p-1 rounded-md disabled:opacity-30 hover:bg-neutral-100 cursor-pointer"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <span className="text-[#6E6E73] font-medium text-[11px]">
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
                            className="p-1 rounded-md disabled:opacity-30 hover:bg-neutral-100 cursor-pointer"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          disabled={generatingSlideIndex !== null}
                          onClick={() =>
                            handleGenerateSlideVisual(
                              asset.slides?.[activeSlideIndex]?.slideNumber || activeSlideIndex + 1
                            )
                          }
                          className="px-3 py-1.5 bg-white hover:bg-neutral-50 border border-black/[0.08] text-xs font-medium rounded-xl shadow-xs text-[#FF4500] flex items-center space-x-1 cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>
                            {generatingSlideIndex === (asset.slides?.[activeSlideIndex]?.slideNumber || activeSlideIndex + 1)
                              ? 'Generating visual…'
                              : 'Generate slide visual'}
                          </span>
                        </button>
                      </div>
                    </div>
                  ) : deterministicCanvasUrl || composedAssetUrl ? (
                    /* Mode C: Deterministic Composed Creative (Poster / Quote Card / Infographic) */
                    <div className="space-y-3 flex flex-col items-center max-w-sm w-full">
                      <div className="rounded-2xl overflow-hidden shadow-xl border border-black/[0.06] bg-black aspect-[4/5] w-full">
                        <img
                          src={deterministicCanvasUrl || composedAssetUrl || ''}
                          alt="Composed Creative"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-[#86868B] font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Deterministic layout applied with Brand System</span>
                      </div>
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
                    /* Video Placeholder */
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
                  ) : (
                    <div className="text-center p-8 space-y-3">
                      <div className="w-14 h-14 bg-orange-100 text-[#FF4500] rounded-3xl flex items-center justify-center mx-auto">
                        <Palette className="w-7 h-7" />
                      </div>
                      <h4 className="font-semibold text-base text-[#1D1D1F]">
                        Ready to Compose Creative
                      </h4>
                      <p className="text-xs text-[#6E6E73] max-w-xs mx-auto">
                        Click "Generate Visual" for an AI background or "Apply Brand Layout" to preview the deterministic typography design.
                      </p>
                    </div>
                  )}
                </div>

                {/* Right Column: Text-Safe Production Actions */}
                <div className="w-full lg:w-84 space-y-4">
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
                    /* Text-Safe Deterministic Overlay Production Panel */
                    <div className="space-y-3.5">
                      {/* Section Title & Safe-Text Badge */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs font-bold uppercase text-[#1D1D1F] tracking-wider flex items-center gap-1.5">
                            <Layers className="w-3.5 h-3.5 text-[#FF4500]" />
                            <span>Deterministic Composition</span>
                          </h3>
                          <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/60 font-bold px-2 py-0.5 rounded-md">
                            TEXT-SAFE
                          </span>
                        </div>
                        <p className="text-[11px] text-[#6E6E73] leading-relaxed">
                          AI generates the visual only. Real campaign copy, logo, and brand fonts are overlaid deterministically.
                        </p>
                      </div>

                      {/* Deterministic Template Selector (for Posters & Cards) */}
                      {!isCarousel && (
                        <div className="bg-[#FBFBFD] p-3 rounded-2xl border border-black/[0.06] space-y-2">
                          <label className="text-[11px] font-bold text-[#1D1D1F] block">
                            Brand Layout Template
                          </label>
                          <div className="grid grid-cols-3 gap-1.5">
                            {[
                              { id: 'editorial_poster', label: 'Editorial' },
                              { id: 'quote_card', label: 'Quote Card' },
                              { id: 'infographic_flyer', label: 'Infographic' }
                            ].map((tmpl) => (
                              <button
                                key={tmpl.id}
                                onClick={() => {
                                  setCompositionTemplate(tmpl.id as CompositionTemplateId);
                                  handleApplyBrandLayout(tmpl.id as CompositionTemplateId);
                                }}
                                className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer text-center ${
                                  compositionTemplate === tmpl.id
                                    ? 'bg-[#1D1D1F] text-white shadow-xs'
                                    : 'bg-white hover:bg-neutral-100 text-[#6E6E73] border border-black/[0.06]'
                                }`}
                              >
                                {tmpl.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ACTION 1: Generate Visual (AI Background Only) */}
                      {(() => {
                        const currentOption = IMAGE_PROVIDER_OPTIONS.find((p) => p.id === selectedImageProvider) || IMAGE_PROVIDER_OPTIONS[0];
                        const currentCfg = providersData[selectedImageProvider];
                        const configuredOptions = IMAGE_PROVIDER_OPTIONS.filter((opt) => Boolean(providersData[opt.id]?.hasKey));
                        const isConfigured = Boolean(currentCfg?.hasKey);

                        return (
                          <div className="bg-[#FBFBFD] p-3.5 rounded-2xl border border-black/[0.06] space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-[#1D1D1F] flex items-center gap-1.5">
                                <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
                                <span>1. Generate Visual</span>
                              </span>
                              <span className="text-[10px] text-[#86868B] font-medium">
                                Background only
                              </span>
                            </div>

                            {/* Provider Dropdown */}
                            <select
                              value={selectedImageProvider}
                              onChange={(e) => setSelectedImageProvider(e.target.value as ImageProviderOptionId)}
                              className="w-full rounded-xl border border-black/[0.08] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#1D1D1F] outline-none shadow-2xs focus:border-[#FF4500] cursor-pointer"
                            >
                              {configuredOptions.length > 0 ? configuredOptions.map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.title} {opt.badge ? `(${opt.badge})` : ''}
                                </option>
                              )) : (
                                <option value={selectedImageProvider}>No configured AI image provider</option>
                              )}
                            </select>

                            <button
                              onClick={handleGenerateImage}
                              disabled={isGenerating || !isConfigured}
                              className="w-full py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>
                                {isGenerating
                                  ? 'Generating visual…'
                                  : generatedBackgroundUrl
                                  ? 'Regenerate visual'
                                  : 'Generate visual'}
                              </span>
                            </button>
                            <p className="text-[10px] text-[#86868B] leading-tight">
                              Generates clean background imagery with negative space for typography.
                            </p>
                          </div>
                        );
                      })()}

                      {/* ACTION 2: Apply Brand Layout & Typography */}
                      <div className="bg-[#FBFBFD] p-3.5 rounded-2xl border border-black/[0.06] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#1D1D1F] flex items-center gap-1.5">
                            <Layout className="w-3.5 h-3.5 text-[#FF4500]" />
                            <span>2. Apply Brand Layout</span>
                          </span>
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-medium">
                            Deterministic
                          </span>
                        </div>

                        <p className="text-[11px] text-[#6E6E73] leading-relaxed">
                          Overlays real campaign copy, brand logo, colors, and CTA onto the visual.
                        </p>

                        <button
                          onClick={() => handleApplyBrandLayout()}
                          disabled={isComposingLayout}
                          className="w-full py-2 bg-white hover:bg-neutral-50 border border-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 text-[#FF4500] ${isComposingLayout ? 'animate-spin' : ''}`} />
                          <span>{finalRenderableReady ? 'Recompose brand layout' : 'Apply brand layout'}</span>
                        </button>

                        {/* Optional Inline Copy Editor Toggle */}
                        <div className="pt-1 border-t border-black/[0.04]">
                          <button
                            onClick={() => setShowCopyEditor(!showCopyEditor)}
                            className="text-[11px] text-[#FF4500] hover:underline font-medium flex items-center gap-1 cursor-pointer"
                          >
                            <FileText className="w-3 h-3" />
                            <span>{showCopyEditor ? 'Hide layout copy editor' : 'Edit layout copy…'}</span>
                          </button>

                          {showCopyEditor && (
                            <div className="mt-2 space-y-2 bg-white p-3 rounded-xl border border-black/[0.06] animate-in fade-in duration-150">
                              <div>
                                <label className="text-[10px] font-bold text-[#6E6E73] block mb-1">Headline</label>
                                <input
                                  type="text"
                                  value={customHeadline}
                                  onChange={(e) => setCustomHeadline(e.target.value)}
                                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-black/[0.08] focus:border-[#FF4500] outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-[#6E6E73] block mb-1">Hook / Subheadline</label>
                                <textarea
                                  rows={2}
                                  value={customHook}
                                  onChange={(e) => setCustomHook(e.target.value)}
                                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-black/[0.08] focus:border-[#FF4500] outline-none resize-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-[#6E6E73] block mb-1">Call to Action</label>
                                <input
                                  type="text"
                                  value={customCta}
                                  onChange={(e) => setCustomCta(e.target.value)}
                                  className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-black/[0.08] focus:border-[#FF4500] outline-none"
                                />
                              </div>
                              <button
                                onClick={() => handleApplyBrandLayout()}
                                className="w-full py-1.5 bg-[#FF4500] text-white text-[11px] font-semibold rounded-lg hover:bg-[#EA3E00] transition-colors cursor-pointer"
                              >
                                Update & Recompose
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* ACTION 3: Export Final Creative */}
                      <div className="bg-[#FBFBFD] p-3.5 rounded-2xl border border-black/[0.06] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-[#1D1D1F] flex items-center gap-1.5">
                            <FileDown className="w-3.5 h-3.5 text-[#FF4500]" />
                            <span>3. Download Final Creative</span>
                          </span>
                          {/* Export Format Selector */}
                          <div className="flex items-center gap-1 text-[10px] font-bold">
                            {(['png', 'jpeg', 'pdf'] as const).map((fmt) => (
                              <button
                                key={fmt}
                                onClick={() => setExportFormat(fmt)}
                                className={`px-2 py-0.5 rounded uppercase cursor-pointer ${
                                  exportFormat === fmt
                                    ? 'bg-[#1D1D1F] text-white shadow-2xs'
                                    : 'bg-black/[0.04] text-[#6E6E73] hover:text-[#1D1D1F]'
                                }`}
                              >
                                {fmt === 'jpeg' ? 'JPG' : fmt.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        </div>

                        {finalRenderableReady || deterministicCanvasUrl ? (
                          <div className="space-y-1.5">
                            <button
                              onClick={handleDownloadFinal}
                              className="w-full py-2.5 bg-[#1D1D1F] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download Final Creative ({exportFormat === 'jpeg' ? 'JPG' : exportFormat.toUpperCase()})</span>
                            </button>

                            {isCarousel && (
                              <button
                                onClick={handleDownloadAllSlides}
                                className="w-full py-2 bg-white hover:bg-neutral-50 border border-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5 text-[#FF4500]" />
                                <span>Download All Slides ({exportFormat === 'jpeg' ? 'JPG' : exportFormat.toUpperCase()})</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200/60 text-[11px] text-amber-900 leading-snug">
                            Click <strong>Apply brand layout</strong> above to compose your deliverable before downloading.
                          </div>
                        )}
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
                  onClick={handleDownloadFinal}
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
                onClick={handleDownloadFinal}
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
                <span>{isGenerating ? 'Synthesizing…' : 'Generate Image'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
