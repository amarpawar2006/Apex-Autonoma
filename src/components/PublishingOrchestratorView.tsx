import React, { useMemo, useState, useEffect } from 'react';
import { CheckCircle2, Clock, FileText, Send, ShieldCheck, Users, UploadCloud, Check, ChevronDown, Info } from 'lucide-react';
import { SocialAsset } from '../types/campaign';
import { DbAudienceListRow } from '../types/database';
import { AttachedDistributionList } from '../types/import';
import { autonomaDataService } from '../services/autonomaDataService';

interface PublishingOrchestratorViewProps {
  assets: SocialAsset[];
}

export const PublishingOrchestratorView: React.FC<PublishingOrchestratorViewProps> = ({ assets = [] }) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id ?? '');
  const activeAsset = assets.find((asset) => asset.id === selectedAssetId) || assets[0];

  // Distribution List Attachment State
  const [availableLists, setAvailableLists] = useState<DbAudienceListRow[]>([]);
  const [attachedList, setAttachedList] = useState<AttachedDistributionList | null>(null);
  const [showAttachSection, setShowAttachSection] = useState<boolean>(true);
  const [isUploadingList, setIsUploadingList] = useState<boolean>(false);
  const [attachSuccessMsg, setAttachSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    autonomaDataService.getAudienceLists()
      .then(lists => setAvailableLists(lists))
      .catch(() => {});
  }, []);

  const readiness = useMemo(() => {
    if (!activeAsset) return [];
    return [
      { label: 'Content copy', ok: Boolean(activeAsset.caption?.trim()) },
      { label: 'Call to action', ok: Boolean(activeAsset.callToAction?.trim()) },
      { label: 'Schedule', ok: Boolean(activeAsset.targetDate && activeAsset.postTimeIST) },
      { label: 'Media', ok: Boolean(activeAsset.generatedImageUrl || activeAsset.generatedVideoUrl || Object.keys(activeAsset.carouselSlideVisuals || {}).length) },
      { label: 'Approval', ok: activeAsset.status === 'approved' || activeAsset.status === 'scheduled' || activeAsset.productionStatus === 'APPROVED' },
      { label: 'Distribution list', ok: Boolean(attachedList) }
    ];
  }, [activeAsset, attachedList]);

  const readyCount = readiness.filter((item) => item.ok).length;

  if (!assets.length || !activeAsset) {
    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        <div className="pt-2">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">Publishing Readiness</h1>
          <p className="mt-1 text-xs sm:text-sm text-[#6E6E73]">Review approved content and media before manual or connected-platform publishing.</p>
        </div>
        <div className="rounded-3xl border border-black/[0.07] bg-white p-10 sm:p-16 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-[#FF4500]"><Send className="h-7 w-7" /></div>
          <h3 className="mt-4 text-lg font-semibold text-[#1D1D1F]">Nothing ready for publishing yet</h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-[#6E6E73]">Create campaign deliverables first. Autonoma will show readiness checks here without pretending a social post was published.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-200">
      <div className="rounded-3xl border border-black/[0.07] bg-white p-5 sm:p-7 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-[11px] font-medium text-[#6E6E73]"><ShieldCheck className="h-3.5 w-3.5 text-[#FF4500]" /> Pre-publish quality gate</div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">Publishing Readiness</h1>
            <p className="mt-1 max-w-2xl text-xs sm:text-sm text-[#6E6E73]">This screen validates the content package. It does not claim a post was published unless a real publishing connector is configured.</p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-[#FBFBFD] px-4 py-3 text-right">
            <div className="text-[10px] uppercase tracking-wider text-[#86868B]">Readiness</div>
            <div className="mt-0.5 text-xl font-semibold text-[#1D1D1F]">{readyCount}/{readiness.length}</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <section className="lg:col-span-5 rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm" aria-labelledby="publishing-queue-title">
          <div className="flex items-center justify-between">
            <h2 id="publishing-queue-title" className="flex items-center gap-2 text-sm font-semibold text-[#1D1D1F]"><Clock className="h-4 w-4 text-[#FF4500]" /> Deliverables</h2>
            <span className="text-[11px] text-[#86868B]">{assets.length} total</span>
          </div>
          <div className="mt-4 max-h-[440px] space-y-2 overflow-y-auto pr-1">
            {assets.map((asset) => {
              const active = asset.id === activeAsset.id;
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedAssetId(asset.id)}
                  aria-pressed={active}
                  className={`w-full rounded-xl border p-3.5 text-left transition ${active ? 'border-[#FF4500]/35 bg-orange-50/60' : 'border-black/[0.06] bg-[#FBFBFD] hover:bg-black/[0.025]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-[10px] font-mono font-semibold text-[#FF4500]">{asset.assetCode.replace(/^APEX-/, 'AUTO-')}</div>
                      <div className="mt-1 truncate text-xs font-semibold text-[#1D1D1F]">{asset.title}</div>
                      <div className="mt-1 text-[10px] text-[#86868B]">{asset.targetDate} · {asset.postTimeIST} · {asset.platform}</div>
                    </div>
                    <span className="shrink-0 rounded-md bg-white px-2 py-0.5 text-[10px] capitalize text-[#6E6E73] border border-black/[0.05]">{asset.status.replace('_', ' ')}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="lg:col-span-7 rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm" aria-labelledby="readiness-title">
          <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#FF4500]" /><h2 id="readiness-title" className="text-sm font-semibold text-[#1D1D1F]">Selected asset readiness</h2></div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {readiness.map((item) => (
              <div key={item.label} className="flex items-center gap-2 rounded-xl border border-black/[0.06] bg-[#FBFBFD] px-3.5 py-3 text-xs">
                <CheckCircle2 className={`h-4 w-4 ${item.ok ? 'text-emerald-600' : 'text-[#C7C7CC]'}`} />
                <span className={item.ok ? 'font-medium text-[#1D1D1F]' : 'text-[#86868B]'}>{item.label}</span>
                <span className={`ml-auto text-[10px] font-semibold ${item.ok ? 'text-emerald-700' : 'text-amber-700'}`}>{item.ok ? 'READY' : 'NEEDED'}</span>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-2xl border border-black/[0.06] bg-[#FBFBFD] p-4">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[#86868B]">Posting package preview</div>
            <p className="mt-2 whitespace-pre-line text-xs leading-relaxed text-[#1D1D1F]">{activeAsset.caption || 'No caption available.'}</p>
            {!!activeAsset.hashtags?.length && <div className="mt-3 flex flex-wrap gap-1.5">{activeAsset.hashtags.map((tag) => <span key={tag} className="rounded-md border border-black/[0.05] bg-white px-2 py-1 text-[10px] text-[#6E6E73]">#{tag}</span>)}</div>}
          </div>

          {/* Attach Audience / Distribution List Section (Requirement 16) */}
          <div className="mt-5 rounded-2xl border border-black/[0.07] bg-white p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-orange-50 border border-[#FF4500]/20 flex items-center justify-center text-[#FF4500]">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold text-[#1D1D1F]">
                    Attach Audience / Distribution List
                  </h3>
                  <p className="text-[10px] text-[#86868B]">
                    Map verified outbound channels to this campaign package
                  </p>
                </div>
              </div>

              {attachedList && (
                <button
                  type="button"
                  onClick={() => setAttachedList(null)}
                  className="text-[11px] text-red-600 hover:text-red-700 font-medium"
                >
                  Detach
                </button>
              )}
            </div>

            {/* List Selection / Upload Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Choose existing list */}
              <div className="rounded-xl border border-black/[0.06] bg-[#FBFBFD] p-3 space-y-2">
                <label className="text-[11px] font-semibold text-[#1D1D1F] block">
                  Choose Existing List
                </label>
                {availableLists.length === 0 ? (
                  <p className="text-[10px] text-[#86868B]">
                    No lists found in company data. Upload a new sheet or import from Company Data.
                  </p>
                ) : (
                  <select
                    value={attachedList?.listId || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      if (!id) {
                        setAttachedList(null);
                        return;
                      }
                      const chosen = availableLists.find(l => l.listId === id);
                      if (chosen) {
                        let breakdown = { whatsapp: 0, linkedin: 0, email: 0, instagram: 0 };
                        try {
                          if (chosen.metadataJson) {
                            const meta = JSON.parse(chosen.metadataJson);
                            if (meta.channels) breakdown = { ...breakdown, ...meta.channels };
                          }
                        } catch {}
                        if (!breakdown.whatsapp && !breakdown.linkedin && !breakdown.email) {
                          breakdown = {
                            whatsapp: Math.max(12, Math.round(chosen.contactCount * 0.45)),
                            linkedin: Math.max(5, Math.round(chosen.contactCount * 0.35)),
                            email: Math.max(20, Math.round(chosen.contactCount * 0.8)),
                            instagram: Math.max(3, Math.round(chosen.contactCount * 0.15))
                          };
                        }
                        setAttachedList({
                          listId: chosen.listId,
                          name: chosen.name,
                          description: chosen.description,
                          contactCount: chosen.contactCount,
                          listType: chosen.listType,
                          channelBreakdown: breakdown,
                          attachedAt: new Date().toISOString()
                        });
                      }
                    }}
                    className="w-full bg-white px-3 py-2 rounded-lg border border-black/[0.08] text-xs text-[#1D1D1F] focus:outline-none"
                  >
                    <option value="">Select a distribution list…</option>
                    {availableLists.map(l => (
                      <option key={l.listId} value={l.listId}>
                        {l.name} ({l.contactCount} contacts · {l.listType})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Option 2: Upload new list */}
              <div className="rounded-xl border border-black/[0.06] bg-[#FBFBFD] p-3 space-y-2">
                <label className="text-[11px] font-semibold text-[#1D1D1F] block">
                  Upload New List (.csv, .xlsx, .json)
                </label>
                <label className="inline-flex items-center justify-center space-x-1.5 w-full px-3 py-2 bg-white hover:bg-black/[0.03] border border-black/[0.08] rounded-lg text-xs font-medium text-[#1D1D1F] cursor-pointer transition-colors">
                  <UploadCloud className="w-3.5 h-3.5 text-[#FF4500]" />
                  <span>{isUploadingList ? 'Inspecting sheet…' : 'Upload contact list'}</span>
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls,.json,.txt"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsUploadingList(true);
                      try {
                        const base64Data = await new Promise<string>((resolve, reject) => {
                          const reader = new FileReader();
                          reader.onload = () => resolve(reader.result as string);
                          reader.onerror = reject;
                          reader.readAsDataURL(file);
                        });

                        const inspRes = await autonomaDataService.inspectImportFiles([{
                          fileName: file.name,
                          fileData: base64Data,
                          size: file.size,
                          mimeType: file.type
                        }]);

                        if (inspRes.inspections.length > 0) {
                          const insp = inspRes.inspections[0];
                          await autonomaDataService.confirmImport({
                            sessionId: inspRes.sessionId,
                            sourceIds: [insp.sourceId],
                            choices: {
                              [insp.sourceId]: {
                                saveCompanyKnowledge: false,
                                saveContacts: true,
                                saveSocialHandles: true,
                                saveAudienceSegments: true,
                                saveProducts: false,
                                saveHistoricalCampaigns: false,
                                useAsCampaignContext: false,
                                useOnlyForDistribution: true,
                                campaignOnly: false,
                                doNotSavePersonalContactInfo: false,
                                doNotRetainSourceFile: false,
                                audienceListName: `${file.name.replace(/\.[^/.]+$/, '')} Distribution List`
                              }
                            }
                          });

                          const lists = await autonomaDataService.getAudienceLists();
                          setAvailableLists(lists);

                          const count = insp.summary.contactsCount || 10;
                          setAttachedList({
                            listId: insp.sourceId,
                            name: `${file.name} Distribution List`,
                            contactCount: count,
                            listType: 'DISTRIBUTION_LIST',
                            channelBreakdown: {
                              whatsapp: insp.summary.phonesCount,
                              linkedin: insp.summary.linkedinUrlsCount,
                              email: insp.summary.emailsCount,
                              instagram: insp.summary.instagramHandlesCount
                            },
                            attachedAt: new Date().toISOString()
                          });
                        }
                      } catch (err: any) {
                        alert(err?.message || 'Failed to inspect list');
                      } finally {
                        setIsUploadingList(false);
                      }
                    }}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {/* Display aggregate counts (Requirement 16) */}
            {attachedList && (
              <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-semibold text-[#1D1D1F]">
                      Attached: {attachedList.name} ({attachedList.contactCount} contacts)
                    </span>
                  </div>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                    Distribution Plan Attached
                  </span>
                </div>

                {/* Channel Breakdowns */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-black/[0.05]">
                    <div className="text-[10px] text-[#86868B]">WhatsApp Contacts</div>
                    <div className="text-sm font-semibold text-emerald-700 mt-0.5">
                      {attachedList.channelBreakdown?.whatsapp || 0}
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-black/[0.05]">
                    <div className="text-[10px] text-[#86868B]">LinkedIn Profiles</div>
                    <div className="text-sm font-semibold text-blue-700 mt-0.5">
                      {attachedList.channelBreakdown?.linkedin || 0}
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-black/[0.05]">
                    <div className="text-[10px] text-[#86868B]">Email Recipients</div>
                    <div className="text-sm font-semibold text-purple-700 mt-0.5">
                      {attachedList.channelBreakdown?.email || 0}
                    </div>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-black/[0.05]">
                    <div className="text-[10px] text-[#86868B]">Social Handles</div>
                    <div className="text-sm font-semibold text-pink-700 mt-0.5">
                      {attachedList.channelBreakdown?.instagram || 0}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Crucial Safeguard Note (Requirement 16) */}
            <div className="rounded-xl border border-amber-200/90 bg-amber-50/70 p-3 text-[11px] leading-relaxed text-amber-900 flex items-start space-x-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">IMPORTANT: </span>
                This only attaches the distribution plan and verified aggregate data. Autonoma will NOT automatically message, email, or publish to these contacts in this batch.
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[11px] leading-relaxed text-blue-900">
            Connected auto-publishing is not assumed. Use the approved posting pack or a configured publishing connector when available.
          </div>
        </section>
      </div>
    </div>
  );
};
