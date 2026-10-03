import {
  AssetType,
  BaseProviderAdapter,
  LicenseType,
  ProviderSearchResult,
  SearchOptions,
  UnifiedAsset
} from '../../types/unified-asset.js';

export class PixabayAdapter implements BaseProviderAdapter {
  providerName = 'pixabay';
  private assetCache = new Map<string, UnifiedAsset>();

  private getApiKey(): string | undefined {
    return process.env.PIXABAY_API_KEY;
  }

  async searchDetailed(options: SearchOptions): Promise<ProviderSearchResult> {
    const t0 = Date.now();
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        assets: [],
        totalAvailable: null,
        status: 'DISABLED_NO_KEY',
        error: 'Missing PIXABAY_API_KEY in server environment variables',
        responseTimeMs: 0
      };
    }

    const query = options.query || 'creative vector';
    const isIllustration = options.assetType === AssetType.ILLUSTRATION || options.assetType === AssetType.VECTOR;
    const isVideo = options.assetType === AssetType.VIDEO;
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 24, 40);

    try {
      const imageType = isIllustration ? 'vector' : 'photo';
      const endpoint = isVideo
        ? `https://pixabay.com/api/videos/?key=${apiKey}&q=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
        : `https://pixabay.com/api/?key=${apiKey}&q=${encodeURIComponent(query)}&image_type=${imageType}&page=${page}&per_page=${perPage}`;

      const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
      const elapsed = Date.now() - t0;

      if (!res.ok) {
        return {
          assets: [],
          totalAvailable: null,
          status: 'ERROR',
          httpStatus: res.status,
          error: `Pixabay API error: HTTP ${res.status}`,
          responseTimeMs: elapsed
        };
      }

      const data = await res.json();
      const hits = data.hits || [];
      const totalAvailable = typeof data.totalHits === 'number' ? data.totalHits : null;

      const assets: UnifiedAsset[] = hits.map((hit: any) => {
        const assetType = isVideo ? AssetType.VIDEO : (hit.type === 'vector/svg' ? AssetType.VECTOR : (hit.type === 'illustration' ? AssetType.ILLUSTRATION : AssetType.PHOTO));
        const asset: UnifiedAsset = {
          asset_id: `pixabay-${hit.id}`,
          provider: 'pixabay',
          provider_asset_id: String(hit.id),
          asset_type: assetType,
          title: hit.tags ? `${hit.tags.split(',')[0]} (${hit.user})` : `Pixabay Asset ${hit.id}`,
          description: `Royalty-free media tagged: ${hit.tags || 'creative'}`,
          thumbnail_url: hit.previewURL || hit.webformatURL,
          preview_url: hit.largeImageURL || hit.webformatURL,
          download_url: hit.imageURL || hit.largeImageURL,
          source_url: hit.pageURL,
          author_name: hit.user || 'Pixabay Artist',
          author_url: hit.user_id ? `https://pixabay.com/users/${hit.user}-${hit.user_id}/` : undefined,
          width: hit.imageWidth,
          height: hit.imageHeight,
          file_type: hit.type === 'vector/svg' ? 'svg' : 'jpg',
          license_name: LicenseType.FREE,
          license_url: 'https://pixabay.com/service/license-summary/',
          attribution_required: false,
          attribution_text: `Image by ${hit.user} from Pixabay.`,
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
        error: err?.message || 'Pixabay request failed',
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
