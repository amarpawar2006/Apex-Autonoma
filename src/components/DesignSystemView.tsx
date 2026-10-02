import React, { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  FileText,
  Loader2,
  Palette,
  RefreshCw,
  Save,
  Sparkles,
  Type,
  Upload,
  Video,
  WandSparkles,
  AlertCircle,
  Eye,
  Check,
  X,
  FileCheck
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
  visualStyleNotes: 'Clean, premium, high-clarity editorial design with high contrast.',
  imageStyle: 'Authentic, grounded photography with restrained graphic overlays.',
  videoStyleDirection: 'Crisp, fast-paced editorial transitions, bold kinetic typography, and authentic b-roll.',
  creativeRules: 'Avoid generic stock cliches. Never make unverified promotional claims. Maintain high contrast.',
  brandVoiceNote: 'Clear, confident, authoritative and useful.'
};

const ColorField = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value?: string; 
  onChange: (value: string) => void 
}) => (
  <label className="space-y-1.5 block">
    <span className="block text-[11px] font-medium text-[#6E6E73]">{label}</span>
    <div className="flex items-center gap-2 rounded-xl border border-black/[0.08] bg-white px-2.5 py-1.5 shadow-2xs hover:border-black/20 transition-all">
      <input
        type="color"
        value={/^#[0-9a-fA-F]{6}$/.test(value || '') ? value : '#111827'}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-7 cursor-pointer rounded-md border-0 bg-transparent p-0"
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

  // PDF Ingestion States
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [pdfAnalysis, setPdfAnalysis] = useState<{
    suggestions?: BrandDesignSystem['pdfSuggestions'];
    extractedSummary?: string;
    pageCount?: number;
    rawTextSnippet?: string;
  } | null>(null);
  const [pdfUploadSuccess, setPdfUploadSuccess] = useState<string | null>(null);
  const [pdfUploadError, setPdfUploadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await autonomaDataService.getCompanyProfile();
      setCompany(result.company);
      setProfile(result.profile);
      setBrand({ ...FALLBACK_BRAND, ...(result.profile?.brandDesignSystem || {}) });
    } catch (err: any) {
      setError(err?.message || 'Could not load company brand design system.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const websiteSuggestions = profile?.brandDesignSystem?.websiteSuggestions;
  const previewStyle = useMemo(
    () => ({
      background: brand.backgroundColor || '#F8FAFC',
      color: brand.textColor || '#111827',
      borderColor: `${brand.primaryColor || '#111827'}22`
    }),
    [brand]
  );

  const patch = <K extends keyof BrandDesignSystem>(key: K, value: BrandDesignSystem[K]) => {
    setBrand((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  // Handle Logo Upload as Data URL
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      patch('logoUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle Brand Guidelines PDF Upload
  const handlePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.pdf') && file.type !== 'application/pdf') {
      setPdfUploadError('Please select a valid PDF file.');
      return;
    }

    setIsUploadingPdf(true);
    setPdfUploadError(null);
    setPdfUploadSuccess(null);
    setPdfAnalysis(null);

    try {
      const result = await autonomaDataService.analyzeBrandPdf(file);
      if (result.success && result.suggestions) {
        setPdfAnalysis(result);
        setPdfUploadSuccess(`Analyzed ${file.name} (${result.pageCount || 1} pages). Review suggested brand tokens below before applying.`);
      } else {
        throw new Error('No suggestions generated from PDF.');
      }
    } catch (err: any) {
      setPdfUploadError(err?.message || 'Failed to analyze Brand Guidelines PDF.');
    } finally {
      setIsUploadingPdf(false);
      // Reset input value to allow re-uploading same file if desired
      e.target.value = '';
    }
  };

  // Apply suggestions from PDF analysis after user review
  const applyPdfSuggestions = () => {
    if (!pdfAnalysis?.suggestions) return;
    const s = pdfAnalysis.suggestions;
    setBrand((prev) => ({
      ...prev,
      primaryColor: s.primaryColor || prev.primaryColor,
      secondaryColor: s.secondaryColor || prev.secondaryColor,
      accentColor: s.accentColor || prev.accentColor,
      backgroundColor: s.backgroundColor || prev.backgroundColor,
      textColor: s.textColor || prev.textColor,
      headingFont: s.headingFont || prev.headingFont,
      bodyFont: s.bodyFont || prev.bodyFont,
      visualStyleNotes: s.visualStyleNotes || prev.visualStyleNotes,
      imageStyle: s.imageStyle || prev.imageStyle,
      videoStyleDirection: s.videoStyleDirection || prev.videoStyleDirection,
      creativeRules: s.creativeRules || prev.creativeRules,
      brandVoiceNote: s.brandVoiceNote || prev.brandVoiceNote,
      suggestedFromPdf: true
    }));
    setPdfAnalysis(null);
    setPdfUploadSuccess('Applied PDF brand tokens! Review values and click "Save brand system" to confirm.');
    setSaved(false);
  };

  // Apply website-detected suggestions
  const applyWebsiteSuggestions = () => {
    if (!websiteSuggestions) return;
    setBrand((prev) => ({
      ...prev,
      primaryColor: websiteSuggestions.primaryColor || prev.primaryColor,
      secondaryColor: websiteSuggestions.secondaryColor || prev.secondaryColor,
      accentColor: websiteSuggestions.accentColor || prev.accentColor,
      headingFont: websiteSuggestions.headingFont || prev.headingFont,
      visualStyleNotes: websiteSuggestions.visualTone || prev.visualStyleNotes,
      suggestedFromWebsite: true
    }));
    setSaved(false);
  };

  // Save confirmed Brand Design System to active Company profile
  const save = async () => {
    if (!company || !profile) return;
    setSaving(true);
    setError(null);
    try {
      const updated = await autonomaDataService.updateCompanyProfile(company.name, {
        ...profile,
        brandDesignSystem: {
          ...brand,
          websiteSuggestions: profile.brandDesignSystem?.websiteSuggestions
        }
      });
      setCompany(updated);
      setProfile(updated.profile || profile);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: any) {
      setError(err?.message || 'Could not save brand design system.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-black/[0.06] bg-white">
        <div className="flex items-center gap-2 text-xs text-[#6E6E73]">
          <Loader2 className="h-4 w-4 animate-spin text-[#FF4500]" />
          Loading company campaign styling system…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      {/* Top Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11px] font-medium text-[#86868B]">
            <Palette className="h-3.5 w-3.5 text-[#FF4500]" />
            <span>{company?.name || 'Active company'} · Campaign Styling System</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Brand Design System
          </h1>
          <p className="mt-1 max-w-2xl text-xs sm:text-sm text-[#6E6E73] leading-relaxed">
            Company-specific creative tokens injected into image generation, video direction, and copy briefs.
            This defines your brand's output creatives and remains isolated to <strong>{company?.name}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/[0.08] bg-white px-3.5 py-2 text-xs font-medium text-[#1D1D1F] hover:bg-black/[0.03] transition-all shadow-2xs"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Reload
          </button>
          <button
            onClick={save}
            disabled={saving || !profile}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#FF4500] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#EA3E00] active:scale-95 disabled:opacity-50 transition-all"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saving ? 'Saving…' : saved ? 'Saved to Company' : 'Save Brand System'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {/* SECTION 2: BRAND GUIDELINES PDF INGESTION */}
      <div className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-2xs sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-orange-50 text-[#FF4500]">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[#1D1D1F]">Brand Guidelines PDF Ingestion</h2>
              <p className="text-[11px] text-[#6E6E73]">
                Upload official company brand guidelines PDF. AI safely extracts typography, palettes, and rules for your review.
              </p>
            </div>
          </div>

          <label className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0A0B0E] hover:bg-black text-white px-3.5 py-2 text-xs font-semibold cursor-pointer transition-all active:scale-95 shadow-sm shrink-0">
            {isUploadingPdf ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span>{isUploadingPdf ? 'Extracting text & analyzing…' : 'Upload Brand Guidelines PDF'}</span>
            <input
              type="file"
              accept=".pdf"
              disabled={isUploadingPdf}
              onChange={handlePdfUpload}
              className="hidden"
            />
          </label>
        </div>

        {pdfUploadError && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
            <span>{pdfUploadError}</span>
          </div>
        )}

        {pdfUploadSuccess && !pdfAnalysis && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
            <span>{pdfUploadSuccess}</span>
          </div>
        )}

        {/* PDF Analysis Suggestions Review Modal/Box */}
        {pdfAnalysis?.suggestions && (
          <div className="rounded-2xl border-2 border-[#FF4500]/25 bg-orange-50/50 p-4 sm:p-5 space-y-4 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-orange-200/60 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#FF4500] text-white">
                  PDF Guidelines Extracted
                </span>
                <span className="text-xs font-semibold text-[#1D1D1F]">
                  Review Brand Suggestions Before Applying
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPdfAnalysis(null)}
                  className="rounded-xl border border-black/10 bg-white px-3 py-1.5 text-xs text-[#6E6E73] hover:text-[#1D1D1F]"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={applyPdfSuggestions}
                  className="rounded-xl bg-[#FF4500] hover:bg-[#EA3E00] text-white px-3.5 py-1.5 text-xs font-semibold shadow-xs flex items-center gap-1.5"
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>Apply & Populate Form</span>
                </button>
              </div>
            </div>

            {pdfAnalysis.extractedSummary && (
              <p className="text-xs text-[#4A4A4F] italic bg-white/70 p-2.5 rounded-xl border border-orange-200/50">
                "{pdfAnalysis.extractedSummary}"
              </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-black/[0.06] space-y-1">
                <span className="text-[10px] text-[#6E6E73] block">Colors</span>
                <div className="flex items-center gap-1.5">
                  <span className="h-4 w-4 rounded-full border border-black/10 inline-block" style={{ backgroundColor: pdfAnalysis.suggestions.primaryColor }} />
                  <span className="h-4 w-4 rounded-full border border-black/10 inline-block" style={{ backgroundColor: pdfAnalysis.suggestions.secondaryColor }} />
                  <span className="h-4 w-4 rounded-full border border-black/10 inline-block" style={{ backgroundColor: pdfAnalysis.suggestions.accentColor }} />
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-black/[0.06] space-y-1">
                <span className="text-[10px] text-[#6E6E73] block">Fonts</span>
                <span className="font-semibold text-[#1D1D1F] truncate block">
                  {pdfAnalysis.suggestions.headingFont} / {pdfAnalysis.suggestions.bodyFont}
                </span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-black/[0.06] space-y-1 sm:col-span-2">
                <span className="text-[10px] text-[#6E6E73] block">Visual Direction</span>
                <span className="text-[#1D1D1F] line-clamp-1 block">
                  {pdfAnalysis.suggestions.visualStyleNotes}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 3: WEBSITE BRAND SUGGESTIONS */}
      {websiteSuggestions && (
        <div className="flex flex-col gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-2.5">
            <WandSparkles className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-100 text-blue-900 border border-blue-200">
                  Detected from website
                </span>
                <span className="text-xs font-semibold text-blue-950">
                  Website Brand Suggestions Available
                </span>
              </div>
              <div className="mt-0.5 text-[11px] text-blue-800">
                Colors and typography detected during website context analysis. Confirmed saved brand system always wins.
              </div>
            </div>
          </div>
          <button
            onClick={applyWebsiteSuggestions}
            className="rounded-xl bg-white px-3.5 py-1.5 text-xs font-semibold text-blue-700 shadow-2xs border border-blue-200 hover:bg-blue-100 shrink-0 self-start sm:self-auto"
          >
            Review & Apply
          </button>
        </div>
      )}

      {/* MAIN TWO-COLUMN FORM & LIVE PREVIEW */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.18fr_.82fr]">
        <div className="space-y-5">
          {/* 1. Brand Palette */}
          <section className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-2xs sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#FF4500]" />
                <h2 className="text-sm font-semibold text-[#1D1D1F]">Brand Palette</h2>
              </div>
              <span className="text-[10px] font-mono text-[#86868B]">HEX TOKENS</span>
            </div>
            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              <ColorField label="Primary Color" value={brand.primaryColor} onChange={(v) => patch('primaryColor', v)} />
              <ColorField label="Secondary Color" value={brand.secondaryColor} onChange={(v) => patch('secondaryColor', v)} />
              <ColorField label="Accent Color" value={brand.accentColor} onChange={(v) => patch('accentColor', v)} />
              <ColorField label="Background Color" value={brand.backgroundColor} onChange={(v) => patch('backgroundColor', v)} />
              <ColorField label="Text Color" value={brand.textColor} onChange={(v) => patch('textColor', v)} />
            </div>
          </section>

          {/* 2. Typography & Logo */}
          <section className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-2xs sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="h-4 w-4 text-[#FF4500]" />
                <h2 className="text-sm font-semibold text-[#1D1D1F]">Typography & Logo Reference</h2>
              </div>
              <span className="text-[10px] font-mono text-[#86868B]">CAMPAIGN ASSETS</span>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="space-y-1.5">
                <span className="text-[11px] font-medium text-[#6E6E73]">Heading font direction</span>
                <input
                  value={brand.headingFont || ''}
                  onChange={(e) => patch('headingFont', e.target.value)}
                  placeholder="e.g. Inter, Syne, Montserrat Bold"
                  className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3.5 py-2 text-xs outline-none focus:border-[#FF4500]"
                />
              </label>
              <label className="space-y-1.5">
                <span className="text-[11px] font-medium text-[#6E6E73]">Body font direction</span>
                <input
                  value={brand.bodyFont || ''}
                  onChange={(e) => patch('bodyFont', e.target.value)}
                  placeholder="e.g. Inter, Manrope, Roboto"
                  className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3.5 py-2 text-xs outline-none focus:border-[#FF4500]"
                />
              </label>

              <div className="sm:col-span-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-[#6E6E73]">Logo URL or uploaded reference</span>
                  <label className="text-[11px] text-[#FF4500] hover:underline cursor-pointer flex items-center gap-1 font-medium">
                    <Upload className="h-3 w-3" />
                    <span>Upload image file</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
                <input
                  value={brand.logoUrl || ''}
                  onChange={(e) => patch('logoUrl', e.target.value)}
                  placeholder="https://... or uploaded image data"
                  className="w-full rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3.5 py-2 text-xs outline-none focus:border-[#FF4500]"
                />
              </div>
            </div>
          </section>

          {/* 3. Creative Direction & Media Styles */}
          <section className="rounded-3xl border border-black/[0.06] bg-white p-5 shadow-2xs sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#FF4500]" />
                <h2 className="text-sm font-semibold text-[#1D1D1F]">Creative & Media Direction</h2>
              </div>
              <span className="text-[10px] font-mono text-[#86868B]">PROMPT INJECTION</span>
            </div>
            <div className="space-y-4">
              <label className="block space-y-1.5">
                <span className="text-[11px] font-medium text-[#6E6E73]">Visual style note</span>
                <textarea
                  value={brand.visualStyleNotes || ''}
                  onChange={(e) => patch('visualStyleNotes', e.target.value)}
                  rows={2}
                  placeholder="Editorial, minimal, industrial, warm, premium aesthetic…"
                  className="w-full resize-y rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3.5 py-2 text-xs leading-relaxed outline-none focus:border-[#FF4500]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-medium text-[#6E6E73]">Image style / Photography direction</span>
                <textarea
                  value={brand.imageStyle || ''}
                  onChange={(e) => patch('imageStyle', e.target.value)}
                  rows={2}
                  placeholder="Photorealistic, authentic people in real settings, macro product focus, cinematic lighting…"
                  className="w-full resize-y rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3.5 py-2 text-xs leading-relaxed outline-none focus:border-[#FF4500]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-medium text-[#6E6E73] flex items-center gap-1.5">
                  <Video className="h-3.5 w-3.5 text-[#FF4500]" />
                  <span>Video style direction</span>
                </span>
                <textarea
                  value={brand.videoStyleDirection || ''}
                  onChange={(e) => patch('videoStyleDirection', e.target.value)}
                  rows={2}
                  placeholder="Fast kinetic pacing, bold on-screen typography, authentic dynamic b-roll, high production value…"
                  className="w-full resize-y rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3.5 py-2 text-xs leading-relaxed outline-none focus:border-[#FF4500]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-medium text-[#6E6E73]">Brand voice note</span>
                <textarea
                  value={brand.brandVoiceNote || ''}
                  onChange={(e) => patch('brandVoiceNote', e.target.value)}
                  rows={2}
                  placeholder="Direct, authoritative, clear, conversational, grounded…"
                  className="w-full resize-y rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3.5 py-2 text-xs leading-relaxed outline-none focus:border-[#FF4500]"
                />
              </label>

              <label className="block space-y-1.5">
                <span className="text-[11px] font-medium text-[#6E6E73]">Creative rules / Avoid notes</span>
                <textarea
                  value={brand.creativeRules || ''}
                  onChange={(e) => patch('creativeRules', e.target.value)}
                  rows={2}
                  placeholder="No cheesy generic stock imagery. Never make unverified promotional claims. Avoid saturated pinks…"
                  className="w-full resize-y rounded-xl border border-black/[0.08] bg-[#FBFBFD] px-3.5 py-2 text-xs leading-relaxed outline-none focus:border-[#FF4500]"
                />
              </label>
            </div>
          </section>
        </div>

        {/* LIVE PREVIEW COLUMN */}
        <aside className="xl:sticky xl:top-24 xl:self-start space-y-4">
          <div className="overflow-hidden rounded-3xl border border-black/[0.07] bg-white shadow-2xs">
            <div className="border-b border-black/[0.05] px-5 py-4 flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#1D1D1F]">Live Campaign Creative Preview</div>
                <div className="mt-0.5 text-[10px] text-[#86868B]">
                  Simulating how generated posters, carousels, and media use your saved tokens.
                </div>
              </div>
              <Eye className="h-4 w-4 text-[#86868B]" />
            </div>

            <div className="p-5">
              <div style={previewStyle} className="min-h-[380px] rounded-2xl border p-6 shadow-inner flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      {brand.logoUrl ? (
                        <img src={brand.logoUrl} alt="Logo" className="h-6 w-auto max-w-[90px] object-contain rounded" />
                      ) : (
                        <span className="text-[11px] font-bold uppercase tracking-[0.16em] opacity-80">
                          {company?.name || 'COMPANY BRAND'}
                        </span>
                      )}
                    </div>
                    <div
                      className="h-2.5 w-10 rounded-full"
                      style={{ backgroundColor: brand.secondaryColor || '#FF4500' }}
                    />
                  </div>

                  <div className="mt-10 max-w-sm">
                    <div
                      className="mb-3 inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-bold"
                      style={{
                        backgroundColor: `${brand.accentColor || '#2563EB'}20`,
                        color: brand.accentColor || '#2563EB'
                      }}
                    >
                      AUTONOMOUS CAMPAIGN CREATIVE
                    </div>
                    <h3
                      className="text-2xl sm:text-3xl font-bold leading-[1.08] tracking-tight"
                      style={{ fontFamily: brand.headingFont || 'Inter' }}
                    >
                      Every piece of content speaks in one authentic voice.
                    </h3>
                    <p
                      className="mt-3.5 text-xs sm:text-sm leading-relaxed opacity-75"
                      style={{ fontFamily: brand.bodyFont || 'Inter' }}
                    >
                      {brand.visualStyleNotes || 'Your saved visual style guides future AI image and media synthesis.'}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-black/10 flex items-center justify-between">
                  <div
                    className="inline-flex rounded-xl px-3.5 py-2 text-xs font-semibold text-white shadow-2xs"
                    style={{ backgroundColor: brand.primaryColor || '#111827' }}
                  >
                    Actionable CTA →
                  </div>

                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-6 rounded-full" style={{ backgroundColor: brand.primaryColor || '#111827' }} />
                    <div className="h-2 w-4 rounded-full" style={{ backgroundColor: brand.secondaryColor || '#FF4500' }} />
                    <div className="h-2 w-3 rounded-full" style={{ backgroundColor: brand.accentColor || '#2563EB' }} />
                  </div>
                </div>
              </div>

              {/* Creative Rules Summary Chip */}
              {brand.creativeRules && (
                <div className="mt-3 p-2.5 rounded-xl bg-slate-50 border border-black/[0.04] text-[11px] text-[#6E6E73]">
                  <span className="font-semibold text-[#1D1D1F] block text-[10px] uppercase">Active Guardrail:</span>
                  <span className="line-clamp-2">{brand.creativeRules}</span>
                </div>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
