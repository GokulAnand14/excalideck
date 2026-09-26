import React, { useState, useEffect, useMemo } from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useDialog } from "../../context/DialogContext";
import { usePlatform } from "../../hooks/usePlatform";
import { RecentVault, VaultInfo } from "../../types/vault";
import { revealInExplorer } from "../../lib/tauri";
import {
  IconFolderOpen,
  IconNewFolder,
  IconVault,
  IconSparkles,
  IconTrash,
  IconSearch,
  IconCopy,
  IconCheck,
  IconExternalLink,
} from "../common/Icons";
import "./VaultPicker.css";

interface VaultPickerProps {
  recentVaults: RecentVault[];
  appVaults?: VaultInfo[];
  activeVaultPath?: string | null;
  onOpenVault: (path: string) => void;
  onCreateVault: (path: string, name: string) => void;
  onDeleteVault?: (path: string) => void;
  onOpenDefaultVault?: () => void;
  onClose?: () => void;
}

export const VaultPicker: React.FC<VaultPickerProps> = ({
  recentVaults,
  appVaults = [],
  activeVaultPath,
  onOpenVault,
  onCreateVault,
  onDeleteVault,
  onOpenDefaultVault,
  onClose,
}) => {
  const { isMobile, isDesktop, isNativeMobile } = usePlatform();
  const { promptDialog, confirmDialog } = useDialog();
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  // Close on Escape key if allowed
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && onClose && activeVaultPath) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, activeVaultPath]);

  const handleOpenExisting = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: "Select Vault Folder",
      });
      if (selected && typeof selected === "string") {
        onOpenVault(selected);
      }
    } catch (e) {
      console.error("Failed to open dialog", e);
    }
  };

  const handleCreateNew = async () => {
    try {
      if (isNativeMobile) {
        const name = await promptDialog({
          title: "Create New Vault",
          subtitle: "Stored in app sandboxed storage",
          placeholder: "e.g. Sketches, Work, Ideas",
          defaultValue: "",
          confirmText: "Create Vault",
          icon: <IconSparkles size={16} />,
        });
        if (name) {
          onCreateVault("", name);
        }
        return;
      }

      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: "Select Parent Folder for New Vault",
      });
      if (selected && typeof selected === "string") {
        const name = await promptDialog({
          title: "Create New Vault",
          subtitle: `Location: ${selected}`,
          placeholder: "My Sketches",
          defaultValue: "My Sketches",
          confirmText: "Create Vault",
          icon: <IconSparkles size={16} />,
        });
        if (name) {
          onCreateVault(selected, name);
        }
      }
    } catch (e) {
      console.error("Failed to create vault", e);
    }
  };

  const handleCopyPath = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(path).then(() => {
      setCopiedPath(path);
      setTimeout(() => setCopiedPath(null), 1800);
    });
  };

  const handleRevealInExplorer = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    try {
      await revealInExplorer(path);
    } catch (err) {
      console.error("Failed to reveal folder:", err);
    }
  };

  const handleDeleteVault = async (e: React.MouseEvent, vaultPath: string, vaultName: string) => {
    e.stopPropagation();
    if (!onDeleteVault) return;
    const confirmed = await confirmDialog({
      title: "Delete Vault?",
      message: `Are you sure you want to delete "${vaultName}" and all drawings inside it? This cannot be undone.`,
      confirmText: "Delete Vault",
      danger: true,
      icon: <IconTrash size={16} />,
    });
    if (confirmed) {
      onDeleteVault(vaultPath);
    }
  };

  const formatLastOpened = (timestamp: number) => {
    if (!timestamp) return "";
    const date = new Date(timestamp * 1000);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  // Merge appVaults and recentVaults deduplicated by path
  const allVaults = useMemo(() => {
    const vaultsMap = new Map<string, { path: string; name: string; drawingCount?: number; lastOpened?: number }>();

    for (const av of appVaults) {
      vaultsMap.set(av.path, {
        path: av.path,
        name: av.name,
        drawingCount: av.drawingCount,
      });
    }

    for (const rv of recentVaults) {
      const existing = vaultsMap.get(rv.path);
      if (existing) {
        existing.lastOpened = rv.lastOpened;
      } else {
        vaultsMap.set(rv.path, {
          path: rv.path,
          name: rv.name,
          lastOpened: rv.lastOpened,
        });
      }
    }

    return Array.from(vaultsMap.values());
  }, [appVaults, recentVaults]);

  // Filter vaults according to search query
  const filteredVaults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return allVaults;
    return allVaults.filter(
      (v) =>
        v.name.toLowerCase().includes(query) ||
        v.path.toLowerCase().includes(query)
    );
  }, [allVaults, searchQuery]);

  return (
    <div className="vault-picker-overlay" onClick={onClose}>
      <div className="vault-picker-modal" onClick={(e) => e.stopPropagation()}>
        {onClose && activeVaultPath && (
          <button className="vault-modal-close" onClick={onClose} title="Close (Esc)">
            ✕
          </button>
        )}

        {/* Minimal Hero Header */}
        <div className="vault-picker-hero">
          <div className="vault-hero-brand">
            <img src="/logo.png" className="vault-hero-logo" alt="Excalideck Logo" />
            <div className="vault-hero-titles">
              <div className="vault-hero-title-row">
                <h2>Excalideck Vaults</h2>
                {allVaults.length > 0 && (
                  <span className="vault-count-pill">{allVaults.length} vaults</span>
                )}
              </div>
              <p className="vault-hero-subtitle">
                {isNativeMobile
                  ? "Choose or create a sketchbook vault"
                  : "Local, offline vaults with zero cloud lock-in"}
              </p>
            </div>
          </div>
        </div>

        {/* Minimal Actions Bar */}
        <div className="vault-actions-bar">
          <button
            className="vault-action-btn primary"
            onClick={handleCreateNew}
            title="Create a new vault in a folder of your choice"
          >
            <IconNewFolder size={15} />
            <span>New Vault</span>
          </button>

          {!isNativeMobile && (
            <button
              className="vault-action-btn secondary"
              onClick={handleOpenExisting}
              title="Open any existing folder on your computer"
            >
              <IconFolderOpen size={15} />
              <span>Open Folder</span>
            </button>
          )}

          {onOpenDefaultVault && (
            <button
              className="vault-action-btn secondary"
              onClick={onOpenDefaultVault}
              title="Quick-start default vault in Documents"
            >
              <IconSparkles size={14} />
              <span>App Vault</span>
            </button>
          )}
        </div>

        {/* Vault Filter / Search Bar */}
        {allVaults.length > 1 && (
          <div className="vault-search-container">
            <IconSearch size={14} className="vault-search-icon" />
            <input
              type="text"
              className="vault-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter vaults by name or path..."
            />
            {searchQuery && (
              <button
                className="vault-search-clear"
                onClick={() => setSearchQuery("")}
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>
        )}

        {/* Recent Vaults List */}
        <div className="vault-recents-section">
          <div className="recents-header">
            <span>{isNativeMobile ? "Your Vaults" : "Vault Folders"}</span>
            {filteredVaults.length > 0 && (
              <span className="recents-subtext">Click to open</span>
            )}
          </div>

          <div className="recents-list">
            {filteredVaults.map((vault) => {
              const isActive = activeVaultPath === vault.path;
              const isCopied = copiedPath === vault.path;

              return (
                <div
                  key={vault.path}
                  className={`recent-vault-card ${isActive ? "active" : ""}`}
                  onClick={() => onOpenVault(vault.path)}
                  title={`Open "${vault.name}"`}
                >
                  <div className="recent-vault-left">
                    <div className={`recent-vault-avatar ${isActive ? "active" : ""}`}>
                      <IconVault size={16} />
                    </div>
                    <div className="recent-vault-info">
                      <div className="recent-name-row">
                        <span className="recent-name">{vault.name}</span>
                        {isActive && (
                          <span className="recent-badge active">
                            <span className="status-dot" />
                            Active
                          </span>
                        )}
                      </div>
                      <span className="recent-path" title={vault.path}>
                        {vault.path}
                      </span>
                    </div>
                  </div>

                  <div className="recent-vault-right">
                    <div className="recent-vault-meta">
                      {typeof vault.drawingCount === "number" && (
                        <span className="recent-chip">
                          {vault.drawingCount} {vault.drawingCount === 1 ? "sketch" : "sketches"}
                        </span>
                      )}
                      {vault.lastOpened ? (
                        <span className="recent-chip time">
                          {formatLastOpened(vault.lastOpened)}
                        </span>
                      ) : null}
                    </div>

                    {/* Quick Action Tools per Vault */}
                    <div className="recent-actions-dock">
                      {/* Copy Path */}
                      <button
                        className="recent-action-icon-btn"
                        onClick={(e) => handleCopyPath(e, vault.path)}
                        title={isCopied ? "Path copied!" : "Copy vault path"}
                        aria-label="Copy vault path"
                      >
                        {isCopied ? (
                          <IconCheck size={13} style={{ color: "#10b981" }} />
                        ) : (
                          <IconCopy size={13} />
                        )}
                      </button>

                      {/* Reveal in Explorer (Desktop only) */}
                      {isDesktop && (
                        <button
                          className="recent-action-icon-btn"
                          onClick={(e) => handleRevealInExplorer(e, vault.path)}
                          title="Open folder in File Explorer"
                          aria-label="Open folder in File Explorer"
                        >
                          <IconExternalLink size={13} />
                        </button>
                      )}

                      {/* Delete / Remove */}
                      {onDeleteVault && (
                        <button
                          className="recent-action-icon-btn danger"
                          onClick={(e) => handleDeleteVault(e, vault.path, vault.name)}
                          title="Delete Vault"
                          aria-label="Delete Vault"
                        >
                          <IconTrash size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {filteredVaults.length === 0 && (
              <div className="recents-empty">
                {searchQuery ? (
                  <>
                    <p>No vaults found matching "{searchQuery}"</p>
                    <button
                      className="recents-clear-btn"
                      onClick={() => setSearchQuery("")}
                    >
                      Clear search
                    </button>
                  </>
                ) : (
                  <p>No vaults found. Create or open a folder above to get started.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
