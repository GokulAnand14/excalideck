import { serializeAsJSON } from "@excalidraw/excalidraw";
import { DrawingData } from "../types/drawing";

export const serializeDrawing = (elements: any[], appState: any, files: any): string => {
  return serializeAsJSON(elements, appState, files, "local");
};

export const parseDrawing = (content: string): DrawingData | null => {
  try {
    return JSON.parse(content) as DrawingData;
  } catch {
    return null;
  }
};
