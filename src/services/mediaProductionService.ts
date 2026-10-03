import { CarouselSlide, SocialAsset } from '../types/campaign';
import { getAuthHeaders } from './autonomaDataService';

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
export async function renderDeterministicSlideCanvas(
  slide: CarouselSlide,
  totalSlides: number,
  options: BrandRenderOptions & {
    assetTitle: string;
    assetCode: string;
    supportingImageUrl?: string;
  }
): Promise<string> {
  const brand = resolveBrand(options);
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  ctx.fillStyle = brand.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = hexToRgba(brand.text, 0.07);
  ctx.lineWidth = 1;
  for (let x = 0; x <= 1080; x += 72) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 1350); ctx.stroke();
  }
  for (let y = 0; y <= 1350; y += 72) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1080, y); ctx.stroke();
  }

  const glow = ctx.createRadialGradient(920, 100, 10, 920, 100, 560);
  glow.addColorStop(0, hexToRgba(brand.accent, 0.16));
  glow.addColorStop(1, hexToRgba(brand.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 1080, 1350);

  const m = 80;
  const right = 1000;
  const width = right - m;

  ctx.fillStyle = brand.primary;
  ctx.fillRect(m, 80, 44, 44);
  ctx.fillStyle = isDark(brand.primary) ? '#FFFFFF' : '#111111';
  ctx.font = `800 22px ${brand.headingFont}, Arial, sans-serif`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('A', m + 22, 102);

  ctx.fillStyle = brand.text;
  ctx.font = `700 22px ${brand.headingFont}, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.fillText(brand.companyName.toUpperCase().slice(0, 34), m + 62, 102);

  ctx.fillStyle = brand.accent;
  ctx.font = `700 18px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(`SLIDE ${slide.slideNumber} / ${totalSlides}`, right, 102);

  ctx.strokeStyle = brand.border; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(m, 145); ctx.lineTo(right, 145); ctx.stroke();

  let y = 205;
  const badge = slide.badge || options.assetCode || 'BRAND CONTENT';
  ctx.font = `700 15px ${brand.bodyFont}, Arial, sans-serif`;
  const bw = Math.min(width, ctx.measureText(badge).width + 32);
  ctx.fillStyle = brand.card; ctx.fillRect(m, y, bw, 38);
  ctx.strokeStyle = brand.accent; ctx.strokeRect(m, y, bw, 38);
  ctx.fillStyle = brand.accent; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText(badge.slice(0, 60), m + 16, y + 19);
  y += 72;

  if (options.supportingImageUrl) {
    try {
      const img = new Image(); img.crossOrigin = 'anonymous'; img.src = options.supportingImageUrl;
      await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
      if (img.complete && img.naturalWidth > 0) {
        const h = 330;
        ctx.strokeStyle = brand.border; ctx.strokeRect(m, y, width, h);
        ctx.drawImage(img, m, y, width, h);
        y += h + 38;
      }
    } catch {}
  }

  ctx.fillStyle = brand.text;
  ctx.font = `800 46px ${brand.headingFont}, Arial, sans-serif`;
  ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  y = drawWrappedText(ctx, (slide.headline || options.assetTitle).toUpperCase(), m, y, width, 56, 4) + 18;

  if (slide.subtext) {
    ctx.fillStyle = brand.muted;
    ctx.font = `400 21px ${brand.bodyFont}, Arial, sans-serif`;
    y = drawWrappedText(ctx, slide.subtext, m, y, width, 30, 3) + 22;
  }

  ctx.strokeStyle = brand.border; ctx.beginPath(); ctx.moveTo(m, y); ctx.lineTo(right, y); ctx.stroke(); y += 28;

  for (const item of slide.body || []) {
    const cardH = 88;
    ctx.fillStyle = brand.card; ctx.fillRect(m, y, width, cardH);
    ctx.strokeStyle = brand.border; ctx.strokeRect(m, y, width, cardH);
    ctx.fillStyle = brand.accent; ctx.fillRect(m, y, 5, cardH);
    ctx.fillStyle = brand.text;
    ctx.font = `600 18px ${brand.bodyFont}, Arial, sans-serif`;
    ctx.textBaseline = 'top';
    drawWrappedText(ctx, item, m + 24, y + 18, width - 48, 25, 2);
    y += cardH + 16;
    if (y > 1190) break;
  }

  const footY = 1240;
  ctx.strokeStyle = brand.border; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(m, footY); ctx.lineTo(right, footY); ctx.stroke();
  ctx.fillStyle = brand.muted; ctx.font = `16px ${brand.bodyFont}, Arial, sans-serif`; ctx.textAlign = 'left';
  ctx.fillText((brand.website || brand.companyName).slice(0, 52), m, footY + 35);
  ctx.fillStyle = brand.text; ctx.font = `700 16px ${brand.bodyFont}, Arial, sans-serif`; ctx.textAlign = 'right';
  ctx.fillText('SWIPE NEXT →', right, footY + 35);

  return canvas.toDataURL('image/png');
}

export async function downloadAllCarouselSlides(
  asset: SocialAsset,
  slideVisuals?: Record<number, string>,
  brandOptions: BrandRenderOptions = {}
) {
  const slides = asset.slides || [];
  for (const slide of slides) {
    const dataUrl = await renderDeterministicSlideCanvas(slide, slides.length, {
      ...brandOptions,
      assetTitle: asset.title,
      assetCode: asset.assetCode,
      supportingImageUrl: slideVisuals?.[slide.slideNumber]
    });
    downloadDataUrl(`${asset.assetCode}-slide-${slide.slideNumber}.png`, dataUrl);
    await new Promise((r) => setTimeout(r, 180));
  }
}

/** Company-aware deterministic renderer for posters/founder cards. */
export async function renderDeterministicPosterCanvas(
  asset: SocialAsset,
  supportingImageUrl?: string,
  brandOptions: BrandRenderOptions = {}
): Promise<string> {
  const brand = resolveBrand(brandOptions);
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = asset.format === 'founder_card' ? 1080 : 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  ctx.fillStyle = brand.background; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = hexToRgba(brand.text, 0.07); ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 72) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke(); }
  for (let y = 0; y <= canvas.height; y += 72) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke(); }

  const grad = ctx.createRadialGradient(canvas.width, 0, 10, canvas.width, 0, 520);
  grad.addColorStop(0, hexToRgba(brand.accent, 0.16)); grad.addColorStop(1, hexToRgba(brand.accent, 0));
  ctx.fillStyle = grad; ctx.fillRect(0, 0, canvas.width, canvas.height);

  const m = 80; const w = canvas.width - m * 2;
  ctx.fillStyle = brand.primary; ctx.fillRect(m, 80, 44, 44);
  ctx.fillStyle = isDark(brand.primary) ? '#FFFFFF' : '#111111'; ctx.font = `800 22px ${brand.headingFont}, Arial, sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('A', m + 22, 102);
  ctx.fillStyle = brand.text; ctx.font = `700 22px ${brand.headingFont}, Arial, sans-serif`; ctx.textAlign = 'left'; ctx.fillText(brand.companyName.toUpperCase().slice(0, 34), m + 62, 102);
  ctx.fillStyle = brand.accent; ctx.font = `700 17px ${brand.bodyFont}, Arial, sans-serif`; ctx.textAlign = 'right'; ctx.fillText(asset.assetCode, canvas.width - m, 102);

  let y = 178;
  const badge = `${asset.platform.toUpperCase()} · ${asset.format.toUpperCase().replace('_', ' ')}`;
  ctx.font = `700 15px ${brand.bodyFont}, Arial, sans-serif`; const bw = Math.min(w, ctx.measureText(badge).width + 32);
  ctx.fillStyle = brand.card; ctx.fillRect(m, y, bw, 38); ctx.strokeStyle = brand.accent; ctx.strokeRect(m, y, bw, 38);
  ctx.fillStyle = brand.accent; ctx.textAlign = 'left'; ctx.fillText(badge, m + 16, y + 24); y += 72;

  if (supportingImageUrl) {
    try {
      const img = new Image(); img.crossOrigin = 'anonymous'; img.src = supportingImageUrl;
      await new Promise((resolve) => { img.onload = resolve; img.onerror = resolve; });
      if (img.complete && img.naturalWidth > 0) {
        const h = asset.format === 'founder_card' ? 330 : 410;
        ctx.strokeStyle = brand.border; ctx.strokeRect(m, y, w, h); ctx.drawImage(img, m, y, w, h); y += h + 36;
      }
    } catch {}
  }

  ctx.fillStyle = brand.text; ctx.font = `800 43px ${brand.headingFont}, Arial, sans-serif`; ctx.textBaseline = 'top'; ctx.textAlign = 'left';
  y = drawWrappedText(ctx, asset.title.toUpperCase(), m, y, w, 52, 4) + 24;

  ctx.fillStyle = brand.card; ctx.fillRect(m, y, w, 120); ctx.strokeStyle = brand.border; ctx.strokeRect(m, y, w, 120); ctx.fillStyle = brand.accent; ctx.fillRect(m, y, 6, 120);
  ctx.fillStyle = brand.text; ctx.font = `500 19px ${brand.bodyFont}, Arial, sans-serif`; ctx.textBaseline = 'top';
  drawWrappedText(ctx, `“${asset.hook.slice(0, 220)}”`, m + 28, y + 24, w - 56, 27, 3);
  y += 150;

  const footY = canvas.height - 110;
  ctx.strokeStyle = brand.border; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(m, footY); ctx.lineTo(canvas.width - m, footY); ctx.stroke();
  ctx.fillStyle = brand.muted; ctx.font = `16px ${brand.bodyFont}, Arial, sans-serif`; ctx.textAlign = 'left'; ctx.fillText((brand.website || brand.companyName).slice(0, 52), m, footY + 40);
  ctx.fillStyle = brand.accent; ctx.font = `700 16px ${brand.bodyFont}, Arial, sans-serif`; ctx.textAlign = 'right'; ctx.fillText(brand.companyName.slice(0, 34).toUpperCase(), canvas.width - m, footY + 40);

  return canvas.toDataURL('image/png');
}
