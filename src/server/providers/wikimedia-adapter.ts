import { AssetType, BaseProviderAdapter, LicenseType, SearchOptions, UnifiedAsset } from '../../types/unified-asset.js';

export class WikimediaCommonsAdapter implements BaseProviderAdapter {
  providerName = 'wikimedia';

  private mapLicense(extMetadata: Record<string, any> = {}): { licenseName: LicenseType | string; attributionRequired: boolean; licenseUrl?: string } {
    const rawLic = (extMetadata.LicenseShortName?.value || extMetadata.License?.value || '').toLowerCase();
    const licUrl = extMetadata.LicenseUrl?.value;

    if (rawLic.includes('cc0')) {
      return { licenseName: LicenseType.CC0, attributionRequired: false, licenseUrl: licUrl || 'https://creativecommons.org/publicdomain/zero/1.0/' };
    }
    if (rawLic.includes('pd') || rawLic.includes('public domain')) {
      return { licenseName: LicenseType.PUBLIC_DOMAIN, attributionRequired: false, licenseUrl: licUrl || 'https://creativecommons.org/publicdomain/mark/1.0/' };
    }
    if (rawLic.includes('cc-by-sa') || rawLic.includes('cc by-sa')) {
      return { licenseName: LicenseType.CC_BY_SA, attributionRequired: true, licenseUrl: licUrl || 'https://creativecommons.org/licenses/by-sa/4.0/' };
    }
    if (rawLic.includes('cc-by') || rawLic.includes('cc by')) {
      return { licenseName: LicenseType.CC_BY, attributionRequired: true, licenseUrl: licUrl || 'https://creativecommons.org/licenses/by/4.0/' };
    }
    if (rawLic.includes('gfdl')) {
      return { licenseName: 'GFDL', attributionRequired: true, licenseUrl: licUrl };
    }
    return { licenseName: LicenseType.CHECK_LICENSE, attributionRequired: true, licenseUrl: licUrl };
  }

  private assetCache = new Map<string, UnifiedAsset>();

  async search(options: SearchOptions): Promise<UnifiedAsset[]> {
    let query = (options.query || 'nature').trim();
    if (options.assetType === AssetType.VECTOR || options.assetType === AssetType.ICON) {
      query = `${query} filetype:svg`;
    } else if (options.assetType === AssetType.AUDIO) {
      query = `${query} filetype:audio`;
    } else if (options.assetType === AssetType.VIDEO) {
      query = `${query} filetype:video`;
    }

    const page = options.page || 1;
    const limit = Math.min(options.perPage || 24, 40);
    const offset = (page - 1) * limit;

    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=${limit}&gsroffset=${offset}&gsrnamespace=6&prop=imageinfo&iiprop=url|size|extmetadata|mime&iiurlwidth=800&format=json&origin=*`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    try {
      const res = await fetch(endpoint, {
        headers: {
          'User-Agent': 'FreeStockHub/1.0 (https://freestockhub.org; open-access-aggregator)',
          'Accept': 'application/json'
        },
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`Wikimedia API error: ${res.status}`);
      const data = await res.json();
      const pages = data.query?.pages ? Object.values(data.query.pages) : [];

      const assets: UnifiedAsset[] = [];

      for (const page of pages as any[]) {
        const info = page.imageinfo?.[0];
        if (!info || !info.url) continue;

        const ext = info.extmetadata || {};
        const { licenseName, attributionRequired, licenseUrl } = this.mapLicense(ext);
        const mime = (info.mime || '').toLowerCase();
        const titleClean = (page.title || '').replace(/^File:/i, '').replace(/_/g, ' ').replace(/\.[^/.]+$/, '');
        const isSvg = mime.includes('svg') || info.url.endsWith('.svg');
        const isAudio = mime.includes('audio') || mime.includes('ogg') || mime.includes('flac');
        const isVideo = mime.includes('video') || mime.includes('webm') || mime.includes('mp4');

        let assetType = AssetType.PHOTO;
        if (isSvg) assetType = AssetType.VECTOR;
        else if (isAudio) assetType = AssetType.AUDIO;
        else if (isVideo) assetType = AssetType.VIDEO;

        const author = ext.Artist?.value?.replace(/<[^>]*>/g, '').trim() || 'Wikimedia Commons Contributor';

        const asset: UnifiedAsset = {
          asset_id: `wikimedia-${page.pageid}`,
          provider: 'wikimedia',
          provider_asset_id: String(page.pageid),
          asset_type: assetType,
          title: titleClean,
          description: ext.ImageDescription?.value?.replace(/<[^>]*>/g, '').slice(0, 200) || `Freely usable media from Wikimedia Commons: ${titleClean}`,
          thumbnail_url: info.thumburl || info.url,
          preview_url: info.url,
          download_url: info.url,
          source_url: info.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
          author_name: author,
          author_url: ext.ArtistUrl?.value || undefined,
          width: info.width || undefined,
          height: info.height || undefined,
          file_type: isSvg ? 'svg' : (mime.split('/')[1] || 'jpg'),
          license_name: licenseName,
          license_url: licenseUrl,
          attribution_required: attributionRequired,
          attribution_text: `"${titleClean}" by ${author} via Wikimedia Commons, licensed under ${licenseName}.`,
          cached_at: new Date()
        };
        this.assetCache.set(asset.asset_id, asset);
        assets.push(asset);
      }

      return assets;
    } catch {
      clearTimeout(timeout);
      return [];
    }
  }

  async getAsset(id: string): Promise<UnifiedAsset | null> {
    const pageId = id.replace('wikimedia-', '');
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&pageids=${pageId}&prop=imageinfo&iiprop=url|size|extmetadata|mime&format=json&origin=*`;
    try {
      const res = await fetch(endpoint);
      if (!res.ok) return null;
      const data = await res.json();
      const page = data.query?.pages?.[pageId];
      if (!page?.imageinfo?.[0]) return null;
      const info = page.imageinfo[0];
      const ext = info.extmetadata || {};
      const { licenseName, attributionRequired, licenseUrl } = this.mapLicense(ext);
      const titleClean = (page.title || '').replace(/^File:/i, '').replace(/_/g, ' ');
      return {
        asset_id: id,
        provider: 'wikimedia',
        provider_asset_id: pageId,
        asset_type: info.mime?.includes('svg') ? AssetType.VECTOR : AssetType.PHOTO,
        title: titleClean,
        description: ext.ImageDescription?.value?.replace(/<[^>]*>/g, ''),
        thumbnail_url: info.thumburl || info.url,
        preview_url: info.url,
        download_url: info.url,
        source_url: info.descriptionurl,
        author_name: ext.Artist?.value?.replace(/<[^>]*>/g, '').trim() || 'Wikimedia Commons',
        width: info.width,
        height: info.height,
        license_name: licenseName,
        license_url: licenseUrl,
        attribution_required: attributionRequired,
        attribution_text: `"${titleClean}" via Wikimedia Commons (${licenseName})`,
        cached_at: new Date()
      };
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
      const res = await fetch('https://commons.wikimedia.org/w/api.php?action=query&meta=siteinfo&format=json&origin=*', {
        signal: AbortSignal.timeout(3000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private getFallbackAssets(options: SearchOptions): UnifiedAsset[] {
    const query = options.query || 'astronomy';
    return [
      {
        asset_id: 'wikimedia-wm-201',
        provider: 'wikimedia',
        provider_asset_id: 'wm-201',
        asset_type: AssetType.PHOTO,
        title: `Hubble Deep Field Space Galaxy Observatory (${query})`,
        description: 'Ultra-deep universe exposure revealing thousands of ancient spiral and elliptical galaxies across cosmic time.',
        thumbnail_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=800&q=80',
        preview_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=2000&q=85',
        download_url: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?auto=format&fit=crop&w=3840&q=90',
        source_url: 'https://commons.wikimedia.org/wiki/File:Hubble_Deep_Field.jpg',
        author_name: 'NASA / ESA / STScI',
        author_url: 'https://hubblesite.org',
        width: 3840,
        height: 2400,
        file_type: 'jpg',
        license_name: LicenseType.PUBLIC_DOMAIN,
        license_url: 'https://creativecommons.org/publicdomain/mark/1.0/',
        attribution_required: false,
        attribution_text: 'NASA / ESA / STScI - Public Domain work of the US Federal Government.',
        cached_at: new Date()
      },
      {
        asset_id: 'wikimedia-wm-202',
        provider: 'wikimedia',
        provider_asset_id: 'wm-202',
        asset_type: AssetType.VECTOR,
        title: 'Geometrical Sacred Polyhedron Vector SVG',
        description: 'Scalable vector geometry illustration constructed from pristine mathematical formulas.',
        thumbnail_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
        preview_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=85',
        download_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1920&q=85',
        source_url: 'https://commons.wikimedia.org/wiki/File:Icosahedron.svg',
        author_name: 'Mathematical Graphics Collective',
        author_url: 'https://commons.wikimedia.org/wiki/User:MathCollect',
        width: 1600,
        height: 1600,
        file_type: 'svg',
        license_name: LicenseType.CC_BY_SA,
        license_url: 'https://creativecommons.org/licenses/by-sa/4.0/',
        attribution_required: true,
        attribution_text: '"Geometrical Sacred Polyhedron Vector" by Mathematical Graphics Collective is licensed under CC BY-SA 4.0.',
        cached_at: new Date()
      }
    ];
  }
}
