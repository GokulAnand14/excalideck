import { useEffect, useRef } from "react";
import { listen, UnlistenFn } from "@tauri-apps/api/event";

export const useFileWatcher = (onChange: () => void, vaultOpen: boolean) => {
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!vaultOpen) return;

    let unlistens: UnlistenFn[] = [];
    let debounceTimer: number | null = null;

    const notifyChange = () => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }
      debounceTimer = window.setTimeout(() => {
        onChangeRef.current();
      }, 300);
    };

    const setup = async () => {
      try {
        const u1 = await listen("vault-file-created", notifyChange);
        const u2 = await listen("vault-file-deleted", notifyChange);
        const u3 = await listen("vault-file-renamed", notifyChange);

        unlistens = [u1, u2, u3];
      } catch (e) {
        console.error("Failed to setup file watcher listeners", e);
      }
    };

    setup();

    return () => {
      if (debounceTimer) {
        window.clearTimeout(debounceTimer);
      }
      unlistens.forEach((u) => u());
    };
  }, [vaultOpen]);
};
