import { UnifiedAsset } from '../types/unified-asset.js';

const STORAGE_KEY = 'freestock_saved_assets';
const COLLECTIONS_KEY = 'freestock_collections';

export interface Collection {
  id: string;
  name: string;
  description?: string;
  assetIds: string[];
  createdAt: string;
}

export function getSavedAssets(): UnifiedAsset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveAsset(asset: UnifiedAsset): UnifiedAsset[] {
  const current = getSavedAssets();
  if (!current.some(a => a.asset_id === asset.asset_id)) {
    const updated = [asset, ...current];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  }
  return current;
}

export function removeSavedAsset(assetId: string): UnifiedAsset[] {
  const current = getSavedAssets();
  const updated = current.filter(a => a.asset_id !== assetId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function isAssetSaved(assetId: string): boolean {
  return getSavedAssets().some(a => a.asset_id === assetId);
}

export function importSavedAssets(newAssets: UnifiedAsset[]): UnifiedAsset[] {
  const current = getSavedAssets();
  const existingIds = new Set(current.map(a => a.asset_id));
  const toAdd = newAssets.filter(a => a && a.asset_id && !existingIds.has(a.asset_id));
  const updated = [...toAdd, ...current];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
}

export function clearSavedAssets(): UnifiedAsset[] {
  localStorage.removeItem(STORAGE_KEY);
  return [];
}

export function getCollections(): Collection[] {
  try {
    const raw = localStorage.getItem(COLLECTIONS_KEY);
    if (!raw) {
      const defaultCols: Collection[] = [
        {
          id: 'col-default',
          name: 'Quick Saves',
          description: 'Default collection for bookmarked assets',
          assetIds: [],
          createdAt: new Date().toISOString()
        }
      ];
      localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(defaultCols));
      return defaultCols;
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function createCollection(name: string, description?: string): Collection[] {
  const list = getCollections();
  const newCol: Collection = {
    id: `col-${Date.now()}`,
    name,
    description,
    assetIds: [],
    createdAt: new Date().toISOString()
  };
  const updated = [...list, newCol];
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
  return updated;
}

export function toggleAssetInCollection(collectionId: string, assetId: string): Collection[] {
  const list = getCollections();
  const updated = list.map(c => {
    if (c.id === collectionId) {
      const exists = c.assetIds.includes(assetId);
      return {
        ...c,
        assetIds: exists ? c.assetIds.filter(id => id !== assetId) : [...c.assetIds, assetId]
      };
    }
    return c;
  });
  localStorage.setItem(COLLECTIONS_KEY, JSON.stringify(updated));
  return updated;
}
