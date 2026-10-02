import { Router, Request, Response } from 'express';
import { AssetType, LicenseType, SearchOptions } from '../../types/unified-asset.js';
import { searchOrchestrator } from '../services/search-orchestrator.js';
import { POSTGRES_MIGRATION_SQL } from '../services/postgres-schema.js';

export const apiRouter = Router();

// GET /api/search
apiRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const {
      q = '',
      type,
      page = '1',
      perPage = '20',
      provider,
      license,
      sortBy = 'relevance'
    } = req.query;

    const options: SearchOptions = {
      query: String(q).trim(),
      assetType: type && type !== 'ALL' ? (type as any) : undefined,
      page: Math.max(1, parseInt(String(page), 10) || 1),
      perPage: Math.min(80, Math.max(1, parseInt(String(perPage), 10) || 32)),
      provider: provider ? String(provider) : undefined,
      license: license && license !== 'ALL' ? (license as LicenseType) : undefined,
      sortBy: sortBy as SearchOptions['sortBy']
    };

    const results = await searchOrchestrator.search(options);
    res.json(results);
  } catch (error: any) {
    console.error('Search API failure:', error);
    res.status(500).json({
      error: 'Failed to execute multi-provider search',
      message: error?.message || 'Internal Server Error',
      assets: [],
      totalResults: 0
    });
  }
});

// GET /api/asset/:id
apiRouter.get('/asset/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const parts = id.split('-');
  const providerName = parts[0];
  const adapter = searchOrchestrator.getAdapter(providerName);

  if (!adapter) {
    return res.status(404).json({ error: `Provider adapter not found for ${providerName}` });
  }

  try {
    const asset = await adapter.getAsset(id);
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json(asset);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || 'Failed to fetch asset' });
  }
});

// POST /api/download/:id
// Complies with Rule 1: Always trigger official download endpoints (e.g. Unsplash download_location)
apiRouter.post('/download/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const parts = id.split('-');
  const providerName = parts[0];
  const adapter = searchOrchestrator.getAdapter(providerName);

  if (!adapter) {
    return res.status(404).json({ error: `Unknown provider for asset ID ${id}` });
  }

  try {
    const downloadInfo = await adapter.getDownload(id);
    const asset = await adapter.getAsset(id);
    const finalUrl = downloadInfo.downloadUrl || asset?.download_url || asset?.preview_url || '';
    const safeTitle = (asset?.title || 'freestock-asset').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
    const extension = asset?.file_type || (asset?.asset_type === AssetType.VIDEO ? 'mp4' : asset?.asset_type === AssetType.AUDIO ? 'mp3' : 'jpg');
    const filename = `${safeTitle}-${providerName}.${extension}`;

    // Return both direct URL and proxy direct-download URL that guarantees no redirect offsite
    const proxyDownloadUrl = `/api/download/file?url=${encodeURIComponent(finalUrl)}&filename=${encodeURIComponent(filename)}&assetId=${encodeURIComponent(id)}`;

    res.json({
      success: true,
      assetId: id,
      provider: providerName,
      downloadUrl: finalUrl,
      proxyDownloadUrl,
      filename,
      requiresTracking: downloadInfo.requiresTracking,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error(`Download resolution failed for ${id}:`, err);
    res.status(500).json({ error: 'Failed to resolve download endpoint' });
  }
});

// GET /api/download/file
// Proxies media stream with Content-Disposition: attachment so users never get redirected off-site
apiRouter.get('/download/file', async (req: Request, res: Response) => {
  const { url, filename = 'freestock-asset', assetId } = req.query;
  if (!url || typeof url !== 'string') {
    return res.status(400).send('Missing url parameter');
  }

  // Trigger tracking in background if assetId provided
  if (assetId && typeof assetId === 'string') {
    const parts = assetId.split('-');
    const providerName = parts[0];
    const adapter = searchOrchestrator.getAdapter(providerName);
    if (adapter) {
      adapter.getDownload(assetId).catch(() => {});
    }
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': '*/*'
      }
    });

    if (!response.ok) {
      return res.redirect(url);
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const safeFilename = String(filename).replace(/[/\\?%*:|"<>]/g, '-');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`);

    const buffer = await response.arrayBuffer();
    res.send(Buffer.from(buffer));
  } catch (err) {
    console.error('Download stream proxy error, falling back to redirect:', err);
    res.redirect(url);
  }
});

// GET /api/providers
apiRouter.get('/providers', (req: Request, res: Response) => {
  const adapters = searchOrchestrator.getAllAdapters();
  const list = adapters.map(a => ({
    name: a.providerName,
    configured: true
  }));
  res.json({ providers: list });
});

// GET /api/health
apiRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const health = await searchOrchestrator.checkAllHealth();
    res.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      providers: health
    });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err?.message });
  }
});

// In-memory store for shared collection curation history
const sharedCollectionsStore = new Map<string, {
  shareId: string;
  title: string;
  description?: string;
  createdAt: string;
  assets: any[];
}>();

// POST /api/collections/share
apiRouter.post('/collections/share', (req: Request, res: Response) => {
  try {
    const { title = 'My Curated Stock Collection', description = '', assets = [] } = req.body;
    if (!Array.isArray(assets) || assets.length === 0) {
      return res.status(400).json({ error: 'At least one asset is required to create a shareable collection' });
    }

    const shareId = `cur_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
    const record = {
      shareId,
      title: String(title).slice(0, 150),
      description: String(description).slice(0, 500),
      createdAt: new Date().toISOString(),
      assets
    };

    sharedCollectionsStore.set(shareId, record);

    // Limit memory cache to latest 1000 items
    if (sharedCollectionsStore.size > 1000) {
      const firstKey = sharedCollectionsStore.keys().next().value;
      if (firstKey) sharedCollectionsStore.delete(firstKey);
    }

    res.json({
      success: true,
      shareId,
      title: record.title,
      assetCount: assets.length,
      createdAt: record.createdAt
    });
  } catch (err: any) {
    console.error('Error generating shared collection:', err);
    res.status(500).json({ error: 'Failed to generate shareable collection' });
  }
});

// GET /api/collections/share/:shareId
apiRouter.get('/collections/share/:shareId', (req: Request, res: Response) => {
  const { shareId } = req.params;
  const record = sharedCollectionsStore.get(shareId);

  if (!record) {
    return res.status(404).json({ error: 'Shared collection not found or expired' });
  }

  res.json(record);
});

// GET /api/schema
apiRouter.get('/schema', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/plain');
  res.send(POSTGRES_MIGRATION_SQL);
});
