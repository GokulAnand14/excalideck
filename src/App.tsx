import React, { useState } from "react";
import { Titlebar } from "./components/Titlebar/Titlebar";
import { Sidebar } from "./components/Sidebar/Sidebar";
import { ExcalidrawWrapper } from "./components/Canvas/ExcalidrawWrapper";
import { VaultPicker } from "./components/VaultPicker/VaultPicker";
import { useVault } from "./hooks/useVault";
import { useFileTree } from "./hooks/useFileTree";
import { useExcalidrawBridge } from "./hooks/useExcalidrawBridge";
import { useTheme } from "./hooks/useTheme";
import "./App.css";

const App: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { activeVault, recentVaults, openVault, createVault, loading } =
    useVault();
  const vaultOpen = !!activeVault;

  const {
    tree,
    createDrawing,
    createFolder,
    deleteFile,
    renameFile,
    moveFile,
  } = useFileTree(vaultOpen);

  const { currentFile, initialData, loadFile, triggerSave, setExcalidrawAPI } =
    useExcalidrawBridge();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showVaultPickerModal, setShowVaultPickerModal] = useState(false);

  const handleOpenVault = async (path: string) => {
    await openVault(path);
    setShowVaultPickerModal(false);
  };

  const handleCreateVault = async (path: string, name: string) => {
    await createVault(path, name);
    setShowVaultPickerModal(false);
  };

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
      />

      {!vaultOpen ? (
        <VaultPicker
          recentVaults={recentVaults}
          onOpenVault={handleOpenVault}
          onCreateVault={handleCreateVault}
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
            />
          )}
          <ExcalidrawWrapper
            initialData={initialData}
            theme={theme}
            onChange={triggerSave}
            fileName={currentFile}
            onCreateDrawing={handleSelectAndCreate}
            onAPIMount={setExcalidrawAPI}
          />
        </div>
      )}

      {vaultOpen && showVaultPickerModal && (
        <VaultPicker
          recentVaults={recentVaults}
          activeVaultPath={activeVault?.path}
          onOpenVault={handleOpenVault}
          onCreateVault={handleCreateVault}
          onClose={() => setShowVaultPickerModal(false)}
        />
      )}
    </div>
  );
};

export default App;
