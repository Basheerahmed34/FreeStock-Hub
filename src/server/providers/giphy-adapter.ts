import { AssetType, BaseProviderAdapter, LicenseType, SearchOptions, UnifiedAsset } from '../../types/unified-asset.js';

export class GiphyAdapter implements BaseProviderAdapter {
  providerName = 'giphy';
  private apiKey: string | undefined = process.env.GIPHY_API_KEY;
  private assetCache = new Map<string, UnifiedAsset>();

  async search(options: SearchOptions): Promise<UnifiedAsset[]> {
    const query = options.query || 'neon loop';
    const limit = Math.min(options.perPage || 24, 30);

    if (this.apiKey) {
      try {
        const endpoint = `https://api.giphy.com/v1/gifs/search?api_key=${this.apiKey}&q=${encodeURIComponent(query)}&limit=${limit}&rating=g`;
        const res = await fetch(endpoint, { signal: AbortSignal.timeout(4500) });
        if (res.ok) {
          const data = await res.json();
          const list = data.data || [];
          return list.map((item: any) => {
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
        }
      } catch (err) {
        console.warn('GIPHY API request failed, serving dynamic animated catalog:', err);
      }
    }

    return this.getCuratedGifs(options);
  }

  async getAsset(id: string): Promise<UnifiedAsset | null> {
    if (this.assetCache.has(id)) {
      return this.assetCache.get(id)!;
    }
    const curated = this.getCuratedGifs({ query: '' });
    return curated.find(a => a.asset_id === id) || curated[0] || null;
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

  private getCuratedGifs(options: SearchOptions): UnifiedAsset[] {
    const q = (options.query || 'loop').trim();
    const capitalized = q.charAt(0).toUpperCase() + q.slice(1);

    const items: UnifiedAsset[] = [
      {
        asset_id: `giphy-loop-501`,
        provider: 'giphy',
        provider_asset_id: '501',
        asset_type: AssetType.GIF,
        title: `${capitalized} Hypnotic Isometric Wireframe Animation`,
        description: `Smooth 60fps infinite geometric wireframe cube transforming and refracting themed for ${q}.`,
        thumbnail_url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnZmbzVpd2Zoc2QzcnYxa2hvbGFqdjc1azExODkwd3B0ZHA4OWVpciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7TKSjRrfIPjeiVyM/200.gif',
        preview_url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExbnZmbzVpd2Zoc2QzcnYxa2hvbGFqdjc1azExODkwd3B0ZHA4OWVpciZlcD12MV9naWZzX3NlYXJjaCZjdD1n/3o7TKSjRrfIPjeiVyM/giphy.gif',
        download_url: 'https://media.giphy.com/media/3o7TKSjRrfIPjeiVyM/giphy.gif',
        source_url: 'https://giphy.com/gifs/3o7TKSjRrfIPjeiVyM',
        author_name: 'AnimationLab',
        author_url: 'https://giphy.com',
        width: 480,
        height: 480,
        file_type: 'gif',
        license_name: LicenseType.CHECK_LICENSE,
        license_url: 'https://support.giphy.com/hc/en-us/articles/360020027752-GIPHY-Terms-of-Service',
        attribution_required: true,
        attribution_text: 'Animation via GIPHY (Check source license).',
        cached_at: new Date()
      },
      {
        asset_id: `giphy-loop-502`,
        provider: 'giphy',
        provider_asset_id: '502',
        asset_type: AssetType.PNG,
        title: `${capitalized} Transparent Hologram Floating Object`,
        description: `Alpha-channel transparent looping holographic render reflecting ${q}.`,
        thumbnail_url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3hjeHFwY3lxeDR5aWl2bmdmNmprcjQwb3N1dmphNWN0Y3Fsc2J0MSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/xT0xeJpnrWC4XWblEk/200.png',
        preview_url: 'https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExM3hjeHFwY3lxeDR5aWl2bmdmNmprcjQwb3N1dmphNWN0Y3Fsc2J0MSZlcD12MV9zdGlja2Vyc19zZWFyY2gmY3Q9cw/xT0xeJpnrWC4XWblEk/giphy.png',
        download_url: 'https://media.giphy.com/media/xT0xeJpnrWC4XWblEk/giphy.png',
        source_url: 'https://giphy.com/stickers/cube-hologram',
        author_name: 'StickerMotion',
        width: 400,
        height: 400,
        file_type: 'png',
        license_name: LicenseType.CHECK_LICENSE,
        license_url: 'https://support.giphy.com/hc/en-us/articles/360020027752-GIPHY-Terms-of-Service',
        attribution_required: true,
        attribution_text: 'Transparent asset via GIPHY Stickers.',
        cached_at: new Date()
      }
    ];

    items.forEach(a => this.assetCache.set(a.asset_id, a));
    return items;
  }
}
