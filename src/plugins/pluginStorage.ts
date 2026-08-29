import { pluginStorageGet, pluginStorageSet, pluginStorageDelete, pluginStorageKeys } from "../lib/tauri";
import type { PluginStorageAPI } from "./types";

export function createPluginStorage(pluginId: string): PluginStorageAPI {
  // In-memory write-through cache for fast reads
  const cache = new Map<string, string | null>();

  return {
    async get(key: string): Promise<string | null> {
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
      return await pluginStorageKeys(pluginId);
    },
  };
}
