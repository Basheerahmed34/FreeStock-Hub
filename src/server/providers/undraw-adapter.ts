import {
  AssetType,
  BaseProviderAdapter,
  ProviderSearchResult,
  SearchOptions,
  UnifiedAsset
} from '../../types/unified-asset.js';

export class UndrawAdapter implements BaseProviderAdapter {
  providerName = 'undraw';

  async searchDetailed(options: SearchOptions): Promise<ProviderSearchResult> {
    return {
      assets: [],
      totalAvailable: null,
      status: 'DISABLED_NO_KEY',
      error: 'unDraw does not provide an official public search API. Vector icons are served via Iconify & Wikimedia.',
      responseTimeMs: 0
    };
  }

  async search(options: SearchOptions): Promise<UnifiedAsset[]> {
    const detailed = await this.searchDetailed(options);
    return detailed.assets;
  }

  async getAsset(id: string): Promise<UnifiedAsset | null> {
    return null;
  }

  async getDownload(id: string): Promise<{ downloadUrl: string; requiresTracking: boolean }> {
    return {
      downloadUrl: '',
      requiresTracking: false
    };
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
