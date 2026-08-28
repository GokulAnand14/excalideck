import React, { useState, useEffect } from "react";
import type { ExcalideckPlugin, PluginContext } from "../../types";

let globalHandleKeyDown: ((e: KeyboardEvent) => void) | null = null;

export const ghostKeysPlugin: ExcalideckPlugin = {
  activate(context: PluginContext) {
    context.logger.info("GhostKeys Vim-Style Navigation Engine activated!");

    let isNavMode = false;
    const modeListeners = new Set<(active: boolean) => void>();

    const setNavMode = (active: boolean) => {
      isNavMode = active;
      modeListeners.forEach((fn) => {
        try { fn(isNavMode); } catch { /* ignore */ }
      });
    };

    // Check if user is typing in an input, textarea, or Excalidraw text element
    const isTyping = (): boolean => {
      const active = document.activeElement;
      if (!active) return false;
      const tag = active.tagName.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        active.getAttribute("contenteditable") === "true" ||
        active.classList.contains("excalidraw__wysiwyg")
      );
    };

    // Calculate canvas center coordinates based on scroll and zoom
    const getViewportCenter = () => {
      const appState = context.canvas.getAppState() || {};
      const zoom = appState.zoom?.value ?? appState.zoom ?? 1;
      const scrollX = appState.scrollX ?? 0;
      const scrollY = appState.scrollY ?? 0;
      const width = window.innerWidth || 1200;
      const height = window.innerHeight || 800;

      const centerX = -scrollX + (width / 2) / zoom;
      const centerY = -scrollY + (height / 2) / zoom;
      return { x: Math.round(centerX), y: Math.round(centerY), zoom, scrollX, scrollY };
    };

    // Pan canvas viewport
    const panViewport = (dx: number, dy: number) => {
      const appState = context.canvas.getAppState() || {};
      const scrollX = (appState.scrollX ?? 0) + dx;
      const scrollY = (appState.scrollY ?? 0) + dy;
      context.canvas.updateScene({
        appState: { ...appState, scrollX, scrollY },
      });
    };

    // Zoom canvas viewport
    const zoomViewport = (factor: number) => {
      const appState = context.canvas.getAppState() || {};
      const currentZoom = appState.zoom?.value ?? appState.zoom ?? 1;
      const newZoom = Math.min(Math.max(currentZoom * factor, 0.1), 5.0);
      context.canvas.updateScene({
        appState: { ...appState, zoom: { value: newZoom } },
      });
    };

    // Reset zoom
    const resetZoom = () => {
      const appState = context.canvas.getAppState() || {};
      context.canvas.updateScene({
        appState: { ...appState, zoom: { value: 1 } },
      });
    };

    // Cycle element selection
    const cycleSelection = (forward: boolean) => {
      const elements = (context.canvas.getElements() || []).filter((e: any) => !e.isDeleted);
      if (elements.length === 0) return;

      const appState = context.canvas.getAppState() || {};
      const selectedIds = Object.keys(appState.selectedElementIds || {}).filter(
        (id) => appState.selectedElementIds[id]
      );

      let nextIndex = 0;
      if (selectedIds.length > 0) {
        const currentIndex = elements.findIndex((e: any) => e.id === selectedIds[0]);
        if (currentIndex !== -1) {
          nextIndex = forward
            ? (currentIndex + 1) % elements.length
            : (currentIndex - 1 + elements.length) % elements.length;
        }
      }

      const target = elements[nextIndex];
      if (target) {
        context.canvas.updateScene({
          appState: {
            ...appState,
            selectedElementIds: { [target.id]: true },
          },
        });
      }
    };

    // Move / Nudge selected element(s)
    const nudgeSelected = (dx: number, dy: number) => {
      const elements = Array.from(context.canvas.getElements() || []);
      const appState = context.canvas.getAppState() || {};
      const selectedIds = new Set(
        Object.keys(appState.selectedElementIds || {}).filter((id) => appState.selectedElementIds[id])
      );

      if (selectedIds.size === 0) return;

      const updated = elements.map((elem: any) => {
        if (selectedIds.has(elem.id)) {
          return {
            ...elem,
            x: elem.x + dx,
            y: elem.y + dy,
            version: (elem.version || 1) + 1,
            versionNonce: (elem.versionNonce || 1) + 1,
            updated: Date.now(),
          };
        }
        return elem;
      });

      context.canvas.updateScene({
        elements: updated,
        commitToHistory: true,
      });
    };

    // Duplicate selected element(s)
    const duplicateSelected = () => {
      const elements = Array.from(context.canvas.getElements() || []);
      const appState = context.canvas.getAppState() || {};
      const selectedIds = new Set(
        Object.keys(appState.selectedElementIds || {}).filter((id) => appState.selectedElementIds[id])
      );

      if (selectedIds.size === 0) return;

      const newSelected: Record<string, boolean> = {};
      const copies: any[] = [];

      elements.forEach((elem: any) => {
        if (selectedIds.has(elem.id)) {
          const newId = "elem_" + Math.random().toString(36).substring(2, 9);
          copies.push({
            ...elem,
            id: newId,
            x: elem.x + 30,
            y: elem.y + 30,
            seed: Math.floor(Math.random() * 100000),
            version: 1,
            versionNonce: 1,
            updated: Date.now(),
          });
          newSelected[newId] = true;
        }
      });

      context.canvas.updateScene({
        elements: [...elements, ...copies],
        appState: {
          ...appState,
          selectedElementIds: newSelected,
        },
        commitToHistory: true,
      });
    };

    // Delete selected element(s)
    const deleteSelected = () => {
      const elements = Array.from(context.canvas.getElements() || []);
      const appState = context.canvas.getAppState() || {};
      const selectedIds = new Set(
        Object.keys(appState.selectedElementIds || {}).filter((id) => appState.selectedElementIds[id])
      );

      if (selectedIds.size === 0) return;

      const updated = elements.map((elem: any) => {
        if (selectedIds.has(elem.id)) {
          return { ...elem, isDeleted: true };
        }
        return elem;
      });

      context.canvas.updateScene({
        elements: updated,
        appState: {
          ...appState,
          selectedElementIds: {},
        },
        commitToHistory: true,
      });
    };

    // Spawn a basic element at the center of the viewport
    const spawnShape = (type: "rectangle" | "ellipse" | "diamond" | "arrow" | "text" | "line") => {
      const { x, y } = getViewportCenter();
      const elements = Array.from(context.canvas.getElements() || []);
      const appState = context.canvas.getAppState() || {};
      const id = "elem_" + Math.random().toString(36).substring(2, 9);
      const now = Date.now();

      const baseElement: any = {
        id,
        type,
        x: x - 60,
        y: y - 40,
        width: 120,
        height: 80,
        angle: 0,
        strokeColor: appState.theme === "dark" ? "#e0e7ff" : "#1e1e1e",
        backgroundColor: appState.theme === "dark" ? "rgba(99, 102, 241, 0.2)" : "transparent",
        fillStyle: "solid",
        strokeWidth: 2,
        strokeStyle: "solid",
        roughness: 1,
        opacity: 100,
        groupIds: [],
        frameId: null,
        roundness: { type: 3 },
        seed: Math.floor(Math.random() * 100000),
        version: 1,
        versionNonce: 1,
        isDeleted: false,
        boundElements: null,
        updated: now,
        link: null,
        locked: false,
      };

      if (type === "text") {
        baseElement.text = "New Note";
        baseElement.fontSize = 20;
        baseElement.fontFamily = 1;
        baseElement.textAlign = "center";
        baseElement.verticalAlign = "middle";
        baseElement.containerId = null;
        baseElement.originalText = "New Note";
        baseElement.lineHeight = 1.2;
      } else if (type === "arrow" || type === "line") {
        baseElement.points = [[0, 0], [120, 60]];
        baseElement.width = 120;
        baseElement.height = 60;
      }

      elements.push(baseElement);
      context.canvas.updateScene({
        elements,
        appState: {
          ...appState,
          selectedElementIds: { [id]: true },
        },
        commitToHistory: true,
      });
    };

    // Master Keydown Handler
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. If currently typing inside a text input / wysiwyg, ignore Nav Mode toggles
      if (isTyping()) {
        if (e.key === "Escape") {
          // Let Excalidraw finish editing text
          return;
        }
        return;
      }

      // 2. Toggle Navigation Mode with Escape or Alt+K
      if (e.key === "Escape" || (e.altKey && (e.key === "k" || e.key === "K"))) {
        setNavMode(!isNavMode);
        e.preventDefault();
        return;
      }

      // 3. Exit Navigation Mode when pressing 'i' or 'Enter'
      if (isNavMode && (e.key === "i" || e.key === "I" || e.key === "Enter")) {
        setNavMode(false);
        e.preventDefault();
        return;
      }

      // 4. Tab / Shift+Tab: Intercept and cycle canvas elements without escaping to window DOM
      if (e.key === "Tab") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        const active = document.activeElement as HTMLElement | null;
        if (active && active.tagName !== "BODY" && !isTyping()) {
          active.blur();
        }
        cycleSelection(!e.shiftKey);
        return;
      }

      // 5. If NOT in Nav Mode, DO NOT capture single keys so Excalidraw standard shortcuts work 100%
      if (!isNavMode) {
        return;
      }

      // ----------------------------------------------------
      // NAVIGATION MODE ACTIVE: Conflict-Free Vim & Shape Hotkeys
      // ----------------------------------------------------
      const panStep = e.shiftKey ? 180 : 60;
      const nudgeStep = e.shiftKey ? 60 : 20;

      // 1. Vim Movement / Pan (HJKL)
      if (e.key === "h" || e.key === "H") {
        panViewport(panStep, 0);
        e.preventDefault();
      } else if (e.key === "l" || e.key === "L") {
        panViewport(-panStep, 0);
        e.preventDefault();
      } else if (e.key === "k" || e.key === "K") {
        panViewport(0, panStep);
        e.preventDefault();
      } else if (e.key === "j" || e.key === "J") {
        panViewport(0, -panStep);
        e.preventDefault();
      }
      // 2. Arrow Keys: Nudge Selected Shape (or Pan if nothing selected)
      else if (e.key === "ArrowLeft") {
        const appState = context.canvas.getAppState() || {};
        const hasSelection = Object.values(appState.selectedElementIds || {}).some(Boolean);
        if (hasSelection) {
          nudgeSelected(-nudgeStep, 0);
        } else {
          panViewport(panStep, 0);
        }
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        const appState = context.canvas.getAppState() || {};
        const hasSelection = Object.values(appState.selectedElementIds || {}).some(Boolean);
        if (hasSelection) {
          nudgeSelected(nudgeStep, 0);
        } else {
          panViewport(-panStep, 0);
        }
        e.preventDefault();
      } else if (e.key === "ArrowUp") {
        const appState = context.canvas.getAppState() || {};
        const hasSelection = Object.values(appState.selectedElementIds || {}).some(Boolean);
        if (hasSelection) {
          nudgeSelected(0, -nudgeStep);
        } else {
          panViewport(0, panStep);
        }
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        const appState = context.canvas.getAppState() || {};
        const hasSelection = Object.values(appState.selectedElementIds || {}).some(Boolean);
        if (hasSelection) {
          nudgeSelected(0, nudgeStep);
        } else {
          panViewport(0, -panStep);
        }
        e.preventDefault();
      }
      // 3. Selection Cycling via brackets or n/p in Nav Mode
      else if (e.key === "]" || e.key === "n" || e.key === "N") {
        cycleSelection(true);
        e.preventDefault();
      } else if (e.key === "[" || e.key === "p" || e.key === "P") {
        cycleSelection(false);
        e.preventDefault();
      }
      // 4. Shape Spawning (A=Arrow, D=Diamond, R=Rect, O/E=Circle, T=Text)
      else if (e.key === "a" || e.key === "A") {
        spawnShape("arrow");
        e.preventDefault();
      } else if (e.key === "d" || e.key === "D") {
        spawnShape("diamond");
        e.preventDefault();
      } else if (e.key === "r" || e.key === "R") {
        spawnShape("rectangle");
        e.preventDefault();
      } else if (e.key === "o" || e.key === "O" || e.key === "e" || e.key === "E") {
        spawnShape("ellipse");
        e.preventDefault();
      } else if (e.key === "t" || e.key === "T") {
        spawnShape("text");
        setNavMode(false); // Switch to insert mode so user can type immediately
        e.preventDefault();
      }
      // 5. Object Manipulation (Clone / Delete)
      else if (e.key === "c" || e.key === "C") {
        duplicateSelected();
        e.preventDefault();
      } else if (e.key === "x" || e.key === "X" || e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
        e.preventDefault();
      }
      // 6. Zoom & Fit Controls
      else if (e.key === "+" || e.key === "=") {
        zoomViewport(1.15);
        e.preventDefault();
      } else if (e.key === "-" || e.key === "_") {
        zoomViewport(0.85);
        e.preventDefault();
      } else if (e.key === "0") {
        resetZoom();
        e.preventDefault();
      } else if (e.key === "z" || e.key === "Z") {
        context.canvas.scrollToContent?.();
        e.preventDefault();
      }
    };

    globalHandleKeyDown = handleKeyDown;
    window.addEventListener("keydown", handleKeyDown, true);

    // Register Status Bar Item with Live Nav Mode indicator
    context.ui.registerStatusBarItem({
      id: "ghostkeys-indicator",
      render: () => {
        const [active, setActive] = useState(isNavMode);

        useEffect(() => {
          const listener = (newActive: boolean) => setActive(newActive);
          modeListeners.add(listener);
          return () => {
            modeListeners.delete(listener);
          };
        }, []);

        return (
          <div
            onClick={() => setNavMode(!active)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              cursor: "pointer",
              userSelect: "none",
              padding: "2px 7px",
              borderRadius: "4px",
              background: active ? "rgba(129, 140, 248, 0.12)" : "transparent",
              border: active ? "1px solid rgba(129, 140, 248, 0.25)" : "1px solid transparent",
              transition: "all 0.12s ease",
            }}
            title="GhostKeys – Click or press Escape to toggle Navigation Mode"
          >
            {/* Inline keyboard SVG icon — no emoji */}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={active ? "#818cf8" : "currentColor"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: active ? 1 : 0.7, flexShrink: 0 }}>
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
            </svg>
            <span style={{ fontSize: "11px", fontWeight: 600, color: active ? "#818cf8" : "var(--text-secondary)" }}>
              {active ? "NAV" : "GhostKeys"}
            </span>
          </div>
        );
      },
    });

    // Register Floating Glassmorphic HUD Widget
    context.ui.registerStatusBarItem({
      id: "ghostkeys-floating-hud",
      render: () => {
        const [active, setActive] = useState(isNavMode);

        useEffect(() => {
          const listener = (newActive: boolean) => setActive(newActive);
          modeListeners.add(listener);
          return () => {
            modeListeners.delete(listener);
          };
        }, []);

        if (!active) return null;

        return (
          <div
            style={{
              position: "fixed",
              bottom: "44px",
              left: "50%",
              transform: "translateX(-50%)",
              background: "rgba(18, 18, 20, 0.92)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid var(--border-color)",
              borderRadius: "6px",
              padding: "5px 12px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 8px 24px rgba(0, 0, 0, 0.35)",
              color: "var(--text-primary)",
              fontSize: "11px",
              zIndex: 9999,
              userSelect: "none",
              pointerEvents: "auto",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span
                style={{
                  width: "5px",
                  height: "5px",
                  borderRadius: "50%",
                  background: "var(--accent-color)",
                  display: "inline-block",
                }}
              />
              <span style={{ fontWeight: 600, fontSize: "10.5px", letterSpacing: "0.06em", color: "var(--text-primary)" }}>
                NAV
              </span>
            </div>

            <div style={{ height: "10px", width: "1px", background: "var(--border-color)" }} />

            <div style={{ display: "flex", gap: "8px", fontSize: "10.5px", color: "var(--text-secondary)" }}>
              <span><strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>HJKL</strong> Pan</span>
              <span><strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>Tab</strong> Cycle</span>
              <span><strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>R/O/D/A</strong> Spawn</span>
              <span><strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>C/X</strong> Clone/Del</span>
              <span><strong style={{ color: "var(--text-primary)", fontWeight: 600 }}>Z</strong> Fit</span>
            </div>

            <div style={{ height: "10px", width: "1px", background: "var(--border-color)" }} />

            <button
              onClick={() => setNavMode(false)}
              style={{
                background: "transparent",
                border: "1px solid var(--border-color)",
                color: "var(--text-muted)",
                padding: "1px 6px",
                borderRadius: "3px",
                fontSize: "9.5px",
                cursor: "pointer",
                fontWeight: 600,
                letterSpacing: "0.02em",
                transition: "all 0.1s ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "var(--text-primary)";
                e.currentTarget.style.borderColor = "var(--text-muted)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "var(--text-muted)";
                e.currentTarget.style.borderColor = "var(--border-color)";
              }}
            >
              ESC
            </button>
          </div>
        );
      },
    });

    // Register Sidebar Panel
    context.ui.registerSidebarPanel({
      id: "ghostkeys-panel",
      title: "GhostKeys",
      icon: "keyboard",
      render: () => {
        const [active, setActive] = useState(isNavMode);

        useEffect(() => {
          const listener = (newActive: boolean) => setActive(newActive);
          modeListeners.add(listener);
          return () => {
            modeListeners.delete(listener);
          };
        }, []);

        const S = {
          root: {
            display: "flex",
            flexDirection: "column" as const,
            gap: "0px",
            fontSize: "11.5px",
            color: "var(--text-secondary)",
          },
          toggleRow: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "4px 0 8px 0",
          },
          toggleLabel: {
            fontSize: "10px",
            fontWeight: 700,
            color: "var(--text-muted)",
            textTransform: "uppercase" as const,
            letterSpacing: "0.07em",
          },
          toggleSwitch: {
            width: "26px",
            height: "14px",
            borderRadius: "10px",
            background: active ? "var(--accent-color)" : "var(--hover-bg)",
            border: "1px solid var(--border-color)",
            position: "relative" as const,
            cursor: "pointer",
            transition: "all 0.15s ease",
            padding: 0,
            display: "flex",
            alignItems: "center",
            outline: "none",
          },
          toggleSwitchThumb: {
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: active ? "#ffffff" : "var(--text-muted)",
            position: "absolute" as const,
            top: "2px",
            left: active ? "13px" : "2px",
            transition: "left 0.15s ease, background 0.15s ease",
          },
          section: {
            borderTop: "1px solid var(--border-color)",
            paddingTop: "6px",
            marginTop: "2px",
          },
          sectionLabel: {
            fontSize: "9.5px",
            fontWeight: 700,
            textTransform: "uppercase" as const,
            letterSpacing: "0.07em",
            color: "var(--text-muted)",
            marginBottom: "4px",
          },
          row: {
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "2.5px 0",
          },
          kbd: {
            fontFamily: "monospace",
            fontSize: "9.5px",
            fontWeight: 600,
            color: "var(--text-secondary)",
            background: "var(--hover-bg)",
            border: "1px solid var(--border-color)",
            borderBottom: "2px solid var(--border-color)",
            borderRadius: "3px",
            padding: "0px 4px",
            letterSpacing: "0.01em",
            whiteSpace: "nowrap" as const,
          },
          spawnerGrid: {
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px",
          },
          spawnerBtn: {
            padding: "4px 6px",
            background: "transparent",
            border: "1px solid var(--border-color)",
            color: "var(--text-muted)",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "10.5px",
            fontWeight: 500,
            transition: "all 0.1s ease",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          },
          spawnerKey: {
            fontFamily: "monospace",
            fontWeight: 700,
            color: "var(--text-secondary)",
            fontSize: "10px",
          },
        };

        return (
          <div style={S.root}>
            {/* Mode Toggle */}
            <div style={S.toggleRow}>
              <span style={S.toggleLabel}>Nav Mode</span>
              <button
                type="button"
                style={S.toggleSwitch}
                onClick={() => setNavMode(!active)}
                title={active ? "Nav Mode Enabled (Esc to toggle)" : "Nav Mode Disabled (Esc to toggle)"}
                aria-label="Toggle Nav Mode"
              >
                <span style={S.toggleSwitchThumb} />
              </button>
            </div>

            {/* Key Bindings */}
            <div style={S.section}>
              <div style={S.sectionLabel}>Bindings</div>
              {([
                ["Toggle", "Esc / Alt+K"],
                ["Pan",    "H J K L"],
                ["Nudge",  "Arrows"],
                ["Cycle",  "Tab / [ ]"],
                ["Clone / Del", "C / X"],
                ["Zoom / Fit",  "+ - 0 Z"],
              ] as [string, string][]).map(([label, keys]) => (
                <div key={label} style={S.row}>
                  <span>{label}</span>
                  <span style={S.kbd}>{keys}</span>
                </div>
              ))}
            </div>

            {/* Shape Spawner */}
            <div style={{ ...S.section, marginBottom: "4px" }}>
              <div style={S.sectionLabel}>Spawn</div>
              <div style={S.spawnerGrid}>
                {([
                  ["R", "Rect",    "rectangle"],
                  ["O", "Circle",  "ellipse"],
                  ["D", "Diamond", "diamond"],
                  ["A", "Arrow",   "arrow"],
                  ["T", "Text",    "text"],
                ] as [string, string, string][]).map(([key, label, type]) => (
                  <button
                    key={type}
                    style={S.spawnerBtn}
                    onClick={() => {
                      spawnShape(type as any);
                      if (type === "text") setNavMode(false);
                    }}
                  >
                    <span style={S.spawnerKey}>{key}</span>
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      },
    });
  },

  deactivate() {
    if (globalHandleKeyDown) {
      window.removeEventListener("keydown", globalHandleKeyDown, true);
      globalHandleKeyDown = null;
    }
  },
};

