import { getAuthHeaders } from './autonomaDataService';
import { CarouselSlide, SocialAsset } from '../types/campaign';

export type CompositionTemplateId =
  | 'editorial_poster'
  | 'quote_card'
  | 'infographic_flyer'
  | 'carousel_slide';

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

export interface CompositionOptions extends BrandRenderOptions {
  template?: CompositionTemplateId;
  assetTitle: string;
  assetCode: string;
  headline?: string;
  subheadline?: string;
  hook?: string;
  caption?: string;
  callToAction?: string;
  platform?: string;
  format?: string;
  supportingImageUrl?: string;
  slide?: CarouselSlide;
  slideIndex?: number;
  totalSlides?: number;
}

export function isTextSafeFormat(format?: string): boolean {
  if (!format) return false;
  const f = format.toLowerCase().trim();
  return ['static_poster', 'infographic_flyer', 'carousel', 'founder_card', 'quote_card'].includes(f);
}

export function getRecommendedTemplate(format?: string): CompositionTemplateId {
  if (!format) return 'editorial_poster';
  const f = format.toLowerCase().trim();
  if (f === 'carousel') return 'carousel_slide';
  if (f === 'founder_card' || f === 'quote_card') return 'quote_card';
  if (f === 'infographic_flyer') return 'infographic_flyer';
  return 'editorial_poster';
}

function isDark(hex: string): boolean {
  const normalized = (hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return true;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 145;
}

function hexToRgba(hex: string, alpha: number): string {
  const normalized = (hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) return `rgba(255, 69, 0, ${alpha})`;
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

interface ResolvedBrand {
  companyName: string;
  website: string;
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
  card: string;
  border: string;
  headingFont: string;
  bodyFont: string;
  logoUrl?: string;
}

function resolveBrand(options: BrandRenderOptions = {}): ResolvedBrand {
  const background = options.backgroundColor || '#0F1117';
  const dark = isDark(background);
  return {
    companyName: options.companyName || 'YOUR BRAND',
    website: options.website || '',
    primary: options.primaryColor || '#FF4500',
    secondary: options.secondaryColor || '#86868B',
    accent: options.accentColor || options.primaryColor || '#FF4500',
    background,
    text: options.textColor || (dark ? '#FFFFFF' : '#1D1D1F'),
    muted: dark ? '#A1A1A6' : '#6E6E73',
    card: dark ? 'rgba(255, 255, 255, 0.05)' : '#F5F5F7',
    border: dark ? 'rgba(255, 255, 255, 0.12)' : '#E5E5EA',
    headingFont: options.headingFont || 'Inter',
    bodyFont: options.bodyFont || 'Inter',
    logoUrl: options.logoUrl
  };
}

/**
 * Loads an image safely for Canvas rendering. If external, uses the server CORS proxy.
 */
async function loadSafeImage(url: string | undefined): Promise<HTMLImageElement | null> {
  if (!url || !url.trim()) return null;
  const trimmed = url.trim();

  let targetUrl = trimmed;
  let objectUrl: string | null = null;

  try {
    if (
      (trimmed.startsWith('http://') || trimmed.startsWith('https://')) &&
      typeof window !== 'undefined' &&
      !trimmed.startsWith(window.location.origin)
    ) {
      const response = await fetch(
        `/api/media/proxy-image?url=${encodeURIComponent(trimmed)}`,
        { headers: getAuthHeaders() }
      );
      if (!response.ok) return null;
      objectUrl = URL.createObjectURL(await response.blob());
      targetUrl = objectUrl;
    }

    return await new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        resolve(img.naturalWidth > 0 && img.naturalHeight > 0 ? img : null);
      };
      img.onerror = () => resolve(null);
      img.src = targetUrl;
    });
  } catch {
    return null;
  } finally {
    if (objectUrl) {
      // Delay revocation until the image element has decoded the blob.
      setTimeout(() => URL.revokeObjectURL(objectUrl as string), 1000);
    }
  }
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill?: string,
  stroke?: string,
  strokeWidth: number = 1
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();

  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.stroke();
  }
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
      if (lineCount === maxLines - 1 && i < words.length - 1) {
        ctx.fillText(`${line}…`, x, y + lineCount * lineHeight);
        lineCount++;
        line = '';
        break;
      }
      ctx.fillText(line, x, y + lineCount * lineHeight);
      lineCount++;
      line = words[i];
      if (lineCount >= maxLines) break;
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

/**
 * Draws brand logo with clean monogram fallback if no logo image is supplied.
 */
async function drawBrandLogo(
  ctx: CanvasRenderingContext2D,
  brand: ResolvedBrand,
  x: number,
  y: number,
  size: number
) {
  if (brand.logoUrl) {
    const logoImg = await loadSafeImage(brand.logoUrl);
    if (logoImg) {
      // Draw with preserve aspect ratio
      const aspect = logoImg.naturalWidth / logoImg.naturalHeight;
      let drawW = size;
      let drawH = size;
      if (aspect > 1) {
        drawH = size / aspect;
      } else {
        drawW = size * aspect;
      }
      const offsetX = x + (size - drawW) / 2;
      const offsetY = y + (size - drawH) / 2;
      ctx.drawImage(logoImg, offsetX, offsetY, drawW, drawH);
      return;
    }
  }

  // Fallback Monogram
  drawRoundedRect(ctx, x, y, size, size, 10, brand.primary, undefined, 0);
  ctx.fillStyle = isDark(brand.primary) ? '#FFFFFF' : '#111111';
  ctx.font = `800 ${Math.floor(size * 0.52)}px ${brand.headingFont}, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const letter = (brand.companyName || 'A').charAt(0).toUpperCase();
  ctx.fillText(letter, x + size / 2, y + size / 2 + 1);
}

// ==========================================
// TEMPLATE 1: EDITORIAL POSTER
// ==========================================
async function renderEditorialPoster(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  options: CompositionOptions,
  brand: ResolvedBrand
) {
  const width = canvas.width;
  const height = canvas.height;
  const m = 80;
  const contentW = width - m * 2;

  // 1. Background fill
  ctx.fillStyle = brand.background;
  ctx.fillRect(0, 0, width, height);

  // Subtle architectural grid
  ctx.strokeStyle = hexToRgba(brand.text, 0.05);
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 72) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y <= height; y += 72) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Radial ambient gradient
  const grad = ctx.createRadialGradient(width * 0.85, height * 0.1, 20, width * 0.85, height * 0.1, 650);
  grad.addColorStop(0, hexToRgba(brand.accent, 0.18));
  grad.addColorStop(1, hexToRgba(brand.accent, 0));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);

  // 2. Header Brand Deck
  const headerY = 70;
  const logoSize = 48;
  await drawBrandLogo(ctx, brand, m, headerY, logoSize);

  ctx.fillStyle = brand.text;
  ctx.font = `700 24px ${brand.headingFont}, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(brand.companyName.toUpperCase().slice(0, 32), m + logoSize + 16, headerY + logoSize / 2);

  // Asset code badge
  ctx.fillStyle = brand.accent;
  ctx.font = `700 17px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(options.assetCode || 'AUTONOMA CREATIVE', width - m, headerY + logoSize / 2);

  // Header separator line
  ctx.strokeStyle = brand.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(m, headerY + logoSize + 24);
  ctx.lineTo(width - m, headerY + logoSize + 24);
  ctx.stroke();

  let curY = headerY + logoSize + 52;

  // 3. Category / Platform Badge
  const platform = (options.platform || 'INSTAGRAM').toUpperCase();
  const formatLabel = (options.format || 'STATIC POSTER').replace(/_/g, ' ').toUpperCase();
  const badgeText = `${platform} · ${formatLabel}`;
  ctx.font = `700 14px ${brand.bodyFont}, Arial, sans-serif`;
  const badgeW = ctx.measureText(badgeText).width + 32;
  drawRoundedRect(ctx, m, curY, badgeW, 36, 18, brand.card, brand.accent, 1);
  ctx.fillStyle = brand.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, m + 16, curY + 18);

  curY += 60;

  // 4. Hero Visual Window (AI Generated Background)
  const heroH = 430;
  if (options.supportingImageUrl) {
    const heroImg = await loadSafeImage(options.supportingImageUrl);
    if (heroImg) {
      ctx.save();
      drawRoundedRect(ctx, m, curY, contentW, heroH, 20);
      ctx.clip();

      // Cover scaling
      const imgAspect = heroImg.naturalWidth / heroImg.naturalHeight;
      const frameAspect = contentW / heroH;
      let sW = heroImg.naturalWidth;
      let sH = heroImg.naturalHeight;
      let sx = 0;
      let sy = 0;

      if (imgAspect > frameAspect) {
        sW = heroImg.naturalHeight * frameAspect;
        sx = (heroImg.naturalWidth - sW) / 2;
      } else {
        sH = heroImg.naturalWidth / frameAspect;
        sy = (heroImg.naturalHeight - sH) / 2;
      }

      ctx.drawImage(heroImg, sx, sy, sW, sH, m, curY, contentW, heroH);

      // Subtle bottom gradient vignette over hero
      const heroGrad = ctx.createLinearGradient(m, curY + heroH - 120, m, curY + heroH);
      heroGrad.addColorStop(0, 'rgba(0,0,0,0)');
      heroGrad.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx.fillStyle = heroGrad;
      ctx.fillRect(m, curY, contentW, heroH);

      ctx.restore();

      // Border around frame
      drawRoundedRect(ctx, m, curY, contentW, heroH, 20, undefined, brand.border, 1.5);
      curY += heroH + 36;
    }
  }

  // 5. Headline
  const headline = (options.headline || options.assetTitle || '').toUpperCase();
  ctx.fillStyle = brand.text;
  ctx.font = `800 44px ${brand.headingFont}, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  curY = drawWrappedText(ctx, headline, m, curY, contentW, 54, 3) + 18;

  // 6. Subheadline / Hook Card
  const hookText = options.hook || options.subheadline || options.caption || '';
  if (hookText) {
    const cardH = 104;
    drawRoundedRect(ctx, m, curY, contentW, cardH, 16, brand.card, brand.border, 1);
    // Accent sidebar
    drawRoundedRect(ctx, m, curY, 6, cardH, 3, brand.accent, undefined, 0);

    ctx.fillStyle = brand.text;
    ctx.font = `500 19px ${brand.bodyFont}, Arial, sans-serif`;
    ctx.textBaseline = 'top';
    drawWrappedText(ctx, `“${hookText.slice(0, 190)}”`, m + 24, curY + 22, contentW - 48, 28, 2);
    curY += cardH + 28;
  }

  // 7. Call To Action Pill
  const cta = options.callToAction || 'Learn More · Read Full Analysis';
  ctx.font = `700 17px ${brand.bodyFont}, Arial, sans-serif`;
  const ctaW = Math.min(contentW, ctx.measureText(cta.toUpperCase()).width + 44);
  const ctaH = 48;
  drawRoundedRect(ctx, m, curY, ctaW, ctaH, 24, brand.primary, undefined, 0);
  ctx.fillStyle = isDark(brand.primary) ? '#FFFFFF' : '#111111';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(cta.toUpperCase(), m + ctaW / 2, curY + ctaH / 2);

  // 8. Footer Deck
  const footY = height - 90;
  ctx.strokeStyle = brand.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(m, footY);
  ctx.lineTo(width - m, footY);
  ctx.stroke();

  ctx.fillStyle = brand.muted;
  ctx.font = `500 16px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(brand.website || brand.companyName, m, footY + 40);

  ctx.fillStyle = brand.accent;
  ctx.font = `700 15px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('VERIFIED BRAND DELIVERABLE', width - m, footY + 40);
}

// ==========================================
// TEMPLATE 2: QUOTE CARD (FOUNDER / TESTIMONIAL)
// ==========================================
async function renderQuoteCard(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  options: CompositionOptions,
  brand: ResolvedBrand
) {
  const width = canvas.width;
  const height = canvas.height;
  const m = 80;
  const contentW = width - m * 2;

  // Background
  ctx.fillStyle = brand.background;
  ctx.fillRect(0, 0, width, height);

  // If atmospheric background image is present, draw full bleed with heavy scrim
  if (options.supportingImageUrl) {
    const bgImg = await loadSafeImage(options.supportingImageUrl);
    if (bgImg) {
      ctx.save();
      ctx.globalAlpha = 0.22;
      ctx.drawImage(bgImg, 0, 0, width, height);
      ctx.restore();
    }
  }

  // Soft glow
  const glow = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 600);
  glow.addColorStop(0, hexToRgba(brand.accent, 0.16));
  glow.addColorStop(1, hexToRgba(brand.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Top Bar
  const headerY = 70;
  const logoSize = 48;
  await drawBrandLogo(ctx, brand, m, headerY, logoSize);

  ctx.fillStyle = brand.text;
  ctx.font = `700 24px ${brand.headingFont}, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(brand.companyName.toUpperCase().slice(0, 32), m + logoSize + 16, headerY + logoSize / 2);

  ctx.fillStyle = brand.accent;
  ctx.font = `700 16px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('FOUNDER PERSPECTIVE', width - m, headerY + logoSize / 2);

  // Big Quotation Mark
  const quoteY = 220;
  ctx.fillStyle = hexToRgba(brand.accent, 0.35);
  ctx.font = `800 140px Georgia, serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('“', m - 8, quoteY);

  // Main Quote Text
  const quoteText = options.hook || options.headline || options.assetTitle || '';
  ctx.fillStyle = brand.text;
  ctx.font = `700 46px ${brand.headingFont}, Arial, sans-serif`;
  ctx.textBaseline = 'top';
  const afterQuoteY = drawWrappedText(ctx, quoteText, m, quoteY + 110, contentW, 60, 5) + 36;

  // Context / Subtext Card
  const sub = options.subheadline || options.caption?.slice(0, 200) || '';
  let curY = afterQuoteY;
  if (sub) {
    ctx.fillStyle = brand.muted;
    ctx.font = `400 22px ${brand.bodyFont}, Arial, sans-serif`;
    curY = drawWrappedText(ctx, sub, m, curY, contentW, 34, 3) + 40;
  }

  // Attribution badge
  const authorRole = 'FOUNDER & STRATEGIC ADVISOR';
  drawRoundedRect(ctx, m, curY, contentW, 88, 18, brand.card, brand.border, 1.5);
  drawRoundedRect(ctx, m, curY, 8, 88, 4, brand.accent, undefined, 0);

  ctx.fillStyle = brand.text;
  ctx.font = `700 20px ${brand.headingFont}, Arial, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(brand.companyName.toUpperCase(), m + 28, curY + 20);

  ctx.fillStyle = brand.muted;
  ctx.font = `500 15px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.fillText(authorRole, m + 28, curY + 50);

  // Footer
  const footY = height - 90;
  ctx.strokeStyle = brand.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(m, footY);
  ctx.lineTo(width - m, footY);
  ctx.stroke();

  ctx.fillStyle = brand.muted;
  ctx.font = `500 16px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(brand.website || brand.companyName, m, footY + 40);

  ctx.fillStyle = brand.accent;
  ctx.font = `700 15px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('DIRECTOR SIGN-OFF', width - m, footY + 40);
}

// ==========================================
// TEMPLATE 3: INFOGRAPHIC / SYSTEM BLUEPRINT
// ==========================================
async function renderInfographicFlyer(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  options: CompositionOptions,
  brand: ResolvedBrand
) {
  const width = canvas.width;
  const height = canvas.height;
  const m = 80;
  const contentW = width - m * 2;

  // Background
  ctx.fillStyle = brand.background;
  ctx.fillRect(0, 0, width, height);

  // Blueprint grid
  ctx.strokeStyle = hexToRgba(brand.accent, 0.08);
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 60) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y <= height; y += 60) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Header
  const headerY = 70;
  const logoSize = 48;
  await drawBrandLogo(ctx, brand, m, headerY, logoSize);

  ctx.fillStyle = brand.text;
  ctx.font = `700 24px ${brand.headingFont}, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(brand.companyName.toUpperCase().slice(0, 32), m + logoSize + 16, headerY + logoSize / 2);

  ctx.fillStyle = brand.accent;
  ctx.font = `700 16px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('INFOGRAPHIC BLUEPRINT', width - m, headerY + logoSize / 2);

  ctx.strokeStyle = brand.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(m, headerY + logoSize + 20);
  ctx.lineTo(width - m, headerY + logoSize + 20);
  ctx.stroke();

  let curY = headerY + logoSize + 48;

  // Title
  ctx.fillStyle = brand.text;
  ctx.font = `800 40px ${brand.headingFont}, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  curY = drawWrappedText(ctx, (options.headline || options.assetTitle).toUpperCase(), m, curY, contentW, 50, 3) + 20;

  // Supporting Visual Frame (if provided)
  if (options.supportingImageUrl) {
    const visual = await loadSafeImage(options.supportingImageUrl);
    if (visual) {
      const frameH = 260;
      ctx.save();
      drawRoundedRect(ctx, m, curY, contentW, frameH, 16);
      ctx.clip();
      ctx.drawImage(visual, m, curY, contentW, frameH);
      ctx.restore();
      drawRoundedRect(ctx, m, curY, contentW, frameH, 16, undefined, brand.border, 1.5);
      curY += frameH + 28;
    }
  }

  // Breakdown Pillars (3 structured comparison/system cards)
  const pillars = [
    { num: '01', title: 'PROBLEM & FRICTION', text: options.hook || 'Manual operational friction and non-standard processes.' },
    { num: '02', title: 'SYSTEM BLUEPRINT', text: options.subheadline || 'Deterministic workflow automation with real-time auditability.' },
    { num: '03', title: 'TRANSFORMATION', text: options.callToAction || 'Predictable commercial throughput without expanding headcount.' }
  ];

  for (const pillar of pillars) {
    const cardH = 96;
    drawRoundedRect(ctx, m, curY, contentW, cardH, 14, brand.card, brand.border, 1);
    drawRoundedRect(ctx, m, curY, 6, cardH, 3, brand.accent, undefined, 0);

    // Number tag
    ctx.fillStyle = brand.accent;
    ctx.font = `800 20px ${brand.headingFont}, Arial, sans-serif`;
    ctx.textBaseline = 'top';
    ctx.textAlign = 'left';
    ctx.fillText(pillar.num, m + 22, curY + 20);

    // Title
    ctx.fillStyle = brand.text;
    ctx.font = `700 17px ${brand.headingFont}, Arial, sans-serif`;
    ctx.fillText(pillar.title, m + 64, curY + 20);

    // Body
    ctx.fillStyle = brand.muted;
    ctx.font = `500 15px ${brand.bodyFont}, Arial, sans-serif`;
    drawWrappedText(ctx, pillar.text, m + 64, curY + 48, contentW - 90, 22, 2);

    curY += cardH + 16;
  }

  // Footer
  const footY = height - 90;
  ctx.strokeStyle = brand.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(m, footY);
  ctx.lineTo(width - m, footY);
  ctx.stroke();

  ctx.fillStyle = brand.muted;
  ctx.font = `500 16px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(brand.website || brand.companyName, m, footY + 40);

  ctx.fillStyle = brand.accent;
  ctx.font = `700 15px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText('SYSTEM CERTIFIED', width - m, footY + 40);
}

// ==========================================
// TEMPLATE 4: CAROUSEL SLIDE
// ==========================================
async function renderCarouselSlide(
  canvas: HTMLCanvasElement,
  ctx: CanvasRenderingContext2D,
  options: CompositionOptions,
  brand: ResolvedBrand
) {
  const width = canvas.width;
  const height = canvas.height;
  const m = 80;
  const contentW = width - m * 2;

  const slide = options.slide;
  const totalSlides = options.totalSlides || 1;
  const slideNum = slide?.slideNumber || (options.slideIndex !== undefined ? options.slideIndex + 1 : 1);

  // Background
  ctx.fillStyle = brand.background;
  ctx.fillRect(0, 0, width, height);

  // Grid
  ctx.strokeStyle = hexToRgba(brand.text, 0.06);
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 72) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y <= height; y += 72) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // Glow
  const glow = ctx.createRadialGradient(width - m, 100, 10, width - m, 100, 560);
  glow.addColorStop(0, hexToRgba(brand.accent, 0.18));
  glow.addColorStop(1, hexToRgba(brand.accent, 0));
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, width, height);

  // Header Brand Deck
  const headerY = 70;
  const logoSize = 48;
  await drawBrandLogo(ctx, brand, m, headerY, logoSize);

  ctx.fillStyle = brand.text;
  ctx.font = `700 24px ${brand.headingFont}, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(brand.companyName.toUpperCase().slice(0, 32), m + logoSize + 16, headerY + logoSize / 2);

  ctx.fillStyle = brand.accent;
  ctx.font = `700 18px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(`SLIDE ${slideNum} / ${totalSlides}`, width - m, headerY + logoSize / 2);

  ctx.strokeStyle = brand.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(m, headerY + logoSize + 22);
  ctx.lineTo(width - m, headerY + logoSize + 22);
  ctx.stroke();

  let curY = headerY + logoSize + 52;

  // Slide Badge
  const badgeText = slide?.badge || slide?.layout?.replace(/_/g, ' ').toUpperCase() || options.assetCode;
  ctx.font = `700 14px ${brand.bodyFont}, Arial, sans-serif`;
  const badgeW = ctx.measureText(badgeText).width + 32;
  drawRoundedRect(ctx, m, curY, badgeW, 36, 18, brand.card, brand.accent, 1);
  ctx.fillStyle = brand.accent;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, m + 16, curY + 18);

  curY += 60;

  // Supporting Visual Frame
  if (options.supportingImageUrl) {
    const visual = await loadSafeImage(options.supportingImageUrl);
    if (visual) {
      const frameH = 340;
      ctx.save();
      drawRoundedRect(ctx, m, curY, contentW, frameH, 18);
      ctx.clip();
      ctx.drawImage(visual, m, curY, contentW, frameH);
      ctx.restore();
      drawRoundedRect(ctx, m, curY, contentW, frameH, 18, undefined, brand.border, 1.5);
      curY += frameH + 34;
    }
  }

  // Slide Headline
  const headline = (slide?.headline || options.headline || options.assetTitle).toUpperCase();
  ctx.fillStyle = brand.text;
  ctx.font = `800 44px ${brand.headingFont}, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  curY = drawWrappedText(ctx, headline, m, curY, contentW, 54, 3) + 18;

  // Slide Subtext
  if (slide?.subtext) {
    ctx.fillStyle = brand.muted;
    ctx.font = `400 21px ${brand.bodyFont}, Arial, sans-serif`;
    curY = drawWrappedText(ctx, slide.subtext, m, curY, contentW, 32, 2) + 24;
  }

  // Slide Body Points Cards
  const bodyPoints = slide?.body && slide.body.length > 0 ? slide.body : [slide?.bodyCopy || options.hook || ''];
  for (const point of bodyPoints) {
    if (!point) continue;
    const cardH = 84;
    drawRoundedRect(ctx, m, curY, contentW, cardH, 14, brand.card, brand.border, 1);
    drawRoundedRect(ctx, m, curY, 6, cardH, 3, brand.accent, undefined, 0);

    ctx.fillStyle = brand.text;
    ctx.font = `600 18px ${brand.bodyFont}, Arial, sans-serif`;
    ctx.textBaseline = 'top';
    drawWrappedText(ctx, point, m + 24, curY + 18, contentW - 48, 26, 2);
    curY += cardH + 16;
    if (curY > height - 150) break;
  }

  // Footer
  const footY = height - 90;
  ctx.strokeStyle = brand.border;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(m, footY);
  ctx.lineTo(width - m, footY);
  ctx.stroke();

  ctx.fillStyle = brand.muted;
  ctx.font = `500 16px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(brand.website || brand.companyName, m, footY + 40);

  ctx.fillStyle = brand.text;
  ctx.font = `700 16px ${brand.bodyFont}, Arial, sans-serif`;
  ctx.textAlign = 'right';
  ctx.fillText(slideNum >= totalSlides ? 'SAVE THIS POST ↗' : 'SWIPE NEXT →', width - m, footY + 40);
}

/**
 * Main Deterministic Composition Dispatcher
 */
export async function renderComposedCanvas(options: CompositionOptions): Promise<string> {
  const brand = resolveBrand(options);
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = options.template === 'quote_card' && options.format === 'founder_card' ? 1080 : 1350;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not obtain 2D canvas rendering context');

  const template = options.template || getRecommendedTemplate(options.format);

  switch (template) {
    case 'quote_card':
      await renderQuoteCard(canvas, ctx, options, brand);
      break;
    case 'infographic_flyer':
      await renderInfographicFlyer(canvas, ctx, options, brand);
      break;
    case 'carousel_slide':
      await renderCarouselSlide(canvas, ctx, options, brand);
      break;
    case 'editorial_poster':
    default:
      await renderEditorialPoster(canvas, ctx, options, brand);
      break;
  }

  return canvas.toDataURL('image/png');
}

/**
 * Creates a valid single-page PDF containing the embedded image.
 */
function createSingleImagePdfBlob(jpegBytes: Uint8Array, widthPt: number = 595.28, heightPt: number = 744.1): Blob {
  const enc = new TextEncoder();
  const chunks: (Uint8Array | ArrayBuffer)[] = [];
  const offsets: number[] = [];
  let pos = 0;

  function add(str: string) {
    const b = enc.encode(str);
    chunks.push(b);
    pos += b.length;
  }
  function addBytes(b: Uint8Array) {
    chunks.push(b);
    pos += b.length;
  }

  add('%PDF-1.4\n');
  offsets[1] = pos;
  add('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
  offsets[2] = pos;
  add('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
  offsets[3] = pos;
  add(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${widthPt} ${heightPt}] /Resources << /XObject << /Im1 5 0 R >> >> /Contents 4 0 R >>\nendobj\n`);

  const content = `q\n${widthPt} 0 0 ${heightPt} 0 0 cm\n/Im1 Do\nQ\n`;
  offsets[4] = pos;
  add(`4 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);

  offsets[5] = pos;
  add(`5 0 obj\n<< /Type /XObject /Subtype /Image /Width 1080 /Height 1350 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.length} >>\nstream\n`);
  addBytes(jpegBytes);
  add('\nendstream\nendobj\n');

  const startXref = pos;
  add('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    add(String(offsets[i]).padStart(10, '0') + ' 00000 n \n');
  }
  add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${startXref}\n%%EOF\n`);

  return new Blob(chunks as BlobPart[], { type: 'application/pdf' });
}

/**
 * Downloads a data URI or Blob to the user's computer.
 */
export function downloadFile(blobOrUrl: Blob | string, filename: string) {
  const link = document.createElement('a');
  link.download = filename;
  if (typeof blobOrUrl === 'string') {
    link.href = blobOrUrl;
  } else {
    link.href = URL.createObjectURL(blobOrUrl);
  }
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  if (typeof blobOrUrl !== 'string') {
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  }
}

/**
 * Exports composed creative as PNG, JPEG, or PDF.
 */
export async function exportCreative(
  pngDataUrl: string,
  filenameBase: string,
  format: 'png' | 'jpeg' | 'pdf' = 'png'
): Promise<void> {
  const safeBase = filenameBase.replace(/[^a-zA-Z0-9_-]/g, '_');

  if (format === 'png') {
    downloadFile(pngDataUrl, `${safeBase}.png`);
    return;
  }

  // Convert PNG to JPEG via offscreen canvas
  const img = await loadSafeImage(pngDataUrl);
  if (!img) {
    downloadFile(pngDataUrl, `${safeBase}.png`);
    return;
  }

  const offCanvas = document.createElement('canvas');
  offCanvas.width = img.naturalWidth || 1080;
  offCanvas.height = img.naturalHeight || 1350;
  const ctx = offCanvas.getContext('2d');
  if (!ctx) {
    downloadFile(pngDataUrl, `${safeBase}.png`);
    return;
  }

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, offCanvas.width, offCanvas.height);
  ctx.drawImage(img, 0, 0);

  const jpegDataUrl = offCanvas.toDataURL('image/jpeg', 0.95);

  if (format === 'jpeg') {
    downloadFile(jpegDataUrl, `${safeBase}.jpg`);
    return;
  }

  if (format === 'pdf') {
    // Decode base64 to binary bytes
    const base64Data = jpegDataUrl.split(',')[1];
    const binaryStr = atob(base64Data);
    const bytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }
    const pdfBlob = createSingleImagePdfBlob(bytes, 595.28, (595.28 / offCanvas.width) * offCanvas.height);
    downloadFile(pdfBlob, `${safeBase}.pdf`);
  }
}

/**
 * Renders and downloads all slides of a carousel sequentially.
 */
export async function downloadAllComposedSlides(
  asset: SocialAsset,
  slideVisuals: Record<number, string> = {},
  brandOptions: BrandRenderOptions = {},
  format: 'png' | 'jpeg' | 'pdf' = 'png'
): Promise<void> {
  const slides = asset.slides || [];
  if (slides.length === 0) return;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const visual = slideVisuals[slide.slideNumber] || asset.generatedBackgroundUrl;
    const slideCanvasUrl = await renderComposedCanvas({
      ...brandOptions,
      template: 'carousel_slide',
      assetTitle: asset.title,
      assetCode: asset.assetCode,
      format: 'carousel',
      platform: asset.platform,
      supportingImageUrl: visual,
      slide,
      slideIndex: i,
      totalSlides: slides.length
    });

    await exportCreative(
      slideCanvasUrl,
      `${asset.assetCode.replace(/^APEX-/, 'AUTO-')}-slide-${slide.slideNumber}`,
      format
    );
    await new Promise((r) => setTimeout(r, 220));
  }
}
