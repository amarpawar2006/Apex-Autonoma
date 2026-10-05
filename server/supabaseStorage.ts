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
        assetsRes,
        mediaRes,
        settingsRes,
        approvalRequestsRes,
        sessionsRes
      ] = await Promise.all([
        this.client.from('companies').select('*'),
        this.client.from('users').select('*'),
        this.client.from('memberships').select('*'),
        this.client.from('campaigns').select('*'),
        this.client.from('assets').select('*'),
        this.client.from('media').select('*'),
        this.client.from('settings').select('*').order('updated_at', { ascending: false }).limit(1),
        this.client.from('approval_requests').select('*'),
        this.client.from('sessions').select('*')
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
        platforms: row.platforms || row.platforms_json || '[]',
        duration: row.duration || '',
        audience: row.audience || '',
        marketInsight: row.market_insight || row.marketInsight || '',
        valueProposition: row.value_proposition || row.valueProposition || '',
        contentPillars: row.content_pillars || row.contentPillars || [],
        postingCadence: row.posting_cadence || row.postingCadence || '',
        languages: row.languages || '[]',
        targetLanguage: row.target_language || row.targetLanguage || '',
        platformsJson: row.platforms_json || row.platformsJson || row.platforms || '[]',
        customLanguage: row.custom_language || row.customLanguage || '',
        customPlatform: row.custom_platform || row.customPlatform || '',
        languageStyle: row.language_style || row.languageStyle || '',
        generationStatus: row.generation_status || row.generationStatus || '',
        lastGenerationError: row.last_generation_error || row.lastGenerationError || '',
        lastGenerationAttemptAt: row.last_generation_attempt_at || row.lastGenerationAttemptAt || '',
        generationOptionsJson: row.generation_options_json || row.generationOptionsJson || '',
        archivedAt: row.archived_at || row.archivedAt || undefined,
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
        generatedImageUrl: row.generated_image_url || row.generatedImageUrl || '',
        generatedVideoUrl: row.generated_video_url || row.generatedVideoUrl || '',
        carouselVisualsJson: row.carousel_visuals_json || row.carouselVisualsJson || '',
        productionError: row.production_error || row.productionError || '',
        videoOperationName: row.video_operation_name || row.videoOperationName || '',
        targetBuyerPersona: row.target_buyer_persona || row.targetBuyerPersona || '',
        targetReach: Number(row.target_reach ?? row.targetReach) || 0,
        estimatedImpressions: Number(row.estimated_impressions ?? row.estimatedImpressions) || 0,
        expectedLeads: Number(row.expected_leads ?? row.expectedLeads) || 0,
        aiContentScore: Number(row.ai_content_score ?? row.aiContentScore) || 85,
        aiScoreRationale: row.ai_score_rationale || row.aiScoreRationale || '',
        createdAt: row.created_at || row.createdAt,
        updatedAt: row.updated_at || row.updatedAt
      }));

      const media = (mediaRes.data || []).map((row: any) => ({
        mediaId: row.media_id || row.mediaId,
        assetId: row.asset_id || row.assetId,
        campaignId: row.campaign_id || row.campaignId,
        type: row.type,
        model: row.model || '',
        prompt: row.prompt || '',
        version: row.version || '1',
        fileUrl: row.file_url || row.fileUrl || '',
        thumbnailUrl: row.thumbnail_url || row.thumbnailUrl || '',
        generationStatus: row.generation_status || row.generationStatus || '',
        approvalStatus: row.approval_status || row.approvalStatus || '',
        createdAt: row.created_at || row.createdAt
      }));


      const approvalRequests = (approvalRequestsRes.data || []).map((row: any) => ({
        requestId: row.request_id || row.requestId,
        email: row.email,
        name: row.name,
        proposedCompanyName: row.proposed_company_name || row.proposedCompanyName,
        status: row.status,
        requestedAt: row.requested_at || row.requestedAt,
        resolvedAt: row.resolved_at || row.resolvedAt,
        resolvedBy: row.resolved_by || row.resolvedBy,
        assignedCompanyId: row.assigned_company_id || row.assignedCompanyId,
        assignedRole: row.assigned_role || row.assignedRole
      }));

      const sessions = (sessionsRes.data || []).map((row: any) => ({
        sessionToken: row.session_token || row.sessionToken,
        userId: row.user_id || row.userId,
        activeCompanyId: row.active_company_id || row.activeCompanyId,
        createdAt: row.created_at || row.createdAt,
        expiresAt: row.expires_at || row.expiresAt
      })).filter((s: any) => s.expiresAt && new Date(s.expiresAt).getTime() > Date.now());

      const settingsRow: any = (settingsRes.data || [])[0];
      const settings = settingsRow ? {
        organizationId: settingsRow.organization_id || settingsRow.organizationId,
        organizationName: settingsRow.organization_name || settingsRow.organizationName || '',
        brandName: settingsRow.brand_name || settingsRow.brandName || '',
        website: settingsRow.website || '',
        timezone: settingsRow.timezone || 'Asia/Kolkata',
        defaultPlatforms: settingsRow.default_platforms || settingsRow.defaultPlatforms || '[]',
        brandConfigJson: settingsRow.brand_config_json || settingsRow.brandConfigJson || '{}',
        aiProvidersJson: settingsRow.ai_providers_json || settingsRow.aiProvidersJson || '',
        emailConfigJson: settingsRow.email_config_json || settingsRow.emailConfigJson || '',
        updatedAt: settingsRow.updated_at || settingsRow.updatedAt || new Date().toISOString()
      } : undefined;

      if (companies.length > 0 || users.length > 0 || campaigns.length > 0) {
        console.log(`[Supabase Adapter] Authoritative state loaded: ${companies.length} companies, ${users.length} users, ${memberships.length} memberships, ${campaigns.length} campaigns, ${assets.length} assets, ${media.length} media records, ${approvalRequests.length} approval requests, ${sessions.length} active sessions.`);
        return {
          companies: companies as any,
          users: users as any,
          memberships: memberships as any,
          campaigns: campaigns as any,
          assets: assets as any,
          media: media as any,
          approvalRequests: approvalRequests as any,
          sessions: sessions as any,
          ...(settings ? { settings: settings as any } : {})
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
          duration: c.duration,
          audience: c.audience,
          market_insight: c.marketInsight,
          value_proposition: c.valueProposition,
          content_pillars: c.contentPillars,
          posting_cadence: c.postingCadence,
          languages: c.languages,
          target_language: c.targetLanguage,
          platforms_json: c.platformsJson,
          custom_language: c.customLanguage,
          custom_platform: c.customPlatform,
          language_style: c.languageStyle,
          generation_status: c.generationStatus,
          last_generation_error: c.lastGenerationError,
          last_generation_attempt_at: c.lastGenerationAttemptAt,
          generation_options_json: c.generationOptionsJson,
          archived_at: c.archivedAt,
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
          generated_image_url: a.generatedImageUrl || null,
          generated_video_url: a.generatedVideoUrl || null,
          carousel_visuals_json: a.carouselVisualsJson || null,
          production_error: a.productionError || null,
          video_operation_name: a.videoOperationName || null,
          target_buyer_persona: a.targetBuyerPersona || null,
          target_reach: Number(a.targetReach) || 0,
          estimated_impressions: Number(a.estimatedImpressions) || 0,
          expected_leads: Number(a.expectedLeads) || 0,
          ai_content_score: a.aiContentScore,
          ai_score_rationale: a.aiScoreRationale,
          created_at: a.createdAt,
          updated_at: a.updatedAt
        }));
        await this.client.from('assets').upsert(assetRows, { onConflict: 'asset_id' });
      }

      // 6. Media
      if (store.media && store.media.length > 0) {
        const mediaRows = store.media.map((m: any) => ({
          media_id: m.mediaId,
          asset_id: m.assetId,
          campaign_id: m.campaignId,
          type: m.type,
          model: m.model,
          prompt: m.prompt,
          version: m.version,
          file_url: m.fileUrl,
          thumbnail_url: m.thumbnailUrl,
          generation_status: m.generationStatus,
          approval_status: m.approvalStatus,
          created_at: m.createdAt
        }));
        const { error: mediaError } = await this.client.from('media').upsert(mediaRows, { onConflict: 'media_id' });
        if (mediaError) throw mediaError;
      }

      // 7. Global application settings / AI provider selection
      if (store.settings) {
        const { error: settingsError } = await this.client.from('settings').upsert({
          organization_id: store.settings.organizationId,
          organization_name: store.settings.organizationName,
          brand_name: store.settings.brandName,
          website: store.settings.website,
          timezone: store.settings.timezone,
          default_platforms: store.settings.defaultPlatforms,
          brand_config_json: store.settings.brandConfigJson,
          ai_providers_json: store.settings.aiProvidersJson || null,
          email_config_json: store.settings.emailConfigJson || null,
          updated_at: store.settings.updatedAt || new Date().toISOString()
        }, { onConflict: 'organization_id' });
        if (settingsError) throw settingsError;
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
      const { error } = await this.client.from('campaigns').upsert({
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
        duration: campaign.duration,
        audience: campaign.audience,
        market_insight: campaign.marketInsight,
        value_proposition: campaign.valueProposition,
        content_pillars: campaign.contentPillars,
        posting_cadence: campaign.postingCadence,
        languages: campaign.languages,
        target_language: campaign.targetLanguage,
        platforms_json: campaign.platformsJson,
        custom_language: campaign.customLanguage,
        custom_platform: campaign.customPlatform,
        language_style: campaign.languageStyle,
        generation_status: campaign.generationStatus,
        last_generation_error: campaign.lastGenerationError,
        last_generation_attempt_at: campaign.lastGenerationAttemptAt,
        generation_options_json: campaign.generationOptionsJson,
        archived_at: campaign.archivedAt,
        updated_at: new Date().toISOString()
      }, { onConflict: 'campaign_id' });
      if (error) throw error;
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
      const { error } = await this.client.from('assets').upsert({
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
        generated_image_url: asset.generatedImageUrl || null,
        generated_video_url: asset.generatedVideoUrl || null,
        carousel_visuals_json: asset.carouselVisualsJson || null,
        production_error: asset.productionError || null,
        video_operation_name: asset.videoOperationName || null,
        target_buyer_persona: asset.targetBuyerPersona || null,
        target_reach: Number(asset.targetReach) || 0,
        estimated_impressions: Number(asset.estimatedImpressions) || 0,
        expected_leads: Number(asset.expectedLeads) || 0,
        ai_content_score: asset.aiContentScore,
        ai_score_rationale: asset.aiScoreRationale,
        updated_at: new Date().toISOString()
      }, { onConflict: 'asset_id' });
      if (error) throw error;
    } catch (e: any) {
      console.warn('[Supabase Adapter] Asset upsert warning:', e?.message);
    }
  }

  public async upsertMediaRecord(media: any): Promise<void> {
    if (!this.ready || !this.client) return;
    try {
      const { error } = await this.client.from('media').upsert({
        media_id: media.mediaId,
        asset_id: media.assetId,
        campaign_id: media.campaignId,
        type: media.type,
        model: media.model,
        prompt: media.prompt,
        version: media.version || '1',
        file_url: media.fileUrl || '',
        thumbnail_url: media.thumbnailUrl || '',
        generation_status: media.generationStatus || '',
        approval_status: media.approvalStatus || '',
        created_at: media.createdAt || new Date().toISOString()
      }, { onConflict: 'media_id' });
      if (error) throw error;
    } catch (e: any) {
      console.warn('[Supabase Adapter] Media upsert warning:', e?.message);
    }
  }
  public async upsertSettings(settings: any): Promise<void> {
    if (!this.ready || !this.client || !settings) return;
    try {
      const { error } = await this.client.from('settings').upsert({
        organization_id: settings.organizationId,
        organization_name: settings.organizationName,
        brand_name: settings.brandName,
        website: settings.website,
        timezone: settings.timezone,
        default_platforms: settings.defaultPlatforms,
        brand_config_json: settings.brandConfigJson,
        ai_providers_json: settings.aiProvidersJson || null,
        email_config_json: settings.emailConfigJson || null,
        updated_at: settings.updatedAt || new Date().toISOString()
      }, { onConflict: 'organization_id' });
      if (error) throw error;
    } catch (e: any) {
      console.warn('[Supabase Adapter] Settings upsert warning:', e?.message);
    }
  }

  /** Upload generated media to durable Supabase Storage and return a public URL. */
  public async uploadGeneratedMedia(filename: string, data: Buffer, contentType: string, scope: string = 'unscoped'): Promise<string | null> {
    if (!this.ready || !this.client) return null;
    try {
      const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const safeScope = scope.replace(/[^a-zA-Z0-9._-]/g, '_');
      const objectPath = `${safeScope}/${new Date().toISOString().slice(0, 10)}/${Date.now()}-${safeName}`;
      const { error } = await this.client.storage
        .from('generated-media')
        .upload(objectPath, data, { contentType, upsert: false });
      if (error) throw error;
      const { data: publicData } = this.client.storage.from('generated-media').getPublicUrl(objectPath);
      return publicData?.publicUrl || null;
    } catch (e: any) {
      console.warn('[Supabase Adapter] Generated media upload warning:', e?.message);
      return null;
    }
  }

  /**
   * Authoritatively upserts a user into Supabase
   */
  public async upsertUser(user: any): Promise<void> {
    if (!this.ready || !this.client) return;
    const row = {
      user_id: user.userId,
      email: (user.email || '').toLowerCase().trim(),
      name: user.name || (user.email ? user.email.split('@')[0] : 'User'),
      avatar_url: user.avatarUrl || null,
      is_super_admin: Boolean(user.isSuperAdmin),
      status: user.status || 'ACTIVE',
      created_at: user.createdAt || new Date().toISOString(),
      last_login_at: user.lastLoginAt || new Date().toISOString()
    };
    const { error } = await this.client.from('users').upsert(row, { onConflict: 'user_id' });
    if (error) {
      console.error('[Supabase Adapter] User upsert error:', error);
      throw new Error(`Supabase user persistence failed: ${error.message}`);
    }
  }

  /**
   * Deletes a user permanently from Supabase
   */
  public async deleteUser(userId: string): Promise<void> {
    if (!this.ready || !this.client) return;
    // Cascade delete memberships and sessions
    await this.deleteSessionsForUser(userId);
    await this.client.from('memberships').delete().eq('user_id', userId);
    const { error } = await this.client.from('users').delete().eq('user_id', userId);
    if (error) {
      console.error('[Supabase Adapter] User delete error:', error);
      throw new Error(`Supabase user deletion failed: ${error.message}`);
    }
  }

  /**
   * Authoritatively upserts a membership into Supabase
   */
  public async upsertMembership(mem: any): Promise<void> {
    if (!this.ready || !this.client) return;
    const row = {
      membership_id: mem.membershipId,
      user_id: mem.userId,
      company_id: mem.companyId,
      role: mem.role || 'MEMBER',
      status: mem.status || 'ACTIVE',
      invite_status: mem.inviteStatus || null,
      invite_sent_at: mem.inviteSentAt || null,
      invite_error: mem.inviteError || null,
      invite_link: mem.inviteLink || null,
      assigned_at: mem.assignedAt || new Date().toISOString(),
      assigned_by: mem.assignedBy || 'SYSTEM'
    };
    const { error } = await this.client.from('memberships').upsert(row, { onConflict: 'membership_id' });
    if (error) {
      console.error('[Supabase Adapter] Membership upsert error:', error);
      throw new Error(`Supabase membership persistence failed: ${error.message}`);
    }
  }

  /**
   * Deletes a membership from Supabase
   */
  public async deleteMembership(membershipId: string): Promise<void> {
    if (!this.ready || !this.client) return;
    const { error } = await this.client.from('memberships').delete().eq('membership_id', membershipId);
    if (error) {
      console.error('[Supabase Adapter] Membership delete error:', error);
      throw new Error(`Supabase membership deletion failed: ${error.message}`);
    }
  }

  /**
   * Authoritatively upserts an approval request into Supabase
   */
  public async upsertApprovalRequest(req: any): Promise<void> {
    if (!this.ready || !this.client) return;
    const row = {
      request_id: req.requestId,
      email: (req.email || '').toLowerCase().trim(),
      name: req.name || '',
      proposed_company_name: req.proposedCompanyName || '',
      status: req.status || 'PENDING',
      requested_at: req.requestedAt || new Date().toISOString(),
      resolved_at: req.resolvedAt || null,
      resolved_by: req.resolvedBy || null,
      assigned_company_id: req.assignedCompanyId || null,
      assigned_role: req.assignedRole || null
    };
    const { error } = await this.client.from('approval_requests').upsert(row, { onConflict: 'request_id' });
    if (error) {
      console.error('[Supabase Adapter] Approval request upsert error:', error);
      throw new Error(`Supabase approval request persistence failed: ${error.message}`);
    }
  }

  /**
   * Authoritatively upserts a session into Supabase
   */
  public async upsertSession(session: any): Promise<void> {
    if (!this.ready || !this.client) return;
    const row = {
      session_token: session.sessionToken,
      user_id: session.userId,
      active_company_id: session.activeCompanyId || null,
      created_at: session.createdAt || new Date().toISOString(),
      expires_at: session.expiresAt
    };
    const { error } = await this.client.from('sessions').upsert(row, { onConflict: 'session_token' });
    if (error) {
      console.error('[Supabase Adapter] Session upsert error:', error);
      throw new Error(`Supabase session persistence failed: ${error.message}`);
    }
  }

  /**
   * Deletes a session by token from Supabase
   */
  public async deleteSession(sessionToken: string): Promise<void> {
    if (!this.ready || !this.client) return;
    const { error } = await this.client.from('sessions').delete().eq('session_token', sessionToken);
    if (error) {
      console.warn('[Supabase Adapter] Session delete warning:', error.message);
    }
  }

  /**
   * Deletes all sessions for a user from Supabase
   */
  public async deleteSessionsForUser(userId: string): Promise<void> {
    if (!this.ready || !this.client) return;
    const { error } = await this.client.from('sessions').delete().eq('user_id', userId);
    if (error) {
      console.warn('[Supabase Adapter] User sessions delete warning:', error.message);
    }
  }
}

export const supabaseStorage = new SupabaseStorageAdapter();
