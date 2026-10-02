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
}) => {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [switchingCompanyId, setSwitchingCompanyId] = useState<string | null>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-autonoma-menu]')) {
        setWorkspaceOpen(false);
        setMoreOpen(false);
        setAccountOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setWorkspaceOpen(false);
        setMoreOpen(false);
        setAccountOpen(false);
        setMobileOpen(false);
      }
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', escape);
    };
  }, []);

  const primary = [
    { id: 'todays_production' as AppNavTab, label: 'Today', icon: Clock3 },
    { id: 'campaigns' as AppNavTab, label: 'Campaigns', icon: FolderKanban },
    { id: 'master_sheet' as AppNavTab, label: 'Content', icon: FileSpreadsheet },
    { id: 'creative_studio' as AppNavTab, label: 'Studio', icon: Layers },
    { id: 'calendar' as AppNavTab, label: 'Calendar', icon: Calendar },
  ];

  const secondary = [
    { id: 'design_system' as AppNavTab, label: 'Design System', icon: Palette },
    { id: 'virality' as AppNavTab, label: 'Virality Engine', icon: TrendingUp },
    { id: 'publishing' as AppNavTab, label: 'Publishing', icon: Send },
    { id: 'archive' as AppNavTab, label: 'Archive', icon: Archive, count: archivedCount || 0 },
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
        role: userRole || 'MEMBER',
      });
    }

    if (list.length === 0 && activeCompany) {
      return [
        {
          id: activeCompanyId,
          name: activeCompany.name,
          role: userRole || 'MEMBER',
        },
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
    'calendar',
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
    <div className="sticky top-0 z-50 w-full select-none">
      <header className="border-b border-white/[0.075] bg-[#090A0D]/94 text-white shadow-[0_1px_0_rgba(255,255,255,.02)] backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-3 px-3 sm:px-5 lg:px-7">
          <button
            className="rounded-lg p-2 text-[#747781] hover:bg-white/[0.05] hover:text-white md:hidden"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>

          <button
            onClick={() => selectTab('todays_production')}
            className="flex shrink-0 items-center gap-2"
            title="Autonoma home"
          >
            <ApexLogo variant="mark" size="sm" />
            <span className="hidden text-[12px] font-bold tracking-[0.08em] text-white sm:block">
              AUTONOMA
            </span>
          </button>

          <div className="hidden h-5 w-px bg-white/[0.09] sm:block" />

          <div className="relative min-w-0" data-autonoma-menu>
            <button
              onClick={() => {
                setWorkspaceOpen((v) => !v);
                setMoreOpen(false);
                setAccountOpen(false);
              }}
              className="flex max-w-[210px] items-center gap-2 rounded-xl border border-white/[0.075] bg-white/[0.035] px-2.5 py-1.5 text-left transition hover:bg-white/[0.065] sm:max-w-[260px]"
            >
              <Building2 className="h-3.5 w-3.5 shrink-0 text-[#FF6A2A]" />

              <div className="min-w-0">
                <div className="truncate text-[11px] font-semibold text-white">
                  {activeCompany?.name || 'Choose workspace'}
                </div>
                <div className="hidden truncate text-[9px] text-[#666973] lg:block">
                  {userRole || 'Workspace'}
                </div>
              </div>

              <ChevronDown
                className={`ml-auto h-3 w-3 shrink-0 text-[#666973] transition ${
                  workspaceOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            {workspaceOpen && (
              <div className="absolute left-0 top-full mt-2 w-[310px] overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111318] shadow-2xl">
                <div className="border-b border-white/[0.06] px-4 py-3">
                  <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#5F626B]">
                    Switch workspace
                  </div>
                  <div className="mt-1 text-[11px] text-[#8C8F98]">
                    Your ventures and assigned brands
                  </div>
                </div>

                <div className="max-h-72 overflow-y-auto p-1.5">
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
                            ? 'bg-white/[0.075]'
                            : 'hover:bg-white/[0.045]'
                        }`}
                      >
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                            active ? 'bg-[#FF4500]/12' : 'bg-white/[0.04]'
                          }`}
                        >
                          <Building2
                            className={`h-4 w-4 ${
                              active ? 'text-[#FF6A2A]' : 'text-[#6D7078]'
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div
                            className={`truncate text-xs ${
                              active
                                ? 'font-semibold text-white'
                                : 'text-[#B3B5BC]'
                            }`}
                          >
                            {company.name}
                          </div>
                          <div className="mt-0.5 text-[9px] text-[#5F626B]">
                            {company.organizationType ||
                              company.role ||
                              'Workspace'}
                          </div>
                        </div>

                        {switching ? (
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#FF6A2A] border-t-transparent" />
                        ) : active ? (
                          <Check className="h-3.5 w-3.5 text-[#FF6A2A]" />
                        ) : null}
                      </button>
                    );
                  })}

                  {!companies.length && (
                    <div className="px-3 py-7 text-center text-[11px] text-[#666973]">
                      No workspaces available.
                    </div>
                  )}
                </div>

                {canManage && onOpenCompanyManagement && (
                  <div className="border-t border-white/[0.06] p-1.5">
                    <button
                      onClick={() => {
                        onOpenCompanyManagement();
                        setWorkspaceOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#8C8F98] hover:bg-white/[0.045] hover:text-white"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Company setup & team
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <nav className="mx-auto hidden items-center gap-0.5 rounded-xl border border-white/[0.055] bg-white/[0.018] p-1 md:flex">
            {primary.map((item) => {
              const Icon = item.icon;
              const active = item.id === activeTab;

              return (
                <button
                  key={item.id}
                  onClick={() => selectTab(item.id)}
                  className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[11px] font-medium transition lg:px-3 ${
                    active
                      ? 'bg-white/[0.09] text-white shadow-sm'
                      : 'text-[#747781] hover:bg-white/[0.035] hover:text-white'
                  }`}
                >
                  <Icon
                    className={`h-3.5 w-3.5 ${
                      active ? 'text-[#FF6A2A]' : ''
                    }`}
                  />
                  <span className="hidden lg:inline">{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <button
              onClick={onOpenAiGenerator}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#FF4500] px-3 text-[11px] font-semibold text-white shadow-lg shadow-[#FF4500]/15 transition hover:bg-[#F05A1E] active:scale-[.98]"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Create campaign</span>
            </button>

            <div className="relative" data-autonoma-menu>
              <button
                onClick={() => {
                  setMoreOpen((v) => !v);
                  setWorkspaceOpen(false);
                  setAccountOpen(false);
                }}
                className={`flex h-9 items-center gap-1 rounded-xl border px-2.5 text-[11px] transition ${
                  moreOpen
                    ? 'border-white/[0.14] bg-white/[0.08] text-white'
                    : 'border-white/[0.07] bg-white/[0.025] text-[#777A83] hover:bg-white/[0.05] hover:text-white'
                }`}
              >
                <MoreHorizontal className="h-4 w-4" />
                <span className="hidden xl:inline">More</span>
              </button>

              {moreOpen && (
                <div className="absolute right-0 top-full mt-2 w-60 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111318] p-1.5 shadow-2xl">
                  <div className="px-3 pb-1.5 pt-1 text-[9px] font-semibold uppercase tracking-[0.17em] text-[#555861]">
                    Tools
                  </div>

                  {secondary.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => selectTab(item.id)}
                        className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] ${
                          active
                            ? 'bg-white/[0.07] text-white'
                            : 'text-[#8C8F98] hover:bg-white/[0.04] hover:text-white'
                        }`}
                      >
                        <Icon
                          className={`h-3.5 w-3.5 ${
                            active ? 'text-[#FF6A2A]' : ''
                          }`}
                        />
                        {item.label}
                        <span className="ml-auto text-[9px] text-[#555861]">
                          {item.count || ''}
                        </span>
                      </button>
                    );
                  })}

                  <div className="my-1 h-px bg-white/[0.06]" />

                  <button
                    onClick={() => {
                      onExportCsv();
                      setMoreOpen(false);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#8C8F98] hover:bg-white/[0.04] hover:text-white"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Export content CSV
                  </button>

                  {canManage && onOpenCompanyManagement && (
                    <button
                      onClick={() => {
                        onOpenCompanyManagement();
                        setMoreOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#8C8F98] hover:bg-white/[0.04] hover:text-white"
                    >
                      <Users className="h-3.5 w-3.5" />
                      Team & company
                    </button>
                  )}

                  {currentUser?.isSuperAdmin &&
                    onOpenSuperAdminWorkspace && (
                      <>
                        <div className="my-1 h-px bg-white/[0.06]" />

                        <button
                          onClick={() => {
                            onOpenSuperAdminWorkspace();
                            setMoreOpen(false);
                          }}
                          className="flex w-full items-center gap-2 rounded-xl bg-[#FF4500]/[0.06] px-3 py-2 text-[11px] font-medium text-[#FF6A2A] hover:bg-[#FF4500]/10"
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          Admin console
                        </button>
                      </>
                    )}
                </div>
              )}
            </div>

            <div className="relative" data-autonoma-menu>
              <button
                onClick={() => {
                  setAccountOpen((v) => !v);
                  setWorkspaceOpen(false);
                  setMoreOpen(false);
                }}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/[0.07] bg-white/[0.025] text-[11px] font-semibold text-white transition hover:bg-white/[0.06]"
              >
                {currentUser?.name?.[0]?.toUpperCase() || 'U'}
              </button>

              {accountOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 overflow-hidden rounded-2xl border border-white/[0.1] bg-[#111318] shadow-2xl">
                  <div className="border-b border-white/[0.06] px-4 py-3">
                    <div className="truncate text-xs font-semibold text-white">
                      {currentUser?.name || 'Autonoma user'}
                    </div>

                    <div className="mt-0.5 truncate text-[10px] text-[#6D7078]">
                      {currentUser?.email}
                    </div>

                    <div className="mt-2 inline-flex rounded-md bg-[#FF4500]/10 px-1.5 py-0.5 text-[9px] font-semibold text-[#FF6A2A]">
                      {currentUser?.isSuperAdmin
                        ? 'SUPER ADMIN'
                        : userRole || 'MEMBER'}
                    </div>
                  </div>

                  <div className="p-1.5">
                    <button
                      onClick={() => {
                        onOpenSettings();
                        setAccountOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-[#8C8F98] hover:bg-white/[0.04] hover:text-white"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Settings & integrations
                    </button>

                    {onSignOut && (
                      <button
                        onClick={() => {
                          onSignOut();
                          setAccountOpen(false);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-[11px] text-red-400 hover:bg-red-500/[0.08]"
                      >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign out
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {mobileOpen && (
          <div className="border-t border-white/[0.06] bg-[#0E1014] p-3 md:hidden">
            <div className="grid grid-cols-2 gap-1.5">
              {primary.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => selectTab(item.id)}
                    className={`flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs ${
                      activeTab === item.id
                        ? 'bg-white/[0.08] text-white'
                        : 'text-[#777A83]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div className="my-3 h-px bg-white/[0.06]" />

            <div className="grid grid-cols-2 gap-1.5">
              {secondary.map((item) => (
                <button
                  key={item.id}
                  onClick={() => selectTab(item.id)}
                  className="min-h-10 rounded-xl px-3 text-left text-xs text-[#777A83] hover:bg-white/[0.04] hover:text-white"
                >
                  {item.label}
                </button>
              ))}
            </div>

            {currentUser?.isSuperAdmin &&
              onOpenSuperAdminWorkspace && (
                <button
                  onClick={() => {
                    onOpenSuperAdminWorkspace();
                    setMobileOpen(false);
                  }}
                  className="mt-2 w-full rounded-xl border border-[#FF4500]/20 bg-[#FF4500]/[0.07] px-3 py-2.5 text-xs font-semibold text-[#FF6A2A]"
                >
                  Admin console
                </button>
              )}
          </div>
        )}
      </header>

      {filterRelevant && (
        <div className="border-b border-black/[0.055] bg-white/95 backdrop-blur-xl">
          <div className="mx-auto flex min-h-11 max-w-[1500px] items-center gap-3 px-3 sm:px-5 lg:px-7">
            <div className="flex min-w-0 items-center gap-2">
              <span className="hidden text-[9px] font-semibold uppercase tracking-[0.15em] text-[#A0A0A5] sm:block">
                Campaign
              </span>

              <select
                value={(campaigns || []).some(c => c.id === activeCampaignFilter) ? activeCampaignFilter : 'all'}
                onChange={(e) => onSelectCampaignFilter(e.target.value)}
                className="max-w-[250px] rounded-lg border border-black/[0.07] bg-[#F5F5F7] px-2.5 py-1.5 text-[11px] font-medium text-[#33343A] outline-none focus:border-[#FF4500]/35 sm:max-w-[360px]"
              >
                <option value="all">
                  All campaigns · {assetCount || 0} assets
                </option>

                {(campaigns || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.campaignCode ? `${c.campaignCode} · ` : ''}
                    {c.name}
                  </option>
                ))}
              </select>

              {activeCampaignFilter !== 'all' && (
                <button
                  onClick={() => onSelectCampaignFilter('all')}
                  className="rounded-lg p-1.5 text-[#999BA1] hover:bg-black/[0.04] hover:text-[#33343A]"
                  title="Clear campaign filter"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="ml-auto hidden min-w-0 items-center gap-2 text-[10px] text-[#A0A0A5] sm:flex">
              <span className="truncate">
                {selectedCampaign
                  ? selectedCampaign.name
                  : activeCompany?.name}
              </span>

              {activeTab === 'master_sheet' && (
                <button
                  onClick={onExportCsv}
                  className="rounded-lg border border-black/[0.06] bg-white px-2 py-1 text-[#6D6F75] hover:text-[#1D1D1F]"
                >
                  Export
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};