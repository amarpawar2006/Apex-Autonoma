import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Loader2,
  Palette,
  RefreshCw,
  Save,
  Sparkles,
  Type,
  WandSparkles,
} from 'lucide-react';
import { autonomaDataService } from '../services/autonomaDataService';
import { BrandDesignSystem, Company, CompanyProfile } from '../types/auth';

const FALLBACK_BRAND: BrandDesignSystem = {
  primaryColor: '#111827',
  secondaryColor: '#FF4500',
  accentColor: '#2563EB',
  backgroundColor: '#F8FAFC',
  textColor: '#111827',
  headingFont: 'Inter',
  bodyFont: 'Inter',
  visualStyleNotes: 'Clean, premium, high-clarity editorial design.',
  imageStyle: 'Authentic, grounded photography with restrained graphic overlays.',
  brandVoiceNote: 'Clear, confident and useful.',
};

const ColorField = ({ label, value, onChange }: { label: string; value?: string; onChange: (value: string) => void }) => (
  <label className="space-y-1.5">
    <span className="block text-[11px] font-medium text-[#6E6E73]">{label}</span>
    <div className="flex items-center gap-2 rounded-xl border border-black/[0.07] bg-white px-2.5 py-2">
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#111827'}
        onChange={(e) => onChange(e.target.value)}
        className="h-7 w-8 cursor-pointer rounded-md border-0 bg-transparent p-0"
      />
      <input
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="#000000"
        className="min-w-0 flex-1 bg-transparent text-xs font-mono text-[#1D1D1F] outline-none"
      />
    </div>
  </label>
);

export const DesignSystemView: React.FC = () => {
  const [company, setCompany] = useState<Company | null>(null);
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [brand, setBrand] = useState<BrandDesignSystem>(FALLBACK_BRAND);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await autonomaDataService.getCompanyProfile();
      setCompany(result.company);
      setProfile(result.profile);
      setBrand({ ...FALLBACK_BRAND, ...(result.profile?.brandDesignSystem || {}) });
    } catch (err: any) {
      setError(err?.message || 'Could not load the active company brand system.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const suggestions = profile?.brandDesignSystem?.websiteSuggestions;
  const previewStyle = useMemo(
    () => ({
      background: brand.backgroundColor || '#F8FAFC',
      color: brand.textColor || '#111827',
      borderColor: `${brand.primaryColor || '#111827'}22`,
    }),
    [brand]
  );

  const patch = <K extends keyof BrandDesignSystem>(key: K, value: BrandDesignSystem[K]) => {
    setBrand((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const applyWebsiteSuggestions = () => {
    if (!suggestions) return;
    setBrand((prev) => ({
      ...prev,
      primaryColor: suggestions.primaryColor || prev.primaryColor,
      secondaryColor: suggestions.secondaryColor || prev.secondaryColor,
      headingFont: suggestions.headingFont || prev.headingFont,
      visualStyleNotes: suggestions.visualTone || prev.visualStyleNotes,
      suggestedFromWebsite: true,
    }));
    setSaved(false);
  };

  const save = async () => {
    if (!company || !profile) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await autonomaDataService.updateCompanyProfile(company.name, {
        ...profile,
        brandDesignSystem: {
          ...brand,
          websiteSuggestions: profile.brandDesignSystem?.websiteSuggestions,
        },
      });
      setCompany(updated);
      setProfile(updated.profile || profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } catch (err: any) {
      setError(err?.message || 'Could not save brand design system.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-black/[0.06] bg-white">
        <div className="flex items-center gap-2 text-xs text-[#6E6E73]"><Loader2 className="h-4 w-4 animate-spin" /> Loading company brand system…</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-[#86868B]">
            <Palette className="h-3.5 w-3.5 text-[#FF4500]" />
            <span>{company?.name || 'Active company'} · Creative Brand System</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1D1D1F]">Brand Design System</h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6E6E73]">
            These company-specific settings are injected into creative briefs, image prompts and campaign styling. They do not change Autonoma's own application theme.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-xs font-medium text-[#1D1D1F] hover:bg-black/[0.03]">
            <RefreshCw className="h-3.5 w-3.5" /> Reload
          </button>
          <button onClick={save} disabled={saving || !profile} className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF4500] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#EA3E00] disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : saved ? 'Saved' : 'Save brand system'}
          </button>
        </div>
      </div>

      {error && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{error}</div>}

      {suggestions && (
        <div className="flex flex-col gap-3 rounded-2xl border border-violet-200 bg-violet-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <WandSparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
            <div>
              <div className="text-xs font-semibold text-violet-950">Website-derived brand suggestions available</div>
              <div className="mt-0.5 text-[11px] text-violet-800">Autonoma found palette/typography direction during company analysis. Apply them only if they look right.</div>
            </div>
          </div>
          <button onClick={applyWebsiteSuggestions} className="rounded-xl bg-white px-3 py-2 text-xs font-semibold text-violet-700 shadow-sm ring-1 ring-violet-200 hover:bg-violet-100">Use suggestions</button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_.85fr]">
        <div className="space-y-5">
          <section className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2"><Palette className="h-4 w-4 text-[#FF4500]" /><h2 className="text-sm font-semibold text-[#1D1D1F]">Brand palette</h2></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ColorField label="Primary" value={brand.primaryColor} onChange={(v) => patch('primaryColor', v)} />
              <ColorField label="Secondary" value={brand.secondaryColor} onChange={(v) => patch('secondaryColor', v)} />
              <ColorField label="Accent" value={brand.accentColor} onChange={(v) => patch('accentColor', v)} />
              <ColorField label="Background" value={brand.backgroundColor} onChange={(v) => patch('backgroundColor', v)} />
              <ColorField label="Text" value={brand.textColor} onChange={(v) => patch('textColor', v)} />
            </div>
          </section>

          <section className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2"><Type className="h-4 w-4 text-[#FF4500]" /><h2 className="text-sm font-semibold text-[#1D1D1F]">Typography & identity</h2></div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5"><span className="text-[11px] font-medium text-[#6E6E73]">Heading font</span><input value={brand.headingFont || ''} onChange={(e) => patch('headingFont', e.target.value)} placeholder="e.g. Inter, Syne, Montserrat" className="w-full rounded-xl border border-black/[0.07] bg-[#FBFBFD] px-3.5 py-2.5 text-xs outline-none focus:border-[#FF4500]/40" /></label>
              <label className="space-y-1.5"><span className="text-[11px] font-medium text-[#6E6E73]">Body font</span><input value={brand.bodyFont || ''} onChange={(e) => patch('bodyFont', e.target.value)} placeholder="e.g. Inter, Manrope" className="w-full rounded-xl border border-black/[0.07] bg-[#FBFBFD] px-3.5 py-2.5 text-xs outline-none focus:border-[#FF4500]/40" /></label>
              <label className="space-y-1.5 sm:col-span-2"><span className="text-[11px] font-medium text-[#6E6E73]">Logo URL / asset reference</span><input value={brand.logoUrl || ''} onChange={(e) => patch('logoUrl', e.target.value)} placeholder="https://… or saved asset reference" className="w-full rounded-xl border border-black/[0.07] bg-[#FBFBFD] px-3.5 py-2.5 text-xs outline-none focus:border-[#FF4500]/40" /></label>
            </div>
          </section>

          <section className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-sm sm:p-6">
            <div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-[#FF4500]" /><h2 className="text-sm font-semibold text-[#1D1D1F]">Creative direction</h2></div>
            <div className="space-y-4">
              <label className="block space-y-1.5"><span className="text-[11px] font-medium text-[#6E6E73]">Visual style notes</span><textarea value={brand.visualStyleNotes || ''} onChange={(e) => patch('visualStyleNotes', e.target.value)} rows={3} placeholder="Editorial, minimal, industrial, warm, premium…" className="w-full resize-y rounded-xl border border-black/[0.07] bg-[#FBFBFD] px-3.5 py-2.5 text-xs leading-relaxed outline-none focus:border-[#FF4500]/40" /></label>
              <label className="block space-y-1.5"><span className="text-[11px] font-medium text-[#6E6E73]">Image / photography style</span><textarea value={brand.imageStyle || ''} onChange={(e) => patch('imageStyle', e.target.value)} rows={2} placeholder="Photorealistic, authentic people, product macro photography…" className="w-full resize-y rounded-xl border border-black/[0.07] bg-[#FBFBFD] px-3.5 py-2.5 text-xs leading-relaxed outline-none focus:border-[#FF4500]/40" /></label>
              <label className="block space-y-1.5"><span className="text-[11px] font-medium text-[#6E6E73]">Brand voice note</span><textarea value={brand.brandVoiceNote || ''} onChange={(e) => patch('brandVoiceNote', e.target.value)} rows={2} placeholder="Practical, expert, direct, human…" className="w-full resize-y rounded-xl border border-black/[0.07] bg-[#FBFBFD] px-3.5 py-2.5 text-xs leading-relaxed outline-none focus:border-[#FF4500]/40" /></label>
            </div>
          </section>
        </div>

        <aside className="xl:sticky xl:top-28 xl:self-start">
          <div className="overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-sm">
            <div className="border-b border-black/[0.05] px-5 py-4"><div className="text-xs font-semibold text-[#1D1D1F]">Live creative preview</div><div className="mt-0.5 text-[10px] text-[#86868B]">A lightweight preview of the saved company tokens.</div></div>
            <div className="p-5">
              <div style={previewStyle} className="min-h-[360px] rounded-2xl border p-6 shadow-inner">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] opacity-60">{company?.name || 'Brand'}</div>
                  <div className="h-3 w-12 rounded-full" style={{ backgroundColor: brand.secondaryColor || '#FF4500' }} />
                </div>
                <div className="mt-14 max-w-sm">
                  <div className="mb-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold" style={{ backgroundColor: `${brand.accentColor || '#2563EB'}18`, color: brand.accentColor || '#2563EB' }}>CAMPAIGN CREATIVE</div>
                  <h3 className="text-3xl font-bold leading-[1.05] tracking-tight" style={{ fontFamily: brand.headingFont || 'Inter' }}>A clear idea deserves a clear visual system.</h3>
                  <p className="mt-4 text-sm leading-relaxed opacity-70" style={{ fontFamily: brand.bodyFont || 'Inter' }}>{brand.visualStyleNotes || 'Your saved visual direction will guide future creatives.'}</p>
                  <div className="mt-7 inline-flex rounded-xl px-4 py-2.5 text-xs font-semibold text-white" style={{ backgroundColor: brand.primaryColor || '#111827' }}>Primary action →</div>
                </div>
                <div className="mt-12 flex gap-2"><div className="h-2 flex-1 rounded-full" style={{ backgroundColor: brand.primaryColor || '#111827' }} /><div className="h-2 w-16 rounded-full" style={{ backgroundColor: brand.secondaryColor || '#FF4500' }} /><div className="h-2 w-10 rounded-full" style={{ backgroundColor: brand.accentColor || '#2563EB' }} /></div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
