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

// Component Views
import { Header, AppNavTab } from './components/Header';
import { ContentMasterSheetView } from './components/ContentMasterSheetView';
import { TodaysProductionView } from './components/TodaysProductionView';
import { CampaignsView } from './components/CampaignsView';
import { CampaignDetailView } from './components/CampaignDetailView';
import { DesignSystemView } from './components/DesignSystemView';
import { CreativeStudioView } from './components/CreativeStudioView';
import { CalendarView } from './components/CalendarView';
import { ViralityEngineView } from './components/ViralityEngineView';
import { PublishingOrchestratorView } from './components/PublishingOrchestratorView';

// Modals
import { AiCampaignGeneratorModal } from './components/AiCampaignGeneratorModal';
import { PostDetailModal } from './components/PostDetailModal';
import { ApiKeySettingsModal } from './components/ApiKeySettingsModal';
import { AssetProductionModal } from './components/AssetProductionModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppNavTab>('todays_production');
  
  // Multi-campaign & Assets state loaded from persistent storage
  const [campaigns, setCampaigns] = useState<Campaign[]>(() => loadSavedCampaigns());
  const [assets, setAssets] = useState<SocialAsset[]>(() => loadSavedAssets());
  const [activeCampaignFilter, setActiveCampaignFilter] = useState<string>(() => loadActiveCampaignFilter());
  
  // Drilldown Campaign View state
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);

  // Inspector & Production Modal state
  const [selectedAsset, setSelectedAsset] = useState<SocialAsset | null>(null);
  const [productionModalAsset, setProductionModalAsset] = useState<SocialAsset | null>(null);
  const [studioSelectedAssetId, setStudioSelectedAssetId] = useState<string>(
    () => (assets[0] ? assets[0].id : INITIAL_MONTH_ASSETS[0].id)
  );

  // Modals state
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);

  // API credentials & Webhooks
  const [openaiKey, setOpenaiKey] = useState<string>('');
  const [geminiPaidKey, setGeminiPaidKey] = useState<string>('');
  const [sheetsWebhookUrl, setSheetsWebhookUrl] = useState<string>('');

  // Durable initial load from server operational database & Google Sheets
  useEffect(() => {
    let isMounted = true;
    Promise.all([
      autonomaDataService.loadCampaigns(),
      autonomaDataService.loadAssets(),
      autonomaDataService.loadSettings()
    ]).then(([loadedCampaigns, loadedAssets, settingsInfo]) => {
      if (isMounted) {
        if (loadedCampaigns && loadedCampaigns.length > 0) {
          setCampaigns(loadedCampaigns);
        }
        if (loadedAssets && loadedAssets.length > 0) {
          setAssets(loadedAssets);
        }
        if (settingsInfo?.googleSheetsUrl) {
          setSheetsWebhookUrl(settingsInfo.googleSheetsUrl);
        }
      }
    }).catch(err => {
      console.warn('[Autonoma App] Initial load error, local cache active:', err);
    });
    return () => { isMounted = false; };
  }, []);

  // Persist campaigns whenever they change locally
  useEffect(() => {
    saveCampaigns(campaigns);
  }, [campaigns]);

  // Persist assets whenever they change locally
  useEffect(() => {
    saveAssets(assets);
  }, [assets]);

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

    // 1. Add new campaign to list (never replaces or deletes existing campaigns)
    setCampaigns((prev) => [newCampaign, ...prev]);

    // 2. Add new assets to catalog (all reference campaignId)
    setAssets((prev) => [...newAssets, ...prev]);

    // 3. Set studio selection to first generated asset
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
    downloadCSV(`Apex_Engineering_Content_Master_Sheet_${new Date().toISOString().split('T')[0]}.csv`, csv);
  };

  // Compute filtered assets for views when campaign filter is active
  const filteredAssets = activeCampaignFilter !== 'all'
    ? assets.filter((a) => a.campaignId === activeCampaignFilter)
    : assets;

  const approvedCount = assets.filter((a) => a.status === 'approved' || a.status === 'scheduled' || a.status === 'published').length;

  return (
    <div className="min-h-screen bg-[#F5F5F7] text-[#1D1D1F] flex flex-col font-sans selection:bg-[#FF4500] selection:text-white">
      {/* Universal Navigation Header with Global Campaign Switcher */}
      <Header
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          // If user switches away from campaigns tab, reset viewing campaign
          if (tab !== 'campaigns') {
            setViewingCampaign(null);
          }
        }}
        onOpenAiGenerator={() => setIsAiModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onExportCsv={handleExportCSV}
        assetCount={assets.length}
        approvedCount={approvedCount}
        campaigns={campaigns}
        activeCampaignFilter={activeCampaignFilter}
        onSelectCampaignFilter={handleSelectCampaignFilter}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Active Campaign Filter Banner if filtered */}
        {activeCampaignFilter !== 'all' && activeTab !== 'campaigns' && (
          <div className="mb-6 p-3 bg-white rounded-2xl border border-black/[0.06] shadow-sm flex items-center justify-between text-xs animate-in fade-in duration-200">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#FF4500]" />
              <span className="text-[#6E6E73]">Filtering view by campaign:</span>
              <strong className="text-[#1D1D1F]">
                {campaigns.find(c => c.id === activeCampaignFilter)?.name || activeCampaignFilter}
              </strong>
              <span className="text-[#86868B]">({filteredAssets.length} assets)</span>
            </div>
            <button
              onClick={() => setActiveCampaignFilter('all')}
              className="text-[#FF4500] hover:text-[#EA3E00] font-medium hover:underline text-xs"
            >
              Show all campaigns
            </button>
          </div>
        )}

        {/* 1. Today's Production */}
        {activeTab === 'todays_production' && (
          <TodaysProductionView
            assets={filteredAssets}
            onOpenProductionModal={(a) => setProductionModalAsset(a)}
            onOpenAiGenerator={() => setIsAiModalOpen(true)}
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
              onBack={() => setViewingCampaign(null)}
              onOpenCreateAsset={() => setIsAiModalOpen(true)}
              onSelectAsset={(a) => setSelectedAsset(a)}
              onOpenProductionModal={(a) => setProductionModalAsset(a)}
              onUpdateCampaignStatus={handleUpdateCampaignStatus}
              onNavigateToMasterSheet={handleNavigateToMasterSheetWithFilter}
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
      </main>

      {/* Refined Apple Footer */}
      <footer className="border-t border-black/[0.06] bg-white py-6 text-xs text-[#86868B]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2.5">
            <span className="w-5 h-5 rounded-md bg-[#FF4500] text-white font-bold text-[10px] flex items-center justify-center">
              /\
            </span>
            <span className="text-[#1D1D1F] font-semibold tracking-tight">Apex Autonoma</span>
            <span className="text-[#86868B]">·</span>
            <span>Experience & Systems Engineered</span>
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
    </div>
  );
}
