import {
  AssetType,
  BaseProviderAdapter,
  LicenseType,
  ProviderSearchResult,
  SearchOptions,
  UnifiedAsset
} from '../../types/unified-asset.js';

export class UnsplashAdapter implements BaseProviderAdapter {
  providerName = 'unsplash';
  private assetCache = new Map<string, UnifiedAsset>();

  private getAccessKey(): string | undefined {
    return process.env.UNSPLASH_ACCESS_KEY;
  }

  async searchDetailed(options: SearchOptions): Promise<ProviderSearchResult> {
    const t0 = Date.now();
    const accessKey = this.getAccessKey();

    if (!accessKey) {
      return {
        assets: [],
        totalAvailable: null,
        status: 'DISABLED_NO_KEY',
        error: 'Missing UNSPLASH_ACCESS_KEY in server environment variables',
        responseTimeMs: 0
      };
    }

    const query = options.query || 'nature';
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 24, 30);

    try {
      const endpoint = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;
      const res = await fetch(endpoint, {
        headers: {
          Authorization: `Client-ID ${accessKey}`,
          'Accept-Version': 'v1'
        },
        signal: AbortSignal.timeout(5000)
      });

      const elapsed = Date.now() - t0;

      if (!res.ok) {
        return {
          assets: [],
          totalAvailable: null,
          status: 'ERROR',
          httpStatus: res.status,
          error: `Unsplash API error: HTTP ${res.status}`,
          responseTimeMs: elapsed
        };
      }

      const data = await res.json();
      const results = data.results || [];
      const totalAvailable = typeof data.total === 'number' ? data.total : null;

      const assets: UnifiedAsset[] = results.map((item: any) => {
        const asset: UnifiedAsset = {
          asset_id: `unsplash-photo-${item.id}`,
          provider: 'unsplash',
          provider_asset_id: item.id,
          asset_type: AssetType.PHOTO,
          title: item.description || item.alt_description || `Unsplash Photo ${item.id}`,
          description: item.alt_description || item.description || `High-resolution photography for ${query}.`,
          thumbnail_url: item.urls?.small || item.urls?.thumb,
          preview_url: item.urls?.regular || item.urls?.full,
          download_url: item.links?.download || item.urls?.raw,
          source_url: item.links?.html || `https://unsplash.com/photos/${item.id}`,
          author_name: item.user?.name || 'Unsplash Photographer',
          author_url: item.user?.links?.html ? `${item.user.links.html}?utm_source=freestock_hub&utm_medium=referral` : undefined,
          width: item.width,
          height: item.height,
          file_type: 'jpg',
          license_name: LicenseType.FREE,
          license_url: 'https://unsplash.com/license',
          attribution_required: false,
          attribution_text: `Photo by ${item.user?.name || 'Photographer'} on Unsplash.`,
          cached_at: new Date(),
          raw_metadata: {
            download_location: item.links?.download_location
          }
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
        error: err?.message || 'Unsplash request failed',
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
      requiresTracking: true
    };
  }

  async healthCheck(): Promise<boolean> {
    return Boolean(this.getAccessKey());
  }
}
