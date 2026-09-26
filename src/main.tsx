import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DialogProvider } from "./context/DialogContext";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import "./index.css";
// Set asset path for Excalidraw fonts and dynamic resources
if (typeof window !== "undefined") {
  (window as any).EXCALIDRAW_ASSET_PATH = "/";
  if ("fonts" in document) {
    Promise.all([
      document.fonts.load("20px Virgil"),
      document.fonts.load("20px Excalifont"),
      document.fonts.load("20px Cascadia"),
    ]).catch(() => {});
  }
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <DialogProvider>
        <App />
      </DialogProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

