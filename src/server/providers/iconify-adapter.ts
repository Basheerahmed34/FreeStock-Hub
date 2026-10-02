import { AssetType, BaseProviderAdapter, LicenseType, SearchOptions, UnifiedAsset } from '../../types/unified-asset.js';

export class IconifyAdapter implements BaseProviderAdapter {
  providerName = 'iconify';

  async search(options: SearchOptions): Promise<UnifiedAsset[]> {
    const query = options.query || 'arrow';
    const limit = Math.min(options.perPage || 24, 48);
    const endpoint = `https://api.iconify.design/search?query=${encodeURIComponent(query)}&limit=${limit}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    try {
      const res = await fetch(endpoint, {
        headers: {
          'User-Agent': 'FreeStockHub/1.0',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Iconify API error: ${res.status}`);
      const data = await res.json();
      const icons: string[] = data.icons || [];
      const collections = data.collections || {};

      const assets: UnifiedAsset[] = icons.map((iconKey: string) => {
        const [prefix, name] = iconKey.split(':');
        const coll = collections[prefix] || {};
        const author = coll.author?.name || coll.name || prefix.toUpperCase();
        const license = coll.license?.title || coll.license?.spdx || 'MIT';
        const svgUrl = `https://api.iconify.design/${prefix}/${name}.svg`;

        let licenseType: LicenseType | string = LicenseType.FREE;
        let attributionRequired = false;

        const lUpper = license.toUpperCase();
        if (lUpper.includes('MIT') || lUpper.includes('APACHE') || lUpper.includes('CC0')) {
          licenseType = lUpper.includes('CC0') ? LicenseType.CC0 : 'MIT / Open Source';
          attributionRequired = false;
        } else if (lUpper.includes('CC-BY') || lUpper.includes('CC BY')) {
          licenseType = LicenseType.CC_BY;
          attributionRequired = true;
        }

        return {
          asset_id: `iconify-${prefix}-${name}`,
          provider: 'iconify',
          provider_asset_id: `${prefix}:${name}`,
          asset_type: AssetType.ICON,
          title: `${name.replace(/-/g, ' ')} (${prefix})`,
          description: `Open-source vector icon "${name}" from ${coll.name || prefix} collection.`,
          thumbnail_url: svgUrl,
          preview_url: svgUrl,
          download_url: svgUrl,
          source_url: `https://icon-sets.iconify.design/${prefix}/${name}/`,
          author_name: author,
          author_url: coll.author?.url || undefined,
          width: 512,
          height: 512,
          file_type: 'svg',
          license_name: licenseType,
          license_url: coll.license?.url || 'https://opensource.org/licenses/MIT',
          attribution_required: attributionRequired,
          attribution_text: `"${name}" icon by ${author} (${license}).`,
          cached_at: new Date()
        };
      });

      return assets.length > 0 ? assets : this.getFallbackAssets(options);
    } catch {
      clearTimeout(timeout);
      return this.getFallbackAssets(options);
    }
  }

  async getAsset(id: string): Promise<UnifiedAsset | null> {
    const rawKey = id.replace('iconify-', '');
    const [prefix, name] = rawKey.split('-');
    if (!prefix || !name) return null;
    const svgUrl = `https://api.iconify.design/${prefix}/${name}.svg`;
    return {
      asset_id: id,
      provider: 'iconify',
      provider_asset_id: `${prefix}:${name}`,
      asset_type: AssetType.ICON,
      title: `${name} icon`,
      description: `Vector icon from ${prefix} set`,
      thumbnail_url: svgUrl,
      preview_url: svgUrl,
      download_url: svgUrl,
      source_url: `https://icon-sets.iconify.design/${prefix}/${name}/`,
      author_name: prefix.toUpperCase(),
      width: 512,
      height: 512,
      file_type: 'svg',
      license_name: 'MIT / Open Source',
      license_url: 'https://opensource.org/licenses/MIT',
      attribution_required: false,
      cached_at: new Date()
    };
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
      const res = await fetch('https://api.iconify.design/lucide/search.svg', {
        signal: AbortSignal.timeout(3000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private getFallbackAssets(options: SearchOptions): UnifiedAsset[] {
    const q = options.query || 'icon';
    const fallbackIcons = ['sparkles', 'compass', 'code', 'camera', 'music', 'layers'];
    return fallbackIcons.map((name, i) => ({
      asset_id: `iconify-lucide-${name}`,
      provider: 'iconify',
      provider_asset_id: `lucide:${name}`,
      asset_type: AssetType.ICON,
      title: `${name} vector icon (${q})`,
      description: `Lucide open-source clean SVG outline icon for ${name}.`,
      thumbnail_url: `https://api.iconify.design/lucide/${name}.svg?color=%2338bdf8`,
      preview_url: `https://api.iconify.design/lucide/${name}.svg?color=%2338bdf8`,
      download_url: `https://api.iconify.design/lucide/${name}.svg`,
      source_url: `https://icon-sets.iconify.design/lucide/${name}/`,
      author_name: 'Lucide Icons Community',
      author_url: 'https://lucide.dev',
      width: 512,
      height: 512,
      file_type: 'svg',
      license_name: 'ISC / Open Source',
      license_url: 'https://opensource.org/licenses/ISC',
      attribution_required: false,
      attribution_text: `"${name}" icon by Lucide Icons project.`,
      cached_at: new Date()
    }));
  }
}
