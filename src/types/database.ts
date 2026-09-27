/**
 * Autonoma Durable Operational Database Schema
 * Maps 1:1 with Google Sheets Workbook Tables and Server-Side Relational Store
 */

export interface DbCampaignRow {
  campaignId: string;
  organizationId: string;
  name: string;
  brief: string;
  objective: string;
  status: string; // 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED'
  startDate: string;
  endDate: string;
  platforms: string; // Comma-separated or JSON
  duration: string;
  audience: string;
  marketInsight: string;
  valueProposition: string;
  contentPillars: string; // JSON array string
  postingCadence: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbAssetRow {
  assetId: string;
  campaignId: string;
  organizationId: string;
  title: string;
  hook: string;
  strategicPurpose: string;
  angle: string;
  platform: string;
  format: string;
  contentStream: string;
  speciesCode: string;
  funnelStage: string;
  targetDate: string;
  targetTime: string;
  caption: string;
  hashtags: string;
  cta: string;
  carouselSlidesJson: string;
  reelScript: string;
  storyboardJson: string;
  imagePrompt: string;
  videoPrompt: string;
  approvalStatus: string;
  mediaStatus: string;
  aiContentScore: number;
  aiScoreRationale: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbMediaRow {
  mediaId: string;
  assetId: string;
  campaignId: string;
  type: string; // 'IMAGE' | 'VIDEO' | 'CAROUSEL_SLIDE'
  model: string;
  prompt: string;
  version: string;
  fileUrl: string;
  thumbnailUrl: string;
  generationStatus: string;
  approvalStatus: string;
  createdAt: string;
}

export interface DbPublishingRow {
  publicationId: string;
  assetId: string;
  campaignId: string;
  platform: string;
  platformPostId: string;
  publishedUrl: string;
  scheduledAt: string;
  publishedAt: string;
  publishingMethod: string;
  status: string;
}

export interface DbPerformanceRow {
  performanceId: string;
  publicationId: string;
  assetId: string;
  campaignId: string;
  platform: string;
  capturedAt: string;
  impressions: number;
  reach: number;
  videoViews: number;
  watchTime: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  profileVisits: number;
  followersGained: number;
  leads: number;
  engagementRate: number;
}

export interface DbDailySnapshotRow {
  snapshotId: string;
  publicationId: string;
  assetId: string;
  platform: string;
  snapshotDate: string;
  impressions: number;
  reach: number;
  videoViews: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  clicks: number;
  followersGained: number;
}

export interface DbSettingsRow {
  organizationId: string;
  organizationName: string;
  brandName: string;
  website: string;
  timezone: string;
  defaultPlatforms: string;
  brandConfigJson: string;
  updatedAt: string;
}

export interface DbActivityLogRow {
  logId: string;
  organizationId: string;
  entityType: string;
  entityId: string;
  action: string;
  source: string;
  timestamp: string;
  detailsJson: string;
}

export interface AutonomaDatabaseStore {
  version: string;
  organizationId: string;
  lastSyncAt: string | null;
  googleSheetsUrl: string;
  campaigns: DbCampaignRow[];
  assets: DbAssetRow[];
  media: DbMediaRow[];
  publishing: DbPublishingRow[];
  performance: DbPerformanceRow[];
  dailySnapshots: DbDailySnapshotRow[];
  settings: DbSettingsRow;
  activityLog: DbActivityLogRow[];
}

export type AppsScriptAction =
  | 'INIT_DATABASE'
  | 'GET_CAMPAIGNS'
  | 'GET_CAMPAIGN'
  | 'CREATE_CAMPAIGN'
  | 'UPDATE_CAMPAIGN'
  | 'GET_ASSETS'
  | 'GET_ASSETS_BY_CAMPAIGN'
  | 'CREATE_ASSET'
  | 'UPDATE_ASSET'
  | 'BATCH_SAVE_ASSETS'
  | 'CREATE_MEDIA_RECORD'
  | 'UPDATE_MEDIA_RECORD'
  | 'CREATE_PUBLICATION'
  | 'UPDATE_PUBLICATION'
  | 'UPSERT_PERFORMANCE'
  | 'CREATE_DAILY_SNAPSHOT'
  | 'GET_SETTINGS'
  | 'UPDATE_SETTINGS'
  | 'WRITE_ACTIVITY_LOG'
  | 'SYNC_ALL'
  | 'PING';

export interface AppsScriptResponse<T = any> {
  success: boolean;
  action?: AppsScriptAction;
  data?: T;
  error?: string;
  code?: string;
  timestamp?: string;
}
