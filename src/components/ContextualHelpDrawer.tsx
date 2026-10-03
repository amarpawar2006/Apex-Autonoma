import React, { useEffect, useMemo, useState } from 'react';
import {
  X,
  Search,
  Compass,
  FolderKanban,
  FileSpreadsheet,
  Calendar,
  Palette,
  Layers,
  Image as ImageIcon,
  Video,
  Settings,
  Send,
  Building2,
  ArrowRight,
  LifeBuoy
} from 'lucide-react';
import { AppNavTab } from './Header';

interface ContextualHelpDrawerProps {
  isOpen: boolean;
  activeTab: AppNavTab;
  companyName?: string;
  onClose: () => void;
  onNavigate: (tab: AppNavTab) => void;
  onOpenSettings: () => void;
  onOpenCompanySetup: () => void;
  onOpenCampaignGenerator: () => void;
}

interface HelpTopic {
  id: string;
  title: string;
  description: string;
  keywords: string;
  actionLabel?: string;
  action?: () => void;
  icon: React.ComponentType<{ className?: string }>;
}

const tabNames: Record<AppNavTab, string> = {
  todays_production: 'Today',
  master_sheet: 'Content',
  campaigns: 'Campaigns',
  creative_studio: 'Studio',
  calendar: 'Calendar',
  design_system: 'Brand',
  virality: 'Growth Mechanics',
  publishing: 'Publishing',
  archive: 'Archive'
};

export const ContextualHelpDrawer: React.FC<ContextualHelpDrawerProps> = ({
  isOpen,
  activeTab,
  companyName,
  onClose,
  onNavigate,
  onOpenSettings,
  onOpenCompanySetup,
  onOpenCampaignGenerator
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [isOpen, onClose]);

  const topics = useMemo<HelpTopic[]>(() => [
    {
      id: 'campaigns',
      title: 'Create or review a campaign',
      description: 'Create a campaign, open campaign detail, inspect its strategy, concepts and deliverables, or retry only a failed generation.',
      keywords: 'campaign create generate retry strategy deliverables',
      actionLabel: 'Open Campaigns',
      action: () => onNavigate('campaigns'),
      icon: FolderKanban
    },
    {
      id: 'content',
      title: 'Find every content deliverable',
      description: 'Content is the master production sheet for all generated posts. Filter by campaign, open an asset, update status, or send it to Studio.',
      keywords: 'content post asset master sheet filter copy caption',
      actionLabel: 'Open Content',
      action: () => onNavigate('master_sheet'),
      icon: FileSpreadsheet
    },
    {
      id: 'brand',
      title: 'Control the company Brand System',
      description: 'Brand colors, fonts, voice, imagery direction and creative rules are company-specific and are applied to new media production.',
      keywords: 'brand design system colors font logo voice style',
      actionLabel: 'Open Brand',
      action: () => onNavigate('design_system'),
      icon: Palette
    },
    {
      id: 'studio',
      title: 'Produce image, carousel or video media',
      description: 'Studio previews the selected asset using the active company Brand System. Open an asset to generate media or use the deterministic branded renderer.',
      keywords: 'studio image carousel poster reel media generate preview',
      actionLabel: 'Open Studio',
      action: () => onNavigate('creative_studio'),
      icon: Layers
    },
    {
      id: 'image',
      title: 'Image generation is failing',
      description: 'Open AI & Media Providers and confirm at least one image provider is configured. Autonoma can automatically fall back to another configured image provider when the preferred one fails.',
      keywords: 'image openai nvidia gemini generation fail provider api key quota',
      actionLabel: 'AI & Media Providers',
      action: onOpenSettings,
      icon: ImageIcon
    },
    {
      id: 'video',
      title: 'Video generation and Veo billing',
      description: 'Google Veo text-to-video requires paid API billing/quota. If Veo is unavailable, copy the production-ready prompt/storyboard, generate externally, then upload the finished MP4 back into the asset.',
      keywords: 'video veo billing quota mp4 upload runway google ai studio',
      actionLabel: 'AI & Media Providers',
      action: onOpenSettings,
      icon: Video
    },
    {
      id: 'schedule',
      title: 'Schedule and calendar',
      description: 'Calendar organizes planned deliverables. Adjust a post date/time from the asset inspector, then review schedule readiness in Calendar.',
      keywords: 'calendar schedule date time posting',
      actionLabel: 'Open Calendar',
      action: () => onNavigate('calendar'),
      icon: Calendar
    },
    {
      id: 'publishing',
      title: 'Publishing readiness',
      description: 'Autonoma prepares content and approval state. It does not pretend a social network post succeeded unless a real publishing integration confirms it.',
      keywords: 'publish publishing approval ready social network',
      actionLabel: 'Open Publishing',
      action: () => onNavigate('publishing'),
      icon: Send
    },
    {
      id: 'company',
      title: 'Company profile, AI context or team',
      description: 'Edit the current company profile, website evidence, AI understanding, team and workspace settings here.',
      keywords: 'company profile ai context team workspace settings',
      actionLabel: 'Company Setup',
      action: onOpenCompanySetup,
      icon: Building2
    },
    {
      id: 'new-campaign',
      title: 'Start a new campaign',
      description: 'Use the campaign brief builder to define the goal, platforms, formats, languages and deliverable count. Campaign generation remains isolated from media generation.',
      keywords: 'new campaign brief objective goal platforms languages formats',
      actionLabel: 'Create campaign',
      action: onOpenCampaignGenerator,
      icon: Compass
    }
  ], [onNavigate, onOpenSettings, onOpenCompanySetup, onOpenCampaignGenerator]);

  const visible = topics.filter((topic) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return `${topic.title} ${topic.description} ${topic.keywords}`.toLowerCase().includes(q);
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[600]" role="dialog" aria-modal="true" aria-label="Autonoma help">
      <button
        type="button"
        className="absolute inset-0 bg-black/25 backdrop-blur-[1px]"
        onClick={onClose}
        aria-label="Close help"
      />
      <aside className="absolute right-0 top-0 h-full w-full max-w-[460px] bg-white shadow-2xl border-l border-black/[0.08] flex flex-col text-[#1D1D1F]">
        <div className="px-5 py-4 border-b border-black/[0.07] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-2xl bg-orange-50 text-[#FF4500] flex items-center justify-center shrink-0">
              <LifeBuoy className="h-4.5 w-4.5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-semibold text-sm">How can I help?</h2>
              <p className="text-[11px] text-[#86868B] truncate">
                {companyName || 'Current workspace'} · {tabNames[activeTab]}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-[#6E6E73] hover:bg-black/[0.04] hover:text-[#1D1D1F]"
            aria-label="Close help"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 border-b border-black/[0.05] bg-[#FBFBFD]">
          <label className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#86868B]" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search help: image, video, content, brand…"
              className="w-full h-11 rounded-2xl border border-black/[0.08] bg-white pl-10 pr-3 text-xs outline-none focus:ring-2 focus:ring-[#FF4500]/20 focus:border-[#FF4500]/40"
            />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
            <div className="text-[10px] uppercase tracking-[0.14em] font-bold text-[#FF4500]">Current screen</div>
            <div className="mt-1 text-sm font-semibold">{tabNames[activeTab]}</div>
            <p className="mt-1 text-xs leading-relaxed text-[#6E6E73]">
              Help is contextual to where you are. Search any task below or jump directly to the right workspace.
            </p>
          </div>

          {visible.length === 0 ? (
            <div className="py-12 text-center text-xs text-[#86868B]">No help topic matched “{query}”.</div>
          ) : visible.map((topic) => {
            const Icon = topic.icon;
            return (
              <div key={topic.id} className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-xl bg-[#FBFBFD] border border-black/[0.05] flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4 text-[#FF4500]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-xs font-semibold">{topic.title}</h3>
                    <p className="mt-1 text-[11px] leading-relaxed text-[#6E6E73]">{topic.description}</p>
                    {topic.action && topic.actionLabel && (
                      <button
                        type="button"
                        onClick={() => {
                          topic.action?.();
                          onClose();
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#FF4500] hover:underline"
                      >
                        {topic.actionLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-black/[0.06] bg-[#FBFBFD] px-5 py-3 text-[10px] leading-relaxed text-[#86868B]">
          Image generation needs at least one configured image provider. Veo video generation additionally requires paid Google API billing/quota.
        </div>
      </aside>
    </div>
  );
};
