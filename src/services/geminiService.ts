import { SocialAsset, ContentFormat, ContentStream, SpeciesCode, CarouselSlide, VideoScene, Platform, CampaignStrategy } from '../types/campaign';
import { getAuthHeaders } from './autonomaDataService';

export interface CampaignSynthesisRequest {
  brief: string;
  primaryGoal?: string;
  secondaryGoals?: string[];
  companyContext?: any;
  platforms: Platform[];
  formats: ContentFormat[];
  duration: 'single' | '3_days' | '7_days' | '30_days' | 'custom';
  daysSpan: number;
  assetCount: number;
  languages: string[];
  customLanguage?: string;
  customPlatform?: string;
  languageStyle?: string;
  additionalInstructions?: string;
  advancedOptions?: {
    targetAudience?: string;
    primaryCta?: string;
    productsEmphasized?: string;
    postingFrequency?: string;
    tone?: string;
    customLanguage?: string;
    customPlatform?: string;
    languageStyle?: string;
    additionalInstructions?: string;
  };
}

export interface SynthesizedCampaignData {
  campaignName: string;
  coreInsight: string;
  valueProposition: string;
  targetAudience: string;
  buyerPersonas: string[];
  contentPillars: string[];
  postingSequence: string;
  assets: Array<{
    strategicPurpose: string;
    angle: string;
    title: string;
    platform: string;
    format: string;
    hook: string;
    caption: string;
    hashtags: string[];
    CTA: string;
    carouselSlides?: Array<{
      slideNumber: number;
      layout: string;
      badge?: string;
      headline: string;
      subtext?: string;
      body: string[];
    }>;
    reelScript?: Array<{
      sceneNumber: number;
      timestamp: string;
      hookText: string;
      bRollPrompt: string;
      narrationVoiceover: string;
      onScreenCaption: string;
      visualFocus?: string;
    }>;
    posterVisualPrompt?: string;
    viralityScore: number;
    viralityRationale: string;
    targetReach?: number;
    estimatedImpressions?: number;
    expectedLeads?: number;
  }>;
}

export interface GenerationRequest {
  topic: string;
  targetPlatform: Platform;
  format: ContentFormat;
  stream: ContentStream;
  speciesCode: SpeciesCode;
}

export interface GeminiStructuredCampaign {
  assetCode: string;
  title: string;
  hook: string;
  businessProblem: string;
  buyerPersona: string;
  platform: string;
  format: string;
  contentStream: string;
  speciesCode: string;
  funnelStage: string;
  caption: string;
  hashtags: string[];
  CTA: string;
  carouselSlides: Array<{
    slideNumber: number;
    layout: string;
    badge?: string;
    headline: string;
    subtext?: string;
    body: string[];
  }>;
  reelScript: Array<{
    sceneNumber: number;
    timestamp: string;
    hookText: string;
    bRollPrompt: string;
    narrationVoiceover: string;
    onScreenCaption: string;
    visualFocus: string;
  }>;
  imagePrompt: string;
  videoPrompt: string;
  viralityRationale: string;
  viralityScore: number;
}

export interface GeneratedAssetResponse {
  asset: SocialAsset;
  rawData: GeminiStructuredCampaign;
  viralityRationale: string;
  targetAudienceAnalysis: string;
  recommendedPostingSchedule: string;
}

/**
 * Calls the real Gemini-powered server-side campaign generator (/api/campaign/generate).
 * The server securely accesses GEMINI_API_KEY from environment variables without exposing it to the client.
 */
export async function generateApexCampaignWithAI(
  req: GenerationRequest
): Promise<GeneratedAssetResponse> {
  const response = await fetch('/api/campaign/generate', {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      topic: req.topic,
      targetPlatform: req.targetPlatform,
      format: req.format,
      stream: req.stream,
      speciesCode: req.speciesCode,
    }),
  });

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson?.message) {
        errorMessage = errJson.message;
      }
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  const result = await response.json();
  if (!result?.success || !result?.data) {
    throw new Error(result?.message || 'Server did not return campaign data.');
  }

  const data: GeminiStructuredCampaign = result.data;

  // Map carousel slides
  const slides: CarouselSlide[] | undefined = Array.isArray(data.carouselSlides) && data.carouselSlides.length > 0
    ? data.carouselSlides.map((s) => ({
        slideNumber: s.slideNumber,
        layout: (s.layout as any) || 'title_hook',
        badge: s.badge || 'SYSTEM DECONSTRUCTION // APEX',
        headline: s.headline,
        subtext: s.subtext,
        body: Array.isArray(s.body) ? s.body : [String(s.body)],
      }))
    : undefined;

  // Map video scenes
  const videoScenes: VideoScene[] | undefined = Array.isArray(data.reelScript) && data.reelScript.length > 0
    ? data.reelScript.map((sc) => ({
        sceneNumber: sc.sceneNumber,
        timestamp: sc.timestamp,
        hookText: sc.hookText,
        bRollPrompt: sc.bRollPrompt,
        narrationVoiceover: sc.narrationVoiceover,
        onScreenCaption: sc.onScreenCaption,
        visualFocus: sc.visualFocus,
      }))
    : undefined;

  // Normalize platform and format
  const normalizedPlatform: Platform = 
    data.platform?.toLowerCase() === 'youtube' ? 'youtube' :
    data.platform?.toLowerCase() === 'linkedin' ? 'linkedin' :
    data.platform?.toLowerCase() === 'twitter' ? 'twitter' : 'instagram';

  const normalizedFormat: ContentFormat =
    data.format === 'reel_short' ? 'reel_short' :
    data.format === 'static_poster' ? 'static_poster' :
    data.format === 'infographic_flyer' ? 'infographic_flyer' :
    data.format === 'founder_card' ? 'founder_card' : 'carousel';

  const normalizedStream: ContentStream = (data.contentStream as ContentStream) || req.stream;
  const normalizedSpecies: SpeciesCode = (data.speciesCode as SpeciesCode) || req.speciesCode;

  const viralityScore = typeof data.viralityScore === 'number' ? data.viralityScore : 94;
  const targetReach = Math.round(viralityScore * 350);
  const estimatedImpressions = Math.round(viralityScore * 480);
  const expectedLeads = Math.max(5, Math.round(viralityScore * 0.16));

  const targetDate = new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0];

  const asset: SocialAsset = {
    id: data.assetCode || `APEX-${Date.now()}`,
    assetCode: data.assetCode,
    title: data.title || `Engineered Architecture: ${req.topic}`,
    targetDate,
    postTimeIST: '11:30 AM',
    platform: normalizedPlatform,
    format: normalizedFormat,
    stream: normalizedStream,
    speciesCode: normalizedSpecies,
    status: 'draft',
    hook: data.hook,
    caption: data.caption,
    hashtags: Array.isArray(data.hashtags) ? data.hashtags : ['ApexEngineering', 'SystemsArchitecture'],
    callToAction: data.CTA || "Comment 'SYSTEM' or visit apex-engineering.co.in",
    viralityScore,
    targetReach,
    estimatedImpressions,
    expectedLeads,
    targetBuyerPersona: data.buyerPersona || 'Founders, Operations Leaders & Technical Decision Makers',
    designSystemVerified: true,
    colorScheme: 'carbon_orange',
    posterVisualPrompt: data.imagePrompt,
    slides,
    videoScenes,
  };

  return {
    asset,
    rawData: data,
    viralityRationale: data.viralityRationale || 'High problem-resonance hook directly addressing unstated operational friction.',
    targetAudienceAnalysis: data.buyerPersona || 'Founders & Operations Leaders suffering from manual tool sprawl.',
    recommendedPostingSchedule: 'Tuesday or Thursday at 11:30 AM IST (Optimal B2B Desk Review Window)',
  };
}

/**
 * Calls the real Gemini-powered server-side multi-asset campaign synthesis endpoint.
 * Generates an end-to-end strategic campaign with deliberate narrative progression,
 * unique standalone titles, platform-native executions, and realistic audience metrics.
 */
export async function synthesizeFullCampaignWithAI(
  req: CampaignSynthesisRequest
): Promise<SynthesizedCampaignData> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45000); // 45s safety timeout

  try {
    const response = await fetch('/api/campaign/synthesize-campaign', {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson?.message) {
          errorMessage = errJson.message;
        }
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (!result?.success || !result?.data) {
      throw new Error(result?.message || 'Server did not return synthesized campaign data.');
    }

    return result.data as SynthesizedCampaignData;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Campaign synthesis request timed out.');
    }
    throw err;
  }
}

export interface ImproveBriefRequest {
  brief: string;
  primaryGoal?: string;
  secondaryGoals?: string[];
  companyContext?: {
    organizationName?: string;
    brandName?: string;
    website?: string;
    industry?: string;
    brandSummary?: string;
  };
}

export interface ImproveBriefResponse {
  rewrittenBrief: string;
  suggestedAudience?: string;
  suggestedPrimaryCta?: string;
  keyImprovements: string[];
  focusedQuestions: string[];
}

/**
 * Calls the server-side Gemini brief improvement endpoint (/api/campaign/improve-brief).
 * Improves clarity, audience targeting, and measurable direction with strict guardrails
 * that never invent products, prices, or numerical targets, and never assumes industry.
 */
export async function improveBriefWithAI(
  req: ImproveBriefRequest
): Promise<ImproveBriefResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const response = await fetch('/api/campaign/improve-brief', {
      method: 'POST',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(req),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorMessage = `Server error (${response.status})`;
      try {
        const errJson = await response.json();
        if (errJson?.message) {
          errorMessage = errJson.message;
        }
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    const result = await response.json();
    if (!result?.success || !result?.data) {
      throw new Error(result?.message || 'Server did not return improved brief data.');
    }

    return result.data as ImproveBriefResponse;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Brief improvement request timed out.');
    }
    throw err;
  }
}


