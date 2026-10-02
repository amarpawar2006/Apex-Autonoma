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
  brandVoiceNote?: string;
  suggestedFromWebsite?: boolean;
  websiteSuggestions?: {
    primaryColor?: string;
    secondaryColor?: string;
    headingFont?: string;
    visualTone?: string;
  };
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
