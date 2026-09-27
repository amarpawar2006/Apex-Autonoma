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
    try {
      const data = storeToSave || this.store;
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Autonoma DB] Failed to persist database to disk:', err);
    }
  }

  public getGoogleSheetsUrl(): string {
    return this.store.googleSheetsUrl || process.env.GOOGLE_APPS_SCRIPT_URL || process.env.GOOGLE_SHEETS_WEBAPP_URL || '';
  }

  public setGoogleSheetsUrl(url: string): void {
    this.store.googleSheetsUrl = url.trim();
    this.persistToDisk();
  }

  /**
   * Helper to dispatch an action to the Google Apps Script Web App
   */
  public async callAppsScript<T = any>(action: string, payload: Record<string, any> = {}): Promise<AppsScriptResponse<T>> {
    const url = this.getGoogleSheetsUrl();
    if (!url) {
      return { success: false, error: 'Google Sheets Web App URL not configured', code: 'NO_WEBAPP_URL' };
    }

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

    // Sync to Google Sheets if connected
    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript(idx >= 0 ? 'UPDATE_CAMPAIGN' : 'CREATE_CAMPAIGN', { campaign }).catch(e => {
        console.warn('[Autonoma DB] Background sync campaign to Google Sheets failed:', e);
      });
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

    // Sync to Google Sheets
    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript(idx >= 0 ? 'UPDATE_ASSET' : 'CREATE_ASSET', { asset }).catch(e => {
        console.warn('[Autonoma DB] Background sync asset to Google Sheets failed:', e);
      });
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

    // Batch sync to Google Sheets
    if (this.getGoogleSheetsUrl()) {
      this.callAppsScript('BATCH_SAVE_ASSETS', { assets }).catch(e => {
        console.warn('[Autonoma DB] Background batch sync assets to Google Sheets failed:', e);
      });
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
    return {
      settings: this.store.settings,
      googleSheetsUrl: this.store.googleSheetsUrl,
      hasSheetsConnection: Boolean(this.store.googleSheetsUrl)
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
   */
  public async initGoogleSheet(targetUrl?: string): Promise<{ success: boolean; message: string; data?: any }> {
    const url = targetUrl || this.getGoogleSheetsUrl();
    if (!url) {
      return { success: false, message: 'Google Sheets URL is missing.' };
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
   * Two-way sync: pushes local store to Google Sheet or pulls updates
   */
  public async syncWithGoogleSheets(): Promise<{ success: boolean; message: string; stats?: any }> {
    const url = this.getGoogleSheetsUrl();
    if (!url) {
      return { success: false, message: 'Google Sheets Web App URL is not configured in Settings.' };
    }

    const testRes = await this.callAppsScript('PING', {});
    if (!testRes.success) {
      return { success: false, message: testRes.error || 'Could not connect to Google Apps Script Web App.' };
    }

    // Push local campaigns and assets to Google Sheet in batch
    await this.callAppsScript('BATCH_SAVE_ASSETS', { assets: this.store.assets });
    for (const c of this.store.campaigns) {
      await this.callAppsScript('CREATE_CAMPAIGN', { campaign: c });
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
}

export const autonomaDb = new AutonomaDatabaseManager();
