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
  assetCount?: number;
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
  archivedAt?: string;
  languages?: string;
  targetLanguage?: string;
  platformsJson?: string;
  customLanguage?: string;
  customPlatform?: string;
  languageStyle?: string;
  generationStatus?: string;
  lastGenerationError?: string;
  lastGenerationAttemptAt?: string;
  generationOptionsJson?: string;
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
  language?: string;
  conceptIndex?: number;
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
  generatedImageUrl?: string;
  generatedVideoUrl?: string;
  carouselVisualsJson?: string;
  productionError?: string;
  videoOperationName?: string;
  targetBuyerPersona?: string;
  targetReach?: number;
  estimatedImpressions?: number;
  expectedLeads?: number;
  aiContentScore: number;
  aiScoreRationale: string;
  isArchived?: boolean;
  archivedAt?: string;
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
  aiProvidersJson?: string;
  emailConfigJson?: string;
  updatedAt: string;
}

export interface DbCompanyRow {
  companyId: string;
  name: string;
  status: 'ACTIVE' | 'SUSPENDED';
  profileJson?: string;
  profile?: any;
  createdAt: string;
  updatedAt: string;
}

export interface DbUserRow {
  userId: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isSuperAdmin: boolean;
  status: 'ACTIVE' | 'SUSPENDED';
  createdAt: string;
  lastLoginAt: string;
}

export interface DbMembershipRow {
  membershipId: string;
  userId: string;
  companyId: string;
  role: 'COMPANY_ADMIN' | 'MEMBER';
  status: 'ACTIVE' | 'SUSPENDED';
  assignedAt: string;
  assignedBy: string;
  inviteStatus?: 'SENT' | 'FAILED' | 'PENDING' | 'PREVIEW_ONLY';
  inviteSentAt?: string;
  inviteError?: string;
  inviteLink?: string;
}

export interface DbApprovalRequestRow {
  requestId: string;
  email: string;
  name: string;
  proposedCompanyName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  assignedCompanyId?: string;
  assignedRole?: 'COMPANY_ADMIN' | 'MEMBER';
}

export interface DbSessionRow {
  sessionToken: string;
  userId: string;
  activeCompanyId?: string;
  createdAt: string;
  expiresAt: string;
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

export interface DbKnowledgeSourceRow {
  sourceId: string;
  organizationId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  sourceType: 'FILE_UPLOAD' | 'GOOGLE_DRIVE';
  storageUrl?: string;
  status: 'UPLOADED' | 'INSPECTING' | 'READY_FOR_REVIEW' | 'IMPORTED' | 'FAILED';
  createdBy: string;
  createdAt: string;
  metadataJson?: string;
}

export interface DbCompanyKnowledgeRow {
  knowledgeId: string;
  organizationId: string;
  sourceId: string;
  category: 'COMPANY_KNOWLEDGE' | 'PRODUCT' | 'CAMPAIGN_HISTORY' | 'AUDIENCE' | 'OTHER';
  title: string;
  content: string;
  structuredJson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbContactRow {
  contactId: string;
  organizationId: string;
  sourceId?: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedinUrl?: string;
  instagramHandle?: string;
  otherHandlesJson?: string;
  location?: string;
  segment?: string;
  tagsJson?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DbAudienceListRow {
  listId: string;
  organizationId: string;
  sourceId?: string;
  name: string;
  description?: string;
  contactCount: number;
  listType: 'CONTACT' | 'DISTRIBUTION_LIST' | 'AUDIENCE';
  metadataJson?: string;
  createdAt: string;
}

export interface DbAudienceListMemberRow {
  listId: string;
  contactId: string;
}

export interface DbCampaignContextSourceRow {
  id: string;
  organizationId: string;
  campaignId: string;
  sourceId: string;
  useMode: 'CAMPAIGN_CONTEXT' | 'SCHEDULING_DISTRIBUTION' | 'FULL_IMPORT';
  summary?: string;
  contextJson?: string;
  createdAt: string;
}

export interface AutonomaDatabaseStore {
  version: string;
  organizationId: string;
  lastSyncAt: string | null;
  googleSheetsUrl: string;
  companies?: DbCompanyRow[];
  users?: DbUserRow[];
  memberships?: DbMembershipRow[];
  approvalRequests?: DbApprovalRequestRow[];
  sessions?: DbSessionRow[];
  campaigns: DbCampaignRow[];
  assets: DbAssetRow[];
  media: DbMediaRow[];
  publishing: DbPublishingRow[];
  performance: DbPerformanceRow[];
  dailySnapshots: DbDailySnapshotRow[];
  settings: DbSettingsRow;
  activityLog: DbActivityLogRow[];
  knowledgeSources?: DbKnowledgeSourceRow[];
  companyKnowledge?: DbCompanyKnowledgeRow[];
  contacts?: DbContactRow[];
  audienceLists?: DbAudienceListRow[];
  audienceListMembers?: DbAudienceListMemberRow[];
  campaignContextSources?: DbCampaignContextSourceRow[];
  deletedCampaignIds?: string[];
  deletedAssetIds?: string[];
  deletedCompanyIds?: string[];
  initialized?: boolean;
}

export type AppsScriptAction =
  | 'INIT_DATABASE'
  | 'GET_CAMPAIGNS'
  | 'GET_CAMPAIGN'
  | 'CREATE_CAMPAIGN'
  | 'UPDATE_CAMPAIGN'
  | 'DELETE_CAMPAIGN'
  | 'GET_ASSETS'
  | 'GET_ASSETS_BY_CAMPAIGN'
  | 'CREATE_ASSET'
  | 'UPDATE_ASSET'
  | 'DELETE_ASSET'
  | 'BATCH_SAVE_ASSETS'
  | 'BATCH_DELETE_ASSETS'
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
