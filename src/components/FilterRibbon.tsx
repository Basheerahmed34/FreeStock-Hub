import React from 'react';
import { AssetType, LicenseType } from '../types/unified-asset.js';
import { Layers, Image, Video, Music, Sparkles, Box, Film, Zap } from 'lucide-react';

export type ExtendedAssetFilter = AssetType | 'PHOTOS_VIDEOS' | 'ALL';

interface FilterRibbonProps {
  selectedType: ExtendedAssetFilter;
  onSelectType: (type: ExtendedAssetFilter) => void;
  selectedProvider: string;
  onSelectProvider: (provider: string) => void;
  selectedLicense: LicenseType | 'ALL';
  onSelectLicense: (license: LicenseType | 'ALL') => void;
  selectedSort: 'relevance' | 'newest' | 'resolution';
  onSelectSort: (sort: 'relevance' | 'newest' | 'resolution') => void;
  totalCount: number;
  executionTimeMs?: number;
}

// Media type tabs with visual media (Photos & Videos) first by default!
const TYPE_TABS: Array<{ label: string; value: ExtendedAssetFilter; icon: React.FC<{ className?: string }>; badge?: string }> = [
  { label: 'Photos & Videos', value: 'PHOTOS_VIDEOS', icon: Layers, badge: 'Primary' },
  { label: 'Videos', value: AssetType.VIDEO, icon: Video },
  { label: 'Photos', value: AssetType.PHOTO, icon: Image },
  { label: 'Audio & Music', value: AssetType.AUDIO, icon: Music },
  { label: 'Sound FX', value: AssetType.SOUND_EFFECT, icon: Zap },
  { label: 'Vector Icons', value: AssetType.ICON, icon: Sparkles },
  { label: 'Vectors & SVGs', value: AssetType.VECTOR, icon: Box },
  { label: 'GIFs & Loops', value: AssetType.GIF, icon: Film },
  { label: 'All Media', value: 'ALL', icon: Layers }
];

const PROVIDERS = [
  { label: 'All Providers (11)', value: 'ALL' },
  { label: 'Mixkit (Videos & Sound FX)', value: 'mixkit' },
  { label: 'Coverr (4K & HD Videos)', value: 'coverr' },
  { label: 'unDraw (Vector Illustrations)', value: 'undraw' },
  { label: 'Openverse (700M+ CC Assets)', value: 'openverse' },
  { label: 'Wikimedia Commons (100M+ Files)', value: 'wikimedia' },
  { label: 'Iconify Vectors (150K+ Icons)', value: 'iconify' },
  { label: 'Unsplash Photos', value: 'unsplash' },
  { label: 'Pexels 4K Videos & Photos', value: 'pexels' },
  { label: 'Pixabay Vectors & Photos', value: 'pixabay' },
  { label: 'Freesound Audio & Foley', value: 'freesound' },
  { label: 'GIPHY Loops & Stickers', value: 'giphy' }
];

const LICENSES = [
  { label: 'All Verified Licenses', value: 'ALL' },
  { label: 'CC0 / Public Domain', value: LicenseType.CC0 },
  { label: 'CC BY (Attribution)', value: LicenseType.CC_BY },
  { label: 'CC BY-SA (ShareAlike)', value: LicenseType.CC_BY_SA },
  { label: 'Free Commercial Use', value: LicenseType.FREE },
  { label: 'Check Source License', value: LicenseType.CHECK_LICENSE }
];

export const FilterRibbon: React.FC<FilterRibbonProps> = ({
  selectedType,
  onSelectType,
  selectedProvider,
  onSelectProvider,
  selectedLicense,
  onSelectLicense,
  selectedSort,
  onSelectSort,
  totalCount,
  executionTimeMs
}) => {
  const hasActiveFilters = selectedProvider !== 'ALL' || selectedLicense !== 'ALL' || selectedSort !== 'relevance';

  const resetFilters = () => {
    onSelectProvider('ALL');
    onSelectLicense('ALL');
    onSelectSort('relevance');
  };

  return (
    <div className="w-full space-y-3.5">
      {/* Primary Media Segregation Tabs (Visual Photos & Videos First) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {TYPE_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = selectedType === tab.value;
          return (
            <button
              key={tab.value}
              onClick={() => onSelectType(tab.value)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-lime-400 border border-lime-400/60 shadow-[0_0_15px_rgba(163,230,53,0.18)] scale-[1.02]'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-lime-400' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && !isActive && (
                <span className="text-[10px] text-lime-400/80 font-mono">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary Controls (Provider, License, Sort & Count) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/80 pt-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Provider Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Provider:</span>
            <select
              value={selectedProvider}
              onChange={(e) => onSelectProvider(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors cursor-pointer"
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* License Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">License:</span>
            <select
              value={selectedLicense}
              onChange={(e) => onSelectLicense(e.target.value as LicenseType | 'ALL')}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors cursor-pointer"
            >
              {LICENSES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>

          {/* Sort Select */}
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Sort:</span>
            <select
              value={selectedSort}
              onChange={(e) => onSelectSort(e.target.value as any)}
              className="bg-slate-900 border border-slate-800 text-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-lime-400 focus:ring-1 focus:ring-lime-400 transition-colors cursor-pointer"
            >
              <option value="relevance">Most Relevant</option>
              <option value="resolution">Highest Resolution</option>
              <option value="newest">Newly Indexed</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-lime-400 hover:text-lime-300 font-medium underline underline-offset-4 transition-colors cursor-pointer text-xs"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Live Metrics */}
        <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px] tabular-nums">
          <span className="h-1.5 w-1.5 rounded-full bg-lime-400 animate-pulse"></span>
          <span>{totalCount} assets matched</span>
          {executionTimeMs !== undefined && (
            <>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span className="text-slate-500">{executionTimeMs}ms</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
