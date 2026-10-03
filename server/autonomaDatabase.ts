import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { 
  AutonomaDatabaseStore, 
  DbCampaignRow, 
  DbAssetRow, 
  DbMediaRow, 
  DbPublishingRow, 
  DbPerformanceRow, 
  DbDailySnapshotRow, 
  DbSettingsRow, 
  DbActivityLogRow,
  DbCompanyRow,
  DbUserRow,
  DbMembershipRow,
  DbApprovalRequestRow,
  DbSessionRow,
  AppsScriptResponse
} from '../src/types/database.js';
import { INITIAL_CAMPAIGNS, INITIAL_MONTH_ASSETS } from '../src/data/initialCampaigns.js';
import { Campaign, SocialAsset } from '../src/types/campaign.js';
import { supabaseStorage } from './supabaseStorage.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.resolve(__dirname, '..', 'data', 'autonoma-database.json');

export const DEFAULT_ORG_ID = 'org_apex_pune';
export const INITIAL_SUPER_ADMIN_EMAIL = (process.env.INITIAL_SUPER_ADMIN_EMAIL || 'amarpawar2007@gmail.com').toLowerCase().trim();
export const DEFAULT_PRODUCTION_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbyyTzei9wvOAWbDrFeaGhk2fFkwsWVgBqK-zcFdAQH_dMKVKAQE2wLSIjvdqZHGct5m/exec';

/**
 * Maps a rich frontend Campaign object to the flat Google Sheets DbCampaignRow
 */
export function campaignToDbRow(c: Campaign, orgId?: string): DbCampaignRow {
  return {
    campaignId: c.id,
    organizationId: orgId || (c as any).organizationId || DEFAULT_ORG_ID,
    name: c.name,
    brief: c.brief,
    objective: c.objective,
    status: c.status,
    assetCount: c.assetCount || 0,
    startDate: c.startDate,
    endDate: c.endDate,
    platforms: JSON.stringify(c.platforms || []),
    platformsJson: JSON.stringify(c.platforms || []),
    duration: c.strategy?.formatMix?.join(', ') || '7_days',
    audience: c.strategy?.targetAudience || '',
    marketInsight: c.strategy?.coreInsight || '',
    valueProposition: c.strategy?.valueProposition || '',
    contentPillars: JSON.stringify(c.strategy?.contentPillars || []),
    postingCadence: c.strategy?.recommendedPostingSchedule || '',
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: c.updatedAt || new Date().toISOString(),
    archivedAt: c.archivedAt,
    languages: JSON.stringify(c.languages || [(c as any).targetLanguage || 'English']),
    targetLanguage: (c as any).targetLanguage || (c.languages && c.languages[0]) || 'English',
    customLanguage: c.customLanguage,
    customPlatform: c.customPlatform,
    languageStyle: c.languageStyle,
    generationStatus: c.generationStatus,
    lastGenerationError: c.lastGenerationError,
    lastGenerationAttemptAt: c.lastGenerationAttemptAt,
    generationOptionsJson: c.generationOptions ? JSON.stringify(c.generationOptions) : undefined
  };
}

/**
 * Maps a flat Google Sheets DbCampaignRow back to a rich Campaign object
 */
export function dbRowToCampaign(row: DbCampaignRow): Campaign {
  let platforms: any[] = [];
  try {
    platforms = JSON.parse(row.platforms || '[]');
  } catch {
    platforms = (row.platforms || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  }

  let contentPillars: string[] = [];
  try {
    contentPillars = JSON.parse(row.contentPillars || '[]');
  } catch {
    contentPillars = (row.contentPillars || '').split('\n').filter(Boolean);
  }

  let languages: string[] = ['English'];
  if (row.languages) {
    try {
      languages = JSON.parse(row.languages);
    } catch {
      languages = [row.languages];
    }
  }

  let generationOptions: any = undefined;
  if (row.generationOptionsJson) {
    try {
      generationOptions = JSON.parse(row.generationOptionsJson);
    } catch {}
  }

  return {
    id: row.campaignId,
    campaignCode: row.campaignId.startsWith('CMP-') ? row.campaignId : `CMP-${row.campaignId.toUpperCase()}`,
    name: row.name,
    brief: row.brief,
    objective: row.objective,
    status: (row.status as any) || 'ACTIVE',
    platforms,
    formats: ['carousel', 'reel_short', 'static_poster'],
    languages,
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    archivedAt: row.archivedAt,
    assetCount: Number(row.assetCount) || 0,
    customLanguage: row.customLanguage,
    customPlatform: row.customPlatform,
    languageStyle: row.languageStyle,
    generationStatus: (row.generationStatus as any),
    lastGenerationError: row.lastGenerationError,
    lastGenerationAttemptAt: row.lastGenerationAttemptAt,
    generationOptions,
    strategy: {
      targetAudience: row.audience,
      coreInsight: row.marketInsight,
      valueProposition: row.valueProposition,
      contentPillars,
      recommendedPostingSchedule: row.postingCadence,
      languageGuidance: row.customLanguage
        ? `${row.customLanguage} (${row.languageStyle || 'Natural'})`
        : (languages.join(', ') + (row.languageStyle ? ` · ${row.languageStyle}` : ''))
    }
  };
}

/**
 * Maps a rich SocialAsset object to flat DbAssetRow
 */
export function assetToDbRow(a: SocialAsset, orgId?: string): DbAssetRow {
  return {
    assetId: a.id,
    campaignId: a.campaignId || 'cmp-q1-manifesto',
    organizationId: orgId || (a as any).organizationId || DEFAULT_ORG_ID,
    title: a.title,
    hook: a.hook,
    strategicPurpose: a.strategicPurpose || 'Operational Education',
    angle: a.angle || '',
    platform: a.platform,
    language: a.language || 'English',
    conceptIndex: a.conceptIndex,
    format: a.format,
    contentStream: a.stream,
    speciesCode: a.speciesCode,
    funnelStage: 'MOFU',
    targetDate: a.targetDate,
    targetTime: a.postTimeIST || '11:30 AM',
    caption: a.caption,
    hashtags: Array.isArray(a.hashtags) ? a.hashtags.join(', ') : (a.hashtags || ''),
    cta: a.callToAction,
    carouselSlidesJson: JSON.stringify(a.slides || []),
    reelScript: JSON.stringify(a.videoScenes || []),
    storyboardJson: JSON.stringify(a.videoScenes || []),
    imagePrompt: a.posterVisualPrompt || a.generatedImagePrompt || '',
    videoPrompt: a.videoGenerationPrompt || '',
    approvalStatus: a.status,
    mediaStatus: a.productionStatus || 'NOT_GENERATED',
    aiContentScore: a.viralityScore || 85,
    aiScoreRationale: a.viralityRationale || '',
    isArchived: Boolean(a.isArchived),
    archivedAt: a.archivedAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Maps a flat DbAssetRow back to SocialAsset
 */
export function dbRowToAsset(row: DbAssetRow): SocialAsset {
  let slides = undefined;
  if (row.carouselSlidesJson) {
    try {
      const parsed = JSON.parse(row.carouselSlidesJson);
      if (Array.isArray(parsed) && parsed.length > 0) slides = parsed;
    } catch {}
  }

  let videoScenes = undefined;
  if (row.reelScript) {
    try {
      const parsed = JSON.parse(row.reelScript);
      if (Array.isArray(parsed) && parsed.length > 0) videoScenes = parsed;
    } catch {}
  }

  const hashtags = row.hashtags
    ? row.hashtags.split(/[\s,]+/).map(h => h.replace(/^#/, '').trim()).filter(Boolean)
    : [];

  return {
    id: row.assetId,
    campaignId: row.campaignId,
    assetCode: row.assetId.startsWith('APEX-') ? row.assetId : `APEX-${row.assetId}`,
    title: row.title,
    strategicPurpose: row.strategicPurpose,
    angle: row.angle,
    targetDate: row.targetDate,
    postTimeIST: row.targetTime || '11:30 AM',
    platform: (row.platform?.toLowerCase() as any) || 'instagram',
    language: row.language || 'English',
    conceptIndex: row.conceptIndex,
    format: (row.format?.toLowerCase() as any) || 'carousel',
    stream: (row.contentStream as any) || 'commerce_operations',
    speciesCode: (row.speciesCode as any) || 'SPEC-01_PROBLEM_FIRST',
    status: (row.approvalStatus as any) || 'draft',
    productionStatus: (row.mediaStatus as any) || 'NOT_GENERATED',
    isArchived: Boolean(row.isArchived),
    archivedAt: row.archivedAt,
    hook: row.hook,
    caption: row.caption,
    hashtags,
    callToAction: row.cta,
    viralityScore: Number(row.aiContentScore) || 85,
    viralityRationale: row.aiScoreRationale,
    targetReach: 2800,
    estimatedImpressions: 3900,
    expectedLeads: 5,
    targetBuyerPersona: 'Small business owners & local product businesses',
    designSystemVerified: true,
    colorScheme: 'carbon_orange',
    slides,
    videoScenes,
    posterVisualPrompt: row.imagePrompt,
    videoGenerationPrompt: row.videoPrompt
  };
}

/**
 * Creates initial baseline database populated with the 22 seeded assets and campaigns
 */
function createInitialDatabase(): AutonomaDatabaseStore {
  const campaigns = INITIAL_CAMPAIGNS.map(c => campaignToDbRow(c));
  const assets = INITIAL_MONTH_ASSETS.map(a => assetToDbRow(a));

  const defaultSettings: DbSettingsRow = {
    organizationId: DEFAULT_ORG_ID,
    organizationName: 'Apex Engineering Pune',
    brandName: 'Apex Autonoma',
    website: 'https://apex-engineering.co.in',
    timezone: 'Asia/Kolkata',
    defaultPlatforms: 'instagram,linkedin,youtube,twitter,facebook',
    brandConfigJson: JSON.stringify({
      designSystem: 'AES-DS',
      palette: ['#0A0B0E', '#14161B', '#FF4500', '#FFFFFF'],
      founder: 'Amar Pawar (18+ yrs UX)'
    }),
    updatedAt: new Date().toISOString()
  };

  const initialLog: DbActivityLogRow = {
    logId: `LOG-${Date.now()}-001`,
    organizationId: DEFAULT_ORG_ID,
    entityType: 'SYSTEM',
    entityId: 'INIT',
    action: 'DATABASE_BOOTSTRAPPED',
    source: 'AutonomaServer',
    timestamp: new Date().toISOString(),
    detailsJson: JSON.stringify({
      campaignCount: campaigns.length,
      seededAssetCount: assets.length,
      note: 'Durable database seeded with 22 initial assets and 2 core campaigns'
    })
  };

  const initialProfile = {
    organizationType: 'business' as const,
    description: 'Precision CNC machining, industrial automation, and custom tooling engineering.',
    audience: 'Industrial procurement heads, automotive & aerospace OEMs, factory automation engineers in India & APAC',
    primaryGoal: 'Drive qualified RFQ consultations, technical audits, and high-volume machining contracts',
    offerings: '5-axis CNC Milling, Turning, Sheet Metal Fabrication, Automation Jigs & Fixtures',
    geography: 'Pune, Maharashtra, India (serving Global OEMs)',
    preferredLanguage: 'English',
    timezone: 'Asia/Kolkata (IST)',
    brandVoice: 'Authoritative, precision-driven, engineering-centric, ISO compliant',
    claimsAvoid: 'Overpromising lead times, uncertified material specs',
    preferredCta: 'Request Technical Feasibility & Quote',
    confirmedContext: {
      organizationAndOffering: 'Precision CNC machining, industrial automation, and custom tooling engineering.',
      audience: 'Industrial procurement heads, automotive & aerospace OEMs, factory automation engineers in India & APAC',
      goals: 'Drive qualified RFQ consultations, technical audits, and high-volume machining contracts',
      voice: 'Authoritative, precision-driven, engineering-centric, ISO compliant',
      cta: 'Request Technical Feasibility & Quote',
      constraints: 'Overpromising lead times, uncertified material specs',
      sourceUrls: ['https://apexengineering.in'],
      assumptions: ['[Assumption] Standard ISO compliant precision manufacturing operations.'],
      version: 1,
      confirmedAt: '2026-09-01T00:00:00.000Z',
      isActive: true
    }
  };

  const initialCompanies: DbCompanyRow[] = [
    {
      companyId: DEFAULT_ORG_ID,
      name: 'Apex Engineering Pune',
      status: 'ACTIVE',
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: new Date().toISOString(),
      profile: initialProfile,
      profileJson: JSON.stringify(initialProfile)
    }
  ];

  const initialUsers: DbUserRow[] = [
    {
      userId: 'usr_super_admin',
      email: INITIAL_SUPER_ADMIN_EMAIL,
      name: 'Amar Pawar',
      isSuperAdmin: true,
      status: 'ACTIVE',
      createdAt: '2026-09-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString()
    }
  ];

  const initialMemberships: DbMembershipRow[] = [
    {
      membershipId: 'mem_apex_super',
      userId: 'usr_super_admin',
      companyId: DEFAULT_ORG_ID,
      role: 'COMPANY_ADMIN',
      status: 'ACTIVE',
      assignedAt: '2026-09-01T00:00:00.000Z',
      assignedBy: 'SYSTEM'
    }
  ];

  return {
    version: '1.0.0',
    organizationId: DEFAULT_ORG_ID,
    lastSyncAt: null,
    googleSheetsUrl: process.env.GOOGLE_APPS_SCRIPT_URL || process.env.GOOGLE_SHEETS_WEBAPP_URL || '',
    companies: initialCompanies,
    users: initialUsers,
    memberships: initialMemberships,
    approvalRequests: [],
    sessions: [],
    campaigns,
    assets,
    media: [],
    publishing: [],
    performance: [],
    dailySnapshots: [],
    settings: defaultSettings,
    activityLog: [initialLog],
    deletedCampaignIds: [],
    deletedAssetIds: [],
    initialized: true
  };
}

export class AutonomaDatabaseManager {
  private store: AutonomaDatabaseStore;
  private hasHydrated = false;
  private isHydrating: Promise<any> | null = null;
  private dbFilePath: string;

constructor(customFilePath?: string) {
  this.dbFilePath = customFilePath || DB_FILE_PATH;
  this.store = this.loadFromDisk();
}

public async initializeProductionPersistence(): Promise<{
  source: 'supabase' | 'local';
  companies: number;
  users: number;
  memberships: number;
  campaigns: number;
  assets: number;
  migrated?: boolean;
}> {
  if (!supabaseStorage.ready) {
    console.warn('[Autonoma DB] Supabase not configured; serving local cache.');

    return {
      source: 'local',
      companies: this.store.companies?.length || 0,
      users: this.store.users?.length || 0,
      memberships: this.store.memberships?.length || 0,
      campaigns: this.store.campaigns?.length || 0,
      assets: this.store.assets?.length || 0
    };
  }

  const remote = await supabaseStorage.loadStoreFromSupabase();

  const hasRemoteData = Boolean(
    (remote?.companies && remote.companies.length > 0) ||
    (remote?.users && remote.users.length > 0) ||
    (remote?.campaigns && remote.campaigns.length > 0) ||
    (remote?.assets && remote.assets.length > 0)
  );

  if (hasRemoteData && remote) {
    this.store = {
      ...this.store,
      ...(remote.companies ? { companies: remote.companies } : {}),
      ...(remote.users ? { users: remote.users } : {}),
      ...(remote.memberships ? { memberships: remote.memberships } : {}),
      ...(remote.campaigns ? { campaigns: remote.campaigns } : {}),
      ...(remote.assets ? { assets: remote.assets } : {}),
      initialized: true
    };

    this.persistToDisk();
    this.hasHydrated = true;

    console.log(
      `[Autonoma DB] Supabase authoritative bootstrap complete: ${
        this.store.companies?.length || 0
      } companies, ${this.store.users?.length || 0} users, ${
        this.store.campaigns.length
      } campaigns, ${this.store.assets.length} assets.`
    );

    return {
      source: 'supabase',
      companies: this.store.companies?.length || 0,
      users: this.store.users?.length || 0,
      memberships: this.store.memberships?.length || 0,
      campaigns: this.store.campaigns.length,
      assets: this.store.assets.length
    };
  }

  const migration = await supabaseStorage.migrateStore(this.store);

  if (migration.migrated) {
    this.hasHydrated = true;
  }

  return {
    source: migration.migrated ? 'supabase' : 'local',
    companies: this.store.companies?.length || 0,
    users: this.store.users?.length || 0,
    memberships: this.store.memberships?.length || 0,
    campaigns: this.store.campaigns.length,
    assets: this.store.assets.length,
    migrated: migration.migrated
  };
}

  private loadFromDisk(): AutonomaDatabaseStore {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      const backupPath = this.dbFilePath.replace(/\.json$/, '.backup.json');
      const targetPath = fs.existsSync(this.dbFilePath) ? this.dbFilePath : (fs.existsSync(backupPath) ? backupPath : null);

      if (targetPath) {
        const raw = fs.readFileSync(targetPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.campaigns) && Array.isArray(parsed.assets)) {
          if (!parsed.deletedCampaignIds) parsed.deletedCampaignIds = [];
          if (!parsed.deletedAssetIds) parsed.deletedAssetIds = [];
          if (!parsed.deletedCompanyIds) parsed.deletedCompanyIds = [];
          parsed.initialized = true;

          // Strip any records that are marked deleted
          if (parsed.deletedCampaignIds.length > 0) {
            const delSet = new Set(parsed.deletedCampaignIds);
            parsed.campaigns = parsed.campaigns.filter((c: any) => !delSet.has(c.campaignId));
          }
          if (parsed.deletedAssetIds.length > 0) {
            const delSet = new Set(parsed.deletedAssetIds);
            parsed.assets = parsed.assets.filter((a: any) => !delSet.has(a.assetId));
          }
          if (parsed.deletedCompanyIds.length > 0) {
            const delCompSet = new Set(parsed.deletedCompanyIds);
            parsed.companies = (parsed.companies || []).filter((c: any) => !delCompSet.has(c.companyId));
          }

          if (!parsed.companies || !Array.isArray(parsed.companies)) parsed.companies = [];
          if (!parsed.users || !Array.isArray(parsed.users)) parsed.users = [];
          if (!parsed.memberships || !Array.isArray(parsed.memberships)) parsed.memberships = [];
          if (!parsed.approvalRequests || !Array.isArray(parsed.approvalRequests)) parsed.approvalRequests = [];
          if (!parsed.sessions || !Array.isArray(parsed.sessions)) parsed.sessions = [];

          // Only bootstrap default company if it has NEVER been explicitly deleted
          let legacyCo = parsed.companies.find((c: any) => c.companyId === DEFAULT_ORG_ID);
          if (!legacyCo && !parsed.deletedCompanyIds.includes(DEFAULT_ORG_ID)) {
            legacyCo = {
              companyId: DEFAULT_ORG_ID,
              name: 'Apex Engineering Pune',
              status: 'ACTIVE',
              createdAt: '2026-09-01T00:00:00.000Z',
              updatedAt: new Date().toISOString()
            };
            parsed.companies.push(legacyCo);
          }
          if (!legacyCo.profile) {
            legacyCo.profile = {
              organizationType: 'business',
              description: 'Precision CNC machining, industrial automation, and custom tooling engineering.',
              audience: 'Industrial procurement heads, automotive & aerospace OEMs, factory automation engineers in India & APAC',
              primaryGoal: 'Drive qualified RFQ consultations, technical audits, and high-volume machining contracts',
              offerings: '5-axis CNC Milling, Turning, Sheet Metal Fabrication, Automation Jigs & Fixtures',
              geography: 'Pune, Maharashtra, India (serving Global OEMs)',
              preferredLanguage: 'English',
              timezone: 'Asia/Kolkata (IST)',
              brandVoice: 'Authoritative, precision-driven, engineering-centric, ISO compliant',
              claimsAvoid: 'Overpromising lead times, uncertified material specs',
              preferredCta: 'Request Technical Feasibility & Quote'
            };
            legacyCo.profileJson = JSON.stringify(legacyCo.profile);
          }
          if (legacyCo.profile && !legacyCo.profile.confirmedContext) {
            legacyCo.profile.confirmedContext = {
              organizationAndOffering: legacyCo.profile.description,
              audience: legacyCo.profile.audience,
              goals: legacyCo.profile.primaryGoal,
              voice: legacyCo.profile.brandVoice || 'Authoritative, precision-driven, engineering-centric',
              cta: legacyCo.profile.preferredCta || 'Request Technical Feasibility & Quote',
              constraints: legacyCo.profile.claimsAvoid || 'Overpromising lead times, uncertified material specs',
              sourceUrls: ['https://apexengineering.in'],
              assumptions: ['[Assumption] Standard ISO compliant precision manufacturing operations.'],
              version: 1,
              confirmedAt: '2026-09-01T00:00:00.000Z',
              isActive: true
            };
            legacyCo.profileJson = JSON.stringify(legacyCo.profile);
          }

          // Ensure all companies deserialize their profiles and remain fully synchronized
          for (const c of parsed.companies) {
            if (!c.profile && c.profileJson) {
              try { c.profile = JSON.parse(c.profileJson); } catch {}
            } else if (c.profile && !c.profileJson) {
              c.profileJson = JSON.stringify(c.profile);
            }
          }

          // Guarantee Super Admin user exists and has isSuperAdmin: true
          let superAdmin = parsed.users.find((u: any) => u.email?.toLowerCase().trim() === INITIAL_SUPER_ADMIN_EMAIL);
          if (!superAdmin) {
            superAdmin = {
              userId: 'usr_super_admin',
              email: INITIAL_SUPER_ADMIN_EMAIL,
              name: 'Amar Pawar',
              isSuperAdmin: true,
              status: 'ACTIVE',
              createdAt: '2026-09-01T00:00:00.000Z',
              lastLoginAt: new Date().toISOString()
            };
            parsed.users.push(superAdmin);
          } else {
            superAdmin.isSuperAdmin = true;
          }

          // Guarantee membership for Super Admin in Apex Engineering Pune
          if (!parsed.memberships.find((m: any) => m.userId === superAdmin.userId && m.companyId === DEFAULT_ORG_ID)) {
            parsed.memberships.push({
              membershipId: 'mem_apex_super',
              userId: superAdmin.userId,
              companyId: DEFAULT_ORG_ID,
              role: 'COMPANY_ADMIN',
              status: 'ACTIVE',
              assignedAt: '2026-09-01T00:00:00.000Z',
              assignedBy: 'SYSTEM'
            });
          }

          // Map any unassigned legacy campaigns or assets strictly to DEFAULT_ORG_ID
          for (const c of parsed.campaigns) {
            if (!c.organizationId) c.organizationId = DEFAULT_ORG_ID;
          }
          for (const a of parsed.assets) {
            if (!a.organizationId) a.organizationId = DEFAULT_ORG_ID;
          }

          // If env has a sheets URL and store doesn't, apply env var
          const envUrl = process.env.GOOGLE_APPS_SCRIPT_URL || process.env.GOOGLE_SHEETS_WEBAPP_URL;
          if (envUrl && !parsed.googleSheetsUrl) {
            parsed.googleSheetsUrl = envUrl;
          }
          // Ensure seeded baseline assets are not missing on fresh setup
          if (parsed.assets.length === 0 && parsed.deletedAssetIds.length === 0 && !parsed.initialized) {
            parsed.assets = INITIAL_MONTH_ASSETS.map(a => assetToDbRow(a));
          }
          if (parsed.campaigns.length === 0 && parsed.deletedCampaignIds.length === 0 && !parsed.initialized) {
            parsed.campaigns = INITIAL_CAMPAIGNS.map(c => campaignToDbRow(c));
          }
          console.log(`[Autonoma DB] Loaded ${parsed.campaigns.length} campaigns, ${parsed.assets.length} assets, ${parsed.companies.length} companies from disk.`);
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[Autonoma DB] Error loading from disk, bootstrapping fresh initial database:', err);
    }

    const fresh = createInitialDatabase();
    this.persistToDisk(fresh);
    console.log(`[Autonoma DB] Initialized durable database with ${fresh.campaigns.length} campaigns and ${fresh.assets.length} assets.`);
    return fresh;
  }

  private persistToDisk(storeToSave?: AutonomaDatabaseStore): void {
    const data = storeToSave || this.store;
    const dir = path.dirname(this.dbFilePath);

    try {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(
        this.dbFilePath,
        JSON.stringify(data, null, 2),
        'utf-8'
      );
      // Write mirror backup for resilience across container restarts
      const backupPath = this.dbFilePath.replace(/\.json$/, '.backup.json');
      try {
        fs.writeFileSync(backupPath, JSON.stringify(data, null, 2), 'utf-8');
      } catch {}
  } catch (err: any) {
    console.error(
      '[Autonoma DB] CRITICAL: Failed to persist database to disk:',
      err
    );

    // Do not allow the API to report success when persistence failed.
    throw new Error(
      `Operational database write failed: ${
        err?.message || 'Unknown filesystem error'
      }`
    );
  }
}

  /**
   * Resolves the single canonical Google Sheets Web App URL with strict priority:
   * 1. Explicit persisted server setting in this.store, if available and valid (/exec)
   * 2. Environment variable AUTONOMA_SHEETS_WEBAPP_URL (or GOOGLE_APPS_SCRIPT_URL / GOOGLE_SHEETS_WEBAPP_URL)
   * 3. Production default Web App URL
   * Normalizes whitespace and strips trailing slashes.
   */
  public resolveGoogleSheetsUrl(): string {
    // 0. If explicitly set to DISABLED or empty string in store, respect disconnection/test isolation
    if (this.store.googleSheetsUrl === 'DISABLED' || this.store.googleSheetsUrl === '') {
      return '';
    }

    // 1. Explicit persisted server setting, if available and valid
    const stored = (this.store.googleSheetsUrl || '').trim().replace(/\/+$/, '');
    if (stored && stored.endsWith('/exec')) {
      return stored;
    }

    // 2. Environment variable fallback
    if (process.env.NODE_ENV === 'test') {
      return '';
    }

    const envUrl = (
      process.env.AUTONOMA_SHEETS_WEBAPP_URL ||
      process.env.GOOGLE_APPS_SCRIPT_URL ||
      process.env.GOOGLE_SHEETS_WEBAPP_URL ||
      process.env.VITE_SHEETS_WEBHOOK_URL ||
      ''
    ).trim().replace(/\/+$/, '');
    if (envUrl && envUrl.endsWith('/exec')) {
      return envUrl;
    }

    // 3. Canonical production default Web App URL
    return DEFAULT_PRODUCTION_SHEETS_URL;
  }

  public getGoogleSheetsUrl(): string {
    return this.resolveGoogleSheetsUrl();
  }

  /**
   * Validates that the configured or provided URL ends in /exec
   * without exposing secrets in logs.
   */
  public validateGoogleSheetsUrl(targetUrl?: string): { valid: boolean; error?: string; url: string } {
    const candidate = (targetUrl !== undefined ? targetUrl : this.resolveGoogleSheetsUrl()).trim().replace(/\/+$/, '');
    if (!candidate) {
      return { valid: false, error: 'Google Sheets Web App URL is not configured.', url: '' };
    }
    if (!candidate.endsWith('/exec')) {
      return {
        valid: false,
        error: 'Google Sheets Web App URL must end with /exec (Apps Script Web App deployment endpoint).',
        url: candidate
      };
    }
    return { valid: true, url: candidate };
  }

  /**
   * Performs a lightweight connection and operational health check without exposing secrets.
   */
  public async checkHealth(): Promise<{
    success: boolean;
    database: string;
    googleSheets: {
      configured: boolean;
      connected: boolean;
      latencyMs?: number;
      error?: string;
      checkedAt: string;
    };
  }> {
    const validation = this.validateGoogleSheetsUrl();
    const checkedAt = new Date().toISOString();
    if (!validation.valid) {
      return {
        success: true,
        database: 'ready',
        googleSheets: {
          configured: false,
          connected: false,
          error: validation.error,
          checkedAt
        }
      };
    }

    const start = Date.now();
    try {
      const pingRes = await this.callAppsScript('PING', {});
      const latencyMs = Date.now() - start;
      const isConnected = Boolean(pingRes.success);
      return {
        success: true,
        database: 'ready',
        googleSheets: {
          configured: true,
          connected: isConnected,
          latencyMs,
          error: isConnected ? undefined : (pingRes.error || 'Connection verification failed'),
          checkedAt
        }
      };
    } catch (err: any) {
      return {
        success: true,
        database: 'ready',
        googleSheets: {
          configured: true,
          connected: false,
          error: err?.message || 'Failed to connect to Google Sheets Web App',
          checkedAt
        }
      };
    }
  }

  public setGoogleSheetsUrl(url: string): void {
    const normalized = (url || '').trim().replace(/\/+$/, '');
    this.store.googleSheetsUrl = normalized;
    this.persistToDisk();
  }

  /**
   * Canonical helper to dispatch actions to the Google Apps Script Web App.
   * All server routes and write-through operations use this exact method.
   */
  public async callAppsScript<T = any>(action: string, payload: Record<string, any> = {}): Promise<AppsScriptResponse<T>> {
    const validation = this.validateGoogleSheetsUrl();
    if (!validation.valid) {
      return {
        success: false,
        error: validation.error || 'Google Sheets Web App URL not configured',
        code: 'NO_WEBAPP_URL'
      };
    }

    const url = validation.url;
    const timeoutMs = action === 'PING' ? 20000 : action === 'HYDRATE' || action === 'INIT_DATABASE' ? 60000 : 30000;

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
        redirect: 'follow',
        signal: AbortSignal.timeout(timeoutMs)
      });

      if (!res.ok) {
        return {
          success: false,
          error: `Apps Script HTTP Error ${res.status}: ${res.statusText}`,
          code: 'HTTP_ERROR'
        };
      }

      const json = await res.json();
      return json as AppsScriptResponse<T>;
    } catch (err: any) {
      const isTimeout = err?.name === 'TimeoutError' || (err?.message && err.message.toLowerCase().includes('aborted'));
      const friendlyError = isTimeout
        ? 'Google Sheets Web App response timed out. Operation recorded locally in authoritative database.'
        : (err?.message || 'Failed to reach Google Apps Script Web App');

      console.warn(`[Autonoma DB] Apps Script action ${action} failed:`, friendlyError);
      return {
        success: false,
        error: friendlyError,
        code: isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR'
      };
    }
  }

  // ==========================================
  // COMPANIES API
  // ==========================================

  public getCompanies(): DbCompanyRow[] {
    const list = this.store.companies || [];
    for (const c of list) {
      if (c.profileJson && !c.profile) {
        try { c.profile = JSON.parse(c.profileJson); } catch {}
      } else if (c.profile && !c.profileJson) {
        c.profileJson = JSON.stringify(c.profile);
      }
    }
    return list;
  }

  public getCompany(companyId: string): DbCompanyRow | null {
    const c = (this.store.companies || []).find(comp => comp.companyId === companyId);
    if (!c) return null;
    if (c.profileJson && !c.profile) {
      try { c.profile = JSON.parse(c.profileJson); } catch {}
    } else if (c.profile && !c.profileJson) {
      c.profileJson = JSON.stringify(c.profile);
    }
    return c;
  }

  public async createCompany(name: string, status: 'ACTIVE' | 'SUSPENDED' = 'ACTIVE', profile?: any): Promise<DbCompanyRow> {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'company';
    const companyId = `org_${slug}_${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();
    const newCompany: DbCompanyRow = {
      companyId,
      name: name.trim(),
      status,
      profile: profile || undefined,
      profileJson: profile ? JSON.stringify(profile) : undefined,
      createdAt: now,
      updatedAt: now
    };
    if (!this.store.companies) this.store.companies = [];
    this.store.companies.push(newCompany);
    if (this.store.deletedCompanyIds) {
      this.store.deletedCompanyIds = this.store.deletedCompanyIds.filter(id => id !== companyId);
    }
    this.persistToDisk();

    // Async notify Supabase durable persistence
    supabaseStorage.upsertCompany(newCompany).catch((err) => {
      console.warn('[Autonoma DB] Background Supabase company upsert notice:', err?.message);
    });

    this.logActivity('COMPANY', companyId, 'CREATE_COMPANY', { name: newCompany.name });
    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('CREATE_COMPANY', { company: newCompany }).catch(() => {});
    }
    return newCompany;
  }

  public async updateCompany(companyId: string, updates: Partial<DbCompanyRow>): Promise<DbCompanyRow> {
    if (!this.store.companies) this.store.companies = [];
    const idx = this.store.companies.findIndex(c => c.companyId === companyId);
    if (idx < 0) throw new Error(`Company ${companyId} not found`);

    let profile = updates.profile !== undefined ? updates.profile : this.store.companies[idx].profile;
    if (profile === undefined && updates.profileJson) {
      try { profile = JSON.parse(updates.profileJson); } catch {}
    }
    const profileJson = profile ? JSON.stringify(profile) : (updates.profileJson || this.store.companies[idx].profileJson);

    const updated = {
      ...this.store.companies[idx],
      ...updates,
      profile,
      profileJson,
      updatedAt: new Date().toISOString()
    };
    this.store.companies[idx] = updated;
    this.persistToDisk();

    // Async notify Supabase durable persistence
    supabaseStorage.upsertCompany(updated).catch((err) => {
      console.warn('[Autonoma DB] Background Supabase company update notice:', err?.message);
    });

    this.logActivity('COMPANY', companyId, 'UPDATE_COMPANY', updates);
    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('UPDATE_COMPANY', { company: updated }).catch(() => {});
    }
    return updated;
  }

  public async deleteCompany(companyId: string, actorUserId: string): Promise<{
    success: boolean;
    companyId: string;
    deletedCampaigns: number;
    deletedAssets: number;
    deletedMemberships: number;
  }> {
    if (companyId === DEFAULT_ORG_ID) {
      throw new Error('Apex Engineering Pune is the protected primary workspace and cannot be deleted.');
    }
    const company = this.getCompany(companyId);
    if (!company) throw new Error('Company not found');

    const campaignIds = new Set((this.store.campaigns || []).filter(c => c.organizationId === companyId).map(c => c.campaignId));
    const assetIds = new Set((this.store.assets || []).filter(a => a.organizationId === companyId || campaignIds.has(a.campaignId)).map(a => a.assetId));
    const publicationIds = new Set((this.store.publishing || []).filter(p => campaignIds.has(p.campaignId) || assetIds.has(p.assetId)).map(p => p.publicationId));

    const deletedCampaigns = campaignIds.size;
    const deletedAssets = assetIds.size;
    const deletedMemberships = (this.store.memberships || []).filter(m => m.companyId === companyId).length;

    if (!this.store.deletedCampaignIds) this.store.deletedCampaignIds = [];
    if (!this.store.deletedAssetIds) this.store.deletedAssetIds = [];
    if (!this.store.deletedCompanyIds) this.store.deletedCompanyIds = [];
    for (const id of campaignIds) if (!this.store.deletedCampaignIds.includes(id)) this.store.deletedCampaignIds.push(id);
    for (const id of assetIds) if (!this.store.deletedAssetIds.includes(id)) this.store.deletedAssetIds.push(id);
    if (!this.store.deletedCompanyIds.includes(companyId)) this.store.deletedCompanyIds.push(companyId);

    this.store.campaigns = (this.store.campaigns || []).filter(c => !campaignIds.has(c.campaignId));
    this.store.assets = (this.store.assets || []).filter(a => !assetIds.has(a.assetId));
    this.store.media = (this.store.media || []).filter(m => !assetIds.has(m.assetId) && !campaignIds.has(m.campaignId));
    this.store.publishing = (this.store.publishing || []).filter(p => !assetIds.has(p.assetId) && !campaignIds.has(p.campaignId));
    this.store.performance = (this.store.performance || []).filter(p => !assetIds.has(p.assetId) && !campaignIds.has(p.campaignId) && !publicationIds.has(p.publicationId));
    this.store.dailySnapshots = (this.store.dailySnapshots || []).filter(s => !assetIds.has(s.assetId) && !publicationIds.has(s.publicationId));
    this.store.memberships = (this.store.memberships || []).filter(m => m.companyId !== companyId);
    this.store.companies = (this.store.companies || []).filter(c => c.companyId !== companyId);

    for (const req of this.store.approvalRequests || []) {
      if (req.assignedCompanyId === companyId) req.assignedCompanyId = undefined;
    }

    for (const session of this.store.sessions || []) {
      if (session.activeCompanyId === companyId) {
        const fallback = (this.store.memberships || []).find(m => m.userId === session.userId && m.status === 'ACTIVE');
        session.activeCompanyId = fallback?.companyId;
      }
    }

    // Async notify Supabase durable persistence
    supabaseStorage.deleteCompany(companyId).catch((err) => {
      console.warn('[Autonoma DB] Background Supabase company delete notice:', err?.message);
    });

    this.logActivity('COMPANY', companyId, 'DELETE_COMPANY', {
      name: company.name, actorUserId, deletedCampaigns, deletedAssets, deletedMemberships
    });
    this.persistToDisk();

    return { success: true, companyId, deletedCampaigns, deletedAssets, deletedMemberships };
  }

  // ==========================================
  // USERS & MEMBERSHIPS API
  // ==========================================

  public getUsers(): DbUserRow[] {
    return this.store.users || [];
  }

  public getUser(userId: string): DbUserRow | null {
    return (this.store.users || []).find(u => u.userId === userId) || null;
  }

  public getUserByEmail(email: string): DbUserRow | null {
    const norm = email.toLowerCase().trim();
    return (this.store.users || []).find(u => u.email.toLowerCase().trim() === norm) || null;
  }

  public async saveUser(user: DbUserRow): Promise<DbUserRow> {
    if (!this.store.users) this.store.users = [];
    const idx = this.store.users.findIndex(u => u.userId === user.userId);
    if (idx >= 0) {
      this.store.users[idx] = { ...this.store.users[idx], ...user };
    } else {
      this.store.users.push(user);
    }
    this.persistToDisk();
    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript(idx >= 0 ? 'UPDATE_USER' : 'CREATE_USER', { user }).catch(() => {});
    }
    return user;
  }


  public async deleteUser(userId: string, actorUserId: string): Promise<{ success: boolean; userId: string; deletedMemberships: number }> {
    const user = this.getUser(userId);
    if (!user) throw new Error('User not found');
    if (user.isSuperAdmin || user.email.toLowerCase().trim() === INITIAL_SUPER_ADMIN_EMAIL) {
      throw new Error('The Super Admin account cannot be deleted.');
    }

    const deletedMemberships = (this.store.memberships || []).filter(m => m.userId === userId).length;
    this.store.memberships = (this.store.memberships || []).filter(m => m.userId !== userId);
    this.store.sessions = (this.store.sessions || []).filter(s => s.userId !== userId);
    this.store.users = (this.store.users || []).filter(u => u.userId !== userId);

    this.logActivity('USER', userId, 'DELETE_USER', { email: user.email, actorUserId, deletedMemberships });
    this.persistToDisk();
    return { success: true, userId, deletedMemberships };
  }

  public getMemberships(userId?: string, companyId?: string): DbMembershipRow[] {
    let list = this.store.memberships || [];
    if (userId) list = list.filter(m => m.userId === userId);
    if (companyId) list = list.filter(m => m.companyId === companyId);
    return list;
  }

  public getMembership(membershipId: string): DbMembershipRow | null {
    return (this.store.memberships || []).find(m => m.membershipId === membershipId) || null;
  }

  public async createMembership(
    userId: string,
    companyId: string,
    role: 'COMPANY_ADMIN' | 'MEMBER',
    assignedBy: string
  ): Promise<DbMembershipRow> {
    if (!this.store.memberships) this.store.memberships = [];
    // Prevent duplicate memberships: if user already has membership in companyId, safely update existing
    const existing = this.store.memberships.find(m => m.userId === userId && m.companyId === companyId);
    if (existing) {
      existing.role = role;
      existing.status = 'ACTIVE';
      existing.assignedBy = assignedBy;
      existing.assignedAt = new Date().toISOString();
      this.persistToDisk();
      return existing;
    }

    const membershipId = `mem_${crypto.randomBytes(6).toString('hex')}`;
    const newMembership: DbMembershipRow = {
      membershipId,
      userId,
      companyId,
      role,
      status: 'ACTIVE',
      assignedAt: new Date().toISOString(),
      assignedBy
    };
    this.store.memberships.push(newMembership);
    this.persistToDisk();

    this.logActivity('MEMBERSHIP', membershipId, 'CREATE_MEMBERSHIP', { userId, companyId, role });
    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('CREATE_MEMBERSHIP', { membership: newMembership }).catch(() => {});
    }
    return newMembership;
  }

  public async updateMembership(membershipId: string, updates: Partial<DbMembershipRow>): Promise<DbMembershipRow> {
    if (!this.store.memberships) this.store.memberships = [];
    const idx = this.store.memberships.findIndex(m => m.membershipId === membershipId);
    if (idx < 0) throw new Error(`Membership ${membershipId} not found`);
    const updated = {
      ...this.store.memberships[idx],
      ...updates
    };
    this.store.memberships[idx] = updated;
    this.persistToDisk();

    this.logActivity('MEMBERSHIP', membershipId, 'UPDATE_MEMBERSHIP', updates);
    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('UPDATE_MEMBERSHIP', { membership: updated }).catch(() => {});
    }
    return updated;
  }

  public async deleteMembership(membershipId: string): Promise<boolean> {
    if (!this.store.memberships) this.store.memberships = [];
    const idx = this.store.memberships.findIndex(m => m.membershipId === membershipId);
    if (idx < 0) return false;
    this.store.memberships.splice(idx, 1);
    this.persistToDisk();
    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('DELETE_MEMBERSHIP', { membershipId }).catch(() => {});
    }
    return true;
  }

  // ==========================================
  // APPROVAL REQUESTS API
  // ==========================================

  public getApprovalRequests(): DbApprovalRequestRow[] {
    return this.store.approvalRequests || [];
  }

  public getApprovalRequestByEmail(email: string): DbApprovalRequestRow | null {
    const norm = email.toLowerCase().trim();
    return (this.store.approvalRequests || []).find(r => r.email.toLowerCase().trim() === norm) || null;
  }

  public async createApprovalRequest(
    email: string,
    name: string,
    proposedCompanyName: string
  ): Promise<DbApprovalRequestRow> {
    if (!this.store.approvalRequests) this.store.approvalRequests = [];
    const normEmail = email.toLowerCase().trim();
    const existing = this.store.approvalRequests.find(r => r.email.toLowerCase().trim() === normEmail);
    if (existing) {
      if (existing.status === 'PENDING') {
        existing.proposedCompanyName = proposedCompanyName.trim() || existing.proposedCompanyName;
        existing.name = name.trim() || existing.name;
        this.persistToDisk();
        return existing;
      }
    }

    const requestId = `req_${crypto.randomBytes(6).toString('hex')}`;
    const newRequest: DbApprovalRequestRow = {
      requestId,
      email: normEmail,
      name: name.trim(),
      proposedCompanyName: proposedCompanyName.trim(),
      status: 'PENDING',
      requestedAt: new Date().toISOString()
    };
    this.store.approvalRequests.unshift(newRequest);
    this.persistToDisk();

    this.logActivity('APPROVAL_REQUEST', requestId, 'SIGNUP_REQUEST_CREATED', {
      email: normEmail,
      proposedCompanyName: newRequest.proposedCompanyName
    });

    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('CREATE_APPROVAL_REQUEST', { request: newRequest }).catch(() => {});
    }
    return newRequest;
  }

  public async approveRequest(
    requestId: string,
    targetCompanyId: string,
    role: 'COMPANY_ADMIN' | 'MEMBER',
    resolvedByUserId: string,
    newCompanyName?: string
  ): Promise<{
    success: boolean;
    request: DbApprovalRequestRow;
    company: DbCompanyRow;
    membership: DbMembershipRow;
  }> {
    if (!this.store.approvalRequests) this.store.approvalRequests = [];
    const req = this.store.approvalRequests.find(r => r.requestId === requestId);
    if (!req) {
      throw new Error(`Approval request ${requestId} not found`);
    }

    // Resolve or create company
    let company: DbCompanyRow | null = null;
    if (targetCompanyId === 'new') {
      const cName = (newCompanyName || req.proposedCompanyName || 'New Company').trim();
      company = await this.createCompany(cName, 'ACTIVE');
    } else {
      company = this.getCompany(targetCompanyId);
      if (!company) {
        throw new Error(`Target company ${targetCompanyId} not found`);
      }
    }

    // Ensure user record exists
    let user = this.getUserByEmail(req.email);
    if (!user) {
      user = {
        userId: `usr_${crypto.randomBytes(6).toString('hex')}`,
        email: req.email.toLowerCase().trim(),
        name: req.name || req.email.split('@')[0],
        isSuperAdmin: req.email.toLowerCase().trim() === INITIAL_SUPER_ADMIN_EMAIL,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };
      await this.saveUser(user);
    } else {
      if (user.status === 'SUSPENDED') {
        user.status = 'ACTIVE';
        await this.saveUser(user);
      }
    }

    // Create or update membership (safe repeated approvals, prevent duplicate memberships)
    const membership = await this.createMembership(user.userId, company.companyId, role, resolvedByUserId);

    // Update approval request
    req.status = 'APPROVED';
    req.resolvedAt = new Date().toISOString();
    req.resolvedBy = resolvedByUserId;
    req.assignedCompanyId = company.companyId;
    req.assignedRole = role;
    this.persistToDisk();

    this.logActivity('APPROVAL_REQUEST', requestId, 'APPROVE_REQUEST', {
      email: req.email,
      companyId: company.companyId,
      role
    });

    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('UPDATE_APPROVAL_REQUEST', { request: req }).catch(() => {});
    }

    return {
      success: true,
      request: req,
      company,
      membership
    };
  }

  public async rejectRequest(requestId: string, resolvedByUserId: string): Promise<{ success: boolean; request: DbApprovalRequestRow }> {
    if (!this.store.approvalRequests) this.store.approvalRequests = [];
    const req = this.store.approvalRequests.find(r => r.requestId === requestId);
    if (!req) {
      throw new Error(`Approval request ${requestId} not found`);
    }

    req.status = 'REJECTED';
    req.resolvedAt = new Date().toISOString();
    req.resolvedBy = resolvedByUserId;
    this.persistToDisk();

    this.logActivity('APPROVAL_REQUEST', requestId, 'REJECT_REQUEST', {
      email: req.email
    });

    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('UPDATE_APPROVAL_REQUEST', { request: req }).catch(() => {});
    }

    return { success: true, request: req };
  }

  // ==========================================
  // SESSIONS API
  // ==========================================

  public createSession(userId: string, activeCompanyId?: string): DbSessionRow {
    if (!this.store.sessions) this.store.sessions = [];
    const sessionToken = `autonoma_sess_${crypto.randomBytes(24).toString('hex')}`;
    const now = new Date();
    const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const session: DbSessionRow = {
      sessionToken,
      userId,
      activeCompanyId,
      createdAt: now.toISOString(),
      expiresAt: expires.toISOString()
    };
    this.store.sessions.push(session);
    this.persistToDisk();
    return session;
  }

  public getSession(sessionToken: string): DbSessionRow | null {
    if (!sessionToken || !this.store.sessions) return null;
    const session = this.store.sessions.find(s => s.sessionToken === sessionToken);
    if (!session) return null;
    // Check expiry
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      this.deleteSession(sessionToken);
      return null;
    }
    return session;
  }

  public deleteSession(sessionToken: string): boolean {
    if (!this.store.sessions) return false;
    const idx = this.store.sessions.findIndex(s => s.sessionToken === sessionToken);
    if (idx < 0) return false;
    this.store.sessions.splice(idx, 1);
    this.persistToDisk();
    return true;
  }

  public updateSessionCompany(sessionToken: string, activeCompanyId: string): DbSessionRow | null {
    const session = this.getSession(sessionToken);
    if (!session) return null;
    session.activeCompanyId = activeCompanyId;
    this.persistToDisk();
    return session;
  }

  // ==========================================
  // CAMPAIGNS API
  // ==========================================

  public getCampaigns(companyId?: string): DbCampaignRow[] {
    if (companyId) {
      return this.store.campaigns.filter(c => c.organizationId === companyId);
    }
    return this.store.campaigns;
  }

  public getCampaign(campaignId: string, companyId?: string): DbCampaignRow | null {
    const c = this.store.campaigns.find(c => c.campaignId === campaignId);
    if (!c) return null;
    if (companyId && c.organizationId !== companyId) return null;
    return c;
  }

  public async saveCampaign(campaign: DbCampaignRow, companyId?: string): Promise<{ success: boolean; data: DbCampaignRow }> {
    if (companyId) {
      campaign.organizationId = companyId;
    }
    const idx = this.store.campaigns.findIndex(c => c.campaignId === campaign.campaignId);
    if (idx >= 0) {
      if (companyId && this.store.campaigns[idx].organizationId !== companyId) {
        throw new Error('Unauthorized cross-company campaign modification');
      }
      this.store.campaigns[idx] = { ...this.store.campaigns[idx], ...campaign, updatedAt: new Date().toISOString() };
    } else {
      this.store.campaigns.unshift({ ...campaign, createdAt: campaign.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.persistToDisk();

    // Durable Supabase sync
    supabaseStorage.upsertCampaign(this.store.campaigns[idx >= 0 ? idx : 0]).catch(() => {});

    // Log Activity
    this.logActivity('CAMPAIGN', campaign.campaignId, idx >= 0 ? 'UPDATE_CAMPAIGN' : 'CREATE_CAMPAIGN', {
      name: campaign.name,
      status: campaign.status,
      organizationId: campaign.organizationId
    });

    // Google Sheets is a secondary sync target. A Sheets outage must never make a
    // successfully persisted server campaign look like a failed save to the user.
    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript(
        idx >= 0 ? 'UPDATE_CAMPAIGN' : 'CREATE_CAMPAIGN',
        { campaign }
      ).then((sheetsResult) => {
        if (!sheetsResult.success) {
          console.warn('[PERSISTENCE] Campaign saved on server; Sheets sync pending:', sheetsResult.error || 'Unknown Google Sheets error');
        }
      }).catch((err) => {
        console.warn('[PERSISTENCE] Campaign saved on server; Sheets sync unavailable:', err?.message || err);
      });
    }

    return { success: true, data: campaign };
  }

  public async archiveCampaign(campaignId: string, companyId?: string): Promise<{ success: boolean; data: DbCampaignRow }> {
    const idx = this.store.campaigns.findIndex(c => c.campaignId === campaignId);
    if (idx < 0) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    if (companyId && this.store.campaigns[idx].organizationId !== companyId) {
      throw new Error('Unauthorized cross-company access');
    }
    const updated = {
      ...this.store.campaigns[idx],
      status: 'ARCHIVED',
      archivedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.store.campaigns[idx] = updated;
    this.persistToDisk();

    this.logActivity('CAMPAIGN', campaignId, 'ARCHIVE_CAMPAIGN', {
      name: updated.name
    });

    if (this.getGoogleSheetsUrl()) {
      await this.callAppsScript('UPDATE_CAMPAIGN', { campaign: updated }).catch(e => {
        console.warn('[Autonoma DB] Sheets archive update error:', e);
      });
    }

    return { success: true, data: updated };
  }

  public async restoreCampaign(campaignId: string, companyId?: string): Promise<{ success: boolean; data: DbCampaignRow }> {
    const idx = this.store.campaigns.findIndex(c => c.campaignId === campaignId);
    if (idx < 0) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    if (companyId && this.store.campaigns[idx].organizationId !== companyId) {
      throw new Error('Unauthorized cross-company access');
    }
    const updated = {
      ...this.store.campaigns[idx],
      status: 'ACTIVE',
      archivedAt: undefined,
      updatedAt: new Date().toISOString()
    };
    this.store.campaigns[idx] = updated;
    this.persistToDisk();

    this.logActivity('CAMPAIGN', campaignId, 'RESTORE_CAMPAIGN', {
      name: updated.name
    });

    if (this.getGoogleSheetsUrl()) {
      await this.callAppsScript('UPDATE_CAMPAIGN', { campaign: updated }).catch(e => {
        console.warn('[Autonoma DB] Sheets restore update error:', e);
      });
    }

    return { success: true, data: updated };
  }

  public async deleteCampaignPermanently(campaignId: string, companyId?: string): Promise<{
    success: boolean;
    deletedCampaignId: string;
    deletedAssetCount: number;
  }> {
    const cIdx = this.store.campaigns.findIndex(c => c.campaignId === campaignId);
    if (cIdx < 0) {
      throw new Error(`Campaign ${campaignId} not found`);
    }
    if (companyId && this.store.campaigns[cIdx].organizationId !== companyId) {
      throw new Error('Unauthorized cross-company access');
    }
    const campaignName = this.store.campaigns[cIdx].name;

    // Find all assets associated with this campaign
    const associatedAssets = this.store.assets.filter(a => a.campaignId === campaignId);
    const associatedAssetIds = associatedAssets.map(a => a.assetId);

    // 1. Remove campaign
    this.store.campaigns.splice(cIdx, 1);

    // 2. Remove associated assets
    const assetIdSet = new Set(associatedAssetIds);
    this.store.assets = this.store.assets.filter(a => !assetIdSet.has(a.assetId));

    // 3. Add to tombstone arrays so reloads and sheets never resurrect them
    if (!this.store.deletedCampaignIds) this.store.deletedCampaignIds = [];
    if (!this.store.deletedAssetIds) this.store.deletedAssetIds = [];
    if (!this.store.deletedCampaignIds.includes(campaignId)) {
      this.store.deletedCampaignIds.push(campaignId);
    }
    for (const aId of associatedAssetIds) {
      if (!this.store.deletedAssetIds.includes(aId)) {
        this.store.deletedAssetIds.push(aId);
      }
    }

    // 4. Clean up dependent entries in publishing
    if (Array.isArray(this.store.publishing)) {
      this.store.publishing = this.store.publishing.filter(p => !assetIdSet.has(p.assetId));
    }

    // 5. Persist to disk immediately
    this.persistToDisk();

    // 6. Log activity
    this.logActivity('CAMPAIGN', campaignId, 'PERMANENT_DELETE_CAMPAIGN', {
      name: campaignName,
      deletedAssetCount: associatedAssetIds.length
    });

    // 7. Write-through to Google Sheets if connected
    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('DELETE_CAMPAIGN', {
        campaignId,
        assetIds: associatedAssetIds
      }).catch(e => console.warn('[Autonoma DB] Sheets permanent delete error:', e));
    }

    return {
      success: true,
      deletedCampaignId: campaignId,
      deletedAssetCount: associatedAssetIds.length
    };
  }

  // ==========================================
  // ASSETS API
  // ==========================================

  public getAssets(campaignId?: string, companyId?: string): DbAssetRow[] {
    let list = this.store.assets;
    if (companyId) {
      list = list.filter(a => a.organizationId === companyId);
    }
    if (campaignId && campaignId !== 'all') {
      list = list.filter(a => a.campaignId === campaignId);
    }
    return list;
  }

  public getAsset(assetId: string, companyId?: string): DbAssetRow | null {
    const a = this.store.assets.find(a => a.assetId === assetId);
    if (!a) return null;
    if (companyId && a.organizationId !== companyId) return null;
    return a;
  }

  public async saveAsset(asset: DbAssetRow, companyId?: string): Promise<{ success: boolean; data: DbAssetRow }> {
    if (companyId) {
      asset.organizationId = companyId;
    }
    const idx = this.store.assets.findIndex(a => a.assetId === asset.assetId);
    if (idx >= 0) {
      if (companyId && this.store.assets[idx].organizationId !== companyId) {
        throw new Error('Unauthorized cross-company asset modification');
      }
      this.store.assets[idx] = { ...this.store.assets[idx], ...asset, updatedAt: new Date().toISOString() };
    } else {
      this.store.assets.unshift({ ...asset, createdAt: asset.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.persistToDisk();

    // Durable Supabase sync
    supabaseStorage.upsertAsset(this.store.assets[idx >= 0 ? idx : 0]).catch(() => {});

    // Log Activity
    this.logActivity('ASSET', asset.assetId, idx >= 0 ? 'UPDATE_ASSET' : 'CREATE_ASSET', {
      title: asset.title,
      platform: asset.platform,
      format: asset.format,
      organizationId: asset.organizationId
    });

    // Best-effort secondary Sheets sync; server persistence is authoritative.
    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript(idx >= 0 ? 'UPDATE_ASSET' : 'CREATE_ASSET', { asset })
        .then((sheetsResult) => {
          if (!sheetsResult.success) {
            console.warn('[PERSISTENCE] Asset saved on server; Sheets sync pending:', sheetsResult.error || 'Unknown Google Sheets error');
          }
        })
        .catch((err) => console.warn('[PERSISTENCE] Asset saved on server; Sheets sync unavailable:', err?.message || err));
    }

    return { success: true, data: asset };
  }

  public async batchSaveAssets(assets: DbAssetRow[], companyId?: string): Promise<{ success: boolean; count: number }> {
    if (!assets || assets.length === 0) return { success: true, count: 0 };

    for (const newAsset of assets) {
      if (companyId) {
        newAsset.organizationId = companyId;
      }
      const idx = this.store.assets.findIndex(a => a.assetId === newAsset.assetId);
      if (idx >= 0) {
        if (companyId && this.store.assets[idx].organizationId !== companyId) {
          throw new Error('Unauthorized cross-company asset batch modification');
        }
        this.store.assets[idx] = { ...this.store.assets[idx], ...newAsset, updatedAt: new Date().toISOString() };
      } else {
        this.store.assets.unshift({ ...newAsset, createdAt: newAsset.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
      }
    }
    this.persistToDisk();

    // Log batch activity
    this.logActivity('ASSET', 'BATCH', 'BATCH_SAVE_ASSETS', {
      count: assets.length,
      campaignId: assets[0]?.campaignId
    });

    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('BATCH_SAVE_ASSETS', { assets })
        .then((sheetsResult) => {
          if (!sheetsResult.success) {
            console.warn('[PERSISTENCE] Assets saved on server; Sheets batch sync pending:', sheetsResult.error || 'Unknown Google Sheets error');
          }
        })
        .catch((err) => console.warn('[PERSISTENCE] Assets saved on server; Sheets batch sync unavailable:', err?.message || err));
    }

    return { success: true, count: assets.length };
  }

  public async archiveAsset(assetId: string, archive: boolean = true, companyId?: string): Promise<{ success: boolean; data: DbAssetRow }> {
    const idx = this.store.assets.findIndex(a => a.assetId === assetId);
    if (idx < 0) {
      throw new Error(`Asset ${assetId} not found`);
    }
    if (companyId && this.store.assets[idx].organizationId !== companyId) {
      throw new Error('Unauthorized cross-company access');
    }
    const updated = {
      ...this.store.assets[idx],
      isArchived: archive,
      archivedAt: archive ? new Date().toISOString() : undefined,
      updatedAt: new Date().toISOString()
    };
    this.store.assets[idx] = updated;
    this.persistToDisk();

    this.logActivity('ASSET', assetId, archive ? 'ARCHIVE_ASSET' : 'RESTORE_ASSET', {
      title: updated.title
    });

    if (this.getGoogleSheetsUrl()) {
      await this.callAppsScript('UPDATE_ASSET', { asset: updated }).catch(e => {
        console.warn('[Autonoma DB] Sheets asset archive error:', e);
      });
    }

    return { success: true, data: updated };
  }

  public async batchArchiveAssets(assetIds: string[], archive: boolean = true, companyId?: string): Promise<{ success: boolean; count: number }> {
    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return { success: true, count: 0 };
    }
    const targetSet = new Set(assetIds);
    let count = 0;
    const timestamp = archive ? new Date().toISOString() : undefined;

    for (let i = 0; i < this.store.assets.length; i++) {
      if (targetSet.has(this.store.assets[i].assetId)) {
        if (companyId && this.store.assets[i].organizationId !== companyId) {
          continue;
        }
        this.store.assets[i] = {
          ...this.store.assets[i],
          isArchived: archive,
          archivedAt: timestamp,
          updatedAt: new Date().toISOString()
        };
        count++;
      }
    }
    this.persistToDisk();

    this.logActivity('ASSET', 'BATCH', archive ? 'BATCH_ARCHIVE_ASSETS' : 'BATCH_RESTORE_ASSETS', {
      count,
      assetIds
    });

    if (this.getGoogleSheetsUrl()) {
      const updatedRows = this.store.assets.filter(a => targetSet.has(a.assetId) && (!companyId || a.organizationId === companyId));
      this.callAppsScript('BATCH_SAVE_ASSETS', { assets: updatedRows }).catch(e => {
        console.warn('[Autonoma DB] Sheets batch archive error:', e);
      });
    }

    return { success: true, count };
  }

  public async deleteAssetPermanently(assetId: string, companyId?: string): Promise<{ success: boolean; deletedAssetId: string }> {
    const idx = this.store.assets.findIndex(a => a.assetId === assetId);
    if (idx < 0) {
      throw new Error(`Asset ${assetId} not found`);
    }
    if (companyId && this.store.assets[idx].organizationId !== companyId) {
      throw new Error('Unauthorized cross-company access');
    }
    const title = this.store.assets[idx].title;

    this.store.assets.splice(idx, 1);

    if (!this.store.deletedAssetIds) this.store.deletedAssetIds = [];
    if (!this.store.deletedAssetIds.includes(assetId)) {
      this.store.deletedAssetIds.push(assetId);
    }

    if (Array.isArray(this.store.publishing)) {
      this.store.publishing = this.store.publishing.filter(p => p.assetId !== assetId);
    }

    this.persistToDisk();

    this.logActivity('ASSET', assetId, 'PERMANENT_DELETE_ASSET', {
      title
    });

    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('DELETE_ASSET', { assetId }).catch(e => {
        console.warn('[Autonoma DB] Sheets delete asset error:', e);
      });
    }

    return { success: true, deletedAssetId: assetId };
  }

  public async batchDeleteAssetsPermanently(assetIds: string[], companyId?: string): Promise<{ success: boolean; count: number }> {
    if (!Array.isArray(assetIds) || assetIds.length === 0) {
      return { success: true, count: 0 };
    }
    const targetSet = new Set(assetIds);
    const beforeCount = this.store.assets.length;
    this.store.assets = this.store.assets.filter(a => {
      if (targetSet.has(a.assetId)) {
        if (companyId && a.organizationId !== companyId) {
          return true; // Don't delete another company's asset
        }
        return false;
      }
      return true;
    });
    const deletedCount = beforeCount - this.store.assets.length;

    if (!this.store.deletedAssetIds) this.store.deletedAssetIds = [];
    for (const aId of assetIds) {
      if (!this.store.deletedAssetIds.includes(aId)) {
        this.store.deletedAssetIds.push(aId);
      }
    }

    if (Array.isArray(this.store.publishing)) {
      this.store.publishing = this.store.publishing.filter(p => !targetSet.has(p.assetId));
    }

    this.persistToDisk();

    this.logActivity('ASSET', 'BATCH', 'BATCH_PERMANENT_DELETE_ASSETS', {
      count: deletedCount,
      assetIds
    });

    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('BATCH_DELETE_ASSETS', { assetIds }).catch(e => {
        console.warn('[Autonoma DB] Sheets batch delete error:', e);
      });
    }

    return { success: true, count: deletedCount };
  }

  // ==========================================
  // MEDIA API
  // ==========================================

  public async saveMediaRecord(media: DbMediaRow): Promise<{ success: boolean; data: DbMediaRow }> {
    const idx = this.store.media.findIndex(m => m.mediaId === media.mediaId);
    if (idx >= 0) {
      this.store.media[idx] = { ...this.store.media[idx], ...media };
    } else {
      this.store.media.unshift(media);
    }
    this.persistToDisk();

    this.logActivity('MEDIA', media.mediaId, idx >= 0 ? 'UPDATE_MEDIA' : 'CREATE_MEDIA', {
      type: media.type,
      model: media.model
    });

    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript(idx >= 0 ? 'UPDATE_MEDIA_RECORD' : 'CREATE_MEDIA_RECORD', { media }).catch(e => {});
    }

    return { success: true, data: media };
  }

  // ==========================================
  // PUBLISHING API
  // ==========================================

  public async savePublication(pub: DbPublishingRow): Promise<{ success: boolean; data: DbPublishingRow }> {
    const idx = this.store.publishing.findIndex(p => p.publicationId === pub.publicationId);
    if (idx >= 0) {
      this.store.publishing[idx] = { ...this.store.publishing[idx], ...pub };
    } else {
      this.store.publishing.unshift(pub);
    }
    this.persistToDisk();

    this.logActivity('PUBLISHING', pub.publicationId, idx >= 0 ? 'UPDATE_PUBLICATION' : 'CREATE_PUBLICATION', {
      platform: pub.platform,
      status: pub.status
    });

    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript(idx >= 0 ? 'UPDATE_PUBLICATION' : 'CREATE_PUBLICATION', { publication: pub }).catch(e => {});
    }

    return { success: true, data: pub };
  }

  // ==========================================
  // PERFORMANCE API
  // ==========================================

  public async upsertPerformance(perf: DbPerformanceRow): Promise<{ success: boolean; data: DbPerformanceRow }> {
    const idx = this.store.performance.findIndex(p => p.performanceId === perf.performanceId);
    if (idx >= 0) {
      this.store.performance[idx] = { ...this.store.performance[idx], ...perf };
    } else {
      this.store.performance.unshift(perf);
    }
    this.persistToDisk();

    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('UPSERT_PERFORMANCE', { performance: perf }).catch(e => {});
    }

    return { success: true, data: perf };
  }

  // ==========================================
  // DAILY SNAPSHOTS API
  // ==========================================

  public async createDailySnapshot(snap: DbDailySnapshotRow): Promise<{ success: boolean; data: DbDailySnapshotRow }> {
    const idx = this.store.dailySnapshots.findIndex(s => s.snapshotId === snap.snapshotId);
    if (idx >= 0) {
      this.store.dailySnapshots[idx] = { ...this.store.dailySnapshots[idx], ...snap };
    } else {
      this.store.dailySnapshots.unshift(snap);
    }
    this.persistToDisk();

    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('CREATE_DAILY_SNAPSHOT', { snapshot: snap }).catch(e => {});
    }

    return { success: true, data: snap };
  }

  // ==========================================
  // SETTINGS API
  // ==========================================

  public getSettings(): {
    settings: DbSettingsRow;
    googleSheetsUrl: string;
    hasSheetsConnection: boolean;
    sheetsSource: 'database' | 'server_secret' | 'default_production';
    isServerSecret: boolean;
  } {
    const resolvedUrl = this.resolveGoogleSheetsUrl();
    const stored = (this.store.googleSheetsUrl || '').trim();
    const envUrl = (
      process.env.AUTONOMA_SHEETS_WEBAPP_URL ||
      process.env.GOOGLE_APPS_SCRIPT_URL ||
      process.env.GOOGLE_SHEETS_WEBAPP_URL ||
      ''
    ).trim();

    let sheetsSource: 'database' | 'server_secret' | 'default_production' = 'default_production';
    if (stored && stored.endsWith('/exec')) {
      sheetsSource = 'database';
    } else if (envUrl && envUrl.endsWith('/exec')) {
      sheetsSource = 'server_secret';
    }

    const isServerSecret = sheetsSource === 'server_secret';

    return {
      settings: this.store.settings,
      googleSheetsUrl: isServerSecret ? 'https://script.google.com/macros/s/[CONFIGURED_VIA_SERVER_SECRET]/exec' : resolvedUrl,
      hasSheetsConnection: Boolean(resolvedUrl),
      sheetsSource,
      isServerSecret
    };
  }

  public async updateSettings(updates: Partial<DbSettingsRow>, sheetsUrl?: string): Promise<{ success: boolean; settings: DbSettingsRow }> {
    if (sheetsUrl !== undefined) {
      this.store.googleSheetsUrl = sheetsUrl.trim();
    }
    this.store.settings = {
      ...this.store.settings,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.persistToDisk();

    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('UPDATE_SETTINGS', { settings: this.store.settings }).catch(e => {});
    }

    return { success: true, settings: this.store.settings };
  }

  // ==========================================
  // ACTIVITY LOG & SYNC
  // ==========================================

  public logActivity(entityType: string, entityId: string, action: string, details: Record<string, any> = {}): void {
    const log: DbActivityLogRow = {
      logId: `LOG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      organizationId: DEFAULT_ORG_ID,
      entityType,
      entityId,
      action,
      source: 'AutonomaServer',
      timestamp: new Date().toISOString(),
      detailsJson: JSON.stringify(details)
    };

    this.store.activityLog.unshift(log);
    // Keep max 200 logs locally
    if (this.store.activityLog.length > 200) {
      this.store.activityLog = this.store.activityLog.slice(0, 200);
    }
    this.persistToDisk();

    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('WRITE_ACTIVITY_LOG', { log }).catch(e => {});
    }
  }

  public getActivityLog(): DbActivityLogRow[] {
    return this.store.activityLog;
  }

  /**
   * Initializes all 8 tables on the connected Google Sheet
  /**
   * Initializes all 8 tables on the connected Google Sheet
   */
  public async initGoogleSheet(targetUrl?: string): Promise<{ success: boolean; message: string; data?: any }> {
    if (targetUrl && typeof targetUrl === 'string' && targetUrl.trim()) {
      this.setGoogleSheetsUrl(targetUrl.trim());
    }
    const validation = this.validateGoogleSheetsUrl();
    if (!validation.valid) {
      return { success: false, message: validation.error || 'Google Sheets URL is missing.' };
    }

    const res = await this.callAppsScript('INIT_DATABASE', {});
    if (res.success) {
      // Also push all current campaigns & assets to seed the new spreadsheet
      await this.callAppsScript('BATCH_SAVE_ASSETS', { assets: this.store.assets });
      for (const camp of this.store.campaigns) {
        await this.callAppsScript('CREATE_CAMPAIGN', { campaign: camp });
      }
      await this.callAppsScript('UPDATE_SETTINGS', { settings: this.store.settings });
      return { success: true, message: 'Google Sheet initialized with all 8 tables and seeded with current assets & campaigns!', data: res.data };
    }
    return { success: false, message: res.error || 'Failed to initialize Google Sheet tables.' };
  }

  /**
   * Two-way sync: pushes authoritative server store to Google Sheet
   */
  public async syncWithGoogleSheets(): Promise<{ success: boolean; message: string; stats?: any }> {
    const validation = this.validateGoogleSheetsUrl();
    if (!validation.valid) {
      return { success: false, message: validation.error || 'Google Sheets Web App URL is not configured in Settings.' };
    }

    const testRes = await this.callAppsScript('PING', {});
    if (!testRes.success) {
      return { success: false, message: testRes.error || 'Could not connect to Google Apps Script Web App.' };
    }

    // Push local campaigns and assets to Google Sheet in batch
    const batchRes = await this.callAppsScript('BATCH_SAVE_ASSETS', { assets: this.store.assets });
    if (!batchRes.success) {
      return { success: false, message: `Batch assets sync failed: ${batchRes.error || 'Unknown error'}` };
    }

    for (const c of this.store.campaigns) {
      const campRes = await this.callAppsScript('CREATE_CAMPAIGN', { campaign: c });
      if (!campRes.success) {
        return { success: false, message: `Campaign sync failed for ${c.campaignId}: ${campRes.error || 'Unknown error'}` };
      }
    }

    this.store.lastSyncAt = new Date().toISOString();
    this.persistToDisk();

    return {
      success: true,
      message: `Successfully synchronized ${this.store.campaigns.length} campaigns and ${this.store.assets.length} assets with Google Sheets.`,
      stats: {
        campaigns: this.store.campaigns.length,
        assets: this.store.assets.length,
        syncedAt: this.store.lastSyncAt
      }
    };
  }

  public async ensureHydrated(): Promise<void> {
    if (this.hasHydrated) return;
    if (this.isHydrating) {
      await this.isHydrating;
      return;
    }
    this.isHydrating = this.hydrateFromGoogleSheets()
      .then((res) => {
        if (res.success) {
          this.hasHydrated = true;
        }
      })
      .finally(() => {
        this.isHydrating = null;
      });
    await this.isHydrating;
  }

  /**
   * Authoritative hydration from connected Google Sheets.
   * Reads CAMPAIGNS and ASSETS, replaces/hydrates the server operational store,
   * persists to disk cache, and returns counts.
   * Google Sheets wins over seed data.
   */
  public async hydrateFromGoogleSheets(): Promise<{
    success: boolean;
    campaigns: number;
    assets: number;
    error?: string;
  }> {
    const validation = this.validateGoogleSheetsUrl();
    if (!validation.valid) {
      return {
        success: false,
        campaigns: this.store.campaigns.length,
        assets: this.store.assets.length,
        error: validation.error || 'Google Sheets Web App URL not configured.'
      };
    }

    try {
      // 1. PING connection
      const pingRes = await this.callAppsScript('PING', {});
      if (!pingRes.success) {
        return {
          success: false,
          campaigns: this.store.campaigns.length,
          assets: this.store.assets.length,
          error: pingRes.error || 'Could not connect to Google Apps Script Web App.'
        };
      }

      // 2. Read CAMPAIGNS & ASSETS in parallel
      const [campaignsRes, assetsRes] = await Promise.all([
        this.callAppsScript<DbCampaignRow[]>('GET_CAMPAIGNS', {}),
        this.callAppsScript<DbAssetRow[]>('GET_ASSETS', {})
      ]);

      if (!campaignsRes.success || !Array.isArray(campaignsRes.data)) {
        return {
          success: false,
          campaigns: this.store.campaigns.length,
          assets: this.store.assets.length,
          error: campaignsRes.error || 'Failed to read campaigns from Google Sheets.'
        };
      }

      if (!assetsRes.success || !Array.isArray(assetsRes.data)) {
        return {
          success: false,
          campaigns: this.store.campaigns.length,
          assets: this.store.assets.length,
          error: assetsRes.error || 'Failed to read assets from Google Sheets.'
        };
      }

      const sheetCampaigns = campaignsRes.data;
      const sheetAssets = assetsRes.data;

      // Google Sheets wins over seed data, BUT local deletion tombstones always win
      // so permanently deleted records can never resurrect from Sheets.
      const delCampaignSet = new Set(this.store.deletedCampaignIds || []);
      const delAssetSet = new Set(this.store.deletedAssetIds || []);

      const validSheetCampaigns = sheetCampaigns.filter(c => !delCampaignSet.has(c.campaignId));
      const validSheetAssets = sheetAssets.filter(a => !delAssetSet.has(a.assetId));

      if (validSheetCampaigns.length > 0) {
        this.store.campaigns = validSheetCampaigns;
      }
      if (validSheetAssets.length > 0) {
        this.store.assets = validSheetAssets;
      }

      this.hasHydrated = true;
      this.store.lastSyncAt = new Date().toISOString();
      this.persistToDisk();

      console.log(
        `[Autonoma DB] Hydrated from Google Sheets: ${this.store.campaigns.length} campaigns, ${this.store.assets.length} assets.`
      );

      return {
        success: true,
        campaigns: this.store.campaigns.length,
        assets: this.store.assets.length
      };
    } catch (err: any) {
      console.warn('[Autonoma DB] Hydration from Google Sheets failed:', err?.message || err);
      return {
        success: false,
        campaigns: this.store.campaigns.length,
        assets: this.store.assets.length,
        error: err?.message || 'Error hydrating from Google Sheets'
      };
    }
  }

  /**
   * Atomic Campaign Commit Endpoint Implementation:
   * A. Validate campaign
   * B. Validate assets array
   * C. Upsert campaign into authoritative store
   * D. Upsert ALL assets into authoritative store
   * E. Write/upsert campaign to Google Sheets
   * F. Batch upsert assets to Google Sheets
   * G. Verify returned success
   * H. Only then return success to client
   */
  public async commitCampaign(
    campaignData: any,
    assetsData: any[],
    companyId?: string
  ): Promise<{
    campaign: Campaign;
    assetCount: number;
    persistence: { server: true; googleSheets: boolean; warning?: string };
  }> {
    // A. Validate campaign
    if (!campaignData || typeof campaignData !== 'object') {
      throw new Error('Invalid campaign: campaign payload is required.');
    }
    const campId = campaignData.id || campaignData.campaignId;
    if (!campId || typeof campId !== 'string') {
      throw new Error('Invalid campaign: missing campaign ID.');
    }
    if (!campaignData.name || typeof campaignData.name !== 'string') {
      throw new Error('Invalid campaign: missing campaign name.');
    }

    // B. Validate assets array
    if (!Array.isArray(assetsData)) {
      throw new Error('Invalid assets: assets payload must be an array.');
    }

    const campRow: DbCampaignRow = campaignData.campaignId
      ? { ...campaignData }
      : campaignToDbRow(campaignData, companyId);

    if (companyId) {
      campRow.organizationId = companyId;
    }

    const assetRows: DbAssetRow[] = assetsData.map((a: any) => {
      const row = a.assetId ? { ...a } : assetToDbRow(a, companyId);
      row.campaignId = campRow.campaignId;
      if (companyId) {
        row.organizationId = companyId;
      }
      if (!row.assetId) {
        throw new Error('Invalid asset: missing asset ID.');
      }
      return row;
    });

    // C. Upsert campaign into authoritative store
    const cIdx = this.store.campaigns.findIndex(c => c.campaignId === campRow.campaignId);
    if (cIdx >= 0) {
      this.store.campaigns[cIdx] = {
        ...this.store.campaigns[cIdx],
        ...campRow,
        updatedAt: new Date().toISOString()
      };
    } else {
      this.store.campaigns.unshift(campRow);
    }

    campRow.assetCount = assetRows.length;

    // D. Upsert ALL assets into authoritative store
    for (const aRow of assetRows) {
      const aIdx = this.store.assets.findIndex(a => a.assetId === aRow.assetId);
      if (aIdx >= 0) {
        this.store.assets[aIdx] = {
          ...this.store.assets[aIdx],
          ...aRow,
          updatedAt: new Date().toISOString()
        };
      } else {
        this.store.assets.unshift(aRow);
      }
    }

    // Persist to authoritative local disk
    this.persistToDisk();

    // Sync to Supabase durable storage
    supabaseStorage.upsertCampaign(campRow).catch(() => {});
    for (const aRow of assetRows) {
      supabaseStorage.upsertAsset(aRow).catch(() => {});
    }

    // Google Sheets is optional secondary durability. The server DB is authoritative,
    // so a disconnected/misconfigured sheet must never fail campaign creation.
    let googleSheetsSynced = false;
    let sheetsWarning: string | undefined;
    const validation = this.validateGoogleSheetsUrl();

    if (validation.valid) {
      try {
        const campSheetRes = await this.callAppsScript(
          cIdx >= 0 ? 'UPDATE_CAMPAIGN' : 'CREATE_CAMPAIGN',
          { campaign: campRow }
        );
        if (!campSheetRes.success) {
          throw new Error(campSheetRes.error || 'Campaign sheet write failed');
        }

        if (assetRows.length > 0) {
          const assetsSheetRes = await this.callAppsScript('BATCH_SAVE_ASSETS', { assets: assetRows });
          if (!assetsSheetRes.success) {
            throw new Error(assetsSheetRes.error || 'Assets sheet write failed');
          }
        }
        googleSheetsSynced = true;
      } catch (err: any) {
        sheetsWarning = err?.message || 'Google Sheets sync unavailable';
        console.warn('[PERSISTENCE] Campaign committed to server; Sheets sync pending:', sheetsWarning);
      }
    } else {
      sheetsWarning = validation.error || 'Google Sheets is not configured';
      console.warn('[PERSISTENCE] Campaign committed to server; Sheets sync skipped:', sheetsWarning);
    }

    console.log(
      `[PERSISTENCE] ${campRow.campaignId} committed: ${assetRows.length} assets, server=true, sheets=${googleSheetsSynced}`
    );

    this.logActivity('CAMPAIGN', campRow.campaignId, 'COMMIT_CAMPAIGN_AND_ASSETS', {
      assetCount: assetRows.length,
      serverPersistence: true,
      sheetsPersistence: googleSheetsSynced,
      sheetsWarning
    });

    // H. Only then return success to client
    return {
      campaign: dbRowToCampaign(campRow),
      assetCount: assetRows.length,
      persistence: {
        server: true,
        googleSheets: googleSheetsSynced,
        ...(sheetsWarning ? { warning: sheetsWarning } : {})
      }
    };
  }
}

export const autonomaDb = new AutonomaDatabaseManager();
