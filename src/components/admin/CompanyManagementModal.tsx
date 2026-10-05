import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Users, 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Save, 
  Mail, 
  User, 
  ShieldAlert,
  Sparkles,
  Globe,
  RotateCcw,
  Check,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  FileText,
  Clock,
  Layers,
  Phone,
  ArrowRight,
  Copy,
  Send,
  RefreshCw
} from 'lucide-react';
import { 
  Company, 
  Membership, 
  UserRole, 
  User as AuthUser, 
  CompanyProfile, 
  OrganizationType, 
  CompanyUnderstoodSummary 
} from '../../types/auth';
import { autonomaDataService } from '../../services/autonomaDataService';

const displayValue = (value: unknown, fallback = ''): string => {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map((item) => displayValue(item)).filter(Boolean).join(' • ') || fallback;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const title =
      displayValue(obj.Pillar) ||
      displayValue(obj.pillar) ||
      displayValue(obj.title) ||
      displayValue(obj.name) ||
      displayValue(obj.label);
    const description =
      displayValue(obj.Description) ||
      displayValue(obj.description) ||
      displayValue(obj.body) ||
      displayValue(obj.detail) ||
      displayValue(obj.value);
    if (title && description) return `${title}: ${description}`;
    if (title) return title;
    if (description) return description;
    return Object.entries(obj)
      .map(([key, item]) => `${key}: ${displayValue(item)}`)
      .filter(Boolean)
      .join(' • ') || fallback;
  }
  return fallback;
};

const normalizeSummary = (value: CompanyUnderstoodSummary | undefined): CompanyUnderstoodSummary | undefined => {
  if (!value) return undefined;
  return {
    ...value,
    organizationAndOffering: displayValue(value.organizationAndOffering),
    audience: displayValue(value.audience),
    goals: displayValue(value.goals),
    voice: displayValue(value.voice),
    cta: displayValue(value.cta),
    constraints: displayValue(value.constraints),
    positioning: displayValue(value.positioning),
    geography: displayValue(value.geography),
    sourceUrls: Array.isArray(value.sourceUrls) ? value.sourceUrls.map((item) => displayValue(item)).filter(Boolean) : [],
    assumptions: Array.isArray(value.assumptions) ? value.assumptions.map((item) => displayValue(item)).filter(Boolean) : []
  };
};

interface CompanyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCompany: Company;
  currentUser: AuthUser;
  currentUserRole: UserRole;
  onCompanyUpdated: (updatedCompany: Company) => void;
  initialTab?: 'ai_context' | 'profile' | 'understanding' | 'members';
}

export const CompanyManagementModal: React.FC<CompanyManagementModalProps> = ({
  isOpen,
  onClose,
  activeCompany,
  currentUser,
  currentUserRole,
  onCompanyUpdated,
  initialTab = 'ai_context'
}) => {
  const [activeTab, setActiveTab] = useState<'ai_context' | 'profile' | 'understanding' | 'members'>(initialTab);
  const [members, setMembers] = useState<Membership[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Add member form state
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<'COMPANY_ADMIN' | 'MEMBER'>('MEMBER');

  // Company Profile form state
  const [companyName, setCompanyName] = useState(activeCompany?.name || '');
  const [orgType, setOrgType] = useState<OrganizationType>('business');
  const [description, setDescription] = useState('');
  const [offerings, setOfferings] = useState('');
  const [audience, setAudience] = useState('');
  const [geography, setGeography] = useState('');
  const [positioning, setPositioning] = useState('');
  const [primaryGoal, setPrimaryGoal] = useState('');
  const [autoFilledFieldsCount, setAutoFilledFieldsCount] = useState<number>(0);
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [website, setWebsite] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialLinkedin, setSocialLinkedin] = useState('');
  const [socialYoutube, setSocialYoutube] = useState('');
  const [socialFacebook, setSocialFacebook] = useState('');
  const [socialTwitter, setSocialTwitter] = useState('');
  const [preferredCta, setPreferredCta] = useState('');
  const [defaultWhatsAppRecipient, setDefaultWhatsAppRecipient] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [claimsAvoid, setClaimsAvoid] = useState('');

  // AI Description Improvement State
  const [isImprovingDesc, setIsImprovingDesc] = useState(false);
  const [descPreview, setDescPreview] = useState<string | null>(null);
  const [originalDescBackup, setOriginalDescBackup] = useState<string | null>(null);
  const [descImproveError, setDescImproveError] = useState<string | null>(null);

  // AI Website Analysis State
  const [analysisInputMode, setAnalysisInputMode] = useState<'url' | 'paste'>('url');
  const [websiteUrlInput, setWebsiteUrlInput] = useState('');
  const [pastedTextInput, setPastedTextInput] = useState('');
  const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Understood Summary State
  const [summaryState, setSummaryState] = useState<CompanyUnderstoodSummary>({
    organizationAndOffering: '',
    audience: '',
    goals: '',
    voice: '',
    cta: '',
    constraints: '',
    sourceUrls: [],
    assumptions: [],
    version: 1,
    isActive: false
  });
  const [isConfirmingContext, setIsConfirmingContext] = useState(false);

  const isCompanyAdmin = currentUserRole === 'COMPANY_ADMIN' || currentUser.isSuperAdmin;

  useEffect(() => {
    if (!isOpen) return;

    // Load initial values from activeCompany
    setCompanyName(activeCompany?.name || '');
    const prof = activeCompany?.profile;
    if (prof) {
      setOrgType(prof.organizationType || 'business');
      setDescription(displayValue(prof.description));
      setOfferings(displayValue(prof.offerings));
      setAudience(displayValue(prof.audience));
      setGeography(displayValue(prof.geography));
      setPositioning(displayValue(prof.positioning || prof.confirmedContext?.positioning));
      setPrimaryGoal(displayValue(prof.primaryGoal));
      setPreferredLanguage(prof.preferredLanguage || 'English');
      setTimezone(prof.timezone || 'Asia/Kolkata');
      setWebsite(prof.website || '');
      setWebsiteUrlInput(prof.website || '');
      setSocialInstagram(prof.socialLinks?.instagram || '');
      setSocialLinkedin(prof.socialLinks?.linkedin || '');
      setSocialYoutube(prof.socialLinks?.youtube || '');
      setSocialFacebook(prof.socialLinks?.facebook || '');
      setSocialTwitter(prof.socialLinks?.twitter || '');
      setPreferredCta(displayValue(prof.preferredCta));
      setDefaultWhatsAppRecipient(prof.defaultWhatsAppRecipient || '');
      setBrandVoice(displayValue(prof.brandVoice));
      setClaimsAvoid(displayValue(prof.claimsAvoid));

      if (prof.confirmedContext) {
        setSummaryState(normalizeSummary(prof.confirmedContext) || summaryState);
      } else {
        // Pre-seed draft summary based on existing profile fields
        setSummaryState({
          organizationAndOffering: prof.description || prof.offerings || '',
          audience: prof.audience || '',
          goals: prof.primaryGoal || '',
          voice: prof.brandVoice || 'Professional and grounded',
          cta: prof.preferredCta || '',
          constraints: prof.claimsAvoid || '',
          sourceUrls: prof.website ? [prof.website] : [],
          assumptions: [],
          version: 1,
          isActive: false
        });
      }
    } else {
      // Clean defaults
      setOrgType('business');
      setDescription('');
      setOfferings('');
      setAudience('');
      setGeography('');
      setPrimaryGoal('');
      setPreferredLanguage('English');
      setTimezone('Asia/Kolkata');
      setWebsite('');
      setWebsiteUrlInput('');
      setSocialInstagram('');
      setSocialLinkedin('');
      setSocialYoutube('');
      setSocialFacebook('');
      setSocialTwitter('');
      setPreferredCta('');
      setDefaultWhatsAppRecipient('');
      setBrandVoice('');
      setClaimsAvoid('');
    }

    setDescPreview(null);
    setOriginalDescBackup(null);
    setDescImproveError(null);
    setAnalysisError(null);
    setError(null);
    setSuccess(null);

    loadMembers();
  }, [isOpen, activeCompany]);

  const loadMembers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await autonomaDataService.getCompanyMembers();
      setMembers(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load company members');
    } finally {
      setLoading(false);
    }
  };

  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copiedInviteId, setCopiedInviteId] = useState<string | null>(null);
  const [lastInviteNotice, setLastInviteNotice] = useState<{
    status: 'SENT' | 'FAILED' | 'PREVIEW_ONLY';
    email: string;
    membershipId: string;
    inviteLink: string;
    error?: string;
  } | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const result: any = await autonomaDataService.addCompanyMember(
        newEmail.trim(),
        newName.trim() || newEmail.split('@')[0],
        newRole
      );
      const delivery = result?.emailDelivery;
      const memId = result?.data?.membershipId || result?.membershipId || '';
      const invLink = result?.data?.inviteLink || `${window.location.origin}/invite?membership=${memId}&company=${activeCompany.companyId || activeCompany.id}`;

      if (delivery?.success) {
        setSuccess(`Invited ${newEmail}! Transactional invitation email sent successfully.`);
        setLastInviteNotice({
          status: 'SENT',
          email: newEmail,
          membershipId: memId,
          inviteLink: invLink
        });
      } else {
        const errorMsg = delivery?.error || 'Automatic invitation email was not delivered. Access has been provisioned. Please share the invite link manually.';
        setError(errorMsg);
        setLastInviteNotice({
          status: delivery?.previewOnly ? 'PREVIEW_ONLY' : 'FAILED',
          email: newEmail,
          membershipId: memId,
          inviteLink: invLink,
          error: errorMsg
        });
      }
      setNewEmail('');
      setNewName('');
      setNewRole('MEMBER');
      await loadMembers();
    } catch (err: any) {
      setError(err?.message || 'Failed to add member');
    } finally {
      setSaving(false);
    }
  };

  const handleResendInvite = async (membershipId: string) => {
    setResendingId(membershipId);
    setError(null);
    try {
      const res = await autonomaDataService.resendMemberInvite(membershipId);
      if (res.emailDelivery?.success) {
        setSuccess('Transactional invitation email resent successfully!');
      } else {
        const errorMsg = res.emailDelivery?.error || 'Automatic invitation email was not delivered. Access has been provisioned. Please share the invite link manually.';
        setError(errorMsg);
      }
      await loadMembers();
    } catch (err: any) {
      setError(err?.message || 'Failed to resend invite');
    } finally {
      setResendingId(null);
    }
  };

  const handleCopyInviteLink = (mem: Membership) => {
    const memId = mem.membershipId || mem.id || '';
    const link = mem.inviteLink || `${window.location.origin}/invite?membership=${memId}&company=${activeCompany.companyId || activeCompany.id}`;
    navigator.clipboard.writeText(link);
    setCopiedInviteId(memId);
    setTimeout(() => setCopiedInviteId(null), 2000);
  };

  const handleUpdateRole = async (membershipId: string, role: 'COMPANY_ADMIN' | 'MEMBER') => {
    setSaving(true);
    setError(null);
    try {
      await autonomaDataService.updateCompanyMemberRole(membershipId, role);
      setSuccess('Member role updated.');
      await loadMembers();
    } catch (err: any) {
      setError(err?.message || 'Failed to update member role');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (mem: Membership) => {
    const memId = mem.membershipId || mem.id || '';
    if (!window.confirm(`Are you sure you want to remove ${mem.userName || mem.userEmail} from ${activeCompany.name}?`)) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await autonomaDataService.removeCompanyMember(memId);
      setSuccess(`Removed member from company.`);
      await loadMembers();
    } catch (err: any) {
      setError(err?.message || 'Failed to remove member');
    } finally {
      setSaving(false);
    }
  };

  // AI-Assisted Description Improvement
  const handleImproveDescription = async () => {
    if (!description.trim()) {
      setDescImproveError('Please enter a description first to improve.');
      return;
    }
    setIsImprovingDesc(true);
    setDescImproveError(null);
    try {
      const res = await autonomaDataService.improveCompanyDescription({
        currentDescription: description.trim(),
        organizationType: orgType,
        offerings: offerings.trim() || undefined,
        audience: audience.trim() || undefined
      });
      setDescPreview(res.improved);
    } catch (err: any) {
      setDescImproveError(err?.message || 'Failed to improve description. You can continue editing manually.');
    } finally {
      setIsImprovingDesc(false);
    }
  };

  const handleAcceptImprovedDesc = () => {
    if (!descPreview) return;
    setOriginalDescBackup(description);
    setDescription(descPreview);
    setDescPreview(null);
  };

  const handleUndoImprovedDesc = () => {
    if (originalDescBackup !== null) {
      setDescription(originalDescBackup);
      setOriginalDescBackup(null);
    }
  };

  // AI-Assisted Website / Text Analysis
  const handleAnalyzeWebsite = async () => {
    setAnalysisError(null);
    const url = websiteUrlInput.trim();
    const paste = pastedTextInput.trim();

    if (analysisInputMode === 'url' && !url) {
      setAnalysisError('Please enter a valid website URL or choose Paste Text.');
      return;
    }
    if (analysisInputMode === 'paste' && !paste) {
      setAnalysisError('Please paste your website or brochure text.');
      return;
    }

    setIsAnalyzingWebsite(true);
    try {
      const res = await autonomaDataService.analyzeCompanyWebsite({
        websiteUrl: analysisInputMode === 'url' ? url : undefined,
        pastedText: analysisInputMode === 'paste' ? paste : undefined
      });

      if (res?.summary) {
        setSummaryState(normalizeSummary(res.summary) || summaryState);

        // The website analysis endpoint now persists the normalized company profile.
        // Immediately hydrate every setup tab from that authoritative response so
        // Strategic Context, Company Profile and Autonoma's Understanding cannot drift.
        if (res.company) {
          onCompanyUpdated(res.company);
        }
        const persistedProfile = res.profile;
        if (persistedProfile) {
          if (res.company?.name) setCompanyName(res.company.name);
          setOrgType(persistedProfile.organizationType || 'business');
          setDescription(displayValue(persistedProfile.description));
          setOfferings(displayValue(persistedProfile.offerings));
          setAudience(displayValue(persistedProfile.audience));
          setGeography(displayValue(persistedProfile.geography));
          setPositioning(displayValue(persistedProfile.positioning));
          setPrimaryGoal(displayValue(persistedProfile.primaryGoal));
          setBrandVoice(displayValue(persistedProfile.brandVoice));
          setClaimsAvoid(displayValue(persistedProfile.claimsAvoid));
          setPreferredCta(displayValue(persistedProfile.preferredCta));
          if (persistedProfile.website) setWebsite(persistedProfile.website);
        }
        
        let filledCount = 0;
        const inf = res.inferredProfile;
        
        if (inf && !persistedProfile) {
          if ((!companyName.trim() || companyName === 'Company') && inf.companyName) {
            setCompanyName(inf.companyName);
            filledCount++;
          }
          if (inf.organizationType && (!orgType || orgType === 'business')) {
            setOrgType(inf.organizationType);
            filledCount++;
          }
          if (!description.trim() && (inf.description || res.summary.organizationAndOffering)) {
            setDescription(displayValue(inf.description || res.summary.organizationAndOffering).slice(0, 300));
            filledCount++;
          }
          if (!offerings.trim() && inf.offerings) {
            setOfferings(inf.offerings);
            filledCount++;
          }
          if (!audience.trim() && (inf.audience || res.summary.audience)) {
            setAudience(inf.audience || res.summary.audience);
            filledCount++;
          }
          if (!geography.trim() && (inf.geography || res.summary.geography)) {
            setGeography(inf.geography || res.summary.geography || '');
            filledCount++;
          }
          if (!positioning.trim() && (inf.positioning || res.summary.positioning)) {
            setPositioning(inf.positioning || res.summary.positioning || '');
            filledCount++;
          }
          if (!primaryGoal.trim() && (inf.primaryGoal || res.summary.goals)) {
            setPrimaryGoal(inf.primaryGoal || res.summary.goals);
            filledCount++;
          }
          if (!brandVoice.trim() && (inf.brandVoice || res.summary.voice)) {
            setBrandVoice(inf.brandVoice || res.summary.voice);
            filledCount++;
          }
          if (!claimsAvoid.trim() && (inf.claimsAvoid || res.summary.constraints)) {
            setClaimsAvoid(inf.claimsAvoid || res.summary.constraints);
            filledCount++;
          }
          if (!preferredCta.trim() && (inf.preferredCta || res.summary.cta)) {
            setPreferredCta(inf.preferredCta || res.summary.cta);
            filledCount++;
          }
        } else if (!persistedProfile) {
          // Fallback extraction from summary
          if (!description.trim() && res.summary.organizationAndOffering) {
            setDescription(displayValue(res.summary.organizationAndOffering).slice(0, 300));
            filledCount++;
          }
          if (!audience.trim() && res.summary.audience) {
            setAudience(res.summary.audience);
            filledCount++;
          }
          if (!primaryGoal.trim() && res.summary.goals) {
            setPrimaryGoal(res.summary.goals);
            filledCount++;
          }
          if (!brandVoice.trim() && res.summary.voice) {
            setBrandVoice(res.summary.voice);
            filledCount++;
          }
          if (!preferredCta.trim() && res.summary.cta) {
            setPreferredCta(res.summary.cta);
            filledCount++;
          }
        }

        if (!website.trim() && url) {
          setWebsite(url);
          filledCount++;
        }

        if (persistedProfile) {
          filledCount = Object.values({
            description: persistedProfile.description,
            offerings: persistedProfile.offerings,
            audience: persistedProfile.audience,
            geography: persistedProfile.geography,
            positioning: persistedProfile.positioning,
            primaryGoal: persistedProfile.primaryGoal,
            brandVoice: persistedProfile.brandVoice,
            preferredCta: persistedProfile.preferredCta
          }).filter(Boolean).length;
        }
        setAutoFilledFieldsCount(filledCount);
        setSuccess(
          filledCount > 0
            ? `Website analyzed! Autonoma suggested and filled ${filledCount} missing company profile fields while preserving your existing data. Review and confirm below.`
            : 'Website analyzed! Autonoma strategic company context generated. Existing user data was preserved.'
        );
      }
    } catch (err: any) {
      // Inaccessible website fallback: explain and offer pasted text directly
      setAnalysisError(err?.message || 'Failed to analyze website. You can paste text directly below.');
      if (analysisInputMode === 'url') {
        setAnalysisInputMode('paste');
      }
    } finally {
      setIsAnalyzingWebsite(false);
    }
  };

  // Confirm and activate understood company context
  const handleConfirmContext = async () => {
    if (!isCompanyAdmin) return;
    setIsConfirmingContext(true);
    setError(null);
    try {
      const summaryToConfirm: CompanyUnderstoodSummary = {
        ...summaryState,
        organizationAndOffering: summaryState.organizationAndOffering || description || offerings || `${companyName} operations`,
        audience: summaryState.audience || audience || 'Target audience & customer community',
        goals: summaryState.goals || primaryGoal || 'Conversion & growth objectives',
        voice: summaryState.voice || brandVoice || 'Professional, grounded, authoritative',
        cta: summaryState.cta || preferredCta || 'Contact directly or visit website',
        constraints: summaryState.constraints || claimsAvoid || 'No unverified claims',
        positioning: positioning.trim() || summaryState.positioning || undefined,
        geography: geography.trim() || summaryState.geography || undefined
      };
      const res = await autonomaDataService.confirmCompanyContext(summaryToConfirm);
      if (res.success && res.data) {
        setSuccess(`Company context v${res.confirmedContext.version} confirmed and activated!`);
        setSummaryState(normalizeSummary(res.confirmedContext) || summaryState);
        onCompanyUpdated(res.data);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to activate company context');
    } finally {
      setIsConfirmingContext(false);
    }
  };

  // Save Company Profile Settings
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Company name is required');
      return;
    }
    if (!description.trim()) {
      setError('Company description is required');
      return;
    }
    if (!audience.trim()) {
      setError('Main audience is required');
      return;
    }
    if (!primaryGoal.trim()) {
      setError('Primary goal is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    const updatedProfile: CompanyProfile = {
      organizationType: orgType,
      description: description.trim(),
      audience: audience.trim(),
      primaryGoal: primaryGoal.trim(),
      offerings: offerings.trim() || undefined,
      geography: geography.trim() || undefined,
      positioning: positioning.trim() || undefined,
      preferredLanguage: preferredLanguage.trim() || undefined,
      timezone: timezone.trim() || undefined,
      website: website.trim() || undefined,
      socialLinks: {
        instagram: socialInstagram.trim() || undefined,
        linkedin: socialLinkedin.trim() || undefined,
        youtube: socialYoutube.trim() || undefined,
        facebook: socialFacebook.trim() || undefined,
        twitter: socialTwitter.trim() || undefined,
      },
      preferredCta: preferredCta.trim() || undefined,
      defaultWhatsAppRecipient: defaultWhatsAppRecipient.trim() || undefined,
      brandVoice: brandVoice.trim() || undefined,
      claimsAvoid: claimsAvoid.trim() || undefined,
      confirmedContext: summaryState.isActive ? summaryState : activeCompany.profile?.confirmedContext,
      contextVersions: activeCompany.profile?.contextVersions || [],
      lastAnalyzedAt: activeCompany.profile?.lastAnalyzedAt,
      brandDesignSystem: activeCompany.profile?.brandDesignSystem,
      // Saving the profile means the administrator has reviewed/accepted these values.
      // Mark them user-owned so future website re-analysis suggests rather than silently overwrites them.
      editedFields: Array.from(new Set([
        ...(activeCompany.profile?.editedFields || []),
        'name', 'organizationType', 'description', 'offerings', 'audience', 'geography',
        'positioning', 'primaryGoal', 'preferredLanguage', 'timezone', 'website',
        'preferredCta', 'defaultWhatsAppRecipient', 'brandVoice', 'claimsAvoid'
      ]))
    };

    try {
      const updated = await autonomaDataService.updateCompanyProfile(companyName.trim(), updatedProfile);
      setSuccess('Company profile saved successfully!');
      onCompanyUpdated(updated);
    } catch (err: any) {
      setError(err?.message || 'Failed to save company profile');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const isContextActive = summaryState?.isActive || activeCompany?.profile?.confirmedContext?.isActive;

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[300] bg-black/50 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-3xl bg-white border border-black/[0.08] rounded-3xl max-sm:h-full max-sm:rounded-none max-sm:max-w-none shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-black/[0.06] flex items-center justify-between bg-[#FBFBFD]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-[#FF4500]/20 text-[#FF4500]">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F] flex items-center space-x-2">
                <span>{activeCompany.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-black/[0.04] text-[#6E6E73]">
                  {currentUserRole}
                </span>
                {isContextActive && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                    <CheckCircle2 className="w-2.5 h-2.5" />
                    <span>AI Context v{summaryState.version || activeCompany.profile?.confirmedContext?.version} Active</span>
                  </span>
                )}
              </h3>
              <p className="text-xs text-[#6E6E73]">Company profile, brand intelligence & access controls</p>
            </div>
          </div>

          <button onClick={onClose} aria-label="Close dialog" className="p-1.5 text-[#6E6E73] hover:text-[#1D1D1F] rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="px-6 pt-2.5 flex border-b border-black/[0.06] bg-[#F5F5F7] text-xs gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('ai_context')}
            className={`pb-2.5 px-3.5 font-semibold transition-all border-b-2 flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'ai_context'
                ? 'border-[#FF4500] text-[#1D1D1F] font-bold'
                : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FF4500]" />
            <span>1. AI Strategic Context</span>
            {isContextActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 ml-1" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 px-3.5 font-semibold transition-all border-b-2 flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'profile'
                ? 'border-[#FF4500] text-[#1D1D1F] font-bold'
                : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>2–5. Company Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('understanding')}
            className={`pb-2.5 px-3.5 font-semibold transition-all border-b-2 flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'understanding'
                ? 'border-[#FF4500] text-[#1D1D1F] font-bold'
                : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 ${isContextActive ? 'text-emerald-400' : 'text-[#86868B]'}`} />
            <span>6. Autonoma's Understanding</span>
            {isContextActive && (
              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-emerald-500/20 text-emerald-400">Active</span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('members')}
            className={`pb-2.5 px-3.5 font-semibold transition-all border-b-2 flex items-center space-x-1.5 shrink-0 ${
              activeTab === 'members'
                ? 'border-[#FF4500] text-[#1D1D1F] font-bold'
                : 'border-transparent text-[#6E6E73] hover:text-[#1D1D1F]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team ({members.length})</span>
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} aria-label="Dismiss error" className="text-red-600 hover:text-red-800 text-xs">✕</button>
            </div>
          )}

          {success && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center justify-between space-x-2">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{success}</span>
              </div>
              <button onClick={() => setSuccess(null)} aria-label="Dismiss success message" className="text-emerald-600 hover:text-emerald-800 text-xs">✕</button>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 1: AI-ASSISTED CONTEXT ENGINE (WEBSITE-FIRST)    */}
          {/* ==================================================== */}
          {activeTab === 'ai_context' && (
            <div className="space-y-5">
              {/* Header explanation */}
              <div className="p-4 bg-[#F5F5F7] border border-black/[0.06] rounded-xl space-y-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-[#FF4500]" />
                  <h4 className="text-xs font-bold text-[#1D1D1F]">1. AI Strategic Context & Website-First Analysis</h4>
                </div>
                <p className="text-xs text-[#86868B] leading-relaxed">
                  Start by providing your public website. Autonoma analyses your business evidence server-side (with strict request timeouts, size limits, and SSRF protection), treats retrieved text as objective evidence, and auto-fills missing company profile fields while preserving anything you've already entered.
                </p>
              </div>

              {/* Analyse Website Form */}
              <div className="p-4 bg-[#FBFBFD] border border-black/[0.08] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#1D1D1F]">Company Website or Pasted Business Copy</span>
                  <div className="flex items-center space-x-2 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setAnalysisInputMode('url')}
                      className={`px-2.5 py-1 rounded-lg ${
                        analysisInputMode === 'url' ? 'bg-[#FF4500]/20 text-[#FF4500] font-semibold' : 'text-[#86868B]'
                      }`}
                    >
                      Website URL
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalysisInputMode('paste')}
                      className={`px-2.5 py-1 rounded-lg ${
                        analysisInputMode === 'paste' ? 'bg-[#FF4500]/20 text-[#FF4500] font-semibold' : 'text-[#86868B]'
                      }`}
                    >
                      Paste Text Directly
                    </button>
                  </div>
                </div>

                {analysisInputMode === 'url' ? (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      placeholder="https://yourcompany.com"
                      value={websiteUrlInput}
                      onChange={(e) => setWebsiteUrlInput(e.target.value)}
                      disabled={isAnalyzingWebsite || !isCompanyAdmin}
                      className="flex-1 bg-white border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500]"
                    />
                    <button
                      type="button"
                      onClick={handleAnalyzeWebsite}
                      disabled={isAnalyzingWebsite || !websiteUrlInput.trim() || !isCompanyAdmin}
                      className="px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0 flex items-center space-x-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{isAnalyzingWebsite ? 'Analyzing Website…' : 'Analyze Website'}</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <textarea
                      rows={4}
                      placeholder="Paste your brochure copy, 'About Us' section, services list, or customer pitch here..."
                      value={pastedTextInput}
                      onChange={(e) => setPastedTextInput(e.target.value)}
                      disabled={isAnalyzingWebsite || !isCompanyAdmin}
                      className="w-full bg-white border border-black/[0.08] rounded-xl p-3 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500]"
                    />
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleAnalyzeWebsite}
                        disabled={isAnalyzingWebsite || !pastedTextInput.trim() || !isCompanyAdmin}
                        className="px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-semibold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50 flex items-center space-x-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isAnalyzingWebsite ? 'Analyzing Text…' : 'Analyze Pasted Text'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {analysisError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-300 space-y-1">
                    <p className="font-semibold flex items-center space-x-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{analysisError}</span>
                    </p>
                    <p className="text-[11px] text-[#86868B]">
                      You can paste your company or brochure text above for immediate, safe analysis without relying on network reachability.
                    </p>
                  </div>
                )}

                {autoFilledFieldsCount > 0 && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>
                        Autonoma suggested and pre-filled <strong>{autoFilledFieldsCount}</strong> profile fields based on your business analysis. All user data was preserved and remains fully editable.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="text-[11px] font-semibold text-emerald-400 hover:underline shrink-0 ml-2"
                    >
                      View Profile →
                    </button>
                  </div>
                )}
              </div>

              {/* Editable "What Autonoma Understands" Structured Section */}
              <div className="space-y-4 pt-2 border-t border-black/[0.08]">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-[#1D1D1F] flex items-center space-x-2">
                      <span>What Autonoma Understands About Your Company</span>
                      {summaryState?.version ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FF4500]/20 text-[#FF4500]">
                          v{summaryState.version}
                        </span>
                      ) : null}
                    </h4>
                    <p className="text-[11px] text-[#86868B]">
                      Editable summary used as strategic background context for every campaign deliverable.
                    </p>
                  </div>

                  {summaryState.confirmedAt && (
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 self-start sm:self-auto">
                      Activated {new Date(summaryState.confirmedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="space-y-3 text-xs">
                  {/* 1. Organisation and Offering */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">
                      1. Organisation and Offering
                    </label>
                    <textarea
                      rows={2}
                      disabled={!isCompanyAdmin}
                      value={summaryState.organizationAndOffering}
                      onChange={(e) => setSummaryState({ ...summaryState, organizationAndOffering: e.target.value })}
                      placeholder="Summary of what the company is and what it provides..."
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl p-2.5 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>

                  {/* 2. Audience */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">
                      2. Target Audience
                    </label>
                    <textarea
                      rows={2}
                      disabled={!isCompanyAdmin}
                      value={summaryState.audience}
                      onChange={(e) => setSummaryState({ ...summaryState, audience: e.target.value })}
                      placeholder="Identified customer personas, demographics and operators..."
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl p-2.5 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>

                  {/* 3. Goals */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">
                      3. Strategic Goals & Conversion Objectives
                    </label>
                    <input
                      type="text"
                      disabled={!isCompanyAdmin}
                      value={summaryState.goals}
                      onChange={(e) => setSummaryState({ ...summaryState, goals: e.target.value })}
                      placeholder="Identified outcomes (leads, registrations, education)..."
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* 4. Voice */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">
                        4. Brand Voice & Tone
                      </label>
                      <input
                        type="text"
                        disabled={!isCompanyAdmin}
                        value={summaryState.voice}
                        onChange={(e) => setSummaryState({ ...summaryState, voice: e.target.value })}
                        placeholder="e.g. Grounded, authoritative, welcoming"
                        className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                      />
                    </div>

                    {/* 5. CTA */}
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">
                        5. Preferred Contact CTA
                      </label>
                      <input
                        type="text"
                        disabled={!isCompanyAdmin}
                        value={summaryState.cta}
                        onChange={(e) => setSummaryState({ ...summaryState, cta: e.target.value })}
                        placeholder="e.g. Book trial lesson, DM for schedule"
                        className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                      />
                    </div>
                  </div>

                  {/* 6. Constraints */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">
                      6. Strict Constraints & Topics to Avoid
                    </label>
                    <input
                      type="text"
                      disabled={!isCompanyAdmin}
                      value={summaryState.constraints}
                      onChange={(e) => setSummaryState({ ...summaryState, constraints: e.target.value })}
                      placeholder="e.g. Never mention discounts, unproven health claims, or third-party brands"
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>

                  {/* 7. Source URLs and Labelled Assumptions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">
                        Source Evidence URLs
                      </label>
                      <input
                        type="text"
                        disabled={!isCompanyAdmin}
                        value={summaryState.sourceUrls?.join(', ') || ''}
                        onChange={(e) => setSummaryState({ 
                          ...summaryState, 
                          sourceUrls: e.target.value.split(',').map(s => s.trim()).filter(Boolean) 
                        })}
                        placeholder="https://..."
                        className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] font-mono text-[11px] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-[#1D1D1F] mb-1">
                        Clearly Labelled Assumptions
                      </label>
                      <input
                        type="text"
                        disabled={!isCompanyAdmin}
                        value={summaryState.assumptions?.join('; ') || ''}
                        onChange={(e) => setSummaryState({ 
                          ...summaryState, 
                          assumptions: e.target.value.split(';').map(s => s.trim()).filter(Boolean) 
                        })}
                        placeholder="[Assumption] Target demographic inferred from..."
                        className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation & Confirmation */}
                <div className="pt-4 border-t border-black/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="px-4 py-2 bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5 self-start sm:self-auto"
                  >
                    <span>Continue to Company Profile (Steps 2–5)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center space-x-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setActiveTab('understanding')}
                      className="px-3.5 py-2 bg-black/[0.04] hover:bg-black/[0.06] text-[#6E6E73] hover:text-[#1D1D1F] text-xs font-medium rounded-xl transition-all"
                    >
                      Review Summary →
                    </button>

                    {isCompanyAdmin && (
                      <button
                        type="button"
                        onClick={handleConfirmContext}
                        disabled={isConfirmingContext || !summaryState.organizationAndOffering.trim()}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-1.5 disabled:opacity-50"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{isConfirmingContext ? 'Activating…' : 'Confirm & Activate Context'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: COMPANY PROFILE (STEPS 2–5)                   */}
          {/* ==================================================== */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="p-3 bg-[#FBFBFD] border border-black/[0.06] rounded-xl text-xs text-[#86868B] flex items-center justify-between">
                <span>Configure your core company profile fields below. All fields remain fully editable.</span>
                <button
                  type="button"
                  onClick={() => setActiveTab('ai_context')}
                  className="text-[11px] text-[#FF4500] hover:underline font-semibold shrink-0 ml-2"
                >
                  ← Back to AI Analysis
                </button>
              </div>

              {/* SECTION 2: Organization Identity */}
              <div className="space-y-3 pt-1">
                <h4 className="text-xs font-bold text-[#1D1D1F] tracking-wide uppercase flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" />
                  <span>Step 2: Organization Identity</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Company Name */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Company / Organisation Name <span className="text-[#FF4500]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isCompanyAdmin}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Bombay Riding Club or Apex Engineering"
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>

                  {/* Organisation Type */}
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Organisation Type <span className="text-[#FF4500]">*</span>
                    </label>
                    <select
                      disabled={!isCompanyAdmin}
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value as OrganizationType)}
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    >
                      <option value="business">Business / Commercial Enterprise</option>
                      <option value="club_community">Club / Community / Association</option>
                      <option value="consultancy">Consultancy / Professional Advisory</option>
                      <option value="nonprofit">Nonprofit / Social Cause / NGO</option>
                      <option value="other">Other Organisation</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: Purpose & Offerings */}
              <div className="space-y-3 pt-3 border-t border-black/[0.06]">
                <h4 className="text-xs font-bold text-[#1D1D1F] tracking-wide uppercase flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" />
                  <span>Step 3: Purpose & Offerings</span>
                </h4>

                {/* Short Description with AI "Improve Description" */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#1D1D1F] flex items-center space-x-1.5">
                      <span>Core Business Purpose & Overview</span>
                      <span className="text-[#FF4500]">*</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      {originalDescBackup !== null && (
                        <button
                          type="button"
                          onClick={handleUndoImprovedDesc}
                          className="text-[11px] text-[#86868B] hover:text-[#1D1D1F] flex items-center space-x-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Undo Improvement</span>
                        </button>
                      )}
                      {isCompanyAdmin && (
                        <button
                          type="button"
                          onClick={handleImproveDescription}
                          disabled={isImprovingDesc || !description.trim()}
                          className="text-[11px] text-[#FF4500] hover:text-[#EA3E00] flex items-center space-x-1 transition-colors disabled:opacity-50 font-medium"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{isImprovingDesc ? 'Improving…' : 'Improve description with AI'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <textarea
                    rows={3}
                    required
                    disabled={!isCompanyAdmin}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide a concise description of your core operations, value proposition, and purpose..."
                    className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl p-3 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                  />

                  {descImproveError && (
                    <p className="text-[11px] text-amber-400">{descImproveError}</p>
                  )}

                  {/* AI Improvement Preview Box */}
                  {descPreview && (
                    <div className="p-3.5 bg-orange-50/60 border border-orange-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#FF4500] flex items-center space-x-1">
                          <Sparkles className="w-3 h-3" />
                          <span>Proposed AI Improvement:</span>
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={handleAcceptImprovedDesc}
                            className="px-2.5 py-1 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-[11px] font-semibold rounded-lg flex items-center space-x-1"
                          >
                            <Check className="w-3 h-3" />
                            <span>Accept</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDescPreview(null)}
                            className="px-2 py-1 text-[#6E6E73] hover:text-[#1D1D1F] text-[11px]"
                          >
                            Discard
                          </button>
                        </div>
                      </div>
                      <p className="text-xs text-[#1D1D1F] leading-relaxed bg-[#FBFBFD] p-2.5 rounded-lg border border-black/[0.06]">
                        {descPreview}
                      </p>
                    </div>
                  )}
                </div>

                {/* Products / Services / Offers */}
                <div>
                  <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                    Products, Services, Activities or Core Offers
                  </label>
                  <input
                    type="text"
                    disabled={!isCompanyAdmin}
                    value={offerings}
                    onChange={(e) => setOfferings(e.target.value)}
                    placeholder="e.g. Horse riding lessons, equestrian livery, trail rides, weekend clinics"
                    className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                  />
                </div>
              </div>

              {/* SECTION 4: Audience & Geography */}
              <div className="space-y-3 pt-3 border-t border-black/[0.06]">
                <h4 className="text-xs font-bold text-[#1D1D1F] tracking-wide uppercase flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" />
                  <span>Step 4: Audience & Geography</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Main Target Audience <span className="text-[#FF4500]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isCompanyAdmin}
                      value={audience}
                      onChange={(e) => setAudience(e.target.value)}
                      placeholder="e.g. Young professionals, equestrian families"
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Main Geography / Region
                    </label>
                    <input
                      type="text"
                      disabled={!isCompanyAdmin}
                      value={geography}
                      onChange={(e) => setGeography(e.target.value)}
                      placeholder="e.g. Pune, Western Maharashtra, India"
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Business Positioning / Stance
                    </label>
                    <input
                      type="text"
                      disabled={!isCompanyAdmin}
                      value={positioning}
                      onChange={(e) => setPositioning(e.target.value)}
                      placeholder="e.g. Premier regional equestrian training facility"
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 5: Growth Goal & Brand Settings */}
              <div className="space-y-3 pt-3 border-t border-black/[0.06]">
                <h4 className="text-xs font-bold text-[#1D1D1F] tracking-wide uppercase flex items-center space-x-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF4500]" />
                  <span>Step 5: Growth Goal & Brand Settings</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Primary Goal <span className="text-[#FF4500]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={!isCompanyAdmin}
                      value={primaryGoal}
                      onChange={(e) => setPrimaryGoal(e.target.value)}
                      placeholder="e.g. Enrol new riders, member retention"
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Preferred Language
                    </label>
                    <input
                      type="text"
                      disabled={!isCompanyAdmin}
                      value={preferredLanguage}
                      onChange={(e) => setPreferredLanguage(e.target.value)}
                      placeholder="English / Marathi / Hindi"
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Timezone
                    </label>
                    <input
                      type="text"
                      disabled={!isCompanyAdmin}
                      value={timezone}
                      onChange={(e) => setTimezone(e.target.value)}
                      placeholder="Asia/Kolkata"
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>
                </div>

                {/* Website & Social Channels */}
                <div className="p-3.5 bg-[#FBFBFD] border border-black/[0.06] rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1D1D1F] flex items-center space-x-1.5">
                      <Globe className="w-3.5 h-3.5 text-[#FF4500]" />
                      <span>Website & Social Profiles</span>
                    </span>
                    <span className="text-[11px] text-[#86868B]">Channels for context analysis</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-[#86868B] mb-1">Official Website</label>
                      <input
                        type="url"
                        disabled={!isCompanyAdmin}
                        value={website}
                        onChange={(e) => {
                          setWebsite(e.target.value);
                          if (!websiteUrlInput) setWebsiteUrlInput(e.target.value);
                        }}
                        placeholder="https://example.com"
                        className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#86868B] mb-1">Instagram Profile</label>
                      <input
                        type="text"
                        disabled={!isCompanyAdmin}
                        value={socialInstagram}
                        onChange={(e) => setSocialInstagram(e.target.value)}
                        placeholder="@handle or full URL"
                        className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#86868B] mb-1">LinkedIn Page</label>
                      <input
                        type="text"
                        disabled={!isCompanyAdmin}
                        value={socialLinkedin}
                        onChange={(e) => setSocialLinkedin(e.target.value)}
                        placeholder="https://linkedin.com/company/..."
                        className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] text-[#86868B] mb-1">YouTube Channel</label>
                      <input
                        type="text"
                        disabled={!isCompanyAdmin}
                        value={socialYoutube}
                        onChange={(e) => setSocialYoutube(e.target.value)}
                        placeholder="https://youtube.com/@channel"
                        className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                      />
                    </div>
                  </div>
                </div>

                {/* Destination CTA & Default WhatsApp Recipient */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Preferred CTA / Contact Destination
                    </label>
                    <input
                      type="text"
                      disabled={!isCompanyAdmin}
                      value={preferredCta}
                      onChange={(e) => setPreferredCta(e.target.value)}
                      placeholder="e.g. Visit our website, DM for trials, or WhatsApp us"
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5 flex items-center justify-between">
                      <span className="flex items-center space-x-1.5">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Default WhatsApp Recipient (Optional)</span>
                      </span>
                    </label>
                    <input
                      type="tel"
                      disabled={!isCompanyAdmin}
                      value={defaultWhatsAppRecipient}
                      onChange={(e) => setDefaultWhatsAppRecipient(e.target.value)}
                      placeholder="+91 98765 43210 (International format)"
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60 font-mono"
                    />
                  </div>
                </div>

                {/* Brand Voice and Topics to Avoid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Brand Voice & Personality
                    </label>
                    <input
                      type="text"
                      disabled={!isCompanyAdmin}
                      value={brandVoice}
                      onChange={(e) => setBrandVoice(e.target.value)}
                      placeholder="e.g. Welcoming, grounded, encouraging, premium without being elitist"
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#1D1D1F] mb-1.5">
                      Claims / Topics to Avoid
                    </label>
                    <input
                      type="text"
                      disabled={!isCompanyAdmin}
                      value={claimsAvoid}
                      onChange={(e) => setClaimsAvoid(e.target.value)}
                      placeholder="e.g. Unverified medical claims, exaggerated discounts, aggressive hype"
                      className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-xl px-3 py-2 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500] disabled:opacity-60"
                    />
                  </div>
                </div>
              </div>

              {/* Save & Navigation Action Bar */}
              <div className="pt-4 border-t border-black/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3">
                <span className="text-[11px] text-[#86868B]">
                  Required: Name, Organisation type, Description, Audience, Primary goal
                </span>
                <div className="flex items-center space-x-2 self-end sm:self-auto">
                  {isCompanyAdmin && (
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>{saving ? 'Saving...' : 'Save Company Profile'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab('understanding')}
                    className="px-3.5 py-2 bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5"
                  >
                    <span>Review Autonoma's Understanding</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ==================================================== */}
          {/* TAB 3: AUTONOMA'S UNDERSTANDING (REVIEW & CONFIRM)   */}
          {/* ==================================================== */}
          {activeTab === 'understanding' && (
            <div className="space-y-5">
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-black/60 via-[#14161B] to-black/60 border border-black/[0.08] rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-[#1D1D1F] tracking-wide uppercase">
                      Autonoma's Understanding
                    </h4>
                    {isContextActive && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Active Context v{summaryState.version || activeCompany.profile?.confirmedContext?.version || 1}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-[#86868B]">
                    Strategic profile synthesized from your website and company inputs. Used by the LLM as background ground-truth for campaign copy.
                  </p>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="px-3 py-1.5 bg-black/[0.04] hover:bg-black/[0.08] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-all border border-black/[0.08] flex items-center space-x-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>

                  {isCompanyAdmin && (
                    <button
                      type="button"
                      onClick={handleConfirmContext}
                      disabled={isConfirmingContext || (!description.trim() && !summaryState.organizationAndOffering.trim())}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-1.5 disabled:opacity-50"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>{isConfirmingContext ? 'Confirming…' : 'Confirm Understanding'}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Clean Summary Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                {/* 1. Business */}
                <div className="p-3.5 rounded-xl bg-[#FBFBFD] border border-black/[0.08] space-y-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#86868B] block">
                    Business / Core Identity
                  </span>
                  <p className="text-[#1D1D1F] text-xs leading-relaxed font-medium">
                    {companyName} ({orgType.replace('_', ' ')})
                  </p>
                  <p className="text-[#86868B] text-[11px] leading-relaxed">
                    {displayValue(description || summaryState.organizationAndOffering, 'No description provided yet.')}
                  </p>
                </div>

                {/* 2. What You Offer */}
                <div className="p-3.5 rounded-xl bg-[#FBFBFD] border border-black/[0.08] space-y-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#86868B] block">
                    What You Offer
                  </span>
                  <p className="text-[#1D1D1F] text-xs leading-relaxed">
                    {displayValue(offerings || summaryState.organizationAndOffering, 'Core products, services and solutions')}
                  </p>
                </div>

                {/* 3. Who You Serve */}
                <div className="p-3.5 rounded-xl bg-[#FBFBFD] border border-black/[0.08] space-y-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#86868B] block">
                    Who You Serve
                  </span>
                  <p className="text-[#1D1D1F] text-xs leading-relaxed">
                    {displayValue(audience || summaryState.audience, 'Target customer personas & community')}
                  </p>
                </div>

                {/* 4. Positioning */}
                <div className="p-3.5 rounded-xl bg-[#FBFBFD] border border-black/[0.08] space-y-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#86868B] block">
                    Positioning
                  </span>
                  <p className="text-[#1D1D1F] text-xs leading-relaxed">
                    {displayValue(positioning || summaryState.positioning, 'Differentiated market stance inferred from offerings')}
                  </p>
                </div>

                {/* 5. Geography */}
                <div className="p-3.5 rounded-xl bg-[#FBFBFD] border border-black/[0.08] space-y-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#86868B] block">
                    Geography
                  </span>
                  <p className="text-[#1D1D1F] text-xs leading-relaxed">
                    {displayValue(geography || summaryState.geography, 'Regional & National')}
                  </p>
                </div>

                {/* 6. Growth Focus */}
                <div className="p-3.5 rounded-xl bg-[#FBFBFD] border border-black/[0.08] space-y-1.5">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#86868B] block">
                    Growth Focus
                  </span>
                  <p className="text-[#1D1D1F] text-xs leading-relaxed">
                    {displayValue(primaryGoal || summaryState.goals, 'Conversion and customer acquisition')}
                  </p>
                </div>

                {/* 7. Communication / Tone */}
                <div className="md:col-span-2 p-3.5 rounded-xl bg-[#FBFBFD] border border-black/[0.08] space-y-2">
                  <span className="text-[10px] font-mono font-semibold uppercase tracking-wider text-[#86868B] block">
                    Communication, Brand Tone & Guardrails
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-[#6E6E73] block">Brand Voice</span>
                      <p className="text-[#1D1D1F] text-[11px] mt-0.5">
                        {displayValue(brandVoice || summaryState.voice, 'Professional, grounded, clear')}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6E6E73] block">Preferred CTA</span>
                      <p className="text-[#1D1D1F] text-[11px] mt-0.5">
                        {displayValue(preferredCta || summaryState.cta, 'Contact directly or visit website')}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#6E6E73] block">Claims to Avoid</span>
                      <p className="text-amber-700 text-[11px] mt-0.5">
                        {displayValue(claimsAvoid || summaryState.constraints, 'No unverified claims or aggressive hype')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Bar */}
              <div className="pt-4 border-t border-black/[0.08] flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveTab('profile')}
                  className="px-3.5 py-2 bg-black/[0.04] hover:bg-black/[0.06] text-[#1D1D1F] text-xs font-semibold rounded-xl transition-all flex items-center space-x-1.5"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Edit Profile Details</span>
                </button>

                {isCompanyAdmin && (
                  <button
                    type="button"
                    onClick={handleConfirmContext}
                    disabled={isConfirmingContext || (!description.trim() && !summaryState.organizationAndOffering.trim())}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md active:scale-95 flex items-center space-x-1.5 disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{isConfirmingContext ? 'Confirming Context…' : 'Confirm Understanding & Activate Context'}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 3: TEAM MEMBERS                                  */}
          {/* ==================================================== */}
          {activeTab === 'members' && (
            <div className="space-y-5">
              {/* Add Member Form (Admins only) */}
              {isCompanyAdmin ? (
                <form onSubmit={handleAddMember} className="p-4 bg-[#F5F5F7] border border-black/[0.06] rounded-xl space-y-3">
                  <h4 className="text-xs font-bold text-[#1D1D1F] flex items-center space-x-1.5">
                    <UserPlus className="w-3.5 h-3.5 text-[#FF4500]" />
                    <span>Invite Team Member</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <input
                        type="email"
                        required
                        placeholder="Email address *"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-lg px-3 py-2 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500]"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="w-full bg-[#FBFBFD] border border-black/[0.08] rounded-lg px-3 py-2 text-xs text-[#1D1D1F] placeholder-[#8E8E93] focus:outline-none focus:border-[#FF4500]"
                      />
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={newRole}
                        onChange={(e) => setNewRole(e.target.value as any)}
                        className="bg-[#FBFBFD] border border-black/[0.08] rounded-lg px-2.5 py-2 text-xs text-[#1D1D1F] focus:outline-none focus:border-[#FF4500]"
                      >
                        <option value="MEMBER">Member</option>
                        <option value="COMPANY_ADMIN">Company Admin</option>
                      </select>

                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-3 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-semibold rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0"
                      >
                        Invite
                      </button>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="p-3 bg-[#FBFBFD] border border-black/[0.06] rounded-xl text-xs text-[#86868B]">
                  Only Company Administrators can invite or modify team members.
                </div>
              )}

              {/* Email Delivery Failure / Access Provisioned Banner */}
              {lastInviteNotice && lastInviteNotice.status !== 'SENT' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-[#1D1D1F]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900">
                        ACCESS PROVISIONED · EMAIL DELIVERY FAILED
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLastInviteNotice(null)}
                      className="text-xs text-[#86868B] hover:text-[#1D1D1F]"
                    >
                      ✕
                    </button>
                  </div>
                  <p className="text-xs text-[#6E6E73]">
                    Automatic invitation email was not delivered. Access has been provisioned. Please share the invite link manually.
                  </p>
                  <div className="flex items-center flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(lastInviteNotice.inviteLink);
                        setCopiedInviteId(lastInviteNotice.membershipId);
                        setTimeout(() => setCopiedInviteId(null), 2000);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/[0.1] rounded-lg text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.04] transition-colors"
                    >
                      {copiedInviteId === lastInviteNotice.membershipId ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy invite link</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResendInvite(lastInviteNotice.membershipId)}
                      disabled={resendingId === lastInviteNotice.membershipId}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/[0.1] rounded-lg text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.04] transition-colors disabled:opacity-50"
                    >
                      {resendingId === lastInviteNotice.membershipId ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF4500]" />
                      ) : (
                        <Send className="w-3.5 h-3.5 text-[#FF4500]" />
                      )}
                      <span>Resend email</span>
                    </button>
                    <a
                      href={`mailto:${lastInviteNotice.email}?subject=${encodeURIComponent(`Join ${activeCompany.name} on Autonoma`)}&body=${encodeURIComponent(`You've been invited to join ${activeCompany.name} on Autonoma.\n\nAccess has been provisioned. Accept your invitation here:\n${lastInviteNotice.inviteLink}`)}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-black/[0.1] rounded-lg text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.04] transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Share manually</span>
                    </a>
                  </div>
                </div>
              )}

              {/* Members List */}
              <div className="space-y-2">
                <div className="text-xs font-mono text-[#86868B] px-1">ACTIVE MEMBERS</div>
                {loading ? (
                  <div className="p-6 text-center text-xs text-[#86868B]">Loading members...</div>
                ) : members.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#86868B]">No members found.</div>
                ) : (
                  <div className="divide-y divide-black/[0.05] border border-black/[0.06] rounded-xl bg-white overflow-hidden">
                    {members.map((mem) => {
                      const isSelf = mem.userId === currentUser.userId || mem.userId === currentUser.id;

                      return (
                        <div key={mem.membershipId || mem.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                          <div className="min-w-0 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-[#1D1D1F] truncate">{mem.userName || 'Member'}</span>
                              {isSelf && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-black/[0.06] text-[#86868B]">
                                  You
                                </span>
                              )}
                              {mem.status === 'SUSPENDED' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-zinc-100 text-zinc-700 border border-zinc-200">
                                  <span>SUSPENDED</span>
                                </span>
                              ) : mem.inviteStatus === 'SENT' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>ACCESS PROVISIONED · EMAIL SENT</span>
                                </span>
                              ) : mem.inviteStatus === 'FAILED' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-red-50 text-red-700 border border-red-200" title={mem.inviteError || 'Delivery failed'}>
                                  <AlertCircle className="w-2.5 h-2.5" />
                                  <span>ACCESS PROVISIONED · EMAIL FAILED</span>
                                </span>
                              ) : mem.inviteStatus === 'PREVIEW_ONLY' ? (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-amber-50 text-amber-700 border border-amber-200" title={mem.inviteError || 'Manual invite required'}>
                                  <AlertCircle className="w-2.5 h-2.5" />
                                  <span>ACCESS PROVISIONED · MANUAL INVITE REQUIRED</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <CheckCircle2 className="w-2.5 h-2.5" />
                                  <span>ACTIVE · LOGGED IN</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[#86868B] text-[11px] truncate">{mem.userEmail}</span>
                              {mem.inviteError && (
                                <span className="text-[10px] text-red-400/90 truncate max-w-xs" title={mem.inviteError}>
                                  ({mem.inviteError})
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                            {isCompanyAdmin && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleCopyInviteLink(mem)}
                                  title="Copy direct onboarding invite link"
                                  className="p-1.5 rounded-lg border border-black/[0.08] hover:bg-black/[0.04] text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
                                >
                                  {copiedInviteId === (mem.membershipId || mem.id) ? (
                                    <span className="flex items-center gap-1 text-emerald-600 font-mono text-[10px]">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Copied</span>
                                    </span>
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleResendInvite(mem.membershipId || mem.id || '')}
                                  disabled={resendingId === (mem.membershipId || mem.id)}
                                  title="Resend transactional invitation email"
                                  className="p-1.5 rounded-lg border border-black/[0.08] hover:bg-black/[0.04] text-[#86868B] hover:text-[#FF4500] transition-colors disabled:opacity-50"
                                >
                                  {resendingId === (mem.membershipId || mem.id) ? (
                                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#FF4500]" />
                                  ) : (
                                    <Send className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </>
                            )}

                            {isCompanyAdmin && !isSelf ? (
                              <>
                                <select
                                  value={mem.role}
                                  onChange={(e) => handleUpdateRole(mem.membershipId || mem.id || '', e.target.value as any)}
                                  className="bg-[#FBFBFD] border border-black/[0.08] rounded-lg px-2 py-1 text-[11px] font-mono text-[#1D1D1F]"
                                >
                                  <option value="MEMBER">Member</option>
                                  <option value="COMPANY_ADMIN">Company Admin</option>
                                </select>

                                <button
                                  onClick={() => handleRemoveMember(mem)}
                                  title="Remove member from company"
                                  className="p-1.5 text-[#86868B] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold ${
                                mem.role === 'COMPANY_ADMIN' ? 'bg-blue-500/20 text-blue-400' : 'bg-black/[0.04] text-[#86868B]'
                              }`}>
                                {mem.role}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
