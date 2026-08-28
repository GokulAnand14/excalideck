import { pluginStorageGet, pluginStorageSet, pluginStorageDelete, pluginStorageKeys } from "../lib/tauri";
import type { PluginStorageAPI } from "./types";

export function createPluginStorage(pluginId: string): PluginStorageAPI {
  // In-memory write-through cache for fast reads
  const cache = new Map<string, string | null>();
  let cacheInitialized = false;

  const ensureCache = async (): Promise<void> => {
    if (cacheInitialized) return;
    try {
      const allKeys = await pluginStorageKeys(pluginId);
      for (const key of allKeys) {
        const val = await pluginStorageGet(pluginId, key);
        cache.set(key, val);
      }
    } catch {
      // Storage may not exist yet, that's fine
    }
    cacheInitialized = true;
  };

  return {
    async get(key: string): Promise<string | null> {
      await ensureCache();
      if (cache.has(key)) return cache.get(key) ?? null;
      const value = await pluginStorageGet(pluginId, key);
      cache.set(key, value);
      return value;
    },

    async set(key: string, value: string): Promise<void> {
      cache.set(key, value);
      await pluginStorageSet(pluginId, key, value);
    },

    async delete(key: string): Promise<void> {
      cache.delete(key);
      await pluginStorageDelete(pluginId, key);
    },

    async keys(): Promise<string[]> {
      await ensureCache();
      return Array.from(cache.keys()).filter(k => cache.get(k) !== null);
    },
  };
}
