import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DialogProvider } from "./context/DialogContext";
import { PluginProvider } from "./plugins/PluginProvider";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import "./index.css";

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

