import React from 'react';
import {
  X,
  Plus,
  Clock3,
  FolderKanban,
  FileSpreadsheet,
  Calendar,
  Palette,
  Layers,
  TrendingUp,
  Send,
  Archive,
  Building2,
  Database,
  ShieldCheck,
  HelpCircle,
  Settings,
  LogOut,
  ChevronDown,
  Check,
  Sparkles
} from 'lucide-react';
import { AppNavTab, CompanyOption } from './Header';
import { Company, User, UserRole } from '../types/auth';
import { ApexLogo } from './ApexLogo';

export interface GlobalMobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: AppNavTab;
  onSelectTab: (tab: AppNavTab) => void;
  currentUser?: User | null;
  activeCompany?: Company | null;
  userRole?: UserRole | null;
  availableCompanies?: CompanyOption[];
  onSwitchCompany?: (companyId: string) => void | Promise<void>;
  switchingCompanyId?: string | null;
  onCreateCampaign: () => void;
  onOpenHelp?: () => void;
  onOpenSettings?: () => void;
  onOpenCompanyManagement?: (tab?: 'profile' | 'company_data') => void;
  onOpenSuperAdminWorkspace?: () => void;
  onSignOut?: () => void;
  archivedCount?: number;
  isInSuperAdminMode?: boolean;
}

export const GlobalMobileDrawer: React.FC<GlobalMobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  currentUser,
  activeCompany,
  userRole,
  availableCompanies = [],
  onSwitchCompany,
  switchingCompanyId,
  onCreateCampaign,
  onOpenHelp,
  onOpenSettings,
  onOpenCompanyManagement,
  onOpenSuperAdminWorkspace,
  onSignOut,
  archivedCount = 0,
  isInSuperAdminMode = false
}) => {
  const [workspaceExpanded, setWorkspaceExpanded] = React.useState(false);

  // Lock body scroll when mobile drawer is open
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isSuperAdmin = Boolean(currentUser?.isSuperAdmin);
  const isCompanyAdmin = userRole === 'COMPANY_ADMIN' || isSuperAdmin;
  const activeCompanyId = activeCompany?.companyId || activeCompany?.id || '';

  const handleSelectNav = (tab: AppNavTab) => {
    onSelectTab(tab);
    onClose();
  };

  const handleCreate = () => {
    onClose();
    onCreateCampaign();
  };

  const handleSwitch = async (companyId: string) => {
    if (onSwitchCompany && companyId !== activeCompanyId) {
      await onSwitchCompany(companyId);
    }
    setWorkspaceExpanded(false);
    onClose();
  };

  const handleGoAdmin = () => {
    onClose();
    if (onOpenSuperAdminWorkspace) {
      onOpenSuperAdminWorkspace();
    }
  };

  const handleGoCompanyTeam = () => {
    onClose();
    if (onOpenCompanyManagement) {
      onOpenCompanyManagement('profile');
    }
  };

  const handleGoCompanyData = () => {
    onClose();
    if (onOpenCompanyManagement) {
      onOpenCompanyManagement('company_data');
    }
  };

  const handleOpenHelpAction = () => {
    onClose();
    if (onOpenHelp) {
      onOpenHelp();
    }
  };

  const handleOpenSettingsAction = () => {
    onClose();
    if (onOpenSettings) {
      onOpenSettings();
    }
  };

  const handleSignOutAction = () => {
    onClose();
    if (onSignOut) {
      onSignOut();
    }
  };

  const workItems = [
    { id: 'todays_production' as AppNavTab, label: 'Today', icon: Clock3 },
    { id: 'campaigns' as AppNavTab, label: 'Campaigns', icon: FolderKanban },
    { id: 'master_sheet' as AppNavTab, label: 'Content', icon: FileSpreadsheet },
    { id: 'calendar' as AppNavTab, label: 'Calendar', icon: Calendar },
  ];

  const createOptimizeItems = [
    { id: 'design_system' as AppNavTab, label: 'Brand', icon: Palette },
    { id: 'creative_studio' as AppNavTab, label: 'Studio', icon: Layers },
    { id: 'virality' as AppNavTab, label: 'Growth Mechanics', icon: TrendingUp },
  ];

  const operateItems = [
    { id: 'publishing' as AppNavTab, label: 'Publishing', icon: Send },
    { id: 'archive' as AppNavTab, label: 'Archive', icon: Archive, count: archivedCount },
  ];

  return (
    <div className="fixed inset-0 z-[300] flex md:hidden" role="dialog" aria-modal="true" aria-label="Global mobile navigation">
      {/* Dimmed backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Full-height Mobile Drawer */}
      <div className="relative ml-0 flex h-full w-[85%] max-w-[340px] flex-col bg-white text-[#1D1D1F] shadow-2xl animate-in slide-in-from-left duration-200">
        
        {/* Drawer Header */}
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-black/[0.08] px-4 bg-[#FBFBFD]">
          <div className="flex items-center gap-2.5">
            <ApexLogo variant="mark" size="sm" />
            <div className="flex flex-col">
              <span className="text-[13px] font-bold tracking-[0.08em] text-[#1D1D1F]">
                AUTONOMA
              </span>
              <span className="text-[9px] font-semibold uppercase tracking-wider text-[#FF4500]">
                {isSuperAdmin ? 'Super Admin' : userRole || 'Workspace'}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-[#6E6E73] hover:bg-black/[0.05] hover:text-[#1D1D1F] transition-colors"
            aria-label="Close navigation drawer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-3.5 py-4 space-y-5">
          
          {/* WORKSPACE SELECTOR */}
          <div className="space-y-1.5">
            <div className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#86868B]">
              Workspace
            </div>

            <div className="rounded-2xl border border-black/[0.08] bg-[#FBFBFD] p-1.5">
              <button
                onClick={() => setWorkspaceExpanded((v) => !v)}
                className="flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left hover:bg-black/[0.03] transition-colors"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#FF4500] text-white">
                  <Building2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-xs font-semibold text-[#1D1D1F]">
                    {activeCompany?.name || 'Select Workspace'}
                  </div>
                  <div className="truncate text-[10px] text-[#86868B]">
                    {activeCompany?.profile?.organizationType || 'Active Company'}
                  </div>
                </div>
                {availableCompanies.length > 1 && (
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-[#86868B] transition-transform ${
                      workspaceExpanded ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Workspace Switcher Options */}
              {workspaceExpanded && availableCompanies.length > 1 && (
                <div className="mt-1 border-t border-black/[0.06] pt-1 max-h-48 overflow-y-auto space-y-0.5">
                  {availableCompanies.map((c) => {
                    const isCurrent = c.id === activeCompanyId;
                    const isSwitching = switchingCompanyId === c.id;

                    return (
                      <button
                        key={c.id}
                        disabled={Boolean(switchingCompanyId)}
                        onClick={() => handleSwitch(c.id)}
                        className={`flex min-h-[44px] w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left transition ${
                          isCurrent
                            ? 'bg-[#FF4500]/10 text-[#FF4500] font-semibold'
                            : 'hover:bg-black/[0.04] text-[#1D1D1F]'
                        }`}
                      >
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate text-xs flex-1">{c.name}</span>
                        {isSwitching ? (
                          <div className="h-3 w-3 animate-spin rounded-full border-2 border-[#FF4500] border-t-transparent" />
                        ) : isCurrent ? (
                          <Check className="h-3.5 w-3.5 shrink-0 text-[#FF4500]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* CREATE ACTION */}
          <div>
            <button
              onClick={handleCreate}
              className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl bg-[#FF4500] px-4 text-xs font-semibold text-white shadow-sm hover:bg-[#EA3E00] active:scale-[0.98] transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Create Campaign</span>
            </button>
          </div>

          {/* WORK SECTION */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#86868B]">
              Work
            </div>
            <div className="space-y-0.5">
              {workItems.map((item) => {
                const Icon = item.icon;
                const active = !isInSuperAdminMode && activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNav(item.id)}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-xs font-medium transition ${
                      active
                        ? 'bg-[#FF4500]/10 text-[#FF4500] font-semibold shadow-2xs'
                        : 'text-[#4A4A4F] hover:bg-black/[0.04] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#FF4500]' : 'text-[#6E6E73]'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* CREATE & OPTIMIZE SECTION */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#86868B]">
              Create & Optimize
            </div>
            <div className="space-y-0.5">
              {createOptimizeItems.map((item) => {
                const Icon = item.icon;
                const active = !isInSuperAdminMode && activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNav(item.id)}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-xs font-medium transition ${
                      active
                        ? 'bg-[#FF4500]/10 text-[#FF4500] font-semibold shadow-2xs'
                        : 'text-[#4A4A4F] hover:bg-black/[0.04] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#FF4500]' : 'text-[#6E6E73]'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* OPERATE SECTION */}
          <div className="space-y-1">
            <div className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#86868B]">
              Operate
            </div>
            <div className="space-y-0.5">
              {operateItems.map((item) => {
                const Icon = item.icon;
                const active = !isInSuperAdminMode && activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleSelectNav(item.id)}
                    className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-xs font-medium transition ${
                      active
                        ? 'bg-[#FF4500]/10 text-[#FF4500] font-semibold shadow-2xs'
                        : 'text-[#4A4A4F] hover:bg-black/[0.04] hover:text-[#1D1D1F]'
                    }`}
                  >
                    <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#FF4500]' : 'text-[#6E6E73]'}`} />
                    <span className="truncate flex-1 text-left">{item.label}</span>
                    {Boolean(item.count) && (
                      <span className="rounded-md bg-black/[0.05] px-1.5 py-0.5 text-[10px] text-[#86868B] font-mono">
                        {item.count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* MANAGE SECTION (Company Admin & Super Admin) */}
          {isCompanyAdmin && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#86868B]">
                Manage
              </div>
              <div className="space-y-0.5">
                {onOpenCompanyManagement && (
                  <button
                    onClick={handleGoCompanyTeam}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-xs font-medium text-[#4A4A4F] hover:bg-black/[0.04] hover:text-[#1D1D1F] transition"
                  >
                    <Building2 className="h-4 w-4 shrink-0 text-[#6E6E73]" />
                    <span className="truncate">Company & Team</span>
                  </button>
                )}

                {onOpenCompanyManagement && (
                  <button
                    onClick={handleGoCompanyData}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-xs font-medium text-[#4A4A4F] hover:bg-black/[0.04] hover:text-[#1D1D1F] transition"
                  >
                    <Database className="h-4 w-4 shrink-0 text-[#6E6E73]" />
                    <span className="truncate">Data & Knowledge</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ADMIN SECTION (Super Admin Console) */}
          {isSuperAdmin && onOpenSuperAdminWorkspace && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#86868B]">
                Admin
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={handleGoAdmin}
                  className={`flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-xs font-semibold transition ${
                    isInSuperAdminMode
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-purple-50 text-purple-900 border border-purple-200/60 hover:bg-purple-100'
                  }`}
                >
                  <ShieldCheck className={`h-4 w-4 shrink-0 ${isInSuperAdminMode ? 'text-white' : 'text-purple-600'}`} />
                  <span className="truncate">Super Admin Console</span>
                </button>
              </div>
            </div>
          )}

          {/* SUPPORT */}
          {onOpenHelp && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#86868B]">
                Support
              </div>
              <div className="space-y-0.5">
                <button
                  onClick={handleOpenHelpAction}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-xs font-medium text-[#4A4A4F] hover:bg-black/[0.04] hover:text-[#1D1D1F] transition"
                >
                  <HelpCircle className="h-4 w-4 shrink-0 text-[#FF4500]" />
                  <span className="truncate">Help & Guide</span>
                </button>
              </div>
            </div>
          )}

          {/* ACCOUNT & SETTINGS */}
          <div className="space-y-1 pt-2 border-t border-black/[0.08]">
            <div className="px-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#86868B]">
              Account
            </div>
            
            {/* User profile card */}
            <div className="rounded-xl bg-[#F5F5F7] px-3 py-2.5">
              <div className="truncate text-xs font-semibold text-[#1D1D1F]">
                {currentUser?.name || 'Autonoma User'}
              </div>
              <div className="truncate text-[10px] text-[#86868B]">
                {currentUser?.email}
              </div>
            </div>

            <div className="space-y-0.5 pt-1">
              {onOpenSettings && (
                <button
                  onClick={handleOpenSettingsAction}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-xs font-medium text-[#4A4A4F] hover:bg-black/[0.04] hover:text-[#1D1D1F] transition"
                >
                  <Settings className="h-4 w-4 shrink-0 text-[#6E6E73]" />
                  <span className="truncate">AI & Media Settings</span>
                </button>
              )}

              {onSignOut && (
                <button
                  onClick={handleSignOutAction}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-xs font-medium text-rose-600 hover:bg-rose-50 transition"
                >
                  <LogOut className="h-4 w-4 shrink-0" />
                  <span className="truncate">Sign out</span>
                </button>
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
