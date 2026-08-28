import type { PluginManifest, ExcalideckPlugin } from "./types";

export interface BuiltinPluginEntry {
  manifest: PluginManifest;
  factory: () => ExcalideckPlugin;
}

/**
 * Registry of built-in plugins that ship with the Excalideck app binary.
 * 
 * To add a built-in plugin:
 * 1. Create the plugin in src/plugins/builtin/<plugin-id>/
 * 2. Import it here and add to the map
 * 
 * Example:
 * ```
 * import wordCountPlugin from "./builtin/word-count";
 * builtinPlugins.set("excalideck.word-count", {
 *   manifest: { id: "excalideck.word-count", name: "Word Count", ... },
 *   factory: () => wordCountPlugin,
 * });
 * ```
 */
export const builtinPlugins = new Map<string, BuiltinPluginEntry>();
