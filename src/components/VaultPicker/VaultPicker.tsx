import React from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { useDialog } from "../../context/DialogContext";
import { usePlatform } from "../../hooks/usePlatform";
import { RecentVault, VaultInfo } from "../../types/vault";
import { IconFolderOpen, IconNewFolder, IconVault, IconSparkles, IconTrash } from "../common/Icons";
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
  const { isMobile } = usePlatform();
  const { promptDialog, confirmDialog } = useDialog();

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
      if (isMobile) {
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

  const handleDeleteVault = async (e: React.MouseEvent, vaultPath: string, vaultName: string) => {
    e.stopPropagation();
    if (!onDeleteVault) return;
    const confirmed = await confirmDialog({
      title: "Delete Vault?",
      message: `Are you sure you want to delete "${vaultName}" and all drawings inside it? This cannot be undone.`,
      confirmText: "Delete",
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
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  // Merge appVaults and recentVaults deduplicated by path
  const vaultsMap = new Map<string, { path: string; name: string; drawingCount?: number; lastOpened?: number }>();

  // Add app vaults first
  for (const av of appVaults) {
    vaultsMap.set(av.path, {
      path: av.path,
      name: av.name,
      drawingCount: av.drawingCount,
    });
  }

  // Overlay recent vaults info
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

  const allVaults = Array.from(vaultsMap.values());

  return (
    <div className="vault-picker-overlay" onClick={onClose}>
      <div className="vault-picker-modal" onClick={(e) => e.stopPropagation()}>
        {onClose && activeVaultPath && (
          <button className="vault-modal-close" onClick={onClose} title="Close">
            ✕
          </button>
        )}

        <div className="vault-picker-hero">
          <img src="/logo.png" className="vault-hero-logo" alt="Excalideck Logo" />
          <h2>Excalideck</h2>
          <p className="vault-hero-subtitle">
            {isMobile ? "Choose or create a sketchbook vault" : "Obsidian-powered local sketching vault"}
          </p>
        </div>

        <div className="vault-picker-options">
          <button
            className="vault-option-card primary"
            onClick={handleCreateNew}
          >
            <div className="option-icon-wrapper">
              <IconNewFolder size={20} />
            </div>
            <div className="option-text">
              <span className="option-title">Create New Vault</span>
              <span className="option-desc">
                {isMobile ? "Name a fresh sketchbook of your choice" : "Start a fresh sketchbook in a new folder"}
              </span>
            </div>
          </button>

          {onOpenDefaultVault && (
            <button
              className="vault-option-card default-vault"
              onClick={onOpenDefaultVault}
            >
              <div className="option-icon-wrapper default-icon">
                <IconSparkles size={20} />
              </div>
              <div className="option-text">
                <span className="option-title">Open App Vault</span>
                <span className="option-desc">
                  {isMobile ? "Standard default sketchbook" : "Quick-start vault in Documents"}
                </span>
              </div>
            </button>
          )}

          {!isMobile && (
            <button
              className="vault-option-card"
              onClick={handleOpenExisting}
            >
              <div className="option-icon-wrapper">
                <IconFolderOpen size={20} />
              </div>
              <div className="option-text">
                <span className="option-title">Open Existing Folder</span>
                <span className="option-desc">Use an existing folder containing drawings</span>
              </div>
            </button>
          )}
        </div>

        {allVaults.length > 0 && (
          <div className="vault-recents-section">
            <div className="recents-header">
              <span>{isMobile ? "Your Vaults" : "Recent Vaults"}</span>
            </div>
            <div className="recents-list">
              {allVaults.map((vault) => {
                const isActive = activeVaultPath === vault.path;
                return (
                  <div
                    key={vault.path}
                    className={`recent-vault-item ${isActive ? "active" : ""}`}
                    onClick={() => onOpenVault(vault.path)}
                  >
                    <div className="recent-vault-left">
                      <IconVault size={16} className="recent-vault-icon" />
                      <div className="recent-vault-info">
                        <span className="recent-name">{vault.name}</span>
                        <span className="recent-path" title={vault.path}>
                          {vault.path}
                        </span>
                      </div>
                    </div>

                    <div className="recent-vault-right">
                      {isActive && <span className="recent-badge">Active</span>}
                      {typeof vault.drawingCount === "number" && (
                        <span className="recent-drawings-count">
                          {vault.drawingCount} {vault.drawingCount === 1 ? "drawing" : "drawings"}
                        </span>
                      )}
                      {vault.lastOpened ? (
                        <span className="recent-time">
                          {formatLastOpened(vault.lastOpened)}
                        </span>
                      ) : null}
                      {onDeleteVault && (
                        <button
                          className="recent-delete-btn"
                          onClick={(e) => handleDeleteVault(e, vault.path, vault.name)}
                          title="Delete Vault"
                        >
                          <IconTrash size={14} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
