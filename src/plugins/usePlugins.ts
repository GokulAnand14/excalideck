import { useCallback, useSyncExternalStore } from "react";
import { usePluginManager } from "./PluginProvider";
import type { PluginInfo } from "./types";

/**
 * Subscribe to plugin UI contributions (sidebar panels, status bar items, commands).
 * Re-renders the component whenever any plugin registers or unregisters a UI contribution.
 */
export const usePluginUI = () => {
  const manager = usePluginManager();

  const subscribe = useCallback(
    (onStoreChange: () => void) => manager.onUIChange(onStoreChange),
    [manager]
  );

  const getSidebarPanels = useCallback(
    () => manager.getSidebarPanels(),
    [manager]
  );

  const getStatusBarItems = useCallback(
    () => manager.getStatusBarItems(),
    [manager]
  );

  const getCommands = useCallback(
    () => manager.getCommands(),
    [manager]
  );

  // useSyncExternalStore ensures React re-renders when the external store changes
  const sidebarPanels = useSyncExternalStore(subscribe, getSidebarPanels);
  const statusBarItems = useSyncExternalStore(subscribe, getStatusBarItems);
  const commands = useSyncExternalStore(subscribe, getCommands);

  return { sidebarPanels, statusBarItems, commands };
};

/**
 * Get the list of all discovered plugins and their statuses.
 */
export const usePluginList = (): PluginInfo[] => {
  const manager = usePluginManager();

  const subscribe = useCallback(
    (onStoreChange: () => void) => manager.onUIChange(onStoreChange),
    [manager]
  );

  const getPlugins = useCallback(
    () => manager.getPlugins(),
    [manager]
  );

  return useSyncExternalStore(subscribe, getPlugins);
};

/**
 * Execute a registered plugin command by its full ID.
 */
export const usePluginCommand = () => {
  const manager = usePluginManager();

  return useCallback(
    (commandId: string) => manager.executeCommand(commandId),
    [manager]
  );
};
