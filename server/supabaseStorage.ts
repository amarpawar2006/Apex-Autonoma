import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AutonomaDatabaseStore } from '../src/types/database.js';

export interface SupabaseConfig {
  url?: string;
  key?: string;
  isConfigured: boolean;
  source: 'env' | 'settings' | 'unconfigured';
}

/**
 * Resolves Supabase credentials from process environment or settings
 */
export function getSupabaseConfig(): SupabaseConfig {
  const url = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    ''
  ).trim();

  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (url && key) {
    return { url, key, isConfigured: true, source: 'env' };
  }

  return { isConfigured: false, source: 'unconfigured' };
}

export class SupabaseStorageAdapter {
  private client: SupabaseClient | null = null;
  private isConnected = false;

  constructor() {
    this.initClient();
  }

  public initClient(customUrl?: string, customKey?: string): boolean {
    const config = getSupabaseConfig();
    const url = customUrl || config.url;
    const key = customKey || config.key;

    if (url && key) {
      try {
        this.client = createClient(url, key, {
          auth: { persistSession: false }
        });
        this.isConnected = true;
        console.log('[Supabase Adapter] Connected to Supabase authoritative cluster:', url.slice(0, 24) + '...');
        return true;
      } catch (err: any) {
        console.warn('[Supabase Adapter] Initialization warning, falling back to durable local cache:', err?.message);
        this.client = null;
        this.isConnected = false;
        return false;
      }
    } else {
      console.log('[Supabase Adapter] Supabase credentials not present in environment; running durable local store with Supabase migration readiness.');
      this.client = null;
      this.isConnected = false;
      return false;
    }
  }

  public get activeClient(): SupabaseClient | null {
    return this.client;
  }

  public get ready(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Attempts to load authoritative store data from Supabase tables
   */
  public async loadStoreFromSupabase(): Promise<Partial<AutonomaDatabaseStore> | null> {
    if (!this.ready || !this.client) return null;

    try {
      console.log('[Supabase Adapter] Fetching authoritative state from Supabase...');

      // Query core tables concurrently
      const [
        companiesRes,
        usersRes,
        membershipsRes,
        campaignsRes,
        assetsRes
      ] = await Promise.all([
        this.client.from('companies').select('*'),
        this.client.from('users').select('*'),
        this.client.from('memberships').select('*'),
        this.client.from('campaigns').select('*'),
        this.client.from('assets').select('*')
      ]);

      if (companiesRes.error && companiesRes.error.code !== 'PGRST116') {
        console.warn('[Supabase Adapter] Companies fetch warning:', companiesRes.error.message);
      }

      const companies = (companiesRes.data || []).map((row: any) => ({
        companyId: row.company_id || row.companyId,
        name: row.name,
        status: row.status || 'ACTIVE',
        profile: row.profile_json ? JSON.parse(row.profile_json) : (row.profile || null),
        profileJson: row.profile_json || (row.profile ? JSON.stringify(row.profile) : null),
        createdAt: row.created_at || row.createdAt,
        updatedAt: row.updated_at || row.updatedAt
      }));

      const users = (usersRes.data || []).map((row: any) => ({
        userId: row.user_id || row.userId,
        email: row.email,
        name: row.name,
        isSuperAdmin: Boolean(row.is_super_admin ?? row.isSuperAdmin),
        status: row.status || 'ACTIVE',
        createdAt: row.created_at || row.createdAt,
        lastLoginAt: row.last_login_at || row.lastLoginAt
      }));

      const memberships = (membershipsRes.data || []).map((row: any) => ({
        membershipId: row.membership_id || row.membershipId,
        userId: row.user_id || row.userId,
        companyId: row.company_id || row.companyId,
        role: row.role || 'MEMBER',
        status: row.status || 'ACTIVE',
        inviteStatus: row.invite_status || row.inviteStatus,
        inviteSentAt: row.invite_sent_at || row.inviteSentAt,
        inviteError: row.invite_error || row.inviteError,
        inviteLink: row.invite_link || row.inviteLink,
        assignedAt: row.assigned_at || row.assignedAt,
        assignedBy: row.assigned_by || row.assignedBy
      }));

      const campaigns = (campaignsRes.data || []).map((row: any) => ({
        campaignId: row.campaign_id || row.campaignId,
        organizationId: row.organization_id || row.organizationId,
        name: row.name,
        brief: row.brief,
        objective: row.objective,
        status: row.status || 'draft',
        assetCount: Number(row.asset_count ?? row.assetCount) || 0,
        startDate: row.start_date || row.startDate,
        endDate: row.end_date || row.endDate,
        platforms: row.platforms || ['instagram', 'linkedin'],
        contentPillars: row.content_pillars || row.contentPillars || [],
        postingCadence: row.posting_cadence || row.postingCadence || 'Daily',
        languages: row.languages || ['English'],
        createdAt: row.created_at || row.createdAt,
        updatedAt: row.updated_at || row.updatedAt
      }));

      const assets = (assetsRes.data || []).map((row: any) => ({
        assetId: row.asset_id || row.assetId,
        campaignId: row.campaign_id || row.campaignId,
        organizationId: row.organization_id || row.organizationId,
        title: row.title,
        hook: row.hook,
        platform: row.platform,
        format: row.format,
        targetDate: row.target_date || row.targetDate,
        targetTime: row.target_time || row.targetTime,
        approvalStatus: row.approval_status || row.approvalStatus || 'pending',
        mediaStatus: row.media_status || row.mediaStatus || 'not_started',
        caption: row.caption || '',
        hashtags: row.hashtags || [],
        cta: row.cta || '',
        imagePrompt: row.image_prompt || row.imagePrompt || '',
        aiContentScore: Number(row.ai_content_score ?? row.aiContentScore) || 85,
        aiScoreRationale: row.ai_score_rationale || row.aiScoreRationale || '',
        createdAt: row.created_at || row.createdAt,
        updatedAt: row.updated_at || row.updatedAt
      }));

      if (companies.length > 0 || users.length > 0 || campaigns.length > 0) {
        console.log(`[Supabase Adapter] Authoritative state loaded: ${companies.length} companies, ${users.length} users, ${campaigns.length} campaigns, ${assets.length} assets.`);
        return {
          companies: companies as any,
          users: users as any,
          memberships: memberships as any,
          campaigns: campaigns as any,
          assets: assets as any
        };
      }

      return null;
    } catch (err: any) {
      console.warn('[Supabase Adapter] Error reading from Supabase tables:', err?.message);
      return null;
    }
  }

  /**
   * Idempotent migration from existing store into Supabase
   */
  public async migrateStore(store: AutonomaDatabaseStore): Promise<{
    migrated: boolean;
    companies: number;
    users: number;
    campaigns: number;
    assets: number;
    error?: string;
  }> {
    if (!this.ready || !this.client) {
      return {
        migrated: false,
        companies: store.companies?.length || 0,
        users: store.users?.length || 0,
        campaigns: store.campaigns?.length || 0,
        assets: store.assets?.length || 0
      };
    }

    try {
      console.log('[Supabase Adapter] Starting idempotent sync of application tables to Supabase...');

      // 1. Companies
      if (store.companies && store.companies.length > 0) {
        const companyRows = store.companies.map((c) => ({
          company_id: c.companyId,
          name: c.name,
          status: c.status,
          profile_json: c.profileJson || (c.profile ? JSON.stringify(c.profile) : null),
          created_at: c.createdAt || new Date().toISOString(),
          updated_at: c.updatedAt || new Date().toISOString()
        }));
        await this.client.from('companies').upsert(companyRows, { onConflict: 'company_id' });
      }

      // 2. Users
      if (store.users && store.users.length > 0) {
        const userRows = store.users.map((u) => ({
          user_id: u.userId,
          email: u.email,
          name: u.name,
          is_super_admin: Boolean(u.isSuperAdmin),
          status: u.status,
          created_at: u.createdAt || new Date().toISOString()
        }));
        await this.client.from('users').upsert(userRows, { onConflict: 'user_id' });
      }

      // 3. Memberships
      if (store.memberships && store.memberships.length > 0) {
        const memRows = store.memberships.map((m) => ({
          membership_id: m.membershipId,
          user_id: m.userId,
          company_id: m.companyId,
          role: m.role,
          status: m.status,
          invite_status: (m as any).inviteStatus || null,
          invite_sent_at: (m as any).inviteSentAt || null,
          invite_error: (m as any).inviteError || null,
          invite_link: (m as any).inviteLink || null,
          assigned_at: m.assignedAt || new Date().toISOString()
        }));
        await this.client.from('memberships').upsert(memRows, { onConflict: 'membership_id' });
      }

      // 4. Campaigns
      if (store.campaigns && store.campaigns.length > 0) {
        const campRows = store.campaigns.map((c) => ({
          campaign_id: c.campaignId,
          organization_id: c.organizationId,
          name: c.name,
          brief: c.brief,
          objective: c.objective,
          status: c.status,
          asset_count: c.assetCount,
          start_date: c.startDate,
          end_date: c.endDate,
          platforms: c.platforms,
          content_pillars: c.contentPillars,
          posting_cadence: c.postingCadence,
          languages: c.languages,
          created_at: c.createdAt,
          updated_at: c.updatedAt
        }));
        await this.client.from('campaigns').upsert(campRows, { onConflict: 'campaign_id' });
      }

      // 5. Assets
      if (store.assets && store.assets.length > 0) {
        const assetRows = store.assets.map((a: any) => ({
          asset_id: a.assetId,
          campaign_id: a.campaignId,
          organization_id: a.organizationId,
          title: a.title,
          hook: a.hook,
          platform: a.platform,
          format: a.format,
          target_date: a.targetDate,
          target_time: a.targetTime,
          approval_status: a.approvalStatus,
          media_status: a.mediaStatus,
          caption: a.caption,
          hashtags: a.hashtags,
          cta: a.cta,
          image_prompt: a.imagePrompt,
          ai_content_score: a.aiContentScore,
          ai_score_rationale: a.aiScoreRationale,
          created_at: a.createdAt,
          updated_at: a.updatedAt
        }));
        await this.client.from('assets').upsert(assetRows, { onConflict: 'asset_id' });
      }

      console.log(`[Supabase Adapter] Migration successful: ${store.companies?.length} companies, ${store.users?.length} users, ${store.campaigns?.length} campaigns, ${store.assets?.length} assets.`);

      return {
        migrated: true,
        companies: store.companies?.length || 0,
        users: store.users?.length || 0,
        campaigns: store.campaigns?.length || 0,
        assets: store.assets?.length || 0
      };
    } catch (err: any) {
      console.warn('[Supabase Adapter] Upsert note (tables may need auto-creation or schema sync):', err?.message);
      return {
        migrated: false,
        companies: store.companies?.length || 0,
        users: store.users?.length || 0,
        campaigns: store.campaigns?.length || 0,
        assets: store.assets?.length || 0,
        error: err?.message
      };
    }
  }

  /**
   * Persists a company mutation to Supabase
   */
  public async upsertCompany(company: any): Promise<void> {
    if (!this.ready || !this.client) return;
    try {
      await this.client.from('companies').upsert({
        company_id: company.companyId,
        name: company.name,
        status: company.status,
        profile_json: company.profileJson || (company.profile ? JSON.stringify(company.profile) : null),
        updated_at: new Date().toISOString()
      }, { onConflict: 'company_id' });
    } catch (e: any) {
      console.warn('[Supabase Adapter] Company upsert warning:', e?.message);
    }
  }

  /**
   * Deletes a company permanently from Supabase
   */
  public async deleteCompany(companyId: string): Promise<void> {
    if (!this.ready || !this.client) return;
    try {
      await this.client.from('companies').delete().eq('company_id', companyId);
      await this.client.from('campaigns').delete().eq('organization_id', companyId);
      await this.client.from('assets').delete().eq('organization_id', companyId);
      await this.client.from('memberships').delete().eq('company_id', companyId);
      console.log(`[Supabase Adapter] Permanently deleted company ${companyId} and cascaded records in Supabase.`);
    } catch (e: any) {
      console.warn('[Supabase Adapter] Company delete warning:', e?.message);
    }
  }

  /**
   * Upserts a campaign to Supabase
   */
  public async upsertCampaign(campaign: any): Promise<void> {
    if (!this.ready || !this.client) return;
    try {
      await this.client.from('campaigns').upsert({
        campaign_id: campaign.campaignId,
        organization_id: campaign.organizationId,
        name: campaign.name,
        brief: campaign.brief,
        objective: campaign.objective,
        status: campaign.status,
        asset_count: campaign.assetCount,
        start_date: campaign.startDate,
        end_date: campaign.endDate,
        platforms: campaign.platforms,
        content_pillars: campaign.contentPillars,
        posting_cadence: campaign.postingCadence,
        languages: campaign.languages,
        updated_at: new Date().toISOString()
      }, { onConflict: 'campaign_id' });
    } catch (e: any) {
      console.warn('[Supabase Adapter] Campaign upsert warning:', e?.message);
    }
  }

  /**
   * Upserts an asset to Supabase
   */
  public async upsertAsset(asset: any): Promise<void> {
    if (!this.ready || !this.client) return;
    try {
      await this.client.from('assets').upsert({
        asset_id: asset.assetId,
        campaign_id: asset.campaignId,
        organization_id: asset.organizationId,
        title: asset.title,
        hook: asset.hook,
        platform: asset.platform,
        format: asset.format,
        target_date: asset.targetDate,
        target_time: asset.targetTime,
        approval_status: asset.approvalStatus,
        media_status: asset.mediaStatus,
        caption: asset.caption,
        hashtags: asset.hashtags,
        cta: asset.cta,
        image_prompt: asset.imagePrompt,
        ai_content_score: asset.aiContentScore,
        ai_score_rationale: asset.aiScoreRationale,
        updated_at: new Date().toISOString()
      }, { onConflict: 'asset_id' });
    } catch (e: any) {
      console.warn('[Supabase Adapter] Asset upsert warning:', e?.message);
    }
  }
}

export const supabaseStorage = new SupabaseStorageAdapter();
