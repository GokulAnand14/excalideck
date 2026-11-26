export const APP_NAME = "Excalideck";
export const APP_VERSION_FALLBACK =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "0.3.0";
export const DEBOUNCE_MS = 1000;
export const WORKSPACE_DEBOUNCE_MS = 400;
export const DEFAULT_SIDEBAR_WIDTH = 260;
export const EXCALIDRAW_EXT = ".excalidraw";
export const EXCALIDRAW_LIB_EXT = ".excalidrawlib";

export const isDrawingFileName = (name: string): boolean =>
  /\.excalidraw(lib)?$/i.test(name);

export const stripDrawingExtension = (name: string): string =>
  name.replace(/\.excalidraw(lib)?$/i, "");
