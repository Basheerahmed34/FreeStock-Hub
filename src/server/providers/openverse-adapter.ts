import {
  AssetType,
  BaseProviderAdapter,
  LicenseType,
  ProviderSearchResult,
  SearchOptions,
  UnifiedAsset
} from '../../types/unified-asset.js';

export class OpenverseAdapter implements BaseProviderAdapter {
  providerName = 'openverse';
  private assetCache = new Map<string, UnifiedAsset>();

  private mapLicense(license: string): { licenseType: LicenseType | string; attributionRequired: boolean } {
    const lic = (license || '').toLowerCase();
    if (lic.includes('cc0')) {
      return { licenseType: LicenseType.CC0, attributionRequired: false };
    }
    if (lic.includes('pdm') || lic.includes('publicdomain')) {
      return { licenseType: LicenseType.PUBLIC_DOMAIN, attributionRequired: false };
    }
    if (lic === 'by') {
      return { licenseType: LicenseType.CC_BY, attributionRequired: true };
    }
    if (lic.includes('by-sa')) {
      return { licenseType: LicenseType.CC_BY_SA, attributionRequired: true };
    }
    if (lic.startsWith('by-')) {
      return { licenseType: `CC_${lic.toUpperCase().replace(/-/g, '_')}`, attributionRequired: true };
    }
    return { licenseType: LicenseType.CHECK_LICENSE, attributionRequired: true };
  }

  async searchDetailed(options: SearchOptions): Promise<ProviderSearchResult> {
    const t0 = Date.now();
    const query = options.query || 'nature';
    const page = options.page || 1;
    const pageSize = Math.min(options.perPage || 24, 40);
    const isAudioQuery = options.assetType === AssetType.AUDIO || options.assetType === AssetType.SOUND_EFFECT;
    const endpoint = isAudioQuery
      ? `https://api.openverse.org/v1/audio/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`
      : `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'FreeStockHub/1.0 (https://freestockhub.org; open-access-aggregator)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);
      const elapsed = Date.now() - t0;

      if (!response.ok) {
        return {
          assets: [],
          totalAvailable: null,
          status: 'ERROR',
          httpStatus: response.status,
          error: `Openverse HTTP ${response.status}`,
          responseTimeMs: elapsed
        };
      }

      const data = await response.json();
      const results: Array<Record<string, any>> = data.results || [];
      const totalAvailable = typeof data.result_count === 'number' ? data.result_count : null;

      const parsed: UnifiedAsset[] = results.map((item) => {
        const { licenseType, attributionRequired } = this.mapLicense(item.license);
        const isAudio = Boolean(item.audio_set || item.genres || isAudioQuery);

        const asset: UnifiedAsset = {
          asset_id: `openverse-${isAudio ? 'audio' : 'image'}-${item.id}`,
          provider: 'openverse',
          provider_asset_id: String(item.id),
          asset_type: isAudio ? AssetType.AUDIO : (item.filetype === 'svg' ? AssetType.VECTOR : AssetType.PHOTO),
          title: item.title || 'Untitled Openverse Asset',
          description: item.description || `Creative work from ${item.creator || 'unknown creator'} on Openverse`,
          thumbnail_url: item.thumbnail || item.url,
          preview_url: item.url,
          download_url: item.url,
          source_url: item.foreign_landing_url || item.detail_url || `https://openverse.org/${isAudio ? 'audio' : 'image'}/${item.id}`,
          author_name: item.creator || 'Openverse Contributor',
          author_url: item.creator_url || undefined,
          width: item.width || undefined,
          height: item.height || undefined,
          duration: item.duration ? Math.round(item.duration / 1000) : undefined,
          file_type: item.filetype || (isAudio ? 'mp3' : 'jpeg'),
          license_name: licenseType,
          license_url: item.license_url || `https://creativecommons.org/licenses/${item.license}/${item.license_version || '4.0'}/`,
          attribution_required: attributionRequired,
          attribution_text: item.attribution || `"${item.title || 'Untitled'}" by ${item.creator || 'Unknown'} is marked under ${item.license || 'open license'}.`,
          cached_at: new Date()
        };
        this.assetCache.set(asset.asset_id, asset);
        return asset;
      });

      return {
        assets: parsed,
        totalAvailable,
        status: 'SUCCESS',
        httpStatus: 200,
        responseTimeMs: elapsed
      };
    } catch (err: any) {
      clearTimeout(timeout);
      return {
        assets: [],
        totalAvailable: null,
        status: 'ERROR',
        error: err?.message || 'Openverse query timed out or failed',
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

    const rawId = id.replace(/^openverse-(image|audio)-/, '').replace(/^openverse-/, '');
    const isAudio = id.includes('audio');
    const endpoint = `https://api.openverse.org/v1/${isAudio ? 'audio' : 'images'}/${rawId}/`;

    try {
      const res = await fetch(endpoint, {
        headers: { 'User-Agent': 'FreeStockHub/1.0' }
      });
      if (!res.ok) return null;
      const item = await res.json();
      const { licenseType, attributionRequired } = this.mapLicense(item.license);
      const asset: UnifiedAsset = {
        asset_id: id,
        provider: 'openverse',
        provider_asset_id: String(item.id),
        asset_type: isAudio ? AssetType.AUDIO : AssetType.PHOTO,
        title: item.title || 'Untitled',
        description: item.description,
        thumbnail_url: item.thumbnail || item.url,
        preview_url: item.url,
        download_url: item.url,
        source_url: item.foreign_landing_url || item.detail_url,
        author_name: item.creator || 'Openverse Contributor',
        author_url: item.creator_url,
        width: item.width || undefined,
        height: item.height || undefined,
        duration: item.duration ? Math.round(item.duration / 1000) : undefined,
        file_type: item.filetype || (isAudio ? 'mp3' : 'jpeg'),
        license_name: licenseType,
        license_url: item.license_url,
        attribution_required: attributionRequired,
        attribution_text: item.attribution,
        cached_at: new Date()
      };
      this.assetCache.set(id, asset);
      return asset;
    } catch {
      return null;
    }
  }

  async getDownload(id: string): Promise<{ downloadUrl: string; requiresTracking: boolean }> {
    const asset = await this.getAsset(id);
    return {
      downloadUrl: asset?.download_url || '',
      requiresTracking: false
    };
  }

  async healthCheck(): Promise<boolean> {
    try {
      const res = await fetch('https://api.openverse.org/v1/images/?page_size=1', {
        headers: { 'User-Agent': 'FreeStockHub/1.0' },
        signal: AbortSignal.timeout(3000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
