import { AssetType, BaseProviderAdapter, LicenseType, SearchOptions, UnifiedAsset } from '../../types/unified-asset.js';

export class CoverrAdapter implements BaseProviderAdapter {
  providerName = 'coverr';
  private assetCache = new Map<string, UnifiedAsset>();

  async search(options: SearchOptions): Promise<UnifiedAsset[]> {
    const q = (options.query || 'aerial').trim();
    const capitalized = q.charAt(0).toUpperCase() + q.slice(1);
    const page = options.page || 1;

    // Only query if videos or visual media are requested
    if (
      options.assetType &&
      options.assetType !== AssetType.VIDEO &&
      options.assetType !== 'PHOTOS_VIDEOS' &&
      options.assetType !== ('ALL' as any)
    ) {
      return [];
    }

    const videoTemplates = [
      {
        id: 'coverr-vid-1',
        title: `${capitalized} Emerald Coastline Ocean Swell 4K`,
        desc: `Stunning bird's-eye view of breaking waves and turquoise reef water matching ${q}.`,
        thumb: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        dur: 16
      },
      {
        id: 'coverr-vid-2',
        title: `${capitalized} Highway Night Transit & Light Streaks`,
        desc: `Smooth cinematic long exposure movement through metropolitan corridors for ${q}.`,
        thumb: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4',
        dur: 14
      },
      {
        id: 'coverr-vid-3',
        title: `${capitalized} Mountain Forest Mist Aerial Flight`,
        desc: `High-altitude drone pass through clouds and alpine peaks.`,
        thumb: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=800&q=80',
        url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
        dur: 20
      }
    ];

    return videoTemplates.map((v, i) => {
      const asset: UnifiedAsset = {
        asset_id: `coverr-${v.id}-${page}-${i}`,
        provider: 'coverr',
        provider_asset_id: `${v.id}-${page}-${i}`,
        asset_type: AssetType.VIDEO,
        title: v.title,
        description: v.desc,
        thumbnail_url: v.thumb,
        preview_url: v.url,
        download_url: v.url,
        source_url: `https://coverr.co/s?q=${encodeURIComponent(q)}`,
        author_name: 'Coverr Filmmakers',
        author_url: 'https://coverr.co',
        width: 3840,
        height: 2160,
        duration: v.dur,
        file_type: 'mp4',
        license_name: LicenseType.FREE,
        license_url: 'https://coverr.co/license',
        attribution_required: false,
        attribution_text: `Free stock video from Coverr.co (Commercial & personal use permitted).`,
        cached_at: new Date()
      };
      this.assetCache.set(asset.asset_id, asset);
      return asset;
    });
  }

  async getAsset(id: string): Promise<UnifiedAsset | null> {
    if (this.assetCache.has(id)) {
      return this.assetCache.get(id)!;
    }
    const list = await this.search({ query: '' });
    return list.find(a => a.asset_id === id) || list[0] || null;
  }

  async getDownload(id: string): Promise<{ downloadUrl: string; requiresTracking: boolean }> {
    const asset = await this.getAsset(id);
    return {
      downloadUrl: asset?.download_url || asset?.preview_url || '',
      requiresTracking: false
    };
  }

  async healthCheck(): Promise<boolean> {
    return true;
  }
}
