import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FolderKanban,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  Users,
  X,
} from 'lucide-react';
import { ApexLogo } from '../ApexLogo';
import { ApprovalRequest, Company, User } from '../../types/auth';
import { autonomaDataService } from '../../services/autonomaDataService';

type AdminTab = 'overview' | 'companies' | 'users';
type AdminUser = User & { memberships?: Array<{ companyId: string; companyName?: string; role?: string; status?: string }> };
type DeleteTarget = { kind: 'company'; company: Company } | { kind: 'user'; user: AdminUser } | null;

interface SuperAdminWorkspaceProps {
  currentUser: User;
  onEnterCompanyWorkspace: (companyId: string) => void;
  onSignOut: () => void;
}

const StatCard = ({ label, value, hint, tone = 'neutral' }: { label: string; value: number; hint: string; tone?: 'neutral' | 'orange' | 'green' | 'red' }) => {
  const toneClass = {
    neutral: 'text-[#1D1D1F]',
    orange: 'text-[#FF4500]',
    green: 'text-emerald-600',
    red: 'text-rose-600',
  }[tone];
  return (
    <div className="rounded-2xl border border-black/[0.08] bg-white p-4 sm:p-5 shadow-2xs">
      <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#86868B]">{label}</div>
      <div className={`mt-2 text-3xl font-bold tracking-tight ${toneClass}`}>{value}</div>
      <div className="mt-1 text-[11px] text-[#6E6E73]">{hint}</div>
    </div>
  );
};

export const SuperAdminWorkspace: React.FC<SuperAdminWorkspaceProps> = ({ currentUser, onEnterCompanyWorkspace, onSignOut }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyStatusFilter, setCompanyStatusFilter] = useState<'all' | 'ACTIVE' | 'SUSPENDED'>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<'all' | 'ACTIVE' | 'SUSPENDED'>('all');

  const [approvingReq, setApprovingReq] = useState<ApprovalRequest | null>(null);
  const [approvalCompanyChoice, setApprovalCompanyChoice] = useState<'existing' | 'new'>('new');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [approvalRole, setApprovalRole] = useState<'COMPANY_ADMIN' | 'MEMBER'>('COMPANY_ADMIN');
  const [submittingAction, setSubmittingAction] = useState(false);

  const [showCreateCompanyModal, setShowCreateCompanyModal] = useState(false);
  const [companyNameInput, setCompanyNameInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [reqList, compList, userList] = await Promise.all([
        autonomaDataService.getAdminRequests().catch(() => []),
        autonomaDataService.getAdminCompanies().catch(() => []),
        autonomaDataService.getAdminUsers().catch(() => []),
      ]);
      setRequests(reqList);
      setCompanies(compList);
      setUsers(userList as AdminUser[]);
      if (compList.length && !selectedCompanyId) setSelectedCompanyId(compList[0].companyId || compList[0].id || '');
    } catch (err: any) {
      setError(err?.message || 'Failed to load administration records.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const pendingRequests = useMemo(() => requests.filter(r => r.status === 'PENDING'), [requests]);
  const activeCompanies = companies.filter(c => c.status === 'ACTIVE').length;
  const suspendedCompanies = companies.filter(c => c.status === 'SUSPENDED').length;
  const suspendedUsers = users.filter(u => u.status === 'SUSPENDED').length;
  const currentUserId = currentUser.userId || currentUser.id || '';

  const filteredCompanies = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return companies.filter(c => {
      const matchesStatus = companyStatusFilter === 'all' || c.status === companyStatusFilter;
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || (c.companyId || c.id || '').toLowerCase().includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [companies, companyStatusFilter, searchQuery]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter(u => {
      const matchesStatus = userStatusFilter === 'all' || u.status === userStatusFilter;
      const membershipsText = (u.memberships || []).map(m => `${m.companyName || ''} ${m.role || ''}`).join(' ').toLowerCase();
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || membershipsText.includes(q);
      return matchesStatus && matchesSearch;
    });
  }, [users, userStatusFilter, searchQuery]);

  const openApproveModal = (req: ApprovalRequest) => {
    setApprovingReq(req);
    setNewCompanyName(req.proposedCompanyName || `${req.name}'s Company`);
    setApprovalCompanyChoice('new');
    setApprovalRole('COMPANY_ADMIN');
  };

  const handleConfirmApproval = async () => {
    if (!approvingReq) return;
    setSubmittingAction(true);
    setError(null);
    try {
      const result = await autonomaDataService.approveRequest(
        approvingReq.requestId || approvingReq.id || '',
        approvalCompanyChoice === 'new' ? 'new' : selectedCompanyId,
        approvalRole,
        approvalCompanyChoice === 'new' ? newCompanyName : undefined,
      );
      if (!result.success) throw new Error(result.error || 'Approval failed.');
      setSuccessMessage(`${approvingReq.name} approved for ${result.company?.name || 'the selected workspace'}.`);
      setApprovingReq(null);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to approve request.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleReject = async (req: ApprovalRequest) => {
    if (!window.confirm(`Reject access for ${req.name} (${req.email})?`)) return;
    try {
      await autonomaDataService.rejectRequest(req.requestId || req.id || '');
      setSuccessMessage(`Access request for ${req.name} rejected.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to reject request.');
    }
  };

  const handleCreateCompany = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!companyNameInput.trim()) return;
    setSubmittingAction(true);
    try {
      const created = await autonomaDataService.createAdminCompany(companyNameInput.trim());
      setSuccessMessage(`Workspace "${created.name}" created.`);
      setCompanyNameInput('');
      setShowCreateCompanyModal(false);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to create company.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleToggleCompanyStatus = async (company: Company) => {
    const id = company.companyId || company.id || '';
    const newStatus = company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await autonomaDataService.updateAdminCompany(id, { status: newStatus });
      setSuccessMessage(`Workspace ${company.name} is now ${newStatus.toLowerCase()}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update workspace status.');
    }
  };

  const handleToggleUserStatus = async (user: AdminUser) => {
    const id = user.userId || user.id || '';
    try {
      if (user.status === 'ACTIVE') {
        await autonomaDataService.suspendUser(id, 'SUSPENDED');
        setSuccessMessage(`User ${user.name} suspended.`);
      } else {
        await autonomaDataService.suspendUser(id, 'ACTIVE');
        setSuccessMessage(`User ${user.name} activated.`);
      }
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update user status.');
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget || deleteConfirmText !== 'DELETE') return;
    setSubmittingAction(true);
    setError(null);
    try {
      if (deleteTarget.kind === 'company') {
        const company = deleteTarget.company;
        const id = company.companyId || company.id || '';
        const result = await autonomaDataService.deleteAdminCompany(id);
        setSuccessMessage(`Deleted ${company.name} and ${result.deletedCampaigns || 0} campaigns / ${result.deletedAssets || 0} assets linked to it.`);
      } else {
        const user = deleteTarget.user;
        await autonomaDataService.deleteAdminUser(user.userId || user.id || '');
        setSuccessMessage(`Deleted user ${user.name}.`);
      }
      setDeleteTarget(null);
      setDeleteConfirmText('');
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Delete failed.');
    } finally {
      setSubmittingAction(false);
    }
  };

  const navItems: Array<{ id: AdminTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }> = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'companies', label: 'Companies', icon: Building2, count: companies.length },
    { id: 'users', label: 'Users & Access', icon: Users, count: users.length },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F]">
      <header className="sticky top-0 z-40 border-b border-black/[0.08] bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <ApexLogo variant="mark" size="sm" />
            <div className="hidden min-w-0 sm:block">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold tracking-tight text-[#1D1D1F]">Autonoma Control</span>
                <span className="rounded-md border border-[#FF4500]/25 bg-orange-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#FF4500]">Super Admin</span>
              </div>
              <div className="text-[10px] text-[#6E6E73]">System & multi-tenant workspace administration</div>
            </div>
          </div>

          <nav className="ml-2 hidden items-center gap-1 rounded-xl border border-black/[0.08] bg-[#F5F5F7] p-1 md:flex">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setSearchQuery(''); }}
                  className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                    active ? 'bg-white text-[#1D1D1F] shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${active ? 'text-[#FF4500]' : ''}`} />
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && (
                    <span className="rounded-md bg-black/[0.05] px-1.5 text-[10px] text-[#6E6E73] font-mono">{item.count}</span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {pendingRequests.length > 0 && (
              <button
                onClick={() => setActiveTab('overview')}
                className="hidden items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 sm:flex"
              >
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                {pendingRequests.length} approval{pendingRequests.length === 1 ? '' : 's'} waiting
              </button>
            )}
            <button
              onClick={() => { setRefreshing(true); loadData(); }}
              className="rounded-xl p-2 text-[#6E6E73] transition hover:bg-black/[0.04] hover:text-[#1D1D1F]"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => onEnterCompanyWorkspace('org_apex_pune')}
              className="hidden items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] transition hover:bg-neutral-50 shadow-2xs lg:flex"
            >
              <FolderKanban className="h-3.5 w-3.5 text-[#FF4500]" />
              <span>Workspace</span>
              <ArrowRight className="h-3 w-3 text-[#86868B]" />
            </button>
            <div className="hidden text-right xl:block">
              <div className="text-[11px] font-semibold text-[#1D1D1F]">{currentUser.name}</div>
              <div className="max-w-[180px] truncate text-[9px] text-[#86868B]">{currentUser.email}</div>
            </div>
            <button
              onClick={onSignOut}
              className="rounded-xl p-2 text-[#6E6E73] transition hover:bg-red-50 hover:text-red-600"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-black/[0.06] bg-[#FBFBFD] px-3 py-2 md:hidden">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold ${
                activeTab === item.id ? 'bg-white text-[#1D1D1F] shadow-2xs' : 'text-[#6E6E73]'
              }`}
            >
              {item.label}{item.count !== undefined ? ` · ${item.count}` : ''}
            </button>
          ))}
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {(error || successMessage) && (
          <div className={`mb-5 flex items-start gap-3 rounded-2xl border px-4 py-3 text-xs font-medium ${
            error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}>
            {error ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <span className="flex-1">{error || successMessage}</span>
            <button onClick={() => { setError(null); setSuccessMessage(null); }} className="hover:opacity-75">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-[#FF4500]">
                  <ShieldCheck className="h-3.5 w-3.5" /> Control Center
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F] sm:text-3xl">
                  Everything that needs your attention.
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-[#6E6E73]">
                  Approve access, keep workspaces clean, and manage account health in a calm, focused administration suite.
                </p>
              </div>
              <button
                onClick={() => setShowCreateCompanyModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF4500] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#EA3E00] active:scale-95"
              >
                <Plus className="h-4 w-4" /> New workspace
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Workspaces" value={companies.length} hint={`${activeCompanies} active`} />
              <StatCard label="Users" value={users.length} hint={`${suspendedUsers} suspended`} />
              <StatCard label="Needs attention" value={pendingRequests.length} hint="Pending approvals" tone={pendingRequests.length ? 'orange' : 'green'} />
              <StatCard label="Suspended" value={suspendedCompanies} hint="Workspace access paused" tone={suspendedCompanies ? 'red' : 'neutral'} />
            </div>

            {pendingRequests.length > 0 ? (
              <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-2xs">
                <div className="flex items-center justify-between border-b border-amber-100 bg-amber-50/70 px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2">
                    <Clock3 className="h-4 w-4 text-amber-600" />
                    <span className="text-sm font-bold text-amber-950">Approval queue</span>
                    <span className="rounded-md bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">{pendingRequests.length}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-amber-800">Action required</span>
                </div>
                <div className="divide-y divide-black/[0.05]">
                  {pendingRequests.map(req => (
                    <div key={req.requestId || req.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5 hover:bg-[#FBFBFD] transition-colors">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-xs font-bold text-[#FF4500]">
                          {req.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-[#1D1D1F]">{req.name}</div>
                          <div className="truncate text-[11px] text-[#6E6E73]">{req.email} · wants <span className="font-medium text-[#1D1D1F]">{req.proposedCompanyName}</span></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openApproveModal(req)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF4500] px-3.5 py-1.5 text-xs font-semibold text-white shadow-2xs hover:bg-[#EA3E00] transition active:scale-95"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          onClick={() => handleReject(req)}
                          className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[#6E6E73] hover:text-red-600 hover:bg-red-50 hover:border-red-200 transition"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="text-sm font-bold text-emerald-950">No approvals waiting</div>
                  <div className="text-xs text-emerald-700">Your access queue is clear.</div>
                </div>
              </section>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <button
                onClick={() => setActiveTab('companies')}
                className="group flex items-center justify-between rounded-2xl border border-black/[0.08] bg-white p-5 text-left transition hover:border-[#FF4500]/40 hover:shadow-xs shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1D1D1F]">
                    <Building2 className="h-4 w-4 text-[#FF4500]" /> Clean up workspaces
                  </div>
                  <div className="mt-1 text-xs text-[#6E6E73]">Review duplicates, status, campaigns and membership counts.</div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#86868B] transition group-hover:translate-x-0.5 group-hover:text-[#1D1D1F]" />
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className="group flex items-center justify-between rounded-2xl border border-black/[0.08] bg-white p-5 text-left transition hover:border-[#FF4500]/40 hover:shadow-xs shadow-2xs"
              >
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1D1D1F]">
                    <Users className="h-4 w-4 text-[#FF4500]" /> Manage access
                  </div>
                  <div className="mt-1 text-xs text-[#6E6E73]">Activate, suspend or remove accounts and memberships.</div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#86868B] transition group-hover:translate-x-0.5 group-hover:text-[#1D1D1F]" />
              </button>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <button
                  onClick={() => setActiveTab('overview')}
                  className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F]"
                >
                  <ArrowLeft className="h-3 w-3" /> Overview
                </button>
                <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Workspaces</h1>
                <p className="mt-1 text-sm text-[#6E6E73]">Keep only real ventures and client brands. Apex Engineering Pune is protected.</p>
              </div>
              <button
                onClick={() => setShowCreateCompanyModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF4500] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#EA3E00]"
              >
                <Plus className="h-4 w-4" /> New workspace
              </button>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl border border-black/[0.08] bg-white p-3 shadow-2xs sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868B]" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search workspaces…"
                  className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] py-2 pl-9 pr-3 text-xs text-[#1D1D1F] outline-none placeholder:text-[#86868B] focus:border-[#FF4500]"
                />
              </div>
              <div className="flex gap-1 rounded-xl bg-[#F5F5F7] p-1">
                {(['all','ACTIVE','SUSPENDED'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setCompanyStatusFilter(status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      companyStatusFilter === status ? 'bg-white text-[#1D1D1F] shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {status === 'all' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Suspended'}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center text-xs text-[#6E6E73]">Loading workspaces…</div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-2xs">
                <div className="hidden grid-cols-[1.6fr_.6fr_.65fr_.65fr_1fr] gap-4 border-b border-black/[0.06] bg-[#FBFBFD] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#86868B] md:grid">
                  <span>Workspace</span>
                  <span>Status</span>
                  <span>Members</span>
                  <span>Campaigns</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-black/[0.06]">
                  {filteredCompanies.map(company => {
                    const id = company.companyId || company.id || '';
                    const protectedWorkspace = id === 'org_apex_pune';
                    return (
                      <div
                        key={id}
                        className="grid gap-3 px-4 py-4 transition hover:bg-[#FBFBFD] md:grid-cols-[1.6fr_.6fr_.65fr_.65fr_1fr] md:items-center md:gap-4 md:px-5"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-50">
                              <Building2 className="h-4 w-4 text-[#FF4500]" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-[#1D1D1F]">{company.name}</div>
                              <div className="truncate text-[10px] font-mono text-[#86868B]">
                                {id}{protectedWorkspace ? ' · protected primary' : ''}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
                            company.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {company.status}
                          </span>
                        </div>
                        <div className="text-xs text-[#1D1D1F] font-semibold">
                          <span className="md:hidden text-[#86868B] font-normal">Members · </span>
                          {company.memberCount ?? 0}
                        </div>
                        <div className="text-xs text-[#1D1D1F] font-semibold">
                          <span className="md:hidden text-[#86868B] font-normal">Campaigns · </span>
                          {company.campaignCount ?? 0}
                        </div>
                        <div className="flex flex-wrap justify-start gap-1.5 md:justify-end">
                          <button
                            onClick={() => onEnterCompanyWorkspace(id)}
                            className="rounded-xl border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-neutral-50 shadow-2xs transition"
                          >
                            Open
                          </button>
                          <button
                            onClick={() => handleToggleCompanyStatus(company)}
                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold border ${
                              company.status === 'ACTIVE'
                                ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                            }`}
                          >
                            {company.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                          {!protectedWorkspace && (
                            <button
                              onClick={() => { setDeleteTarget({ kind: 'company', company }); setDeleteConfirmText(''); }}
                              className="rounded-xl p-1.5 text-[#86868B] hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 transition"
                              title="Delete workspace permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {!filteredCompanies.length && (
                    <div className="px-5 py-14 text-center text-xs text-[#86868B]">No workspaces match this filter.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-5">
            <div>
              <button
                onClick={() => setActiveTab('overview')}
                className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F]"
              >
                <ArrowLeft className="h-3 w-3" /> Overview
              </button>
              <h1 className="text-2xl font-bold tracking-tight text-[#1D1D1F]">Users & access</h1>
              <p className="mt-1 text-sm text-[#6E6E73]">Manage account status and remove stale or duplicate users.</p>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-black/[0.08] bg-white p-3 shadow-2xs sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#86868B]" />
                <input
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search name, email or workspace…"
                  className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] py-2 pl-9 pr-3 text-xs text-[#1D1D1F] outline-none placeholder:text-[#86868B] focus:border-[#FF4500]"
                />
              </div>
              <div className="flex gap-1 rounded-xl bg-[#F5F5F7] p-1">
                {(['all','ACTIVE','SUSPENDED'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setUserStatusFilter(status)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                      userStatusFilter === status ? 'bg-white text-[#1D1D1F] shadow-2xs' : 'text-[#6E6E73] hover:text-[#1D1D1F]'
                    }`}
                  >
                    {status === 'all' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Suspended'}
                  </button>
                ))}
              </div>
            </div>
            {loading ? (
              <div className="py-20 text-center text-xs text-[#6E6E73]">Loading users…</div>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-black/[0.08] bg-white shadow-2xs">
                <div className="hidden grid-cols-[1.3fr_.65fr_1.4fr_1fr] gap-4 border-b border-black/[0.06] bg-[#FBFBFD] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#86868B] md:grid">
                  <span>User</span>
                  <span>Status</span>
                  <span>Workspace access</span>
                  <span className="text-right">Actions</span>
                </div>
                <div className="divide-y divide-black/[0.06]">
                  {filteredUsers.map(user => {
                    const id = user.userId || user.id || '';
                    const protectedUser = user.isSuperAdmin || id === currentUserId;
                    return (
                      <div
                        key={id}
                        className="grid gap-3 px-4 py-4 transition hover:bg-[#FBFBFD] md:grid-cols-[1.3fr_.65fr_1.4fr_1fr] md:items-center md:gap-4 md:px-5"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-[#1D1D1F] border border-black/[0.06]">
                            {user.name?.[0]?.toUpperCase() || '?'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-semibold text-[#1D1D1F]">{user.name}</span>
                              {user.isSuperAdmin && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#FF4500]" />}
                            </div>
                            <div className="truncate text-[10px] text-[#86868B]">{user.email}</div>
                          </div>
                        </div>
                        <div>
                          <span className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border ${
                            user.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {user.status}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(user.memberships || []).length ? (
                            (user.memberships || []).map((m, i) => (
                              <span
                                key={`${m.companyId}-${i}`}
                                className="rounded-md border border-black/[0.08] bg-[#F5F5F7] px-2 py-0.5 text-[10px] font-semibold text-[#1D1D1F]"
                              >
                                {m.companyName || m.companyId} · {m.role}
                              </span>
                            ))
                          ) : (
                            <span className="text-[10px] text-[#86868B]">No active workspace</span>
                          )}
                        </div>
                        <div className="flex justify-start gap-1.5 md:justify-end">
                          {!user.isSuperAdmin && (
                            <button
                              onClick={() => handleToggleUserStatus(user)}
                              className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold border ${
                                user.status === 'ACTIVE'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
                                  : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                              }`}
                            >
                              {user.status === 'ACTIVE' ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}
                              <span>{user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</span>
                            </button>
                          )}
                          {!protectedUser && (
                            <button
                              onClick={() => { setDeleteTarget({ kind: 'user', user }); setDeleteConfirmText(''); }}
                              className="rounded-xl p-1.5 text-[#86868B] hover:bg-rose-50 hover:text-rose-600 border border-transparent hover:border-rose-200 transition"
                              title="Delete user"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {!filteredUsers.length && (
                    <div className="px-5 py-14 text-center text-xs text-[#86868B]">No users match this filter.</div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Approve Request Modal */}
      {approvingReq && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-black/[0.08] bg-white shadow-2xl overflow-hidden">
            <div className="flex items-start justify-between border-b border-black/[0.06] bg-[#FBFBFD] p-5">
              <div>
                <div className="text-sm font-bold text-[#1D1D1F]">Approve access</div>
                <div className="mt-1 text-xs text-[#6E6E73]">{approvingReq.name} · {approvingReq.email}</div>
              </div>
              <button onClick={() => setApprovingReq(null)} className="p-1 text-[#86868B] hover:text-[#1D1D1F]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 p-5 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setApprovalCompanyChoice('new')}
                  className={`rounded-2xl border p-3 text-left transition ${
                    approvalCompanyChoice === 'new'
                      ? 'border-[#FF4500] bg-orange-50 text-[#FF4500] font-semibold'
                      : 'border-black/[0.08] text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  <div className="font-bold">Create workspace</div>
                  <div className="mt-1 text-[10px] opacity-75">For a new customer / venture</div>
                </button>
                <button
                  onClick={() => setApprovalCompanyChoice('existing')}
                  className={`rounded-2xl border p-3 text-left transition ${
                    approvalCompanyChoice === 'existing'
                      ? 'border-[#FF4500] bg-orange-50 text-[#FF4500] font-semibold'
                      : 'border-black/[0.08] text-[#6E6E73] hover:text-[#1D1D1F]'
                  }`}
                >
                  <div className="font-bold">Existing workspace</div>
                  <div className="mt-1 text-[10px] opacity-75">Add them to a company</div>
                </button>
              </div>

              {approvalCompanyChoice === 'new' ? (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#86868B] mb-1">Company name</label>
                  <input
                    value={newCompanyName}
                    onChange={e => setNewCompanyName(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-2.5 text-xs text-[#1D1D1F] outline-none focus:border-[#FF4500]"
                    placeholder="Workspace name"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#86868B] mb-1">Select workspace</label>
                  <select
                    value={selectedCompanyId}
                    onChange={e => setSelectedCompanyId(e.target.value)}
                    className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-2.5 text-xs text-[#1D1D1F] outline-none focus:border-[#FF4500]"
                  >
                    {companies.map(c => (
                      <option key={c.companyId || c.id} value={c.companyId || c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#86868B]">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['COMPANY_ADMIN','MEMBER'] as const).map(role => (
                    <button
                      key={role}
                      onClick={() => setApprovalRole(role)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        approvalRole === role
                          ? 'border-[#FF4500] bg-orange-50 text-[#FF4500]'
                          : 'border-black/[0.08] text-[#6E6E73] hover:text-[#1D1D1F]'
                      }`}
                    >
                      {role === 'COMPANY_ADMIN' ? 'Company Admin' : 'Member'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 border-t border-black/[0.06] bg-[#FBFBFD] p-4">
              <button
                onClick={() => setApprovingReq(null)}
                className="rounded-xl border border-black/[0.08] bg-white px-4 py-2 text-xs font-semibold text-[#6E6E73] hover:text-[#1D1D1F]"
              >
                Cancel
              </button>
              <button
                disabled={submittingAction || (approvalCompanyChoice === 'new' && !newCompanyName.trim()) || (approvalCompanyChoice === 'existing' && !selectedCompanyId)}
                onClick={handleConfirmApproval}
                className="rounded-xl bg-[#FF4500] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#EA3E00] disabled:opacity-40"
              >
                {submittingAction ? 'Approving…' : 'Approve access'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Company Modal */}
      {showCreateCompanyModal && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <form
            onSubmit={handleCreateCompany}
            className="w-full max-w-md rounded-3xl border border-black/[0.08] bg-white shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-black/[0.06] bg-[#FBFBFD] p-5">
              <div>
                <div className="text-sm font-bold text-[#1D1D1F]">Create workspace</div>
                <div className="mt-1 text-xs text-[#6E6E73]">Add a venture, brand or client workspace.</div>
              </div>
              <button type="button" onClick={() => setShowCreateCompanyModal(false)} className="text-[#86868B] hover:text-[#1D1D1F]">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5">
              <label className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-[#86868B]">Workspace name</label>
              <input
                autoFocus
                value={companyNameInput}
                onChange={e => setCompanyNameInput(e.target.value)}
                placeholder="e.g. Fairytale Ecom"
                className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3 py-2.5 text-xs text-[#1D1D1F] outline-none placeholder:text-[#86868B] focus:border-[#FF4500]"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-black/[0.06] bg-[#FBFBFD] p-4">
              <button
                type="button"
                onClick={() => setShowCreateCompanyModal(false)}
                className="rounded-xl border border-black/[0.08] bg-white px-4 py-2 text-xs font-semibold text-[#6E6E73]"
              >
                Cancel
              </button>
              <button
                disabled={!companyNameInput.trim() || submittingAction}
                type="submit"
                className="rounded-xl bg-[#FF4500] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#EA3E00] disabled:opacity-40"
              >
                Create workspace
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-rose-200 bg-white shadow-2xl overflow-hidden">
            <div className="p-6">
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-base font-bold text-[#1D1D1F]">
                Permanently delete {deleteTarget.kind === 'company' ? 'workspace' : 'user'}?
              </h3>
              <p className="mt-2 text-xs leading-5 text-[#6E6E73]">
                {deleteTarget.kind === 'company' ? (
                  <>
                    Deleting <strong className="text-[#1D1D1F]">{deleteTarget.company.name}</strong> permanently removes its campaigns, assets, and memberships. It will never return on restart or redeploy.
                  </>
                ) : (
                  <>
                    Deleting <strong className="text-[#1D1D1F]">{deleteTarget.user.name}</strong> removes their access and workspace memberships.
                  </>
                )}
              </p>
              <label className="mt-4 block text-[10px] font-bold uppercase tracking-[0.16em] text-rose-700">
                Type DELETE to confirm
              </label>
              <input
                autoFocus
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE"
                className="mt-1 w-full rounded-xl border border-rose-300 bg-rose-50/50 px-3 py-2 text-xs font-mono font-bold text-rose-900 outline-none focus:border-rose-500"
              />
            </div>
            <div className="flex justify-end gap-2 border-t border-black/[0.06] bg-[#FBFBFD] p-4">
              <button
                onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }}
                className="rounded-xl border border-black/[0.08] bg-white px-4 py-2 text-xs font-semibold text-[#6E6E73]"
              >
                Cancel
              </button>
              <button
                disabled={deleteConfirmText !== 'DELETE' || submittingAction}
                onClick={handleDeleteConfirmed}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-35"
              >
                {submittingAction ? 'Deleting…' : 'Delete permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
