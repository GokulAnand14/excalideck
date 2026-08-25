import { useRef, useCallback, useEffect } from "react";
import { DEBOUNCE_MS } from "../lib/constants";

type SaveCallback = (
  elements: readonly any[],
  appState: any,
  files: any
) => Promise<void> | void;

export const useAutoSave = (saveCallback: SaveCallback) => {
  const timeoutRef = useRef<number | null>(null);
  const pendingDataRef = useRef<{
    elements: readonly any[];
    appState: any;
    files: any;
  } | null>(null);
  const saveCallbackRef = useRef(saveCallback);
  saveCallbackRef.current = saveCallback;

  const flush = useCallback(async () => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (pendingDataRef.current) {
      const data = pendingDataRef.current;
      pendingDataRef.current = null;
      await saveCallbackRef.current(data.elements, data.appState, data.files);
    }
  }, []);

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    pendingDataRef.current = null;
  }, []);

  const triggerSave = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      pendingDataRef.current = { elements, appState, files };

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(async () => {
        timeoutRef.current = null;
        if (pendingDataRef.current) {
          const data = pendingDataRef.current;
          pendingDataRef.current = null;
          await saveCallbackRef.current(data.elements, data.appState, data.files);
        }
      }, DEBOUNCE_MS);
    },
    []
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { triggerSave, flush, cancel };
};
