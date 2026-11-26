import { useState, useEffect, useCallback, useRef } from "react";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { APP_VERSION_FALLBACK } from "../lib/constants";
import { openExternalUrl } from "../lib/tauri";

const SKIPPED_VERSION_KEY = "excalideck_skipped_update";

export interface UpdateState {
  available: boolean;
  version: string;
  currentVersion: string;
  body?: string;
  date?: string;
  downloadUrl?: string;
  fileName?: string;
  releaseUrl?: string;
  mode: "native" | "direct";
}

// Semver comparator: returns true if vRemote > vLocal (handles pre-release tags)
export function isNewerVersion(remote: string, current: string): boolean {
  const parseSemver = (v: string) => {
    const clean = v.replace(/^v/, "").trim().split("+")[0];
    const [core, pre] = clean.split("-", 2);
    const nums = core.split(".").map((n) => parseInt(n, 10) || 0);
    return {
      major: nums[0] || 0,
      minor: nums[1] || 0,
      patch: nums[2] || 0,
      pre: pre || null,
    };
  };

  const r = parseSemver(remote);
  const c = parseSemver(current);

  if (r.major !== c.major) return r.major > c.major;
  if (r.minor !== c.minor) return r.minor > c.minor;
  if (r.patch !== c.patch) return r.patch > c.patch;

  // Stable release is newer than pre-release of the same core version
  if (r.pre === null && c.pre !== null) return true;
  if (r.pre !== null && c.pre === null) return false;
  if (r.pre && c.pre) return r.pre.localeCompare(c.pre) > 0;
  return false;
}

function getPlatformAsset(assets: Array<{ name: string; browser_download_url: string }>): {
  url: string;
  name: string;
} | null {
  const ua = (typeof navigator !== "undefined" ? navigator.userAgent : "").toLowerCase();
  const isWindows = ua.includes("win");
  const isMac = ua.includes("mac");
  const isLinux = ua.includes("linux") && !isWindows && !isMac;

  if (isWindows) {
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

function formatUpdateError(err: any): string {
  const msg = String(err?.message || err || "");
  if (msg.includes("403") || msg.includes("429")) {
    return "GitHub API rate limit reached. Please try again in a few minutes.";
  }
  if (msg.includes("404")) {
    return "No published releases found yet.";
  }
  if (/network|fetch|failed to fetch|offline|timeout/i.test(msg)) {
    return "Unable to reach update server. Check your internet connection.";
  }
  return msg || "Unable to check for updates right now.";
}

export const useUpdater = (onBeforeRelaunch?: () => Promise<void>) => {
  const [currentVersion, setCurrentVersion] = useState<string>(APP_VERSION_FALLBACK);
  const currentVersionRef = useRef<string>(APP_VERSION_FALLBACK);
  const [updateState, setUpdateState] = useState<UpdateState | null>(null);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState<boolean>(false);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadProgress, setDownloadProgress] = useState<number>(0);
  const [downloadTotal, setDownloadTotal] = useState<number>(0);
  const [downloadedBytes, setDownloadedBytes] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);

  const pendingNativeUpdateRef = useRef<Update | null>(null);
  const onBeforeRelaunchRef = useRef(onBeforeRelaunch);
  onBeforeRelaunchRef.current = onBeforeRelaunch;

  useEffect(() => {
    getVersion()
      .then((ver) => {
        if (ver) {
          currentVersionRef.current = ver;
          setCurrentVersion(ver);
        }
      })
      .catch(() => {});
  }, []);

  const isMobileClient =
    typeof navigator !== "undefined" && /ipad|iphone|ipod|android/i.test(navigator.userAgent);

  const applyFoundUpdate = useCallback((nextUpdate: UpdateState, silent: boolean) => {
    setUpdateState(nextUpdate);
    setStatusMessage(null);
    const skipped =
      typeof localStorage !== "undefined" ? localStorage.getItem(SKIPPED_VERSION_KEY) : null;
    if (!silent || skipped !== nextUpdate.version) {
      setIsUpdateModalOpen(true);
    }
  }, []);

  const checkForUpdates = useCallback(
    async (silent: boolean = false) => {
      if (isMobileClient) {
        if (!silent) {
          setStatusMessage("Mobile app updates are managed via your app store.");
        }
        return;
      }

      setIsChecking(true);
      setError(null);
      if (!silent) setStatusMessage("Checking for updates...");

      let appVer = currentVersionRef.current;
      try {
        const liveVer = await getVersion();
        if (liveVer) {
          appVer = liveVer;
          currentVersionRef.current = liveVer;
          setCurrentVersion(liveVer);
        }
      } catch {}

      try {
        try {
          const nativeUpdate = await check();
          if (nativeUpdate?.available) {
            pendingNativeUpdateRef.current = nativeUpdate;
            applyFoundUpdate(
              {
                available: true,
                version: nativeUpdate.version.replace(/^v/, ""),
                currentVersion: (nativeUpdate.currentVersion || appVer).replace(/^v/, ""),
                body: nativeUpdate.body,
                date: nativeUpdate.date,
                mode: "native",
              },
              silent
            );
            return;
          }
        } catch (nativeErr) {
          console.log("[Updater] Native updater unavailable, checking GitHub API", nativeErr);
        }

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

        if (isNewerVersion(remoteVer, appVer)) {
          const matchedAsset = getPlatformAsset(release.assets || []);
          pendingNativeUpdateRef.current = null;
          applyFoundUpdate(
            {
              available: true,
              version: remoteVer,
              currentVersion: appVer,
              body: release.body,
              date: release.published_at,
              downloadUrl: matchedAsset?.url,
              fileName: matchedAsset?.name,
              releaseUrl:
                release.html_url ||
                `https://github.com/GokulAnand14/excalideck/releases/tag/v${remoteVer}`,
              mode: "direct",
            },
            silent
          );
        } else {
          setUpdateState(null);
          setIsUpdateModalOpen(false);
          pendingNativeUpdateRef.current = null;
          if (!silent) {
            setStatusMessage(`You're up to date on v${appVer}.`);
          }
        }
      } catch (e: any) {
        console.warn("[Updater] Check error:", e);
        if (!silent) {
          setError(formatUpdateError(e));
          setStatusMessage(null);
        }
      } finally {
        setLastCheckedAt(Date.now());
        setIsChecking(false);
      }
    },
    [isMobileClient, applyFoundUpdate]
  );

  const downloadAndInstall = useCallback(async () => {
    if (!updateState) return;

    setIsDownloading(true);
    setError(null);
    setDownloadProgress(0);
    setDownloadedBytes(0);
    setDownloadTotal(0);

    try {
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

        try {
          await onBeforeRelaunchRef.current?.();
        } catch (flushErr) {
          console.warn("[Updater] Pre-relaunch flush failed:", flushErr);
        }

        await relaunch();
        return;
      }

      const releasePage =
        updateState.downloadUrl ||
        updateState.releaseUrl ||
        `https://github.com/GokulAnand14/excalideck/releases/tag/v${updateState.version}`;
      await openExternalUrl(releasePage).catch(() => {
        window.open(releasePage, "_blank", "noopener,noreferrer");
      });
      setIsDownloading(false);
    } catch (e: any) {
      console.error("[Updater] Installation error:", e);
      setError(formatUpdateError(e));
      setIsDownloading(false);
    }
  }, [updateState]);

  const dismissUpdate = useCallback(() => {
    setIsUpdateModalOpen(false);
    setError(null);
  }, []);

  const skipUpdateVersion = useCallback(() => {
    if (updateState?.version && typeof localStorage !== "undefined") {
      localStorage.setItem(SKIPPED_VERSION_KEY, updateState.version);
    }
    setIsUpdateModalOpen(false);
    setError(null);
  }, [updateState?.version]);

  const openUpdateModal = useCallback(() => {
    if (updateState?.available) {
      setError(null);
      setIsUpdateModalOpen(true);
    }
  }, [updateState?.available]);

  const clearStatus = useCallback(() => {
    setStatusMessage(null);
    setError(null);
  }, []);

  // Run silent startup check once
  useEffect(() => {
    const timer = window.setTimeout(() => {
      checkForUpdates(true);
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [checkForUpdates]);

  return {
    currentVersion,
    updateState,
    isUpdateModalOpen,
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
    skipUpdateVersion,
    openUpdateModal,
    clearStatus,
  };
};
