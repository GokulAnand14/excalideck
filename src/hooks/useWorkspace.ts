import { useState, useEffect, useCallback, useRef } from "react";
import { ViewportState, WorkspaceState } from "../types/vault";
import { getWorkspaceState, saveWorkspaceState } from "../lib/tauri";
import { DEFAULT_SIDEBAR_WIDTH, WORKSPACE_DEBOUNCE_MS } from "../lib/constants";

const DEFAULT_WORKSPACE: WorkspaceState = {
  activeFile: null,
  viewports: {},
  sidebarOpen: true,
  sidebarWidth: DEFAULT_SIDEBAR_WIDTH,
  collapsedFolders: [],
};

export const useWorkspace = (activeVaultPath?: string | null) => {
  const [workspace, setWorkspace] = useState<WorkspaceState>(DEFAULT_WORKSPACE);
  const [loadedVaultPath, setLoadedVaultPath] = useState<string | null>(null);

  const workspaceRef = useRef<WorkspaceState>(DEFAULT_WORKSPACE);
  const activeVaultPathRef = useRef<string | null>(activeVaultPath ?? null);
  const dirtyRef = useRef<boolean>(false);
  const saveTimerRef = useRef<number | null>(null);

  activeVaultPathRef.current = activeVaultPath ?? null;

  const persistNow = useCallback(async () => {
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    if (!activeVaultPathRef.current || !dirtyRef.current) return;
    dirtyRef.current = false;
    try {
      await saveWorkspaceState(workspaceRef.current);
    } catch (e) {
      dirtyRef.current = true;
      console.error("[useWorkspace] Failed to save workspace state:", e);
    }
  }, []);

  const schedulePersist = useCallback(
    (immediate = false) => {
      if (!activeVaultPathRef.current) return;
      dirtyRef.current = true;
      if (immediate) {
        void persistNow();
        return;
      }
      if (saveTimerRef.current) {
        window.clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = window.setTimeout(() => {
        saveTimerRef.current = null;
        void persistNow();
      }, WORKSPACE_DEBOUNCE_MS);
    },
    [persistNow]
  );

  useEffect(() => {
    let mounted = true;
    if (saveTimerRef.current) {
      window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    dirtyRef.current = false;

    if (!activeVaultPath) {
      workspaceRef.current = DEFAULT_WORKSPACE;
      setWorkspace(DEFAULT_WORKSPACE);
      setLoadedVaultPath(null);
      return;
    }

    setLoadedVaultPath(null);
    getWorkspaceState()
      .then((loaded) => {
        if (!mounted) return;
        const normalized: WorkspaceState = {
          activeFile: loaded.activeFile ?? null,
          viewports: loaded.viewports ?? {},
          sidebarOpen: typeof loaded.sidebarOpen === "boolean" ? loaded.sidebarOpen : true,
          sidebarWidth:
            typeof loaded.sidebarWidth === "number" &&
            loaded.sidebarWidth >= 200 &&
            loaded.sidebarWidth <= 600
              ? loaded.sidebarWidth
              : DEFAULT_SIDEBAR_WIDTH,
          collapsedFolders: Array.isArray(loaded.collapsedFolders)
            ? loaded.collapsedFolders
            : [],
        };
        workspaceRef.current = normalized;
        setWorkspace(normalized);
        setLoadedVaultPath(activeVaultPath);
      })
      .catch((e) => {
        if (!mounted) return;
        console.error("[useWorkspace] Failed to load workspace state:", e);
        workspaceRef.current = DEFAULT_WORKSPACE;
        setWorkspace(DEFAULT_WORKSPACE);
        setLoadedVaultPath(activeVaultPath);
      });

    return () => {
      mounted = false;
    };
  }, [activeVaultPath]);

  const setActiveFile = useCallback(
    (file: string | null) => {
      const next = { ...workspaceRef.current, activeFile: file };
      workspaceRef.current = next;
      setWorkspace(next);
      schedulePersist(true);
    },
    [schedulePersist]
  );

  const updateViewport = useCallback(
    (file: string, viewport: ViewportState, immediate = false) => {
      if (
        !file ||
        !Number.isFinite(viewport.scrollX) ||
        !Number.isFinite(viewport.scrollY) ||
        !Number.isFinite(viewport.zoom) ||
        viewport.zoom <= 0
      ) {
        return;
      }
      const existing = workspaceRef.current.viewports[file];
      if (
        existing &&
        Math.abs(existing.scrollX - viewport.scrollX) < 0.5 &&
        Math.abs(existing.scrollY - viewport.scrollY) < 0.5 &&
        Math.abs(existing.zoom - viewport.zoom) < 0.001
      ) {
        return;
      }
      workspaceRef.current = {
        ...workspaceRef.current,
        viewports: {
          ...workspaceRef.current.viewports,
          [file]: {
            scrollX: viewport.scrollX,
            scrollY: viewport.scrollY,
            zoom: viewport.zoom,
          },
        },
      };
      schedulePersist(immediate);
    },
    [schedulePersist]
  );

  const getViewport = useCallback((file: string): ViewportState | undefined => {
    return workspaceRef.current.viewports[file];
  }, []);

  const setSidebarOpen = useCallback(
    (open: boolean) => {
      const next = { ...workspaceRef.current, sidebarOpen: open };
      workspaceRef.current = next;
      setWorkspace(next);
      schedulePersist(true);
    },
    [schedulePersist]
  );

  const setSidebarWidth = useCallback(
    (width: number, immediate = false) => {
      const clamped = Math.max(200, Math.min(600, Math.round(width)));
      const next = { ...workspaceRef.current, sidebarWidth: clamped };
      workspaceRef.current = next;
      setWorkspace(next);
      schedulePersist(immediate);
    },
    [schedulePersist]
  );

  const setCollapsedFolders = useCallback(
    (folders: string[]) => {
      const next = { ...workspaceRef.current, collapsedFolders: folders };
      workspaceRef.current = next;
      setWorkspace(next);
      schedulePersist(false);
    },
    [schedulePersist]
  );

  const remapPath = useCallback(
    (oldPath: string, newPath: string) => {
      const prev = workspaceRef.current;
      const nextViewports: Record<string, ViewportState> = {};
      for (const [k, v] of Object.entries(prev.viewports)) {
        if (k === oldPath) {
          nextViewports[newPath] = v;
        } else if (k.startsWith(oldPath + "/")) {
          nextViewports[newPath + k.slice(oldPath.length)] = v;
        } else {
          nextViewports[k] = v;
        }
      }
      let nextActive = prev.activeFile;
      if (nextActive === oldPath) {
        nextActive = newPath;
      } else if (nextActive && nextActive.startsWith(oldPath + "/")) {
        nextActive = newPath + nextActive.slice(oldPath.length);
      }
      const nextCollapsed = prev.collapsedFolders.map((f) => {
        if (f === oldPath) return newPath;
        if (f.startsWith(oldPath + "/")) return newPath + f.slice(oldPath.length);
        return f;
      });
      const next: WorkspaceState = {
        ...prev,
        activeFile: nextActive,
        viewports: nextViewports,
        collapsedFolders: nextCollapsed,
      };
      workspaceRef.current = next;
      setWorkspace(next);
      schedulePersist(true);
    },
    [schedulePersist]
  );

  const removePath = useCallback(
    (targetPath: string) => {
      const prev = workspaceRef.current;
      const nextViewports: Record<string, ViewportState> = {};
      for (const [k, v] of Object.entries(prev.viewports)) {
        if (k !== targetPath && !k.startsWith(targetPath + "/")) {
          nextViewports[k] = v;
        }
      }
      let nextActive = prev.activeFile;
      if (
        nextActive === targetPath ||
        (nextActive && nextActive.startsWith(targetPath + "/"))
      ) {
        nextActive = null;
      }
      const nextCollapsed = prev.collapsedFolders.filter(
        (f) => f !== targetPath && !f.startsWith(targetPath + "/")
      );
      const next: WorkspaceState = {
        ...prev,
        activeFile: nextActive,
        viewports: nextViewports,
        collapsedFolders: nextCollapsed,
      };
      workspaceRef.current = next;
      setWorkspace(next);
      schedulePersist(true);
    },
    [schedulePersist]
  );

  return {
    workspace,
    isWorkspaceReady: !!activeVaultPath && loadedVaultPath === activeVaultPath,
    setActiveFile,
    updateViewport,
    getViewport,
    setSidebarOpen,
    setSidebarWidth,
    setCollapsedFolders,
    remapPath,
    removePath,
    flushWorkspace: persistNow,
  };
};
