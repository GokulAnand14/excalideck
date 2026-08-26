import { useState, useEffect, useCallback, useRef } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export interface UpdateState {
  available: boolean;
  version: string;
  currentVersion: string;
  body?: string;
  date?: string;
}

export const useUpdater = () => {
  const [updateState, setUpdateState] = useState<UpdateState | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadTotal, setDownloadTotal] = useState<number>(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const pendingUpdateRef = useRef<Update | null>(null);

  const checkForUpdates = useCallback(async (silent: boolean = false) => {
    setIsChecking(true);
    setError(null);
    try {
      const update = await check();
      if (update?.available) {
        pendingUpdateRef.current = update;
        setUpdateState({
          available: true,
          version: update.version,
          currentVersion: update.currentVersion,
          body: update.body,
          date: update.date,
        });
      } else {
        pendingUpdateRef.current = null;
        setUpdateState(null);
      }
    } catch (e: any) {
      if (!silent) {
        console.error("Failed to check for updates", e);
        setError(e?.message || "Failed to check for updates");
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  const downloadAndInstall = useCallback(async () => {
    const update = pendingUpdateRef.current;
    if (!update) return;

    setIsDownloading(true);
    setError(null);
    setDownloadProgress(0);

    try {
      let downloaded = 0;
      let total = 0;

      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            total = event.data.contentLength || 0;
            setDownloadTotal(total);
            break;
          case "Progress":
            downloaded += event.data.chunkLength;
            setDownloadedBytes(downloaded);
            if (total > 0) {
              setDownloadProgress(Math.min(Math.round((downloaded / total) * 100), 100));
            }
            break;
          case "Finished":
            setDownloadProgress(100);
            break;
        }
      });

      // Restart app with newly installed binary
      await relaunch();
    } catch (e: any) {
      console.error("Failed to download or install update", e);
      setError(e?.message || "Failed to install update. Please try again.");
      setIsDownloading(false);
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setUpdateState(null);
    pendingUpdateRef.current = null;
  }, []);

  // Check silently on application mount (delayed by 3s to not block initial render)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      checkForUpdates(true);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [checkForUpdates]);

  return {
    updateState,
    isChecking,
    isDownloading,
    downloadProgress,
    downloadTotal,
    downloadedBytes,
    error,
    checkForUpdates,
    downloadAndInstall,
    dismissUpdate,
  };
};
