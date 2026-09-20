import { listCommunityPlugins, readPluginFile } from "../lib/tauri";
import type { PluginManifest, ExcalideckPlugin } from "./types";
import { ghostKeysPlugin } from "./official/ghost-keys";
import { studyCalendarPlugin } from "./official/study-calendar";
import { habitTrackerPlugin } from "./official/habit-tracker";

export interface CommunityPluginEntry {
  manifest: PluginManifest;
  module?: ExcalideckPlugin;
}

// Map of official downloadable plugins pre-bundled into the app binary
export const OFFICIAL_PLUGIN_MODULES: Record<string, ExcalideckPlugin> = {
  "excalideck.ghost-keys": ghostKeysPlugin,
  "excalideck.study-calendar": studyCalendarPlugin,
  "excalideck.habit-tracker": habitTrackerPlugin,
};


/**
 * Discovers community and installed official plugins from the vault's .excalideck/plugins/ directory.
 * NOTE: For safety, third-party JavaScript code is NOT evaluated during discovery.
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

      // Validate the manifest before attempting to register
      if (!validateManifest(manifest)) {
        console.warn(`[CommunityLoader] Invalid manifest for plugin "${info.id}", skipping`);
        continue;
      }

      // 1. If it's an official plugin with pre-compiled module, provide the official module
      if (OFFICIAL_PLUGIN_MODULES[info.id]) {
        entries.push({ manifest, module: OFFICIAL_PLUGIN_MODULES[info.id] });
      } else {
        // 2. Third-party community plugin: register manifest only; defer code evaluation until explicit activation
        entries.push({ manifest });
      }
    } catch (err) {
      console.error(`[CommunityLoader] Failed to parse manifest for "${info.id}":`, err);
    }
  }

  return entries;
}

/**
 * Loads and evaluates code for an untrusted community plugin on demand.
 */
export async function loadCommunityPluginCode(
  pluginId: string,
  mainFile: string
): Promise<ExcalideckPlugin | null> {
  const code = await readPluginFile(pluginId, mainFile);
  return evaluatePluginCode(code, pluginId);
}

/**
 * Evaluates plugin JavaScript code with shadowed IPC internals.
 */
export function evaluatePluginCode(code: string, pluginId: string): ExcalideckPlugin | null {
  try {
    const moduleObj = { exports: {} as any };
    const runner = new Function(
      "exports",
      "module",
      "require",
      "__TAURI_INTERNALS__",
      code
    );
    runner(moduleObj.exports, moduleObj, () => ({}), undefined);
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
