export type UserRole = 'SUPER_ADMIN' | 'COMPANY_ADMIN' | 'MEMBER';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type EntityStatus = 'ACTIVE' | 'SUSPENDED';

export interface User {
  id?: string;
  userId?: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isSuperAdmin: boolean;
  status: EntityStatus;
  createdAt: string;
  lastLoginAt: string;
}

export type OrganizationType = 'business' | 'club_community' | 'consultancy' | 'nonprofit' | 'other';

export interface CompanySocialLinks {
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  facebook?: string;
  twitter?: string;
}

export interface CompanyUnderstoodSummary {
  organizationAndOffering: string;
  audience: string;
  goals: string;
  voice: string;
  cta: string;
  constraints: string;
  positioning?: string;
  geography?: string;
  sourceUrls: string[];
  assumptions: string[];
  version: number;
  confirmedAt?: string;
  confirmedBy?: string;
  isActive: boolean;
}

export interface InferredCompanyProfile {
  companyName?: string;
  organizationType?: OrganizationType;
  description?: string;
  offerings?: string;
  audience?: string;
  geography?: string;
  positioning?: string;
  primaryGoal?: string;
  brandVoice?: string;
  claimsAvoid?: string;
  preferredCta?: string;
}

export interface BrandDesignSystem {
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  headingFont?: string;
  bodyFont?: string;
  logoUrl?: string;
  visualStyleNotes?: string;
  imageStyle?: string;
  videoStyleDirection?: string;
  creativeRules?: string;
  brandVoiceNote?: string;
  suggestedFromWebsite?: boolean;
  suggestedFromPdf?: boolean;
  websiteSuggestions?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    headingFont?: string;
    visualTone?: string;
  };
  pdfSuggestions?: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    backgroundColor?: string;
    textColor?: string;
    headingFont?: string;
    bodyFont?: string;
    visualStyleNotes?: string;
    imageStyle?: string;
    videoStyleDirection?: string;
    creativeRules?: string;
    brandVoiceNote?: string;
    extractedSummary?: string;
  };
}

export type CapabilityType = 'text' | 'image' | 'video';

export interface ProviderCapabilityDefaults {
  text: string;
  image: string;
  video: string;
}

export interface ProviderConfig {
  id: string; // 'gemini' | 'openai' | 'nvidia' | 'google_veo'
  name: string;
  apiKey?: string;
  hasKey?: boolean;
  source?: 'server_secret' | 'workspace_override' | 'unconfigured';
  capabilities: CapabilityType[];
  selectedModel: string;
  availableModels: string[];
  customEndpoint?: string;
  status?: 'UNCONFIGURED' | 'CONFIGURED' | 'CONNECTED' | 'ERROR';
  lastTestedAt?: string;
  lastTestMessage?: string;
  latencyMs?: number;
}

export interface AiProvidersSettings {
  defaults: ProviderCapabilityDefaults;
  providers: Record<string, ProviderConfig>;
  googleDrive?: {
    folderIdOrUrl?: string;
    enabled?: boolean;
  };
}

export interface TransactionalEmailConfig {
  provider: 'resend' | 'smtp' | 'system';
  source?: 'server_secret' | 'workspace_override' | 'unconfigured';
  resendApiKey?: string;
  hasResendKey?: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  hasSmtpPass?: boolean;
  smtpFrom?: string;
  smtpSecure?: boolean;
  status?: 'UNCONFIGURED' | 'CONFIGURED' | 'CONNECTED' | 'ERROR';
  lastTestedAt?: string;
  lastTestMessage?: string;
}

export interface CompanyProfile {
  organizationType: OrganizationType;
  description: string;
  audience: string;
  primaryGoal: string;
  offerings?: string;
  geography?: string;
  positioning?: string;
  preferredLanguage?: string;
  timezone?: string;
  website?: string;
  socialLinks?: CompanySocialLinks;
  preferredCta?: string;
  defaultWhatsAppRecipient?: string;
  brandVoice?: string;
  claimsAvoid?: string;
  confirmedContext?: CompanyUnderstoodSummary;
  contextVersions?: CompanyUnderstoodSummary[];
  brandDesignSystem?: BrandDesignSystem;
  lastAnalyzedAt?: string;
  editedFields?: string[];
}

export interface Company {
  id?: string;
  companyId?: string;
  name: string;
  status: EntityStatus;
  profile?: CompanyProfile;
  profileJson?: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  campaignCount?: number;
}

export interface Membership {
  id?: string;
  membershipId?: string;
  userId: string;
  companyId: string;
  role: 'COMPANY_ADMIN' | 'MEMBER';
  status: EntityStatus;
  assignedAt: string;
  assignedBy: string;
  companyName?: string;
  userName?: string;
  userEmail?: string;
  inviteStatus?: 'SENT' | 'FAILED' | 'PENDING';
  inviteSentAt?: string;
  inviteError?: string;
  inviteLink?: string;
}

export interface ApprovalRequest {
  id?: string;
  requestId?: string;
  email: string;
  name: string;
  proposedCompanyName: string;
  status: ApprovalStatus;
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  assignedCompanyId?: string;
  assignedRole?: 'COMPANY_ADMIN' | 'MEMBER';
}

export interface AuthSessionResponse {
  success: boolean;
  token?: string;
  user?: User;
  activeCompany?: Company;
  memberships?: Membership[];
  role?: UserRole;
  pendingRequest?: ApprovalRequest;
  status?: ApprovalStatus | EntityStatus;
  message?: string;
  error?: string;
  code?: string;
}
