import type React from "react";

// ---- Manifest Types ----

export type PluginPermission =
  | "canvas:read"
  | "canvas:write"
  | "storage:read"
  | "storage:write"
  | "events:emit"
  | "commands:register"
  | "ui:sidebar"
  | "ui:toolbar"
  | "ui:statusbar"
  | "ui:menu";

export interface CommandContribution {
  id: string;
  title: string;
  keybinding?: string;
}

export interface SidebarPanelContribution {
  id: string;
  title: string;
  icon?: string;
}

export interface PluginContributions {
  commands?: CommandContribution[];
  sidebarPanels?: SidebarPanelContribution[];
}

export interface PluginSettingDefinition {
  key: string;
  type: "string" | "number" | "boolean" | "select";
  label: string;
  description?: string;
  default: string | number | boolean;
  options?: { label: string; value: string }[];  // for "select" type
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  homepage?: string;
  license?: string;
  engine?: string;        // semver range, e.g. ">=0.1.0"
  main: string;           // entry point file
  builtin: boolean;
  permissions: PluginPermission[];
  contributes?: PluginContributions;
  settings?: PluginSettingDefinition[];
}

// ---- Runtime Types ----

export type PluginStatus = "installed" | "active" | "error" | "disabled";

export interface PluginInfo {
  manifest: PluginManifest;
  status: PluginStatus;
  errorMessage?: string;
  source: "builtin" | "community";
}

// ---- Plugin API Surface ----

export interface PluginAppAPI {
  getTheme(): "light" | "dark";
  getVaultPath(): string | null;
  getCurrentFile(): string | null;
  getAppVersion(): string;
}

export interface PluginCanvasAPI {
  getElements(): readonly any[];
  getAppState(): Record<string, any>;
  getFiles(): Record<string, any>;
  updateScene(sceneData: {
    elements?: readonly any[];
    appState?: Record<string, any>;
    files?: Record<string, any>;
    commitToHistory?: boolean;
  }): void;
  scrollToContent(elements?: any[], options?: any): void;
  getExcalidrawAPI(): any;
  onCanvasChange(callback: (elements: readonly any[], appState: Record<string, any>) => void): () => void;
}

export interface PluginCommandsAPI {
  register(id: string, handler: () => void | Promise<void>): () => void;
  execute(commandId: string): Promise<void>;
  list(): CommandContribution[];
}

export type PluginEventName =
  | "canvas:change"
  | "file:open"
  | "file:save"
  | "file:close"
  | "vault:open"
  | "vault:close"
  | "theme:change"
  | "plugin:activated"
  | "plugin:deactivated"
  | `custom:${string}`;  // plugins can use custom namespaced events

export interface PluginEventsAPI {
  on(event: PluginEventName, handler: (...args: any[]) => void): () => void;
  emit(event: `custom:${string}`, ...args: any[]): void;  // can only emit custom events
}

export interface PluginStorageAPI {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  keys(): Promise<string[]>;
}

export interface PluginUIRegistration {
  dispose: () => void;
}

export interface PluginUIAPI {
  registerSidebarPanel(panel: {
    id: string;
    title: string;
    icon?: string;
    render: () => React.ReactNode;
  }): PluginUIRegistration;

  registerStatusBarItem(item: {
    id: string;
    render: () => React.ReactNode;
  }): PluginUIRegistration;
}

export interface PluginLoggerAPI {
  info(...args: any[]): void;
  warn(...args: any[]): void;
  error(...args: any[]): void;
}

export interface PluginContext {
  app: PluginAppAPI;
  canvas: PluginCanvasAPI;
  commands: PluginCommandsAPI;
  events: PluginEventsAPI;
  storage: PluginStorageAPI;
  ui: PluginUIAPI;
  logger: PluginLoggerAPI;
}

// ---- Plugin Module Interface ----

export interface ExcalideckPlugin {
  activate(context: PluginContext): void | Promise<void>;
  deactivate?(): void | Promise<void>;
}
