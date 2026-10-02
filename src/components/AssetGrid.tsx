import React from 'react';
import { UnifiedAsset } from '../types/unified-asset.js';
import { AssetCard } from './AssetCard.js';
import { Search, Sparkles, Loader2, ArrowDown } from 'lucide-react';

interface AssetGridProps {
  assets: UnifiedAsset[];
  isLoading: boolean;
  onSelectAsset: (asset: UnifiedAsset) => void;
  savedAssetIds: Set<string>;
  onToggleSave: (asset: UnifiedAsset) => void;
  onQuickDownload: (asset: UnifiedAsset) => void;
  currentAudioId?: string;
  onToggleAudio: (asset: UnifiedAsset) => void;
  onSearchSuggestion: (q: string) => void;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  hasMore?: boolean;
  currentPage?: number;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  isLoading,
  onSelectAsset,
  savedAssetIds,
  onToggleSave,
  onQuickDownload,
  currentAudioId,
  onToggleAudio,
  onSearchSuggestion,
  onLoadMore,
  isLoadingMore = false,
  hasMore = true,
  currentPage = 1
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className="flex flex-col rounded-2xl border border-slate-800/80 bg-slate-900/40 p-0 overflow-hidden animate-pulse"
          >
            <div className="aspect-[4/3] w-full bg-slate-800/60" />
            <div className="p-4 space-y-2.5">
              <div className="h-4 w-3/4 rounded-lg bg-slate-800" />
              <div className="h-3 w-1/2 rounded-lg bg-slate-800/70" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20 px-4">
        <div className="h-14 w-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-lime-400 mb-4 border border-slate-700/50">
          <Search className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-white">No creative assets found</h3>
        <p className="mt-1 text-sm text-slate-400 max-w-md">
          We queried 8 providers concurrently but didn't find matching assets for this specific keyword. Try one of our hot keyword searches below:
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['Supercar', 'Cyberpunk Neon', 'Mountain Drone 4K', 'Space Galaxy', 'Analog Synth', 'Lucide Icons'].map((term) => (
            <button
              key={term}
              onClick={() => onSearchSuggestion(term)}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 text-xs font-medium text-slate-300 hover:border-lime-400/50 hover:bg-slate-700 hover:text-white transition-all cursor-pointer border border-slate-700/80"
            >
              Search "{term}"
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* Grid of Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
        {assets.map((asset) => (
          <AssetCard
            key={asset.asset_id}
            asset={asset}
            onSelect={onSelectAsset}
            isSaved={savedAssetIds.has(asset.asset_id)}
            onToggleSave={onToggleSave}
            onQuickDownload={onQuickDownload}
            isPlayingAudio={currentAudioId === asset.asset_id}
            onToggleAudio={onToggleAudio}
          />
        ))}
      </div>

      {/* High-Volume "Load More" Pagination Button */}
      {hasMore && onLoadMore && (
        <div className="flex flex-col items-center justify-center pt-4 pb-8 space-y-3">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 hover:border-lime-400/60 hover:bg-slate-850 hover:shadow-[0_0_25px_rgba(163,230,53,0.18)] text-white text-xs font-bold transition-all cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-lime-400" />
                <span>Fetching Next Page ({currentPage + 1})...</span>
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4 text-lime-400" />
                <span>Load More Assets (+24 items from 8 Providers)</span>
              </>
            )}
          </button>
          <span className="text-[11px] font-mono text-slate-500">
            Currently showing {assets.length} items · Page {currentPage}
          </span>
        </div>
      )}
    </div>
  );
};
