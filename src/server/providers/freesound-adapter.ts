import {
  AssetType,
  BaseProviderAdapter,
  LicenseType,
  ProviderSearchResult,
  SearchOptions,
  UnifiedAsset
} from '../../types/unified-asset.js';

export class FreesoundAdapter implements BaseProviderAdapter {
  providerName = 'freesound';
  private assetCache = new Map<string, UnifiedAsset>();

  private getApiKey(): string | undefined {
    return process.env.FREESOUND_API_KEY;
  }

  async searchDetailed(options: SearchOptions): Promise<ProviderSearchResult> {
    const t0 = Date.now();
    const apiKey = this.getApiKey();

    if (!apiKey) {
      return {
        assets: [],
        totalAvailable: null,
        status: 'DISABLED_NO_KEY',
        error: 'Missing FREESOUND_API_KEY in server environment variables',
        responseTimeMs: 0
      };
    }

    const query = options.query || 'sound';
    const isSfx = options.assetType === AssetType.SOUND_EFFECT;
    const page = options.page || 1;
    const pageSize = Math.min(options.perPage || 24, 30);

    try {
      const endpoint = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(query)}&token=${apiKey}&page=${page}&page_size=${pageSize}&fields=id,name,description,previews,images,url,username,license,duration,type`;
      const res = await fetch(endpoint, { signal: AbortSignal.timeout(5000) });
      const elapsed = Date.now() - t0;

      if (!res.ok) {
        return {
          assets: [],
          totalAvailable: null,
          status: 'ERROR',
          httpStatus: res.status,
          error: `Freesound API error: HTTP ${res.status}`,
          responseTimeMs: elapsed
        };
      }

      const data = await res.json();
      const results = data.results || [];
      const totalAvailable = typeof data.count === 'number' ? data.count : null;

      const assets: UnifiedAsset[] = results.map((item: any) => {
        const isCC0 = item.license?.includes('zero') || item.license?.includes('publicdomain');
        const licenseType = isCC0 ? LicenseType.CC0 : LicenseType.CC_BY;
        const asset: UnifiedAsset = {
          asset_id: `freesound-${item.id}`,
          provider: 'freesound',
          provider_asset_id: String(item.id),
          asset_type: (item.duration && item.duration < 4) || isSfx ? AssetType.SOUND_EFFECT : AssetType.AUDIO,
          title: item.name || `Sound Sample ${item.id}`,
          description: item.description || `Open licensed acoustic recording for ${query}.`,
          thumbnail_url: item.images?.waveform_bw || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=720&q=80',
          preview_url: item.previews?.['preview-hq-mp3'] || item.previews?.['preview-lq-mp3'],
          download_url: item.previews?.['preview-hq-mp3'] || item.url,
          source_url: item.url || `https://freesound.org/s/${item.id}/`,
          author_name: item.username || 'Freesound Artist',
          author_url: `https://freesound.org/people/${item.username}/`,
          duration: Math.round(item.duration || 10),
          file_type: 'mp3',
          license_name: licenseType,
          license_url: item.license || 'https://creativecommons.org/licenses/by/4.0/',
          attribution_required: !isCC0,
          attribution_text: `"${item.name}" by ${item.username} from Freesound.org (${isCC0 ? 'CC0' : 'CC BY 4.0'}).`,
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
        error: err?.message || 'Freesound request failed',
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
