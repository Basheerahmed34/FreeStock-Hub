import {
  AssetType,
  BaseProviderAdapter,
  LicenseType,
  ProviderSearchResult,
  SearchOptions,
  UnifiedAsset
} from '../../types/unified-asset.js';

export class PexelsAdapter implements BaseProviderAdapter {
  providerName = 'pexels';
  private assetCache = new Map<string, UnifiedAsset>();

  private getApiKey(): string | undefined {
    return process.env.PEXELS_API_KEY;
  }

  async searchDetailed(options: SearchOptions): Promise<ProviderSearchResult> {
    const t0 = Date.now();
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        assets: [],
        totalAvailable: null,
        status: 'DISABLED_NO_KEY',
        error: 'Missing PEXELS_API_KEY in server environment variables',
        responseTimeMs: 0
      };
    }

    const query = options.query || 'nature';
    const isVideo = options.assetType === AssetType.VIDEO;
    const page = options.page || 1;
    const perPage = Math.min(options.perPage || 24, 40);

    try {
      const endpoint = isVideo
        ? `https://api.pexels.com/videos/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`
        : `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;

      const res = await fetch(endpoint, {
        headers: { Authorization: apiKey },
        signal: AbortSignal.timeout(5000)
      });

      const elapsed = Date.now() - t0;

      if (!res.ok) {
        return {
          assets: [],
          totalAvailable: null,
          status: 'ERROR',
          httpStatus: res.status,
          error: `Pexels API error: HTTP ${res.status}`,
          responseTimeMs: elapsed
        };
      }

      const data = await res.json();
      const totalAvailable = typeof data.total_results === 'number' ? data.total_results : null;

      if (isVideo) {
        const videos = data.videos || [];
        const assets: UnifiedAsset[] = videos.map((v: any) => {
          const bestFile = v.video_files?.find((f: any) => f.quality === 'hd') || v.video_files?.[0];
          const asset: UnifiedAsset = {
            asset_id: `pexels-video-${v.id}`,
            provider: 'pexels',
            provider_asset_id: String(v.id),
            asset_type: AssetType.VIDEO,
            title: `Pexels Video: ${query} by ${v.user?.name || 'Creator'}`,
            description: `High-definition stock video footage by ${v.user?.name || 'Pexels Contributor'}.`,
            thumbnail_url: v.image,
            preview_url: bestFile?.link || v.video_pictures?.[0]?.picture,
            download_url: bestFile?.link || v.url,
            source_url: v.url,
            author_name: v.user?.name || 'Pexels Creator',
            author_url: v.user?.url,
            width: v.width,
            height: v.height,
            duration: v.duration,
            file_type: 'mp4',
            license_name: LicenseType.FREE,
            license_url: 'https://www.pexels.com/license/',
            attribution_required: false,
            attribution_text: `Video by ${v.user?.name || 'Creator'} from Pexels.`,
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
      } else {
        const photos = data.photos || [];
        const assets: UnifiedAsset[] = photos.map((p: any) => {
          const asset: UnifiedAsset = {
            asset_id: `pexels-photo-${p.id}`,
            provider: 'pexels',
            provider_asset_id: String(p.id),
            asset_type: AssetType.PHOTO,
            title: p.alt || `Photo by ${p.photographer}`,
            description: p.alt || `High-resolution royalty-free photography for ${query}.`,
            thumbnail_url: p.src?.medium || p.src?.small,
            preview_url: p.src?.large2x || p.src?.large,
            download_url: p.src?.original,
            source_url: p.url,
            author_name: p.photographer || 'Pexels Photographer',
            author_url: p.photographer_url,
            width: p.width,
            height: p.height,
            file_type: 'jpg',
            license_name: LicenseType.FREE,
            license_url: 'https://www.pexels.com/license/',
            attribution_required: false,
            attribution_text: `Photo by ${p.photographer} from Pexels.`,
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
      }
    } catch (err: any) {
      return {
        assets: [],
        totalAvailable: null,
        status: 'ERROR',
        error: err?.message || 'Pexels request timed out or failed',
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
