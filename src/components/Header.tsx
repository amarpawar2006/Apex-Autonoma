import React, { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  Building2,
  Calendar,
  Check,
  ChevronDown,
  Clock3,
  Download,
  FileSpreadsheet,
  FolderKanban,
  Layers,
  LogOut,
  Menu,
  MoreHorizontal,
  Palette,
  Plus,
  Send,
  Settings,
  ShieldCheck,
  TrendingUp,
  Users,
  X,
  Sparkles,
  Compass,
  HelpCircle
} from 'lucide-react';
import { Campaign } from '../types/campaign';
import { Company, User, UserRole } from '../types/auth';
import { ApexLogo } from './ApexLogo';

export type AppNavTab =
  | 'todays_production'
  | 'master_sheet'
  | 'campaigns'
  | 'creative_studio'
  | 'calendar'
  | 'design_system'
  | 'virality'
  | 'publishing'
  | 'archive';

export interface CompanyOption {
  id: string;
  name: string;
  role?: string;
  organizationType?: string;
}

export interface HeaderProps {
  activeTab: AppNavTab;
  setActiveTab: (tab: AppNavTab) => void;
  onOpenAiGenerator: () => void;
  onOpenSettings: () => void;
  onExportCsv: () => void;
  assetCount: number;
  approvedCount: number;
  archivedCount?: number;
  campaigns: Campaign[];
  activeCampaignFilter: string;
  onSelectCampaignFilter: (campaignId: string) => void;
  currentUser?: User | null;
  activeCompany?: Company | null;
  userRole?: UserRole | null;
  onSignOut?: () => void;
  onOpenCompanyManagement?: () => void;
  onOpenSuperAdminWorkspace?: () => void;
  availableCompanies?: CompanyOption[];
  onSwitchCompany?: (companyId: string) => void | Promise<void>;
  guidedHelpEnabled?: boolean;
  onToggleGuidedHelp?: () => void;
  onOpenHelp?: () => void;
  uiBlocked?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenAiGenerator,
  onOpenSettings,
  onExportCsv,
  assetCount,
  archivedCount,
  campaigns = [],
  activeCampaignFilter = 'all',
  onSelectCampaignFilter,
  currentUser,
  activeCompany,
  userRole,
  onSignOut,
  onOpenCompanyManagement,
  onOpenSuperAdminWorkspace,
  availableCompanies = [],
  onSwitchCompany,
  guidedHelpEnabled,
  onToggleGuidedHelp,
  onOpenHelp,
  uiBlocked = false
}) => {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switchingCompanyId, setSwitchingCompanyId] = useState<string | null>(null);

  useEffect(() => {
    if (uiBlocked) {
      setWorkspaceOpen(false);
      setMoreOpen(false);
      setAccountOpen(false);
      setMobileOpen(false);
    }
  }, [uiBlocked]);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-autonoma-menu]')) {
        setWorkspaceOpen(false);
        setMoreOpen(false);
        setAccountOpen(false);
      }
    };
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  const primary = [
    { id: 'todays_production' as AppNavTab, label: 'Today', icon: Clock3 },
    { id: 'campaigns' as AppNavTab, label: 'Campaigns', icon: FolderKanban },
    { id: 'master_sheet' as AppNavTab, label: 'Content', icon: FileSpreadsheet },
    { id: 'calendar' as AppNavTab, label: 'Calendar', icon: Calendar },
    { id: 'design_system' as AppNavTab, label: 'Brand', icon: Palette },
    { id: 'creative_studio' as AppNavTab, label: 'Studio', icon: Layers }
  ];

  const secondary = [
    { id: 'virality' as AppNavTab, label: 'Growth Mechanics', icon: TrendingUp },
    { id: 'publishing' as AppNavTab, label: 'Publishing', icon: Send },
    { id: 'archive' as AppNavTab, label: 'Archive', icon: Archive, count: archivedCount || 0 }
  ];

  const activeCompanyId = activeCompany?.companyId || activeCompany?.id || '';

  const companies = useMemo<CompanyOption[]>(() => {
    const list = availableCompanies && availableCompanies.length > 0
      ? [...availableCompanies]
      : [];

    if (activeCompany && activeCompanyId && !list.some((c) => c.id === activeCompanyId)) {
      list.unshift({
        id: activeCompanyId,
        name: activeCompany.name,
        role: userRole || 'MEMBER'
      });
    }

    if (list.length === 0 && activeCompany) {
      return [
        {
          id: activeCompanyId,
          name: activeCompany.name,
          role: userRole || 'MEMBER'
        }
      ];
    }
    return list;
  }, [availableCompanies, activeCompanyId, activeCompany, userRole]);

  const canManage = userRole === 'COMPANY_ADMIN' || Boolean(currentUser?.isSuperAdmin);

  const filterRelevant = [
    'todays_production',
    'campaigns',
    'master_sheet',
    'creative_studio',
    'calendar'
  ].includes(activeTab);

  const selectedCampaign = (campaigns || []).find((c) => c.id === activeCampaignFilter);

  const switchWorkspace = async (companyId: string) => {
    if (
      !onSwitchCompany ||
      !companyId ||
      companyId === activeCompanyId ||
      switchingCompanyId
    )
      return;

    setSwitchingCompanyId(companyId);

    try {
      await onSwitchCompany(companyId);
      setWorkspaceOpen(false);
      setMobileOpen(false);
    } finally {
      setSwitchingCompanyId(null);
    }
  };

  const selectTab = (tab: AppNavTab) => {
    setActiveTab(tab);
    setMoreOpen(false);
    setMobileOpen(false);
  };

  return (
    <div className="sticky top-0 z-[100] w-full select-none overflow-visible">
      {/* Light-First Clean Header Shell */}
      <header className="border-b border-black/[0.07] bg-white/95 text-[#1D1D1F] shadow-2xs backdrop-blur-xl transition-colors">
        <div className="mx-auto flex h-15 sm:h-16 max-w-[1500px] items-center gap-2 sm:gap-3 px-3.5 sm:px-5 lg:px-7">
          
          {/* Mobile Menu Hamburger */}
          <button
            className="rounded-xl p-2 text-[#6E6E73] hover:bg-black/[0.04] hover:text-[#1D1D1F] md:hidden transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle navigation menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          {/* Autonoma Home Branding */}
          <button
            onClick={() => selectTab('todays_production')}
            className="flex shrink-0 items-center gap-2.5 transition-transform active:scale-95"
            title="Autonoma home"
          >
            <ApexLogo variant="mark" size="sm" />
            <span className="hidden text-[13px] font-bold tracking-[0.06em] text-[#1D1D1F] sm:block">
              AUTONOMA
            </span>
          </button>

          <div className="hidden h-5 w-px bg-black/[0.08] sm:block mx-0.5" />

          {/* Workspace Switcher */}
          <div className="relative min-w-0" data-autonoma-menu>
            <button
              disabled={uiBlocked}
              onClick={() => {
                if (uiBlocked) return;
                setWorkspaceOpen((v) => !v);
                setMoreOpen(false);
                setAccountOpen(false);
              }}
              aria-haspopup="menu"
              aria-expanded={workspaceOpen}
              aria-label="Switch company workspace"
              className="flex max-w-[170px] sm:max-w-[240px] items-center gap-2 rounded-xl border border-black/[0.08] bg-black/[0.025] hover:bg-black/[0.05] px-2.5 py-1.5 text-left transition-all shadow-2xs"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0 text-[#FF4500]" />

              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold text-[#1D1D1F]">
                  {activeCompany?.name || 'Choose workspace'}
                </div>
                <div className="hidden truncate text-[9px] text-[#86868B] lg:block">
                  {userRole || 'Workspace'}
                </div>
              </div>

              <ChevronDown
                className={`ml-auto h-3 w-3 shrink-0 text-[#86868B] transition-transform ${
                  workspaceOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {workspaceOpen && (
              <div role="menu" aria-label="Company workspaces" className="absolute left-0 top-full mt-2 w-[310px] overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-xl z-[120] animate-in fade-in zoom-in-95 duration-100">
                <div className="border-b border-black/[0.05] px-4 py-3 bg-[#FBFBFD]">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#86868B]">
                    Switch workspace
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#1D1D1F]">
                    Your ventures and assigned brands
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto p-1.5 space-y-0.5">
                  {companies.map((company) => {
                    const active = company.id === activeCompanyId;
                    const switching = switchingCompanyId === company.id;

                    return (
                      <button
                        key={company.id}
                        disabled={Boolean(switchingCompanyId)}
                        onClick={() => switchWorkspace(company.id)}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                          active
                            ? 'bg-[#FF4500]/[0.08] text-[#1D1D1F]'
                            : 'hover:bg-black/[0.04] text-[#4A4A4F]'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            active ? 'bg-[#FF4500] text-white' : 'bg-black/[0.04] text-[#6E6E73]'
                          }`}
                        >
                          <Building2 className="h-4 w-4" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className={`truncate text-xs ${active ? 'font-semibold text-[#1D1D1F]' : 'text-[#333]'}`}>
                            {company.name}
                          </div>
                          <div className="mt-0.5 text-[9px] text-[#86868B]">
                            {company.organizationType || company.role || 'Workspace'}
                          </div>
                        </div>

                        {switching ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#FF4500] border-t-transparent" />
                        ) : active ? (
                          <Check className="h-3.5 w-3.5 text-[#FF4500]" />
                        ) : null}
                      </button>
                    );
                  })}

                  {!companies.length && (
                    <div className="px-3 py-7 text-center text-[11px] text-[#86868B]">
                      No workspaces available.
                    </div>
                  )}
                </div>

                {canManage && onOpenCompanyManagement && (
                  <div className="border-t border-black/[0.06] p-1.5 bg-[#FBFBFD]">
                    <button
                      onClick={() => {
                        onOpenCompanyManagement();
                        setWorkspaceOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#6E6E73] hover:bg-black/[0.04] hover:text-[#1D1D1F] transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 text-[#FF4500]" />
                      <span>Company setup & team</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Desktop Primary Nav Tabs */}
          <nav className="mx-auto hidden items-center gap-1 rounded-xl border border-black/[0.06] bg-black/[0.02] p-1 md:flex">
            {primary.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeTab;

              return (
                <button
                  key={item.id}
                  onClick={() => selectTab(item.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition lg:px-3 ${
                    active
                      ? 'bg-white text-[#1D1D1F] shadow-2xs font-semibold'
                      : 'text-[#6E6E73] hover:bg-white/60 hover:text-[#1D1D1F]'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? 'text-[#FF4500]' : ''}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Actions & Utilities Right Bar */}
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            
            {/* Contextual Help */}
            {onOpenHelp && (
              <button
                onClick={onOpenHelp}
                disabled={uiBlocked}
                className="hidden xl:inline-flex items-center gap-1.5 rounded-xl border border-black/[0.06] bg-white px-2.5 py-1.5 text-[11px] font-medium text-[#6E6E73] hover:bg-black/[0.03] hover:text-[#1D1D1F] disabled:opacity-50 disabled:cursor-not-allowed"
                title="Open contextual help"
                aria-label="Open contextual help"
              >
                <HelpCircle className="h-3.5 w-3.5 text-[#FF4500]" />
                <span>Help</span>
              </button>
            )}

            {/* Create Campaign CTA */}
            <button
              onClick={onOpenAiGenerator}
              disabled={uiBlocked}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#FF4500] px-3.5 text-[11px] font-semibold text-white shadow-sm hover:bg-[#EA3E00] active:scale-95 transition-all shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create campaign</span>
            </button>

            {/* More Tools Menu */}
            <div className="relative" data-autonoma-menu>
              <button
                disabled={uiBlocked}
                onClick={() => {
                  if (uiBlocked) return;
                  setMoreOpen((v) => !v);
                  setWorkspaceOpen(false);
                  setAccountOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={moreOpen}
                aria-label="Open more tools"
                className={`flex h-9 items-center gap-1 rounded-xl border px-2.5 text-[11px] transition-all ${
                  moreOpen
                    ? 'border-black/20 bg-black/[0.06] text-[#1D1D1F]'
                    : 'border-black/[0.07] bg-white text-[#6E6E73] hover:bg-black/[0.03] hover:text-[#1D1D1F]'
                }`}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="hidden xl:inline">More</span>
              </button>

              {moreOpen && (
                <div role="menu" aria-label="More tools" className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-1.5 shadow-xl z-[120] animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 pb-1.5 pt-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#86868B]">
                    Studio & Growth Tools
                  </div>

                  {secondary.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => selectTab(item.id)}
                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] transition ${
                          active
                            ? 'bg-[#FF4500]/[0.08] text-[#FF4500] font-semibold'
                            : 'text-[#4A4A4F] hover:bg-black/[0.04] hover:text-[#1D1D1F]'
                        }`}
                      >
                        <Icon className={`h-3.5 w-3.5 ${active ? 'text-[#FF4500]' : ''}`} />
                        <span>{item.label}</span>
                        {Boolean(item.count) && (
                          <span className="ml-auto text-[9px] px-1.5 py-0.2 bg-black/[0.05] rounded text-[#86868B]">
                            {item.count}
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <div className="my-1 h-px bg-black/[0.06]" />

                  <button
                    onClick={() => {
                      onExportCsv();
                      setMoreOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#4A4A4F] hover:bg-black/[0.04] hover:text-[#1D1D1F]"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export content CSV</span>
                  </button>

                  {canManage && onOpenCompanyManagement && (
                    <button
                      onClick={() => {
                        onOpenCompanyManagement();
                        setMoreOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#4A4A4F] hover:bg-black/[0.04] hover:text-[#1D1D1F]"
                    >
                      <Users className="h-3.5 w-3.5" />
                      <span>Team & Company</span>
                    </button>
                  )}

                  {currentUser?.isSuperAdmin && onOpenSuperAdminWorkspace && (
                    <>
                      <div className="my-1 h-px bg-black/[0.06]" />
                      <button
                        onClick={() => {
                          onOpenSuperAdminWorkspace();
                          setMoreOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl bg-purple-50 px-3 py-2 text-[11px] font-medium text-purple-800 hover:bg-purple-100"
                      >
                        <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                        <span>Super Admin Console</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Account Profile Avatar & Settings */}
            <div className="relative" data-autonoma-menu>
              <button
                disabled={uiBlocked}
                onClick={() => {
                  if (uiBlocked) return;
                  setAccountOpen((v) => !v);
                  setWorkspaceOpen(false);
                  setMoreOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-label="Open account menu"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-black/[0.08] bg-black/[0.03] text-[11px] font-bold text-[#1D1D1F] transition hover:bg-black/[0.06]"
              >
                {currentUser?.name?.[0]?.toUpperCase() || 'U'}
              </button>

              {accountOpen && (
                <div role="menu" aria-label="Account" className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-xl z-[120] animate-in fade-in zoom-in-95 duration-100">
                  <div className="border-b border-black/[0.05] px-4 py-3 bg-[#FBFBFD]">
                    <div className="truncate text-xs font-semibold text-[#1D1D1F]">
                      {currentUser?.name || 'Autonoma User'}
                    </div>
                    <div className="mt-0.5 truncate text-[10px] text-[#86868B]">
                      {currentUser?.email}
                    </div>
                    <div className="mt-1.5 inline-flex rounded-md bg-[#FF4500]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#FF4500]">
                      {currentUser?.isSuperAdmin ? 'SUPER ADMIN' : userRole || 'MEMBER'}
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <button
                      onClick={() => {
                        onOpenSettings();
                        setAccountOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#4A4A4F] hover:bg-black/[0.04] hover:text-[#1D1D1F]"
                    >
                      <Settings className="h-3.5 w-3.5 text-[#FF4500]" />
                      <span>AI & Media Providers</span>
                    </button>

                    {onSignOut && (
                      <button
                        onClick={() => {
                          onSignOut();
                          setAccountOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        <span>Sign out</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Mobile Navigation Drawer (Blinkit/Zomato consumer-grade touch responsiveness) */}
        {mobileOpen && (
          <div className="border-t border-black/[0.06] bg-[#FBFBFD] p-3.5 md:hidden animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-2">
              {primary.map((item) => {
                const Icon = item.icon;
                const active = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => selectTab(item.id)}
                    className={`flex min-h-11 items-center gap-2 rounded-xl px-3.5 text-xs font-medium transition ${
                      active
                        ? 'bg-[#FF4500] text-white shadow-xs font-semibold'
                        : 'bg-white border border-black/[0.06] text-[#4A4A4F]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="my-2.5 h-px bg-black/[0.06]" />

            <div className="grid grid-cols-2 gap-1.5">
              {secondary.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectTab(item.id)}
                  className={`min-h-10 rounded-xl px-3 text-left text-xs transition flex items-center justify-between ${
                    activeTab === item.id ? 'bg-[#FF4500]/10 text-[#FF4500] font-semibold' : 'text-[#6E6E73] hover:bg-black/[0.03]'
                  }`}
                >
                  <span>{item.label}</span>
                  {Boolean(item.count) && (
                    <span className="text-[10px] text-[#86868B]">{item.count}</span>
                  )}
                </button>
              ))}
            </div>

            {currentUser?.isSuperAdmin && onOpenSuperAdminWorkspace && (
              <button
                onClick={() => {
                  onOpenSuperAdminWorkspace();
                  setMobileOpen(false);
                }}
                className="mt-2.5 w-full rounded-xl border border-purple-200 bg-purple-50 px-3 py-2.5 text-xs font-semibold text-purple-900"
              >
                Super Admin Console
              </button>
            )}
          </div>
        )}
      </header>

      {/* Subheader / Campaign Selector & Quick Context */}
      {filterRelevant && (
        <div className="border-b border-black/[0.05] bg-[#FBFBFD]/90 backdrop-blur-md">
          <div className="mx-auto flex min-h-10 sm:min-h-11 max-w-[1500px] items-center gap-3 px-3.5 sm:px-5 lg:px-7">
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden text-[9px] font-bold uppercase tracking-[0.14em] text-[#86868B] sm:block">
                Campaign
              </span>

              <select
                value={(campaigns || []).some(c => c.id === activeCampaignFilter) ? activeCampaignFilter : 'all'}
                onChange={(e) => onSelectCampaignFilter(e.target.value)}
                className="max-w-[220px] sm:max-w-[340px] rounded-xl border border-black/[0.07] bg-white px-2.5 py-1 text-[11px] font-medium text-[#1D1D1F] outline-none shadow-2xs focus:border-[#FF4500]"
              >
                <option value="all">
                  All campaigns ({assetCount || 0} assets)
                </option>
                {(campaigns || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.campaignCode ? `${c.campaignCode} · ` : ''}{c.name}
                  </option>
                ))}
              </select>

              {activeCampaignFilter !== 'all' && (
                <button
                  onClick={() => onSelectCampaignFilter('all')}
                  className="rounded-lg p-1 text-[#86868B] hover:bg-black/[0.04] hover:text-[#1D1D1F]"
                  title="Clear filter"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="ml-auto hidden min-w-0 items-center gap-2 text-[11px] text-[#86868B] sm:flex">
              <span className="truncate">
                {selectedCampaign ? selectedCampaign.name : activeCompany?.name}
              </span>
              {activeTab === 'master_sheet' && (
                <button
                  onClick={onExportCsv}
                  className="rounded-xl border border-black/[0.06] bg-white px-2.5 py-1 text-xs text-[#1D1D1F] hover:bg-black/[0.03] transition-colors shadow-2xs"
                >
                  Export CSV
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};