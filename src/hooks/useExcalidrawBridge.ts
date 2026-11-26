import { useState, useCallback, useRef } from "react";
import { DrawingData } from "../types/drawing";
import { ViewportState } from "../types/vault";
import { readDrawing, saveDrawing } from "../lib/tauri";
import { useAutoSave } from "./useAutoSave";
import { serializeAsJSON } from "@excalidraw/excalidraw";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface ExcalidrawInitialData {
  elements: any[];
  appState: Record<string, any>;
  files: Record<string, any>;
  hasSavedViewport?: boolean;
}

export const useExcalidrawBridge = (onError?: (message: string) => void) => {
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<ExcalidrawInitialData | null>(null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const currentFileRef = useRef<string | null>(null);
  const excalidrawAPIRef = useRef<any>(null);
  const isSwitchingRef = useRef<boolean>(false);
  const lastSavedContentRef = useRef<string>("");
  const loadIdRef = useRef<number>(0);
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const getCurrentViewport = useCallback((): ViewportState | null => {
    const api = excalidrawAPIRef.current;
    if (!api?.getAppState) return null;
    const st = api.getAppState();
    const zoom = st?.zoom?.value ?? st?.zoom ?? 1;
    const scrollX = st?.scrollX;
    const scrollY = st?.scrollY;
    if (
      typeof scrollX === "number" &&
      Number.isFinite(scrollX) &&
      typeof scrollY === "number" &&
      Number.isFinite(scrollY) &&
      typeof zoom === "number" &&
      Number.isFinite(zoom) &&
      zoom > 0
    ) {
      return { scrollX, scrollY, zoom };
    }
    return null;
  }, []);

  const performSave = useCallback(
    async (elements: readonly any[], appState: any, files: any) => {
      const file = currentFileRef.current;
      if (!file || isSwitchingRef.current) return;
      try {
        const apiFiles = excalidrawAPIRef.current?.getFiles() || {};
        const mergedFiles = { ...apiFiles, ...(files || {}) };

        // Only retain binary files referenced by active image elements
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

        if (content === lastSavedContentRef.current) {
          setSaveStatus("saved");
          return;
        }
        setSaveStatus("saving");
        await saveDrawing(file, content);
        if (currentFileRef.current === file) {
          lastSavedContentRef.current = content;
          setSaveStatus("saved");
        }
      } catch (e: any) {
        console.error("Failed to save file", e);
        setSaveStatus("error");
        onErrorRef.current?.(`Failed to save "${file}": ${e?.message || e || "Unknown error"}`);
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
      setSaveStatus("saving");
      triggerSave(elements, appState, files);
    },
    [triggerSave]
  );

  const forceSaveNow = useCallback(async () => {
    const file = currentFileRef.current;
    const api = excalidrawAPIRef.current;
    if (!file) return;
    await flush();
    if (api) {
      const elements = api.getSceneElements?.() || [];
      const appState = api.getAppState?.() || {};
      const files = api.getFiles?.() || {};
      await performSave(elements, appState, files);
    }
  }, [flush, performSave]);

  const loadFile = useCallback(
    async (path: string, savedViewport?: ViewportState) => {
      if (path === currentFileRef.current) return true;

      const thisLoadId = ++loadIdRef.current;

      try {
        // 1. Flush any pending save for current file BEFORE switching
        await flush();

        // 2. Read and parse new drawing BEFORE wiping current scene
        const data: DrawingData = await readDrawing(path);
        if (thisLoadId !== loadIdRef.current) return false;

        const parsed = JSON.parse(data.content);
        const elements = Array.isArray(parsed.elements) ? parsed.elements : [];
        const appState = parsed.appState && typeof parsed.appState === "object" ? parsed.appState : {};
        const files = parsed.files && typeof parsed.files === "object" ? parsed.files : {};

        // 3. Activate switching guard & cancel stale timers
        isSwitchingRef.current = true;
        cancel();

        if (excalidrawAPIRef.current) {
          try {
            excalidrawAPIRef.current.resetScene();
          } catch (_) {}
          excalidrawAPIRef.current = null;
        }

        lastSavedContentRef.current = data.content;
        currentFileRef.current = path;
        setCurrentFile(path);
        setSaveStatus("saved");

        const hasSavedViewport = Boolean(
          savedViewport &&
            Number.isFinite(savedViewport.scrollX) &&
            Number.isFinite(savedViewport.scrollY) &&
            Number.isFinite(savedViewport.zoom) &&
            savedViewport.zoom > 0
        );

        const rawZoom = hasSavedViewport
          ? savedViewport!.zoom
          : (appState?.zoom?.value ?? appState?.zoom);
        const validZoom =
          typeof rawZoom === "number" && Number.isFinite(rawZoom) && rawZoom > 0
            ? Math.min(Math.max(rawZoom, 0.1), 10.0)
            : 1;

        const scrollX = hasSavedViewport
          ? savedViewport!.scrollX
          : (typeof appState.scrollX === "number" && Number.isFinite(appState.scrollX) ? appState.scrollX : 0);
        const scrollY = hasSavedViewport
          ? savedViewport!.scrollY
          : (typeof appState.scrollY === "number" && Number.isFinite(appState.scrollY) ? appState.scrollY : 0);

        const cleanAppState: Record<string, any> = {
          ...appState,
          isLoading: false,
          zoom: { value: validZoom },
          scrollX,
          scrollY,
          selectedElementIds: {},
          selectedGroupIds: {},
          editingLinearElement: null,
          editingElement: null,
        };

        setInitialData({
          elements,
          appState: cleanAppState,
          files,
          hasSavedViewport:
            hasSavedViewport ||
            (typeof appState.scrollX === "number" && typeof appState.scrollY === "number"),
        });

        setTimeout(() => {
          if (thisLoadId === loadIdRef.current) {
            isSwitchingRef.current = false;
          }
        }, 180);

        return true;
      } catch (e: any) {
        console.error(`[useExcalidrawBridge] Failed to load drawing "${path}":`, e);
        if (thisLoadId === loadIdRef.current) {
          isSwitchingRef.current = false;
          onErrorRef.current?.(`Could not open "${path}": ${e?.message || e || "Invalid drawing"}`);
        }
        return false;
      }
    },
    [flush, cancel]
  );

  const closeFile = useCallback(async () => {
    await flush();
    cancel();
    isSwitchingRef.current = true;
    setCurrentFile(null);
    currentFileRef.current = null;
    setInitialData(null);
    setSaveStatus("idle");
    lastSavedContentRef.current = "";
    if (excalidrawAPIRef.current) {
      try {
        excalidrawAPIRef.current.resetScene();
      } catch (_) {}
      excalidrawAPIRef.current = null;
    }
    setTimeout(() => {
      isSwitchingRef.current = false;
    }, 150);
  }, [flush, cancel]);

  const isSwitching = useCallback(() => isSwitchingRef.current, []);

  return {
    currentFile,
    initialData,
    saveStatus,
    loadFile,
    closeFile,
    triggerSave: safeTriggerSave,
    flush,
    forceSaveNow,
    setExcalidrawAPI,
    getCurrentViewport,
    isSwitching,
  };
};
