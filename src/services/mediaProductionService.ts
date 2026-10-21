import { CarouselSlide, SocialAsset } from '../types/campaign';
import { getAuthHeaders } from './autonomaDataService';
import { 
  renderComposedCanvas, 
  exportCreative,
  downloadAllComposedSlides,
  isTextSafeFormat,
  getRecommendedTemplate,
  CompositionTemplateId,
  CompositionOptions
} from './deterministicCompositionService';

export {
  renderComposedCanvas,
  exportCreative,
  downloadAllComposedSlides,
  isTextSafeFormat,
  getRecommendedTemplate
};
export type { CompositionTemplateId, CompositionOptions };

export interface ImageGenerationResult {
  success: boolean;
  provider?: string;
  model: string;
  dataUrl?: string;
  fileUrl?: string;
  filename?: string;
  error?: string;
  isBillingRequired?: boolean;
}

export interface VideoGenerationResult {
  success: boolean;
  provider?: string;
  model: string;
  operationName?: string;
  fileUrl?: string;
  error?: string;
  isBillingRequired?: boolean;
}

export interface MediaRequestContext {
  providerId?: string;
  modelName?: string;
  platform?: string;
  format?: string;
  language?: string;
  objective?: string;
  assetId?: string;
  campaignId?: string;
}

export interface BrandRenderOptions {
  companyName?: string;
  website?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  headingFont?: string;
  bodyFont?: string;
  logoUrl?: string;
}

export async function persistComposedCreative(
  dataUrl: string,
  context: { assetId: string; campaignId?: string; assetCode?: string; filename?: string }
): Promise<string> {
  if (!dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  const response = await fetch(dataUrl);
  const blob = await response.blob();
  const mime = blob.type === 'image/jpeg' ? 'image/jpeg' : blob.type === 'image/webp' ? 'image/webp' : 'image/png';
  const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/webp' ? 'webp' : 'png';
  const filename = context.filename || `${context.assetCode || context.assetId}-composed.${ext}`;

  const upload = await fetch(
    `/api/media/upload?assetId=${encodeURIComponent(context.assetId)}&campaignId=${encodeURIComponent(context.campaignId || '')}&assetCode=${encodeURIComponent(context.assetCode || context.assetId)}&mediaType=IMAGE&filename=${encodeURIComponent(filename)}`,
    {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': mime }),
      body: blob
    }
  );

  const json = await upload.json().catch(() => null);
  if (!upload.ok || !json?.success || !json?.fileUrl) {
    throw new Error(json?.error || 'Final creative could not be saved to durable media storage.');
  }
  return json.fileUrl as string;
}

/** Server-side image generation. Credentials remain on the server. */
export async function generateAssetImage(
  prompt: string,
  aspectRatio: string = '3:4',
  assetCode: string = 'ASSET',
  customApiKey?: string,
  context: MediaRequestContext = {}
): Promise<ImageGenerationResult> {
  try {
    const res = await fetch('/api/media/generate-image', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        prompt,
        aspectRatio,
        assetCode,
        customApiKey,
        ...context
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        provider: data.provider,
        model: data.model || context.modelName || 'configured image provider',
        error: data.error || data.message || 'Image generation failed',
        isBillingRequired: Boolean(data.isBillingRequired)
      };
    }

    return {
      success: true,
      provider: data.provider,
      model: data.model || context.modelName || 'configured image provider',
      dataUrl: data.dataUrl,
      fileUrl: data.fileUrl,
      filename: data.filename
    };
  } catch (err: any) {
    return {
      success: false,
      model: context.modelName || 'configured image provider',
      error: err?.message || 'Network error connecting to image generation endpoint'
    };
  }
}

/** Server-side video generation. Only providers with a real callable endpoint return success. */
export async function generateAssetVideo(
  prompt: string,
  aspectRatio: string = '9:16',
  assetCode: string = 'ASSET',
  customApiKey?: string,
  context: MediaRequestContext = {}
): Promise<VideoGenerationResult> {
  try {
    const res = await fetch('/api/media/generate-video', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        prompt,
        aspectRatio,
        assetCode,
        customApiKey,
        ...context
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        provider: data.provider,
        model: data.model || context.modelName || 'configured video provider',
        error: data.error || data.message || 'Video generation unavailable or failed',
        isBillingRequired: Boolean(data.isBillingRequired)
      };
    }

    return {
      success: true,
      provider: data.provider,
      model: data.model || context.modelName || 'configured video provider',
      operationName: data.operationName || data.fileUrl,
      fileUrl: data.fileUrl && !String(data.fileUrl).startsWith('operations/') ? data.fileUrl : undefined
    };
  } catch (err: any) {
    return {
      success: false,
      model: context.modelName || 'configured video provider',
      error: err?.message || 'Network error connecting to video generation endpoint'
    };
  }
}

export async function pollVideoStatus(
  operationName: string,
  customApiKey?: string
): Promise<{ success?: boolean; done: boolean; error?: string }> {
  const res = await fetch('/api/media/video-status', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ operationName, customApiKey })
  });
  const data = await res.json();
  if (!res.ok) return { done: false, error: data.error || data.message || 'Video status check failed' };
  return data;
}

export async function downloadGeneratedVideo(
  operationName: string,
  assetCode: string,
  customApiKey?: string
): Promise<{ success: boolean; videoUrl?: string; filename?: string; error?: string }> {
  const res = await fetch('/api/media/video-download', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ operationName, assetCode, customApiKey })
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    return { success: false, error: data.error || data.message || 'Video download failed' };
  }
  return data;
}


export async function uploadAssetMedia(
  file: File,
  context: { assetId: string; campaignId?: string; assetCode?: string; mediaType: 'IMAGE' | 'VIDEO' }
): Promise<{ success: boolean; fileUrl?: string; filename?: string; error?: string }> {
  try {
    const params = new URLSearchParams({
      assetId: context.assetId,
      campaignId: context.campaignId || '',
      assetCode: context.assetCode || 'ASSET',
      mediaType: context.mediaType,
      filename: file.name
    });
    const res = await fetch(`/api/media/upload?${params.toString()}`, {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': file.type || 'application/octet-stream' }),
      body: file
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data.error || data.message || 'Media upload failed' };
    }
    return { success: true, fileUrl: data.fileUrl, filename: data.filename };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Media upload failed' };
  }
}

export function downloadDataUrl(filename: string, dataUrl: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function isDark(hex: string): boolean {
  const normalized = (hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return false;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = (hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(107,114,128,${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function resolveBrand(options: BrandRenderOptions = {}) {
  const background = options.backgroundColor || '#FFFFFF';
  const dark = isDark(background);
  return {
    companyName: options.companyName || 'YOUR BRAND',
    website: options.website || '',
    primary: options.primaryColor || (dark ? '#FFFFFF' : '#1D1D1F'),
    secondary: options.secondaryColor || '#6B7280',
    accent: options.accentColor || options.secondaryColor || '#6B7280',
    background,
    text: options.textColor || (dark ? '#FFFFFF' : '#1D1D1F'),
    muted: dark ? '#B8BDC7' : '#6B7280',
    card: dark ? '#16181D' : '#F5F5F7',
    border: dark ? '#30343B' : '#DADDE2',
    headingFont: options.headingFont || 'Inter',
    bodyFont: options.bodyFont || 'Inter'
  };
}

function drawWrappedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
  maxLines: number = 6
): number {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  let line = '';
  let lineCount = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line ? `${line} ${words[i]}` : words[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y + lineCount * lineHeight);
      lineCount++;
      line = words[i];
      if (lineCount >= maxLines - 1) break;
    } else {
      line = test;
    }
  }
  if (line && lineCount < maxLines) {
    ctx.fillText(line, x, y + lineCount * lineHeight);
    lineCount++;
  }
  return y + lineCount * lineHeight;
}

/** Company-aware deterministic renderer for carousel slides. */
/** Company-aware deterministic renderer for carousel slides. */
export async function renderDeterministicSlideCanvas(
  slide: CarouselSlide,
  totalSlides: number,
  options: BrandRenderOptions & {
    assetTitle: string;
    assetCode: string;
    supportingImageUrl?: string;
  }
): Promise<string> {
  return renderComposedCanvas({
    ...options,
    template: 'carousel_slide',
    format: 'carousel',
    headline: slide.headline,
    subheadline: slide.subtext,
    slide,
    slideIndex: (slide.slideNumber || 1) - 1,
    totalSlides
  });
}

export async function downloadAllCarouselSlides(
  asset: SocialAsset,
  slideVisuals?: Record<number, string>,
  brandOptions: BrandRenderOptions = {},
  format: 'png' | 'jpeg' | 'pdf' = 'png'
) {
  return downloadAllComposedSlides(asset, slideVisuals || {}, brandOptions, format);
}

/** Company-aware deterministic renderer for posters/founder cards. */
export async function renderDeterministicPosterCanvas(
  asset: SocialAsset,
  supportingImageUrl?: string,
  brandOptions: BrandRenderOptions = {},
  template?: CompositionTemplateId
): Promise<string> {
  const chosenTemplate = template || getRecommendedTemplate(asset.format);
  return renderComposedCanvas({
    ...brandOptions,
    template: chosenTemplate,
    assetTitle: asset.title,
    assetCode: asset.assetCode,
    headline: asset.title,
    subheadline: asset.strategicPurpose || asset.angle,
    hook: asset.hook,
    caption: asset.caption,
    callToAction: asset.callToAction,
    platform: asset.platform,
    format: asset.format,
    supportingImageUrl: supportingImageUrl || asset.generatedBackgroundUrl || asset.generatedImageUrl
  });
}

