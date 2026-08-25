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
