import React, { createContext, useContext, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { PluginManager } from "./pluginManager";
import type { PluginInfo } from "./types";

// ---- Context ----

const PluginManagerContext = createContext<PluginManager | null>(null);

export const usePluginManager = (): PluginManager => {
  const manager = useContext(PluginManagerContext);
  if (!manager) {
    throw new Error("usePluginManager must be used within a PluginProvider");
  }
  return manager;
};

// ---- Provider Props ----

interface PluginProviderProps {
  children: React.ReactNode;
}

// ---- Provider Component ----

export const PluginProvider: React.FC<PluginProviderProps> = ({ children }) => {
  const managerRef = useRef<PluginManager | null>(null);

  // Lazily create the singleton PluginManager
  if (!managerRef.current) {
    managerRef.current = new PluginManager();
  }

  const manager = managerRef.current;

  // Discover and activate built-in plugins on mount
  useEffect(() => {
    const init = async () => {
      try {
        await manager.discoverBuiltinPlugins();
        await manager.activateAll();
        console.log("[PluginProvider] Built-in plugins initialized");
      } catch (err) {
        console.error("[PluginProvider] Failed to initialize built-in plugins:", err);
      }
    };
    init();

    return () => {
      manager.deactivateAll().catch((err) => {
        console.error("[PluginProvider] Error deactivating plugins on unmount:", err);
      });
    };
  }, [manager]);

  return (
    <PluginManagerContext.Provider value={manager}>
      {children}
    </PluginManagerContext.Provider>
  );
};
