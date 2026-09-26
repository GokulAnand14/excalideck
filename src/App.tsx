import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { useUpdater } from "./hooks/useUpdater";
import { usePlatform } from "./hooks/usePlatform";
import { useTheme } from "./hooks/useTheme";
import "./App.css";

const App: React.FC = () => {
  const { isDesktop } = usePlatform();
  const { theme, toggleTheme } = useTheme();
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
    tree,
    createDrawing,
    createFolder,
    deleteFile,
    renameFile,
    moveFile,
  } = useFileTree(activeVault?.path);

  const {
    currentFile,
    initialData,
    loadFile,
    closeFile,
    triggerSave,
    setExcalidrawAPI,
  } = useExcalidrawBridge();

  const {
    currentVersion,
    updateState,
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
  } = useUpdater();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showVaultPickerModal, setShowVaultPickerModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const handleCanvasChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      triggerSave(elements, appState, files);
    },
    [triggerSave]
  );

  const handleOpenVault = async (path: string) => {
    await closeFile();
    hasAutoOpenedVaultRef.current = null;
    await openVault(path);
    setShowVaultPickerModal(false);
  };

  const handleOpenDefaultVault = async () => {
    await closeFile();
    hasAutoOpenedVaultRef.current = null;
    const vault = await openDefaultVault();
    if (vault) {
      setShowVaultPickerModal(false);
      const welcome = "Welcome to Excalideck.excalidraw";
      loadFile(welcome).catch(() => {});
    }
  };

  const handleCreateVault = async (path: string, name: string) => {
    await closeFile();
    hasAutoOpenedVaultRef.current = null;
    const vault = await createVault(path, name);
    if (vault) {
      setShowVaultPickerModal(false);
    }
  };

  const handleDeleteVault = async (path: string) => {
    try {
      await deleteVault(path);
    } catch (e) {
      console.error("[App] Failed to delete vault:", e);
    }
  };

  const hasAutoOpenedVaultRef = useRef<string | null>(null);

  // Auto-open first drawing or welcome file when a vault is opened and no drawing is active
  useEffect(() => {
    if (!vaultOpen || currentFile || !tree || !activeVault?.path) return;
    if (hasAutoOpenedVaultRef.current === activeVault.path) return;

    const findFirstDrawing = (node: FileTreeNode | null): string | null => {
      if (!node) return null;
      if (
        node.nodeType === "file" &&
        node.path &&
        (node.path.endsWith(".excalidraw") || node.name.endsWith(".excalidraw"))
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
    };

    const firstDrawing = findFirstDrawing(tree);
    if (firstDrawing) {
      hasAutoOpenedVaultRef.current = activeVault.path;
      loadFile(firstDrawing).catch((err) => {
        console.error("[App] Auto-open drawing failed:", err);
      });
    }
  }, [vaultOpen, currentFile, tree, activeVault?.path, loadFile]);

  const handleOpenFile = useCallback(
    async (path: string) => {
      await loadFile(path);
    },
    [loadFile]
  );

  const handleSelectAndCreate = async (name: string, folder?: string) => {
    const relPath = await createDrawing(name, folder);
    if (relPath) {
      await loadFile(relPath);
    }
  };

  const handleMoveFile = async (src: string, destFolder: string) => {
    const newPath = await moveFile(src, destFolder);
    if (newPath && currentFile === src) {
      await loadFile(newPath);
    }
  };

  const handleDeleteFile = async (path: string) => {
    await deleteFile(path);
    if (currentFile === path || currentFile?.startsWith(path + "/")) {
      await closeFile();
    }
  };

  const handleRenameFile = async (oldPath: string, newName: string) => {
    const newPath = await renameFile(oldPath, newName);
    if (newPath && currentFile === oldPath) {
      await loadFile(newPath);
    }
  };

  if (loading) {
    return (
      <div className="app-layout" data-theme={theme}>
        <Titlebar
          fileName={null}
          vaultName={null}
          sidebarOpen={sidebarOpen}
          theme={theme}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
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
        sidebarOpen={sidebarOpen}
        theme={theme}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
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
          {sidebarOpen && (
            <Sidebar
              tree={tree}
              activeFile={currentFile}
              vaultName={activeVault?.name}
              onFileSelect={handleOpenFile}
              onCreateDrawing={handleSelectAndCreate}
              onCreateFolder={createFolder}
              onDeleteFile={handleDeleteFile}
              onRenameFile={handleRenameFile}
              onMoveFile={handleMoveFile}
              onOpenVaultPicker={() => setShowVaultPickerModal(true)}
              onOpenAbout={() => setShowAboutModal(true)}
              currentVersion={currentVersion}
              onCloseMobile={() => setSidebarOpen(false)}
            />
          )}
          <ExcalidrawWrapper
            initialData={initialData}
            theme={theme}
            onChange={handleCanvasChange}
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

      {/* About & Software Updates Modal */}
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

      {/* Auto-Updater Modal Prompt (Standalone alert for desktop) */}
      {isDesktop && updateState && !showAboutModal && (
        <UpdateModal
          update={updateState}
          isDownloading={isDownloading}
          progress={downloadProgress}
          downloadedBytes={downloadedBytes}
          totalBytes={downloadTotal}
          error={updateError}
          onInstall={downloadAndInstall}
          onDismiss={dismissUpdate}
        />
      )}
    </div>
  );
};

export default App;
