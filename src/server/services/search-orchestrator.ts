import {
  AssetType,
  BaseProviderAdapter,
  LicenseType,
  ProviderDebugInfo,
  ProviderSearchResult,
  SearchOptions,
  SearchResponse,
  UnifiedAsset
} from '../../types/unified-asset.js';
import { OpenverseAdapter } from '../providers/openverse-adapter.js';
import { WikimediaCommonsAdapter } from '../providers/wikimedia-adapter.js';
import { IconifyAdapter } from '../providers/iconify-adapter.js';
import { UnsplashAdapter } from '../providers/unsplash-adapter.js';
import { PexelsAdapter } from '../providers/pexels-adapter.js';
import { PixabayAdapter } from '../providers/pixabay-adapter.js';
import { FreesoundAdapter } from '../providers/freesound-adapter.js';
import { GiphyAdapter } from '../providers/giphy-adapter.js';
import { MixkitAdapter } from '../providers/mixkit-adapter.js';
import { CoverrAdapter } from '../providers/coverr-adapter.js';
import { UndrawAdapter } from '../providers/undraw-adapter.js';

interface CachedSearchResult {
  response: SearchResponse;
  timestamp: number;
}

export class SearchOrchestrator {
  private adapters: Map<string, BaseProviderAdapter> = new Map();
  // In-memory query cache with 5-minute TTL (Requirement 20)
  private queryCache: Map<string, CachedSearchResult> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000;

  constructor() {
    this.registerAdapter(new OpenverseAdapter());
    this.registerAdapter(new WikimediaCommonsAdapter());
    this.registerAdapter(new IconifyAdapter());
    this.registerAdapter(new UnsplashAdapter());
    this.registerAdapter(new PexelsAdapter());
    this.registerAdapter(new PixabayAdapter());
    this.registerAdapter(new FreesoundAdapter());
    this.registerAdapter(new GiphyAdapter());
    this.registerAdapter(new MixkitAdapter());
    this.registerAdapter(new CoverrAdapter());
    this.registerAdapter(new UndrawAdapter());
  }

  registerAdapter(adapter: BaseProviderAdapter) {
    this.adapters.set(adapter.providerName.toLowerCase(), adapter);
  }

  getAdapter(name: string): BaseProviderAdapter | undefined {
    return this.adapters.get(name.toLowerCase());
  }

  getAllAdapters(): BaseProviderAdapter[] {
    return Array.from(this.adapters.values());
  }

  /**
   * Filter adapters appropriate for the given AssetType
   */
  private selectAdaptersForType(type?: AssetType | 'PHOTOS_VIDEOS', providerFilter?: string): BaseProviderAdapter[] {
    if (providerFilter && providerFilter !== 'ALL') {
      const adapter = this.adapters.get(providerFilter.toLowerCase());
      return adapter ? [adapter] : [];
    }

    if (!type || (type as string) === 'ALL') {
      return this.getAllAdapters();
    }

    if (type === 'PHOTOS_VIDEOS') {
      return [
        this.adapters.get('openverse'),
        this.adapters.get('wikimedia'),
        this.adapters.get('unsplash'),
        this.adapters.get('pexels'),
        this.adapters.get('pixabay'),
        this.adapters.get('coverr'),
        this.adapters.get('mixkit')
      ].filter(Boolean) as BaseProviderAdapter[];
    }

    switch (type) {
      case AssetType.PHOTO:
        return [
          this.adapters.get('openverse'),
          this.adapters.get('wikimedia'),
          this.adapters.get('unsplash'),
          this.adapters.get('pexels'),
          this.adapters.get('pixabay')
        ].filter(Boolean) as BaseProviderAdapter[];

      case AssetType.VIDEO:
        return [
          this.adapters.get('wikimedia'),
          this.adapters.get('pexels'),
          this.adapters.get('pixabay'),
          this.adapters.get('coverr'),
          this.adapters.get('mixkit')
        ].filter(Boolean) as BaseProviderAdapter[];

      case AssetType.AUDIO:
      case AssetType.SOUND_EFFECT:
        return [
          this.adapters.get('openverse'),
          this.adapters.get('wikimedia'),
          this.adapters.get('freesound'),
          this.adapters.get('mixkit')
        ].filter(Boolean) as BaseProviderAdapter[];

      case AssetType.ICON:
        return [
          this.adapters.get('iconify'),
          this.adapters.get('wikimedia'),
          this.adapters.get('undraw')
        ].filter(Boolean) as BaseProviderAdapter[];

      case AssetType.VECTOR:
      case AssetType.ILLUSTRATION:
        return [
          this.adapters.get('iconify'),
          this.adapters.get('wikimedia'),
          this.adapters.get('openverse'),
          this.adapters.get('pixabay'),
          this.adapters.get('undraw')
        ].filter(Boolean) as BaseProviderAdapter[];

      case AssetType.GIF:
      case AssetType.PNG:
        return [
          this.adapters.get('giphy'),
          this.adapters.get('pixabay'),
          this.adapters.get('wikimedia')
        ].filter(Boolean) as BaseProviderAdapter[];

      default:
        return this.getAllAdapters();
    }
  }

  private buildCacheKey(options: SearchOptions): string {
    return [
      (options.query || '').trim().toLowerCase(),
      options.assetType || 'ALL',
      options.page || 1,
      options.perPage || 30,
      options.provider || 'ALL',
      options.license || 'ALL',
      options.sortBy || 'relevance'
    ].join('|');
  }

  /**
   * Execute multi-provider search with isolated concurrency via Promise.allSettled()
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();
    const cacheKey = this.buildCacheKey(options);

    // Check In-Memory Query Cache (Requirement 20)
    const cachedEntry = this.queryCache.get(cacheKey);
    if (cachedEntry && Date.now() - cachedEntry.timestamp < this.CACHE_TTL_MS) {
      return {
        ...cachedEntry.response,
        cached: true,
        executionTimeMs: Date.now() - startTime
      };
    }

    const targetAdapters = this.selectAdaptersForType(options.assetType, options.provider);

    // Rule: ISOLATED CONCURRENCY using Promise.allSettled()
    // One failed or unconfigured provider NEVER breaks other providers
    const settledResults = await Promise.allSettled(
      targetAdapters.map(async (adapter) => {
        if (typeof adapter.searchDetailed === 'function') {
          return await adapter.searchDetailed(options);
        }
        const t0 = Date.now();
        const assets = await adapter.search(options);
        return {
          assets,
          totalAvailable: null,
          status: 'SUCCESS',
          httpStatus: 200,
          responseTimeMs: Date.now() - t0
        } as ProviderSearchResult;
      })
    );

    const rawAssets: UnifiedAsset[] = [];
    const providersSettled: SearchResponse['providersSettled'] = [];
    const providersDebug: ProviderDebugInfo[] = [];

    settledResults.forEach((result, idx) => {
      const adapter = targetAdapters[idx];
      if (result.status === 'fulfilled') {
        const val = result.value;
        rawAssets.push(...val.assets);
        providersSettled.push({
          provider: adapter.providerName,
          status: val.status === 'SUCCESS' ? 'fulfilled' : 'rejected',
          count: val.assets.length,
          error: val.error
        });
        providersDebug.push({
          provider: adapter.providerName,
          status: val.status,
          httpStatus: val.httpStatus,
          query: options.query || '',
          resultsFetched: val.assets.length,
          totalAvailable: val.totalAvailable,
          responseTimeMs: val.responseTimeMs,
          error: val.error
        });
      } else {
        providersSettled.push({
          provider: adapter.providerName,
          status: 'rejected',
          count: 0,
          error: result.reason?.message || 'Provider query failed'
        });
        providersDebug.push({
          provider: adapter.providerName,
          status: 'ERROR',
          query: options.query || '',
          resultsFetched: 0,
          totalAvailable: null,
          responseTimeMs: 0,
          error: result.reason?.message || 'Provider query failed'
        });
      }
    });

    // Deduplication using composite keys (provider + provider_asset_id)
    const dedupedMap = new Map<string, UnifiedAsset>();
    for (const asset of rawAssets) {
      const compositeKey = `${asset.provider}:${asset.provider_asset_id}`.toLowerCase();
      if (!dedupedMap.has(compositeKey)) {
        if (!asset.license_name || asset.license_name === 'UNKNOWN') {
          asset.license_name = LicenseType.CHECK_LICENSE;
        }
        dedupedMap.set(compositeKey, asset);
      }
    }

    let finalAssets = Array.from(dedupedMap.values());

    // 1. Strict Asset Type Filtering
    if (options.assetType && options.assetType !== ('ALL' as any)) {
      finalAssets = finalAssets.filter((a) => {
        if (options.assetType === 'PHOTOS_VIDEOS') {
          return a.asset_type === AssetType.PHOTO || a.asset_type === AssetType.VIDEO;
        }
        if (options.assetType === AssetType.PHOTO) {
          return a.asset_type === AssetType.PHOTO;
        }
        if (options.assetType === AssetType.VIDEO) {
          return a.asset_type === AssetType.VIDEO;
        }
        if (options.assetType === AssetType.AUDIO) {
          return a.asset_type === AssetType.AUDIO || a.asset_type === AssetType.SOUND_EFFECT;
        }
        if (options.assetType === AssetType.SOUND_EFFECT) {
          return a.asset_type === AssetType.SOUND_EFFECT || a.asset_type === AssetType.AUDIO;
        }
        if (options.assetType === AssetType.ICON) {
          return a.asset_type === AssetType.ICON;
        }
        if (options.assetType === AssetType.VECTOR) {
          return a.asset_type === AssetType.VECTOR || a.asset_type === AssetType.ILLUSTRATION;
        }
        if (options.assetType === AssetType.ILLUSTRATION) {
          return a.asset_type === AssetType.ILLUSTRATION || a.asset_type === AssetType.VECTOR;
        }
        if (options.assetType === AssetType.GIF) {
          return a.asset_type === AssetType.GIF || a.asset_type === AssetType.PNG;
        }
        if (options.assetType === AssetType.PNG) {
          return a.asset_type === AssetType.PNG;
        }
        return a.asset_type === options.assetType;
      });
    }

    // 2. Intelligent Keyword Relevance Ranking
    if (options.query && options.query.trim().length > 1) {
      const qWords = options.query.toLowerCase().trim().split(/\s+/).filter((w) => w.length > 1);
      if (qWords.length > 0) {
        finalAssets.sort((a, b) => {
          const aText = `${a.title} ${a.description || ''}`.toLowerCase();
          const bText = `${b.title} ${b.description || ''}`.toLowerCase();
          let aScore = 0;
          let bScore = 0;
          for (const w of qWords) {
            if (aText.includes(w)) aScore += 10;
            if (bText.includes(w)) bScore += 10;
          }
          return bScore - aScore;
        });
      }
    }

    // 3. Strict Provider Filtering
    if (options.provider && options.provider !== 'ALL') {
      const pTarget = options.provider.toLowerCase();
      finalAssets = finalAssets.filter((a) => a.provider.toLowerCase() === pTarget);
    }

    // 4. Strict License Filtering
    if (options.license && options.license !== 'ALL') {
      finalAssets = finalAssets.filter((a) => {
        const lic = String(a.license_name || '').toUpperCase();
        const target = String(options.license).toUpperCase();
        if (target === 'CC0') {
          return lic.includes('CC0') || lic.includes('PUBLIC_DOMAIN') || lic.includes('PUBLIC DOMAIN');
        }
        if (target === 'CC_BY') {
          return lic.includes('CC_BY') || lic.includes('CC BY') || lic.includes('CC-BY');
        }
        if (target === 'CC_BY_SA') {
          return lic.includes('CC_BY_SA') || lic.includes('CC BY-SA') || lic.includes('SHAREALIKE');
        }
        if (target === 'FREE') {
          return lic.includes('FREE') || lic.includes('MIT') || lic.includes('APACHE') || lic.includes('COMMERCIAL');
        }
        if (target === 'CHECK_LICENSE') {
          return lic.includes('CHECK');
        }
        return lic === target;
      });
    }

    // 5. Sorting Options
    if (options.sortBy === 'newest') {
      finalAssets.sort((a, b) => new Date(b.cached_at).getTime() - new Date(a.cached_at).getTime());
    } else if (options.sortBy === 'resolution') {
      finalAssets.sort((a, b) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)));
    } else {
      // Default: Interleave providers evenly so results are diverse
      finalAssets = this.interleaveAssets(finalAssets);
    }

    const executionTimeMs = Date.now() - startTime;

    const response: SearchResponse = {
      assets: finalAssets,
      totalResults: finalAssets.length,
      providersQueried: targetAdapters.map((a) => a.providerName),
      providersSettled,
      providersDebug,
      executionTimeMs,
      cached: false
    };

    // Store in query cache if valid
    if (finalAssets.length > 0) {
      this.queryCache.set(cacheKey, {
        response,
        timestamp: Date.now()
      });
      // Evict old entries if cache grows past 200
      if (this.queryCache.size > 200) {
        const oldestKey = this.queryCache.keys().next().value;
        if (oldestKey) this.queryCache.delete(oldestKey);
      }
    }

    return response;
  }

  /**
   * Interleave results from different providers so the user gets varied creative media
   */
  private interleaveAssets(assets: UnifiedAsset[]): UnifiedAsset[] {
    const byProvider = new Map<string, UnifiedAsset[]>();
    for (const asset of assets) {
      if (!byProvider.has(asset.provider)) {
        byProvider.set(asset.provider, []);
      }
      byProvider.get(asset.provider)!.push(asset);
    }

    const interleaved: UnifiedAsset[] = [];
    let hasMore = true;
    let round = 0;

    while (hasMore) {
      hasMore = false;
      for (const list of byProvider.values()) {
        if (round < list.length) {
          interleaved.push(list[round]);
          hasMore = true;
        }
      }
      round++;
    }

    return interleaved;
  }

  /**
   * Health check all configured providers
   */
  async checkAllHealth() {
    const checks = await Promise.allSettled(
      this.getAllAdapters().map(async (a) => {
        const t0 = Date.now();
        const ok = await a.healthCheck();
        return {
          provider: a.providerName,
          healthy: ok,
          latencyMs: Date.now() - t0
        };
      })
    );

    return checks.map((c, i) => {
      const adapter = this.getAllAdapters()[i];
      if (c.status === 'fulfilled') {
        return c.value;
      }
      return {
        provider: adapter.providerName,
        healthy: false,
        latencyMs: 999
      };
    });
  }
}

export const searchOrchestrator = new SearchOrchestrator();
