import { invoke } from "@tauri-apps/api/core";
import { VaultInfo, RecentVault, AppConfig } from "../types/vault";
import { FileTreeNode } from "../types/fileTree";
import { DrawingData } from "../types/drawing";

// Vault commands
export const openVault = (path: string) => invoke<VaultInfo>("open_vault", { path });
export const createVault = (path: string, name: string) => invoke<VaultInfo>("create_vault", { path, name });
export const getRecentVaults = () => invoke<RecentVault[]>("get_recent_vaults");
export const closeVault = () => invoke("close_vault");

// File commands
export const readDrawing = (path: string) => invoke<DrawingData>("read_drawing", { path });
export const saveDrawing = (path: string, content: string) => invoke("save_drawing", { path, content });
export const createDrawing = (name: string, folder?: string) => invoke<string>("create_drawing", { name, folder });
export const deleteFile = (path: string) => invoke("delete_file", { path });
export const renameFile = (oldPath: string, newName: string) => invoke<string>("rename_file", { oldPath, newName });
export const moveFile = (src: string, destFolder: string) => invoke<string>("move_file", { src, destFolder });

// Tree commands
export const getFileTree = () => invoke<FileTreeNode>("get_file_tree");
export const createFolder = (path: string) => invoke("create_folder", { path });

// Asset commands
export const saveAsset = (id: string, data: string, mimeType: string) => invoke<string>("save_asset", { id, data, mimeType });
export const getAssetPath = (id: string) => invoke<string | null>("get_asset_path", { id });


// Config commands
export const getAppConfig = () => invoke<AppConfig>("get_app_config");
export const setAppConfig = (config: AppConfig) => invoke("set_app_config", { config });

// Plugin storage commands
export const pluginStorageGet = (pluginId: string, key: string) =>
  invoke<string | null>("plugin_storage_get", { pluginId, key });
export const pluginStorageSet = (pluginId: string, key: string, value: string) =>
  invoke("plugin_storage_set", { pluginId, key, value });
export const pluginStorageDelete = (pluginId: string, key: string) =>
  invoke("plugin_storage_delete", { pluginId, key });
export const pluginStorageKeys = (pluginId: string) =>
  invoke<string[]>("plugin_storage_keys", { pluginId });

// Plugin discovery commands
export interface CommunityPluginRawInfo {
  id: string;
  name: string;
  version: string;
  description: string;
  author: string;
  main: string;
  dirPath: string;
}

export const listCommunityPlugins = () =>
  invoke<CommunityPluginRawInfo[]>("list_community_plugins");
export const readPluginFile = (pluginId: string, relativePath: string) =>
  invoke<string>("read_plugin_file", { pluginId, relativePath });
export const installCommunityPlugin = (
  pluginId: string,
  manifestJson: string,
  mainFilename: string,
  mainCode: string
) =>
  invoke("install_community_plugin", {
    pluginId,
    manifestJson,
    mainFilename,
    mainCode,
  });
export const uninstallCommunityPlugin = (pluginId: string) =>
  invoke("uninstall_community_plugin", { pluginId });

