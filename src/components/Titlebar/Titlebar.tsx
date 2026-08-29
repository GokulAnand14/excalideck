import React from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useDialog } from "../../context/DialogContext";
import { IconSidebar, IconSun, IconMoon, IconNewFile, IconPlugin, IconSparkles } from "../common/Icons";

import "./Titlebar.css";

interface TitlebarProps {
  fileName?: string | null;
  vaultName?: string | null;
  sidebarOpen: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  toggleTheme: () => void;
  onOpenVaultPicker?: () => void;
  onCreateDrawing?: (name: string) => void;
  onOpenMarketplace?: () => void;
  onOpenAbout?: () => void;
  hasUpdateAvailable?: boolean;
}

export const Titlebar: React.FC<TitlebarProps> = ({
  fileName,
  vaultName,
  sidebarOpen,
  theme,
  toggleSidebar,
  toggleTheme,
  onOpenVaultPicker,
  onCreateDrawing,
  onOpenMarketplace,
  onOpenAbout,
  hasUpdateAvailable,
}) => {

  const { promptDialog } = useDialog();

  const handleMinimize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (e) {
      console.error("Failed to minimize", e);
    }
  };

  const handleMaximize = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
    } catch (e) {
      console.error("Failed to toggle maximize", e);
    }
  };

  const handleClose = async () => {
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (e) {
      console.error("Failed to close", e);
    }
  };

  const handleNewDrawing = async () => {
    if (onCreateDrawing) {
      const name = await promptDialog({
        title: "Create New Drawing",
        placeholder: "Untitled",
        defaultValue: "Untitled",
        confirmText: "Create",
        icon: <IconNewFile size={16} />,
      });
      if (name) {
        onCreateDrawing(name);
      }
    }
  };

  const cleanFileName = fileName
    ? fileName.split(/[/\\]/).pop()?.replace(".excalidraw", "")
    : null;

  return (
    <div className="titlebar" data-tauri-drag-region>
      {/* Left: Authentic macOS Traffic Lights & Navigation */}
      <div className="titlebar-left" data-tauri-drag-region>
        <div className="traffic-lights">
          <button
            className="traffic-light close"
            onClick={handleClose}
            title="Close"
            aria-label="Close"
          >
            <span className="traffic-icon">✕</span>
          </button>
          <button
            className="traffic-light minimize"
            onClick={handleMinimize}
            title="Minimize"
            aria-label="Minimize"
          >
            <span className="traffic-icon">−</span>
          </button>
          <button
            className="traffic-light maximize"
            onClick={handleMaximize}
            title="Maximize"
            aria-label="Maximize"
          >
            <span className="traffic-icon">+</span>
          </button>
        </div>

        <div className="titlebar-divider" />

        <button
          className={`titlebar-icon-btn ${sidebarOpen ? "active" : ""}`}
          onClick={toggleSidebar}
          title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        >
          <IconSidebar size={15} />
        </button>

        {vaultName && (
          <button
            className="vault-pill-btn"
            onClick={onOpenVaultPicker}
            title="Switch Vault"
          >
            <img src="/logo.png" className="vault-pill-logo" alt="Vault Logo" />
            <span className="vault-pill-text">{vaultName}</span>
          </button>
        )}
      </div>

      {/* Center: Active Document Breadcrumb */}
      <div className="titlebar-center" data-tauri-drag-region>
        {cleanFileName ? (
          <div className="doc-pill" data-tauri-drag-region>
            <span className="doc-status-dot" />
            <span className="doc-title" data-tauri-drag-region>{cleanFileName}</span>
            <span className="doc-ext">.excalidraw</span>
          </div>
        ) : (
          <div className="app-badge" data-tauri-drag-region>
            <img src="/logo.png" className="app-badge-logo-img" alt="Excalideck" />
            <span className="app-badge-name">Excalideck</span>
          </div>
        )}
      </div>

      {/* Right: Quick Action Controls */}
      <div className="titlebar-right">
        {vaultName && onCreateDrawing && (
          <button
            className="titlebar-action-btn primary"
            onClick={handleNewDrawing}
            title="New Drawing"
          >
            <IconNewFile size={14} />
            <span>New</span>
          </button>
        )}

        {onOpenMarketplace && (
          <button
            className="titlebar-icon-btn"
            onClick={onOpenMarketplace}
            title="Plugin Marketplace"
          >
            <IconPlugin size={15} />
          </button>
        )}

        {onOpenAbout && (
          <button
            className={`titlebar-icon-btn ${hasUpdateAvailable ? "has-update" : ""}`}
            onClick={onOpenAbout}
            title={hasUpdateAvailable ? "Update Available • Excalideck" : "About & Software Updates"}
            style={{ position: "relative" }}
          >
            <IconSparkles size={15} style={hasUpdateAvailable ? { color: "#f59e0b" } : undefined} />
            {hasUpdateAvailable && (
              <span
                style={{
                  position: "absolute",
                  top: "4px",
                  right: "4px",
                  width: "6px",
                  height: "6px",
                  borderRadius: "50%",
                  background: "#f59e0b",
                  boxShadow: "0 0 6px #f59e0b",
                }}
              />
            )}
          </button>
        )}

        <button
          className="titlebar-icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
        >
          {theme === "light" ? <IconMoon size={15} /> : <IconSun size={15} />}
        </button>
      </div>
    </div>
  );
};

