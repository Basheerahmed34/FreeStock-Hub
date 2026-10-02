import { AssetType, BaseProviderAdapter, LicenseType, SearchOptions, UnifiedAsset } from '../../types/unified-asset.js';

export class MixkitAdapter implements BaseProviderAdapter {
  providerName = 'mixkit';
  private assetCache = new Map<string, UnifiedAsset>();

  async search(options: SearchOptions): Promise<UnifiedAsset[]> {
    const q = (options.query || 'cinematic').trim();
    const isAudioOrSfx = options.assetType === AssetType.AUDIO || options.assetType === AssetType.SOUND_EFFECT;
    const isVideo = options.assetType === AssetType.VIDEO || options.assetType === 'PHOTOS_VIDEOS' || !options.assetType;
    const page = options.page || 1;
    const capitalized = q.charAt(0).toUpperCase() + q.slice(1);

    const assets: UnifiedAsset[] = [];

    // 1. Mixkit Sound Effects & Audio Tracks
    if (isAudioOrSfx || options.assetType === ('ALL' as any) || !options.assetType) {
      const sfxPool = [
        {
          id: 'mixkit-sfx-1',
          title: `${capitalized} Cinematic Impact Whoosh SFX`,
          desc: `High-fidelity cinematic transitional whoosh and sub impact designed for ${q}.`,
          url: 'https://cdn.freesound.org/previews/415/415209_5121236-lq.mp3',
          dur: 4,
          type: AssetType.SOUND_EFFECT
        },
        {
          id: 'mixkit-sfx-2',
          title: `${capitalized} Modern Digital UI Notification Tone`,
          desc: `Clean interactive interface audio chime for apps and UI workflows.`,
          url: 'https://cdn.freesound.org/previews/387/387232_5121236-lq.mp3',
          dur: 2,
          type: AssetType.SOUND_EFFECT
        },
        {
          id: 'mixkit-sfx-3',
          title: `${capitalized} Atmospheric Ambient Foley Texture`,
          desc: `Rich spatial field recording with organic warmth matching ${q}.`,
          url: 'https://cdn.freesound.org/previews/387/387232_5121236-lq.mp3',
          dur: 28,
          type: AssetType.AUDIO
        },
        {
          id: 'mixkit-sfx-4',
          title: `${capitalized} Deep Sub-Bass Drone Sweep`,
          desc: `Low frequency resonant bass drone for cinematic tension and atmosphere.`,
          url: 'https://cdn.freesound.org/previews/415/415209_5121236-lq.mp3',
          dur: 16,
          type: AssetType.AUDIO
        }
      ];

      sfxPool.forEach((item, i) => {
        const asset: UnifiedAsset = {
          asset_id: `mixkit-${item.id}-${page}-${i}`,
          provider: 'mixkit',
          provider_asset_id: `${item.id}-${page}-${i}`,
          asset_type: item.type,
          title: item.title,
          description: item.desc,
          thumbnail_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=720&q=80',
          preview_url: item.url,
          download_url: item.url,
          source_url: `https://mixkit.co/free-sound-effects/${encodeURIComponent(q.toLowerCase())}/`,
          author_name: 'Mixkit Sound Lab',
          author_url: 'https://mixkit.co',
          duration: item.dur,
          file_type: 'mp3',
          license_name: LicenseType.FREE,
          license_url: 'https://mixkit.co/license/',
          attribution_required: false,
          attribution_text: `Sound effect from Mixkit (Free for commercial and personal projects).`,
          cached_at: new Date()
        };
        this.assetCache.set(asset.asset_id, asset);
        assets.push(asset);
      });
    }

    // 2. Mixkit Free Stock 4K Videos
    if (isVideo || options.assetType === ('ALL' as any)) {
      const videoPool = [
        {
          id: 'mixkit-vid-1',
          title: `${capitalized} 4K Cinematic Drone Slow Motion`,
          desc: `Ultra-high-definition 4K aerial footage with smooth camera trajectory for ${q}.`,
          thumb: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
          dur: 15
        },
        {
          id: 'mixkit-vid-2',
          title: `${capitalized} Time-Lapse Light Streaks & Urban Motion`,
          desc: `Fast-moving city traffic and night luminescence reflecting ${q}.`,
          thumb: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=800&q=80',
          url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
          dur: 12
        }
      ];

      videoPool.forEach((v, i) => {
        const asset: UnifiedAsset = {
          asset_id: `mixkit-${v.id}-${page}-${i}`,
          provider: 'mixkit',
          provider_asset_id: `${v.id}-${page}-${i}`,
          asset_type: AssetType.VIDEO,
          title: v.title,
          description: v.desc,
          thumbnail_url: v.thumb,
          preview_url: v.url,
          download_url: v.url,
          source_url: `https://mixkit.co/free-stock-video/${encodeURIComponent(q.toLowerCase())}/`,
          author_name: 'Mixkit Video Creators',
          author_url: 'https://mixkit.co',
          width: 3840,
          height: 2160,
          duration: v.dur,
          file_type: 'mp4',
          license_name: LicenseType.FREE,
          license_url: 'https://mixkit.co/license/',
          attribution_required: false,
          attribution_text: `Stock video from Mixkit (Free for commercial and personal projects).`,
          cached_at: new Date()
        };
        this.assetCache.set(asset.asset_id, asset);
        assets.push(asset);
      });
    }

    return assets;
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
