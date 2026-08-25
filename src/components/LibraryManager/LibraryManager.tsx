import React, { useState, useEffect } from "react";
import { LibraryInfo } from "../../types/drawing";
import { listLibraries, loadLibrary, saveLibrary } from "../../lib/tauri";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import "./LibraryManager.css";

interface LibraryManagerProps {
  onInsertLibrary: (libraryItems: any[]) => void;
}

export const LibraryManager: React.FC<LibraryManagerProps> = ({ onInsertLibrary }) => {
  const [libraries, setLibraries] = useState<LibraryInfo[]>([]);

  const fetchLibs = async () => {
    try {
      const libs = await listLibraries();
      setLibraries(libs);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchLibs();
  }, []);

  const handleImport = async () => {
    const selected = await openDialog({
      filters: [{ name: "Excalidraw Library", extensions: ["excalidrawlib"] }]
    });
    
    if (selected && typeof selected === 'string') {
      try {
        // Read the file natively or copy to vault
        // Assuming we have a command for this, for now just load if it's already in vault or copy it
        // If not in vault, backend load_library can handle absolute paths?
        const content = await loadLibrary(selected);
        // Save it to vault
        const name = selected.split(/[/\\]/).pop() || "ImportedLib";
        await saveLibrary(name, content);
        await fetchLibs();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleLoad = async (path: string) => {
    try {
      const content = await loadLibrary(path);
      const parsed = JSON.parse(content);
      if (parsed.libraryItems) {
        onInsertLibrary(parsed.libraryItems);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="library-manager">
      <div className="library-header">
        <h3>Libraries</h3>
        <button onClick={handleImport} className="import-lib-btn">Import</button>
      </div>
      <div className="library-list">
        {libraries.map(lib => (
          <div key={lib.path} className="library-item" onClick={() => handleLoad(lib.path)}>
            <span className="lib-icon">📚</span>
            <span className="lib-name">{lib.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
