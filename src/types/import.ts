import { 
  DbKnowledgeSourceRow, 
  DbCompanyKnowledgeRow, 
  DbContactRow, 
  DbAudienceListRow, 
  DbCampaignContextSourceRow 
} from './database';

export type ImportClassification =
  | 'COMPANY_KNOWLEDGE'
  | 'CONTACT'
  | 'AUDIENCE'
  | 'CAMPAIGN_HISTORY'
  | 'PRODUCT'
  | 'SOCIAL_HANDLE'
  | 'DISTRIBUTION_LIST'
  | 'CAMPAIGN_CONTEXT'
  | 'OTHER';

export interface FileInspectionSummary {
  contactsCount: number;
  companiesCount: number;
  emailsCount: number;
  phonesCount: number;
  socialHandlesCount: number;
  linkedinUrlsCount: number;
  instagramHandlesCount: number;
  youtubeUrlsCount: number;
  websitesCount: number;
  locationsCount: number;
  segmentsCount: number;
  productsCount: number;
  campaignHistoryCount: number;
  contentIdeasCount: number;
  captionsCount: number;
  hashtagsCount: number;
  skusCount: number;
  pricingFieldsCount: number;
  distributionListsCount: number;
  audienceCategoriesCount: number;
  categoriesDetected: ImportClassification[];
  sampleEntities: {
    companies?: string[];
    segments?: string[];
    products?: string[];
    locations?: string[];
    socialHandles?: string[];
    sampleContacts?: Array<{
      name?: string;
      email?: string;
      company?: string;
      phone?: string;
      location?: string;
      social?: string;
    }>;
  };
  structuredDataSnippet?: string;
  safeCampaignContext?: string;
}

export interface StagedFileInspection {
  sourceId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  status: 'UPLOADED' | 'INSPECTING' | 'READY_FOR_REVIEW' | 'IMPORTED' | 'FAILED';
  summary: FileInspectionSummary;
  error?: string;
  storageUrl?: string;
}

export interface ImportUserChoice {
  saveCompanyKnowledge: boolean;
  saveContacts: boolean;
  saveSocialHandles: boolean;
  saveAudienceSegments: boolean;
  saveProducts: boolean;
  saveHistoricalCampaigns: boolean;
  useAsCampaignContext: boolean;
  useOnlyForDistribution: boolean;
  campaignOnly: boolean;
  doNotSavePersonalContactInfo: boolean;
  doNotRetainSourceFile: boolean;
  audienceListName?: string;
  campaignId?: string;
}

export interface ImportConfirmationPayload {
  sourceIds: string[];
  choices: Record<string, ImportUserChoice>; // keyed by sourceId or global
  campaignId?: string;
}

export interface AttachedDistributionList {
  listId: string;
  name: string;
  description?: string;
  contactCount: number;
  listType: string;
  channelBreakdown?: {
    whatsapp?: number;
    linkedin?: number;
    email?: number;
    instagram?: number;
    other?: number;
  };
  attachedAt: string;
}
