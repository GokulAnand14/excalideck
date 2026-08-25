import React from "react";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import { RecentVault } from "../../types/vault";
import { IconFolderOpen, IconNewFolder, IconVault } from "../common/Icons";
import "./VaultPicker.css";

interface VaultPickerProps {
  recentVaults: RecentVault[];
  activeVaultPath?: string | null;
  onOpenVault: (path: string) => void;
  onCreateVault: (path: string, name: string) => void;
  onClose?: () => void;
}

export const VaultPicker: React.FC<VaultPickerProps> = ({
  recentVaults,
  activeVaultPath,
  onOpenVault,
  onCreateVault,
  onClose,
}) => {
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
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: "Select Parent Folder for New Vault",
      });
      if (selected && typeof selected === "string") {
        const name = prompt("Enter vault name:", "My Sketches");
        if (name && name.trim()) {
          onCreateVault(selected, name.trim());
        }
      }
    } catch (e) {
      console.error("Failed to create vault", e);
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
            Obsidian-powered local sketching vault
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
              <span className="option-desc">Start a fresh sketchbook in a new folder</span>
            </div>
          </button>

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
        </div>

        {recentVaults.length > 0 && (
          <div className="vault-recents-section">
            <div className="recents-header">
              <span>Recent Vaults</span>
            </div>
            <div className="recents-list">
              {recentVaults.map((vault) => {
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
                    {vault.lastOpened && (
                      <span className="recent-time">
                        {formatLastOpened(vault.lastOpened)}
                      </span>
                    )}
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
