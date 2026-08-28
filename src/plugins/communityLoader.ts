import { listCommunityPlugins, readPluginFile } from "../lib/tauri";
import type { PluginManifest, ExcalideckPlugin } from "./types";
import { ghostKeysPlugin } from "./official/ghost-keys";

export interface CommunityPluginEntry {
  manifest: PluginManifest;
  module: ExcalideckPlugin;
}

// Map of official downloadable plugins pre-bundled into the app binary
const OFFICIAL_PLUGIN_MODULES: Record<string, ExcalideckPlugin> = {
  "excalideck.ghost-keys": ghostKeysPlugin,
};

/**
 * Discovers and loads community and installed official plugins from the vault's .excalideck/plugins/ directory.
 */
export async function discoverCommunityPlugins(): Promise<CommunityPluginEntry[]> {
  const entries: CommunityPluginEntry[] = [];

  let pluginInfos;
  try {
    pluginInfos = await listCommunityPlugins();
  } catch (err) {
    console.warn("[CommunityLoader] Failed to list community plugins:", err);
    return entries;
  }

  for (const info of pluginInfos) {
    try {
      const manifest = communityInfoToManifest(info);

      // Validate the manifest before attempting to load
      if (!validateManifest(manifest)) {
        console.warn(`[CommunityLoader] Invalid manifest for plugin "${info.id}", skipping`);
        continue;
      }

      let pluginModule: ExcalideckPlugin | null = null;

      // 1. If it's an official plugin with pre-compiled module, use the official implementation
      if (OFFICIAL_PLUGIN_MODULES[info.id]) {
        pluginModule = OFFICIAL_PLUGIN_MODULES[info.id];
      } else {
        // 2. Otherwise, read plugin file from vault disk and evaluate
        const code = await readPluginFile(info.id, manifest.main);
        pluginModule = await evaluatePluginCode(code, info.id);
      }

      if (!pluginModule || typeof pluginModule.activate !== "function") {
        console.warn(`[CommunityLoader] Plugin "${info.id}" has no valid activate() export, skipping`);
        continue;
      }

      entries.push({ manifest, module: pluginModule });
    } catch (err) {
      console.error(`[CommunityLoader] Failed to load plugin "${info.id}":`, err);
    }
  }

  return entries;
}

/**
 * Safely evaluates plugin JavaScript code into an ExcalideckPlugin module.
 */
async function evaluatePluginCode(code: string, pluginId: string): Promise<ExcalideckPlugin | null> {
  // Method 1: Blob URL dynamic import
  try {
    const blob = new Blob([code], { type: "application/javascript" });
    const blobUrl = URL.createObjectURL(blob);
    try {
      const mod = await import(/* @vite-ignore */ blobUrl);
      return mod.default ?? mod;
    } finally {
      URL.revokeObjectURL(blobUrl);
    }
  } catch (err) {
    console.warn(`[CommunityLoader] Blob import failed for "${pluginId}", falling back to function evaluator:`, err);
  }

  // Method 2: Fallback Function evaluator
  try {
    const moduleObj = { exports: {} as any };
    const runner = new Function("exports", "module", "require", code);
    runner(moduleObj.exports, moduleObj, () => ({}));
    return moduleObj.exports.default || moduleObj.exports;
  } catch (err) {
    console.error(`[CommunityLoader] Failed to evaluate code for plugin "${pluginId}":`, err);
    return null;
  }
}

interface CommunityPluginRawInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  dirPath: string;
}

function communityInfoToManifest(info: CommunityPluginRawInfo): PluginManifest {
  return {
    id: info.id,
    name: info.name,
    version: info.version,
    description: info.description,
    author: info.author,
    main: info.main || "index.js",
    builtin: false,
    permissions: [],
  };
}

function validateManifest(manifest: PluginManifest): boolean {
  if (!manifest.id || typeof manifest.id !== "string") return false;
  if (!manifest.name || typeof manifest.name !== "string") return false;
  if (!manifest.version || typeof manifest.version !== "string") return false;
  if (!manifest.main || typeof manifest.main !== "string") return false;
  // Prevent path traversal in the main entry point
  if (manifest.main.includes("..") || manifest.main.startsWith("/") || manifest.main.startsWith("\\")) return false;
  return true;
}
