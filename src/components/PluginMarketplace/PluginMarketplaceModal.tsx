import React, { useState, useMemo, useEffect } from "react";
import {
  IconPlugin,
  IconSearch,
  IconCheck,
  IconDownload,
  IconStar,
  IconTrash,
  IconExternalLink,
  IconKeyboard,
} from "../common/Icons";
import { usePluginManager } from "../../plugins/PluginProvider";
import { usePluginList } from "../../plugins/usePlugins";
import {
  MARKETPLACE_CATALOG,
  MarketplacePlugin,
} from "../../plugins/marketplace";
import {
  installCommunityPlugin,
  uninstallCommunityPlugin,
} from "../../lib/tauri";
import "./PluginMarketplace.css";

interface PluginMarketplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewFilter = "discover" | "installed";

interface ToastMessage {
  text: string;
  icon?: string;
}

export const PluginMarketplaceModal: React.FC<PluginMarketplaceModalProps> = ({
  isOpen,
  onClose,
}) => {
  const pluginManager = usePluginManager();
  const installedPlugins = usePluginList();

  const [activeView, setActiveView] = useState<ViewFilter>("discover");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string>(
    MARKETPLACE_CATALOG[0]?.id || "excalideck.ghost-keys"
  );
  const [loadingPluginId, setLoadingPluginId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set());

  // Show auto-dismissing toast
  const showToast = (text: string, icon = "⚡") => {
    setToast({ text, icon });
    setTimeout(() => {
      setToast(null);
    }, 2800);
  };

  // Real-time physical keyboard keypress visualizer
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if typing in search box
      if (document.activeElement?.tagName === "INPUT") return;

      const key = e.key.toUpperCase();
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.add(key);
        if (e.shiftKey) next.add("SHIFT");
        return next;
      });
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toUpperCase();
      setPressedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        if (!e.shiftKey) next.delete("SHIFT");
        return next;
      });
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      setPressedKeys(new Set());
    };
  }, [isOpen]);

  // Map of installed plugins
  const installedMap = useMemo(() => {
    const map = new Map<string, { status: string; source: string }>();
    for (const p of installedPlugins) {
      map.set(p.manifest.id, { status: p.status, source: p.source });
    }
    return map;
  }, [installedPlugins]);

  // Combined full catalog (bundled marketplace catalog + any local vault-discovered plugins)
  const fullCatalog = useMemo(() => {
    const catalogMap = new Map<string, MarketplacePlugin>();
    for (const item of MARKETPLACE_CATALOG) {
      catalogMap.set(item.id, item);
    }

    for (const p of installedPlugins) {
      if (!catalogMap.has(p.manifest.id)) {
        catalogMap.set(p.manifest.id, {
          id: p.manifest.id,
          name: p.manifest.name,
          version: p.manifest.version,
          author: p.manifest.author,
          description: p.manifest.description,
          category: "Utilities",
          type: p.source === "builtin" ? "official" : "community",
          downloads: 1,
          stars: 5.0,
          tags: ["local", "vault"],
          permissions: p.manifest.permissions || [],
          iconBg: p.source === "builtin"
            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
            : "linear-gradient(135deg, #f59e0b, #d97706)",
        });
      }
    }

    return Array.from(catalogMap.values());
  }, [installedPlugins]);

  // Filtered plugin list for master pane
  const filteredPlugins = useMemo(() => {
    return fullCatalog.filter((plugin) => {
      const isInstalled = installedMap.has(plugin.id);

      if (activeView === "installed" && !isInstalled) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = plugin.name.toLowerCase().includes(q);
        const matchesDesc = plugin.description.toLowerCase().includes(q);
        const matchesAuthor = plugin.author.toLowerCase().includes(q);
        const matchesTags = plugin.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesDesc && !matchesAuthor && !matchesTags) {
          return false;
        }
      }

      return true;
    });
  }, [fullCatalog, activeView, searchQuery, installedMap]);

  // Currently selected plugin object
  const selectedPlugin = useMemo(() => {
    return (
      fullCatalog.find((p) => p.id === selectedId) ||
      filteredPlugins[0] ||
      fullCatalog[0] ||
      null
    );
  }, [fullCatalog, selectedId, filteredPlugins]);

  // 0ms Optimistic Install Handler
  const handleInstall = async (plugin: MarketplacePlugin) => {
    setLoadingPluginId(plugin.id);

    const manifest = {
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      description: plugin.description,
      author: plugin.author,
      main: "index.js",
      builtin: false,
      permissions: plugin.permissions,
    };

    try {
      // 1. Activate optimistically in memory in 0ms
      await pluginManager.activatePlugin(plugin.id, manifest);
      showToast(`${plugin.name} installed & activated!`, "🚀");

      // 2. Persist to vault filesystem asynchronously
      const manifestJson = JSON.stringify(manifest, null, 2);
      const code = plugin.sampleCode || `
export default {
  activate(context) {
    context.logger.info("${plugin.name} activated!");
  }
};`;

      installCommunityPlugin(plugin.id, manifestJson, "index.js", code).catch((err) => {
        console.warn("[Marketplace] Background vault save:", err);
      });
    } catch (err) {
      console.error("[Marketplace] Install failed:", err);
      showToast(`Installation failed. Ensure a vault is open.`, "⚠️");
    } finally {
      setLoadingPluginId(null);
    }
  };

  // 0ms Optimistic Uninstall Handler
  const handleUninstall = async (pluginId: string) => {
    setLoadingPluginId(pluginId);
    try {
      // 1. Deactivate & remove optimistically from memory in 0ms
      await pluginManager.uninstallPlugin(pluginId);
      showToast(`Extension uninstalled`, "🗑️");

      // 2. Remove from vault filesystem in background
      uninstallCommunityPlugin(pluginId).catch((err) => {
        console.warn("[Marketplace] Background vault remove:", err);
      });
    } catch (err) {
      console.error("[Marketplace] Uninstall failed:", err);
    } finally {
      setLoadingPluginId(null);
    }
  };

  // 0ms Instant Toggle Handler
  const handleToggle = async (pluginId: string) => {
    const isCurrentlyActive = installedMap.get(pluginId)?.status === "active";
    await pluginManager.togglePlugin(pluginId);
    showToast(
      isCurrentlyActive ? "Extension disabled" : "Extension enabled & ready",
      isCurrentlyActive ? "⏸️" : "✓"
    );
  };

  // Helper to check if key is currently physically pressed
  const isKeyPressed = (key: string) => pressedKeys.has(key.toUpperCase());

  if (!isOpen) return null;

  return (
    <div className="marketplace-backdrop" onClick={onClose}>
      <div className="marketplace-modal" onClick={(e) => e.stopPropagation()}>
        {/* Top Bar */}
        <div className="marketplace-topbar">
          <div className="marketplace-brand">
            <div className="marketplace-brand-badge">
              <IconPlugin size={18} />
            </div>
            <div>
              <h2 className="marketplace-brand-title">Extensions & Plugins</h2>
              <p className="marketplace-brand-desc">
                Customize your Excalideck sketchbook with official tools & mouseless navigation
              </p>
            </div>
          </div>
          <button className="marketplace-close-btn" onClick={onClose} title="Close (Esc)">
            ✕
          </button>
        </div>

        {/* Main Split-Pane Container */}
        <div className="marketplace-split-container">
          {/* Left Column: Master List */}
          <div className="marketplace-master-pane">
            <div className="marketplace-search-section">
              <div className="marketplace-search-wrapper">
                <IconSearch size={14} />
                <input
                  type="text"
                  placeholder="Search extensions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="marketplace-search-input"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* View Switcher Pills */}
              <div className="marketplace-view-pills">
                <button
                  className={`marketplace-view-pill ${activeView === "discover" ? "active" : ""}`}
                  onClick={() => setActiveView("discover")}
                >
                  <span>Discover</span>
                  <span className="pill-count">{fullCatalog.length}</span>
                </button>
                <button
                  className={`marketplace-view-pill ${activeView === "installed" ? "active" : ""}`}
                  onClick={() => setActiveView("installed")}
                >
                  <span>Installed</span>
                  <span className="pill-count">{installedPlugins.length}</span>
                </button>
              </div>
            </div>

            {/* Plugin List */}
            <div className="marketplace-list">
              {filteredPlugins.length > 0 ? (
                filteredPlugins.map((p) => {
                  const isSelected = selectedPlugin?.id === p.id;
                  const isInstalled = installedMap.has(p.id);
                  const isActive = installedMap.get(p.id)?.status === "active";

                  return (
                    <div
                      key={p.id}
                      className={`marketplace-item-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedId(p.id)}
                    >
                      <div className="item-icon-box">
                        <IconKeyboard size={18} />
                      </div>

                      <div className="item-meta">
                        <div className="item-header-row">
                          <h4 className="item-name">{p.name}</h4>
                          {isInstalled && (
                            <span className={`item-status-dot ${isActive ? "active" : "off"}`} title={isActive ? "Active" : "Disabled"} />
                          )}
                        </div>
                        <div className="item-author-tag">
                          <span>{p.author}</span>
                          {p.type === "official" && <span className="item-verified-badge">✓</span>}
                        </div>
                        <p className="item-snippet">{p.description}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                  No extensions found
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detail Pane */}
          {selectedPlugin ? (
            <div className="marketplace-detail-pane">
              {/* Hero Header */}
              <div className="detail-hero-section">
                <div className="detail-large-icon">
                  <IconKeyboard size={28} />
                </div>

                <div className="detail-hero-info">
                  <div className="detail-title-row">
                    <h3 className="detail-title">{selectedPlugin.name}</h3>
                    {selectedPlugin.type === "official" && (
                      <span className="detail-official-pill">
                        <IconCheck size={11} /> Official
                      </span>
                    )}
                  </div>
                  <p className="detail-subtitle">{selectedPlugin.description}</p>
                </div>

                {/* Primary Action Controls */}
                <div className="detail-actions-bar">
                  {installedMap.has(selectedPlugin.id) ? (
                    <>
                      {/* iOS Style Switch Toggle */}
                      <div
                        className="ios-switch-container"
                        onClick={() => handleToggle(selectedPlugin.id)}
                        title={
                          installedMap.get(selectedPlugin.id)?.status === "active"
                            ? "Click to disable"
                            : "Click to enable"
                        }
                      >
                        <div
                          className={`ios-switch ${
                            installedMap.get(selectedPlugin.id)?.status === "active" ? "on" : ""
                          }`}
                        >
                          <div className="ios-switch-thumb" />
                        </div>
                        <span className="ios-switch-label">
                          {installedMap.get(selectedPlugin.id)?.status === "active" ? "Active" : "Disabled"}
                        </span>
                      </div>

                      {/* Uninstall Button */}
                      <button
                        className="detail-uninstall-btn"
                        onClick={() => handleUninstall(selectedPlugin.id)}
                        title="Uninstall Extension"
                      >
                        <IconTrash size={14} />
                      </button>
                    </>
                  ) : (
                    <button
                      className="detail-install-btn"
                      disabled={loadingPluginId === selectedPlugin.id}
                      onClick={() => handleInstall(selectedPlugin)}
                    >
                      <IconDownload size={14} />
                      <span>{loadingPluginId === selectedPlugin.id ? "Installing..." : "Install Extension"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Detail Content Body */}
              <div className="detail-content-body">
                {/* Stats Bar */}
                <div className="detail-stats-bar">
                  <div className="stat-block">
                    <span className="stat-label">Category</span>
                    <span className="stat-val">{selectedPlugin.category}</span>
                  </div>
                  <div className="stat-block">
                    <span className="stat-label">Rating</span>
                    <span className="stat-val" style={{ color: "#eab308" }}>
                      <IconStar size={13} /> {selectedPlugin.stars}
                    </span>
                  </div>
                  <div className="stat-block">
                    <span className="stat-label">Downloads</span>
                    <span className="stat-val">{selectedPlugin.downloads.toLocaleString()}</span>
                  </div>
                  <div className="stat-block">
                    <span className="stat-label">Version</span>
                    <span className="stat-val">v{selectedPlugin.version}</span>
                  </div>
                </div>

                {/* Interactive Keycap Visualizer (Real-Time Physical Keypress Tester) */}
                {selectedPlugin.id === "excalideck.ghost-keys" && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <span style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)" }}>
                        🎮 Live Modal Key Tester (Press keys on keyboard)
                      </span>
                      <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 600 }}>
                        ● Live Input Active
                      </span>
                    </div>

                    <div className="shortcuts-grid">
                      <div className="shortcut-card">
                        <span className="shortcut-desc">Toggle Nav Mode</span>
                        <div className="keycaps-group">
                          <kbd className={`keycap ${isKeyPressed("ESCAPE") ? "pressed" : ""}`}>Escape</kbd>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>/</span>
                          <kbd className={`keycap ${isKeyPressed("ALT") ? "pressed" : ""}`}>Alt</kbd>
                          <kbd className={`keycap ${isKeyPressed("K") ? "pressed" : ""}`}>K</kbd>
                        </div>
                      </div>

                      <div className="shortcut-card">
                        <span className="shortcut-desc">Exit to Draw Mode</span>
                        <div className="keycaps-group">
                          <kbd className={`keycap ${isKeyPressed("I") ? "pressed" : ""}`}>i</kbd>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>/</span>
                          <kbd className={`keycap ${isKeyPressed("ENTER") ? "pressed" : ""}`}>Enter</kbd>
                        </div>
                      </div>

                      <div className="shortcut-card">
                        <span className="shortcut-desc">Pan Canvas (Nav Mode)</span>
                        <div className="keycaps-group">
                          <kbd className={`keycap ${isKeyPressed("H") ? "pressed" : ""}`}>H</kbd>
                          <kbd className={`keycap ${isKeyPressed("J") ? "pressed" : ""}`}>J</kbd>
                          <kbd className={`keycap ${isKeyPressed("K") ? "pressed" : ""}`}>K</kbd>
                          <kbd className={`keycap ${isKeyPressed("L") ? "pressed" : ""}`}>L</kbd>
                        </div>
                      </div>

                      <div className="shortcut-card">
                        <span className="shortcut-desc">Cycle Selection</span>
                        <div className="keycaps-group">
                          <kbd className={`keycap ${isKeyPressed("TAB") && !isKeyPressed("SHIFT") ? "pressed" : ""}`}>
                            Tab
                          </kbd>
                          <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>/</span>
                          <kbd className={`keycap ${isKeyPressed("TAB") && isKeyPressed("SHIFT") ? "pressed" : ""}`}>
                            ⇧ Tab
                          </kbd>
                        </div>
                      </div>

                      <div className="shortcut-card">
                        <span className="shortcut-desc">Spawn Shapes</span>
                        <div className="keycaps-group">
                          <kbd className={`keycap ${isKeyPressed("R") ? "pressed" : ""}`}>R</kbd>
                          <kbd className={`keycap ${isKeyPressed("O") ? "pressed" : ""}`}>O</kbd>
                          <kbd className={`keycap ${isKeyPressed("D") ? "pressed" : ""}`}>D</kbd>
                          <kbd className={`keycap ${isKeyPressed("T") ? "pressed" : ""}`}>T</kbd>
                        </div>
                      </div>

                      <div className="shortcut-card">
                        <span className="shortcut-desc">Clone / Delete</span>
                        <div className="keycaps-group">
                          <kbd className={`keycap ${isKeyPressed("C") ? "pressed" : ""}`}>C</kbd>
                          <kbd className={`keycap ${isKeyPressed("X") || isKeyPressed("DELETE") ? "pressed" : ""}`}>X</kbd>
                        </div>
                      </div>

                      <div className="shortcut-card">
                        <span className="shortcut-desc">Zoom / Fit to Content</span>
                        <div className="keycaps-group">
                          <kbd className={`keycap ${isKeyPressed("+") || isKeyPressed("=") ? "pressed" : ""}`}>+</kbd>
                          <kbd className={`keycap ${isKeyPressed("-") || isKeyPressed("_") ? "pressed" : ""}`}>-</kbd>
                          <kbd className={`keycap ${isKeyPressed("0") ? "pressed" : ""}`}>0</kbd>
                          <kbd className={`keycap ${isKeyPressed("Z") ? "pressed" : ""}`}>Z</kbd>
                        </div>
                      </div>

                      <div className="shortcut-card">
                        <span className="shortcut-desc">Nudge Selected Shape</span>
                        <div className="keycaps-group">
                          <kbd className={`keycap ${isKeyPressed("ARROWLEFT") ? "pressed" : ""}`}>←</kbd>
                          <kbd className={`keycap ${isKeyPressed("ARROWUP") ? "pressed" : ""}`}>↑</kbd>
                          <kbd className={`keycap ${isKeyPressed("ARROWDOWN") ? "pressed" : ""}`}>↓</kbd>
                          <kbd className={`keycap ${isKeyPressed("ARROWRIGHT") ? "pressed" : ""}`}>→</kbd>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Permissions Section */}
                {selectedPlugin.permissions.length > 0 && (
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", marginBottom: "8px" }}>
                      Required Permissions
                    </div>
                    <div className="permissions-pills">
                      {selectedPlugin.permissions.map((perm) => (
                        <span key={perm} className="perm-badge">
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Author / Repo Links */}
                {selectedPlugin.homepage && (
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--text-muted)", marginBottom: "8px" }}>
                      Developer
                    </div>
                    <a
                      href={selectedPlugin.homepage}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        fontSize: "12.5px",
                        color: "var(--accent-color)",
                        textDecoration: "none",
                        fontWeight: 500,
                      }}
                    >
                      <IconExternalLink size={13} />
                      <span>{selectedPlugin.author} on GitHub</span>
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)" }}>
              Select an extension to view details
            </div>
          )}
        </div>

        {/* Floating Toast Notification */}
        {toast && (
          <div className="marketplace-toast">
            <span>{toast.icon}</span>
            <span>{toast.text}</span>
          </div>
        )}
      </div>
    </div>
  );
};
