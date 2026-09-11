import { useState, useEffect, useCallback } from "react";
import { VaultInfo, RecentVault } from "../types/vault";
import {
  getRecentVaults,
  listAppVaults,
  openVault as openVaultApi,
  closeVault as closeVaultApi,
  createVault as createVaultApi,
  initDefaultVault as initDefaultVaultApi,
  deleteVault as deleteVaultApi,
  getPlatformInfo,
} from "../lib/tauri";

export const useVault = () => {
  const [activeVault, setActiveVault] = useState<VaultInfo | null>(null);
  const [recentVaults, setRecentVaults] = useState<RecentVault[]>([]);
  const [appVaults, setAppVaults] = useState<VaultInfo[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVaults = useCallback(async () => {
    try {
      const [recent, appList] = await Promise.all([
        getRecentVaults().catch(() => [] as RecentVault[]),
        listAppVaults().catch(() => [] as VaultInfo[]),
      ]);
      setRecentVaults(recent);
      setAppVaults(appList);
      return { recent, appList };
    } catch (e) {
      console.error("[useVault] Failed to fetch vaults:", e);
      return { recent: [], appList: [] };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        const { recent, appList } = await fetchVaults();
        if (!mounted) return;

        // Auto-open on mobile devices so user is immediately in drawing mode
        const platform = await getPlatformInfo().catch(() => null);
        if (platform?.isMobile && mounted) {
          if (recent.length > 0) {
            try {
              const vault = await openVaultApi(recent[0].path);
              if (mounted) setActiveVault(vault);
            } catch {
              // If recent vault path changed or missing, fallback to first app vault or init default
              if (appList.length > 0) {
                try {
                  const vault = await openVaultApi(appList[0].path);
                  if (mounted) setActiveVault(vault);
                } catch {
                  const vault = await initDefaultVaultApi();
                  if (mounted) setActiveVault(vault);
                }
              } else {
                const vault = await initDefaultVaultApi();
                if (mounted) setActiveVault(vault);
              }
            }
          } else if (appList.length > 0) {
            try {
              const vault = await openVaultApi(appList[0].path);
              if (mounted) setActiveVault(vault);
            } catch {
              const vault = await initDefaultVaultApi();
              if (mounted) setActiveVault(vault);
            }
          } else {
            // Fresh mobile install: auto-initialize Main Vault
            const vault = await initDefaultVaultApi();
            if (mounted) setActiveVault(vault);
          }
          await fetchVaults();
        }
      } catch (e) {
        console.error("[useVault] Init error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initialize();

    return () => {
      mounted = false;
    };
  }, [fetchVaults]);

  const openVault = async (path: string) => {
    try {
      const vault = await openVaultApi(path);
      setActiveVault(vault);
      await fetchVaults();
      return vault;
    } catch (e) {
      console.error("[useVault] Failed to open vault:", e);
      throw e;
    }
  };

  const openDefaultVault = async () => {
    try {
      const vault = await initDefaultVaultApi();
      setActiveVault(vault);
      await fetchVaults();
      return vault;
    } catch (e) {
      console.error("[useVault] Failed to open default vault:", e);
      return null;
    }
  };

  const createVault = async (path: string, name: string) => {
    try {
      const vault = await createVaultApi(path, name);
      setActiveVault(vault);
      await fetchVaults();
      return vault;
    } catch (e) {
      console.error("[useVault] Failed to create vault:", e);
      throw e;
    }
  };

  const deleteVault = async (path: string) => {
    try {
      await deleteVaultApi(path);
      if (activeVault?.path === path) {
        setActiveVault(null);
      }
      await fetchVaults();
    } catch (e) {
      console.error("[useVault] Failed to delete vault:", e);
      throw e;
    }
  };

  const closeVault = async () => {
    try {
      await closeVaultApi();
      setActiveVault(null);
    } catch (e) {
      console.error("[useVault] Failed to close vault:", e);
    }
  };

  return {
    activeVault,
    recentVaults,
    appVaults,
    openVault,
    openDefaultVault,
    createVault,
    deleteVault,
    closeVault,
    refreshVaults: fetchVaults,
    loading,
  };
};

