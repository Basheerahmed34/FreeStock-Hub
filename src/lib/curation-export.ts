import { UnifiedAsset, CurationExportPayload } from '../types/unified-asset.js';
import { generateAttributions } from './attribution.js';

export function buildCurationPayload(
  assets: UnifiedAsset[],
  title = 'My Curated Creative Collection',
  description = 'Curated openly licensed stock media assets from FreeStock Hub.'
): CurationExportPayload {
  const stats = {
    totalAssets: assets.length,
    byType: {} as Record<string, number>,
    byProvider: {} as Record<string, number>,
    byLicense: {} as Record<string, number>
  };

  assets.forEach((a) => {
    stats.byType[a.asset_type] = (stats.byType[a.asset_type] || 0) + 1;
    stats.byProvider[a.provider] = (stats.byProvider[a.provider] || 0) + 1;
    const lic = String(a.license_name || 'UNKNOWN');
    stats.byLicense[lic] = (stats.byLicense[lic] || 0) + 1;
  });

  const markdownAttributions = assets
    .map((a, i) => {
      const attr = generateAttributions(a);
      return `${i + 1}. ${attr.markdown}`;
    })
    .join('\n');

  const htmlAttributions = `<ul>\n${assets
    .map((a) => {
      const attr = generateAttributions(a);
      return `  <li>${attr.html.replace(/<\/?p>/g, '')}</li>`;
    })
    .join('\n')}\n</ul>`;

  const plainAttributions = assets
    .map((a, i) => {
      const attr = generateAttributions(a);
      return `[${i + 1}] ${attr.plain}`;
    })
    .join('\n');

  return {
    version: '1.0',
    title,
    description,
    exportedAt: new Date().toISOString(),
    stats,
    assets,
    attributions: {
      markdown: markdownAttributions,
      html: htmlAttributions,
      plain: plainAttributions
    }
  };
}

export function downloadCurationJson(
  assets: UnifiedAsset[],
  title = 'My Curated Collection'
) {
  const payload = buildCurationPayload(assets, title);
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const link = document.createElement('a');
  const dateSlug = new Date().toISOString().split('T')[0];
  const titleSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'curation';
  
  link.setAttribute('href', dataStr);
  link.setAttribute('download', `freestock-${titleSlug}-${dateSlug}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function createShareableLink(
  assets: UnifiedAsset[],
  title = 'My Curated Collection',
  description = ''
): Promise<{ shareUrl: string; shareId: string; method: 'server' | 'hash' }> {
  try {
    const res = await fetch('/api/collections/share', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        assets
      })
    });

    if (res.ok) {
      const data = await res.json();
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      return {
        shareUrl: `${origin}/?share=${encodeURIComponent(data.shareId)}`,
        shareId: data.shareId,
        method: 'server'
      };
    }
  } catch (err) {
    console.warn('Backend share API failed, generating client-side encoded URL fallback:', err);
  }

  // Resilient Client-Side Hash Fallback
  // Encodes minimal asset payload into URL hash
  const minimalAssets = assets.map(a => ({
    id: a.asset_id,
    p: a.provider,
    pid: a.provider_asset_id,
    t: a.title,
    type: a.asset_type,
    thumb: a.thumbnail_url,
    prev: a.preview_url,
    dl: a.download_url,
    src: a.source_url,
    auth: a.author_name,
    lic: a.license_name,
    w: a.width,
    h: a.height,
    dur: a.duration
  }));

  const payload = {
    t: title,
    d: description,
    a: minimalAssets
  };

  const jsonStr = JSON.stringify(payload);
  const encoded = btoa(encodeURIComponent(jsonStr));
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return {
    shareUrl: `${origin}/#curation=${encoded}`,
    shareId: 'local-encoded',
    method: 'hash'
  };
}

export function parseSharedHash(hash: string): { title: string; description?: string; assets: UnifiedAsset[] } | null {
  try {
    const match = hash.match(/#curation=([^&]+)/);
    if (!match || !match[1]) return null;
    const decoded = decodeURIComponent(atob(match[1]));
    const data = JSON.parse(decoded);
    const rawAssets = data.a || [];

    const assets: UnifiedAsset[] = rawAssets.map((item: any) => ({
      asset_id: item.id,
      provider: item.p,
      provider_asset_id: item.pid,
      title: item.t,
      asset_type: item.type,
      thumbnail_url: item.thumb,
      preview_url: item.prev || item.thumb,
      download_url: item.dl || item.prev || item.thumb,
      source_url: item.src,
      author_name: item.auth,
      license_name: item.lic,
      width: item.w,
      height: item.h,
      duration: item.dur,
      attribution_required: item.lic !== 'CC0' && item.lic !== 'FREE',
      cached_at: new Date()
    }));

    return {
      title: data.t || 'Shared Collection',
      description: data.d,
      assets
    };
  } catch (err) {
    console.error('Failed to parse shared hash curation:', err);
    return null;
  }
}
