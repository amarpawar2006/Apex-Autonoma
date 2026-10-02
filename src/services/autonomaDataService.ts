import { Campaign, SocialAsset } from '../types/campaign';
import { INITIAL_CAMPAIGNS, SEED_ASSETS } from '../data/initialCampaigns';
import { User, Company, Membership, ApprovalRequest, AuthSessionResponse, UserRole, CompanyProfile, CompanyUnderstoodSummary, InferredCompanyProfile } from '../types/auth';

const STORAGE_KEY_CAMPAIGNS = 'apex_autonoma_campaigns_v2';
const STORAGE_KEY_ASSETS = 'apex_autonoma_assets_v2';
const STORAGE_KEY_ACTIVE_CAMPAIGN = 'apex_autonoma_active_campaign_filter';
const STORAGE_KEY_SHEETS_URL = 'apex_autonoma_sheets_url';
export const STORAGE_KEY_SESSION = 'autonoma_session_token';

export function getAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = { ...additionalHeaders };
  try {
    const token = localStorage.getItem(STORAGE_KEY_SESSION);
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch {}
  return headers;
}

class AutonomaDataService {
  getSessionToken(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY_SESSION);
    } catch {
      return null;
    }
  }

  setSessionToken(token: string | null): void {
    try {
      if (token) {
        localStorage.setItem(STORAGE_KEY_SESSION, token);
      } else {
        localStorage.removeItem(STORAGE_KEY_SESSION);
      }
    } catch {}
  }

  public getAuthHeaders(additionalHeaders: Record<string, string> = {}): Record<string, string> {
    return getAuthHeaders(additionalHeaders);
  }

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const headers = this.getAuthHeaders((options.headers as Record<string, string>) || {});
    return fetch(url, { ...options, headers });
  }

  /**
   * Loads all campaigns from server-side durable database,
   * with fallback to localStorage.
   */
  async loadCampaigns(): Promise<Campaign[]> {
    try {
      const res = await this.fetchWithAuth('/api/autonoma/campaigns');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const serverCampaigns: Campaign[] = json.data;
          try {
            localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(serverCampaigns));
          } catch {}
          return serverCampaigns;
        }
      } else if (res.status === 401 || res.status === 403) {
        // Access forbidden or session expired: never return unpermitted campaigns
        return [];
      }
    } catch (err) {
      console.warn('[AutonomaDataService] Network fetch failed, falling back to local cache:', err);
    }

    // Fallback to localStorage cache
    try {
      const local = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
      if (local) {
        const parsed = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}

    return INITIAL_CAMPAIGNS;
  }

  /**
   * Loads a single campaign by ID
   */
  async loadCampaign(id: string): Promise<Campaign | null> {
    try {
      const res = await this.fetchWithAuth(`/api/autonoma/campaigns/${encodeURIComponent(id)}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) return json.data;
      }
    } catch (err) {
      console.warn(`[AutonomaDataService] Failed to load campaign ${id}:`, err);
    }

    const all = await this.loadCampaigns();
    return all.find(c => c.id === id) || null;
  }

  /**
   * Persists a campaign to server-side durable database and Google Sheets
   */
  async saveCampaign(campaign: Campaign): Promise<Campaign> {
    try {
      const res = await this.fetchWithAuth('/api/autonoma/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaign)
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success || !json?.data) {
        throw new Error(
          json?.error ||
          `Campaign persistence failed with HTTP ${res.status}`
        );
      }

      this.updateLocalCampaignCache(json.data);
      return json.data;
    } catch (err: any) {
      console.error('[AutonomaDataService] AUTHORITATIVE campaign save failed:', err);
      throw new Error(
        err?.message ||
        'Campaign could not be saved to the operational database.'
      );
    }
  }

  /**
   * Atomically commits a campaign and all its assets to the authoritative server database
   * and Google Sheets write-through. Throws on any failure.
   */
  async commitCampaign(campaign: Campaign, assets: SocialAsset[]): Promise<{
    campaign: Campaign;
    assets: SocialAsset[];
    assetCount: number;
    persistence: { server: boolean; googleSheets: boolean };
  }> {
    if (!campaign) {
      throw new Error('Campaign object is required.');
    }
    if (!Array.isArray(assets)) {
      throw new Error('Assets array is required.');
    }

    try {
      const res = await this.fetchWithAuth('/api/autonoma/campaigns/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaign, assets })
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        throw new Error(
          json?.error ||
          `Atomic campaign commit failed with HTTP ${res.status}`
        );
      }

      const confirmedCampaign: Campaign = json.campaign || campaign;
      const confirmedAssets: SocialAsset[] = assets;

      this.updateLocalCampaignCache(confirmedCampaign);
      this.prependLocalAssetsCache(confirmedAssets);

      return {
        campaign: confirmedCampaign,
        assets: confirmedAssets,
        assetCount: json.assetCount ?? confirmedAssets.length,
        persistence: json.persistence || { server: true, googleSheets: true }
      };
    } catch (err: any) {
      console.error('[AutonomaDataService] Commit failed:', err);
      throw new Error(
        err?.message || 'Campaign commit to authoritative database failed.'
      );
    }
  }

  /**
   * Updates an existing campaign
   */
  async updateCampaign(
    campaignId: string,
    updates: Partial<Campaign>
  ): Promise<Campaign> {
    try {
      const res = await this.fetchWithAuth(
        `/api/autonoma/campaigns/${encodeURIComponent(campaignId)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates)
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success || !json?.data) {
        throw new Error(
          json?.error ||
          `Campaign update failed with HTTP ${res.status}`
        );
      }

      this.updateLocalCampaignCache(json.data);
      return json.data;
    } catch (err: any) {
      console.error(
        `[AutonomaDataService] AUTHORITATIVE update failed for ${campaignId}:`,
        err
      );
      throw new Error(
        err?.message ||
        `Campaign ${campaignId} could not be updated in the operational database.`
      );
    }
  }

  /**
   * Archives a campaign in the operational database
   */
  async archiveCampaign(campaignId: string): Promise<Campaign> {
    try {
      const res = await this.fetchWithAuth(`/api/autonoma/campaigns/${encodeURIComponent(campaignId)}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json?.data) {
        throw new Error(json?.error || `Failed to archive campaign ${campaignId}`);
      }
      this.updateLocalCampaignCache(json.data);
      return json.data;
    } catch (err: any) {
      console.error(`[AutonomaDataService] Archive campaign failed for ${campaignId}:`, err);
      throw new Error(err?.message || `Could not archive campaign ${campaignId}`);
    }
  }

  /**
   * Restores an archived campaign
   */
  async restoreCampaign(campaignId: string): Promise<Campaign> {
    try {
      const res = await this.fetchWithAuth(`/api/autonoma/campaigns/${encodeURIComponent(campaignId)}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json?.data) {
        throw new Error(json?.error || `Failed to restore campaign ${campaignId}`);
      }
      this.updateLocalCampaignCache(json.data);
      return json.data;
    } catch (err: any) {
      console.error(`[AutonomaDataService] Restore campaign failed for ${campaignId}:`, err);
      throw new Error(err?.message || `Could not restore campaign ${campaignId}`);
    }
  }

  /**
   * Permanently deletes a campaign and its associated assets
   */
  async deleteCampaignPermanently(campaignId: string): Promise<{
    success: boolean;
    deletedCampaignId: string;
    deletedAssetCount: number;
  }> {
    try {
      const res = await this.fetchWithAuth(`/api/autonoma/campaigns/${encodeURIComponent(campaignId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Failed to permanently delete campaign ${campaignId}`);
      }
      this.removeCampaignFromLocalCache(campaignId);
      return json;
    } catch (err: any) {
      console.error(`[AutonomaDataService] Permanent delete failed for campaign ${campaignId}:`, err);
      throw new Error(err?.message || `Could not permanently delete campaign ${campaignId}`);
    }
  }

  /**
   * Loads all assets, optionally filtered by campaignId
   */
  async loadAssets(campaignId?: string): Promise<SocialAsset[]> {
    try {
      const query = campaignId && campaignId !== 'all' ? `?campaignId=${encodeURIComponent(campaignId)}` : '';
      const res = await this.fetchWithAuth(`/api/autonoma/assets${query}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const serverAssets: SocialAsset[] = json.data;
          try {
            if (!campaignId || campaignId === 'all') {
              localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(serverAssets));
            }
          } catch {}
          if (campaignId && campaignId !== 'all') {
            return serverAssets.filter(a => a.campaignId === campaignId);
          }
          return serverAssets;
        }
      } else if (res.status === 401 || res.status === 403) {
        return [];
      }
    } catch (err) {
      console.warn('[AutonomaDataService] Network assets fetch failed, falling back to local cache:', err);
    }

    // Fallback to local storage
    try {
      const local = localStorage.getItem(STORAGE_KEY_ASSETS);
      if (local) {
        const parsed: SocialAsset[] = JSON.parse(local);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (campaignId && campaignId !== 'all') {
            return parsed.filter(a => a.campaignId === campaignId);
          }
          return parsed;
        }
      }
    } catch {}

    if (campaignId && campaignId !== 'all') {
      return SEED_ASSETS.filter(a => a.campaignId === campaignId);
    }
    return SEED_ASSETS;
  }

  /**
   * Loads assets for a specific campaign
   */
  async loadAssetsByCampaign(campaignId: string): Promise<SocialAsset[]> {
    return this.loadAssets(campaignId);
  }

  /**
   * Persists a batch of assets (used by Campaign Director after synthesis)
   */
  async saveAssetsBatch(assets: SocialAsset[]): Promise<{ count: number }> {
    if (!Array.isArray(assets) || assets.length === 0) {
      return { count: 0 };
    }

    try {
      const res = await this.fetchWithAuth('/api/autonoma/assets/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assets })
      });

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success) {
        throw new Error(
          json?.error ||
          `Asset batch persistence failed with HTTP ${res.status}`
        );
      }

      const persistedCount = Number(json.count ?? 0);

      if (persistedCount !== assets.length) {
        throw new Error(
          `Database persisted ${persistedCount} of ${assets.length} assets.`
        );
      }

      this.prependLocalAssetsCache(assets);
      return { count: persistedCount };
    } catch (err: any) {
      console.error('[AutonomaDataService] AUTHORITATIVE asset batch save failed:', err);
      throw new Error(
        err?.message ||
        'Campaign assets could not be saved to the operational database.'
      );
    }
  }

  /**
   * Updates a single asset (e.g. status changes, generated media)
   */
  async updateAsset(asset: SocialAsset): Promise<SocialAsset> {
    try {
      const res = await this.fetchWithAuth(
        `/api/autonoma/assets/${encodeURIComponent(asset.id)}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(asset)
        }
      );

      const json = await res.json().catch(() => null);

      if (!res.ok || !json?.success || !json?.data) {
        throw new Error(
          json?.error ||
          `Asset update failed with HTTP ${res.status}`
        );
      }

      this.updateLocalAssetCache(json.data);
      return json.data;
    } catch (err: any) {
      console.error(
        `[AutonomaDataService] AUTHORITATIVE asset update failed for ${asset.id}:`,
        err
      );
      throw new Error(
        err?.message ||
        `Asset ${asset.id} could not be updated in the operational database.`
      );
    }
  }

  /**
   * Archives a single asset
   */
  async archiveAsset(assetId: string): Promise<SocialAsset> {
    try {
      const res = await this.fetchWithAuth(`/api/autonoma/assets/${encodeURIComponent(assetId)}/archive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json?.data) {
        throw new Error(json?.error || `Failed to archive asset ${assetId}`);
      }
      this.updateLocalAssetCache(json.data);
      return json.data;
    } catch (err: any) {
      console.error(`[AutonomaDataService] Archive asset failed for ${assetId}:`, err);
      throw new Error(err?.message || `Could not archive asset ${assetId}`);
    }
  }

  /**
   * Restores an archived asset
   */
  async restoreAsset(assetId: string): Promise<SocialAsset> {
    try {
      const res = await this.fetchWithAuth(`/api/autonoma/assets/${encodeURIComponent(assetId)}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success || !json?.data) {
        throw new Error(json?.error || `Failed to restore asset ${assetId}`);
      }
      this.updateLocalAssetCache(json.data);
      return json.data;
    } catch (err: any) {
      console.error(`[AutonomaDataService] Restore asset failed for ${assetId}:`, err);
      throw new Error(err?.message || `Could not restore asset ${assetId}`);
    }
  }

  /**
   * Batch archives or restores multiple assets
   */
  async batchArchiveAssets(assetIds: string[], archive: boolean = true): Promise<{ count: number }> {
    try {
      const res = await this.fetchWithAuth('/api/autonoma/assets/archive-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds, archive })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to batch archive assets');
      }
      try {
        const raw = localStorage.getItem(STORAGE_KEY_ASSETS);
        if (raw) {
          const list: SocialAsset[] = JSON.parse(raw);
          const targetSet = new Set(assetIds);
          const timestamp = archive ? new Date().toISOString() : undefined;
          const updated = list.map(a => targetSet.has(a.id) ? { ...a, isArchived: archive, archivedAt: timestamp } : a);
          localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(updated));
        }
      } catch {}
      return { count: json.count ?? assetIds.length };
    } catch (err: any) {
      console.error('[AutonomaDataService] Batch archive failed:', err);
      throw new Error(err?.message || 'Could not batch archive assets');
    }
  }

  /**
   * Permanently deletes a single asset
   */
  async deleteAssetPermanently(assetId: string): Promise<{ success: boolean; deletedAssetId: string }> {
    try {
      const res = await this.fetchWithAuth(`/api/autonoma/assets/${encodeURIComponent(assetId)}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || `Failed to permanently delete asset ${assetId}`);
      }
      this.removeAssetFromLocalCache(assetId);
      return json;
    } catch (err: any) {
      console.error(`[AutonomaDataService] Permanent delete failed for asset ${assetId}:`, err);
      throw new Error(err?.message || `Could not permanently delete asset ${assetId}`);
    }
  }

  /**
   * Permanently deletes multiple assets
   */
  async batchDeleteAssetsPermanently(assetIds: string[]): Promise<{ count: number }> {
    try {
      const res = await this.fetchWithAuth('/api/autonoma/assets/delete-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds })
      });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error(json?.error || 'Failed to permanently delete assets');
      }
      this.removeAssetsFromLocalCache(assetIds);
      return { count: json.count ?? assetIds.length };
    } catch (err: any) {
      console.error('[AutonomaDataService] Batch permanent delete failed:', err);
      throw new Error(err?.message || 'Could not permanently delete assets');
    }
  }

  /**
   * Saves a media generation record
   */
  async saveMediaRecord(media: any): Promise<any> {
    try {
      const res = await this.fetchWithAuth('/api/autonoma/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(media)
      });
      return await res.json();
    } catch (err) {
      console.warn('[AutonomaDataService] saveMediaRecord error:', err);
      return { success: false };
    }
  }

  /**
   * Saves a publication record
   */
  async savePublication(publication: any): Promise<any> {
    try {
      const res = await this.fetchWithAuth('/api/autonoma/publishing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(publication)
      });
      return await res.json();
    } catch (err) {
      console.warn('[AutonomaDataService] savePublication error:', err);
      return { success: false };
    }
  }

  /**
   * Saves performance telemetry
   */
  async savePerformance(performance: any): Promise<any> {
    try {
      const res = await this.fetchWithAuth('/api/autonoma/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(performance)
      });
      return await res.json();
    } catch (err) {
      console.warn('[AutonomaDataService] savePerformance error:', err);
      return { success: false };
    }
  }

  /**
   * Saves a daily snapshot
   */
  async saveSnapshot(snapshot: any): Promise<any> {
    try {
      const res = await this.fetchWithAuth('/api/autonoma/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot)
      });
      return await res.json();
    } catch (err) {
      console.warn('[AutonomaDataService] saveSnapshot error:', err);
      return { success: false };
    }
  }

  /**
   * Loads Settings & Google Sheets Web App connection status
   */
  async loadSettings(): Promise<{ settings: any; googleSheetsUrl: string; hasSheetsConnection: boolean }> {
    try {
      const res = await this.fetchWithAuth('/api/autonoma/settings');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.googleSheetsUrl) {
            try {
              localStorage.setItem(STORAGE_KEY_SHEETS_URL, json.data.googleSheetsUrl);
            } catch {}
          }
          return json.data;
        }
      }
    } catch (err) {
      console.warn('[AutonomaDataService] Failed to load settings from server:', err);
    }

    const localUrl = localStorage.getItem(STORAGE_KEY_SHEETS_URL) || '';
    return {
      settings: {},
      googleSheetsUrl: localUrl,
      hasSheetsConnection: Boolean(localUrl)
    };
  }

  /**
   * Updates Settings & Google Sheets URL
   */
  async updateSettings(settings: any, googleSheetsUrl?: string): Promise<any> {
    if (googleSheetsUrl !== undefined) {
      try {
        localStorage.setItem(STORAGE_KEY_SHEETS_URL, googleSheetsUrl);
      } catch {}
    }
    try {
      const res = await this.fetchWithAuth('/api/autonoma/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings, googleSheetsUrl })
      });
      return await res.json();
    } catch (err) {
      console.warn('[AutonomaDataService] Failed to update settings on server:', err);
      return { success: false };
    }
  }

  /**
   * Tests connection to Google Sheets Web App
   */
  async testGoogleSheetsConnection(url?: string): Promise<{ success: boolean; latencyMs?: number; message: string; details?: any }> {
    try {
      const res = await fetch('/api/autonoma/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Network error reaching server connection tester'
      };
    }
  }

  /**
   * Initializes all 8 tables in Google Sheet and seeds baseline records
   */
  async initGoogleSheet(url?: string): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const res = await fetch('/api/autonoma/init-sheet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Network error triggering sheet initialization'
      };
    }
  }

  /**
   * Triggers synchronization between authoritative server store and Google Sheets
   */
  async syncGoogleSheets(): Promise<{ success: boolean; message: string; stats?: any }> {
    try {
      const res = await fetch('/api/autonoma/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      return await res.json();
    } catch (err: any) {
      return {
        success: false,
        message: err?.message || 'Network error triggering sync'
      };
    }
  }

  /**
   * Explicitly triggers authoritative hydration from Google Sheets into the server store
   */
  async refreshFromGoogleSheets(): Promise<{ success: boolean; campaigns: number; assets: number; error?: string }> {
    try {
      const res = await fetch('/api/autonoma/refresh-from-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const json = await res.json();
      return json;
    } catch (err: any) {
      return {
        success: false,
        campaigns: 0,
        assets: 0,
        error: err?.message || 'Failed to trigger refresh from Google Sheets'
      };
    }
  }

  /**
   * Loads recent activity logs
   */
  async loadActivityLogs(): Promise<any[]> {
    try {
      const res = await fetch('/api/autonoma/activity');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) return json.data;
      }
    } catch {}
    return [];
  }

  /**
   * Performs an operational health check on the database and Google Sheets connection
   */
  async checkHealth(): Promise<{
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
    try {
      const res = await fetch('/api/autonoma/health');
      if (res.ok) {
        return await res.json();
      }
      return {
        success: false,
        database: 'ready',
        googleSheets: {
          configured: false,
          connected: false,
          error: `Health check returned HTTP ${res.status}`,
          checkedAt: new Date().toISOString()
        }
      };
    } catch (err: any) {
      return {
        success: false,
        database: 'ready',
        googleSheets: {
          configured: false,
          connected: false,
          error: err?.message || 'Network error reaching health endpoint',
          checkedAt: new Date().toISOString()
        }
      };
    }
  }

  // ==========================================
  // Local storage cache synchronization helpers
  // ==========================================

  private updateLocalCampaignCache(campaign: Campaign): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
      const list: Campaign[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(c => c.id === campaign.id);
      if (idx >= 0) {
        list[idx] = campaign;
      } else {
        list.unshift(campaign);
      }
      localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(list));
    } catch {}
  }

  private updateLocalAssetCache(asset: SocialAsset): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ASSETS);
      const list: SocialAsset[] = raw ? JSON.parse(raw) : [];
      const idx = list.findIndex(a => a.id === asset.id);
      if (idx >= 0) {
        list[idx] = asset;
      } else {
        list.unshift(asset);
      }
      localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(list));
    } catch {}
  }

  private prependLocalAssetsCache(newAssets: SocialAsset[]): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ASSETS);
      const list: SocialAsset[] = raw ? JSON.parse(raw) : [];
      const newIds = new Set(newAssets.map(a => a.id));
      const filtered = list.filter(a => !newIds.has(a.id));
      const combined = [...newAssets, ...filtered];
      localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(combined));
    } catch {}
  }

  private removeCampaignFromLocalCache(campaignId: string): void {
    try {
      // 1. Remove campaign
      const rawC = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
      if (rawC) {
        const list: Campaign[] = JSON.parse(rawC);
        const filtered = list.filter(c => c.id !== campaignId);
        localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(filtered));
      }
      // 2. Remove associated child assets from asset cache as well
      const rawA = localStorage.getItem(STORAGE_KEY_ASSETS);
      if (rawA) {
        const aList: SocialAsset[] = JSON.parse(rawA);
        const filteredA = aList.filter(a => a.campaignId !== campaignId);
        localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(filteredA));
      }
    } catch {}
  }

  private removeAssetFromLocalCache(assetId: string): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ASSETS);
      if (raw) {
        const list: SocialAsset[] = JSON.parse(raw);
        const filtered = list.filter(a => a.id !== assetId);
        localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(filtered));
      }
    } catch {}
  }

  private removeAssetsFromLocalCache(assetIds: string[]): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ASSETS);
      if (raw) {
        const list: SocialAsset[] = JSON.parse(raw);
        const targetSet = new Set(assetIds);
        const filtered = list.filter(a => !targetSet.has(a.id));
        localStorage.setItem(STORAGE_KEY_ASSETS, JSON.stringify(filtered));
      }
    } catch {}
  }

  // ==========================================
  // AUTHENTICATION & MULTI-COMPANY API
  // ==========================================

  async loginWithGoogle(credential: string, proposedCompanyName?: string): Promise<AuthSessionResponse> {
    const res = await fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, proposedCompanyName })
    });
    const json = await res.json();
    if (json.success && json.token) {
      this.setSessionToken(json.token);
    }
    return json;
  }

  async fixtureLogin(payload: {
    email: string;
    name?: string;
    role?: 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MEMBER';
    companyId?: string;
    isSuperAdmin?: boolean;
    status?: 'ACTIVE' | 'SUSPENDED';
  }): Promise<AuthSessionResponse> {
    const res = await fetch('/api/auth/fixture-login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-autonoma-test-key': 'fixture-auth-verified'
      },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success && json.token) {
      this.setSessionToken(json.token);
    }
    return json;
  }

  async getCurrentSession(): Promise<AuthSessionResponse> {
    const token = this.getSessionToken();
    if (!token) {
      return { success: false, error: 'No active session' };
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: this.getAuthHeaders()
      });
      if (!res.ok) {
        if (res.status === 401) {
          this.setSessionToken(null);
        }
        const errJson = await res.json().catch(() => null);
        return { success: false, error: errJson?.message || 'Session expired' };
      }
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to check session' };
    }
  }

  async switchCompany(companyId: string): Promise<{ success: boolean; activeCompany?: Company; role?: UserRole; error?: string }> {
    try {
      const res = await fetch('/api/auth/switch-company', {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ companyId })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to switch company' };
    }
  }

  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: this.getAuthHeaders()
      });
    } catch {}
    this.setSessionToken(null);
  }

  async submitAccessRequest(proposedCompanyName: string): Promise<{ success: boolean; data?: ApprovalRequest; error?: string }> {
    try {
      const res = await fetch('/api/auth/submit-request', {
        method: 'POST',
        headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ proposedCompanyName })
      });
      return await res.json();
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to submit request' };
    }
  }

  // Super Admin workspace methods
  async getAdminRequests(): Promise<ApprovalRequest[]> {
    const res = await fetch('/api/admin/requests', { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || [];
  }

  async approveRequest(
    requestId: string,
    targetCompanyId: string,
    role: 'COMPANY_ADMIN' | 'MEMBER',
    newCompanyName?: string
  ): Promise<any> {
    const res = await fetch(`/api/admin/requests/${encodeURIComponent(requestId)}/approve`, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ targetCompanyId, role, newCompanyName })
    });
    return await res.json();
  }

  async rejectRequest(requestId: string): Promise<any> {
    const res = await fetch(`/api/admin/requests/${encodeURIComponent(requestId)}/reject`, {
      method: 'POST',
      headers: this.getAuthHeaders()
    });
    return await res.json();
  }

  async getAdminCompanies(): Promise<Company[]> {
    const res = await fetch('/api/admin/companies', { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || [];
  }

  async createAdminCompany(name: string): Promise<Company> {
    const res = await fetch('/api/admin/companies', {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create company');
    return json.data;
  }

  async updateAdminCompany(companyId: string, updates: Partial<Company>): Promise<Company> {
    const res = await fetch(`/api/admin/companies/${encodeURIComponent(companyId)}`, {
      method: 'PUT',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update company');
    return json.data;
  }


  async deleteAdminCompany(companyId: string): Promise<{ success: boolean; deletedCampaigns?: number; deletedAssets?: number; deletedMemberships?: number }> {
    const res = await fetch(`/api/admin/companies/${encodeURIComponent(companyId)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete company');
    return json;
  }

  async getAdminUsers(): Promise<User[]> {
    const res = await fetch('/api/admin/users', { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || [];
  }

  async suspendUser(userId: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<any> {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/suspend`, {
      method: 'PUT',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ status })
    });
    return await res.json();
  }


  async deleteAdminUser(userId: string): Promise<{ success: boolean; deletedMemberships?: number }> {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to delete user');
    return json;
  }

  // Company Admin workspace methods
  async getCompanyMembers(): Promise<Membership[]> {
    const res = await fetch('/api/company/members', { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return json.data || [];
  }

  async addCompanyMember(email: string, name: string, role: 'COMPANY_ADMIN' | 'MEMBER'): Promise<Membership> {
    const res = await fetch('/api/company/members', {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ email, name, role })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to add member');
    return json.data;
  }

  async updateCompanyMemberRole(membershipId: string, role: 'COMPANY_ADMIN' | 'MEMBER'): Promise<Membership> {
    const res = await fetch(`/api/company/members/${encodeURIComponent(membershipId)}`, {
      method: 'PUT',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ role })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update member');
    return json.data;
  }

  async removeCompanyMember(membershipId: string): Promise<void> {
    const res = await fetch(`/api/company/members/${encodeURIComponent(membershipId)}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders()
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to remove member');
  }

  async resendMemberInvite(membershipId: string): Promise<{ success: boolean; data: Membership; emailDelivery: any }> {
    const res = await fetch(`/api/company/members/${encodeURIComponent(membershipId)}/resend-invite`, {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to resend invitation email');
    return json;
  }

  async analyzeBrandPdf(file: File): Promise<{
    success: boolean;
    suggestions: any;
    extractedSummary?: string;
    pageCount?: number;
    rawTextSnippet?: string;
  }> {
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const res = await fetch('/api/company/analyze-brand-pdf', {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ pdfBase64: base64 })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to analyze brand guidelines PDF');
    return json;
  }

  async getAiProviders(): Promise<{
    success: boolean;
    aiProviders: any;
    emailConfig: any;
  }> {
    const res = await fetch('/api/ai/providers', { headers: this.getAuthHeaders() });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load AI provider settings');
    return json;
  }

  async updateAiProviders(updates: { aiProviders?: any; emailConfig?: any; googleDrive?: any }): Promise<any> {
    const res = await fetch('/api/ai/providers', {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(updates)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to save provider settings');
    return json;
  }

  async testAiProvider(providerId: string, apiKey?: string): Promise<{
    success: boolean;
    provider: string;
    message: string;
    latencyMs?: number;
  }> {
    const res = await fetch('/api/ai/providers/test', {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ providerId, apiKey })
    });
    const json = await res.json();
    return json;
  }

  async testEmailDelivery(targetEmail?: string, config?: any): Promise<{
    success: boolean;
    provider: string;
    message: string;
    latencyMs?: number;
  }> {
    const res = await fetch('/api/email/test', {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ targetEmail, config })
    });
    const json = await res.json();
    return json;
  }

  async updateCompanySettings(name: string): Promise<Company> {
    const res = await fetch('/api/company/settings', {
      method: 'PUT',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update company settings');
    return json.data;
  }

  async getCompanyProfile(): Promise<{ company: Company; profile: CompanyProfile }> {
    const res = await fetch('/api/company/profile', { headers: this.getAuthHeaders() });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch company profile');
    return json.data;
  }

  async updateCompanyProfile(name: string, profile: Partial<CompanyProfile>): Promise<Company> {
    const res = await fetch('/api/company/profile', {
      method: 'PUT',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name, profile })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update company profile');
    return json.data;
  }

  async improveCompanyDescription(params: {
    currentDescription: string;
    organizationType?: string;
    offerings?: string;
    audience?: string;
  }): Promise<{ original: string; improved: string }> {
    const res = await fetch('/api/company/improve-description', {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(params)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to improve company description');
    return json;
  }

  async analyzeCompanyWebsite(params: {
    websiteUrl?: string;
    pastedText?: string;
  }): Promise<{
    summary: CompanyUnderstoodSummary;
    inferredProfile?: InferredCompanyProfile;
    profile?: CompanyProfile;
    company?: Company;
    brandSuggestions?: {
      primaryColor?: string;
      secondaryColor?: string;
      headingFont?: string;
      visualTone?: string;
    };
    message?: string;
  }> {
    const res = await fetch('/api/company/analyze-website', {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(params)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || json.message || 'Failed to analyze website');
    return json;
  }

  async retryCampaignGeneration(campaignId: string): Promise<{ campaign: Campaign; assets: SocialAsset[] }> {
    const res = await this.fetchWithAuth('/api/campaign/retry-synthesis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignId })
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || !json?.success) {
      throw new Error(json?.error || json?.message || 'Campaign synthesis retry failed');
    }
    this.updateLocalCampaignCache(json.campaign);
    return {
      campaign: json.campaign,
      assets: json.assets || []
    };
  }

  async confirmCompanyContext(summary: Partial<CompanyUnderstoodSummary>): Promise<{
    success: boolean;
    data: Company;
    confirmedContext: CompanyUnderstoodSummary;
  }> {
    const res = await fetch('/api/company/confirm-context', {
      method: 'POST',
      headers: this.getAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ summary })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to confirm company context');
    return json;
  }
}

export const autonomaDataService = new AutonomaDataService();
