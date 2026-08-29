import React from "react";
import { createRoot, Root } from "react-dom/client";
import type { ExcalideckPlugin, PluginContext } from "../../types";
import { HabitDataStore, HabitDefinition } from "./types";
import { loadStore, saveStore, calculateStats, formatDateISO } from "./storage";
import { generateHabitTrackerElements } from "./generator";
import { getCellColor } from "./palettes";
import { HeatmapView } from "./HeatmapView";
import { FloatingCellEditor } from "./FloatingCellEditor";
import { IconFlame } from "../../../components/common/Icons";

export const habitTrackerPlugin: ExcalideckPlugin = {
  async activate(context: PluginContext) {
    let store: HabitDataStore = await loadStore(context.storage);
    let sidebarUpdateTrigger: (() => void) | null = null;


    const getActiveTheme = (): "dark" | "light" => {
      const canvasTheme = (context.canvas.getAppState() as any)?.theme;
      if (canvasTheme === "dark" || canvasTheme === "light") return canvasTheme;
      const appTheme = context.app.getTheme();
      if (appTheme === "dark" || appTheme === "light") return appTheme;
      if (typeof document !== "undefined") {
        const docTheme = document.documentElement.getAttribute("data-theme");
        if (docTheme === "dark" || docTheme === "light") return docTheme;
      }
      return "dark";
    };

    // Portal container for floating popovers over canvas
    const portalId = "excalideck-habit-tracker-canvas-portal";
    let portalDiv = document.getElementById(portalId);
    if (!portalDiv) {
      portalDiv = document.createElement("div");
      portalDiv.id = portalId;
      document.body.appendChild(portalDiv);
    }
    let portalRoot: Root | null = createRoot(portalDiv);

    // Track active canvas popup state
    let activeCanvasPopup: {
      dateStr: string;
      hours: number;
      note?: string;
      habitId: string;
      targetHours: number;
      elementId: string;
      screenPos: { x: number; y: number };
    } | null = null;

    const renderCanvasPopup = () => {
      if (!portalRoot) return;
      if (!activeCanvasPopup) {
        portalRoot.render(null);
        return;
      }

      const activeHabit =
        store.habits.find((h) => h.id === activeCanvasPopup!.habitId) || store.habits[0];
      const theme = getActiveTheme();

      portalRoot.render(
        <FloatingCellEditor
          dateStr={activeCanvasPopup.dateStr}
          initialHours={activeCanvasPopup.hours}
          initialNote={activeCanvasPopup.note}
          targetHours={activeCanvasPopup.targetHours || activeHabit.targetHoursPerDay || 4}
          colorTheme={activeHabit.colorTheme}
          theme={theme}
          screenPos={activeCanvasPopup.screenPos}
          habitName={activeHabit.name}
          onSave={(newHours, newNote) => {
            if (!activeCanvasPopup) return;
            const { dateStr, habitId, elementId } = activeCanvasPopup;

            // 1. Update persistent store
            const habitLogs = { ...(store.logs[habitId] || {}) };
            if (newHours <= 0) {
              delete habitLogs[dateStr];
            } else {
              habitLogs[dateStr] = {
                date: dateStr,
                hours: newHours,
                note: newNote,
                updatedAt: Date.now(),
              };
            }
            store = {
              ...store,
              logs: { ...store.logs, [habitId]: habitLogs },
            };
            saveStore(context.storage, store);

            // 2. Update Canvas shape in real time
            const elements = Array.from(context.canvas.getElements() || []);
            const targetEl = elements.find((el: any) => el.id === elementId);
            if (targetEl) {
              const currentTheme = getActiveTheme();
              const colors = getCellColor(newHours, activeHabit.targetHoursPerDay, activeHabit.colorTheme, currentTheme);

              const updatedElements = elements.map((el: any) => {
                if (el.id === elementId) {
                  return {
                    ...el,
                    backgroundColor: colors.bg,
                    strokeColor: colors.border,
                    customData: {
                      ...el.customData,
                      hours: newHours,
                      note: newNote,
                    },
                    version: (el.version || 1) + 1,
                    versionNonce: Math.floor(Math.random() * 100000),
                  };
                }
                return el;
              });

              context.canvas.updateScene({
                elements: updatedElements,
                commitToHistory: true,
              });
            }

            // 3. Update UI views
            if (sidebarUpdateTrigger) sidebarUpdateTrigger();

            activeCanvasPopup = null;

            renderCanvasPopup();
          }}
          onClose={() => {
            activeCanvasPopup = null;
            renderCanvasPopup();
          }}
        />
      );
    };

    const getViewportCenter = () => {
      const appState = context.canvas.getAppState() || {};
      const zoom = appState.zoom?.value ?? appState.zoom ?? 1;
      const scrollX = appState.scrollX ?? 0;
      const scrollY = appState.scrollY ?? 0;
      const width = window.innerWidth || 1200;
      const height = window.innerHeight || 800;
      return {
        x: Math.round(-scrollX + width / 2 / zoom),
        y: Math.round(-scrollY + height / 2 / zoom),
      };
    };

    // Insert Habit Tracker Grid onto Canvas
    const insertHabitTracker = (
      habit: HabitDefinition,
      startDateStr: string,
      endDateStr: string
    ) => {
      const { x, y } = getViewportCenter();
      const theme = getActiveTheme();
      const logs = store.logs[habit.id] || {};

      const newElements = generateHabitTrackerElements({
        habit,
        logs,
        startDate: startDateStr,
        endDate: endDateStr,
        centerX: x,
        centerY: y,
        theme,
      });

      const current = Array.from(context.canvas.getElements() || []);
      const selectedElementIds: Record<string, boolean> = {};
      newElements.forEach((el) => {
        selectedElementIds[el.id] = true;
      });

      context.canvas.updateScene({
        elements: [...current, ...newElements],
        appState: { ...context.canvas.getAppState(), selectedElementIds },
        commitToHistory: true,
      });

      context.logger.info(`Inserted habit tracker for ${habit.name}`);
    };

    // Sync existing canvas shapes with store
    const syncCanvasElements = (habit: HabitDefinition) => {
      const elements = Array.from(context.canvas.getElements() || []);
      const logs = store.logs[habit.id] || {};
      const theme = getActiveTheme();

      let changedCount = 0;
      const updatedElements = elements.map((el: any) => {
        if (
          el.customData?.plugin === "habit-tracker" &&
          el.customData?.role === "cell" &&
          el.customData?.habitId === habit.id
        ) {
          const dateStr = el.customData.date;
          const currentHours = logs[dateStr]?.hours || 0;
          const currentNote = logs[dateStr]?.note;
          const colors = getCellColor(currentHours, habit.targetHoursPerDay, habit.colorTheme, theme);

          if (el.backgroundColor !== colors.bg || el.customData.hours !== currentHours) {
            changedCount++;
            return {
              ...el,
              backgroundColor: colors.bg,
              strokeColor: colors.border,
              customData: {
                ...el.customData,
                hours: currentHours,
                note: currentNote,
              },
              version: (el.version || 1) + 1,
              versionNonce: Math.floor(Math.random() * 100000),
            };
          }
        }
        return el;
      });

      if (changedCount > 0) {
        context.canvas.updateScene({
          elements: updatedElements,
          commitToHistory: true,
        });
        context.logger.info(`Synced ${changedCount} habit cells on canvas`);
      }
    };

    // Listen to canvas selection changes to trigger cell popup
    let lastSelectedCellId: string | null = null;

    context.canvas.onCanvasChange((elements, appState) => {
      const selectedIds = Object.keys(appState?.selectedElementIds || {}).filter(
        (id) => appState.selectedElementIds[id]
      );

      if (selectedIds.length === 1) {
        const selectedId = selectedIds[0];
        if (selectedId !== lastSelectedCellId) {
          lastSelectedCellId = selectedId;
          const selectedEl = elements.find((el: any) => el.id === selectedId);

          if (
            selectedEl &&
            selectedEl.customData?.plugin === "habit-tracker" &&
            selectedEl.customData?.role === "cell"
          ) {
            const dateStr = selectedEl.customData.date;
            const habitId = selectedEl.customData.habitId;
            const targetHours = selectedEl.customData.targetHours;
            const hours = selectedEl.customData.hours || 0;
            const note = selectedEl.customData.note;

            const zoom = appState.zoom?.value ?? appState.zoom ?? 1;
            const scrollX = appState.scrollX ?? 0;
            const scrollY = appState.scrollY ?? 0;

            const screenX = (selectedEl.x + scrollX) * zoom + (selectedEl.width * zoom) / 2;
            const screenY = (selectedEl.y + scrollY) * zoom;

            activeCanvasPopup = {
              dateStr,
              hours,
              note,
              habitId,
              targetHours,
              elementId: selectedId,
              screenPos: { x: screenX, y: screenY },
            };
            renderCanvasPopup();
          }
        }
      } else if (selectedIds.length === 0 && lastSelectedCellId !== null) {
        lastSelectedCellId = null;
      }
    });

    // 1. Sidebar Panel Component Wrapper
    const SidebarWrapper: React.FC = () => {
      const [, setTick] = React.useState(0);
      sidebarUpdateTrigger = () => setTick((t) => t + 1);

      return (
        <HeatmapView
          store={store}
          theme={getActiveTheme()}
          onUpdateStore={(newStore) => {
            store = newStore;
            saveStore(context.storage, store);
            if (sidebarUpdateTrigger) sidebarUpdateTrigger();
            const activeH = store.habits.find((h) => h.id === store.activeHabitId) || store.habits[0];
            syncCanvasElements(activeH);
          }}
          onInsertToCanvas={insertHabitTracker}
          onSyncCanvas={syncCanvasElements}
        />
      );
    };

    // Register UI Contributions
    context.ui.registerSidebarPanel({
      id: "habit-tracker-panel",
      title: "Habit Tracker",
      icon: "activity",
      render: () => <SidebarWrapper />,
    });

    // Register Commands

    context.commands.register("habit-tracker.insert", () => {
      const activeH = store.habits.find((h) => h.id === store.activeHabitId) || store.habits[0];
      const curYear = new Date().getFullYear();
      const s = activeH.startDate || `${curYear}-01-01`;
      const e = activeH.endDate || `${curYear}-12-31`;
      insertHabitTracker(activeH, s, e);
    });


    context.logger.info("Habit Tracker plugin activated successfully!");
  },

  deactivate() {
    const portalDiv = document.getElementById("excalideck-habit-tracker-canvas-portal");
    if (portalDiv) {
      portalDiv.remove();
    }
  },
};
