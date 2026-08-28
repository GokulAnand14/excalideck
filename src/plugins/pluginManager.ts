import type React from "react";
import type {
  PluginManifest, ExcalideckPlugin, PluginContext, PluginInfo,
  PluginStatus, PluginAppAPI, PluginCanvasAPI, PluginCommandsAPI,
  PluginEventsAPI, PluginStorageAPI, PluginUIAPI, PluginLoggerAPI,
  PluginEventName, CommandContribution,
} from "./types";
import { PluginEventBus } from "./eventBus";
import { createPluginStorage } from "./pluginStorage";
import { builtinPlugins } from "./registry";
import { discoverCommunityPlugins } from "./communityLoader";
import { ghostKeysPlugin } from "./official/ghost-keys";

interface RegisteredSidebarPanel {
  pluginId: string;
  id: string;
  title: string;
  icon?: string;
  render: () => React.ReactNode;
}

interface RegisteredStatusBarItem {
  pluginId: string;
  id: string;
  render: () => React.ReactNode;
}

interface RegisteredCommand {
  pluginId: string;
  id: string;
  title: string;
  handler: () => void | Promise<void>;
}

interface PluginInstance {
  plugin: ExcalideckPlugin;
  disposables: (() => void)[];
}

export class PluginManager {
  private plugins = new Map<string, PluginInfo>();
  private instances = new Map<string, PluginInstance>();
  private eventBus = new PluginEventBus();
  
  // UI contribution registries
  private sidebarPanels: RegisteredSidebarPanel[] = [];
  private statusBarItems: RegisteredStatusBarItem[] = [];
  private commands: RegisteredCommand[] = [];
  private cachedPluginsList: PluginInfo[] = [];
  
  // App state references (set by React layer)
  private appStateGetters = {
    getTheme: (): "light" | "dark" => "light",
    getVaultPath: (): string | null => null,
    getCurrentFile: (): string | null => null,
    getAppVersion: (): string => "0.1.0",
  };
  
  private canvasGetters = {
    getElements: (): readonly any[] => [],
    getAppState: (): Record<string, any> => ({}),
    getFiles: (): Record<string, any> => ({}),
    updateScene: (_sceneData: any): void => {},
    scrollToContent: (_elements?: any[], _options?: any): void => {},
    getExcalidrawAPI: (): any => null,
  };

  // Listeners that want to know when UI contributions change
  private uiChangeListeners = new Set<() => void>();

  // ---- Public API for React layer ----

  setAppStateGetters(getters: typeof this.appStateGetters): void {
    this.appStateGetters = getters;
  }

  setCanvasGetters(getters: typeof this.canvasGetters): void {
    this.canvasGetters = getters;
  }

  getEventBus(): PluginEventBus {
    return this.eventBus;
  }

  getPlugins(): PluginInfo[] {
    return this.cachedPluginsList;
  }

  getPlugin(id: string): PluginInfo | undefined {
    return this.plugins.get(id);
  }

  getSidebarPanels(): RegisteredSidebarPanel[] {
    return this.sidebarPanels;
  }

  getStatusBarItems(): RegisteredStatusBarItem[] {
    return this.statusBarItems;
  }

  getCommands(): RegisteredCommand[] {
    return this.commands;
  }

  onUIChange(listener: () => void): () => void {
    this.uiChangeListeners.add(listener);
    return () => this.uiChangeListeners.delete(listener);
  }

  private notifyUIChange(): void {
    this.cachedPluginsList = Array.from(this.plugins.values());
    for (const listener of this.uiChangeListeners) {
      try { listener(); } catch { /* ignore */ }
    }
  }

  // ---- Discovery ----

  async discoverBuiltinPlugins(): Promise<void> {
    for (const [id, entry] of builtinPlugins) {
      this.plugins.set(id, {
        manifest: entry.manifest,
        status: "installed",
        source: "builtin",
      });
    }
    this.notifyUIChange();
  }

  async discoverCommunityPlugins(): Promise<void> {
    try {
      const entries = await discoverCommunityPlugins();
      for (const entry of entries) {
        // Don't overwrite built-in plugins with community ones of the same ID
        if (this.plugins.has(entry.manifest.id) && this.plugins.get(entry.manifest.id)!.source === "builtin") {
          console.warn(`[PluginManager] Community plugin "${entry.manifest.id}" conflicts with built-in, skipping`);
          continue;
        }

        const existingInfo = this.plugins.get(entry.manifest.id);
        const existingInstance = this.instances.get(entry.manifest.id);

        this.plugins.set(entry.manifest.id, {
          manifest: entry.manifest,
          status: existingInfo?.status === "active" ? "active" : "installed",
          source: "community",
        });

        if (!existingInstance) {
          this.instances.set(entry.manifest.id, {
            plugin: entry.module,
            disposables: [],
          });
        } else {
          existingInstance.plugin = entry.module;
        }
      }
      this.notifyUIChange();
    } catch (err) {
      console.error("[PluginManager] Failed to discover community plugins:", err);
    }
  }

  // ---- Lifecycle ----

  async activatePlugin(
    id: string,
    customManifest?: PluginManifest,
    customModule?: ExcalideckPlugin
  ): Promise<void> {
    let info = this.plugins.get(id);

    if (!info) {
      if (customManifest) {
        info = {
          manifest: customManifest,
          status: "installed",
          source: customManifest.builtin ? "builtin" : "community",
        };
        this.plugins.set(id, info);
      } else if (id === "excalideck.ghost-keys") {
        info = {
          manifest: {
            id: "excalideck.ghost-keys",
            name: "GhostKeys",
            version: "1.0.0",
            description: "Hands-free keyboard navigation engine.",
            author: "Gokul (Official)",
            main: "index.js",
            builtin: false,
            permissions: [
              "canvas:read",
              "canvas:write",
              "ui:statusbar",
              "ui:sidebar",
              "commands:register",
            ],
          },
          status: "installed",
          source: "community",
        };
        this.plugins.set(id, info);
      } else {
        console.warn(`[PluginManager] Plugin "${id}" not found`);
        return;
      }
    }

    if (info.status === "active") return;

    try {
      let instance = this.instances.get(id);

      if (!instance && customModule) {
        instance = { plugin: customModule, disposables: [] };
        this.instances.set(id, instance);
      } else if (!instance) {
        // 1. Built-in plugin: create from factory
        const builtin = builtinPlugins.get(id);
        if (builtin) {
          instance = { plugin: builtin.factory(), disposables: [] };
          this.instances.set(id, instance);
        } else if (id === "excalideck.ghost-keys") {
          // 2. Official pre-compiled plugin
          instance = { plugin: ghostKeysPlugin, disposables: [] };
          this.instances.set(id, instance);
        } else {
          throw new Error(`No module found for plugin "${id}"`);
        }
      }

      const context = this.buildContext(id, info.manifest);
      await instance.plugin.activate(context);

      info.status = "active";
      info.errorMessage = undefined;
      this.plugins.set(id, { ...info });
      this.notifyUIChange();
      this.eventBus.emit("plugin:activated", id);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[PluginManager] Failed to activate plugin "${id}":`, message);
      info.status = "error";
      info.errorMessage = message;
      this.plugins.set(id, { ...info });
      this.notifyUIChange();
    }
  }

  async deactivatePlugin(id: string): Promise<void> {
    const info = this.plugins.get(id);
    if (!info || info.status !== "active") return;

    const instance = this.instances.get(id);
    if (instance) {
      try {
        await instance.plugin.deactivate?.();
      } catch (err) {
        console.error(`[PluginManager] Error deactivating plugin "${id}":`, err);
      }
      // Dispose all registered resources
      for (const dispose of instance.disposables) {
        try { dispose(); } catch { /* ignore */ }
      }
      instance.disposables = [];
    }

    // Remove UI contributions from this plugin
    this.sidebarPanels = this.sidebarPanels.filter(p => p.pluginId !== id);
    this.statusBarItems = this.statusBarItems.filter(i => i.pluginId !== id);
    this.commands = this.commands.filter(c => c.pluginId !== id);

    info.status = "installed";
    info.errorMessage = undefined;
    this.plugins.set(id, { ...info });
    this.notifyUIChange();
    this.eventBus.emit("plugin:deactivated", id);
  }

  async uninstallPlugin(id: string): Promise<void> {
    await this.deactivatePlugin(id);
    this.plugins.delete(id);
    this.instances.delete(id);
    this.notifyUIChange();
  }

  async togglePlugin(id: string): Promise<void> {
    const info = this.plugins.get(id);
    if (!info) return;
    if (info.status === "active") {
      await this.deactivatePlugin(id);
    } else {
      await this.activatePlugin(id);
    }
  }

  async activateAll(): Promise<void> {
    for (const [id, info] of this.plugins) {
      if (info.status === "installed") {
        await this.activatePlugin(id);
      }
    }
  }

  async deactivateAll(): Promise<void> {
    for (const [id, info] of this.plugins) {
      if (info.status === "active") {
        await this.deactivatePlugin(id);
      }
    }
  }


  async executeCommand(commandId: string): Promise<void> {
    const command = this.commands.find(c => c.id === commandId);
    if (!command) {
      console.warn(`[PluginManager] Command "${commandId}" not found`);
      return;
    }
    try {
      await command.handler();
    } catch (err) {
      console.error(`[PluginManager] Error executing command "${commandId}":`, err);
    }
  }

  // ---- Context Builder ----

  private buildContext(pluginId: string, manifest: PluginManifest): PluginContext {
    const instance = this.instances.get(pluginId)!;
    const eventBus = this.eventBus;
    const manager = this;

    const app: PluginAppAPI = {
      getTheme: () => manager.appStateGetters.getTheme(),
      getVaultPath: () => manager.appStateGetters.getVaultPath(),
      getCurrentFile: () => manager.appStateGetters.getCurrentFile(),
      getAppVersion: () => manager.appStateGetters.getAppVersion(),
    };

    const canvas: PluginCanvasAPI = {
      getElements: () => manager.canvasGetters.getElements(),
      getAppState: () => manager.canvasGetters.getAppState(),
      getFiles: () => manager.canvasGetters.getFiles(),
      updateScene: (sceneData) => manager.canvasGetters.updateScene(sceneData),
      scrollToContent: (elements, options) => manager.canvasGetters.scrollToContent(elements, options),
      getExcalidrawAPI: () => manager.canvasGetters.getExcalidrawAPI(),
      onCanvasChange(callback) {
        const unsub = eventBus.on("canvas:change", callback);
        instance.disposables.push(unsub);
        return unsub;
      },
    };

    const commands: PluginCommandsAPI = {
      register(id, handler) {
        const fullId = `${pluginId}.${id}`;
        const contribution = manifest.contributes?.commands?.find(c => c.id === id || c.id === fullId);
        const entry: RegisteredCommand = {
          pluginId,
          id: fullId,
          title: contribution?.title ?? id,
          handler,
        };
        manager.commands = [...manager.commands, entry];
        manager.notifyUIChange();
        const dispose = () => {
          manager.commands = manager.commands.filter(c => c !== entry);
          manager.notifyUIChange();
        };
        instance.disposables.push(dispose);
        return dispose;
      },
      execute: (commandId) => manager.executeCommand(commandId),
      list: () => manager.commands.map(c => ({ id: c.id, title: c.title })),
    };

    const events: PluginEventsAPI = {
      on(event, handler) {
        const unsub = eventBus.on(event, handler);
        instance.disposables.push(unsub);
        return unsub;
      },
      emit(event, ...args) {
        // Plugins can only emit custom events
        if (!event.startsWith("custom:")) {
          console.warn(`[Plugin:${pluginId}] Cannot emit non-custom event "${event}"`);
          return;
        }
        eventBus.emit(event, ...args);
      },
    };

    const storage: PluginStorageAPI = createPluginStorage(pluginId);

    const ui: PluginUIAPI = {
      registerSidebarPanel(panel) {
        const entry: RegisteredSidebarPanel = {
          pluginId,
          id: `${pluginId}.${panel.id}`,
          title: panel.title,
          icon: panel.icon,
          render: panel.render,
        };
        manager.sidebarPanels = [...manager.sidebarPanels, entry];
        manager.notifyUIChange();
        const dispose = () => {
          manager.sidebarPanels = manager.sidebarPanels.filter(p => p !== entry);
          manager.notifyUIChange();
        };
        instance.disposables.push(dispose);
        return { dispose };
      },
      registerStatusBarItem(item) {
        const entry: RegisteredStatusBarItem = {
          pluginId,
          id: `${pluginId}.${item.id}`,
          render: item.render,
        };
        manager.statusBarItems = [...manager.statusBarItems, entry];
        manager.notifyUIChange();
        const dispose = () => {
          manager.statusBarItems = manager.statusBarItems.filter(i => i !== entry);
          manager.notifyUIChange();
        };
        instance.disposables.push(dispose);
        return { dispose };
      },
    };

    const logger: PluginLoggerAPI = {
      info: (...args) => console.log(`[Plugin:${pluginId}]`, ...args),
      warn: (...args) => console.warn(`[Plugin:${pluginId}]`, ...args),
      error: (...args) => console.error(`[Plugin:${pluginId}]`, ...args),
    };

    return { app, canvas, commands, events, storage, ui, logger };
  }
}
