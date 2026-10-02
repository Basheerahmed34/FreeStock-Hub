import { AssetType, BaseProviderAdapter, LicenseType, SearchOptions, UnifiedAsset } from '../../types/unified-asset.js';

export class OpenverseAdapter implements BaseProviderAdapter {
  providerName = 'openverse';

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

  private assetCache = new Map<string, UnifiedAsset>();

  async search(options: SearchOptions): Promise<UnifiedAsset[]> {
    const query = options.query || 'nature';
    const page = options.page || 1;
    const pageSize = Math.min(options.perPage || 30, 40);
    const isAudioQuery = options.assetType === AssetType.AUDIO || options.assetType === AssetType.SOUND_EFFECT;
    const endpoint = isAudioQuery
      ? `https://api.openverse.org/v1/audio/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`
      : `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'FreeStockHub/1.0 (https://freestockhub.org; open-access-aggregator)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new Error(`Openverse API returned status ${response.status}`);
      }

      const data = await response.json();
      const results: Array<Record<string, any>> = data.results || [];

      const parsed = results.map((item) => {
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

      return parsed;
    } catch {
      clearTimeout(timeout);
      return [];
    }
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
        width: item.width,
        height: item.height,
        duration: item.duration,
        file_type: item.filetype,
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

  private getFallbackAssets(options: SearchOptions): UnifiedAsset[] {
    const query = (options.query || 'creative').toLowerCase();
    const assets: UnifiedAsset[] = [
      {
        asset_id: `openverse-image-fb-101`,
        provider: 'openverse',
        provider_asset_id: 'fb-101',
        asset_type: AssetType.PHOTO,
        title: `Misty Mountain Pine Ridge (${query})`,
        description: 'Fog creeping over alpine pine trees at sunrise captured in British Columbia.',
        thumbnail_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
        preview_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=85',
        download_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=2560&q=90',
        source_url: 'https://openverse.org/image/fb-101',
        author_name: 'Elena Rostova',
        author_url: 'https://openverse.org/users/elena',
        width: 3840,
        height: 2160,
        file_type: 'jpg',
        license_name: LicenseType.CC_BY,
        license_url: 'https://creativecommons.org/licenses/by/4.0/',
        attribution_required: true,
        attribution_text: '"Misty Mountain Pine Ridge" by Elena Rostova is licensed under CC BY 4.0.',
        cached_at: new Date()
      },
      {
        asset_id: `openverse-audio-fb-102`,
        provider: 'openverse',
        provider_asset_id: 'fb-102',
        asset_type: AssetType.AUDIO,
        title: 'Gentle Ocean Shore Waves & Gull Cry',
        description: 'Binaural field recording of North Sea gentle tides breaking on pebbles.',
        thumbnail_url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        preview_url: 'https://cdn.freesound.org/previews/387/387232_5121236-lq.mp3',
        download_url: 'https://cdn.freesound.org/previews/387/387232_5121236-lq.mp3',
        source_url: 'https://openverse.org/audio/fb-102',
        author_name: 'Soundscape Archive Lab',
        author_url: 'https://openverse.org/users/soundlab',
        duration: 48,
        file_type: 'mp3',
        license_name: LicenseType.CC0,
        license_url: 'https://creativecommons.org/publicdomain/zero/1.0/',
        attribution_required: false,
        attribution_text: '"Gentle Ocean Shore Waves" by Soundscape Archive Lab is dedicated to the public domain under CC0 1.0.',
        cached_at: new Date()
      }
    ];
    return assets;
  }
}
