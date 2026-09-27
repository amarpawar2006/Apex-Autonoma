export type Platform = 'instagram' | 'youtube' | 'linkedin' | 'twitter' | 'facebook';

export type ContentFormat = 'carousel' | 'reel_short' | 'static_poster' | 'infographic_flyer' | 'founder_card' | 'story' | 'short_video';

export type PostStatus = 'draft' | 'in_review' | 'approved' | 'scheduled' | 'published';

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';

export interface CampaignStrategy {
  objectiveSummary?: string;
  targetAudience?: string;
  buyerPersonas?: string[];
  coreInsight?: string;
  valueProposition?: string;
  contentPillars?: string[];
  contentStreams?: ContentStream[];
  speciesCodes?: SpeciesCode[];
  funnelDistribution?: {
    topOfFunnel?: number;
    middleOfFunnel?: number;
    bottomOfFunnel?: number;
  };
  platformStrategy?: Record<string, string>;
  formatMix?: string[];
  postingSequence?: string;
  recommendedPostingSchedule?: string;
}

export interface Campaign {
  id: string;
  campaignCode: string;
  name: string;
  brief: string;
  objective: string;
  status: CampaignStatus;
  platforms: Platform[];
  formats: ContentFormat[];
  languages: string[];
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  assetCount: number;
  strategy?: CampaignStrategy;
}

export type ContentStream = 
  | 'digital_experiences'    // UX/UI, Websites, Web Apps, Portals
  | 'commerce_operations'    // Microcommerce, Orders, WhatsApp, Payments
  | 'applied_ai'             // AI where it makes sense, Lead qualification, Workflows
  | 'automation_systems'     // Manual to Automated, Rules + Data + AI
  | 'founder_philosophy';    // Amar Pawar 18+ yrs UX, Business before tech

export type SpeciesCode = 
  | 'SPEC-01_PROBLEM_FIRST'      // "What's not working?" teardown
  | 'SPEC-02_SYSTEM_BLUEPRINT'   // Manual Chaos -> System Architecture
  | 'SPEC-03_FOUNDER_PERSPECTIVE'// UX & Business philosophy
  | 'SPEC-04_CASE_STUDY'         // Real client work (BRC Pune, Flightpath, Trikaya)
  | 'SPEC-05_AI_REALITY_CHECK';  // "AI is not the product, the business problem is"

export interface CarouselSlide {
  slideNumber: number;
  layout: 'title_hook' | 'problem_agitation' | 'diagram_architecture' | 'breakdown_steps' | 'proof_quote' | 'cta_system';
  headline: string;
  subtext?: string;
  body: string[];
  bodyCopy?: string;
  visualPrompt?: string;
  badge?: string;
}

export interface VideoScene {
  sceneNumber: number;
  timestamp: string;
  hookText: string;
  bRollPrompt: string;
  narrationVoiceover: string;
  onScreenCaption: string;
  visualFocus: string;
}

export type ProductionStatus = 'NOT_GENERATED' | 'GENERATING' | 'READY' | 'FAILED' | 'APPROVED';

export interface SocialAsset {
  id: string;
  campaignId?: string; // Foreign key linking asset to Campaign entity
  campaignName?: string;
  assetCode: string; // e.g. APEX-2026-M01-001
  title: string;
  targetDate: string; // YYYY-MM-DD
  postTimeIST: string; // e.g. 11:30 AM
  platform: Platform;
  secondaryPlatforms?: Platform[];
  format: ContentFormat;
  stream: ContentStream;
  speciesCode: SpeciesCode;
  status: PostStatus;
  
  // Production Workflow State
  productionStatus?: ProductionStatus;
  generatedImageUrl?: string;
  generatedImagePrompt?: string;
  carouselSlideVisuals?: Record<number, string>;
  generatedVideoUrl?: string;
  videoGenerationPrompt?: string;
  videoJobOperationName?: string;
  productionError?: string;
  productionApprovedAt?: string;
  
  // Content details
  strategicPurpose?: string; // e.g. 'Problem Recognition' | 'Pain & Consequence' | 'Education' | 'Visual System' | 'Transformation' | 'Objection Handling' | 'Conversion'
  angle?: string; // Strategic angle or creative premise
  hook: string;
  caption: string;
  hashtags: string[];
  callToAction: string;
  
  // Media payload
  slides?: CarouselSlide[];
  videoScenes?: VideoScene[];
  posterVisualPrompt?: string;
  posterLayoutType?: 'minimal_editorial' | 'architecture_diagram' | 'founder_quote' | 'stat_grid';
  audioTrackRecommendation?: string;
  
  // Growth & virality metrics
  viralityScore: number; // 1-100
  viralityRationale?: string;
  targetReach: number;
  estimatedImpressions: number;
  actualImpressions?: number;
  expectedLeads: number;
  targetBuyerPersona: string;
  
  // Design system tags
  designSystemVerified: boolean;
  colorScheme: 'carbon_orange' | 'clean_white' | 'slate_electric' | 'mono_dark';
}

export interface AnnualQuarterPlan {
  quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  title: string;
  theme: string;
  targetMonthlyAssets: number;
  quarterlyGoal: string;
  focusStreams: ContentStream[];
  keyCampaigns: string[];
  focus?: string;
  targetReach?: string;
  narrative?: string;
  primaryCta?: string;
  pillar?: string;
  flagshipDeliverables?: string[];
}

export interface LeadAutomatedResponse {
  keyword: string;
  autoReplyText: string;
  deliverableLink: string;
  targetStage: 'lead_magnet' | 'consultation' | 'microcommerce_demo';
}
