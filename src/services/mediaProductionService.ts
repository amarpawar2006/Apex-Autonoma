import { CarouselSlide, SocialAsset } from '../types/campaign';
import { APEX_COMPANY_DATA } from '../data/apexCompanyData';
import { getAuthHeaders } from './autonomaDataService';

export interface ImageGenerationResult {
  success: boolean;
  model: string;
  dataUrl?: string;
  fileUrl?: string;
  filename?: string;
  error?: string;
  isBillingRequired?: boolean;
}

export interface VideoGenerationResult {
  success: boolean;
  model: string;
  operationName?: string;
  error?: string;
  isBillingRequired?: boolean;
}

/**
 * Invokes real server-side image generation using Google's gemini-3.1-flash-lite-image model.
 * Never exposes credentials to the browser.
 */
export async function generateAssetImage(
  prompt: string,
  aspectRatio: string = '3:4',
  assetCode: string = 'ASSET',
  customApiKey?: string
): Promise<ImageGenerationResult> {
  try {
    const res = await fetch('/api/media/generate-image', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        prompt,
        aspectRatio,
        assetCode,
        customApiKey
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        model: data.model || 'gemini-3.1-flash-lite-image',
        error: data.error || data.message || 'Image generation failed',
        isBillingRequired: Boolean(data.isBillingRequired)
      };
    }

    return {
      success: true,
      model: data.model || 'gemini-3.1-flash-lite-image',
      dataUrl: data.dataUrl,
      fileUrl: data.fileUrl,
      filename: data.filename
    };
  } catch (err: any) {
    return {
      success: false,
      model: 'gemini-3.1-flash-lite-image',
      error: err.message || 'Network error connecting to image generation endpoint'
    };
  }
}

/**
 * Invokes real server-side video generation using Google's veo-3.1-lite-generate-preview model.
 */
export async function generateAssetVideo(
  prompt: string,
  aspectRatio: string = '9:16',
  customApiKey?: string
): Promise<VideoGenerationResult> {
  try {
    const res = await fetch('/api/media/generate-video', {
      method: 'POST',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        prompt,
        aspectRatio,
        customApiKey
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return {
        success: false,
        model: data.model || 'veo-3.1-lite-generate-preview',
        error: data.error || data.message || 'Video generation unavailable or failed',
        isBillingRequired: Boolean(data.isBillingRequired)
      };
    }

    return {
      success: true,
      model: data.model || 'veo-3.1-lite-generate-preview',
      operationName: data.operationName
    };
  } catch (err: any) {
    return {
      success: false,
      model: 'veo-3.1-lite-generate-preview',
      error: err.message || 'Network error connecting to video generation endpoint'
    };
  }
}

/**
 * Polls video generation operation status
 */
export async function pollVideoStatus(
  operationName: string,
  customApiKey?: string
): Promise<{ done: boolean; error?: string }> {
  const res = await fetch('/api/media/video-status', {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({ operationName, customApiKey })
  });
  return await res.json();
}

/**
 * Triggers browser download for a data URL or blob
 */
export function downloadDataUrl(filename: string, dataUrl: string) {
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Deterministic AES-DS Canvas Renderer for Carousel Slides.
 * Renders pixel-perfect 1080x1350 (4:5) slide images with exact branding, typography, badges, and layout.
 * Ensures zero AI hallucination for critical copy and typography.
 */
export async function renderDeterministicSlideCanvas(
  slide: CarouselSlide,
  totalSlides: number,
  options: {
    assetTitle: string;
    assetCode: string;
    supportingImageUrl?: string;
  }
): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get 2d context');

  // 1. Background: Void Black #0A0B0E
  ctx.fillStyle = '#0A0B0E';
  ctx.fillRect(0, 0, 1080, 1350);

  // 2. Subtle architectural blueprint grid
  ctx.strokeStyle = '#181B22';
  ctx.lineWidth = 1;
  const gridSize = 60;
  for (let x = 0; x <= 1080; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 1350);
    ctx.stroke();
  }
  for (let y = 0; y <= 1350; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(1080, y);
    ctx.stroke();
  }

  // 3. Radial ambient glow (Apex Orange #FF4500 accent at 6%)
  const gradient = ctx.createRadialGradient(900, 150, 10, 900, 150, 600);
  gradient.addColorStop(0, 'rgba(255, 69, 0, 0.12)');
  gradient.addColorStop(1, 'rgba(255, 69, 0, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1350);

  // 4. Safe Area Margins: 80px left/right
  const leftMargin = 80;
  const rightMargin = 1080 - 80;
  const contentWidth = rightMargin - leftMargin;

  // 5. Top Header Bar
  // Apex Delta Glyph
  ctx.fillStyle = '#FF4500';
  ctx.fillRect(leftMargin, 80, 44, 44);
  ctx.fillStyle = '#000000';
  ctx.font = '900 24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('/\\', leftMargin + 22, 80 + 22);

  // Brand Name
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('APEX ENGINEERING', leftMargin + 60, 102);

  // Asset Code & Slide Number
  ctx.fillStyle = '#FF4500';
  ctx.font = 'bold 20px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(`SLIDE ${slide.slideNumber} / ${totalSlides}`, rightMargin, 102);

  // Header Divider Line
  ctx.strokeStyle = '#22252E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftMargin, 144);
  ctx.lineTo(rightMargin, 144);
  ctx.stroke();

  let currentY = 220;

  // 6. Badge (if any)
  const badgeText = slide.badge || `PHASE 0${slide.slideNumber} // SPEC-01`;
  ctx.font = 'bold 16px monospace';
  const badgeWidth = ctx.measureText(badgeText).width + 32;
  ctx.fillStyle = '#14161B';
  ctx.fillRect(leftMargin, currentY, badgeWidth, 36);
  ctx.strokeStyle = '#FF4500';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(leftMargin, currentY, badgeWidth, 36);

  ctx.fillStyle = '#FF4500';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(badgeText, leftMargin + 16, currentY + 18);
  currentY += 75;

  // 7. Supporting AI visual if provided
  if (options.supportingImageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = options.supportingImageUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve; // Continue even if image fails to load
      });
      if (img.complete && img.naturalWidth > 0) {
        const imgH = 340;
        ctx.save();
        ctx.strokeStyle = '#323644';
        ctx.lineWidth = 2;
        ctx.strokeRect(leftMargin, currentY, contentWidth, imgH);
        ctx.drawImage(img, leftMargin, currentY, contentWidth, imgH);
        ctx.restore();
        currentY += imgH + 40;
      }
    } catch (e) {
      console.warn('Could not draw supporting visual on canvas:', e);
    }
  }

  // 8. Headline (Wrapped)
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 48px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';

  const headline = (slide.headline || '').toUpperCase();
  const headlineWords = headline.split(' ');
  let line = '';
  const headlineLineHeight = 58;

  for (let i = 0; i < headlineWords.length; i++) {
    const testLine = line + headlineWords[i] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > contentWidth && i > 0) {
      ctx.fillText(line.trim(), leftMargin, currentY);
      line = headlineWords[i] + ' ';
      currentY += headlineLineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), leftMargin, currentY);
  currentY += headlineLineHeight + 20;

  // 9. Subtext (if any)
  if (slide.subtext) {
    ctx.fillStyle = '#8E95A5';
    ctx.font = '22px monospace';
    ctx.fillText(slide.subtext, leftMargin, currentY);
    currentY += 40;
  }

  // Divider before body
  ctx.strokeStyle = '#22252E';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftMargin, currentY);
  ctx.lineTo(rightMargin, currentY);
  ctx.stroke();
  currentY += 35;

  // 10. Body Bullets or Step Cards
  if (slide.body && slide.body.length > 0) {
    for (const item of slide.body) {
      // Draw dark card container
      ctx.fillStyle = '#14161B';
      ctx.fillRect(leftMargin, currentY, contentWidth, 76);
      ctx.strokeStyle = '#22252E';
      ctx.lineWidth = 1;
      ctx.strokeRect(leftMargin, currentY, contentWidth, 76);

      // Left Accent Notch
      ctx.fillStyle = '#FF4500';
      ctx.fillRect(leftMargin, currentY, 5, 76);

      // Item text
      ctx.fillStyle = '#E4E7EB';
      ctx.font = 'bold 20px monospace';
      ctx.textBaseline = 'middle';
      ctx.fillText(item, leftMargin + 25, currentY + 38);

      currentY += 92;
    }
  }

  // 11. Footer Safe Area
  const footerY = 1240;
  ctx.strokeStyle = '#22252E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(leftMargin, footerY);
  ctx.lineTo(rightMargin, footerY);
  ctx.stroke();

  ctx.fillStyle = '#8E95A5';
  ctx.font = '18px monospace';
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillText('apex-engineering.co.in // PUNE, IN', leftMargin, footerY + 35);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('SWIPE NEXT ➔', rightMargin, footerY + 35);

  return canvas.toDataURL('image/png');
}

/**
 * Downloads all slides of a carousel sequentially as pristine PNG files.
 */
export async function downloadAllCarouselSlides(
  asset: SocialAsset,
  slideVisuals?: Record<number, string>
) {
  const slides = asset.slides || [];
  if (slides.length === 0) return;

  for (let i = 0; i < slides.length; i++) {
    const slide = slides[i];
    const visual = slideVisuals ? slideVisuals[slide.slideNumber] : undefined;
    const dataUrl = await renderDeterministicSlideCanvas(slide, slides.length, {
      assetTitle: asset.title,
      assetCode: asset.assetCode,
      supportingImageUrl: visual
    });

    const filename = `${asset.assetCode}-slide-${slide.slideNumber}.png`;
    downloadDataUrl(filename, dataUrl);
    // Brief delay between downloads to prevent browser throttling
    await new Promise((r) => setTimeout(r, 200));
  }
}

/**
 * Deterministic Canvas Renderer for Static Posters & Founder Cards
 */
export async function renderDeterministicPosterCanvas(
  asset: SocialAsset,
  supportingImageUrl?: string
): Promise<string> {
  const canvas = document.createElement('canvas');
  // 1080x1350 for 4:5 posters or 1080x1080 for founder cards
  const isSquare = asset.format === 'founder_card';
  canvas.width = 1080;
  canvas.height = isSquare ? 1080 : 1350;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  // Void Black Background
  ctx.fillStyle = '#0A0B0E';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle architectural grid
  ctx.strokeStyle = '#181B22';
  ctx.lineWidth = 1;
  for (let x = 0; x <= canvas.width; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y <= canvas.height; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Corner Accent Glow
  const grad = ctx.createRadialGradient(canvas.width, 0, 10, canvas.width, 0, 500);
  grad.addColorStop(0, 'rgba(255, 69, 0, 0.15)');
  grad.addColorStop(1, 'rgba(255, 69, 0, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const m = 80;
  const w = canvas.width - m * 2;

  // Header
  ctx.fillStyle = '#FF4500';
  ctx.fillRect(m, 80, 44, 44);
  ctx.fillStyle = '#000000';
  ctx.font = '900 24px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('/\\', m + 22, 102);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 22px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('APEX ENGINEERING', m + 60, 102);

  ctx.fillStyle = '#FF4500';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'right';
  ctx.fillText(asset.assetCode, canvas.width - m, 102);

  let curY = 180;

  // Badge
  const badge = `${asset.speciesCode} // ${asset.format.toUpperCase().replace('_', ' ')}`;
  ctx.font = 'bold 16px monospace';
  const bw = ctx.measureText(badge).width + 32;
  ctx.fillStyle = '#14161B';
  ctx.fillRect(m, curY, bw, 36);
  ctx.strokeStyle = '#FF4500';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(m, curY, bw, 36);
  ctx.fillStyle = '#FF4500';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(badge, m + 16, curY + 18);
  curY += 80;

  // Supporting image if present
  if (supportingImageUrl) {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = supportingImageUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
      if (img.complete && img.naturalWidth > 0) {
        const imgH = isSquare ? 360 : 420;
        ctx.strokeStyle = '#323644';
        ctx.lineWidth = 2;
        ctx.strokeRect(m, curY, w, imgH);
        ctx.drawImage(img, m, curY, w, imgH);
        curY += imgH + 40;
      }
    } catch (e) {
      console.warn('Canvas image draw error:', e);
    }
  }

  // Title
  ctx.fillStyle = '#FFFFFF';
  ctx.font = '900 44px monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  const words = asset.title.toUpperCase().split(' ');
  let curLine = '';
  for (let i = 0; i < words.length; i++) {
    const test = curLine + words[i] + ' ';
    if (ctx.measureText(test).width > w && i > 0) {
      ctx.fillText(curLine.trim(), m, curY);
      curLine = words[i] + ' ';
      curY += 54;
    } else {
      curLine = test;
    }
  }
  ctx.fillText(curLine.trim(), m, curY);
  curY += 75;

  // Hook quote
  ctx.fillStyle = '#14161B';
  ctx.fillRect(m, curY, w, 110);
  ctx.strokeStyle = '#22252E';
  ctx.lineWidth = 1;
  ctx.strokeRect(m, curY, w, 110);
  ctx.fillStyle = '#FF4500';
  ctx.fillRect(m, curY, 6, 110);

  ctx.fillStyle = '#E4E7EB';
  ctx.font = '20px monospace';
  ctx.textBaseline = 'top';
  ctx.fillText(`"${asset.hook.slice(0, 140)}"`, m + 30, curY + 25);
  curY += 150;

  // Founder Lower Third
  ctx.fillStyle = '#14161B';
  ctx.fillRect(m, curY, w, 80);
  ctx.strokeStyle = '#FF4500';
  ctx.lineWidth = 1;
  ctx.strokeRect(m, curY, w, 80);
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 20px monospace';
  ctx.textBaseline = 'middle';
  ctx.fillText(APEX_COMPANY_DATA.founder.name.toUpperCase(), m + 25, curY + 28);
  ctx.fillStyle = '#8E95A5';
  ctx.font = '16px monospace';
  ctx.fillText(
    `${APEX_COMPANY_DATA.founder.role.toUpperCase()} • ${APEX_COMPANY_DATA.founder.experience.toUpperCase()}`,
    m + 25,
    curY + 54
  );

  // Footer
  const footY = canvas.height - 110;
  ctx.strokeStyle = '#22252E';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(m, footY);
  ctx.lineTo(canvas.width - m, footY);
  ctx.stroke();

  ctx.fillStyle = '#8E95A5';
  ctx.font = '18px monospace';
  ctx.textAlign = 'left';
  ctx.fillText('apex-engineering.co.in', m, footY + 40);

  ctx.fillStyle = '#FF4500';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'right';
  ctx.fillText('ENGINEERED FOR COMPOUNDING AUTHORITY', canvas.width - m, footY + 40);

  return canvas.toDataURL('image/png');
}
