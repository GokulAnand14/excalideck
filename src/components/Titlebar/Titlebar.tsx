import React, { useState, useEffect } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { usePlatform } from "../../hooks/usePlatform";
import { IconSidebar, IconSun, IconMoon } from "../common/Icons";

import "./Titlebar.css";

interface TitlebarProps {
  fileName?: string | null;
  vaultName?: string | null;
  sidebarOpen: boolean;
  theme: "light" | "dark";
  toggleSidebar: () => void;
  toggleTheme: () => void;
}

export const Titlebar: React.FC<TitlebarProps> = ({
  fileName,
  vaultName,
  sidebarOpen,
  theme,
  toggleSidebar,
  toggleTheme,
}) => {
  const { isDesktop, isMobile } = usePlatform();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isDesktop) return;

    let unlisten: (() => void) | undefined;
    const checkMaximized = async () => {
      try {
        const appWindow = getCurrentWindow();
        const max = await appWindow.isMaximized();
        setIsMaximized(max);
        unlisten = await appWindow.onResized(async () => {
          const m = await appWindow.isMaximized();
          setIsMaximized(m);
        });
      } catch (e) {
        console.error("Failed to check window state", e);
      }
    };

    checkMaximized();

    return () => {
      if (unlisten) unlisten();
    };
  }, [isDesktop]);

  const handleMinimize = async () => {
    if (!isDesktop) return;
    try {
      const appWindow = getCurrentWindow();
      await appWindow.minimize();
    } catch (e) {
      console.error("Failed to minimize", e);
    }
  };

  const handleMaximize = async () => {
    if (!isDesktop) return;
    try {
      const appWindow = getCurrentWindow();
      await appWindow.toggleMaximize();
      const max = await appWindow.isMaximized();
      setIsMaximized(max);
    } catch (e) {
      console.error("Failed to toggle maximize", e);
    }
  };

  const handleClose = async () => {
    if (!isDesktop) return;
    try {
      const appWindow = getCurrentWindow();
      await appWindow.close();
    } catch (e) {
      console.error("Failed to close", e);
    }
  };

  const displayName = fileName
    ? fileName.split(/[/\\]/).pop()?.replace(".excalidraw", "")
    : vaultName
    ? vaultName
    : "Excalideck";

  return (
    <div
      className={`titlebar ${isMobile ? "is-mobile" : ""}`}
      data-tauri-drag-region={isDesktop ? "" : undefined}
    >
      {/* Left: Sidebar Toggle */}
      <div className="titlebar-left" data-tauri-drag-region={isDesktop ? "" : undefined}>
        <button
          className={`titlebar-icon-btn ${sidebarOpen ? "active" : ""}`}
          onClick={toggleSidebar}
          title={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
          aria-label={sidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
        >
          <IconSidebar size={isMobile ? 18 : 15} />
        </button>
      </div>

      {/* Center: Current drawing name cleanly centered */}
      <div
        className="titlebar-center"
        data-tauri-drag-region={isDesktop ? "" : undefined}
      >
        <span
          className="titlebar-doc-name"
          data-tauri-drag-region={isDesktop ? "" : undefined}
          title={fileName || displayName}
        >
          {displayName}
        </span>
      </div>

      {/* Right: Quick Action Controls + Windows Window Controls */}
      <div className="titlebar-right">
        <button
          className="titlebar-icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === "light" ? "Dark" : "Light"} Mode`}
          aria-label="Toggle Theme"
        >
          {theme === "light" ? <IconMoon size={14} /> : <IconSun size={14} />}
        </button>

        {/* Windows-style Window Controls on the right */}
        {isDesktop && (
          <div className="window-controls">
            <button
              className="window-control-btn minimize"
              onClick={handleMinimize}
              title="Minimize"
              aria-label="Minimize"
            >
              <svg width="10" height="1" viewBox="0 0 10 1" fill="currentColor">
                <rect width="10" height="1" />
              </svg>
            </button>

            <button
              className="window-control-btn maximize"
              onClick={handleMaximize}
              title={isMaximized ? "Restore" : "Maximize"}
              aria-label={isMaximized ? "Restore" : "Maximize"}
            >
              {isMaximized ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                  <path d="M2.5 1.5H8.5V7.5" />
                  <rect x="1.5" y="2.5" width="6" height="6" />
                </svg>
              ) : (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1">
                  <rect x="1" y="1" width="8" height="8" />
                </svg>
              )}
            </button>

            <button
              className="window-control-btn close"
              onClick={handleClose}
              title="Close"
              aria-label="Close"
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.2">
                <path d="M1 1L9 9M9 1L1 9" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
