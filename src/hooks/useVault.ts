import { useState, useEffect } from "react";
import { VaultInfo, RecentVault } from "../types/vault";
import { getRecentVaults, openVault as openVaultApi, closeVault as closeVaultApi, createVault as createVaultApi } from "../lib/tauri";

export const useVault = () => {
  const [activeVault, setActiveVault] = useState<VaultInfo | null>(null);
  const [recentVaults, setRecentVaults] = useState<RecentVault[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecent = async () => {
    try {
      const vaults = await getRecentVaults();
      setRecentVaults(vaults);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchRecent().finally(() => setLoading(false));
  }, []);

  const openVault = async (path: string) => {
    try {
      const vault = await openVaultApi(path);
      setActiveVault(vault);
      await fetchRecent();
    } catch (e) {
      console.error(e);
    }
  };

  const createVault = async (path: string, name: string) => {
    try {
      const vault = await createVaultApi(path, name);
      setActiveVault(vault);
      await fetchRecent();
    } catch (e) {
      console.error(e);
    }
  };

  const closeVault = async () => {
    try {
      await closeVaultApi();
      setActiveVault(null);
    } catch (e) {
      console.error(e);
    }
  };

  return { activeVault, recentVaults, openVault, createVault, closeVault, loading };
};
