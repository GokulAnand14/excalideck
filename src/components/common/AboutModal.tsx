import React, { useEffect, useMemo } from "react";
import { UpdateState } from "../../hooks/useUpdater";
import { openExternalUrl } from "../../lib/tauri";
import { formatBytes, formatReleaseDate, parseReleaseNotes } from "../../lib/releaseNotes";
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
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDownloading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, isDownloading, onClose]);

  const noteLines = useMemo(
    () => parseReleaseNotes(updateState?.body),
    [updateState?.body]
  );
  const releaseDate = useMemo(
    () => formatReleaseDate(updateState?.date),
    [updateState?.date]
  );

  if (!isOpen) return null;

  const handleExternalLink = (e: React.MouseEvent<HTMLAnchorElement>, url: string) => {
    e.preventDefault();
    openExternalUrl(url).catch(() => {
      window.open(url, "_blank", "noopener,noreferrer");
    });
  };

  const formatCheckedAt = (ts: number) => {
    const d = new Date(ts);
    const now = new Date();
    const isSameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    const timeStr = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return isSameDay
      ? `Last checked today at ${timeStr}`
      : `Last checked ${d.toLocaleDateString()} at ${timeStr}`;
  };

  const badgeLabel = updateState?.available
    ? `v${updateState.version} Available`
    : lastCheckedAt && !error
    ? "Up to Date"
    : "Desktop";

  return (
    <div className="about-modal-backdrop" onClick={!isDownloading ? onClose : undefined}>
      <div
        className="about-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label="About Excalideck"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="about-modal-header">
          <div className="about-logo-wrapper">
            <img src="/logo.png" className="about-logo-img" alt="Excalideck" />
          </div>
          <div className="about-title-group">
            <h2 className="about-app-name">Excalideck</h2>
            <div className="about-version-badge">
              <span>Version {currentVersion}</span>
              <span className="about-dot">•</span>
              <span className={`about-tag ${updateState?.available ? "has-update" : ""}`}>
                {badgeLabel}
              </span>
            </div>
          </div>
          {!isDownloading && (
            <button className="about-close-btn" onClick={onClose} title="Close" aria-label="Close">
              ✕
            </button>
          )}
        </div>

        <div className="about-modal-body">
          <div className="about-update-section">
            <div className="about-update-header">
              <div className="about-update-title-wrap">
                <IconSparkles size={15} className="about-sparkle-icon" />
                <span className="about-update-label">Software Updates</span>
              </div>
              <button
                className="about-check-btn"
                onClick={onCheckForUpdates}
                disabled={isChecking || isDownloading}
                title="Check GitHub for newer releases"
              >
                <IconRefresh size={12} className={isChecking ? "spin-animation" : ""} />
                <span>{isChecking ? "Checking..." : "Check for Updates"}</span>
              </button>
            </div>

            <div className="about-status-box">
              {isChecking && (
                <div className="about-status-row checking">
                  <div className="about-spinner" />
                  <span>Checking for updates...</span>
                </div>
              )}

              {!isChecking && updateState?.available && (
                <div className="about-status-row update-available">
                  <div className="about-update-details">
                    <div className="about-update-heading">
                      <span>
                        Update Available: <strong>v{updateState.version}</strong>
                      </span>
                      {releaseDate && <span className="about-release-date">{releaseDate}</span>}
                    </div>
                    {noteLines.length > 0 && (
                      <div className="about-changelog-preview">
                        {noteLines.map((line, idx) => (
                          <div
                            key={idx}
                            className={
                              line.kind === "heading"
                                ? "about-note-heading"
                                : line.kind === "bullet"
                                ? "about-note-bullet"
                                : "about-note-text"
                            }
                          >
                            {line.kind === "bullet" ? `• ${line.content}` : line.content}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!isChecking && !updateState && statusMessage && (
                <div className="about-status-row up-to-date">
                  <IconCheck size={14} />
                  <span>{statusMessage}</span>
                </div>
              )}

              {!isChecking && !updateState && !statusMessage && lastCheckedAt && (
                <div className="about-status-row muted">
                  <IconClock size={13} />
                  <span>{formatCheckedAt(lastCheckedAt)}</span>
                </div>
              )}

              {error && (
                <div className="about-status-row error">
                  <IconAlertTriangle size={14} />
                  <span>{error}</span>
                </div>
              )}
            </div>

            {isDownloading && (
              <div className="about-progress-wrap">
                <div className="about-progress-header">
                  <span>
                    {downloadProgress < 100
                      ? "Downloading update package..."
                      : "Verifying & restarting Excalideck..."}
                  </span>
                  <span className="about-progress-percent">
                    {downloadTotal > 0 ? `${downloadProgress}%` : ""}
                  </span>
                </div>
                <div className="about-progress-bar-bg">
                  <div
                    className={`about-progress-bar-fill ${downloadTotal === 0 ? "indeterminate" : ""}`}
                    style={downloadTotal > 0 ? { width: `${Math.max(downloadProgress, 4)}%` } : undefined}
                  />
                </div>
                {downloadTotal > 0 && (
                  <div className="about-progress-bytes">
                    {formatBytes(downloadedBytes)} / {formatBytes(downloadTotal)}
                  </div>
                )}
              </div>
            )}

            {updateState?.available && !isDownloading && (
              <div className="about-install-actions">
                <button className="about-install-btn" onClick={onInstallUpdate}>
                  <IconSparkles size={14} />
                  <span>
                    {updateState.mode === "native"
                      ? `Update to v${updateState.version} & Restart`
                      : updateState.fileName
                      ? `Download ${updateState.fileName}`
                      : `Download v${updateState.version}`}
                  </span>
                </button>
                {updateState.releaseUrl && updateState.mode === "native" && (
                  <a
                    href={updateState.releaseUrl}
                    onClick={(e) => handleExternalLink(e, updateState.releaseUrl!)}
                    className="about-manual-download-link"
                  >
                    View Release Notes on GitHub ↗
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="about-description">
            Excalideck pairs the freehand sketching power of Excalidraw with Obsidian-style local vault persistence and atomic saves.
          </div>

          <div className="about-links-row">
            <a
              href="https://github.com/GokulAnand14/excalideck"
              onClick={(e) =>
                handleExternalLink(e, "https://github.com/GokulAnand14/excalideck")
              }
              className="about-link"
            >
              GitHub Repository ↗
            </a>
            <span className="about-link-sep">•</span>
            <a
              href="https://github.com/GokulAnand14/excalideck/releases"
              onClick={(e) =>
                handleExternalLink(e, "https://github.com/GokulAnand14/excalideck/releases")
              }
              className="about-link"
            >
              Release Notes ↗
            </a>
            <span className="about-link-sep">•</span>
            <a
              href="https://github.com/GokulAnand14/excalideck/issues"
              onClick={(e) =>
                handleExternalLink(e, "https://github.com/GokulAnand14/excalideck/issues")
              }
              className="about-link"
            >
              Report Issue ↗
            </a>
          </div>
        </div>

        <div className="about-modal-footer">
          <button className="about-btn-done" onClick={onClose} disabled={isDownloading}>
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
