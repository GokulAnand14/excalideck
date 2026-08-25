import React, { useEffect, useRef } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import { useDialog } from "../../context/DialogContext";
import { IconFileDrawing, IconNewFile } from "../common/Icons";
import "@excalidraw/excalidraw/index.css";
import "./Canvas.css";

interface InitialData {
  elements: any[];
  appState: Record<string, any>;
  files: Record<string, any>;
}

interface ExcalidrawWrapperProps {
  initialData: InitialData | null;
  theme: "light" | "dark";
  onChange: (elements: readonly any[], appState: any, files: any) => void;
  fileName: string | null;
  onCreateDrawing?: (name: string) => void;
  onAPIMount?: (api: any) => void;
}

export const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({
  initialData,
  theme,
  onChange,
  fileName,
  onCreateDrawing,
  onAPIMount,
}) => {
  const { promptDialog } = useDialog();
  const excalidrawAPIRef = useRef<any>(null);

  const handleQuickCreate = async () => {
    if (onCreateDrawing) {
      const name = await promptDialog({
        title: "Create New Drawing",
        placeholder: "Untitled",
        defaultValue: "Untitled",
        confirmText: "Create",
        icon: "✏️",
      });
      if (name) {
        onCreateDrawing(name);
      }
    }
  };

  const handleAPIMount = (api: any) => {
    excalidrawAPIRef.current = api;
    if (onAPIMount) {
      onAPIMount(api);
    }
  };

  // Sync theme changes to Excalidraw instance
  useEffect(() => {
    if (excalidrawAPIRef.current) {
      excalidrawAPIRef.current.updateScene({
        appState: { theme },
        commitToHistory: false,
      });
    }
  }, [theme]);

  return (
    <div className="canvas-wrapper-root">
      {/* Excalidraw Canvas (Always kept alive in DOM for 0ms switching) */}
      <div className={`canvas-container ${!fileName ? "is-hidden" : ""}`}>
        <Excalidraw
          excalidrawAPI={handleAPIMount}
          initialData={
            initialData
              ? {
                  elements: initialData.elements,
                  appState: {
                    ...initialData.appState,
                    theme,
                    zoom: initialData.appState?.zoom?.value
                      ? initialData.appState.zoom
                      : { value: 1 },
                  },
                  files: initialData.files,
                  scrollToContent: Boolean(
                    initialData.elements &&
                      initialData.elements.length > 0 &&
                      initialData.appState?.scrollX === undefined
                  ),
                }
              : undefined
          }
          theme={theme}
          onChange={onChange}
        >
          <MainMenu>
            <MainMenu.DefaultItems.SaveAsImage />
            <MainMenu.DefaultItems.Export />
            <MainMenu.DefaultItems.ClearCanvas />
            <MainMenu.DefaultItems.ToggleTheme />
            <MainMenu.DefaultItems.ChangeCanvasBackground />
          </MainMenu>
          <WelcomeScreen>
            <WelcomeScreen.Center>
              <WelcomeScreen.Center.Heading>
                Start sketching!
              </WelcomeScreen.Center.Heading>
            </WelcomeScreen.Center>
          </WelcomeScreen>
        </Excalidraw>
      </div>

      {/* Empty State Overlay when no file is selected */}
      {!fileName && (
        <div className="canvas-empty">
          <div className="canvas-empty-card">
            <img src="/logo.png" className="empty-logo-img" alt="Excalideck" />
            <h2>No Drawing Selected</h2>
            <p className="empty-desc">
              Choose a sketch from the sidebar or start a new drawing in your vault.
            </p>
            {onCreateDrawing && (
              <button className="empty-create-btn" onClick={handleQuickCreate}>
                <IconNewFile size={16} />
                <span>Create New Drawing</span>
              </button>
            )}
            <div className="empty-shortcuts">
              <div className="shortcut-item">
                <span className="shortcut-key">Auto-save</span>
                <span className="shortcut-label">Syncs changes to vault</span>
              </div>
              <div className="shortcut-item">
                <span className="shortcut-key">Export</span>
                <span className="shortcut-label">PNG / SVG / JSON</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
