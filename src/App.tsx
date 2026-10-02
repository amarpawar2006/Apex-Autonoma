import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { SocialAsset, PostStatus, Campaign, CampaignStatus } from './types/campaign';
import { INITIAL_MONTH_ASSETS } from './data/initialCampaigns';
import { exportToGoogleSheetsCSV, downloadCSV } from './services/exportService';
import { 
  loadSavedCampaigns, 
  saveCampaigns, 
  loadSavedAssets, 
  saveAssets, 
  loadActiveCampaignFilter, 
  saveActiveCampaignFilter 
} from './services/campaignService';
import { autonomaDataService } from './services/autonomaDataService';
import { User, Company, UserRole, AuthSessionResponse } from './types/auth';

// Component Views
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header, AppNavTab, CompanyOption } from './components/Header';
import { ApexLogo } from './components/ApexLogo';
import { ContentMasterSheetView } from './components/ContentMasterSheetView';
import { TodaysProductionView } from './components/TodaysProductionView';
import { CampaignsView } from './components/CampaignsView';
import { CampaignDetailView } from './components/CampaignDetailView';
import { DesignSystemView } from './components/DesignSystemView';
import { CreativeStudioView } from './components/CreativeStudioView';
import { CalendarView } from './components/CalendarView';
import { ViralityEngineView } from './components/ViralityEngineView';
import { PublishingOrchestratorView } from './components/PublishingOrchestratorView';
import { ArchiveView } from './components/ArchiveView';

// Auth & Admin Views
import { LoginPage } from './components/auth/LoginPage';
import { AwaitingApprovalView } from './components/auth/AwaitingApprovalView';
import { SuperAdminWorkspace } from './components/admin/SuperAdminWorkspace';
import { CompanyManagementModal } from './components/admin/CompanyManagementModal';
import { CompanySetupChecklist } from './components/CompanySetupChecklist';

// Modals
import { AiCampaignGeneratorModal } from './components/AiCampaignGeneratorModal';
import { PostDetailModal } from './components/PostDetailModal';
import { ApiKeySettingsModal } from './components/ApiKeySettingsModal';
import { AssetProductionModal } from './components/AssetProductionModal';

export default function App() {
  // ==========================================
  // PHASE 2 AUTHENTICATION & MULTI-COMPANY STATE
  // ==========================================
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [session, setSession] = useState<AuthSessionResponse | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [workspaceSwitching, setWorkspaceSwitching] = useState(false);

  // Super Admin administration workspace toggle
  const [isSuperAdminWorkspaceOpen, setIsSuperAdminWorkspaceOpen] = useState<boolean>(false);

  // Company Admin management modal
  const [isCompanyManagementOpen, setIsCompanyManagementOpen] = useState<boolean>(false);
  const [companyManagementInitialTab, setCompanyManagementInitialTab] = useState<'ai_context' | 'profile' | 'understanding' | 'members'>('ai_context');

  // Workspace Navigation Tab
  const [activeTab, setActiveTab] = useState<AppNavTab>('todays_production');
  
  // Multi-campaign & Assets state loaded from persistent storage
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [assets, setAssets] = useState<SocialAsset[]>([]);
  const [activeCampaignFilter, setActiveCampaignFilter] = useState<string>('all');
  
  // Drilldown Campaign View state
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);

  // Inspector & Production Modal state
  const [selectedAsset, setSelectedAsset] = useState<SocialAsset | null>(null);
  const [productionModalAsset, setProductionModalAsset] = useState<SocialAsset | null>(null);
  const [studioSelectedAssetId, setStudioSelectedAssetId] = useState<string>('');

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // API credentials & Webhooks
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [geminiPaidKey, setGeminiPaidKey] = useState<string>('');
  const [sheetsWebhookUrl, setSheetsWebhookUrl] = useState<string>('');

  // Google Sheets connection health status on startup
  const [sheetsHealth, setSheetsHealth] = useState<{
    checked: boolean;
    connected: boolean;
    checking: boolean;
  }>({
    checked: false,
    connected: true,
    checking: false
  });

  // Compute available companies for Header switcher at top level (Rules of Hooks)
  const availableCompanies = React.useMemo<CompanyOption[]>(() => {
    if (session?.memberships && session.memberships.length > 0) {
      const list: CompanyOption[] = session.memberships.map((m) => ({
        id: m.companyId,
        name: m.companyName || m.companyId,
        role: m.role
      }));
      if (activeCompany) {
        const activeId = activeCompany.companyId || activeCompany.id;
        if (activeId && !list.some((c) => c.id === activeId)) {
          list.unshift({
            id: activeId,
            name: activeCompany.name,
            role: userRole || 'MEMBER'
          });
        }
      }
      return list;
    }
    if (activeCompany) {
      return [{
        id: activeCompany.companyId || activeCompany.id || '',
        name: activeCompany.name,
        role: userRole || 'MEMBER'
      }];
    }
    return [];
  }, [session?.memberships, activeCompany, userRole]);

  const checkSheetsConnection = async () => {
    setSheetsHealth((prev) => ({ ...prev, checking: true }));
    try {
      const health = await autonomaDataService.checkHealth();
      const isConnected = Boolean(health?.googleSheets?.connected);
      setSheetsHealth({
        checked: true,
        connected: isConnected,
        checking: false
      });
    } catch {
      setSheetsHealth({
        checked: true,
        connected: false,
        checking: false
      });
    }
  };

  // Restore session across devices on startup
  const restoreSession = async () => {
    setAuthChecking(true);
    try {
      const res = await autonomaDataService.getCurrentSession();
      if (res.success && res.user) {
        setSession(res);
        setCurrentUser(res.user);
        setActiveCompany(res.activeCompany || null);
        setUserRole(res.role || (res.user.isSuperAdmin ? 'SUPER_ADMIN' : 'MEMBER'));

        if (res.user.isSuperAdmin && !res.activeCompany) {
          setIsSuperAdminWorkspaceOpen(true);
        } else if (res.activeCompany) {
          await loadCompanyData();
        }
      } else {
        setSession(null);
        setCurrentUser(null);
        setActiveCompany(null);
        setUserRole(null);
      }
    } catch {
      setSession(null);
    } finally {
      setAuthChecking(false);
    }
  };

  const loadCompanyData = async () => {
    checkSheetsConnection();
    try {
      const [loadedCampaigns, loadedAssets, settingsInfo] = await Promise.all([
        autonomaDataService.loadCampaigns(),
        autonomaDataService.loadAssets(),
        autonomaDataService.loadSettings()
      ]);

      const campList = Array.isArray(loadedCampaigns) ? loadedCampaigns : [];
      const assetList = Array.isArray(loadedAssets) ? loadedAssets : [];

      setCampaigns(campList);
      setAssets(assetList);

      if (assetList.length > 0) {
        setStudioSelectedAssetId(assetList[0].id);
      }

      if (settingsInfo?.settings?.openaiApiKey) setOpenaiKey(settingsInfo.settings.openaiApiKey);
      if (settingsInfo?.settings?.geminiApiKey) setGeminiPaidKey(settingsInfo.settings.geminiApiKey);
      if (settingsInfo?.googleSheetsUrl) setSheetsWebhookUrl(settingsInfo.googleSheetsUrl);
    } catch (err) {
      console.warn('[Autonoma App] Failed to load company data:', err);
    }
  };

  useEffect(() => {
    restoreSession();
  }, []);

  const handleLoginSuccess = (authRes: AuthSessionResponse) => {
    setSession(authRes);
    setCurrentUser(authRes.user || null);
    setActiveCompany(authRes.activeCompany || null);
    setUserRole(authRes.role || (authRes.user?.isSuperAdmin ? 'SUPER_ADMIN' : 'MEMBER'));

    if (authRes.user?.isSuperAdmin) {
      setIsSuperAdminWorkspaceOpen(true);
    } else {
      setIsSuperAdminWorkspaceOpen(false);
    }

    if (authRes.activeCompany) {
      loadCompanyData();
    }
  };

  const handleAwaitingApproval = (pendingRes: AuthSessionResponse) => {
    setSession(pendingRes);
    setCurrentUser(pendingRes.user || null);
    setActiveCompany(null);
    setUserRole(null);
    setIsSuperAdminWorkspaceOpen(false);
  };

  const handleSignOut = async () => {
    await autonomaDataService.logout();
    setSession(null);
    setCurrentUser(null);
    setActiveCompany(null);
    setUserRole(null);
    setIsSuperAdminWorkspaceOpen(false);
    setIsCompanyManagementOpen(false);
    setCampaigns([]);
    setAssets([]);
  };

  const handleSwitchCompany = async (companyId: string) => {
    if (!companyId || workspaceSwitching) return;
    const currentCompanyId = activeCompany?.companyId || activeCompany?.id;
    if (currentCompanyId === companyId) {
      setIsSuperAdminWorkspaceOpen(false);
      return;
    }

    setWorkspaceSwitching(true);
    try {
      const res = await autonomaDataService.switchCompany(companyId);
      if (!res.success || !res.activeCompany) {
        throw new Error(res.error || 'Workspace switch failed');
      }

      const normalizedCompany: Company = {
        ...res.activeCompany,
        id: res.activeCompany.companyId || res.activeCompany.id,
        companyId: res.activeCompany.companyId || res.activeCompany.id,
      };

      setActiveCompany(normalizedCompany);
      if (res.role) setUserRole(res.role);
      setSession(prev => prev ? {
        ...prev,
        activeCompany: normalizedCompany,
        role: res.role || prev.role,
        memberships: (res as any).memberships || prev.memberships
      } : prev);
      setActiveCampaignFilter('all');
      setSelectedAsset(null);
      setProductionModalAsset(null);
      setStudioSelectedAssetId('');
      setViewingCampaign(null);
      setIsSuperAdminWorkspaceOpen(false);

      await loadCompanyData();
    } catch (err) {
      console.error('Failed to switch company:', err);
    } finally {
      setWorkspaceSwitching(false);
    }
  };

  // Persist campaigns whenever they change locally (only when non-empty to prevent clearing cache during switches)
  useEffect(() => {
    if (activeCompany && campaigns.length > 0) {
      saveCampaigns(campaigns);
    }
  }, [campaigns, activeCompany]);

  // Persist assets whenever they change locally (only when non-empty)
  useEffect(() => {
    if (activeCompany && assets.length > 0) {
      saveAssets(assets);
    }
  }, [assets, activeCompany]);

  // Persist filter whenever it changes
  useEffect(() => {
    saveActiveCampaignFilter(activeCampaignFilter);
  }, [activeCampaignFilter]);

  // Handle status update
  const handleUpdateStatus = (id: string, newStatus: PostStatus) => {
    let updatedTarget: SocialAsset | undefined;
    setAssets((prev) => {
      const next = prev.map((a) => {
        if (a.id === id) {
          updatedTarget = { ...a, status: newStatus };
          return updatedTarget;
        }
        return a;
      });
      return next;
    });

    if (updatedTarget) {
      autonomaDataService.updateAsset(updatedTarget);
    }

    if (newStatus === 'approved' || newStatus === 'published') {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
          colors: ['#FF4500', '#FFFFFF', '#14161B']
        });
      } catch (e) {
        // ignore
      }
    }
  };

  // Update single asset in state (production status, generated media, etc.)
  const handleUpdateAsset = (updatedAsset: SocialAsset) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === updatedAsset.id ? updatedAsset : a))
    );
    autonomaDataService.updateAsset(updatedAsset);

    if (productionModalAsset && productionModalAsset.id === updatedAsset.id) {
      setProductionModalAsset(updatedAsset);
    }
    if (selectedAsset && selectedAsset.id === updatedAsset.id) {
      setSelectedAsset(updatedAsset);
    }
  };

  // Update campaign status
  const handleUpdateCampaignStatus = (campaignId: string, newStatus: CampaignStatus) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === campaignId ? { ...c, status: newStatus, updatedAt: new Date().toISOString() } : c))
    );
    autonomaDataService.updateCampaign(campaignId, { status: newStatus });

    if (viewingCampaign && viewingCampaign.id === campaignId) {
      setViewingCampaign((prev) => prev ? { ...prev, status: newStatus, updatedAt: new Date().toISOString() } : null);
    }
  };

  // Handle newly synthesized Campaign and its assets
  const handleCampaignCreated = (result: { campaign: Campaign; assets: SocialAsset[] }) => {
    const { campaign: newCampaign, assets: newAssets } = result;

    setCampaigns((prev) => [newCampaign, ...prev]);
    setAssets((prev) => [...newAssets, ...prev]);

    setActiveCampaignFilter(newCampaign.id);
    setViewingCampaign(newCampaign);
    setActiveTab('campaigns');

    if (newAssets.length > 0) {
      setStudioSelectedAssetId(newAssets[0].id);
    }

    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#FF4500', '#10B981', '#FFFFFF']
      });
    } catch (e) {
      // ignore
    }
  };

  // Open asset directly in Creative Studio
  const handleOpenStudioWithAsset = (assetId: string) => {
    setStudioSelectedAssetId(assetId);
    setActiveTab('creative_studio');
  };

  // Switch campaign filter
  const handleSelectCampaignFilter = (campaignId: string) => {
    setActiveCampaignFilter(campaignId);
  };

  // Navigate to Master Sheet filtered by a specific campaign
  const handleNavigateToMasterSheetWithFilter = (campaignId: string) => {
    setActiveCampaignFilter(campaignId);
    setActiveTab('master_sheet');
  };

  // Select campaign for drilldown detail view
  const handleSelectCampaignDetail = (campaign: Campaign) => {
    setViewingCampaign(campaign);
    setActiveTab('campaigns');
  };

  // Export full CSV
  const handleExportCSV = () => {
    const csv = exportToGoogleSheetsCSV(assets);
    const companySlug = activeCompany?.name?.toLowerCase().replace(/[^a-z0-9]+/g, '_') || 'company';
    downloadCSV(`${companySlug}_content_master_sheet_${new Date().toISOString().split('T')[0]}.csv`, csv);
  };

  // Compute filtered assets for views when campaign filter is active
  const filteredAssets = activeCampaignFilter !== 'all'
    ? assets.filter((a) => a.campaignId === activeCampaignFilter)
    : assets;

  const approvedCount = assets.filter((a) => a.status === 'approved' || a.status === 'scheduled' || a.status === 'published').length;
  const archivedCount = assets.filter((a) => a.isArchived).length;

  // ==========================================
  // ROUTING & ACCESS CONTROL RENDERING
  // ==========================================

  // 1. Loading screen during session restoration
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#0A0B0E] text-white flex flex-col items-center justify-center space-y-4">
        <ApexLogo variant="lockup" size="lg" />
        <div className="flex items-center space-x-2 text-xs text-[#86868B] font-mono">
          <div className="w-3.5 h-3.5 border-2 border-[#FF4500] border-t-transparent rounded-full animate-spin" />
          <span>Restoring verified session...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated -> Show common login page
  if (!session || !currentUser) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onAwaitingApproval={handleAwaitingApproval}
      />
    );
  }

  // 3. New signup awaiting approval -> Show AwaitingApprovalView
  if (session.status === 'PENDING' || session.status === 'REJECTED' || (!activeCompany && !currentUser.isSuperAdmin)) {
    return (
      <AwaitingApprovalView
        session={session}
        onSignOut={handleSignOut}
        onRefreshStatus={restoreSession}
      />
    );
  }

  // 4. Super Admin in administration workspace
  if (currentUser.isSuperAdmin && isSuperAdminWorkspaceOpen) {
    return (
      <SuperAdminWorkspace
        currentUser={currentUser}
        onEnterCompanyWorkspace={(companyId) => {
          handleSwitchCompany(companyId);
        }}
        onSignOut={handleSignOut}
      />
    );
  }

  // 5. Permitted Company Workspace (Company Admin, Member, or Super Admin inside company)
  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#FF4500] selection:text-white">
      {workspaceSwitching && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#090A0D]/45 backdrop-blur-[2px]">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.1] bg-[#111318] px-5 py-3 text-xs font-medium text-white shadow-2xl">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#FF4500] border-t-transparent" />
            Switching workspace…
          </div>
        </div>
      )}
      {/* Universal Navigation Header with Global Campaign Switcher & Auth Identity */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab !== 'campaigns') {
            setViewingCampaign(null);
          }
        }}
        onOpenAiGenerator={() => setIsAiModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onExportCsv={handleExportCSV}
        assetCount={assets.length}
        approvedCount={approvedCount}
        archivedCount={archivedCount}
        campaigns={campaigns}
        activeCampaignFilter={activeCampaignFilter}
        onSelectCampaignFilter={handleSelectCampaignFilter}
        currentUser={currentUser}
        activeCompany={activeCompany}
        userRole={userRole}
        onSignOut={handleSignOut}
        onOpenCompanyManagement={() => {
          setCompanyManagementInitialTab('profile');
          setIsCompanyManagementOpen(true);
        }}
        onOpenSuperAdminWorkspace={() => setIsSuperAdminWorkspaceOpen(true)}
        availableCompanies={availableCompanies}
        onSwitchCompany={handleSwitchCompany}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-5 sm:py-8">
        {/* Startup Connection Health Warning (Non-blocking) */}
        {sheetsHealth.checked && !sheetsHealth.connected && (
          <div className="mb-4 p-3 sm:p-3.5 bg-amber-50 rounded-2xl border border-amber-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs text-amber-900 animate-in fade-in duration-200">
            <div className="flex items-center space-x-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
              <span className="font-semibold text-amber-950 shrink-0">Google Sheets connection unavailable</span>
              <span className="hidden sm:inline text-amber-800 text-[11px] truncate">
                — Operations will persist to server database. Reconnect to resume Sheets sync.
              </span>
            </div>
            <button
              onClick={checkSheetsConnection}
              disabled={sheetsHealth.checking}
              className="px-3 py-1 bg-white hover:bg-amber-100/60 border border-amber-300 text-amber-900 font-semibold rounded-xl text-[11px] transition-colors shrink-0 disabled:opacity-50 self-start sm:self-auto"
            >
              {sheetsHealth.checking ? 'Checking…' : 'RETRY CONNECTION'}
            </button>
          </div>
        )}

        {/* Resumable "Complete Company Setup" Checklist for Incomplete Profiles */}
        {activeCompany && (
          <div className="mb-6">
            <CompanySetupChecklist
              company={activeCompany}
              canEdit={userRole === 'COMPANY_ADMIN' || currentUser?.isSuperAdmin}
              onOpenSetup={(targetTab) => {
                setCompanyManagementInitialTab(targetTab || 'ai_context');
                setIsCompanyManagementOpen(true);
              }}
            />
          </div>
        )}

        {/* 1. Today's Production */}
        {activeTab === 'todays_production' && (
          <TodaysProductionView
            assets={assets}
            campaigns={campaigns}
            companyName={activeCompany?.name}
            defaultWhatsAppRecipient={activeCompany?.profile?.defaultWhatsAppRecipient}
            activeCampaignFilter={activeCampaignFilter}
            onOpenProductionModal={(a) => setProductionModalAsset(a)}
            onOpenAiGenerator={() => setIsAiModalOpen(true)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* 2. Content Master Sheet */}
        {activeTab === 'master_sheet' && (
          <ContentMasterSheetView
            assets={assets}
            onSelectAsset={(a) => setSelectedAsset(a)}
            onUpdateStatus={handleUpdateStatus}
            onOpenAiGenerator={() => setIsAiModalOpen(true)}
            onOpenProductionModal={(a) => setProductionModalAsset(a)}
            campaigns={campaigns}
            selectedCampaignId={activeCampaignFilter}
            onSelectCampaignFilter={handleSelectCampaignFilter}
          />
        )}

        {/* 3. Campaigns Workspace / Detail View */}
        {activeTab === 'campaigns' && (
          viewingCampaign ? (
            <CampaignDetailView
              campaign={viewingCampaign}
              assets={assets}
              companyName={activeCompany?.name}
              defaultWhatsAppRecipient={activeCompany?.profile?.defaultWhatsAppRecipient}
              onBack={() => setViewingCampaign(null)}
              onOpenCreateAsset={() => setIsAiModalOpen(true)}
              onSelectAsset={(a) => setSelectedAsset(a)}
              onOpenProductionModal={(a) => setProductionModalAsset(a)}
              onUpdateCampaignStatus={handleUpdateCampaignStatus}
              onNavigateToMasterSheet={handleNavigateToMasterSheetWithFilter}
              onUpdateStatus={handleUpdateStatus}
            />
          ) : (
            <CampaignsView
              campaigns={campaigns}
              assets={assets}
              onOpenCreateCampaign={() => setIsAiModalOpen(true)}
              onSelectCampaign={handleSelectCampaignDetail}
              onFilterByCampaign={handleNavigateToMasterSheetWithFilter}
              onUpdateCampaignStatus={handleUpdateCampaignStatus}
            />
          )
        )}

        {/* 4. Creative Studio */}
        {activeTab === 'creative_studio' && (
          <CreativeStudioView
            assets={filteredAssets}
            onUpdateStatus={handleUpdateStatus}
            selectedAssetId={studioSelectedAssetId}
          />
        )}

        {/* 5. Calendar */}
        {activeTab === 'calendar' && (
          <CalendarView
            assets={filteredAssets}
            onSelectAsset={(a) => setSelectedAsset(a)}
            onUpdateStatus={handleUpdateStatus}
          />
        )}

        {/* 6. Design System */}
        {activeTab === 'design_system' && (
          <DesignSystemView />
        )}

        {/* 7. Virality Engine */}
        {activeTab === 'virality' && (
          <ViralityEngineView />
        )}

        {/* 8. Publishing Orchestrator */}
        {activeTab === 'publishing' && (
          <PublishingOrchestratorView
            assets={assets}
          />
        )}

        {/* 9. Archive View */}
        {activeTab === 'archive' && (
          <ArchiveView
            assets={assets}
            campaigns={campaigns}
            onRestoreAsset={async (assetId: string) => {
              const restored = await autonomaDataService.restoreAsset(assetId);
              setAssets(prev => prev.map(a => a.id === assetId ? restored : a));
            }}
            onDeleteAssetPermanently={async (assetId: string) => {
              await autonomaDataService.deleteAssetPermanently(assetId);
              setAssets(prev => prev.filter(a => a.id !== assetId));
            }}
            onRestoreCampaign={async (campId: string) => {
              const restored = await autonomaDataService.restoreCampaign(campId);
              setCampaigns(prev => prev.map(c => c.id === campId ? restored : c));
            }}
            onDeleteCampaignPermanently={async (campId: string) => {
              await autonomaDataService.deleteCampaignPermanently(campId);
              setCampaigns(prev => prev.filter(c => c.id !== campId));
              setAssets(prev => prev.filter(a => a.campaignId !== campId));
            }}
          />
        )}
      </main>

      {/* Refined Apple Footer */}
      <footer className="border-t border-black/[0.06] bg-white py-6 text-xs text-[#86868B]">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <ApexLogo variant="mark" size="sm" />
            <span className="text-[#1D1D1F] font-semibold tracking-tight">Apex Autonoma</span>
            <span className="text-[#86868B]">·</span>
            <span>{activeCompany ? activeCompany.name : 'Systems Engineered'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span>Pune, India · Working Globally</span>
            <a 
              href="https://apex-engineering.co.in" 
              target="_blank" 
              rel="noreferrer" 
              className="text-[#FF4500] hover:underline font-medium"
            >
              apex-engineering.co.in ↗
            </a>
          </div>
        </div>
      </footer>

      {/* Deep-Dive Post Inspector Modal */}
      {selectedAsset && (
        <PostDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onUpdateStatus={handleUpdateStatus}
          onOpenStudioWithAsset={handleOpenStudioWithAsset}
          onOpenProductionModal={(a) => setProductionModalAsset(a)}
        />
      )}

      {/* Redesigned AI Campaign Generator Modal */}
      <AiCampaignGeneratorModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        onCampaignCreated={handleCampaignCreated}
        onViewCampaignDetail={(c) => {
          setActiveTab('campaigns');
          setViewingCampaign(c);
        }}
      />

      {/* Settings Modal */}
      <ApiKeySettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        openaiKey={openaiKey}
        setOpenaiKey={setOpenaiKey}
        geminiPaidKey={geminiPaidKey}
        setGeminiPaidKey={setGeminiPaidKey}
        sheetsWebhookUrl={sheetsWebhookUrl}
        setSheetsWebhookUrl={setSheetsWebhookUrl}
        onDataRefreshed={(refreshedCampaigns, refreshedAssets) => {
          if (Array.isArray(refreshedCampaigns) && refreshedCampaigns.length > 0) {
            setCampaigns(refreshedCampaigns);
          }
          if (Array.isArray(refreshedAssets) && refreshedAssets.length > 0) {
            setAssets(refreshedAssets);
          }
        }}
      />

      {/* Asset-Level Media Production Drawer / Modal */}
      {productionModalAsset && (
        <AssetProductionModal
          asset={productionModalAsset}
          isOpen={Boolean(productionModalAsset)}
          onClose={() => setProductionModalAsset(null)}
          onUpdateAsset={handleUpdateAsset}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          customApiKey={geminiPaidKey}
        />
      )}

      {/* Company Admin Team & Settings Management Modal */}
      {activeCompany && currentUser && (
        <CompanyManagementModal
          isOpen={isCompanyManagementOpen}
          onClose={() => setIsCompanyManagementOpen(false)}
          activeCompany={activeCompany}
          currentUser={currentUser}
          currentUserRole={userRole || 'MEMBER'}
          initialTab={companyManagementInitialTab}
          onCompanyUpdated={(updated) => {
            setActiveCompany(updated);
          }}
        />
      )}
    </div>
  );
}
