import {
  AssetType,
  BaseProviderAdapter,
  LicenseType,
  ProviderSearchResult,
  SearchOptions,
  UnifiedAsset
} from '../../types/unified-asset.js';

export class WikimediaCommonsAdapter implements BaseProviderAdapter {
  providerName = 'wikimedia';
  private assetCache = new Map<string, UnifiedAsset>();

  async searchDetailed(options: SearchOptions): Promise<ProviderSearchResult> {
    const t0 = Date.now();
    const query = options.query || 'nature';
    const limit = Math.min(options.perPage || 24, 35);
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|extmetadata|mime&format=json&origin=*`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 6000);

    try {
      const response = await fetch(endpoint, {
        headers: {
          'User-Agent': 'FreeStockHub/1.0 (https://freestockhub.org; media-aggregator)'
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
          error: `Wikimedia HTTP ${response.status}`,
          responseTimeMs: elapsed
        };
      }

      const data = await response.json();
      const pages = data.query?.pages ? Object.values(data.query.pages) : [];
      const totalHits = typeof data.query?.searchinfo?.totalhits === 'number'
        ? data.query.searchinfo.totalhits
        : null;

      const assets: UnifiedAsset[] = [];

      for (const page of pages as any[]) {
        if (!page.imageinfo || page.imageinfo.length === 0) continue;
        const info = page.imageinfo[0];
        const ext = info.extmetadata || {};

        let licenseName: LicenseType | string = LicenseType.CHECK_LICENSE;
        let licenseUrl: string | undefined = ext.LicenseUrl?.value;
        let attributionRequired = true;

        const licCode = (ext.LicenseShortName?.value || ext.License?.value || '').toUpperCase();
        if (licCode.includes('CC0') || licCode.includes('PD') || licCode.includes('PUBLIC DOMAIN')) {
          licenseName = LicenseType.CC0;
          attributionRequired = false;
        } else if (licCode.includes('CC-BY-SA') || licCode.includes('CC BY-SA')) {
          licenseName = LicenseType.CC_BY_SA;
          attributionRequired = true;
        } else if (licCode.includes('CC-BY') || licCode.includes('CC BY')) {
          licenseName = LicenseType.CC_BY;
          attributionRequired = true;
        }

        const mime = info.mime || '';
        const isSvg = mime.includes('svg') || page.title.endsWith('.svg');
        const isAudio = mime.includes('audio') || mime.includes('ogg') || page.title.endsWith('.ogg') || page.title.endsWith('.mp3');
        const isVideo = mime.includes('video') || mime.includes('webm') || page.title.endsWith('.webm');

        let assetType = AssetType.PHOTO;
        if (isSvg) assetType = AssetType.VECTOR;
        else if (isAudio) assetType = AssetType.AUDIO;
        else if (isVideo) assetType = AssetType.VIDEO;

        const author = ext.Artist?.value?.replace(/<[^>]*>/g, '').trim() || 'Wikimedia Commons Contributor';
        const titleClean = page.title.replace(/^File:/, '').replace(/\.[^/.]+$/, '').replace(/_/g, ' ');

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

      return {
        assets,
        totalAvailable: totalHits,
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
        error: err?.message || 'Wikimedia query timed out or failed',
        responseTimeMs: Date.now() - t0
      };
    }
  }

  async search(options: SearchOptions): Promise<UnifiedAsset[]> {
    const detailed = await this.searchDetailed(options);
    return detailed.assets;
  }

  async getAsset(id: string): Promise<UnifiedAsset | null> {
    const pageId = id.replace('wikimedia-', '');
    const endpoint = `https://commons.wikimedia.org/w/api.php?action=query&pageids=${pageId}&prop=imageinfo&iiprop=url|size|extmetadata|mime&format=json&origin=*`;
    try {
      const res = await fetch(endpoint, {
        headers: { 'User-Agent': 'FreeStockHub/1.0' }
      });
      if (!res.ok) return null;
      const data = await res.json();
      const page = data.query?.pages?.[pageId];
      if (!page || !page.imageinfo) return null;
      const info = page.imageinfo[0];
      const titleClean = page.title.replace(/^File:/, '').replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
      return {
        asset_id: id,
        provider: 'wikimedia',
        provider_asset_id: pageId,
        asset_type: AssetType.PHOTO,
        title: titleClean,
        thumbnail_url: info.thumburl || info.url,
        preview_url: info.url,
        download_url: info.url,
        source_url: info.descriptionurl,
        author_name: 'Wikimedia Contributor',
        file_type: 'jpg',
        license_name: LicenseType.CC_BY_SA,
        attribution_required: true,
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
        headers: { 'User-Agent': 'FreeStockHub/1.0' },
        signal: AbortSignal.timeout(3000)
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}
