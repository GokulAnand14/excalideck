import React, { useState, useEffect, useRef, useCallback } from "react";
import { Titlebar } from "./components/Titlebar/Titlebar";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ExcalidrawWrapper } from "./components/Canvas/ExcalidrawWrapper";
import { VaultPicker } from "./components/VaultPicker/VaultPicker";
import { UpdateModal } from "./components/common/UpdateModal";
import { AboutModal } from "./components/common/AboutModal";
import { PluginMarketplaceModal } from "./components/PluginMarketplace/PluginMarketplaceModal";
import { useVault } from "./hooks/useVault";
import { useFileTree } from "./hooks/useFileTree";
import { useExcalidrawBridge } from "./hooks/useExcalidrawBridge";
import { useUpdater } from "./hooks/useUpdater";
import { usePlatform } from "./hooks/usePlatform";
import { useTheme } from "./hooks/useTheme";
import { usePluginManager } from "./plugins/PluginProvider";
import { usePluginUI, PluginSlot } from "./plugins";
import "./App.css";

const App: React.FC = () => {
  const { isMobile, isDesktop } = usePlatform();
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
    getExcalidrawAPI,
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
  const [showMarketplaceModal, setShowMarketplaceModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);


  // ---- Plugin System Wiring ----
  const pluginManager = usePluginManager();
  const { statusBarItems } = usePluginUI();

  // Track canvas state refs for plugin access
  const canvasElementsRef = useRef<readonly any[]>([]);
  const canvasAppStateRef = useRef<Record<string, any>>({});
  const canvasFilesRef = useRef<Record<string, any>>({});

  // Keep plugin manager's app state getters in sync
  useEffect(() => {
    pluginManager.setAppStateGetters({
      getTheme: () => theme,
      getVaultPath: () => activeVault?.path ?? null,
      getCurrentFile: () => currentFile,
      getAppVersion: () => currentVersion || "0.1.8",
    });
  }, [pluginManager, theme, activeVault, currentFile, currentVersion]);


  useEffect(() => {
    pluginManager.setCanvasGetters({
      getElements: () => {
        const api = getExcalidrawAPI();
        return api?.getSceneElements?.() || canvasElementsRef.current;
      },
      getAppState: () => {
        const api = getExcalidrawAPI();
        return api?.getAppState?.() || canvasAppStateRef.current;
      },
      getFiles: () => {
        const api = getExcalidrawAPI();
        return api?.getFiles?.() || canvasFilesRef.current;
      },
      updateScene: (sceneData: any) => {
        const api = getExcalidrawAPI();
        if (api) {
          api.updateScene(sceneData);
        }
      },
      scrollToContent: (elements?: any[], options?: any) => {
        const api = getExcalidrawAPI();
        if (api) {
          api.scrollToContent(elements, options);
        }
      },
      getExcalidrawAPI: () => getExcalidrawAPI(),
    });
  }, [pluginManager, getExcalidrawAPI]);

  // Discover community plugins when vault opens
  const prevVaultPathRef = useRef<string | null>(null);
  useEffect(() => {
    const vaultPath = activeVault?.path ?? null;
    const prevPath = prevVaultPathRef.current;

    if (vaultPath && vaultPath !== prevPath) {
      // Vault just opened
      pluginManager.discoverCommunityPlugins().then(() => {
        pluginManager.activateAll();
      }).catch((err) => {
        console.error("[App] Failed to load community plugins:", err);
      });
      pluginManager.getEventBus().emit("vault:open", vaultPath);
    } else if (!vaultPath && prevPath) {
      // Vault just closed
      pluginManager.deactivateAll().catch((err) => {
        console.error("[App] Failed to deactivate plugins:", err);
      });
      pluginManager.getEventBus().emit("vault:close");
    }

    prevVaultPathRef.current = vaultPath;
  }, [activeVault?.path, pluginManager]);

  // Emit theme change events
  const prevThemeRef = useRef(theme);
  useEffect(() => {
    if (theme !== prevThemeRef.current) {
      pluginManager.getEventBus().emit("theme:change", theme);
      prevThemeRef.current = theme;
    }
  }, [theme, pluginManager]);

  // Emit file lifecycle events
  const prevFileRef = useRef<string | null>(null);
  useEffect(() => {
    if (currentFile && currentFile !== prevFileRef.current) {
      pluginManager.getEventBus().emit("file:open", currentFile);
    } else if (!currentFile && prevFileRef.current) {
      pluginManager.getEventBus().emit("file:close", prevFileRef.current);
    }
    prevFileRef.current = currentFile;
  }, [currentFile, pluginManager]);

  // Wrapped onChange that feeds canvas data to plugins
  const handleCanvasChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      canvasElementsRef.current = elements;
      canvasAppStateRef.current = appState;
      canvasFilesRef.current = files || {};
      pluginManager.getEventBus().emit("canvas:change", elements, appState);
      triggerSave(elements, appState, files);
    },
    [pluginManager, triggerSave]
  );

  const handleOpenVault = async (path: string) => {
    await closeFile();
    await openVault(path);
    setShowVaultPickerModal(false);
  };

  const handleOpenDefaultVault = async () => {
    await closeFile();
    const vault = await openDefaultVault();
    if (vault) {
      setShowVaultPickerModal(false);
      loadFile("Welcome to Excalideck.excalidraw").catch(() => {});
    }
  };

  const handleCreateVault = async (path: string, name: string) => {
    await closeFile();
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

  // Auto-open welcome file if a vault is active on startup and no file is selected
  useEffect(() => {
    if (vaultOpen && !currentFile) {
      loadFile("Welcome to Excalideck.excalidraw").catch(() => {});
    }
  }, [vaultOpen, currentFile, loadFile]);

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
        onOpenVaultPicker={() => setShowVaultPickerModal(true)}
        onCreateDrawing={handleSelectAndCreate}
        onOpenMarketplace={() => setShowMarketplaceModal(true)}
        onOpenAbout={() => setShowAboutModal(true)}
        hasUpdateAvailable={!!updateState?.available}
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
              onFileSelect={loadFile}
              onCreateDrawing={handleSelectAndCreate}
              onCreateFolder={createFolder}
              onDeleteFile={deleteFile}
              onRenameFile={renameFile}
              onMoveFile={handleMoveFile}
              onOpenVaultPicker={() => setShowVaultPickerModal(true)}
              onOpenMarketplace={() => setShowMarketplaceModal(true)}
              onOpenAbout={() => setShowAboutModal(true)}
              currentVersion={currentVersion}
              hasUpdateAvailable={!!updateState?.available}
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

      {/* Plugin Marketplace Modal */}
      <PluginMarketplaceModal
        isOpen={showMarketplaceModal}
        onClose={() => setShowMarketplaceModal(false)}
      />

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


      {/* Plugin Status Bar */}
      {statusBarItems.length > 0 && (
        <div className="plugin-status-bar">
          {statusBarItems.map((item) => (
            <div key={item.id} className="plugin-status-bar-item">
              <PluginSlot render={item.render} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default App;
