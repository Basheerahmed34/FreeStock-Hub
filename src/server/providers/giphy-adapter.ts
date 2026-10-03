import {
  AssetType,
  BaseProviderAdapter,
  LicenseType,
  ProviderSearchResult,
  SearchOptions,
  UnifiedAsset
} from '../../types/unified-asset.js';

export class GiphyAdapter implements BaseProviderAdapter {
  providerName = 'giphy';
  private assetCache = new Map<string, UnifiedAsset>();

  private getApiKey(): string | undefined {
    return process.env.GIPHY_API_KEY;
  }

  async searchDetailed(options: SearchOptions): Promise<ProviderSearchResult> {
    const t0 = Date.now();
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        assets: [],
        totalAvailable: null,
        status: 'DISABLED_NO_KEY',
        error: 'Missing GIPHY_API_KEY in server environment variables',
        responseTimeMs: 0
      };
    }

    const query = options.query || 'loop';
    const limit = Math.min(options.perPage || 24, 30);
    const page = options.page || 1;
    const offset = (page - 1) * limit;

    try {
      const endpoint = `https://api.giphy.com/v1/gifs/search?api_key=${apiKey}&q=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}&rating=g`;
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
      const elapsed = Date.now() - t0;

      if (!res.ok) {
        return {
          assets: [],
          totalAvailable: null,
          status: 'ERROR',
          httpStatus: res.status,
          error: `GIPHY API error: HTTP ${res.status}`,
          responseTimeMs: elapsed
        };
      }

      const data = await res.json();
      const list = data.data || [];
      const totalAvailable = typeof data.pagination?.total_count === 'number'
        ? data.pagination.total_count
        : null;

      const assets: UnifiedAsset[] = list.map((item: any) => {
        const asset: UnifiedAsset = {
          asset_id: `giphy-${item.id}`,
          provider: 'giphy',
          provider_asset_id: item.id,
          asset_type: AssetType.GIF,
          title: item.title || `${query} (GIF Animation)`,
          description: `Animated media provided via GIPHY: ${item.title || query}`,
          thumbnail_url: item.images?.fixed_height_small?.url || item.images?.preview_gif?.url,
          preview_url: item.images?.original?.url || item.images?.downsized_medium?.url,
          download_url: item.images?.original?.url,
          source_url: item.url,
          author_name: item.username || item.user?.display_name || 'GIPHY Artist',
          author_url: item.user?.profile_url || undefined,
          width: Number(item.images?.original?.width) || 480,
          height: Number(item.images?.original?.height) || 480,
          file_type: 'gif',
          license_name: LicenseType.CHECK_LICENSE,
          license_url: 'https://support.giphy.com/hc/en-us/articles/360020027752-GIPHY-Terms-of-Service',
          attribution_required: true,
          attribution_text: `GIF by ${item.username || 'Artist'} via GIPHY.`,
          cached_at: new Date()
        };
        this.assetCache.set(asset.asset_id, asset);
        return asset;
      });

      return {
        assets,
        totalAvailable,
        status: 'SUCCESS',
        httpStatus: 200,
        responseTimeMs: elapsed
      };
    } catch (err: any) {
      return {
        assets: [],
        totalAvailable: null,
        status: 'ERROR',
        error: err?.message || 'GIPHY request failed',
        responseTimeMs: Date.now() - t0
      };
    }
  }

  async search(options: SearchOptions): Promise<UnifiedAsset[]> {
    const detailed = await this.searchDetailed(options);
    return detailed.assets;
  }

  async getAsset(id: string): Promise<UnifiedAsset | null> {
    if (this.assetCache.has(id)) {
      return this.assetCache.get(id)!;
    }
    return null;
  }

  async getDownload(id: string): Promise<{ downloadUrl: string; requiresTracking: boolean }> {
    const asset = await this.getAsset(id);
    return {
      downloadUrl: asset?.download_url || asset?.preview_url || '',
      requiresTracking: false
    };
  }

  async healthCheck(): Promise<boolean> {
    return Boolean(this.getApiKey());
  }
}
