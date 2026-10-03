import React from 'react';
import { UnifiedAsset } from '../types/unified-asset.js';
import { AssetCard } from './AssetCard.js';
import { AssetErrorBoundary } from './AssetErrorBoundary.js';
import { Search, Loader2, ArrowDown, Activity, AlertCircle, RefreshCw } from 'lucide-react';

interface AssetGridProps {
  assets: UnifiedAsset[];
  isLoading: boolean;
  searchError?: string | null;
  onRetry?: () => void;
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
  searchError,
  onRetry,
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
  // If search request failed and no items exist, display friendly Error State with Retry (PRD Section 9 & 10)
  if (searchError && assets.length === 0 && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-red-500/30 rounded-3xl bg-red-500/5 px-4 animate-in fade-in">
        <div className="h-14 w-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-3">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h3 className="text-base font-semibold text-white">Search Data Request Interrupted</h3>
        <p className="mt-1 text-xs text-slate-400 max-w-md">
          {searchError || 'Unable to connect with open media source feeds. Your internet or source service may be temporarily unresponsive.'}
        </p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-lime-400 text-slate-950 text-xs font-bold hover:bg-lime-300 shadow-[0_0_15px_rgba(163,230,53,0.3)] transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Search Query</span>
          </button>
        )}
      </div>
    );
  }

  // Only show skeleton on initial load when there are no previous assets to display
  if (isLoading && assets.length === 0) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
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

  if (!isLoading && assets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/20 px-4">
        <div className="h-14 w-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-lime-400 mb-4 border border-slate-700/50">
          <Search className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold text-white">No creative assets found</h3>
        <p className="mt-1 text-sm text-slate-400 max-w-md">
          We queried 11 providers concurrently. Try one of our suggested keywords below:
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {['nature', 'car', 'sunset', 'cinematic', 'business', 'technology', 'whoosh', 'foley', 'music', 'vector', 'icon'].map((term) => (
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
    <div className="space-y-6">
      {/* Localized Non-Blocking Searching Indicator (Keeps previous results visible - PRD Section 11) */}
      {isLoading && assets.length > 0 && (
        <div className="flex items-center justify-between p-3 rounded-2xl bg-lime-400/10 border border-lime-400/20 text-lime-400 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-lime-400 animate-ping" />
            <span className="font-semibold">Searching available sources across 11 providers...</span>
          </div>
          <span className="text-[11px] text-lime-300/80 font-mono hidden sm:inline">
            Preserving previous results until new data arrives
          </span>
        </div>
      )}

      {/* Grid of Cards with stable keys and isolated ErrorBoundary per card (PRD Section 15 & 16) */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 transition-opacity duration-200 ${isLoading ? 'opacity-70' : 'opacity-100'}`}>
        {assets.map((asset) => (
          <AssetErrorBoundary key={asset.asset_id} fallbackTitle={asset.title}>
            <AssetCard
              asset={asset}
              onSelect={onSelectAsset}
              isSaved={savedAssetIds.has(asset.asset_id)}
              onToggleSave={onToggleSave}
              onQuickDownload={onQuickDownload}
              isPlayingAudio={currentAudioId === asset.asset_id}
              onToggleAudio={onToggleAudio}
            />
          </AssetErrorBoundary>
        ))}
      </div>

      {/* High-Volume "Load More" Pagination Button */}
      {hasMore && onLoadMore && (
        <div className="flex flex-col items-center justify-center pt-8 pb-4">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-slate-200 text-sm font-bold hover:border-lime-400 hover:text-white hover:bg-slate-850 hover:shadow-[0_0_25px_rgba(163,230,53,0.18)] active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-lime-400" />
                <span>Loading Next Page...</span>
              </>
            ) : (
              <>
                <ArrowDown className="h-4 w-4 text-lime-400" />
                <span>Load More Free Assets (Page {currentPage + 1})</span>
              </>
            )}
          </button>
          <span className="text-[11px] text-slate-500 font-mono mt-2">
            Showing {assets.length} multi-provider creative works
          </span>
        </div>
      )}
    </div>
  );
};
