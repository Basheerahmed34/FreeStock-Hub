import { UnifiedAsset, AssetType } from '../types/unified-asset.js';

export async function downloadAssetDirectly(asset: UnifiedAsset): Promise<boolean> {
  try {
    // 1. Trigger official tracking & retrieve direct stream proxy URL
    const res = await fetch(`/api/download/${encodeURIComponent(asset.asset_id)}`, {
      method: 'POST'
    });
    
    let proxyUrl = '';
    let directUrl = asset.download_url || asset.preview_url;
    let filename = '';

    if (res.ok) {
      const data = await res.json();
      proxyUrl = data.proxyDownloadUrl;
      directUrl = data.downloadUrl || directUrl;
      filename = data.filename;
    }

    if (!filename) {
      const safeTitle = (asset.title || 'freestock-asset').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
      const ext = asset.file_type || (asset.asset_type === AssetType.VIDEO ? 'mp4' : asset.asset_type === AssetType.AUDIO ? 'mp3' : 'jpg');
      filename = `${safeTitle}-${asset.provider}.${ext}`;
    }

    // 2. Try Client-side Blob Download first (instant local file save with no redirection)
    try {
      const fileRes = await fetch(directUrl, { mode: 'cors' });
      if (fileRes.ok) {
        const blob = await fileRes.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(blobUrl), 3000);
        return true;
      }
    } catch {
      // CORS prevented client-side fetch, seamlessly fall through to server proxy
    }

    // 3. Guaranteed Server Stream Proxy (sets Content-Disposition: attachment so browser downloads directly without navigating away)
    const streamTarget = proxyUrl || `/api/download/file?url=${encodeURIComponent(directUrl)}&filename=${encodeURIComponent(filename)}&assetId=${encodeURIComponent(asset.asset_id)}`;
    
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = streamTarget;
    document.body.appendChild(iframe);
    setTimeout(() => {
      if (document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
    }, 15000);

    return true;
  } catch (err) {
    console.error('Direct download error:', err);
    // Ultimate fallback: invisible anchor
    const a = document.createElement('a');
    a.href = `/api/download/file?url=${encodeURIComponent(asset.download_url || asset.preview_url)}&filename=${encodeURIComponent(asset.title || 'asset')}`;
    a.download = `${asset.title || 'asset'}.${asset.file_type || 'jpg'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return false;
  }
}
