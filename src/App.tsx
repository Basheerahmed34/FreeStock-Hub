import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AssetType, LicenseType, UnifiedAsset, SearchResponse, ProviderDebugInfo } from './types/unified-asset.js';
import { Header } from './components/Header.js';
import { HeroSection } from './components/HeroSection.js';
import { SearchBar } from './components/SearchBar.js';
import { FilterRibbon, ExtendedAssetFilter } from './components/FilterRibbon.js';
import { AssetGrid } from './components/AssetGrid.js';
import { AssetModal } from './components/AssetModal.js';
import { CollectionsDrawer } from './components/CollectionsDrawer.js';
import { LicenseGuideModal } from './components/LicenseGuideModal.js';
import { SchemaModal } from './components/SchemaModal.js';
import { ProviderStatusModal } from './components/ProviderStatusModal.js';
import { AudioPlayerBar } from './components/AudioPlayerBar.js';
import { AuthModal } from './components/AuthModal.js';
import { UserDownloadHistoryModal } from './components/UserDownloadHistoryModal.js';
import { OperatorAdminPanelModal } from './components/OperatorAdminPanelModal.js';
import { SearchDebugPanel } from './components/SearchDebugPanel.js';
import { Footer } from './components/Footer.js';

import {
  auth,
  syncUserProfile,
  recordDownload,
  recordTrafficEvent,
  subscribeUserDownloads,
  subscribeUserProfile,
  isDeveloperUser,
  getLocalSessionUser,
  AppUser,
  UserProfile,
  DownloadRecord
} from './lib/firebase.js';
import { onAuthStateChanged, User } from 'firebase/auth';

import { getSavedAssets, saveAsset, removeSavedAsset, importSavedAssets, clearSavedAssets } from './lib/storage.js';
import { parseSharedHash } from './lib/curation-export.js';
import { downloadAssetDirectly } from './lib/download-helper.js';
import { Share2, X, FolderDown } from 'lucide-react';

export default function App() {
  // Navigation & Modal State
  const [activeTab, setActiveTab] = useState<'discover' | 'collections' | 'licenses' | 'schema' | 'status'>('discover');
  const [isCollectionsOpen, setIsCollectionsOpen] = useState(false);
  const [isLicenseGuideOpen, setIsLicenseGuideOpen] = useState(false);
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isDebugModalOpen, setIsDebugModalOpen] = useState(false);

  // Live Multi-Provider Search Debug Telemetry (Requirement 18)
  const [providersDebug, setProvidersDebug] = useState<ProviderDebugInfo[]>([]);
  const [isSearchCached, setIsSearchCached] = useState(false);
  const searchRequestIdRef = useRef(0);

  // Firebase Auth & Realtime Download State
  const [currentUser, setCurrentUser] = useState<AppUser | User | null>(() => getLocalSessionUser());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userDownloads, setUserDownloads] = useState<DownloadRecord[]>([]);

  // Search & Filter State: Default to PHOTOS_VIDEOS first so visual media appears first!
  const [searchQuery, setSearchQuery] = useState('nature');
  const [selectedType, setSelectedType] = useState<ExtendedAssetFilter>('PHOTOS_VIDEOS');
  const [selectedProvider, setSelectedProvider] = useState<string>('ALL');
  const [selectedLicense, setSelectedLicense] = useState<LicenseType | 'ALL'>('ALL');
  const [selectedSort, setSelectedSort] = useState<'relevance' | 'newest' | 'resolution'>('relevance');

  // Pagination & Results State
  const [currentPage, setCurrentPage] = useState(1);
  const [assets, setAssets] = useState<UnifiedAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | undefined>(undefined);
  const [providersCount, setProvidersCount] = useState(11);

  // Active Asset & Audio State
  const [selectedAsset, setSelectedAsset] = useState<UnifiedAsset | null>(null);
  const [activeAudioTrack, setActiveAudioTrack] = useState<UnifiedAsset | null>(null);

  // Saved Assets Persistence
  const [savedAssets, setSavedAssets] = useState<UnifiedAsset[]>([]);
  const savedAssetIds = new Set(savedAssets.map(a => a.asset_id));

  // Shared Curation Notification Banner
  const [sharedCollection, setSharedCollection] = useState<{
    title: string;
    description?: string;
    assets: UnifiedAsset[];
  } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    setSavedAssets(getSavedAssets());
  }, []);

  // Initialize and synchronize user profile on load
  useEffect(() => {
    const local = getLocalSessionUser();
    if (local) {
      syncUserProfile(local).then((prof) => setUserProfile(prof));
    }
  }, []);

  // Firebase Auth State Listener & Realtime Profile/Downloads Subscriptions
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        try {
          const profile = await syncUserProfile(user);
          setUserProfile(profile);
        } catch (err) {
          console.warn('[Firebase] Auth profile sync failed:', err);
        }
      }
    });

    return () => unsubAuth();
  }, []);

  // Subscribe to profile & downloads whenever currentUser changes
  useEffect(() => {
    if (!currentUser) {
      setUserProfile(null);
      setUserDownloads([]);
      return;
    }

    const unsubProfile = subscribeUserProfile(currentUser.uid, (p) => {
      if (p) setUserProfile(p);
    });

    const unsubDownloads = subscribeUserDownloads(currentUser.uid, (dls) => {
      setUserDownloads(dls);
    });

    return () => {
      unsubProfile();
      unsubDownloads();
    };
  }, [currentUser?.uid]);

  // Check URL parameters for shareable link (?share=... or #curation=...)
  useEffect(() => {
    const handleUrlSharing = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const shareId = urlParams.get('share');
      if (shareId) {
        try {
          const res = await fetch(`/api/collections/share/${encodeURIComponent(shareId)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.assets && Array.isArray(data.assets)) {
              setSharedCollection({
                title: data.title || 'Shared Collection',
                description: data.description,
                assets: data.assets
              });
            }
          }
        } catch (err) {
          console.warn('Failed to load shared collection via API:', err);
        }
      }

      if (window.location.hash.includes('curation=')) {
        const parsed = parseSharedHash(window.location.hash);
        if (parsed && parsed.assets.length > 0) {
          setSharedCollection(parsed);
        }
      }
    };

    handleUrlSharing();
  }, []);

  // Multi-Provider Search with Non-Blocking State & Request Cancellation (PRD Section 11 & 21)
  const executeSearch = useCallback(async () => {
    const currentReqId = ++searchRequestIdRef.current;
    setIsLoading(true);
    setSearchError(null);
    setCurrentPage(1);
    setHasMore(true);

    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (selectedProvider !== 'ALL') params.append('provider', selectedProvider);
      if (selectedLicense !== 'ALL') params.append('license', selectedLicense);
      if (selectedSort !== 'relevance') params.append('sortBy', selectedSort);
      params.append('page', '1');
      params.append('perPage', '32');

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error(`Search failed with HTTP status ${response.status}`);
      const data: SearchResponse = await response.json();

      // Discard stale responses if a newer search was dispatched while this was in-flight
      if (currentReqId !== searchRequestIdRef.current) return;

      setAssets(data.assets || []);
      setExecutionTimeMs(data.executionTimeMs);
      setIsSearchCached(Boolean(data.cached));
      if (data.providersDebug) {
        setProvidersDebug(data.providersDebug);
      }
      if (data.providersQueried) {
        setProvidersCount(data.providersQueried.length);
      }
      if (!data.assets || data.assets.length < 8) {
        setHasMore(false);
      }

      // Log traffic event in Firestore
      recordTrafficEvent('search', {
        query: searchQuery.trim(),
        mediaType: selectedType,
        provider: selectedProvider,
        userId: currentUser?.uid
      });
    } catch (err) {
      if (currentReqId === searchRequestIdRef.current) {
        console.error('Search query error:', err);
        setSearchError(err instanceof Error ? err.message : 'Unable to connect to media feeds. Please try again.');
      }
    } finally {
      if (currentReqId === searchRequestIdRef.current) {
        setIsLoading(false);
      }
    }
  }, [searchQuery, selectedType, selectedProvider, selectedLicense, selectedSort, currentUser]);

  useEffect(() => {
    executeSearch();
  }, [executeSearch]);

  // High-Volume Pagination with Deduplication and Append Safety (PRD Section 6, 7 & 8)
  const handleLoadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    const nextPage = currentPage + 1;
    const currentQuerySnapshot = searchQuery.trim();

    try {
      const params = new URLSearchParams();
      if (currentQuerySnapshot) params.append('q', currentQuerySnapshot);
      if (selectedType !== 'ALL') params.append('type', selectedType);
      if (selectedProvider !== 'ALL') params.append('provider', selectedProvider);
      if (selectedLicense !== 'ALL') params.append('license', selectedLicense);
      if (selectedSort !== 'relevance') params.append('sortBy', selectedSort);
      params.append('page', String(nextPage));
      params.append('perPage', '32');

      const response = await fetch(`/api/search?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to load more assets');
      const data: SearchResponse = await response.json();

      // Guard: Discard if query changed while pagination request was in-flight
      if (searchQuery.trim() !== currentQuerySnapshot) return;

      const newItems = data.assets || [];
      if (newItems.length === 0) {
        setHasMore(false);
        showToast('All available assets loaded for this keyword!');
      } else {
        let addedCount = 0;
        setAssets((prev) => {
          const existingIds = new Set(prev.map((a) => a.asset_id));
          const uniqueNew = newItems.filter((a) => !existingIds.has(a.asset_id));
          addedCount = uniqueNew.length;
          if (uniqueNew.length === 0) {
            setHasMore(false);
          }
          return [...prev, ...uniqueNew];
        });

        setCurrentPage(nextPage);
        if (addedCount > 0) {
          showToast(`Loaded +${addedCount} more assets from 11 providers!`);
        } else {
          showToast('No further unique records found for this query.');
        }
      }
    } catch (err) {
      console.error('Load more error:', err);
      showToast('Could not load next page. Click to retry.');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleNavClick = (tab: 'discover' | 'collections' | 'licenses' | 'schema' | 'status') => {
    setActiveTab(tab);
    if (tab === 'collections') setIsCollectionsOpen(true);
    if (tab === 'licenses') setIsLicenseGuideOpen(true);
    if (tab === 'schema') setIsSchemaModalOpen(true);
    if (tab === 'status') setIsStatusModalOpen(true);
  };

  const handleToggleSave = (asset: UnifiedAsset) => {
    if (savedAssetIds.has(asset.asset_id)) {
      const updated = removeSavedAsset(asset.asset_id);
      setSavedAssets(updated);
    } else {
      const updated = saveAsset(asset);
      setSavedAssets(updated);
      showToast(`Saved "${asset.title.slice(0, 30)}..." to your collection!`);
    }
  };

  const handleRemoveSaved = (assetId: string) => {
    const updated = removeSavedAsset(assetId);
    setSavedAssets(updated);
  };

  const handleImportAssets = (newAssets: UnifiedAsset[]) => {
    const updated = importSavedAssets(newAssets);
    setSavedAssets(updated);
    showToast(`Added ${newAssets.length} assets to your curation history!`);
  };

  const handleClearAll = () => {
    const updated = clearSavedAssets();
    setSavedAssets(updated);
  };

  const handleAcceptSharedCollection = () => {
    if (!sharedCollection) return;
    handleImportAssets(sharedCollection.assets);
    setSharedCollection(null);
    setIsCollectionsOpen(true);
  };

  // Direct download with real-time Firebase history recording
  const handleQuickDownload = async (asset: UnifiedAsset) => {
    await downloadAssetDirectly(asset);
    await recordDownload(currentUser, asset);
    showToast(`Direct download started for ${asset.title.slice(0, 30)}`);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleAudio = (asset: UnifiedAsset) => {
    if (activeAudioTrack?.asset_id === asset.asset_id) {
      setActiveAudioTrack(null);
    } else {
      setActiveAudioTrack(asset);
    }
  };

  const handleSearchPhrase = (phrase: string, mediaType?: ExtendedAssetFilter) => {
    setSearchQuery(phrase);
    if (mediaType) {
      setSelectedType(mediaType);
    }
  };

  const totalDownloadsRecorded = userProfile?.totalDownloads || userDownloads.length;
  const isDevAuth = isDeveloperUser(currentUser, userProfile);

  return (
    <div className="min-h-screen bg-[#060811] text-slate-100 flex flex-col font-sans">
      {/* 3-Zone Header Contract with Firebase Auth & Realtime Download Badges */}
      <Header
        onNavClick={handleNavClick}
        activeTab={activeTab}
        savedCount={savedAssets.length}
        providerCount={providersCount}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onOpenHistory={() => setIsHistoryModalOpen(true)}
        onOpenAdmin={() => setIsAdminPanelOpen(true)}
        onOpenDebug={() => setIsDebugModalOpen(true)}
        currentUser={currentUser}
        userProfile={userProfile}
        downloadCount={totalDownloadsRecorded}
      />

      {/* Shared Collection Detected Banner */}
      {sharedCollection && (
        <div className="bg-gradient-to-r from-slate-900 via-[#0d1627] to-slate-900 border-b border-lime-500/30 px-4 py-3 text-xs shadow-lg animate-in slide-in-from-top duration-200">
          <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-lime-300">
              <Share2 className="h-4 w-4 text-lime-400 flex-shrink-0" />
              <span>
                <strong>Shared Curation Loaded:</strong> "{sharedCollection.title}" ({sharedCollection.assets.length} items)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAcceptSharedCollection}
                className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-lime-400 text-slate-950 font-bold hover:bg-lime-300 transition-colors cursor-pointer"
              >
                <FolderDown className="h-3.5 w-3.5" />
                <span>Save to My Collection</span>
              </button>
              <button
                onClick={() => {
                  setAssets(sharedCollection.assets);
                  setSharedCollection(null);
                }}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              >
                Preview in Grid
              </button>
              <button
                onClick={() => setSharedCollection(null)}
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gen Z Neon Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 rounded-2xl border border-lime-400/50 bg-slate-900/95 backdrop-blur-md px-4 py-3 text-xs font-semibold text-lime-300 shadow-[0_0_25px_rgba(163,230,53,0.25)] flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-150">
          <span className="h-2 w-2 rounded-full bg-lime-400 animate-ping"></span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Viewport Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-7">
        {/* Hero Section with Live Stock Categories and Interactive Typing Animation */}
        <HeroSection
          onSearchPhrase={handleSearchPhrase}
          activeType={selectedType}
          onSelectType={(t) => setSelectedType(t)}
          totalAssetsCount={725480210}
        />

        {/* Search Bar Section */}
        <section className="w-full">
          <SearchBar
            initialQuery={searchQuery}
            onSearch={(q) => setSearchQuery(q)}
            isLoading={isLoading}
          />
        </section>

        {/* Active Query Breadcrumb & Filters */}
        <section className="w-full space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Filtering by Keyword:</span>
              <span className="font-mono text-lime-400 font-semibold px-2 py-0.5 rounded-lg bg-lime-400/10 border border-lime-400/20">
                "{searchQuery}"
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="text-slate-300 font-medium">
                {assets.length} items loaded
              </span>
              <span aria-hidden="true" className="text-slate-700">·</span>
              <span className="text-cyan-400 font-mono text-[11px] uppercase">
                {selectedType === 'PHOTOS_VIDEOS' ? 'Photos & Videos First' : selectedType}
              </span>
            </div>

            {searchQuery !== 'nature' && (
              <button
                onClick={() => setSearchQuery('nature')}
                className="text-xs text-slate-400 hover:text-lime-400 underline underline-offset-4 cursor-pointer"
              >
                Reset query
              </button>
            )}
          </div>

          <FilterRibbon
            selectedType={selectedType}
            onSelectType={setSelectedType}
            selectedProvider={selectedProvider}
            onSelectProvider={setSelectedProvider}
            selectedLicense={selectedLicense}
            onSelectLicense={setSelectedLicense}
            selectedSort={selectedSort}
            onSelectSort={setSelectedSort}
            totalCount={assets.length}
            executionTimeMs={executionTimeMs}
          />
        </section>

        {/* Results Media Grid with Infinite/Load More Pagination */}
        <section className="w-full pb-16">
          <AssetGrid
            assets={assets}
            isLoading={isLoading}
            searchError={searchError}
            onRetry={executeSearch}
            onSelectAsset={(asset) => setSelectedAsset(asset)}
            savedAssetIds={savedAssetIds}
            onToggleSave={handleToggleSave}
            onQuickDownload={handleQuickDownload}
            currentAudioId={activeAudioTrack?.asset_id}
            onToggleAudio={handleToggleAudio}
            onSearchSuggestion={(q) => setSearchQuery(q)}
            onLoadMore={handleLoadMore}
            isLoadingMore={isLoadingMore}
            hasMore={hasMore}
            currentPage={currentPage}
          />
        </section>
      </main>

      {/* Semantic Accessible Footer */}
      <Footer
        onNavClick={handleNavClick}
        onOpenDebug={() => setIsDebugModalOpen(true)}
      />

      {/* Modals & Overlays */}
      {selectedAsset && (
        <AssetModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          isSaved={savedAssetIds.has(selectedAsset.asset_id)}
          onToggleSave={handleToggleSave}
        />
      )}

      {/* User Download History Modal */}
      <UserDownloadHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        downloads={userDownloads}
        totalCount={totalDownloadsRecorded}
      />

      {/* Firebase Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        userProfile={userProfile}
        onUserChanged={(u, p) => {
          setCurrentUser(u);
          setUserProfile(p);
        }}
        onOpenAdminPanel={() => setIsAdminPanelOpen(true)}
      />

      {/* Developer Operator Admin Panel Modal */}
      <OperatorAdminPanelModal
        isOpen={isAdminPanelOpen}
        onClose={() => setIsAdminPanelOpen(false)}
        currentUserEmail={currentUser?.email || undefined}
        isDeveloperAuthenticated={isDevAuth}
      />

      {/* Live Search Engine Diagnostics & Telemetry Panel (PRD Section 18) */}
      <SearchDebugPanel
        isOpen={isDebugModalOpen}
        onClose={() => setIsDebugModalOpen(false)}
        debugInfo={providersDebug}
        currentQuery={searchQuery}
        executionTimeMs={executionTimeMs}
        isCached={isSearchCached}
      />

      <CollectionsDrawer
        isOpen={isCollectionsOpen}
        onClose={() => setIsCollectionsOpen(false)}
        savedAssets={savedAssets}
        onRemoveAsset={handleRemoveSaved}
        onSelectAsset={(asset) => setSelectedAsset(asset)}
        onImportAssets={handleImportAssets}
        onClearAll={handleClearAll}
      />

      <LicenseGuideModal
        isOpen={isLicenseGuideOpen}
        onClose={() => setIsLicenseGuideOpen(false)}
      />

      <SchemaModal
        isOpen={isSchemaModalOpen}
        onClose={() => setIsSchemaModalOpen(false)}
      />

      <ProviderStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />

      {/* Persistent Audio Player Bar */}
      <AudioPlayerBar
        asset={activeAudioTrack}
        onClose={() => setActiveAudioTrack(null)}
        onSelectAsset={(asset) => setSelectedAsset(asset)}
      />
    </div>
  );
}
