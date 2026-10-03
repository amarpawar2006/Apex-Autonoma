import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, FileText, Send, ShieldCheck } from 'lucide-react';
import { SocialAsset } from '../types/campaign';

interface PublishingOrchestratorViewProps {
  assets: SocialAsset[];
}

export const PublishingOrchestratorView: React.FC<PublishingOrchestratorViewProps> = ({ assets = [] }) => {
  const [selectedAssetId, setSelectedAssetId] = useState<string>(assets[0]?.id ?? '');
  const activeAsset = assets.find((asset) => asset.id === selectedAssetId) || assets[0];

  const readiness = useMemo(() => {
    if (!activeAsset) return [];
    return [
      { label: 'Content copy', ok: Boolean(activeAsset.caption?.trim()) },
      { label: 'Call to action', ok: Boolean(activeAsset.callToAction?.trim()) },
      { label: 'Schedule', ok: Boolean(activeAsset.targetDate && activeAsset.postTimeIST) },
      { label: 'Media', ok: Boolean(activeAsset.generatedImageUrl || activeAsset.generatedVideoUrl || Object.keys(activeAsset.carouselSlideVisuals || {}).length) },
      { label: 'Approval', ok: activeAsset.status === 'approved' || activeAsset.status === 'scheduled' || activeAsset.productionStatus === 'APPROVED' }
    ];
  }, [activeAsset]);

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

          <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-[11px] leading-relaxed text-blue-900">
            Connected auto-publishing is not assumed. Use the approved posting pack or a configured publishing connector when available.
          </div>
        </section>
      </div>
    </div>
  );
};
