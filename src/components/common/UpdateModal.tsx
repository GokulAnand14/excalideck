import React from "react";
import { UpdateState } from "../../hooks/useUpdater";
import { IconSparkles, IconAlertTriangle } from "./Icons";
import "./UpdateModal.css";

interface UpdateModalProps {
  update: UpdateState;
  isDownloading: boolean;
  progress: number;
  downloadedBytes: number;
  totalBytes: number;
  error: string | null;
  onInstall: () => void;
  onDismiss: () => void;
}

export const UpdateModal: React.FC<UpdateModalProps> = ({
  update,
  isDownloading,
  progress,
  downloadedBytes,
  totalBytes,
  error,
  onInstall,
  onDismiss,
}) => {
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div className="update-modal-backdrop" onClick={!isDownloading ? onDismiss : undefined}>
      <div className="update-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="update-modal-header">
          <div className="update-icon-badge">
            <IconSparkles size={20} />
          </div>
          <div className="update-title-group">
            <h3 className="update-title">Update Available</h3>
            <p className="update-version-tag">
              v{update.currentVersion} → <strong>v{update.version}</strong>
            </p>
          </div>
          {!isDownloading && (
            <button className="update-close-btn" onClick={onDismiss} title="Dismiss">
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div className="update-modal-body">
          {update.body ? (
            <div className="update-changelog">
              <span className="changelog-label">What's New:</span>
              <div className="changelog-content">{update.body}</div>
            </div>
          ) : (
            <p className="update-desc">
              A new version of Excalideck is ready to install with performance improvements and fixes.
            </p>
          )}

          {/* Progress Bar during download */}
          {isDownloading && (
            <div className="update-progress-container">
              <div className="update-progress-info">
                <span className="progress-label">
                  {progress < 100 ? "Downloading update..." : "Installing & Restarting..."}
                </span>
                <span className="progress-percent">{progress}%</span>
              </div>
              <div className="update-progress-bar-bg">
                <div
                  className="update-progress-bar-fill"
                  style={{ width: `${Math.max(progress, 3)}%` }}
                />
              </div>
              {totalBytes > 0 && (
                <span className="progress-bytes">
                  {formatBytes(downloadedBytes)} / {formatBytes(totalBytes)}
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="update-error-banner">
              <IconAlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="update-modal-footer">
          {!isDownloading && (
            <button className="update-btn secondary" onClick={onDismiss}>
              Later
            </button>
          )}
          <button
            className="update-btn primary"
            onClick={onInstall}
            disabled={isDownloading}
          >
            {isDownloading ? "Updating..." : "Update & Restart"}
          </button>
        </div>
      </div>
    </div>
  );
};
