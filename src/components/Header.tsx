import React, { useState } from 'react';
import { 
  Sparkles, 
  FileSpreadsheet, 
  Layers, 
  Calendar, 
  Palette, 
  TrendingUp, 
  Send, 
  Settings, 
  Download,
  Clock,
  Menu,
  X,
  CheckCircle2,
  FolderKanban,
  Filter
} from 'lucide-react';
import { Campaign } from '../types/campaign';
import { ApexLogo } from './ApexLogo';

export type AppNavTab = 
  | 'todays_production' 
  | 'master_sheet' 
  | 'campaigns' 
  | 'creative_studio' 
  | 'calendar' 
  | 'design_system' 
  | 'virality' 
  | 'publishing';

interface HeaderProps {
  activeTab: AppNavTab;
  setActiveTab: (tab: AppNavTab) => void;
  onOpenAiGenerator: () => void;
  onOpenSettings: () => void;
  onExportCsv: () => void;
  assetCount: number;
  approvedCount: number;
  campaigns: Campaign[];
  activeCampaignFilter: string; // 'all' or campaign.id
  onSelectCampaignFilter: (campaignId: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAiGenerator,
  onOpenSettings,
  onExportCsv,
  assetCount,
  approvedCount,
  campaigns,
  activeCampaignFilter,
  onSelectCampaignFilter,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navGroups = [
    {
      group: 'WORKSPACE',
      items: [
        { id: 'todays_production' as AppNavTab, label: 'Today', icon: Clock, count: null },
        { id: 'master_sheet' as AppNavTab, label: 'Content', icon: FileSpreadsheet, count: assetCount },
        { id: 'calendar' as AppNavTab, label: 'Calendar', icon: Calendar, count: null },
      ]
    },
    {
      group: 'CREATE',
      items: [
        { id: 'campaigns' as AppNavTab, label: 'Campaigns', icon: FolderKanban, count: campaigns.length },
        { id: 'creative_studio' as AppNavTab, label: 'Creative Studio', icon: Layers, count: null },
      ]
    },
    {
      group: 'SYSTEM',
      items: [
        { id: 'design_system' as AppNavTab, label: 'Design System', icon: Palette, count: null },
        { id: 'virality' as AppNavTab, label: 'Virality Engine', icon: TrendingUp, count: null },
        { id: 'publishing' as AppNavTab, label: 'Publishing', icon: Send, count: null },
      ]
    }
  ];

  const selectedCampaignObj = campaigns.find(c => c.id === activeCampaignFilter);

  return (
    <>
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-black/[0.06] text-[#1D1D1F]">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
          {/* Left: Brand Identity & Mobile Menu Toggle */}
          <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 shrink">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 -ml-1 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-xl transition-colors shrink-0"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div 
              onClick={() => setActiveTab('todays_production')}
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group min-w-0"
            >
              <ApexLogo variant="mark" size="md" className="transition-transform group-hover:scale-105 shrink-0" />
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-semibold text-xs sm:text-sm tracking-tight text-[#1D1D1F] truncate">
                    Apex Autonoma
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-black/[0.04] text-[#6E6E73] shrink-0">
                    Pro Ops
                  </span>
                </div>
                <p className="text-[11px] text-[#86868B] hidden md:block truncate">
                  Social Intelligence & Production Studio
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Central Quick Switcher */}
          <nav className="hidden md:flex items-center p-1 bg-black/[0.03] rounded-xl border border-black/[0.04]">
            <button
              onClick={() => setActiveTab('todays_production')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
                activeTab === 'todays_production'
                  ? 'bg-white text-[#1D1D1F] font-medium shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <Clock className={`w-3.5 h-3.5 ${activeTab === 'todays_production' ? 'text-[#FF4500]' : ''}`} />
              <span>Today</span>
            </button>

            <button
              onClick={() => setActiveTab('master_sheet')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
                activeTab === 'master_sheet'
                  ? 'bg-white text-[#1D1D1F] font-medium shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <FileSpreadsheet className={`w-3.5 h-3.5 ${activeTab === 'master_sheet' ? 'text-[#FF4500]' : ''}`} />
              <span>Content</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/[0.05] text-[#6E6E73]">
                {assetCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-white text-[#1D1D1F] font-medium shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <FolderKanban className={`w-3.5 h-3.5 ${activeTab === 'campaigns' ? 'text-[#FF4500]' : ''}`} />
              <span>Campaigns</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-black/[0.05] text-[#6E6E73]">
                {campaigns.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('creative_studio')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
                activeTab === 'creative_studio'
                  ? 'bg-white text-[#1D1D1F] font-medium shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 ${activeTab === 'creative_studio' ? 'text-[#FF4500]' : ''}`} />
              <span>Studio</span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
                activeTab === 'calendar'
                  ? 'bg-white text-[#1D1D1F] font-medium shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${activeTab === 'calendar' ? 'text-[#FF4500]' : ''}`} />
              <span>Calendar</span>
            </button>

            <button
              onClick={() => setActiveTab('design_system')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg transition-all ${
                activeTab === 'design_system'
                  ? 'bg-white text-[#1D1D1F] font-medium shadow-sm'
                  : 'text-[#6E6E73] hover:text-[#1D1D1F]'
              }`}
            >
              <Palette className={`w-3.5 h-3.5 ${activeTab === 'design_system' ? 'text-[#FF4500]' : ''}`} />
              <span>Design</span>
            </button>
          </nav>

          {/* Right: Campaign Switcher & Actions */}
          <div className="flex items-center space-x-2">
            {/* Global Campaign Switcher */}
            <div className="hidden xl:flex items-center space-x-1.5 pr-2">
              <span className="text-[11px] text-[#86868B] font-medium">Filter:</span>
              <select
                value={activeCampaignFilter}
                onChange={(e) => onSelectCampaignFilter(e.target.value)}
                className="text-xs bg-[#F5F5F7] text-[#1D1D1F] font-medium py-1.5 px-2.5 rounded-xl border border-black/[0.04] focus:ring-2 focus:ring-[#FF4500]/20 max-w-[190px] truncate cursor-pointer"
              >
                <option value="all">All Campaigns ({assetCount})</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.campaignCode}: {c.name}
                  </option>
                ))}
              </select>

              {activeCampaignFilter !== 'all' && (
                <button
                  onClick={() => onSelectCampaignFilter('all')}
                  title="Reset filter to all campaigns"
                  className="p-1 text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-lg text-[10px]"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              onClick={onExportCsv}
              title="Export Content Sheet to CSV"
              className="hidden sm:flex items-center space-x-1 px-3 py-1.5 bg-white hover:bg-black/[0.02] border border-black/[0.08] text-xs font-medium text-[#1D1D1F] rounded-xl transition-all shadow-sm active:scale-95"
            >
              <Download className="w-3.5 h-3.5 text-[#6E6E73]" />
              <span>Export</span>
            </button>

            <button
              onClick={onOpenAiGenerator}
              className="flex items-center space-x-1.5 px-2.5 sm:px-3.5 py-1.5 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl transition-all shadow-sm active:scale-95 shrink-0"
              title="Create a new campaign"
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Create campaign</span>
              <span className="sm:hidden">Create</span>
            </button>

            <button
              onClick={onOpenSettings}
              title="Settings & Integrations"
              className="p-2 text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.04] rounded-xl transition-colors active:scale-95 shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Slide-down Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-black/[0.06] bg-white p-4 space-y-4 shadow-xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-top-2 duration-200">
            {/* Mobile Campaign Filter */}
            <div className="space-y-1 pb-3 border-b border-black/[0.04]">
              <label className="text-[11px] font-semibold text-[#86868B] block">
                ACTIVE CAMPAIGN
              </label>
              <select
                value={activeCampaignFilter}
                onChange={(e) => onSelectCampaignFilter(e.target.value)}
                className="w-full text-xs bg-[#F5F5F7] text-[#1D1D1F] font-medium py-2.5 px-3 rounded-xl border-0 focus:ring-2 focus:ring-[#FF4500]/20 cursor-pointer"
              >
                <option value="all">All Campaigns ({assetCount} assets)</option>
                {campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.campaignCode}: {c.name}
                  </option>
                ))}
              </select>
            </div>

            {navGroups.map((group) => (
              <div key={group.group} className="space-y-1">
                <span className="text-[11px] font-semibold text-[#86868B] tracking-wider px-2 block">
                  {group.group}
                </span>
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center space-x-2 px-3 py-2.5 min-h-[44px] rounded-xl text-xs transition-colors ${
                          isActive
                            ? 'bg-orange-50 text-[#FF4500] font-medium'
                            : 'text-[#6E6E73] hover:bg-black/[0.03] hover:text-[#1D1D1F]'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                        {item.count !== null && (
                          <span className="text-[10px] ml-auto opacity-70 shrink-0 font-mono">
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Mobile Export Action */}
            <div className="pt-2 border-t border-black/[0.04]">
              <button
                onClick={() => {
                  onExportCsv();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 bg-[#F5F5F7] hover:bg-black/[0.05] text-xs font-medium text-[#1D1D1F] rounded-xl transition-colors min-h-[44px]"
              >
                <Download className="w-4 h-4 text-[#6E6E73]" />
                <span>Export Content Sheet to CSV</span>
              </button>
            </div>
          </div>
        )}
      </header>
    </>
  );
};
