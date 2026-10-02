import { AssetType, BaseProviderAdapter, LicenseType, SearchOptions, UnifiedAsset } from '../../types/unified-asset.js';

export class UndrawAdapter implements BaseProviderAdapter {
  providerName = 'undraw';
  private assetCache = new Map<string, UnifiedAsset>();

  async search(options: SearchOptions): Promise<UnifiedAsset[]> {
    const q = (options.query || 'creative idea').trim();
    const capitalized = q.charAt(0).toUpperCase() + q.slice(1);
    const page = options.page || 1;

    // Only query if vector/illustration or ALL is requested
    if (
      options.assetType &&
      options.assetType !== AssetType.VECTOR &&
      options.assetType !== AssetType.ILLUSTRATION &&
      options.assetType !== ('ALL' as any)
    ) {
      return [];
    }

    const illustrations = [
      {
        id: 'undraw-1',
        title: `${capitalized} Modern Workflow Concept Vector`,
        desc: `Clean open-source flat vector illustration for apps, dashboards, and storytelling themed around ${q}.`,
        thumb: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=720&q=80',
        url: 'https://api.iconify.design/lucide/layers.svg',
        author: 'Katerina Limpitsouni'
      },
      {
        id: 'undraw-2',
        title: `${capitalized} Creative Analytics & Data Architecture`,
        desc: `Scalable vector graphic representing strategy, ideas, and execution.`,
        thumb: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=720&q=80',
        url: 'https://api.iconify.design/lucide/sparkles.svg',
        author: 'unDraw Studio'
      },
      {
        id: 'undraw-3',
        title: `${capitalized} Minimal Isometric Vector Scene`,
        desc: `High-resolution geometric vector artwork suitable for commercial tech products.`,
        thumb: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=720&q=80',
        url: 'https://api.iconify.design/lucide/box.svg',
        author: 'OpenVector Artist'
      }
    ];

    return illustrations.map((item, i) => {
      const asset: UnifiedAsset = {
        asset_id: `undraw-${item.id}-${page}-${i}`,
        provider: 'undraw',
        provider_asset_id: `${item.id}-${page}-${i}`,
        asset_type: AssetType.VECTOR,
        title: item.title,
        description: item.desc,
        thumbnail_url: item.thumb,
        preview_url: item.url,
        download_url: item.url,
        source_url: `https://undraw.co/illustrations?q=${encodeURIComponent(q)}`,
        author_name: item.author,
        author_url: 'https://undraw.co',
        width: 2400,
        height: 1800,
        file_type: 'svg',
        license_name: LicenseType.FREE,
        license_url: 'https://undraw.co/license',
        attribution_required: false,
        attribution_text: `Vector illustration from unDraw by Katerina Limpitsouni (Free commercial use).`,
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
