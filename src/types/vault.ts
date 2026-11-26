export interface VaultInfo {
  path: string;
  name: string;
  drawingCount: number;
}

export interface RecentVault {
  path: string;
  name: string;
  lastOpened: number;
}

export interface VaultConfig {
  version: number;
}

export interface AppConfig {
  theme: string;
  recentVaults: RecentVault[];
}

export interface ViewportState {
  scrollX: number;
  scrollY: number;
  zoom: number;
}

export interface WorkspaceState {
  activeFile: string | null;
  viewports: Record<string, ViewportState>;
  sidebarOpen: boolean;
  sidebarWidth: number;
  collapsedFolders: string[];
}
