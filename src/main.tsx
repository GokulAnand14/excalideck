import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DialogProvider } from "./context/DialogContext";
import { PluginProvider } from "./plugins/PluginProvider";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import "./index.css";
// Set asset path for Excalidraw fonts and dynamic resources
if (typeof window !== "undefined") {
  (window as any).EXCALIDRAW_ASSET_PATH = "/";
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <DialogProvider>
        <PluginProvider>
          <App />
        </PluginProvider>
      </DialogProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

