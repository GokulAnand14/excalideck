import { useState, useEffect, useCallback, useRef } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { invoke } from "@tauri-apps/api/core";

export interface UpdateState {
  available: boolean;
  version: string;
  currentVersion: string;
  body?: string;
  date?: string;
  downloadUrl?: string;
  fileName?: string;
  mode: "native" | "direct";
}

// Semver comparator: returns true if vRemote > vLocal
export function isNewerVersion(remote: string, current: string): boolean {
  const cleanR = remote.replace(/^v/, "").trim();
  const cleanC = current.replace(/^v/, "").trim();

  const rParts = cleanR.split(/[-+]/)[0].split(".").map((n) => parseInt(n, 10) || 0);
  const cParts = cleanC.split(/[-+]/)[0].split(".").map((n) => parseInt(n, 10) || 0);

  const len = Math.max(rParts.length, cParts.length, 3);
  for (let i = 0; i < len; i++) {
    const r = rParts[i] || 0;
    const c = cParts[i] || 0;
    if (r > c) return true;
    if (r < c) return false;
  }
  return false;
}

// Detect operating system for binary matching
function getPlatformAsset(assets: Array<{ name: string; browser_download_url: string }>): {
  url: string;
  name: string;
} | null {
  const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "").toLowerCase();
  const isWindows = ua.includes("win");
  const isMac = ua.includes("mac");
  const isLinux = ua.includes("linux") && !isWindows && !isMac;

  if (isWindows) {
    // Prefer setup .exe, fallback to .msi
    const exeAsset = assets.find((a) => a.name.endsWith(".exe"));
    if (exeAsset) return { url: exeAsset.browser_download_url, name: exeAsset.name };
    const msiAsset = assets.find((a) => a.name.endsWith(".msi"));
    if (msiAsset) return { url: msiAsset.browser_download_url, name: msiAsset.name };
  } else if (isMac) {
    const dmgAsset = assets.find((a) => a.name.endsWith(".dmg"));
    if (dmgAsset) return { url: dmgAsset.browser_download_url, name: dmgAsset.name };
    const tarAsset = assets.find((a) => a.name.endsWith(".app.tar.gz"));
    if (tarAsset) return { url: tarAsset.browser_download_url, name: tarAsset.name };
  } else if (isLinux) {
    const appImageAsset = assets.find((a) => a.name.endsWith(".AppImage"));
    if (appImageAsset) return { url: appImageAsset.browser_download_url, name: appImageAsset.name };
    const debAsset = assets.find((a) => a.name.endsWith(".deb"));
    if (debAsset) return { url: debAsset.browser_download_url, name: debAsset.name };
  }

  // Fallback: first available executable or installer asset
  const anyInstaller = assets.find(
    (a) =>
      a.name.endsWith(".exe") ||
      a.name.endsWith(".msi") ||
      a.name.endsWith(".dmg") ||
      a.name.endsWith(".AppImage") ||
      a.name.endsWith(".deb")
  );
  if (anyInstaller) return { url: anyInstaller.browser_download_url, name: anyInstaller.name };

  return null;
}

export const useUpdater = () => {
  const [currentVersion, setCurrentVersion] = useState<string>("0.1.8");
  const [updateState, setUpdateState] = useState<UpdateState | null>(null);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadTotal, setDownloadTotal] = useState<number>(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  const pendingNativeUpdateRef = useRef<Update | null>(null);

  // Initialize current version from Tauri app info
  useEffect(() => {
    getVersion()
      .then((ver) => {
        if (ver) setCurrentVersion(ver);
      })
      .catch(() => {
        // Fallback already set to package version
      });
  }, []);

  const checkForUpdates = useCallback(
    async (silent: boolean = false) => {
      setIsChecking(true);
      setError(null);
      if (!silent) setStatusMessage("Checking for updates...");

      let appVer = currentVersion;
      try {
        const liveVer = await getVersion();
        if (liveVer) {
          appVer = liveVer;
          setCurrentVersion(liveVer);
        }
      } catch {}

      try {
        console.log(`[Updater] Checking for updates (current: v${appVer})...`);

        // Engine 1: Native Tauri v2 Plugin Updater Check
        try {
          const nativeUpdate = await check();
          if (nativeUpdate?.available) {
            console.log("[Updater] Found native update:", nativeUpdate.version);
            pendingNativeUpdateRef.current = nativeUpdate;
            setUpdateState({
              available: true,
              version: nativeUpdate.version.replace(/^v/, ""),
              currentVersion: (nativeUpdate.currentVersion || appVer).replace(/^v/, ""),
              body: nativeUpdate.body,
              date: nativeUpdate.date,
              mode: "native",
            });
            setLastCheckedAt(Date.now());
            setIsChecking(false);
            return;
          }
        } catch (nativeErr) {
          console.log("[Updater] Native updater endpoint unavailable, checking GitHub Release API directly...", nativeErr);
        }

        // Engine 2: GitHub Releases API Fallback (Guaranteed to always work)
        const response = await fetch(
          `https://api.github.com/repos/GokulAnand14/excalideck/releases/latest?t=${Date.now()}`,
          {
            headers: {
              Accept: "application/vnd.github.v3+json",
            },
          }
        );

        if (!response.ok) {
          throw new Error(`GitHub release API returned status ${response.status}`);
        }

        const release = await response.json();
        const remoteTag = release.tag_name || "";
        const remoteVer = remoteTag.replace(/^v/, "");

        console.log(`[Updater] GitHub latest release: v${remoteVer} vs current: v${appVer}`);

        if (isNewerVersion(remoteVer, appVer)) {
          const matchedAsset = getPlatformAsset(release.assets || []);
          console.log("[Updater] Matched installer asset:", matchedAsset);

          pendingNativeUpdateRef.current = null;
          setUpdateState({
            available: true,
            version: remoteVer,
            currentVersion: appVer,
            body: release.body,
            date: release.published_at,
            downloadUrl: matchedAsset?.url,
            fileName: matchedAsset?.name,
            mode: "direct",
          });
          setStatusMessage(null);
        } else {
          setUpdateState(null);
          pendingNativeUpdateRef.current = null;
          if (!silent) {
            setStatusMessage(`You're up to date! Excalideck v${appVer} is the latest version.`);
          }
        }
      } catch (e: any) {
        console.warn("[Updater] Check error:", e);
        if (!silent) {
          setError(e?.message || "Failed to check for updates");
          setStatusMessage(null);
        }
      } finally {
        setLastCheckedAt(Date.now());
        setIsChecking(false);
      }
    },
    [currentVersion]
  );

  const downloadAndInstall = useCallback(async () => {
    if (!updateState) return;

    setIsDownloading(true);
    setError(null);
    setDownloadProgress(0);
    setDownloadedBytes(0);
    setDownloadTotal(0);

    try {
      // 1. Native Tauri Installation
      if (updateState.mode === "native" && pendingNativeUpdateRef.current) {
        const update = pendingNativeUpdateRef.current;
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

        // Hot restart
        await relaunch();
        return;
      }

      // 2. Direct GitHub Asset Download & Auto-Launch
      if (!updateState.downloadUrl) {
        throw new Error("No installer download URL found for your operating system.");
      }

      console.log(`[Updater] Downloading installer from ${updateState.downloadUrl}...`);
      const res = await fetch(updateState.downloadUrl);
      if (!res.ok) throw new Error(`Download failed with HTTP ${res.status}`);

      const contentLength = res.headers.get("content-length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      setDownloadTotal(total);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("Could not read download stream");

      const chunks: Uint8Array[] = [];
      let received = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          setDownloadedBytes(received);
          if (total > 0) {
            setDownloadProgress(Math.min(Math.round((received / total) * 100), 99));
          }
        }
      }

      setDownloadProgress(100);

      // Merge all binary chunks into a single buffer
      const merged = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      const fileName = updateState.fileName || `Excalideck-Setup-v${updateState.version}.exe`;
      console.log(`[Updater] Saving and launching installer: ${fileName} (${received} bytes)...`);

      // Invoke Rust backend to write file to %TEMP% and launch installer
      await invoke("save_and_launch_installer", {
        fileName,
        data: Array.from(merged),
      });
    } catch (e: any) {
      console.error("[Updater] Installation error:", e);
      setError(e?.message || "Failed to download and install update.");
      setIsDownloading(false);
    }
  }, [updateState]);

  const dismissUpdate = useCallback(() => {
    setUpdateState(null);
    setError(null);
    setStatusMessage(null);
    pendingNativeUpdateRef.current = null;
  }, []);

  const clearStatus = useCallback(() => {
    setStatusMessage(null);
    setError(null);
  }, []);

  // Check silently on application mount (delayed by 2.5s)
  useEffect(() => {
    const timer = window.setTimeout(() => {
      checkForUpdates(true);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [checkForUpdates]);

  return {
    currentVersion,
    updateState,
    isChecking,
    isDownloading,
    downloadProgress,
    downloadTotal,
    downloadedBytes,
    error,
    statusMessage,
    lastCheckedAt,
    checkForUpdates,
    downloadAndInstall,
    dismissUpdate,
    clearStatus,
  };
};
