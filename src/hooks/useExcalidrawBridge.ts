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

  const performSave = useCallback(
    async (elements: readonly any[], appState: any, files: any) => {
      const file = currentFileRef.current;
      if (!file || isSwitchingRef.current) return;
      try {
        const content = serializeAsJSON(elements as any, appState, files, "local");
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

  const loadFile = useCallback(
    async (path: string) => {
      if (path === currentFileRef.current) return;

      isSwitchingRef.current = true;
      try {
        // 1. Flush any pending save for current file
        await flush();

        // 2. Read new drawing from backend
        const data: DrawingData = await readDrawing(path);
        const parsed = JSON.parse(data.content);
        const elements = parsed.elements || [];
        const appState = parsed.appState || {};
        const files = parsed.files || {};

        lastSavedContentRef.current = data.content;
        currentFileRef.current = path;
        setCurrentFile(path);

        // 3. Update scene in-place if Excalidraw API is already mounted
        if (excalidrawAPIRef.current) {
          excalidrawAPIRef.current.updateScene({
            elements,
            appState: { ...appState, isLoading: false },
            files,
            commitToHistory: false,
          });
          excalidrawAPIRef.current.history?.clear();
          excalidrawAPIRef.current.scrollToContent(elements, { fitToViewport: true });
        } else {
          // First load before Excalidraw mounts
          setInitialData({ elements, appState, files });
        }
      } catch (e) {
        console.error("Failed to load file", e);
        cancel();
      } finally {
        isSwitchingRef.current = false;
      }
    },
    [flush, cancel]
  );

  const closeFile = useCallback(async () => {
    await flush();
    setCurrentFile(null);
    currentFileRef.current = null;
    setInitialData(null);
    lastSavedContentRef.current = "";
    if (excalidrawAPIRef.current) {
      excalidrawAPIRef.current.resetScene();
    }
  }, [flush]);

  return {
    currentFile,
    initialData,
    loadFile,
    closeFile,
    triggerSave,
    setExcalidrawAPI,
  };
};
