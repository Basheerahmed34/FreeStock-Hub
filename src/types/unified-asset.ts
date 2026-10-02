/**
 * Unified Media Asset Schema & Enums for FreeStock Hub
 */

export enum AssetType {
  PHOTO = 'PHOTO',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  SOUND_EFFECT = 'SOUND_EFFECT',
  ILLUSTRATION = 'ILLUSTRATION',
  VECTOR = 'VECTOR',
  ICON = 'ICON',
  PNG = 'PNG',
  GIF = 'GIF'
}

export enum LicenseType {
  FREE = 'FREE',
  CC0 = 'CC0',
  CC_BY = 'CC_BY',
  CC_BY_SA = 'CC_BY_SA',
  PUBLIC_DOMAIN = 'PUBLIC_DOMAIN',
  CUSTOM_SOURCE_LICENSE = 'CUSTOM_SOURCE_LICENSE',
  CHECK_LICENSE = 'CHECK_LICENSE'
}

export interface UnifiedAsset {
  asset_id: string; // e.g., 'pexels-photo-12345'
  provider: string; // e.g., 'pexels', 'unsplash', 'pixabay', 'openverse'
  provider_asset_id: string;
  asset_type: AssetType;
  title: string;
  description?: string;
  thumbnail_url: string;
  preview_url: string;
  download_url: string;
  source_url: string;
  author_name: string;
  author_url?: string;
  width?: number;
  height?: number;
  duration?: number;
  file_type?: string;
  license_name: LicenseType | string;
  license_url?: string;
  attribution_required: boolean;
  attribution_text?: string;
  cached_at: Date | string;
  raw_metadata?: Record<string, unknown>;
}

export interface SearchOptions {
  query: string;
  assetType?: AssetType | 'PHOTOS_VIDEOS';
  page?: number;
  perPage?: number;
  provider?: string;
  license?: LicenseType | 'ALL';
  sortBy?: 'relevance' | 'newest' | 'resolution';
}

export interface BaseProviderAdapter {
  providerName: string;
  search(options: SearchOptions): Promise<UnifiedAsset[]>;
  getAsset(id: string): Promise<UnifiedAsset | null>;
  getDownload(id: string): Promise<{ downloadUrl: string; requiresTracking: boolean }>;
  healthCheck(): Promise<boolean>;
}

export interface ProviderHealth {
  name: string;
  status: 'healthy' | 'degraded' | 'configured' | 'offline';
  supportedTypes: AssetType[];
  latencyMs: number;
  message?: string;
  requiresKey: boolean;
  hasKeyConfigured: boolean;
}

export interface SearchResponse {
  assets: UnifiedAsset[];
  totalResults: number;
  providersQueried: string[];
  providersSettled: Array<{
    provider: string;
    status: 'fulfilled' | 'rejected';
    count: number;
    error?: string;
  }>;
  executionTimeMs: number;
}

export interface CurationExportPayload {
  version: '1.0';
  title: string;
  description?: string;
  exportedAt: string;
  stats: {
    totalAssets: number;
    byType: Record<string, number>;
    byProvider: Record<string, number>;
    byLicense: Record<string, number>;
  };
  assets: UnifiedAsset[];
  attributions: {
    markdown: string;
    html: string;
    plain: string;
  };
}

export interface SharedCollectionResponse {
  shareId: string;
  title: string;
  description?: string;
  createdAt: string;
  assets: UnifiedAsset[];
}
