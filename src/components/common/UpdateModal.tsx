import React, { useEffect, useMemo } from "react";
import { UpdateState } from "../../hooks/useUpdater";
import { formatBytes, formatReleaseDate, parseReleaseNotes } from "../../lib/releaseNotes";
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
  onSkipVersion?: () => void;
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
  onSkipVersion,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isDownloading) {
        onDismiss();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDownloading, onDismiss]);

  const releaseDate = useMemo(() => formatReleaseDate(update.date), [update.date]);
  const noteLines = useMemo(() => parseReleaseNotes(update.body), [update.body]);

  const installLabel = isDownloading
    ? progress < 100
      ? "Downloading..."
      : "Installing..."
    : update.mode === "native"
    ? "Update & Restart"
    : update.fileName
    ? `Download ${update.fileName}`
    : "Download Release ↗";

  return (
    <div className="update-modal-backdrop" onClick={!isDownloading ? onDismiss : undefined}>
      <div
        className="update-modal-card"
        role="dialog"
        aria-modal="true"
        aria-label={`Update to Excalideck v${update.version}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="update-modal-header">
          <div className="update-icon-badge">
            <IconSparkles size={18} />
          </div>
          <div className="update-title-group">
            <h3 className="update-title">Software Update Ready</h3>
            <div className="update-meta-row">
              <span className="update-version-pill">
                v{update.currentVersion} → <strong>v{update.version}</strong>
              </span>
              {releaseDate && <span className="update-release-date">{releaseDate}</span>}
            </div>
          </div>
          {!isDownloading && (
            <button
              className="update-close-btn"
              onClick={onDismiss}
              title="Close (Esc)"
              aria-label="Close"
            >
              ✕
            </button>
          )}
        </div>

        <div className="update-modal-body">
          {noteLines.length > 0 ? (
            <div className="update-changelog">
              <span className="changelog-label">Release Notes</span>
              <div className="changelog-lines">
                {noteLines.map((line, idx) =>
                  line.kind === "heading" ? (
                    <div key={idx} className="changelog-heading">
                      {line.content}
                    </div>
                  ) : line.kind === "bullet" ? (
                    <div key={idx} className="changelog-bullet">
                      <span className="changelog-dot">•</span>
                      <span>{line.content}</span>
                    </div>
                  ) : (
                    <p key={idx} className="changelog-text">
                      {line.content}
                    </p>
                  )
                )}
              </div>
            </div>
          ) : (
            <p className="update-desc">
              Excalideck v{update.version} includes stability improvements, bug fixes, and performance updates.
            </p>
          )}

          {isDownloading && (
            <div className="update-progress-container">
              <div className="update-progress-info">
                <span className="progress-label">
                  {progress < 100
                    ? "Downloading update package..."
                    : "Verifying & restarting Excalideck..."}
                </span>
                <span className="progress-percent">
                  {totalBytes > 0 ? `${progress}%` : ""}
                </span>
              </div>
              <div className="update-progress-bar-bg">
                <div
                  className={`update-progress-bar-fill ${totalBytes === 0 ? "indeterminate" : ""}`}
                  style={totalBytes > 0 ? { width: `${Math.max(progress, 3)}%` } : undefined}
                />
              </div>
              {totalBytes > 0 && (
                <span className="progress-bytes">
                  {formatBytes(downloadedBytes)} of {formatBytes(totalBytes)}
                </span>
              )}
            </div>
          )}

          {error && (
            <div className="update-error-banner">
              <IconAlertTriangle size={15} className="update-error-icon" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="update-modal-footer">
          <div className="update-footer-left">
            {!isDownloading && onSkipVersion && (
              <button className="update-skip-btn" onClick={onSkipVersion}>
                Skip v{update.version}
              </button>
            )}
          </div>
          <div className="update-footer-actions">
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
              {installLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
