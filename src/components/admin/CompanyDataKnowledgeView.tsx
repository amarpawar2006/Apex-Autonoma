import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, 
  FileText, 
  Users, 
  Layers, 
  History, 
  Search, 
  Trash2, 
  Plus, 
  RefreshCw,
  Building,
  AlertCircle,
  X
} from 'lucide-react';
import { 
  DbKnowledgeSourceRow, 
  DbCompanyKnowledgeRow, 
  DbContactRow, 
  DbAudienceListRow 
} from '../../types/database';
import { autonomaDataService } from '../../services/autonomaDataService';
import { Company, UserRole } from '../../types/auth';

interface CompanyDataKnowledgeViewProps {
  activeCompany?: Company | null;
  userRole?: UserRole | string;
  isSuperAdmin?: boolean;
}

export const CompanyDataKnowledgeView: React.FC<CompanyDataKnowledgeViewProps> = ({
  activeCompany,
  userRole = 'MEMBER',
  isSuperAdmin = false
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'knowledge' | 'contacts' | 'audiences' | 'history'>('knowledge');
  
  // Companies list for Super Admin dropdown and company name lookup
  const [companies, setCompanies] = useState<Company[]>([]);
  
  // Selected Company filter: default 'ALL' for Super Admin, or activeCompany for Company Admin
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    isSuperAdmin ? 'ALL' : (activeCompany?.companyId || (activeCompany as any)?.id || '')
  );

  // Data state
  const [knowledgeSources, setKnowledgeSources] = useState<DbKnowledgeSourceRow[]>([]);
  const [companyKnowledge, setCompanyKnowledge] = useState<DbCompanyKnowledgeRow[]>([]);
  const [contacts, setContacts] = useState<DbContactRow[]>([]);
  const [audienceLists, setAudienceLists] = useState<DbAudienceListRow[]>([]);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [segmentFilter, setSegmentFilter] = useState<string>('ALL');

  // New Knowledge Item Modal State
  const [showAddKnowledge, setShowAddKnowledge] = useState<boolean>(false);
  const [newKnowledgeTitle, setNewKnowledgeTitle] = useState<string>('');
  const [newKnowledgeCategory, setNewKnowledgeCategory] = useState<string>('COMPANY_KNOWLEDGE');
  const [newKnowledgeContent, setNewKnowledgeContent] = useState<string>('');
  const [knowledgeTargetCompanyId, setKnowledgeTargetCompanyId] = useState<string>('');
  const [isSavingKnowledge, setIsSavingKnowledge] = useState<boolean>(false);

  // New Contact Modal State
  const [showAddContact, setShowAddContact] = useState<boolean>(false);
  const [newContactName, setNewContactName] = useState<string>('');
  const [newContactEmail, setNewContactEmail] = useState<string>('');
  const [newContactPhone, setNewContactPhone] = useState<string>('');
  const [newContactCompany, setNewContactCompany] = useState<string>('');
  const [newContactSegment, setNewContactSegment] = useState<string>('');
  const [newContactLocation, setNewContactLocation] = useState<string>('');
  const [contactTargetCompanyId, setContactTargetCompanyId] = useState<string>('');
  const [isSavingContact, setIsSavingContact] = useState<boolean>(false);

  const canManage = isSuperAdmin || userRole === 'COMPANY_ADMIN';

  // Load companies for Super Admin
  useEffect(() => {
    if (isSuperAdmin) {
      autonomaDataService.getAdminCompanies()
        .then((all) => {
          if (Array.isArray(all)) {
            setCompanies(all);
          }
        })
        .catch((err) => {
          console.warn('[CompanyDataKnowledgeView] Could not load companies list:', err);
        });
    } else if (activeCompany) {
      setCompanies([activeCompany]);
    }
  }, [isSuperAdmin, activeCompany]);

  // Synchronize non-superadmin selected company
  useEffect(() => {
    if (!isSuperAdmin) {
      const lockedId = activeCompany?.companyId || (activeCompany as any)?.id || '';
      setSelectedCompanyId(lockedId);
    }
  }, [isSuperAdmin, activeCompany?.companyId, (activeCompany as any)?.id]);

  const activeCompanies = useMemo(() => {
    return companies.filter(c => c.status === 'ACTIVE');
  }, [companies]);

  // Resolve human company name
  const getCompanyLabel = (orgId?: string): string => {
    if (!orgId) return 'Global';
    const found = companies.find(c => (c.companyId || (c as any).id) === orgId);
    if (found) return found.name;
    if (activeCompany && ((activeCompany.companyId || (activeCompany as any).id) === orgId)) {
      return activeCompany.name;
    }
    return orgId;
  };

  const currentContextText = useMemo(() => {
    if (isSuperAdmin) {
      if (selectedCompanyId === 'ALL') {
        return 'Viewing data across all companies';
      }
      return `Viewing data for: ${getCompanyLabel(selectedCompanyId)}`;
    }
    return `Viewing data for: ${activeCompany?.name || 'Your Company'}`;
  }, [isSuperAdmin, selectedCompanyId, companies, activeCompany]);

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Super Admin: if 'ALL', targetId is undefined (fetch all). If specific company selected, targetId is that company ID.
      // Company Admin: targetId is always their active company ID.
      let targetId: string | undefined = undefined;
      if (isSuperAdmin) {
        targetId = (selectedCompanyId && selectedCompanyId !== 'ALL') ? selectedCompanyId : undefined;
      } else {
        targetId = activeCompany?.companyId || (activeCompany as any)?.id;
      }

      const [sourcesRes, knowledgeRes, contactsRes, listsRes] = await Promise.all([
        autonomaDataService.getKnowledgeSources(targetId),
        autonomaDataService.getCompanyKnowledge(targetId),
        autonomaDataService.getContacts(targetId),
        autonomaDataService.getAudienceLists(targetId)
      ]);

      setKnowledgeSources(sourcesRes);
      setCompanyKnowledge(knowledgeRes);
      setContacts(contactsRes);
      setAudienceLists(listsRes);
    } catch (err: any) {
      setError(err?.message || 'Failed to load company data & knowledge');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, [selectedCompanyId, isSuperAdmin, activeCompany?.companyId, (activeCompany as any)?.id]);

  // Knowledge Deletion
  const handleDeleteKnowledge = async (knowledgeId: string) => {
    if (!window.confirm('Delete this knowledge item?')) return;
    try {
      await autonomaDataService.deleteCompanyKnowledge(knowledgeId);
      setCompanyKnowledge(prev => prev.filter(k => k.knowledgeId !== knowledgeId));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete knowledge item');
    }
  };

  // Contact Deletion
  const handleDeleteContact = async (contactId: string) => {
    if (!window.confirm('Delete this contact?')) return;
    try {
      await autonomaDataService.deleteContact(contactId);
      setContacts(prev => prev.filter(c => c.contactId !== contactId));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete contact');
    }
  };

  // Audience List Deletion
  const handleDeleteAudienceList = async (listId: string) => {
    if (!window.confirm('Delete this audience list?')) return;
    try {
      await autonomaDataService.deleteAudienceList(listId);
      setAudienceLists(prev => prev.filter(l => l.listId !== listId));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete audience list');
    }
  };

  // Knowledge Source Deletion
  const handleDeleteSource = async (sourceId: string) => {
    if (!window.confirm('Delete this import record and associated file?')) return;
    try {
      await autonomaDataService.deleteKnowledgeSource(sourceId);
      setKnowledgeSources(prev => prev.filter(s => s.sourceId !== sourceId));
      setCompanyKnowledge(prev => prev.filter(k => k.sourceId !== sourceId));
    } catch (err: any) {
      alert(err?.message || 'Failed to delete import source');
    }
  };

  // Modal Open Handlers with scoping
  const handleOpenAddKnowledge = () => {
    if (isSuperAdmin) {
      setKnowledgeTargetCompanyId(selectedCompanyId === 'ALL' ? '' : selectedCompanyId);
    } else {
      setKnowledgeTargetCompanyId(activeCompany?.companyId || (activeCompany as any)?.id || '');
    }
    setShowAddKnowledge(true);
  };

  const handleOpenAddContact = () => {
    if (isSuperAdmin) {
      setContactTargetCompanyId(selectedCompanyId === 'ALL' ? '' : selectedCompanyId);
    } else {
      setContactTargetCompanyId(activeCompany?.companyId || (activeCompany as any)?.id || '');
    }
    setShowAddContact(true);
  };

  // Knowledge Creation
  const handleSaveNewKnowledge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKnowledgeTitle.trim() || !newKnowledgeContent.trim()) return;

    const targetOrgId = isSuperAdmin
      ? knowledgeTargetCompanyId
      : (activeCompany?.companyId || (activeCompany as any)?.id);

    if (!targetOrgId || targetOrgId === 'ALL') {
      alert('Please explicitly select a target company.');
      return;
    }

    setIsSavingKnowledge(true);
    try {
      const created = await autonomaDataService.saveCompanyKnowledge({
        title: newKnowledgeTitle.trim(),
        category: newKnowledgeCategory,
        content: newKnowledgeContent.trim(),
        organizationId: targetOrgId
      });
      setCompanyKnowledge(prev => [created, ...prev]);
      setShowAddKnowledge(false);
      setNewKnowledgeTitle('');
      setNewKnowledgeContent('');
      setKnowledgeTargetCompanyId('');
    } catch (err: any) {
      alert(err?.message || 'Failed to save knowledge item');
    } finally {
      setIsSavingKnowledge(false);
    }
  };

  // Contact Creation
  const handleSaveNewContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() && !newContactEmail.trim() && !newContactPhone.trim()) {
      alert('Please provide at least a name, email, or phone number.');
      return;
    }

    const targetOrgId = isSuperAdmin
      ? contactTargetCompanyId
      : (activeCompany?.companyId || (activeCompany as any)?.id);

    if (!targetOrgId || targetOrgId === 'ALL') {
      alert('Please explicitly select a target company.');
      return;
    }

    setIsSavingContact(true);
    try {
      const created = await autonomaDataService.saveContact({
        name: newContactName.trim() || 'Contact',
        email: newContactEmail.trim() || undefined,
        phone: newContactPhone.trim() || undefined,
        company: newContactCompany.trim() || undefined,
        segment: newContactSegment.trim() || undefined,
        location: newContactLocation.trim() || undefined,
        organizationId: targetOrgId
      });
      setContacts(prev => [created, ...prev]);
      setShowAddContact(false);
      setNewContactName('');
      setNewContactEmail('');
      setNewContactPhone('');
      setNewContactCompany('');
      setNewContactSegment('');
      setNewContactLocation('');
      setContactTargetCompanyId('');
    } catch (err: any) {
      alert(err?.message || 'Failed to save contact');
    } finally {
      setIsSavingContact(false);
    }
  };

  // Filtered Knowledge Items
  const filteredKnowledge = useMemo(() => {
    return companyKnowledge.filter(k => {
      const matchesSearch = !searchQuery || 
        k.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        k.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'ALL' || k.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [companyKnowledge, searchQuery, categoryFilter]);

  // Filtered Contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter(c => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !searchQuery || 
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q)) ||
        (c.location && c.location.toLowerCase().includes(q));
      const matchesSegment = segmentFilter === 'ALL' || c.segment === segmentFilter;
      return matchesSearch && matchesSegment;
    });
  }, [contacts, searchQuery, segmentFilter]);

  // Distinct segments for filter dropdown
  const distinctSegments = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach(c => {
      if (c.segment) set.add(c.segment);
    });
    return Array.from(set);
  }, [contacts]);

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="rounded-3xl border border-black/[0.07] bg-white p-5 sm:p-7 shadow-sm">
        
        {/* Top Company Selector / Context Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 mb-5 border-b border-black/[0.06]">
          {isSuperAdmin ? (
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="super-admin-company-select" className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-[#FF4500]" />
                <span>Company</span>
              </label>
              <select
                id="super-admin-company-select"
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="bg-[#F5F5F7] hover:bg-black/[0.04] border border-black/[0.1] rounded-xl px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] focus:outline-none focus:ring-2 focus:ring-[#FF4500]/20 transition-all cursor-pointer"
              >
                <option value="ALL">All Companies</option>
                {activeCompanies.map((c) => (
                  <option key={c.companyId || (c as any).id} value={c.companyId || (c as any).id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="text-xs font-medium text-[#6E6E73] bg-[#F5F5F7] px-3 py-1 rounded-lg border border-black/[0.04]">
                {currentContextText}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-xs font-medium text-[#6E6E73] bg-[#F5F5F7] px-3 py-1.5 rounded-xl border border-black/[0.04] flex items-center gap-2">
                <Building className="w-3.5 h-3.5 text-[#FF4500]" />
                <span className="font-semibold text-[#1D1D1F]">{currentContextText}</span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadAllData}
              disabled={isLoading}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#F5F5F7] hover:bg-black/[0.06] text-[#1D1D1F] text-xs font-medium rounded-xl transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-[#6E6E73]">
              <Database className="h-3.5 w-3.5 text-[#FF4500]" />
              <span>Company Data &amp; Context Isolation</span>
              {isSuperAdmin && (
                <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-semibold">
                  Global Administrative Visibility
                </span>
              )}
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
              Company Data &amp; Knowledge
            </h1>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-[#6E6E73]">
              Manage ingested business intelligence, verified customer accounts, audience segments, and source file archives scoped to {isSuperAdmin && selectedCompanyId === 'ALL' ? 'all companies' : getCompanyLabel(selectedCompanyId)}.
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="mt-6 flex flex-wrap gap-2 border-t border-black/[0.06] pt-4">
          <button
            type="button"
            onClick={() => setActiveSubTab('knowledge')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeSubTab === 'knowledge'
                ? 'bg-[#1D1D1F] text-white shadow-sm'
                : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Knowledge ({companyKnowledge.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('contacts')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeSubTab === 'contacts'
                ? 'bg-[#1D1D1F] text-white shadow-sm'
                : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contacts ({contacts.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('audiences')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeSubTab === 'audiences'
                ? 'bg-[#1D1D1F] text-white shadow-sm'
                : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Audience Lists ({audienceLists.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('history')}
            className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
              activeSubTab === 'history'
                ? 'bg-[#1D1D1F] text-white shadow-sm'
                : 'bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-black/[0.05]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Import History ({knowledgeSources.length})</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-900 flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Subtab 1: Knowledge */}
      {activeSubTab === 'knowledge' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#86868B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search company knowledge…"
                  className="w-full bg-white pl-9 pr-3 py-2 rounded-xl border border-black/[0.08] text-xs text-[#1D1D1F] focus:outline-none"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-white px-3 py-2 rounded-xl border border-black/[0.08] text-xs text-[#1D1D1F] focus:outline-none"
              >
                <option value="ALL">All Categories</option>
                <option value="COMPANY_KNOWLEDGE">Company Knowledge</option>
                <option value="PRODUCT">Products &amp; Offerings</option>
                <option value="AUDIENCE">Audience Segments</option>
                <option value="CAMPAIGN_HISTORY">Campaign History</option>
              </select>
            </div>

            {canManage && (
              <button
                type="button"
                onClick={handleOpenAddKnowledge}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Knowledge</span>
              </button>
            )}
          </div>

          {filteredKnowledge.length === 0 ? (
            <div className="rounded-2xl border border-black/[0.06] bg-white p-12 text-center text-xs text-[#86868B]">
              No company knowledge records found. Import business files or add manual entries.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredKnowledge.map((item) => (
                <div key={item.knowledgeId} className="rounded-2xl border border-black/[0.07] bg-white p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-orange-50 text-[#FF4500] border border-[#FF4500]/20">
                          {item.category}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-800 border border-black/[0.06] flex items-center gap-1">
                          <Building className="w-2.5 h-2.5 text-[#6E6E73]" />
                          <span>{getCompanyLabel(item.organizationId)}</span>
                        </span>
                      </div>
                      <h3 className="text-xs font-semibold text-[#1D1D1F]">
                        {item.title}
                      </h3>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDeleteKnowledge(item.knowledgeId)}
                        className="text-[#86868B] hover:text-red-600 p-1 rounded-lg hover:bg-black/[0.04]"
                        title="Delete knowledge item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-[#6E6E73] leading-relaxed whitespace-pre-wrap">
                    {item.content}
                  </p>
                  <div className="pt-2 border-t border-black/[0.04] text-[10px] text-[#86868B] flex items-center justify-between">
                    <span>Updated {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}</span>
                    {item.structuredJson && (
                      <span className="font-mono text-[9px] bg-[#F5F5F7] px-2 py-0.5 rounded">
                        Structured JSON
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 2: Contacts */}
      {activeSubTab === 'contacts' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#86868B]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts by name, email, company…"
                  className="w-full bg-white pl-9 pr-3 py-2 rounded-xl border border-black/[0.08] text-xs text-[#1D1D1F] focus:outline-none"
                />
              </div>

              {distinctSegments.length > 0 && (
                <select
                  value={segmentFilter}
                  onChange={(e) => setSegmentFilter(e.target.value)}
                  className="bg-white px-3 py-2 rounded-xl border border-black/[0.08] text-xs text-[#1D1D1F] focus:outline-none"
                >
                  <option value="ALL">All Segments</option>
                  {distinctSegments.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </div>

            {canManage && (
              <button
                type="button"
                onClick={handleOpenAddContact}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl shadow-sm transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Contact</span>
              </button>
            )}
          </div>

          {filteredContacts.length === 0 ? (
            <div className="rounded-2xl border border-black/[0.06] bg-white p-12 text-center text-xs text-[#86868B]">
              No contacts found matching criteria.
            </div>
          ) : (
            <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#1D1D1F]">
                  <thead className="bg-[#FBFBFD] border-b border-black/[0.06] text-[10px] uppercase font-semibold text-[#86868B]">
                    <tr>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Company Owner</th>
                      <th className="py-3 px-4">Organization / Employer</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Segment / Location</th>
                      {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {filteredContacts.map((c) => (
                      <tr key={c.contactId} className="hover:bg-black/[0.015] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#1D1D1F]">{c.name}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-800 border border-black/[0.06]">
                            <Building className="w-2.5 h-2.5 text-[#6E6E73]" />
                            <span>{getCompanyLabel(c.organizationId)}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#6E6E73]">{c.company || '—'}</td>
                        <td className="py-3 px-4 text-[#6E6E73]">{c.email || '—'}</td>
                        <td className="py-3 px-4 text-[#6E6E73]">{c.phone || '—'}</td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col space-y-0.5">
                            {c.segment && (
                              <span className="text-[10px] font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded w-fit">
                                {c.segment}
                              </span>
                            )}
                            {c.location && (
                              <span className="text-[10px] text-[#86868B]">{c.location}</span>
                            )}
                          </div>
                        </td>
                        {canManage && (
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteContact(c.contactId)}
                              className="text-[#86868B] hover:text-red-600 p-1"
                              title="Delete contact"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Subtab 3: Audience Lists */}
      {activeSubTab === 'audiences' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1D1D1F]">
              Attached &amp; Curated Distribution Lists ({audienceLists.length})
            </span>
          </div>

          {audienceLists.length === 0 ? (
            <div className="rounded-2xl border border-black/[0.06] bg-white p-12 text-center text-xs text-[#86868B]">
              No audience lists created yet. Ingest a contact sheet or build a targeted list.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {audienceLists.map((list) => (
                <div key={list.listId} className="rounded-2xl border border-black/[0.07] bg-white p-4 space-y-2.5 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                          {list.listType}
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-800 border border-black/[0.06] flex items-center gap-1">
                          <Building className="w-2.5 h-2.5 text-[#6E6E73]" />
                          <span>{getCompanyLabel(list.organizationId)}</span>
                        </span>
                      </div>
                      <h3 className="text-xs font-semibold text-[#1D1D1F]">
                        {list.name}
                      </h3>
                    </div>
                    {canManage && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAudienceList(list.listId)}
                        className="text-[#86868B] hover:text-red-600 p-1"
                        title="Delete list"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  {list.description && (
                    <p className="text-xs text-[#6E6E73]">{list.description}</p>
                  )}
                  <div className="pt-2 border-t border-black/[0.04] text-[11px] font-medium text-emerald-700 flex items-center justify-between">
                    <span>{list.contactCount.toLocaleString()} members</span>
                    <span className="text-[10px] text-[#86868B]">
                      {new Date(list.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Subtab 4: Import History */}
      {activeSubTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#1D1D1F]">
              Source File Import Archives ({knowledgeSources.length})
            </span>
          </div>

          {knowledgeSources.length === 0 ? (
            <div className="rounded-2xl border border-black/[0.06] bg-white p-12 text-center text-xs text-[#86868B]">
              No files imported yet.
            </div>
          ) : (
            <div className="rounded-2xl border border-black/[0.08] bg-white overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#1D1D1F]">
                  <thead className="bg-[#FBFBFD] border-b border-black/[0.06] text-[10px] uppercase font-semibold text-[#86868B]">
                    <tr>
                      <th className="py-3 px-4">File Name</th>
                      <th className="py-3 px-4">Company</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Size</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Imported At</th>
                      {canManage && <th className="py-3 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/[0.04]">
                    {knowledgeSources.map((source) => (
                      <tr key={source.sourceId} className="hover:bg-black/[0.015] transition-colors">
                        <td className="py-3 px-4 font-semibold text-[#1D1D1F]">{source.fileName}</td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-100 text-gray-800 border border-black/[0.06]">
                            <Building className="w-2.5 h-2.5 text-[#6E6E73]" />
                            <span>{getCompanyLabel(source.organizationId)}</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#6E6E73]">{source.fileType}</td>
                        <td className="py-3 px-4 text-[#6E6E73]">{(source.fileSize / 1024).toFixed(0)} KB</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                            {source.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#6E6E73]">{new Date(source.createdAt).toLocaleDateString()}</td>
                        {canManage && (
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteSource(source.sourceId)}
                              className="text-[#86868B] hover:text-red-600 p-1"
                              title="Delete source record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Knowledge Modal */}
      {showAddKnowledge && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1D1D1F]">Add Company Knowledge Item</h3>
              <button type="button" onClick={() => setShowAddKnowledge(false)} className="text-[#6E6E73]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveNewKnowledge} className="space-y-3 text-xs">
              {isSuperAdmin && (
                <div>
                  <label className="block text-[#86868B] mb-1 font-medium">Target Company *</label>
                  <select
                    required
                    value={knowledgeTargetCompanyId}
                    onChange={(e) => setKnowledgeTargetCompanyId(e.target.value)}
                    className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] border-0 focus:outline-none"
                  >
                    <option value="">Select a company (required)…</option>
                    {activeCompanies.map((c) => (
                      <option key={c.companyId || (c as any).id} value={c.companyId || (c as any).id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-[#86868B] mb-1 font-medium">Title</label>
                <input
                  type="text"
                  required
                  value={newKnowledgeTitle}
                  onChange={(e) => setNewKnowledgeTitle(e.target.value)}
                  placeholder="e.g. 2026 Core Value Propositions"
                  className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] border-0 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[#86868B] mb-1 font-medium">Category</label>
                <select
                  value={newKnowledgeCategory}
                  onChange={(e) => setNewKnowledgeCategory(e.target.value)}
                  className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] border-0 focus:outline-none"
                >
                  <option value="COMPANY_KNOWLEDGE">Company Knowledge</option>
                  <option value="PRODUCT">Products &amp; Offerings</option>
                  <option value="AUDIENCE">Audience Segments</option>
                  <option value="CAMPAIGN_HISTORY">Campaign History</option>
                </select>
              </div>
              <div>
                <label className="block text-[#86868B] mb-1 font-medium">Content / Details</label>
                <textarea
                  rows={4}
                  required
                  value={newKnowledgeContent}
                  onChange={(e) => setNewKnowledgeContent(e.target.value)}
                  placeholder="Enter detailed facts, guidelines, or segment descriptions…"
                  className="w-full bg-[#F5F5F7] p-3 rounded-xl text-xs text-[#1D1D1F] border-0 focus:outline-none"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddKnowledge(false)}
                  className="px-4 py-2 text-xs font-medium text-[#6E6E73]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingKnowledge}
                  className="px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl shadow-sm"
                >
                  {isSavingKnowledge ? 'Saving…' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-[#1D1D1F]">Add Contact</h3>
              <button type="button" onClick={() => setShowAddContact(false)} className="text-[#6E6E73]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveNewContact} className="space-y-3 text-xs">
              {isSuperAdmin && (
                <div>
                  <label className="block text-[#86868B] mb-1 font-medium">Target Company *</label>
                  <select
                    required
                    value={contactTargetCompanyId}
                    onChange={(e) => setContactTargetCompanyId(e.target.value)}
                    className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] border-0 focus:outline-none"
                  >
                    <option value="">Select a company (required)…</option>
                    {activeCompanies.map((c) => (
                      <option key={c.companyId || (c as any).id} value={c.companyId || (c as any).id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#86868B] mb-1 font-medium">Name</label>
                  <input
                    type="text"
                    value={newContactName}
                    onChange={(e) => setNewContactName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] border-0 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#86868B] mb-1 font-medium">Company</label>
                  <input
                    type="text"
                    value={newContactCompany}
                    onChange={(e) => setNewContactCompany(e.target.value)}
                    placeholder="Company / Org"
                    className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] border-0 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#86868B] mb-1 font-medium">Email</label>
                  <input
                    type="email"
                    value={newContactEmail}
                    onChange={(e) => setNewContactEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] border-0 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#86868B] mb-1 font-medium">Phone</label>
                  <input
                    type="text"
                    value={newContactPhone}
                    onChange={(e) => setNewContactPhone(e.target.value)}
                    placeholder="+91..."
                    className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] border-0 focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#86868B] mb-1 font-medium">Segment</label>
                  <input
                    type="text"
                    value={newContactSegment}
                    onChange={(e) => setNewContactSegment(e.target.value)}
                    placeholder="e.g. Distributor, OEM"
                    className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] border-0 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#86868B] mb-1 font-medium">Location</label>
                  <input
                    type="text"
                    value={newContactLocation}
                    onChange={(e) => setNewContactLocation(e.target.value)}
                    placeholder="e.g. Pune, MH"
                    className="w-full bg-[#F5F5F7] px-3.5 py-2 rounded-xl text-xs text-[#1D1D1F] border-0 focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddContact(false)}
                  className="px-4 py-2 text-xs font-medium text-[#6E6E73]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingContact}
                  className="px-4 py-2 bg-[#FF4500] hover:bg-[#EA3E00] text-white text-xs font-medium rounded-xl shadow-sm"
                >
                  {isSavingContact ? 'Saving…' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
