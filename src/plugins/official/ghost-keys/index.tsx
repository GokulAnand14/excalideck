import React, { useState, useEffect } from "react";
import type { ExcalideckPlugin, PluginContext } from "../../types";

let globalHandleKeyDown: ((e: KeyboardEvent) => void) | null = null;

const S = {
  root: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "6px",
    fontSize: "11.5px",
    color: "var(--text-secondary)",
  },
  toggleCard: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "6px 8px",
    background: "var(--hover-bg)",
    borderRadius: "6px",
    border: "1px solid var(--border-subtle)",
    marginBottom: "2px",
  },
  toggleLabel: {
    fontSize: "10.5px",
    fontWeight: 700,
    color: "var(--text-primary)",
    display: "flex",
    alignItems: "center",
    gap: "6px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.06em",
  },
  toggleSwitch: {
    width: "28px",
    height: "16px",
    borderRadius: "10px",
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
    width: "10px",
    height: "10px",
    borderRadius: "50%",
    position: "absolute" as const,
    top: "2px",
    transition: "left 0.15s ease, background 0.15s ease",
  },
  section: {
    borderTop: "1px solid var(--border-color)",
    paddingTop: "5px",
    marginTop: "1px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "2px",
  },
  sectionLabel: {
    fontSize: "9px",
    fontWeight: 700,
    textTransform: "uppercase" as const,
    letterSpacing: "0.07em",
    color: "var(--text-muted)",
    marginBottom: "3px",
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "2px 0",
  },
  rowLabel: {
    fontSize: "11px",
    color: "var(--text-secondary)",
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
    padding: "1px 4px",
    letterSpacing: "0.01em",
    whiteSpace: "nowrap" as const,
  },
  spawnerGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "4px",
    marginTop: "2px",
  },
  spawnerBtn: {
    padding: "4px 4px",
    background: "var(--hover-bg)",
    border: "1px solid var(--border-subtle)",
    color: "var(--text-primary)",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "10.5px",
    fontWeight: 500,
    transition: "all 0.12s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "4px",
  },
  spawnerKey: {
    fontFamily: "monospace",
    fontWeight: 700,
    color: "var(--accent-color)",
    fontSize: "10px",
  },
};

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

    // Resize selected element(s) with points scaling for arrows/lines
    const resizeSelected = (dw: number, dh: number) => {
      const elements = Array.from(context.canvas.getElements() || []);
      const appState = context.canvas.getAppState() || {};
      const selectedIds = new Set(
        Object.keys(appState.selectedElementIds || {}).filter((id) => appState.selectedElementIds[id])
      );

      if (selectedIds.size === 0) return;

      const updated = elements.map((elem: any) => {
        if (selectedIds.has(elem.id)) {
          const oldW = elem.width || 0;
          const oldH = elem.height || 0;
          const newW = Math.max(10, oldW + dw);
          const newH = Math.max(10, oldH + dh);

          let newPoints = elem.points;
          if (Array.isArray(elem.points) && elem.points.length > 0) {
            const scaleX = oldW !== 0 ? newW / oldW : 1;
            const scaleY = oldH !== 0 ? newH / oldH : 1;
            newPoints = elem.points.map(([px, py]: [number, number]) => [
              px * scaleX,
              py * scaleY,
            ]);
          }

          return {
            ...elem,
            width: newW,
            height: newH,
            ...(newPoints ? { points: newPoints } : {}),
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

    // Scale selected element(s) proportionally and scale font size for text elements
    const scaleSelected = (factor: number) => {
      const elements = Array.from(context.canvas.getElements() || []);
      const appState = context.canvas.getAppState() || {};
      const selectedIds = new Set(
        Object.keys(appState.selectedElementIds || {}).filter((id) => appState.selectedElementIds[id])
      );

      if (selectedIds.size === 0) return;

      const updated = elements.map((elem: any) => {
        if (selectedIds.has(elem.id)) {
          const oldW = elem.width || 0;
          const oldH = elem.height || 0;
          const newW = Math.max(10, Math.round(oldW * factor));
          const newH = Math.max(10, Math.round(oldH * factor));

          const extra: Record<string, any> = {};

          if (elem.type === "text" || elem.fontSize !== undefined) {
            const currentFontSize = elem.fontSize || 20;
            extra.fontSize = Math.round(Math.max(10, Math.min(120, currentFontSize * factor)));
          }

          if (Array.isArray(elem.points) && elem.points.length > 0) {
            extra.points = elem.points.map(([px, py]: [number, number]) => [
              px * factor,
              py * factor,
            ]);
          }

          return {
            ...elem,
            width: newW,
            height: newH,
            ...extra,
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

    // Rotate selected element(s)
    const rotateSelected = (deltaDegrees: number) => {
      const elements = Array.from(context.canvas.getElements() || []);
      const appState = context.canvas.getAppState() || {};
      const selectedIds = new Set(
        Object.keys(appState.selectedElementIds || {}).filter((id) => appState.selectedElementIds[id])
      );

      if (selectedIds.size === 0) return;

      const deltaRad = (deltaDegrees * Math.PI) / 180;
      const updated = elements.map((elem: any) => {
        if (selectedIds.has(elem.id)) {
          const currentAngle = elem.angle || 0;
          const angle = (currentAngle + deltaRad) % (2 * Math.PI);
          return {
            ...elem,
            angle,
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

    // Reorder selected element(s) to front or back of canvas array
    const reorderSelected = (direction: "front" | "back") => {
      const elements = Array.from(context.canvas.getElements() || []);
      const appState = context.canvas.getAppState() || {};
      const selectedIds = new Set(
        Object.keys(appState.selectedElementIds || {}).filter((id) => appState.selectedElementIds[id])
      );

      if (selectedIds.size === 0) return;

      const selectedElements: any[] = [];
      const unselectedElements: any[] = [];

      elements.forEach((elem: any) => {
        if (selectedIds.has(elem.id)) {
          selectedElements.push({
            ...elem,
            version: (elem.version || 1) + 1,
            versionNonce: (elem.versionNonce || 1) + 1,
            updated: Date.now(),
          });
        } else {
          unselectedElements.push(elem);
        }
      });

      const updated =
        direction === "front"
          ? [...unselectedElements, ...selectedElements]
          : [...selectedElements, ...unselectedElements];

      context.canvas.updateScene({
        elements: updated,
        commitToHistory: true,
      });
    };

    // Set stroke width for selected element(s)
    const setStrokeWidthSelected = (width: number) => {
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
            strokeWidth: width,
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

      // 2. Alt+K toggles Navigation Mode
      if (e.altKey && (e.key === "k" || e.key === "K")) {
        setNavMode(!isNavMode);
        e.preventDefault();
        return;
      }

      // 3. Tab / Shift+Tab: Intercept and cycle canvas elements without escaping to window DOM
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

      // 4. If NOT in Nav Mode, Escape activates Nav Mode
      if (!isNavMode) {
        if (e.key === "Escape") {
          setNavMode(true);
          e.preventDefault();
        }
        return;
      }

      // ----------------------------------------------------
      // NAVIGATION MODE ACTIVE: Mouseless Controls
      // ----------------------------------------------------
      const appState = context.canvas.getAppState() || {};
      const hasSelection = Object.values(appState.selectedElementIds || {}).some(Boolean);

      // Escape: If hasSelection, clear selection; if !hasSelection, exit Nav Mode
      if (e.key === "Escape") {
        if (hasSelection) {
          context.canvas.updateScene({
            appState: {
              ...appState,
              selectedElementIds: {},
            },
          });
        } else {
          setNavMode(false);
        }
        e.preventDefault();
        return;
      }

      // Exit Navigation Mode when pressing 'i', 'I', or 'Enter'
      if (e.key === "i" || e.key === "I" || e.key === "Enter") {
        setNavMode(false);
        e.preventDefault();
        return;
      }

      const panStep = e.shiftKey ? 180 : 60;
      const nudgeStep = 20;

      // ----------------------------------------------------
      // RESIZE (Shift + Arrows or Shift + H/J/K/L when selected)
      // ----------------------------------------------------
      if (hasSelection && e.shiftKey) {
        if (e.key === "ArrowRight" || e.key === "L" || e.key === "l") {
          resizeSelected(20, 0);
          e.preventDefault();
          return;
        }
        if (e.key === "ArrowLeft" || e.key === "H" || e.key === "h") {
          resizeSelected(-20, 0);
          e.preventDefault();
          return;
        }
        if (e.key === "ArrowDown" || e.key === "J" || e.key === "j") {
          resizeSelected(0, 20);
          e.preventDefault();
          return;
        }
        if (e.key === "ArrowUp" || e.key === "K" || e.key === "k") {
          resizeSelected(0, -20);
          e.preventDefault();
          return;
        }
      }

      // ----------------------------------------------------
      // MOVEMENT / NUDGE / PAN
      // ----------------------------------------------------
      if (e.key === "ArrowLeft") {
        if (hasSelection) {
          nudgeSelected(-nudgeStep, 0);
        } else {
          panViewport(panStep, 0);
        }
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowRight") {
        if (hasSelection) {
          nudgeSelected(nudgeStep, 0);
        } else {
          panViewport(-panStep, 0);
        }
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowUp") {
        if (hasSelection) {
          nudgeSelected(0, -nudgeStep);
        } else {
          panViewport(0, panStep);
        }
        e.preventDefault();
        return;
      }
      if (e.key === "ArrowDown") {
        if (hasSelection) {
          nudgeSelected(0, nudgeStep);
        } else {
          panViewport(0, -panStep);
        }
        e.preventDefault();
        return;
      }

      // Vim HJKL (without Shift, or when nothing selected)
      if (e.key === "h" || (!hasSelection && e.key === "H")) {
        if (hasSelection) {
          nudgeSelected(-nudgeStep, 0);
        } else {
          panViewport(panStep, 0);
        }
        e.preventDefault();
        return;
      }
      if (e.key === "l" || (!hasSelection && e.key === "L")) {
        if (hasSelection) {
          nudgeSelected(nudgeStep, 0);
        } else {
          panViewport(-panStep, 0);
        }
        e.preventDefault();
        return;
      }
      if (e.key === "k" || (!hasSelection && e.key === "K")) {
        if (hasSelection) {
          nudgeSelected(0, -nudgeStep);
        } else {
          panViewport(0, panStep);
        }
        e.preventDefault();
        return;
      }
      if (e.key === "j" || (!hasSelection && e.key === "J")) {
        if (hasSelection) {
          nudgeSelected(0, nudgeStep);
        } else {
          panViewport(0, -panStep);
        }
        e.preventDefault();
        return;
      }

      // ----------------------------------------------------
      // SCALE (when selected)
      // ----------------------------------------------------
      if (hasSelection && (e.key === ">" || e.key === "." || e.key === "+" || e.key === "=")) {
        scaleSelected(1.15);
        e.preventDefault();
        return;
      }
      if (hasSelection && (e.key === "<" || e.key === "," || e.key === "-" || e.key === "_")) {
        scaleSelected(0.85);
        e.preventDefault();
        return;
      }

      // ----------------------------------------------------
      // ROTATE (when selected)
      // ----------------------------------------------------
      if (hasSelection && (e.key === "r" || e.key === "R")) {
        rotateSelected(15);
        e.preventDefault();
        return;
      }

      // ----------------------------------------------------
      // LAYERING / Z-ORDER (when selected) or CYCLE (when nothing selected)
      // ----------------------------------------------------
      if (e.key === "]") {
        if (hasSelection) {
          reorderSelected("front");
        } else {
          cycleSelection(true);
        }
        e.preventDefault();
        return;
      }
      if (e.key === "[") {
        if (hasSelection) {
          reorderSelected("back");
        } else {
          cycleSelection(false);
        }
        e.preventDefault();
        return;
      }
      if (e.key === "n" || e.key === "N") {
        cycleSelection(true);
        e.preventDefault();
        return;
      }
      if (e.key === "p" || e.key === "P") {
        cycleSelection(false);
        e.preventDefault();
        return;
      }

      // ----------------------------------------------------
      // STROKE WIDTH (when selected)
      // ----------------------------------------------------
      if (hasSelection && e.key === "1") {
        setStrokeWidthSelected(1);
        e.preventDefault();
        return;
      }
      if (hasSelection && e.key === "2") {
        setStrokeWidthSelected(2);
        e.preventDefault();
        return;
      }
      if (hasSelection && e.key === "3") {
        setStrokeWidthSelected(4);
        e.preventDefault();
        return;
      }

      // ----------------------------------------------------
      // OBJECT MANIPULATION (Clone / Delete)
      // ----------------------------------------------------
      if (e.key === "c" || e.key === "C") {
        duplicateSelected();
        e.preventDefault();
        return;
      }
      if (e.key === "x" || e.key === "X" || e.key === "Delete" || e.key === "Backspace") {
        deleteSelected();
        e.preventDefault();
        return;
      }

      // ----------------------------------------------------
      // SHAPE SPAWNING (when nothing selected)
      // ----------------------------------------------------
      if (!hasSelection) {
        if (e.key === "r" || e.key === "R") {
          spawnShape("rectangle");
          e.preventDefault();
          return;
        }
        if (e.key === "o" || e.key === "O" || e.key === "e" || e.key === "E") {
          spawnShape("ellipse");
          e.preventDefault();
          return;
        }
        if (e.key === "d" || e.key === "D") {
          spawnShape("diamond");
          e.preventDefault();
          return;
        }
        if (e.key === "a" || e.key === "A") {
          spawnShape("arrow");
          e.preventDefault();
          return;
        }
        if (e.key === "t" || e.key === "T") {
          spawnShape("text");
          setNavMode(false); // Switch to insert mode so user can type immediately
          e.preventDefault();
          return;
        }

        // ----------------------------------------------------
        // ZOOM & FIT (when nothing selected)
        // ----------------------------------------------------
        if (e.key === "+" || e.key === "=") {
          zoomViewport(1.15);
          e.preventDefault();
          return;
        }
        if (e.key === "-" || e.key === "_") {
          zoomViewport(0.85);
          e.preventDefault();
          return;
        }
        if (e.key === "0") {
          resetZoom();
          e.preventDefault();
          return;
        }
        if (e.key === "z" || e.key === "Z") {
          context.canvas.scrollToContent?.();
          e.preventDefault();
          return;
        }
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

        return (
          <div style={S.root}>
            {/* Mode Toggle */}
            <div style={S.toggleCard}>
              <span style={S.toggleLabel}>
                Nav Mode
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "1px 5px",
                    borderRadius: "3px",
                    background: active ? "var(--accent-subtle)" : "transparent",
                    color: active ? "var(--accent-color)" : "var(--text-muted)",
                    border: active ? "1px solid var(--accent-color)" : "1px solid transparent",
                  }}
                >
                  {active ? "ACTIVE" : "OFF"}
                </span>
              </span>
              <button
                type="button"
                style={{
                  ...S.toggleSwitch,
                  background: active ? "var(--accent-color)" : "var(--hover-bg)",
                }}
                onClick={() => setNavMode(!active)}
                title={active ? "Nav Mode Enabled (Esc to toggle)" : "Nav Mode Disabled (Esc to toggle)"}
                aria-label="Toggle Nav Mode"
              >
                <span
                  style={{
                    ...S.toggleSwitchThumb,
                    background: active ? "#ffffff" : "var(--text-muted)",
                    left: active ? "15px" : "2px",
                  }}
                />
              </button>
            </div>

            {/* Move & Pan */}
            <div style={S.section}>
              <div style={S.sectionLabel}>Move & Pan</div>
              <div style={S.row}>
                <span style={S.rowLabel}>Pan / Nudge</span>
                <span style={S.kbd}>HJKL / Arrows</span>
              </div>
            </div>

            {/* Resize & Scale */}
            <div style={S.section}>
              <div style={S.sectionLabel}>Resize & Scale</div>
              <div style={S.row}>
                <span style={S.rowLabel}>Resize (W/H)</span>
                <span style={S.kbd}>⇧ Arrows</span>
              </div>
              <div style={S.row}>
                <span style={S.rowLabel}>Scale (±15%)</span>
                <span style={S.kbd}>&lt; &gt; / + -</span>
              </div>
            </div>

            {/* Rotate & Layer */}
            <div style={S.section}>
              <div style={S.sectionLabel}>Rotate & Layer</div>
              <div style={S.row}>
                <span style={S.rowLabel}>Rotate 15°</span>
                <span style={S.kbd}>⇧ R</span>
              </div>
              <div style={S.row}>
                <span style={S.rowLabel}>Back / Front</span>
                <span style={S.kbd}>[ ]</span>
              </div>
            </div>

            {/* Quick Style */}
            <div style={S.section}>
              <div style={S.sectionLabel}>Quick Style</div>
              <div style={S.row}>
                <span style={S.rowLabel}>Stroke Width</span>
                <span style={S.kbd}>1 2 3</span>
              </div>
            </div>

            {/* Selection */}
            <div style={S.section}>
              <div style={S.sectionLabel}>Selection</div>
              <div style={S.row}>
                <span style={S.rowLabel}>Cycle Items</span>
                <span style={S.kbd}>Tab / ⇧Tab</span>
              </div>
              <div style={S.row}>
                <span style={S.rowLabel}>Deselect / Exit</span>
                <span style={S.kbd}>Esc</span>
              </div>
              <div style={S.row}>
                <span style={S.rowLabel}>Clone / Delete</span>
                <span style={S.kbd}>C / X</span>
              </div>
            </div>

            {/* Shape Spawner */}
            <div style={{ ...S.section, marginBottom: "2px" }}>
              <div style={S.sectionLabel}>Shapes</div>
              <div style={S.spawnerGrid}>
                {([
                  ["R", "Rect",    "rectangle"],
                  ["O", "Circle",  "ellipse"],
                  ["D", "Diamond", "diamond"],
                  ["A", "Arrow",   "arrow"],
                  ["L", "Line",    "line"],
                  ["T", "Text",    "text"],
                ] as const).map(([key, label, type]) => (
                  <button
                    key={type}
                    style={S.spawnerBtn}
                    onClick={() => {
                      spawnShape(type);
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

