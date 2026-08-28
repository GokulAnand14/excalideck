export type {
  PluginManifest,
  ExcalideckPlugin,
  PluginContext,
  PluginInfo,
  PluginStatus,
  PluginPermission,
  PluginAppAPI,
  PluginCanvasAPI,
  PluginCommandsAPI,
  PluginEventsAPI,
  PluginStorageAPI,
  PluginUIAPI,
  PluginLoggerAPI,
  PluginEventName,
  PluginContributions,
  PluginSettingDefinition,
  CommandContribution,
  SidebarPanelContribution,
  PluginUIRegistration,
} from "./types";

export { PluginEventBus } from "./eventBus";
export { PluginManager } from "./pluginManager";
export { createPluginStorage } from "./pluginStorage";
export { builtinPlugins } from "./registry";
export type { BuiltinPluginEntry } from "./registry";
export { discoverCommunityPlugins } from "./communityLoader";
export type { CommunityPluginEntry } from "./communityLoader";
export { PluginProvider, usePluginManager } from "./PluginProvider";
export { usePluginUI, usePluginList, usePluginCommand } from "./usePlugins";
export { MARKETPLACE_CATALOG } from "./marketplace";
export type { MarketplacePlugin, PluginCategory } from "./marketplace";
export { ghostKeysPlugin } from "./official/ghost-keys";
export { PluginSlot } from "./PluginSlot";

