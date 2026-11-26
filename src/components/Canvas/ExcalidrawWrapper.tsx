import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Excalidraw, MainMenu, WelcomeScreen } from "@excalidraw/excalidraw";
import { useDialog } from "../../context/DialogContext";
import { IconNewFile } from "../common/Icons";
import { CanvasToolsDock } from "../../tools/CanvasToolsDock";
import { CalendarModal } from "../../tools/calendar/CalendarModal";
import { generateCalendar } from "../../tools/calendar/generator";
import { ExcalidrawInitialData } from "../../hooks/useExcalidrawBridge";
import "@excalidraw/excalidraw/index.css";
import "../../tools/tools.css";
import "./Canvas.css";

interface ExcalidrawWrapperProps {
  initialData: ExcalidrawInitialData | null;
  theme: "light" | "dark";
  onThemeChange?: (nextTheme: "light" | "dark") => void;
  onChange: (elements: readonly any[], appState: any, files: any) => void;
  onScrollChange?: (scrollX: number, scrollY: number, zoom: number) => void;
  fileName: string | null;
  onCreateDrawing?: (name: string) => void;
  onAPIMount?: (api: any) => void;
}

export const ExcalidrawWrapper: React.FC<ExcalidrawWrapperProps> = ({
  initialData,
  theme,
  onThemeChange,
  onChange,
  onScrollChange,
  fileName,
  onCreateDrawing,
  onAPIMount,
}) => {
  const { promptDialog } = useDialog();
  const excalidrawAPIRef = useRef<any>(null);
  const prevThemeRef = useRef(theme);
  const themeRef = useRef(theme);
  themeRef.current = theme;

  const initialDataRef = useRef(initialData);
  initialDataRef.current = initialData;

  const onAPIMountRef = useRef(onAPIMount);
  onAPIMountRef.current = onAPIMount;

  const onThemeChangeRef = useRef(onThemeChange);
  onThemeChangeRef.current = onThemeChange;

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleQuickCreate = async () => {
    if (onCreateDrawing) {
      const name = await promptDialog({
        title: "Create New Drawing",
        placeholder: "Untitled",
        defaultValue: "Untitled",
        confirmText: "Create",
        icon: <IconNewFile size={16} />,
      });
      if (name) {
        onCreateDrawing(name);
      }
    }
  };

  const handleAPIMount = useCallback((api: any) => {
    excalidrawAPIRef.current = api;
    const files = initialDataRef.current?.files;
    if (files) {
      const fileValues = Object.values(files).filter(Boolean) as any[];
      if (fileValues.length > 0) {
        api.addFiles(fileValues);
      }
    }
    if (onAPIMountRef.current) {
      onAPIMountRef.current(api);
    }
  }, []);

  // Sync theme changes to Excalidraw instance ONLY when theme actually toggles
  useEffect(() => {
    if (prevThemeRef.current !== theme) {
      prevThemeRef.current = theme;
      if (excalidrawAPIRef.current) {
        excalidrawAPIRef.current.updateScene({
          appState: { theme },
          commitToHistory: false,
        });
      }
    }
  }, [theme]);

  const getViewportCenter = useCallback(() => {
    const api = excalidrawAPIRef.current;
    const appState = api?.getAppState?.() || {};
    const zoom = appState.zoom?.value ?? appState.zoom ?? 1;
    const scrollX = appState.scrollX ?? 0;
    const scrollY = appState.scrollY ?? 0;
    const width = appState.width || window.innerWidth || 1200;
    const height = appState.height || window.innerHeight || 800;
    return {
      x: Math.round(-scrollX + width / 2 / zoom),
      y: Math.round(-scrollY + height / 2 / zoom),
    };
  }, []);

  const handleInternalChange = useCallback(
    (elements: readonly any[], appState: any, files: any) => {
      onChange(elements, appState, files);
    },
    [onChange]
  );

  const handleInternalScrollChange = useCallback(
    (scrollX: number, scrollY: number, zoom: { value: number }) => {
      onScrollChange?.(scrollX, scrollY, zoom?.value ?? 1);
    },
    [onScrollChange]
  );

  const handleInsertCalendar = (year: number, month: number) => {
    const api = excalidrawAPIRef.current;
    if (!api) return;

    const { x, y } = getViewportCenter();
    const elements = generateCalendar({
      year,
      month,
      centerX: x,
      centerY: y,
      theme: "white",
    });

    const current = Array.from(api.getSceneElements?.() || []);
    const selectedElementIds: Record<string, boolean> = {};
    elements.forEach((el) => {
      selectedElementIds[el.id] = true;
    });

    api.updateScene({
      elements: [...current, ...elements],
      appState: { ...api.getAppState(), selectedElementIds },
      commitToHistory: true,
    });
  };

  const memoizedInitialData = useMemo(() => {
    if (!initialData) return undefined;
    return {
      elements: initialData.elements,
      appState: {
        ...initialData.appState,
        theme: themeRef.current,
        zoom: initialData.appState?.zoom?.value
          ? initialData.appState.zoom
          : { value: 1 },
      },
      files: initialData.files,
      scrollToContent:
        !initialData.hasSavedViewport &&
        Boolean(
          initialData.elements &&
            initialData.elements.length > 0 &&
            initialData.appState?.scrollX === undefined
        ),
    };
  }, [initialData]);

  const excalidrawChildren = useMemo(
    () => (
      <>
        <MainMenu>
          <MainMenu.DefaultItems.SaveAsImage />
          <MainMenu.DefaultItems.Export />
          <MainMenu.DefaultItems.ClearCanvas />
          <MainMenu.DefaultItems.ToggleTheme
            onSelect={(nextTheme) => {
              if (nextTheme === "light" || nextTheme === "dark") {
                onThemeChangeRef.current?.(nextTheme);
              }
            }}
          />
          <MainMenu.DefaultItems.ChangeCanvasBackground />
        </MainMenu>
        <WelcomeScreen>
          <WelcomeScreen.Center>
            <WelcomeScreen.Center.Heading>
              Start sketching!
            </WelcomeScreen.Center.Heading>
          </WelcomeScreen.Center>
        </WelcomeScreen>
      </>
    ),
    []
  );

  if (!fileName) {
    return (
      <div className="canvas-wrapper-root">
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
      </div>
    );
  }

  return (
    <div className="canvas-wrapper-root">
      <div className="canvas-container">
        <CanvasToolsDock onOpenCalendar={() => setIsCalendarOpen(true)} />

        <Excalidraw
          key={fileName || "canvas"}
          excalidrawAPI={handleAPIMount}
          initialData={memoizedInitialData}
          theme={theme}
          onChange={handleInternalChange}
          onScrollChange={handleInternalScrollChange}
        >
          {excalidrawChildren}
        </Excalidraw>
      </div>

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onInsert={handleInsertCalendar}
      />
    </div>
  );
};
