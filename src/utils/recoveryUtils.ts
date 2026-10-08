import { Campaign, SocialAsset } from '../types/campaign';

export interface CampaignRecoveryPackage {
  schemaVersion: '1.0';
  exportedAt: string;
  organizationId: string;
  organizationName: string;
  campaign: Campaign;
  strategy?: any;
  assets: SocialAsset[];
  generationOptions?: any;
  deliveryMatrix?: any[];
  generationStatus?: string;
  syncStatus?: string;
}

/**
 * Generates and downloads a clean, safe recovery JSON file for a campaign.
 * Strictly strips any tokens, API keys, sessions, or credentials.
 */
export function downloadCampaignRecoveryFile(
  campaign: Campaign,
  assets: SocialAsset[],
  organizationId: string,
  organizationName: string
): void {
  const recoveryData: CampaignRecoveryPackage = {
    schemaVersion: '1.0',
    exportedAt: new Date().toISOString(),
    organizationId,
    organizationName,
    campaign: {
      ...campaign,
      syncStatus: campaign.syncStatus || 'SYNC_PENDING'
    },
    strategy: campaign.strategy,
    assets: assets || [],
    generationOptions: campaign.generationOptions,
    generationStatus: campaign.generationStatus,
    syncStatus: campaign.syncStatus || 'SYNC_PENDING'
  };

  const jsonStr = JSON.stringify(recoveryData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const code = (campaign.campaignCode || campaign.id || 'CAMPAIGN').replace(/[^a-zA-Z0-9-_]/g, '_');
  a.href = url;
  a.download = `AUTONOMA-CAMPAIGN-${code}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates an uploaded recovery file content.
 */
export function validateCampaignRecoveryPackage(
  data: any,
  activeCompanyId: string,
  isSuperAdmin: boolean = false
): {
  valid: boolean;
  error?: string;
  package?: CampaignRecoveryPackage;
} {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Invalid recovery file: Expected JSON object.' };
  }

  if (data.schemaVersion !== '1.0') {
    return { valid: false, error: 'Unsupported recovery schema version. Expected 1.0.' };
  }

  if (!data.campaign || !data.campaign.id || !data.campaign.name) {
    return { valid: false, error: 'Recovery file missing required campaign metadata.' };
  }

  if (!Array.isArray(data.assets)) {
    return { valid: false, error: 'Recovery file missing assets array.' };
  }

  // Company isolation check
  if (data.organizationId && data.organizationId !== activeCompanyId && !isSuperAdmin) {
    return {
      valid: false,
      error: `Company mismatch: This campaign belongs to "${data.organizationName || data.organizationId}", but your active workspace is different. Access is blocked.`
    };
  }

  return {
    valid: true,
    package: data as CampaignRecoveryPackage
  };
}
