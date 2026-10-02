import {
  AssetType,
  BaseProviderAdapter,
  LicenseType,
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

export class SearchOrchestrator {
  private adapters: Map<string, BaseProviderAdapter> = new Map();

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
        this.adapters.get('unsplash'),
        this.adapters.get('pexels'),
        this.adapters.get('coverr'),
        this.adapters.get('pixabay'),
        this.adapters.get('mixkit'),
        this.adapters.get('wikimedia'),
        this.adapters.get('openverse')
      ].filter(Boolean) as BaseProviderAdapter[];
    }

    switch (type) {
      case AssetType.PHOTO:
        return [
          this.adapters.get('unsplash'),
          this.adapters.get('pexels'),
          this.adapters.get('pixabay'),
          this.adapters.get('openverse'),
          this.adapters.get('wikimedia')
        ].filter(Boolean) as BaseProviderAdapter[];

      case AssetType.VIDEO:
        return [
          this.adapters.get('pexels'),
          this.adapters.get('coverr'),
          this.adapters.get('mixkit'),
          this.adapters.get('pixabay'),
          this.adapters.get('wikimedia')
        ].filter(Boolean) as BaseProviderAdapter[];

      case AssetType.AUDIO:
      case AssetType.SOUND_EFFECT:
        return [
          this.adapters.get('freesound'),
          this.adapters.get('mixkit'),
          this.adapters.get('openverse'),
          this.adapters.get('wikimedia')
        ].filter(Boolean) as BaseProviderAdapter[];

      case AssetType.ICON:
        return [
          this.adapters.get('iconify'),
          this.adapters.get('undraw'),
          this.adapters.get('wikimedia')
        ].filter(Boolean) as BaseProviderAdapter[];

      case AssetType.VECTOR:
      case AssetType.ILLUSTRATION:
        return [
          this.adapters.get('undraw'),
          this.adapters.get('pixabay'),
          this.adapters.get('openverse'),
          this.adapters.get('wikimedia'),
          this.adapters.get('iconify')
        ].filter(Boolean) as BaseProviderAdapter[];

      case AssetType.GIF:
      case AssetType.PNG:
        return [
          this.adapters.get('giphy'),
          this.adapters.get('pixabay')
        ].filter(Boolean) as BaseProviderAdapter[];

      default:
        return this.getAllAdapters();
    }
  }

  /**
   * Execute multi-provider search with isolated concurrency via Promise.allSettled()
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    const startTime = Date.now();
    const targetAdapters = this.selectAdaptersForType(options.assetType, options.provider);

    // Rule 2: ISOLATED CONCURRENCY using Promise.allSettled()
    const settledResults = await Promise.allSettled(
      targetAdapters.map(adapter =>
        adapter.search(options).catch(err => {
          console.error(`[SearchOrchestrator] Error querying ${adapter.providerName}:`, err?.message || err);
          throw err;
        })
      )
    );

    const rawAssets: UnifiedAsset[] = [];
    const providersSettled: SearchResponse['providersSettled'] = [];

    settledResults.forEach((result, idx) => {
      const adapter = targetAdapters[idx];
      if (result.status === 'fulfilled') {
        rawAssets.push(...result.value);
        providersSettled.push({
          provider: adapter.providerName,
          status: 'fulfilled',
          count: result.value.length
        });
      } else {
        providersSettled.push({
          provider: adapter.providerName,
          status: 'rejected',
          count: 0,
          error: result.reason?.message || 'Provider query timed out or failed'
        });
      }
    });

    // Rule 3: DEDUPLICATION using composite keys (provider + provider_asset_id)
    const dedupedMap = new Map<string, UnifiedAsset>();
    for (const asset of rawAssets) {
      const compositeKey = `${asset.provider}:${asset.provider_asset_id}`.toLowerCase();
      if (!dedupedMap.has(compositeKey)) {
        // Rule 4: LICENSE CLARITY check
        if (!asset.license_name || asset.license_name === 'UNKNOWN') {
          asset.license_name = LicenseType.CHECK_LICENSE;
        }
        dedupedMap.set(compositeKey, asset);
      }
    }

    let finalAssets = Array.from(dedupedMap.values());

    // 1. Strict Asset Type Filtering (Segregation of media types)
    if (options.assetType && options.assetType !== ('ALL' as any)) {
      finalAssets = finalAssets.filter(a => {
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
          return a.asset_type === AssetType.SOUND_EFFECT;
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

    // 2. Intelligent Keyword Relevance Ranking (Prioritize direct keyword matches to top)
    if (options.query && options.query.trim().length > 1) {
      const qWords = options.query.toLowerCase().trim().split(/\s+/).filter(w => w.length > 1);
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
      finalAssets = finalAssets.filter(a => a.provider.toLowerCase() === pTarget);
    }

    // 3. Strict License Filtering
    if (options.license && options.license !== 'ALL') {
      finalAssets = finalAssets.filter(a => {
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

    // 4. Sorting Options
    if (options.sortBy === 'newest') {
      finalAssets.sort((a, b) => new Date(b.cached_at).getTime() - new Date(a.cached_at).getTime());
    } else if (options.sortBy === 'resolution') {
      finalAssets.sort((a, b) => ((b.width || 0) * (b.height || 0)) - ((a.width || 0) * (a.height || 0)));
    } else {
      // Default: Interleave providers evenly so results are diverse
      finalAssets = this.interleaveAssets(finalAssets);
    }

    const executionTimeMs = Date.now() - startTime;

    return {
      assets: finalAssets,
      totalResults: finalAssets.length,
      providersQueried: targetAdapters.map(a => a.providerName),
      providersSettled,
      executionTimeMs
    };
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
      this.getAllAdapters().map(async a => {
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
