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
    neutral: 'text-white',
    orange: 'text-[#FF6A2A]',
    green: 'text-emerald-400',
    red: 'text-red-400',
  }[tone];
  return (
    <div className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 sm:p-5">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#72747C]">{label}</div>
      <div className={`mt-2 text-3xl font-semibold tracking-tight ${toneClass}`}>{value}</div>
      <div className="mt-1 text-[11px] text-[#72747C]">{hint}</div>
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
      setSuccessMessage(`Workspace “${created.name}” created.`);
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
    const nextStatus = company.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`${nextStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'} ${company.name}?`)) return;
    try {
      await autonomaDataService.updateAdminCompany(company.companyId || company.id || '', { status: nextStatus });
      setSuccessMessage(`${company.name} is now ${nextStatus.toLowerCase()}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update company.');
    }
  };

  const handleToggleUserStatus = async (user: AdminUser) => {
    const nextStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (user.isSuperAdmin && nextStatus === 'SUSPENDED') {
      setError('The Super Admin account cannot be suspended.');
      return;
    }
    if (!window.confirm(`${nextStatus === 'SUSPENDED' ? 'Suspend' : 'Activate'} ${user.name}?`)) return;
    try {
      const result = await autonomaDataService.suspendUser(user.userId || user.id || '', nextStatus);
      if (result?.success === false) throw new Error(result.error || 'Failed to update user.');
      setSuccessMessage(`${user.name} is now ${nextStatus.toLowerCase()}.`);
      await loadData();
    } catch (err: any) {
      setError(err?.message || 'Failed to update user.');
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!deleteTarget || deleteConfirmText !== 'DELETE') return;
    setSubmittingAction(true);
    try {
      if (deleteTarget.kind === 'company') {
        const company = deleteTarget.company;
        const result = await autonomaDataService.deleteAdminCompany(company.companyId || company.id || '');
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
    <div className="min-h-screen bg-[#090A0D] text-[#F5F5F7] selection:bg-[#FF4500] selection:text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.18]" style={{ backgroundImage: 'radial-gradient(circle at 50% -20%, rgba(255,69,0,.18), transparent 36%), linear-gradient(rgba(255,255,255,.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.025) 1px, transparent 1px)', backgroundSize: '100% 100%, 42px 42px, 42px 42px' }} />

      <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#090A0D]/88 backdrop-blur-2xl">
        <div className="mx-auto flex h-16 max-w-[1500px] items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <ApexLogo variant="mark" size="sm" />
            <div className="hidden min-w-0 sm:block">
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold tracking-tight text-white">Autonoma Control</span>
                <span className="rounded-md border border-[#FF4500]/25 bg-[#FF4500]/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#FF6A2A]">Super Admin</span>
              </div>
              <div className="text-[10px] text-[#686B73]">System & workspace administration</div>
            </div>
          </div>

          <nav className="ml-2 hidden items-center gap-1 rounded-xl border border-white/[0.06] bg-white/[0.025] p-1 md:flex">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button key={item.id} onClick={() => { setActiveTab(item.id); setSearchQuery(''); }} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${active ? 'bg-white/[0.09] text-white shadow-sm' : 'text-[#777A83] hover:bg-white/[0.04] hover:text-white'}`}>
                  <Icon className={`h-3.5 w-3.5 ${active ? 'text-[#FF6A2A]' : ''}`} />
                  <span>{item.label}</span>
                  {typeof item.count === 'number' && <span className="rounded-md bg-white/[0.06] px-1.5 text-[10px] text-[#777A83]">{item.count}</span>}
                </button>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            {pendingRequests.length > 0 && (
              <button onClick={() => setActiveTab('overview')} className="hidden items-center gap-2 rounded-xl border border-amber-500/20 bg-amber-500/[0.08] px-3 py-1.5 text-xs text-amber-300 sm:flex">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                {pendingRequests.length} approval{pendingRequests.length === 1 ? '' : 's'} waiting
              </button>
            )}
            <button onClick={() => { setRefreshing(true); loadData(); }} className="rounded-xl p-2 text-[#777A83] transition hover:bg-white/[0.05] hover:text-white" title="Refresh">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button onClick={() => onEnterCompanyWorkspace('org_apex_pune')} className="hidden items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-xs text-white transition hover:bg-white/[0.08] lg:flex">
              <FolderKanban className="h-3.5 w-3.5 text-[#FF6A2A]" /> Workspace
              <ArrowRight className="h-3 w-3 text-[#777A83]" />
            </button>
            <div className="hidden text-right xl:block">
              <div className="text-[11px] font-medium text-white">{currentUser.name}</div>
              <div className="max-w-[180px] truncate text-[9px] text-[#686B73]">{currentUser.email}</div>
            </div>
            <button onClick={onSignOut} className="rounded-xl p-2 text-[#777A83] transition hover:bg-red-500/10 hover:text-red-400" title="Sign out"><LogOut className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex gap-1 overflow-x-auto border-t border-white/[0.05] px-3 py-2 md:hidden">
          {navItems.map(item => <button key={item.id} onClick={() => setActiveTab(item.id)} className={`shrink-0 rounded-lg px-3 py-1.5 text-xs ${activeTab === item.id ? 'bg-white/[0.1] text-white' : 'text-[#777A83]'}`}>{item.label}{item.count !== undefined ? ` · ${item.count}` : ''}</button>)}
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {(error || successMessage) && (
          <div className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-xs ${error ? 'border-red-500/20 bg-red-500/[0.08] text-red-300' : 'border-emerald-500/20 bg-emerald-500/[0.08] text-emerald-300'}`}>
            {error ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />}
            <span className="flex-1">{error || successMessage}</span>
            <button onClick={() => { setError(null); setSuccessMessage(null); }}><X className="h-3.5 w-3.5" /></button>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
              <div>
                <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#FF6A2A]"><ShieldCheck className="h-3.5 w-3.5" /> Control center</div>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">Everything that needs your attention.</h1>
                <p className="mt-2 max-w-2xl text-sm text-[#777A83]">Approve access, keep workspaces clean, and manage account health without turning administration into another product.</p>
              </div>
              <button onClick={() => setShowCreateCompanyModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF4500] px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-[#FF4500]/15 transition hover:bg-[#F05A1E]"><Plus className="h-4 w-4" /> New workspace</button>
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="Workspaces" value={companies.length} hint={`${activeCompanies} active`} />
              <StatCard label="Users" value={users.length} hint={`${suspendedUsers} suspended`} />
              <StatCard label="Needs attention" value={pendingRequests.length} hint="Pending approvals" tone={pendingRequests.length ? 'orange' : 'green'} />
              <StatCard label="Suspended" value={suspendedCompanies} hint="Workspace access paused" tone={suspendedCompanies ? 'red' : 'neutral'} />
            </div>

            {pendingRequests.length > 0 ? (
              <section className="overflow-hidden rounded-2xl border border-amber-500/20 bg-[#111318]">
                <div className="flex items-center justify-between border-b border-white/[0.06] bg-amber-500/[0.045] px-4 py-3 sm:px-5">
                  <div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-amber-400" /><span className="text-sm font-semibold text-white">Approval queue</span><span className="rounded-md bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-300">{pendingRequests.length}</span></div>
                  <span className="text-[10px] text-[#686B73]">Action required</span>
                </div>
                <div className="divide-y divide-white/[0.05]">
                  {pendingRequests.map(req => (
                    <div key={req.requestId || req.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:px-5">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-xs font-semibold text-white">{req.name?.[0]?.toUpperCase() || '?'}</div>
                        <div className="min-w-0"><div className="truncate text-sm font-medium text-white">{req.name}</div><div className="truncate text-[11px] text-[#777A83]">{req.email} · wants <span className="text-[#A6A8AF]">{req.proposedCompanyName}</span></div></div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => openApproveModal(req)} className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-[#111318] transition hover:bg-[#E9E9EC]"><Check className="h-3.5 w-3.5" /> Approve</button>
                        <button onClick={() => handleReject(req)} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-[11px] text-[#9A9CA4] transition hover:border-red-500/20 hover:bg-red-500/[0.08] hover:text-red-300">Reject</button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            ) : (
              <section className="flex items-center gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.045] p-4"><CheckCircle2 className="h-5 w-5 text-emerald-400" /><div><div className="text-sm font-medium text-white">No approvals waiting</div><div className="text-[11px] text-[#777A83]">Your access queue is clear.</div></div></section>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <button onClick={() => setActiveTab('companies')} className="group flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-left transition hover:border-white/[0.13] hover:bg-white/[0.04]"><div><div className="flex items-center gap-2 text-sm font-semibold text-white"><Building2 className="h-4 w-4 text-[#FF6A2A]" /> Clean up workspaces</div><div className="mt-1 text-xs text-[#777A83]">Review duplicates, status, campaigns and membership counts.</div></div><ChevronRight className="h-4 w-4 text-[#555861] transition group-hover:translate-x-0.5 group-hover:text-white" /></button>
              <button onClick={() => setActiveTab('users')} className="group flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-5 text-left transition hover:border-white/[0.13] hover:bg-white/[0.04]"><div><div className="flex items-center gap-2 text-sm font-semibold text-white"><Users className="h-4 w-4 text-[#FF6A2A]" /> Manage access</div><div className="mt-1 text-xs text-[#777A83]">Activate, suspend or remove accounts and memberships.</div></div><ChevronRight className="h-4 w-4 text-[#555861] transition group-hover:translate-x-0.5 group-hover:text-white" /></button>
            </div>
          </div>
        )}

        {activeTab === 'companies' && (
          <div className="space-y-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div><button onClick={() => setActiveTab('overview')} className="mb-3 inline-flex items-center gap-1 text-[11px] text-[#777A83] hover:text-white"><ArrowLeft className="h-3 w-3" /> Overview</button><h1 className="text-2xl font-semibold tracking-tight text-white">Workspaces</h1><p className="mt-1 text-sm text-[#777A83]">Keep only real ventures and client brands. Apex Engineering Pune is protected.</p></div>
              <button onClick={() => setShowCreateCompanyModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF4500] px-4 py-2.5 text-xs font-semibold text-white"><Plus className="h-4 w-4" /> New workspace</button>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 sm:flex-row sm:items-center">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#555861]" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search workspaces…" className="w-full rounded-xl border border-white/[0.07] bg-black/20 py-2 pl-9 pr-3 text-xs text-white outline-none placeholder:text-[#555861] focus:border-[#FF4500]/40" /></div>
              <div className="flex gap-1 rounded-xl bg-black/20 p-1">{(['all','ACTIVE','SUSPENDED'] as const).map(status => <button key={status} onClick={() => setCompanyStatusFilter(status)} className={`rounded-lg px-3 py-1.5 text-[10px] font-medium ${companyStatusFilter === status ? 'bg-white/[0.09] text-white' : 'text-[#686B73] hover:text-white'}`}>{status === 'all' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Suspended'}</button>)}</div>
            </div>

            {loading ? <div className="py-20 text-center text-xs text-[#686B73]">Loading workspaces…</div> : (
              <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111318]">
                <div className="hidden grid-cols-[1.6fr_.6fr_.65fr_.65fr_1fr] gap-4 border-b border-white/[0.06] px-5 py-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#555861] md:grid"><span>Workspace</span><span>Status</span><span>Members</span><span>Campaigns</span><span className="text-right">Actions</span></div>
                <div className="divide-y divide-white/[0.05]">
                  {filteredCompanies.map(company => {
                    const id = company.companyId || company.id || '';
                    const protectedWorkspace = id === 'org_apex_pune';
                    return <div key={id} className="grid gap-3 px-4 py-4 transition hover:bg-white/[0.018] md:grid-cols-[1.6fr_.6fr_.65fr_.65fr_1fr] md:items-center md:gap-4 md:px-5">
                      <div className="min-w-0"><div className="flex items-center gap-2"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.045]"><Building2 className="h-4 w-4 text-[#FF6A2A]" /></div><div className="min-w-0"><div className="truncate text-sm font-medium text-white">{company.name}</div><div className="truncate text-[10px] font-mono text-[#555861]">{id}{protectedWorkspace ? ' · protected' : ''}</div></div></div></div>
                      <div><span className={`rounded-md px-2 py-1 text-[9px] font-semibold uppercase tracking-wide ${company.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{company.status}</span></div>
                      <div className="text-xs text-[#A6A8AF]"><span className="md:hidden text-[#555861]">Members · </span>{company.memberCount ?? 0}</div>
                      <div className="text-xs text-[#A6A8AF]"><span className="md:hidden text-[#555861]">Campaigns · </span>{company.campaignCount ?? 0}</div>
                      <div className="flex flex-wrap justify-start gap-1.5 md:justify-end">
                        <button onClick={() => onEnterCompanyWorkspace(id)} className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-2.5 py-1.5 text-[10px] text-[#A6A8AF] hover:bg-white/[0.07] hover:text-white">Open</button>
                        <button onClick={() => handleToggleCompanyStatus(company)} className={`rounded-lg px-2.5 py-1.5 text-[10px] ${company.status === 'ACTIVE' ? 'bg-amber-500/[0.08] text-amber-300 hover:bg-amber-500/[0.14]' : 'bg-emerald-500/[0.08] text-emerald-300 hover:bg-emerald-500/[0.14]'}`}>{company.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</button>
                        {!protectedWorkspace && <button onClick={() => { setDeleteTarget({ kind: 'company', company }); setDeleteConfirmText(''); }} className="rounded-lg p-1.5 text-[#686B73] hover:bg-red-500/10 hover:text-red-400" title="Delete workspace"><Trash2 className="h-3.5 w-3.5" /></button>}
                      </div>
                    </div>;
                  })}
                  {!filteredCompanies.length && <div className="px-5 py-14 text-center text-xs text-[#686B73]">No workspaces match this filter.</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-5">
            <div><button onClick={() => setActiveTab('overview')} className="mb-3 inline-flex items-center gap-1 text-[11px] text-[#777A83] hover:text-white"><ArrowLeft className="h-3 w-3" /> Overview</button><h1 className="text-2xl font-semibold tracking-tight text-white">Users & access</h1><p className="mt-1 text-sm text-[#777A83]">Manage account status and remove stale or duplicate users.</p></div>
            <div className="flex flex-col gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 sm:flex-row sm:items-center">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#555861]" /><input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search name, email or workspace…" className="w-full rounded-xl border border-white/[0.07] bg-black/20 py-2 pl-9 pr-3 text-xs text-white outline-none placeholder:text-[#555861] focus:border-[#FF4500]/40" /></div>
              <div className="flex gap-1 rounded-xl bg-black/20 p-1">{(['all','ACTIVE','SUSPENDED'] as const).map(status => <button key={status} onClick={() => setUserStatusFilter(status)} className={`rounded-lg px-3 py-1.5 text-[10px] font-medium ${userStatusFilter === status ? 'bg-white/[0.09] text-white' : 'text-[#686B73] hover:text-white'}`}>{status === 'all' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Suspended'}</button>)}</div>
            </div>
            {loading ? <div className="py-20 text-center text-xs text-[#686B73]">Loading users…</div> : (
              <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-[#111318]">
                <div className="hidden grid-cols-[1.3fr_.65fr_1.4fr_1fr] gap-4 border-b border-white/[0.06] px-5 py-2.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-[#555861] md:grid"><span>User</span><span>Status</span><span>Workspace access</span><span className="text-right">Actions</span></div>
                <div className="divide-y divide-white/[0.05]">
                  {filteredUsers.map(user => {
                    const id = user.userId || user.id || '';
                    const protectedUser = user.isSuperAdmin || id === currentUserId;
                    return <div key={id} className="grid gap-3 px-4 py-4 transition hover:bg-white/[0.018] md:grid-cols-[1.3fr_.65fr_1.4fr_1fr] md:items-center md:gap-4 md:px-5">
                      <div className="flex min-w-0 items-center gap-3"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#2B2E36] to-[#17191F] text-[11px] font-semibold text-white">{user.name?.[0]?.toUpperCase() || '?'}</div><div className="min-w-0"><div className="flex items-center gap-2"><span className="truncate text-sm font-medium text-white">{user.name}</span>{user.isSuperAdmin && <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[#FF6A2A]" />}</div><div className="truncate text-[10px] text-[#686B73]">{user.email}</div></div></div>
                      <div><span className={`rounded-md px-2 py-1 text-[9px] font-semibold uppercase tracking-wide ${user.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>{user.status}</span></div>
                      <div className="flex flex-wrap gap-1.5">{(user.memberships || []).length ? (user.memberships || []).map((m, i) => <span key={`${m.companyId}-${i}`} className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-1 text-[9px] text-[#A6A8AF]">{m.companyName || m.companyId} · {m.role}</span>) : <span className="text-[10px] text-[#555861]">No active workspace</span>}</div>
                      <div className="flex justify-start gap-1.5 md:justify-end">
                        {!user.isSuperAdmin && <button onClick={() => handleToggleUserStatus(user)} className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] ${user.status === 'ACTIVE' ? 'bg-amber-500/[0.08] text-amber-300 hover:bg-amber-500/[0.14]' : 'bg-emerald-500/[0.08] text-emerald-300 hover:bg-emerald-500/[0.14]'}`}>{user.status === 'ACTIVE' ? <UserX className="h-3 w-3" /> : <UserCheck className="h-3 w-3" />}{user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}</button>}
                        {!protectedUser && <button onClick={() => { setDeleteTarget({ kind: 'user', user }); setDeleteConfirmText(''); }} className="rounded-lg p-1.5 text-[#686B73] hover:bg-red-500/10 hover:text-red-400" title="Delete user"><Trash2 className="h-3.5 w-3.5" /></button>}
                      </div>
                    </div>;
                  })}
                  {!filteredUsers.length && <div className="px-5 py-14 text-center text-xs text-[#686B73]">No users match this filter.</div>}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {approvingReq && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-white/[0.1] bg-[#13151A] shadow-2xl">
            <div className="flex items-start justify-between border-b border-white/[0.07] p-5"><div><div className="text-xs font-semibold text-white">Approve access</div><div className="mt-1 text-[11px] text-[#777A83]">{approvingReq.name} · {approvingReq.email}</div></div><button onClick={() => setApprovingReq(null)} className="p-1 text-[#777A83] hover:text-white"><X className="h-4 w-4" /></button></div>
            <div className="space-y-4 p-5">
              <div className="grid grid-cols-2 gap-2"><button onClick={() => setApprovalCompanyChoice('new')} className={`rounded-xl border p-3 text-left text-xs ${approvalCompanyChoice === 'new' ? 'border-[#FF4500]/40 bg-[#FF4500]/10 text-white' : 'border-white/[0.07] text-[#777A83]'}`}><div className="font-semibold">Create workspace</div><div className="mt-1 text-[10px] opacity-70">For a new customer / venture</div></button><button onClick={() => setApprovalCompanyChoice('existing')} className={`rounded-xl border p-3 text-left text-xs ${approvalCompanyChoice === 'existing' ? 'border-[#FF4500]/40 bg-[#FF4500]/10 text-white' : 'border-white/[0.07] text-[#777A83]'}`}><div className="font-semibold">Existing workspace</div><div className="mt-1 text-[10px] opacity-70">Add them to a company</div></button></div>
              {approvalCompanyChoice === 'new' ? <input value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-xs text-white outline-none focus:border-[#FF4500]/40" placeholder="Workspace name" /> : <select value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)} className="w-full rounded-xl border border-white/[0.08] bg-[#0D0F13] px-3 py-2.5 text-xs text-white outline-none">{companies.map(c => <option key={c.companyId || c.id} value={c.companyId || c.id}>{c.name}</option>)}</select>}
              <div><div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#686B73]">Role</div><div className="grid grid-cols-2 gap-2">{(['COMPANY_ADMIN','MEMBER'] as const).map(role => <button key={role} onClick={() => setApprovalRole(role)} className={`rounded-xl border px-3 py-2 text-xs ${approvalRole === role ? 'border-white/[0.16] bg-white/[0.08] text-white' : 'border-white/[0.07] text-[#777A83]'}`}>{role === 'COMPANY_ADMIN' ? 'Company Admin' : 'Member'}</button>)}</div></div>
            </div>
            <div className="flex justify-end gap-2 border-t border-white/[0.07] p-4"><button onClick={() => setApprovingReq(null)} className="rounded-xl px-4 py-2 text-xs text-[#777A83] hover:text-white">Cancel</button><button disabled={submittingAction || (approvalCompanyChoice === 'new' && !newCompanyName.trim()) || (approvalCompanyChoice === 'existing' && !selectedCompanyId)} onClick={handleConfirmApproval} className="rounded-xl bg-[#FF4500] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">{submittingAction ? 'Approving…' : 'Approve access'}</button></div>
          </div>
        </div>
      )}

      {showCreateCompanyModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"><form onSubmit={handleCreateCompany} className="w-full max-w-md rounded-2xl border border-white/[0.1] bg-[#13151A] shadow-2xl"><div className="flex items-center justify-between border-b border-white/[0.07] p-5"><div><div className="text-sm font-semibold text-white">Create workspace</div><div className="mt-1 text-[11px] text-[#777A83]">Add a venture, brand or client workspace.</div></div><button type="button" onClick={() => setShowCreateCompanyModal(false)} className="text-[#777A83] hover:text-white"><X className="h-4 w-4" /></button></div><div className="p-5"><label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#686B73]">Workspace name</label><input autoFocus value={companyNameInput} onChange={e => setCompanyNameInput(e.target.value)} placeholder="e.g. Fairytale Ecom" className="w-full rounded-xl border border-white/[0.08] bg-black/20 px-3 py-2.5 text-xs text-white outline-none placeholder:text-[#555861] focus:border-[#FF4500]/40" /></div><div className="flex justify-end gap-2 border-t border-white/[0.07] p-4"><button type="button" onClick={() => setShowCreateCompanyModal(false)} className="rounded-xl px-4 py-2 text-xs text-[#777A83]">Cancel</button><button disabled={!companyNameInput.trim() || submittingAction} type="submit" className="rounded-xl bg-[#FF4500] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40">Create workspace</button></div></form></div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-red-500/20 bg-[#151316] shadow-2xl">
            <div className="p-5"><div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10"><Trash2 className="h-5 w-5 text-red-400" /></div><h3 className="text-base font-semibold text-white">Permanently delete {deleteTarget.kind === 'company' ? 'workspace' : 'user'}?</h3><p className="mt-2 text-xs leading-5 text-[#8D8F97]">{deleteTarget.kind === 'company' ? <>Deleting <strong className="text-white">{deleteTarget.company.name}</strong> also removes its memberships, campaigns, assets and related operational records. This cannot be undone.</> : <>Deleting <strong className="text-white">{deleteTarget.user.name}</strong> removes their account, sessions and workspace memberships. This cannot be undone.</>}</p><label className="mt-5 block text-[10px] font-semibold uppercase tracking-[0.16em] text-red-300">Type DELETE to confirm</label><input autoFocus value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value.toUpperCase())} placeholder="DELETE" className="mt-2 w-full rounded-xl border border-red-500/20 bg-black/25 px-3 py-2.5 text-xs text-white outline-none focus:border-red-400/50" /></div>
            <div className="flex justify-end gap-2 border-t border-white/[0.06] p-4"><button onClick={() => { setDeleteTarget(null); setDeleteConfirmText(''); }} className="rounded-xl px-4 py-2 text-xs text-[#777A83] hover:text-white">Cancel</button><button disabled={deleteConfirmText !== 'DELETE' || submittingAction} onClick={handleDeleteConfirmed} className="rounded-xl bg-red-500 px-4 py-2 text-xs font-semibold text-white disabled:opacity-35">{submittingAction ? 'Deleting…' : 'Delete permanently'}</button></div>
          </div>
        </div>
      )}
    </div>
  );
};
