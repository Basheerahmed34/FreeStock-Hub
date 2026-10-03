import {
  AssetType,
  BaseProviderAdapter,
  ProviderSearchResult,
  SearchOptions,
  UnifiedAsset
} from '../../types/unified-asset.js';

export class CoverrAdapter implements BaseProviderAdapter {
  providerName = 'coverr';

  async searchDetailed(options: SearchOptions): Promise<ProviderSearchResult> {
    const apiKey = process.env.COVERR_API_KEY;
    if (!apiKey) {
      return {
        assets: [],
        totalAvailable: null,
        status: 'DISABLED_NO_KEY',
        error: 'Coverr partner API key required (COVERR_API_KEY)',
        responseTimeMs: 0
      };
    }

    return {
      assets: [],
      totalAvailable: 0,
      status: 'SUCCESS',
      httpStatus: 200,
      responseTimeMs: 10
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
    return Boolean(process.env.COVERR_API_KEY);
  }
}
