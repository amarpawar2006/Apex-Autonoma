import React from 'react';
import {
  Clock3,
  FolderKanban,
  FileSpreadsheet,
  Plus,
  MoreHorizontal
} from 'lucide-react';
import { AppNavTab } from './Header';

export interface BottomNavigationProps {
  activeTab: AppNavTab;
  onSelectTab: (tab: AppNavTab) => void;
  onCreateCampaign: () => void;
  onOpenMore: () => void;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  onCreateCampaign,
  onOpenMore
}) => {
  return (
    <nav
      aria-label="Mobile shortcuts"
      className="fixed bottom-0 left-0 right-0 z-[90] flex md:hidden items-center justify-around border-t border-black/[0.08] bg-white/95 px-2 py-1 shadow-lg backdrop-blur-xl"
      style={{ paddingBottom: 'max(0.35rem, env(safe-area-inset-bottom))' }}
    >
      {/* 1. Today */}
      <button
        onClick={() => onSelectTab('todays_production')}
        className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-medium transition-colors ${
          activeTab === 'todays_production'
            ? 'text-[#FF4500] font-semibold'
            : 'text-[#6E6E73] hover:text-[#1D1D1F]'
        }`}
        aria-label="Today's production"
      >
        <Clock3 className={`h-4 w-4 ${activeTab === 'todays_production' ? 'stroke-[2.5]' : ''}`} />
        <span>Today</span>
      </button>

      {/* 2. Campaigns */}
      <button
        onClick={() => onSelectTab('campaigns')}
        className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-medium transition-colors ${
          activeTab === 'campaigns'
            ? 'text-[#FF4500] font-semibold'
            : 'text-[#6E6E73] hover:text-[#1D1D1F]'
        }`}
        aria-label="Campaigns"
      >
        <FolderKanban className={`h-4 w-4 ${activeTab === 'campaigns' ? 'stroke-[2.5]' : ''}`} />
        <span>Campaigns</span>
      </button>

      {/* 3. CREATE (High-emphasis center action) */}
      <div className="flex flex-1 items-center justify-center px-1">
        <button
          onClick={onCreateCampaign}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#FF4500] text-white shadow-md hover:bg-[#EA3E00] active:scale-95 transition-all"
          aria-label="Create campaign"
        >
          <Plus className="h-5 w-5 stroke-[2.5]" />
        </button>
      </div>

      {/* 4. Content */}
      <button
        onClick={() => onSelectTab('master_sheet')}
        className={`flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-medium transition-colors ${
          activeTab === 'master_sheet'
            ? 'text-[#FF4500] font-semibold'
            : 'text-[#6E6E73] hover:text-[#1D1D1F]'
        }`}
        aria-label="Content master sheet"
      >
        <FileSpreadsheet className={`h-4 w-4 ${activeTab === 'master_sheet' ? 'stroke-[2.5]' : ''}`} />
        <span>Content</span>
      </button>

      {/* 5. More (Opens canonical hamburger drawer for full sitemap) */}
      <button
        onClick={onOpenMore}
        className="flex min-h-[48px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-medium text-[#6E6E73] hover:text-[#1D1D1F] transition-colors"
        aria-label="More navigation destinations"
      >
        <MoreHorizontal className="h-4 w-4" />
        <span>More</span>
      </button>
    </nav>
  );
};
