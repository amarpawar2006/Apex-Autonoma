import { Campaign, SocialAsset } from '../types/campaign';
import { INITIAL_CAMPAIGNS, SEED_ASSETS } from '../data/initialCampaigns';

const STORAGE_KEY_CAMPAIGNS = 'apex_autonoma_campaigns_v2';
const STORAGE_KEY_ASSETS = 'apex_autonoma_assets_v2';
const STORAGE_KEY_ACTIVE_CAMPAIGN = 'apex_autonoma_active_campaign_filter';
const STORAGE_KEY_SHEETS_URL = 'apex_autonoma_sheets_url';

class AutonomaDataService {
  /**
   * Loads all campaigns from server-side durable database,
   * with fallback to localStorage and initial seed campaigns.
   */
  async loadCampaigns(): Promise<Campaign[]> {
    try {
      const res = await fetch('/api/autonoma/campaigns');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          const serverCampaigns: Campaign[] = json.data;
          try {
            localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(serverCampaigns));
          } catch {}
          return serverCampaigns;
        }
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
      const res = await fetch(`/api/autonoma/campaigns/${encodeURIComponent(id)}`);
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
    const res = await fetch('/api/autonoma/campaigns', {
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

    // Cache ONLY after authoritative server persistence succeeds.
    this.updateLocalCampaignCache(json.data);

    return json.data;
  } catch (err: any) {
    console.error(
      '[AutonomaDataService] AUTHORITATIVE campaign save failed:',
      err
    );

    // CRITICAL:
    // Never convert a failed DB write into a fake successful local save.
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
      const res = await fetch('/api/autonoma/campaigns/commit', {
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

      // Update local cache ONLY AFTER authoritative commit succeeds
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
    const res = await fetch(
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
   * Loads all assets, optionally filtered by campaignId
   */
  async loadAssets(campaignId?: string): Promise<SocialAsset[]> {
    try {
      const query = campaignId && campaignId !== 'all' ? `?campaignId=${encodeURIComponent(campaignId)}` : '';
      const res = await fetch(`/api/autonoma/assets${query}`);
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
    const res = await fetch('/api/autonoma/assets/batch', {
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

    // Cache ONLY after authoritative persistence succeeds.
    this.prependLocalAssetsCache(assets);

    return { count: persistedCount };
  } catch (err: any) {
    console.error(
      '[AutonomaDataService] AUTHORITATIVE asset batch save failed:',
      err
    );

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
    const res = await fetch(
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
   * Saves a media generation record
   */
  async saveMediaRecord(media: any): Promise<any> {
    try {
      const res = await fetch('/api/autonoma/media', {
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
      const res = await fetch('/api/autonoma/publishing', {
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
      const res = await fetch('/api/autonoma/performance', {
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
      const res = await fetch('/api/autonoma/snapshot', {
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
      const res = await fetch('/api/autonoma/settings');
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
      const res = await fetch('/api/autonoma/settings', {
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
}

export const autonomaDataService = new AutonomaDataService();
