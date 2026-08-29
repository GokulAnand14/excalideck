import React from "react";
import { UpdateState } from "../../hooks/useUpdater";
import {
  IconSparkles,
  IconRefresh,
  IconAlertTriangle,
  IconCheck,
  IconClock,
} from "./Icons";
import "./AboutModal.css";

interface AboutModalProps {
  isOpen: boolean;
  currentVersion: string;
  updateState: UpdateState | null;
  isChecking: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  downloadedBytes: number;
  downloadTotal: number;
  error: string | null;
  statusMessage: string | null;
  lastCheckedAt: number | null;
  onCheckForUpdates: () => void;
  onInstallUpdate: () => void;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({
  isOpen,
  currentVersion,
  updateState,
  isChecking,
  isDownloading,
  downloadProgress,
  downloadedBytes,
  downloadTotal,
  error,
  statusMessage,
  lastCheckedAt,
  onCheckForUpdates,
  onInstallUpdate,
  onClose,
}) => {
  if (!isOpen) return null;

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="about-modal-backdrop" onClick={!isDownloading ? onClose : undefined}>
      <div className="about-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="about-modal-header">
          <div className="about-logo-wrapper">
            <img src="/logo.png" className="about-logo-img" alt="Excalideck" />
          </div>
          <div className="about-title-group">
            <h2 className="about-app-name">Excalideck</h2>
            <div className="about-version-badge">
              <span>Version {currentVersion}</span>
              <span className="about-dot">•</span>
              <span className="about-tag">Latest Stable</span>
            </div>
          </div>
          {!isDownloading && (
            <button className="about-close-btn" onClick={onClose} title="Close">
              ✕
            </button>
          )}
        </div>

        {/* Body */}
        <div className="about-modal-body">
          {/* Update Section */}
          <div className="about-update-section">
            <div className="about-update-header">
              <div className="about-update-title-wrap">
                <IconSparkles size={16} className="about-sparkle-icon" />
                <span className="about-update-label">Software Updates</span>
              </div>
              <button
                className="about-check-btn"
                onClick={onCheckForUpdates}
                disabled={isChecking || isDownloading}
                title="Check GitHub for newer releases"
              >
                <IconRefresh size={13} className={isChecking ? "spin-animation" : ""} />
                <span>{isChecking ? "Checking..." : "Check for Updates"}</span>
              </button>
            </div>

            {/* Status Feedback */}
            <div className="about-status-box">
              {isChecking && (
                <div className="about-status-row checking">
                  <div className="about-spinner" />
                  <span>Checking GitHub Releases for latest version...</span>
                </div>
              )}

              {!isChecking && updateState?.available && (
                <div className="about-status-row update-available">
                  <div className="about-status-icon">★</div>
                  <div className="about-update-details">
                    <div className="about-update-heading">
                      Update Available: <strong>v{updateState.version}</strong>
                    </div>
                    {updateState.body && (
                      <div className="about-changelog-preview">{updateState.body}</div>
                    )}
                  </div>
                </div>
              )}

              {!isChecking && !updateState && statusMessage && (
                <div className="about-status-row up-to-date">
                  <IconCheck size={14} className="text-emerald-500" />
                  <span>{statusMessage}</span>
                </div>
              )}

              {!isChecking && !updateState && !statusMessage && lastCheckedAt && (
                <div className="about-status-row muted">
                  <IconClock size={13} />
                  <span>Last checked today at {formatTime(lastCheckedAt)}</span>
                </div>
              )}

              {error && (
                <div className="about-status-row error">
                  <IconAlertTriangle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {/* Progress Bar during Download */}
            {isDownloading && (
              <div className="about-progress-wrap">
                <div className="about-progress-header">
                  <span>
                    {downloadProgress < 100 ? "Downloading installer..." : "Launching installer & updating..."}
                  </span>
                  <span className="about-progress-percent">{downloadProgress}%</span>
                </div>
                <div className="about-progress-bar-bg">
                  <div
                    className="about-progress-bar-fill"
                    style={{ width: `${Math.max(downloadProgress, 4)}%` }}
                  />
                </div>
                {downloadTotal > 0 && (
                  <div className="about-progress-bytes">
                    {formatBytes(downloadedBytes)} / {formatBytes(downloadTotal)}
                  </div>
                )}
              </div>
            )}

            {/* Update Action Button */}
            {updateState?.available && !isDownloading && (
              <button className="about-install-btn" onClick={onInstallUpdate}>
                <IconSparkles size={14} />
                <span>Update to v{updateState.version} & Restart</span>
              </button>
            )}
          </div>

          {/* Description & Useful Links */}
          <div className="about-description">
            Excalideck pairs the freehand sketching power of Excalidraw with Obsidian-style local vault persistence, atomic saves, and a robust plugin ecosystem.
          </div>

          <div className="about-links-row">
            <a
              href="https://github.com/GokulAnand14/excalideck"
              target="_blank"
              rel="noreferrer"
              className="about-link"
            >
              GitHub Repository ↗
            </a>
            <span className="about-link-sep">•</span>
            <a
              href="https://github.com/GokulAnand14/excalideck/releases"
              target="_blank"
              rel="noreferrer"
              className="about-link"
            >
              Release Notes ↗
            </a>
            <span className="about-link-sep">•</span>
            <a
              href="https://github.com/GokulAnand14/excalideck/issues"
              target="_blank"
              rel="noreferrer"
              className="about-link"
            >
              Report Issue ↗
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="about-modal-footer">
          <button className="about-btn-done" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
