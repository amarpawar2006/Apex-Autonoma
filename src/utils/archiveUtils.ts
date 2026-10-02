import { Campaign, SocialAsset } from '../types/campaign';

/**
 * Checks whether a campaign is active (i.e. not archived).
 */
export function isCampaignActive(campaign?: Campaign | null): boolean {
  if (!campaign) return false;
  return campaign.status !== 'ARCHIVED';
}

/**
 * Checks whether an asset is active across all views.
 * An asset is ACTIVE if and only if:
 * 1. It is not individually archived (asset.isArchived !== true)
 * 2. Its parent campaign is not archived (parent campaign status !== 'ARCHIVED')
 */
export function isAssetActive(
  asset: SocialAsset,
  campaigns: Campaign[] | Map<string, Campaign>
): boolean {
  if (asset.isArchived) return false;
  
  if (asset.campaignId) {
    let camp: Campaign | undefined;
    if (campaigns instanceof Map) {
      camp = campaigns.get(asset.campaignId);
    } else if (Array.isArray(campaigns)) {
      camp = campaigns.find((c) => c.id === asset.campaignId);
    }
    if (camp && camp.status === 'ARCHIVED') {
      return false;
    }
  }

  return true;
}

/**
 * Checks whether an asset was individually archived (distinct from being hidden because of parent campaign).
 */
export function isAssetIndividuallyArchived(asset: SocialAsset): boolean {
  return Boolean(asset.isArchived);
}

/**
 * Checks whether an asset is hidden solely because its parent campaign is archived.
 */
export function isAssetHiddenByParentCampaign(
  asset: SocialAsset,
  campaigns: Campaign[] | Map<string, Campaign>
): boolean {
  if (asset.isArchived) return false;
  if (!asset.campaignId) return false;

  let camp: Campaign | undefined;
  if (campaigns instanceof Map) {
    camp = campaigns.get(asset.campaignId);
  } else if (Array.isArray(campaigns)) {
    camp = campaigns.find((c) => c.id === asset.campaignId);
  }

  return Boolean(camp && camp.status === 'ARCHIVED');
}

/**
 * Returns only active campaigns.
 */
export function getActiveCampaigns(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter(isCampaignActive);
}

/**
 * Returns only active assets.
 */
export function getActiveAssets(
  assets: SocialAsset[],
  campaigns: Campaign[] | Map<string, Campaign>
): SocialAsset[] {
  return assets.filter(a => isAssetActive(a, campaigns));
}

/**
 * Returns campaigns that are archived.
 */
export function getArchivedCampaigns(campaigns: Campaign[]): Campaign[] {
  return campaigns.filter(c => c.status === 'ARCHIVED');
}

/**
 * Returns assets that are archived (individually or by parent campaign).
 */
export function getArchivedAssets(
  assets: SocialAsset[],
  campaigns: Campaign[] | Map<string, Campaign>
): SocialAsset[] {
  return assets.filter(a => !isAssetActive(a, campaigns));
}

