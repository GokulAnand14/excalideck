import { useState, useCallback, useRef } from "react";
import { DrawingData } from "../types/drawing";
import { readDrawing, saveDrawing } from "../lib/tauri";
import { useAutoSave } from "./useAutoSave";
import { serializeAsJSON } from "@excalidraw/excalidraw";

export interface ExcalidrawInitialData {
  elements: any[];
  appState: Record<string, any>;
  files: Record<string, any>;
}

export const useExcalidrawBridge = () => {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<ExcalidrawInitialData | null>(null);
  const currentFileRef = useRef<string | null>(null);
  const excalidrawAPIRef = useRef<any>(null);
  const isSwitchingRef = useRef<boolean>(false);
  const lastSavedContentRef = useRef<string>("");
  const loadIdRef = useRef<number>(0);

  const performSave = useCallback(
    async (elements: readonly any[], appState: any, files: any) => {
      const file = currentFileRef.current;
      if (!file || isSwitchingRef.current) return;
      try {
        // Merge files from callback and excalidrawAPI instance if available
        const apiFiles = excalidrawAPIRef.current?.getFiles() || {};
        const mergedFiles = { ...apiFiles, ...(files || {}) };

        // Only retain binary files that are actually referenced by image elements in the current scene
        const referencedFileIds = new Set(
          (elements || [])
            .filter((el: any) => el && el.type === "image" && el.fileId)
            .map((el: any) => el.fileId)
        );
        const relevantFiles: Record<string, any> = {};
        for (const fileId of referencedFileIds) {
          if (mergedFiles[fileId]) {
            relevantFiles[fileId] = mergedFiles[fileId];
          }
        }

        const content = serializeAsJSON(elements as any, appState, relevantFiles, "local");

        // Skip disk write if content is unchanged
        if (content === lastSavedContentRef.current) return;
        lastSavedContentRef.current = content;
        await saveDrawing(file, content);
      } catch (e) {
        console.error("Failed to save file", e);
      }
    },
    []
  );

  const { triggerSave, flush, cancel } = useAutoSave(performSave);

  const setExcalidrawAPI = useCallback((api: any) => {
    excalidrawAPIRef.current = api;
  }, []);

  const safeTriggerSave = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      if (isSwitchingRef.current || !currentFileRef.current) return;
      triggerSave(elements, appState, files);
    },
    [triggerSave]
  );

  const loadFile = useCallback(
    async (path: string) => {
      if (path === currentFileRef.current) return;

      const thisLoadId = ++loadIdRef.current;

      try {
        // 1. Flush any pending save for current file BEFORE marking switching
        await flush();

        // 2. Activate switching guard and cancel any lingering debounce timer
        isSwitchingRef.current = true;
        cancel();

        // 3. Read new drawing from backend
        const data: DrawingData = await readDrawing(path);

        // Discard stale load requests if another loadFile was invoked concurrently
        if (thisLoadId !== loadIdRef.current) return;

        const parsed = JSON.parse(data.content);
        const elements = parsed.elements || [];
        const appState = parsed.appState || {};
        const files = parsed.files || {};

        lastSavedContentRef.current = data.content;
        currentFileRef.current = path;
        setCurrentFile(path);

        const hasElements = Array.isArray(elements) && elements.length > 0;
        const rawZoom = appState?.zoom?.value ?? appState?.zoom;
        const validZoom =
          typeof rawZoom === "number" && !isNaN(rawZoom) && rawZoom > 0
            ? Math.min(Math.max(rawZoom, 0.1), 3.0)
            : 1;

        const currentTheme =
          excalidrawAPIRef.current?.getAppState?.()?.theme || appState.theme || "dark";

        const cleanAppState: Record<string, any> = {
          ...appState,
          isLoading: false,
          theme: currentTheme,
          zoom: { value: validZoom },
          scrollX: typeof appState.scrollX === "number" ? appState.scrollX : 0,
          scrollY: typeof appState.scrollY === "number" ? appState.scrollY : 0,
          selectedElementIds: {},
          selectedGroupIds: {},
          editingLinearElement: null,
          editingElement: null,
        };

        // Always keep initialData updated in state so fresh mounts have the correct data
        setInitialData({ elements, appState: cleanAppState, files });

        // 4. Update scene in-place if Excalidraw API is already mounted
        if (excalidrawAPIRef.current) {
          // CRITICAL: Feed binary files to Excalidraw's binary file cache first!
          const fileValues = Object.values(files).filter(Boolean) as any[];
          if (fileValues.length > 0) {
            excalidrawAPIRef.current.addFiles(fileValues);
          }

          excalidrawAPIRef.current.updateScene({
            elements,
            appState: cleanAppState,
            commitToHistory: false,
          });
          excalidrawAPIRef.current.history?.clear();

          // If note has elements but no previous scroll coordinates, center it without zooming past 100%
          if (hasElements && appState.scrollX === undefined && appState.scrollY === undefined) {
            excalidrawAPIRef.current.scrollToContent(elements, {
              fitToViewport: false,
              maxZoom: 1,
              animate: false,
            });
          }
        }
      } catch (e) {
        console.error(`[useExcalidrawBridge] Failed to load drawing "${path}":`, e);
        cancel();
      } finally {
        // Keep switching guard active briefly so Excalidraw's initial onChange from updateScene is ignored
        setTimeout(() => {
          if (thisLoadId === loadIdRef.current) {
            isSwitchingRef.current = false;
          }
        }, 150);
      }
    },
    [flush, cancel]
  );

  const closeFile = useCallback(async () => {
    await flush();
    cancel();
    setCurrentFile(null);
    currentFileRef.current = null;
    setInitialData(null);
    lastSavedContentRef.current = "";
    if (excalidrawAPIRef.current) {
      try {
        excalidrawAPIRef.current.resetScene();
      } catch (e) {
        // ignore
      }
      excalidrawAPIRef.current = null;
    }
  }, [flush, cancel]);

  const getExcalidrawAPI = useCallback(() => {
    return excalidrawAPIRef.current;
  }, []);

  return {
    currentFile,
    initialData,
    loadFile,
    closeFile,
    triggerSave: safeTriggerSave,
    flush,
    setExcalidrawAPI,
    getExcalidrawAPI,
  };
};
