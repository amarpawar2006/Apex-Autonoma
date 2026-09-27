import fs from 'fs';
import path from 'path';
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
  AppsScriptResponse
} from '../src/types/database.js';
import { INITIAL_CAMPAIGNS, INITIAL_MONTH_ASSETS } from '../src/data/initialCampaigns.js';
import { Campaign, SocialAsset } from '../src/types/campaign.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE_PATH = path.resolve(__dirname, '..', 'data', 'autonoma-database.json');

const DEFAULT_ORG_ID = 'org_apex_pune';
export const DEFAULT_PRODUCTION_SHEETS_URL =
  'https://script.google.com/macros/s/AKfycbyyTzei9wvOAWbDrFeaGhk2fFkwsWVgBqK-zcFdAQH_dMKVKAQE2wLSIjvdqZHGct5m/exec';

/**
 * Maps a rich frontend Campaign object to the flat Google Sheets DbCampaignRow
 */
export function campaignToDbRow(c: Campaign): DbCampaignRow {
  return {
    campaignId: c.id,
    organizationId: DEFAULT_ORG_ID,
    name: c.name,
    brief: c.brief,
    objective: c.objective,
    status: c.status,
    startDate: c.startDate,
    endDate: c.endDate,
    platforms: JSON.stringify(c.platforms || []),
    duration: c.strategy?.formatMix?.join(', ') || '7_days',
    audience: c.strategy?.targetAudience || '',
    marketInsight: c.strategy?.coreInsight || '',
    valueProposition: c.strategy?.valueProposition || '',
    contentPillars: JSON.stringify(c.strategy?.contentPillars || []),
    postingCadence: c.strategy?.recommendedPostingSchedule || '',
    createdAt: c.createdAt || new Date().toISOString(),
    updatedAt: c.updatedAt || new Date().toISOString()
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

  return {
    id: row.campaignId,
    campaignCode: row.campaignId.startsWith('CMP-') ? row.campaignId : `CMP-${row.campaignId.toUpperCase()}`,
    name: row.name,
    brief: row.brief,
    objective: row.objective,
    status: (row.status as any) || 'ACTIVE',
    platforms,
    formats: ['carousel', 'reel_short', 'static_poster'],
    languages: ['English', 'Auto'],
    startDate: row.startDate,
    endDate: row.endDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    assetCount: 0,
    strategy: {
      targetAudience: row.audience,
      coreInsight: row.marketInsight,
      valueProposition: row.valueProposition,
      contentPillars,
      recommendedPostingSchedule: row.postingCadence
    }
  };
}

/**
 * Maps a rich SocialAsset object to flat DbAssetRow
 */
export function assetToDbRow(a: SocialAsset): DbAssetRow {
  return {
    assetId: a.id,
    campaignId: a.campaignId || 'cmp-q1-manifesto',
    organizationId: DEFAULT_ORG_ID,
    title: a.title,
    hook: a.hook,
    strategicPurpose: a.strategicPurpose || 'Operational Education',
    angle: a.angle || '',
    platform: a.platform,
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
    format: (row.format?.toLowerCase() as any) || 'carousel',
    stream: (row.contentStream as any) || 'commerce_operations',
    speciesCode: (row.speciesCode as any) || 'SPEC-01_PROBLEM_FIRST',
    status: (row.approvalStatus as any) || 'draft',
    productionStatus: (row.mediaStatus as any) || 'NOT_GENERATED',
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
  const campaigns = INITIAL_CAMPAIGNS.map(campaignToDbRow);
  const assets = INITIAL_MONTH_ASSETS.map(assetToDbRow);

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

  return {
    version: '1.0.0',
    organizationId: DEFAULT_ORG_ID,
    lastSyncAt: null,
    googleSheetsUrl: process.env.GOOGLE_APPS_SCRIPT_URL || process.env.GOOGLE_SHEETS_WEBAPP_URL || '',
    campaigns,
    assets,
    media: [],
    publishing: [],
    performance: [],
    dailySnapshots: [],
    settings: defaultSettings,
    activityLog: [initialLog]
  };
}

export class AutonomaDatabaseManager {
  private store: AutonomaDatabaseStore;
  private hasHydrated = false;
  private isHydrating: Promise<any> | null = null;

  constructor() {
    this.store = this.loadFromDisk();
  }

  private loadFromDisk(): AutonomaDatabaseStore {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.campaigns) && Array.isArray(parsed.assets)) {
          // If env has a sheets URL and store doesn't, apply env var
          const envUrl = process.env.GOOGLE_APPS_SCRIPT_URL || process.env.GOOGLE_SHEETS_WEBAPP_URL;
          if (envUrl && !parsed.googleSheetsUrl) {
            parsed.googleSheetsUrl = envUrl;
          }
          // Ensure seeded baseline assets are not missing
          if (parsed.assets.length === 0) {
            parsed.assets = INITIAL_MONTH_ASSETS.map(assetToDbRow);
          }
          if (parsed.campaigns.length === 0) {
            parsed.campaigns = INITIAL_CAMPAIGNS.map(campaignToDbRow);
          }
          console.log(`[Autonoma DB] Loaded ${parsed.campaigns.length} campaigns and ${parsed.assets.length} assets from disk.`);
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
  const dir = path.dirname(DB_FILE_PATH);

  try {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      DB_FILE_PATH,
      JSON.stringify(data, null, 2),
      'utf-8'
    );
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
    // 1. Explicit persisted server setting, if available and valid
    const stored = (this.store.googleSheetsUrl || '').trim().replace(/\/+$/, '');
    if (stored && stored.endsWith('/exec')) {
      return stored;
    }

    // 2. Environment variable fallback
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

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload }),
        redirect: 'follow'
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
      // Do not log sensitive URLs or secrets
      console.warn(`[Autonoma DB] Apps Script action ${action} failed:`, err?.message || err);
      return {
        success: false,
        error: err?.message || 'Failed to reach Google Apps Script Web App',
        code: 'NETWORK_ERROR'
      };
    }
  }

  // ==========================================
  // CAMPAIGNS API
  // ==========================================

  public getCampaigns(): DbCampaignRow[] {
    return this.store.campaigns;
  }

  public getCampaign(campaignId: string): DbCampaignRow | null {
    return this.store.campaigns.find(c => c.campaignId === campaignId) || null;
  }

  public async saveCampaign(campaign: DbCampaignRow): Promise<{ success: boolean; data: DbCampaignRow }> {
    const idx = this.store.campaigns.findIndex(c => c.campaignId === campaign.campaignId);
    if (idx >= 0) {
      this.store.campaigns[idx] = { ...this.store.campaigns[idx], ...campaign, updatedAt: new Date().toISOString() };
    } else {
      this.store.campaigns.unshift({ ...campaign, createdAt: campaign.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.persistToDisk();

    // Log Activity
    this.logActivity('CAMPAIGN', campaign.campaignId, idx >= 0 ? 'UPDATE_CAMPAIGN' : 'CREATE_CAMPAIGN', {
      name: campaign.name,
      status: campaign.status
    });

// Write-through to Google Sheets when connected.
// Do not report full persistence success if Sheets rejects the record.
if (this.getGoogleSheetsUrl()) {
  const sheetsResult = await this.callAppsScript(
    idx >= 0 ? 'UPDATE_CAMPAIGN' : 'CREATE_CAMPAIGN',
    { campaign }
  );

  if (!sheetsResult.success) {
    throw new Error(
      `Campaign saved locally but Google Sheets write failed: ${
        sheetsResult.error || 'Unknown Google Sheets error'
      }`
    );
  }
}

    return { success: true, data: campaign };
  }

  // ==========================================
  // ASSETS API
  // ==========================================

  public getAssets(campaignId?: string): DbAssetRow[] {
    if (campaignId && campaignId !== 'all') {
      return this.store.assets.filter(a => a.campaignId === campaignId);
    }
    return this.store.assets;
  }

  public getAsset(assetId: string): DbAssetRow | null {
    return this.store.assets.find(a => a.assetId === assetId) || null;
  }

  public async saveAsset(asset: DbAssetRow): Promise<{ success: boolean; data: DbAssetRow }> {
    const idx = this.store.assets.findIndex(a => a.assetId === asset.assetId);
    if (idx >= 0) {
      this.store.assets[idx] = { ...this.store.assets[idx], ...asset, updatedAt: new Date().toISOString() };
    } else {
      this.store.assets.unshift({ ...asset, createdAt: asset.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.persistToDisk();

    // Log Activity
    this.logActivity('ASSET', asset.assetId, idx >= 0 ? 'UPDATE_ASSET' : 'CREATE_ASSET', {
      title: asset.title,
      platform: asset.platform,
      format: asset.format
    });

    // Write-through to Google Sheets when connected
    if (this.getGoogleSheetsUrl()) {
      const sheetsResult = await this.callAppsScript(idx >= 0 ? 'UPDATE_ASSET' : 'CREATE_ASSET', { asset });
      if (!sheetsResult.success) {
        throw new Error(
          `Asset saved locally but Google Sheets write failed: ${
            sheetsResult.error || 'Unknown Google Sheets error'
          }`
        );
      }
    }

    return { success: true, data: asset };
  }

  public async batchSaveAssets(assets: DbAssetRow[]): Promise<{ success: boolean; count: number }> {
    if (!assets || assets.length === 0) return { success: true, count: 0 };

    for (const newAsset of assets) {
      const idx = this.store.assets.findIndex(a => a.assetId === newAsset.assetId);
      if (idx >= 0) {
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

  // Write-through batch to Google Sheets when connected.
if (this.getGoogleSheetsUrl()) {
  const sheetsResult = await this.callAppsScript(
    'BATCH_SAVE_ASSETS',
    { assets }
  );

  if (!sheetsResult.success) {
    throw new Error(
      `Assets saved locally but Google Sheets batch write failed: ${
        sheetsResult.error || 'Unknown Google Sheets error'
      }`
    );
  }
}

    return { success: true, count: assets.length };
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

  public getSettings(): { settings: DbSettingsRow; googleSheetsUrl: string; hasSheetsConnection: boolean } {
    const resolvedUrl = this.resolveGoogleSheetsUrl();
    return {
      settings: this.store.settings,
      googleSheetsUrl: resolvedUrl,
      hasSheetsConnection: Boolean(resolvedUrl)
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

      // Google Sheets wins over seed data.
      // Seed data is ONLY fallback when Sheet is genuinely empty or unconfigured.
      if (sheetCampaigns.length > 0) {
        this.store.campaigns = sheetCampaigns;
      }
      if (sheetAssets.length > 0) {
        this.store.assets = sheetAssets;
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
    assetsData: any[]
  ): Promise<{
    campaign: Campaign;
    assetCount: number;
    persistence: { server: true; googleSheets: true };
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
      ? campaignData
      : campaignToDbRow(campaignData);

    const assetRows: DbAssetRow[] = assetsData.map((a: any) => {
      const row = a.assetId ? a : assetToDbRow(a);
      row.campaignId = campRow.campaignId;
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

    // Verify Google Sheets configuration
    const validation = this.validateGoogleSheetsUrl();
    if (!validation.valid) {
      throw new Error(`Google Sheets write-through failed: ${validation.error}`);
    }

    // E. Write/upsert campaign to Google Sheets
    const campSheetRes = await this.callAppsScript(
      cIdx >= 0 ? 'UPDATE_CAMPAIGN' : 'CREATE_CAMPAIGN',
      { campaign: campRow }
    );
    if (!campSheetRes.success) {
      throw new Error(
        `Campaign saved locally but Google Sheets write failed: ${
          campSheetRes.error || 'Unknown Google Sheets error'
        }`
      );
    }

    // F. Batch upsert assets to Google Sheets
    if (assetRows.length > 0) {
      const assetsSheetRes = await this.callAppsScript('BATCH_SAVE_ASSETS', {
        assets: assetRows
      });
      if (!assetsSheetRes.success) {
        throw new Error(
          `Assets saved locally but Google Sheets batch write failed: ${
            assetsSheetRes.error || 'Unknown Google Sheets error'
          }`
        );
      }
    }

    // G. Verify returned success & small persistence health log (no sensitive credentials)
    console.log(
      `[PERSISTENCE] ${campRow.campaignId} committed: ${assetRows.length} assets, server=true, sheets=true`
    );

    this.logActivity('CAMPAIGN', campRow.campaignId, 'COMMIT_CAMPAIGN_AND_ASSETS', {
      assetCount: assetRows.length,
      serverPersistence: true,
      sheetsPersistence: true
    });

    // H. Only then return success to client
    return {
      campaign: dbRowToCampaign(campRow),
      assetCount: assetRows.length,
      persistence: {
        server: true,
        googleSheets: true
      }
    };
  }
}

export const autonomaDb = new AutonomaDatabaseManager();
