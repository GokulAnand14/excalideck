import React, { useState, useEffect, useCallback, useRef } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { Titlebar } from "./components/Titlebar/Titlebar";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ExcalidrawWrapper } from "./components/Canvas/ExcalidrawWrapper";
import { VaultPicker } from "./components/VaultPicker/VaultPicker";
import { UpdateModal } from "./components/common/UpdateModal";
import { AboutModal } from "./components/common/AboutModal";
import { FileTreeNode } from "./types/fileTree";
import { useVault } from "./hooks/useVault";
import { useFileTree } from "./hooks/useFileTree";
import { useExcalidrawBridge } from "./hooks/useExcalidrawBridge";
import { useWorkspace } from "./hooks/useWorkspace";
import { useUpdater } from "./hooks/useUpdater";
import { usePlatform } from "./hooks/usePlatform";
import { useTheme } from "./hooks/useTheme";
import { useToast } from "./context/ToastContext";
import { isDrawingFileName } from "./lib/constants";
import "./App.css";

function findFileInTree(node: FileTreeNode | null, targetPath: string): boolean {
  if (!node) return false;
  if (node.nodeType === "file" && node.path === targetPath) return true;
  if (node.children) {
    for (const child of node.children) {
      if (findFileInTree(child, targetPath)) return true;
    }
  }
  return false;
}

function findFirstDrawing(node: FileTreeNode | null): string | null {
  if (!node) return null;
  if (
    node.nodeType === "file" &&
    node.path &&
    isDrawingFileName(node.name || node.path)
  ) {
    return node.path;
  }
  if (node.children) {
    for (const child of node.children) {
      const found = findFirstDrawing(child);
      if (found) return found;
    }
  }
  return null;
}

const App: React.FC = () => {
  const { isDesktop } = usePlatform();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { showToast } = useToast();
  const showError = useCallback(
    (msg: string) => showToast(msg, "error"),
    [showToast]
  );

  const {
    activeVault,
    recentVaults,
    appVaults,
    openVault,
    openDefaultVault,
    createVault,
    deleteVault,
    loading,
  } = useVault();
  const vaultOpen = !!activeVault;

  const {
    workspace,
    isWorkspaceReady,
    setActiveFile,
    updateViewport,
    getViewport,
    setSidebarOpen: persistSidebarOpen,
    setSidebarWidth: persistSidebarWidth,
    setCollapsedFolders: persistCollapsedFolders,
    remapPath,
    removePath,
    flushWorkspace,
  } = useWorkspace(activeVault?.path);

  const {
    tree,
    createDrawing,
    createFolder,
    deleteFile,
    renameFile,
    moveFile,
  } = useFileTree(activeVault?.path, showError);

  const {
    currentFile,
    initialData,
    saveStatus,
    loadFile,
    closeFile,
    triggerSave,
    flush,
    forceSaveNow,
    setExcalidrawAPI,
    getCurrentViewport,
    isSwitching,
  } = useExcalidrawBridge(showError);

  const flushBeforeRelaunch = useCallback(async () => {
    const vp = getCurrentViewport();
    if (currentFile && vp) {
      updateViewport(currentFile, vp, true);
    }
    await flush();
    await flushWorkspace();
  }, [currentFile, getCurrentViewport, updateViewport, flush, flushWorkspace]);

  const {
    currentVersion,
    updateState,
    isUpdateModalOpen,
    isChecking: isCheckingUpdates,
    isDownloading,
    downloadProgress,
    downloadedBytes,
    downloadTotal,
    error: updateError,
    statusMessage: updateStatusMessage,
    lastCheckedAt: lastUpdateCheckedAt,
    checkForUpdates,
    downloadAndInstall,
    dismissUpdate,
    skipUpdateVersion,
    openUpdateModal,
  } = useUpdater(flushBeforeRelaunch);

  const [showVaultPickerModal, setShowVaultPickerModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const restoredVaultRef = useRef<string | null>(null);
  const isClosingWindowRef = useRef<boolean>(false);

  const captureCurrentViewport = useCallback(
    (immediate = false) => {
      if (!currentFile) return;
      const vp = getCurrentViewport();
      if (vp) {
        updateViewport(currentFile, vp, immediate);
      }
    },
    [currentFile, getCurrentViewport, updateViewport]
  );

  const openDrawingWithState = useCallback(
    async (path: string) => {
      if (currentFile && currentFile !== path) {
        captureCurrentViewport(false);
      }
      const savedVp = getViewport(path);
      const ok = await loadFile(path, savedVp);
      if (ok) {
        setActiveFile(path);
      }
      return ok;
    },
    [currentFile, captureCurrentViewport, getViewport, loadFile, setActiveFile]
  );

  const handleCanvasChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      triggerSave(elements, appState, files);
    },
    [triggerSave]
  );

  const handleScrollChange = useCallback(
    (scrollX: number, scrollY: number, zoom: number) => {
      if (!currentFile || isSwitching()) return;
      updateViewport(currentFile, { scrollX, scrollY, zoom }, false);
    },
    [currentFile, isSwitching, updateViewport]
  );

  const flushAllBeforeSwitch = useCallback(async () => {
    captureCurrentViewport(true);
    await flush();
    await flushWorkspace();
  }, [captureCurrentViewport, flush, flushWorkspace]);

  const handleOpenVault = async (path: string) => {
    if (activeVault?.path === path) {
      setShowVaultPickerModal(false);
      return;
    }
    try {
      await flushAllBeforeSwitch();
      await closeFile();
      restoredVaultRef.current = null;
      await openVault(path);
      setShowVaultPickerModal(false);
    } catch (e: any) {
      showError(typeof e === "string" ? e : e?.message || "Failed to open vault");
    }
  };

  const handleOpenDefaultVault = async () => {
    await flushAllBeforeSwitch();
    await closeFile();
    restoredVaultRef.current = null;
    const vault = await openDefaultVault();
    if (vault) {
      setShowVaultPickerModal(false);
    } else {
      showError("Failed to open default vault");
    }
  };

  const handleCreateVault = async (path: string, name: string) => {
    try {
      await flushAllBeforeSwitch();
      await closeFile();
      restoredVaultRef.current = null;
      const vault = await createVault(path, name);
      if (vault) {
        setShowVaultPickerModal(false);
      }
    } catch (e: any) {
      showError(typeof e === "string" ? e : e?.message || "Failed to create vault");
    }
  };

  const handleDeleteVault = async (path: string) => {
    try {
      if (activeVault?.path === path) {
        await closeFile();
        restoredVaultRef.current = null;
      }
      await deleteVault(path);
      showToast("Vault deleted", "success");
    } catch (e: any) {
      console.error("[App] Failed to delete vault:", e);
      showError(typeof e === "string" ? e : e?.message || "Failed to delete vault");
    }
  };

  // Restore last active sheet & viewport (or fallback to first drawing) once tree + workspace load
  useEffect(() => {
    if (!vaultOpen || !activeVault?.path || !tree || !isWorkspaceReady) return;
    if (restoredVaultRef.current === activeVault.path) return;
    restoredVaultRef.current = activeVault.path;

    const target =
      workspace.activeFile && findFileInTree(tree, workspace.activeFile)
        ? workspace.activeFile
        : findFirstDrawing(tree);

    if (target) {
      const savedVp = workspace.viewports[target];
      loadFile(target, savedVp).then((ok) => {
        if (ok && workspace.activeFile !== target) {
          setActiveFile(target);
        }
      });
    }
  }, [
    vaultOpen,
    activeVault?.path,
    tree,
    isWorkspaceReady,
    workspace.activeFile,
    workspace.viewports,
    loadFile,
    setActiveFile,
  ]);

  const closeHandlersRef = useRef({
    captureCurrentViewport,
    flush,
    flushWorkspace,
  });
  closeHandlersRef.current = {
    captureCurrentViewport,
    flush,
    flushWorkspace,
  };

  // Persist pending drawing & viewport state cleanly on desktop window close and page hide
  useEffect(() => {
    const handleVisibilityOrHide = () => {
      if (document.visibilityState === "hidden") {
        closeHandlersRef.current.captureCurrentViewport(true);
        void closeHandlersRef.current.flush();
        void closeHandlersRef.current.flushWorkspace();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityOrHide);
    window.addEventListener("pagehide", handleVisibilityOrHide);

    let unlistenClose: (() => void) | undefined;
    if (isDesktop) {
      getCurrentWindow()
        .onCloseRequested(async () => {
          if (isClosingWindowRef.current) return;
          isClosingWindowRef.current = true;
          try {
            closeHandlersRef.current.captureCurrentViewport(true);
            await Promise.race([
              Promise.all([
                closeHandlersRef.current.flush(),
                closeHandlersRef.current.flushWorkspace(),
              ]),
              new Promise((resolve) => window.setTimeout(resolve, 2000)),
            ]);
          } catch (e) {
            console.error("[App] Flush on close failed:", e);
          }
        })
        .then((fn) => {
          unlistenClose = fn;
        })
        .catch(() => {});
    }

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrHide);
      window.removeEventListener("pagehide", handleVisibilityOrHide);
      if (unlistenClose) unlistenClose();
    };
  }, [isDesktop]);

  // Global keyboard shortcuts (Ctrl/Cmd+S force save, Ctrl/Cmd+\ toggle sidebar)
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      if (e.key.toLowerCase() === "s" && !e.shiftKey && !e.altKey) {
        if (currentFile) {
          e.preventDefault();
          captureCurrentViewport(true);
          await forceSaveNow();
          await flushWorkspace();
          showToast("Saved", "success");
        }
      } else if (e.key === "\\" && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        persistSidebarOpen(!workspace.sidebarOpen);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentFile,
    captureCurrentViewport,
    forceSaveNow,
    flushWorkspace,
    showToast,
    persistSidebarOpen,
    workspace.sidebarOpen,
  ]);

  const handleOpenFile = useCallback(
    async (path: string) => {
      await openDrawingWithState(path);
    },
    [openDrawingWithState]
  );

  const handleSelectAndCreate = async (name: string, folder?: string) => {
    const relPath = await createDrawing(name, folder);
    if (relPath) {
      await openDrawingWithState(relPath);
    }
  };

  const handleMoveFile = async (src: string, destFolder: string) => {
    const affectsCurrent =
      currentFile === src || Boolean(currentFile?.startsWith(src + "/"));
    if (affectsCurrent) {
      captureCurrentViewport(true);
      await flush();
    }
    const newPath = await moveFile(src, destFolder);
    if (newPath) {
      remapPath(src, newPath);
      if (currentFile === src) {
        await loadFile(newPath, getViewport(newPath));
      } else if (currentFile && currentFile.startsWith(src + "/")) {
        const updatedCurrent = newPath + currentFile.slice(src.length);
        await loadFile(updatedCurrent, getViewport(updatedCurrent));
      }
    }
  };

  const handleDeleteFile = async (path: string) => {
    if (currentFile === path || currentFile?.startsWith(path + "/")) {
      await closeFile();
    }
    const ok = await deleteFile(path);
    if (ok) {
      removePath(path);
    }
  };

  const handleRenameFile = async (oldPath: string, newName: string) => {
    const affectsCurrent =
      currentFile === oldPath || Boolean(currentFile?.startsWith(oldPath + "/"));
    if (affectsCurrent) {
      captureCurrentViewport(true);
      await flush();
    }
    const newPath = await renameFile(oldPath, newName);
    if (newPath) {
      remapPath(oldPath, newPath);
      if (currentFile === oldPath) {
        await loadFile(newPath, getViewport(newPath));
      } else if (currentFile && currentFile.startsWith(oldPath + "/")) {
        const updatedCurrent = newPath + currentFile.slice(oldPath.length);
        await loadFile(updatedCurrent, getViewport(updatedCurrent));
      }
    }
  };

  if (loading) {
    return (
      <div className="app-layout" data-theme={theme}>
        <Titlebar
          fileName={null}
          vaultName={null}
          sidebarOpen={workspace.sidebarOpen}
          theme={theme}
          toggleSidebar={() => persistSidebarOpen(!workspace.sidebarOpen)}
          toggleTheme={toggleTheme}
        />
        <div className="app-loading">
          <p>Loading Excalideck...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-layout" data-theme={theme}>
      <Titlebar
        fileName={currentFile}
        vaultName={activeVault?.name || null}
        sidebarOpen={workspace.sidebarOpen}
        theme={theme}
        saveStatus={saveStatus}
        availableUpdateVersion={
          isDesktop && updateState?.available ? updateState.version : null
        }
        onOpenUpdate={openUpdateModal}
        toggleSidebar={() => persistSidebarOpen(!workspace.sidebarOpen)}
        toggleTheme={toggleTheme}
      />

      {!vaultOpen ? (
        <VaultPicker
          recentVaults={recentVaults}
          appVaults={appVaults}
          onOpenVault={handleOpenVault}
          onCreateVault={handleCreateVault}
          onDeleteVault={handleDeleteVault}
          onOpenDefaultVault={handleOpenDefaultVault}
        />
      ) : (
        <div className="app-content">
          {workspace.sidebarOpen && (
            <Sidebar
              tree={tree}
              activeFile={currentFile}
              vaultName={activeVault?.name}
              sidebarWidth={workspace.sidebarWidth}
              collapsedFolders={workspace.collapsedFolders}
              onSidebarWidthChange={persistSidebarWidth}
              onCollapsedFoldersChange={persistCollapsedFolders}
              onFileSelect={handleOpenFile}
              onCreateDrawing={handleSelectAndCreate}
              onCreateFolder={createFolder}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              onMoveFile={handleMoveFile}
              onOpenVaultPicker={() => setShowVaultPickerModal(true)}
              onOpenAbout={() => setShowAboutModal(true)}
              currentVersion={currentVersion}
              onCloseMobile={() => persistSidebarOpen(false)}
            />
          )}
          <ExcalidrawWrapper
            initialData={initialData}
            theme={theme}
            onThemeChange={setTheme}
            onChange={handleCanvasChange}
            onScrollChange={handleScrollChange}
            fileName={currentFile}
            onCreateDrawing={handleSelectAndCreate}
            onAPIMount={setExcalidrawAPI}
          />
        </div>
      )}

      {vaultOpen && showVaultPickerModal && (
        <VaultPicker
          recentVaults={recentVaults}
          appVaults={appVaults}
          activeVaultPath={activeVault?.path}
          onOpenVault={handleOpenVault}
          onCreateVault={handleCreateVault}
          onDeleteVault={handleDeleteVault}
          onOpenDefaultVault={handleOpenDefaultVault}
          onClose={() => setShowVaultPickerModal(false)}
        />
      )}

      <AboutModal
        isOpen={showAboutModal}
        currentVersion={currentVersion}
        updateState={updateState}
        isChecking={isCheckingUpdates}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        downloadedBytes={downloadedBytes}
        downloadTotal={downloadTotal}
        error={updateError}
        statusMessage={updateStatusMessage}
        lastCheckedAt={lastUpdateCheckedAt}
        onCheckForUpdates={() => checkForUpdates(false)}
        onInstallUpdate={downloadAndInstall}
        onClose={() => setShowAboutModal(false)}
      />

      {isDesktop && updateState && isUpdateModalOpen && !showAboutModal && (
        <UpdateModal
          update={updateState}
          isDownloading={isDownloading}
          progress={downloadProgress}
          downloadedBytes={downloadedBytes}
          totalBytes={downloadTotal}
          error={updateError}
          onInstall={downloadAndInstall}
          onDismiss={dismissUpdate}
          onSkipVersion={skipUpdateVersion}
        />
      )}
    </div>
  );
};

export default App;
