import { useState, useEffect, useCallback } from "react";
import { FileTreeNode } from "../types/fileTree";
import { getFileTree, createDrawing, createFolder, deleteFile, renameFile, moveFile } from "../lib/tauri";
import { useFileWatcher } from "./useFileWatcher";

export const useFileTree = (
  activeVaultPath?: string | null,
  onError?: (message: string) => void
) => {
  const [tree, setTree] = useState<FileTreeNode | null>(null);

  const fetchTree = useCallback(async () => {
    if (!activeVaultPath) {
      setTree(null);
      return;
    }
    try {
      const fileTree = await getFileTree();
      setTree(fileTree);
    } catch (e: any) {
      console.error("Failed to fetch tree:", e);
      setTree(null);
      onError?.(`Failed to load files: ${e?.message || e || "Unknown error"}`);
    }
  }, [activeVaultPath, onError]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  useFileWatcher(fetchTree, !!activeVaultPath);

  const handleCreateDrawing = async (name: string, folder?: string) => {
    try {
      const relPath = await createDrawing(name, folder);
      await fetchTree();
      return relPath;
    } catch (e: any) {
      console.error("Failed to create drawing", e);
      onError?.(typeof e === "string" ? e : e?.message || "Failed to create drawing");
      return null;
    }
  };

  const handleCreateFolder = async (path: string) => {
    try {
      await createFolder(path);
      await fetchTree();
      return true;
    } catch (e: any) {
      console.error("Failed to create folder", e);
      onError?.(typeof e === "string" ? e : e?.message || "Failed to create folder");
      return false;
    }
  };

  const handleDelete = async (path: string) => {
    try {
      await deleteFile(path);
      await fetchTree();
      return true;
    } catch (e: any) {
      console.error("Failed to delete file", e);
      onError?.(typeof e === "string" ? e : e?.message || "Failed to delete item");
      return false;
    }
  };

  const handleRename = async (oldPath: string, newName: string) => {
    try {
      const newPath = await renameFile(oldPath, newName);
      await fetchTree();
      return newPath;
    } catch (e: any) {
      console.error("Failed to rename file", e);
      onError?.(typeof e === "string" ? e : e?.message || "Failed to rename item");
      return null;
    }
  };

  const handleMove = async (src: string, destFolder: string) => {
    try {
      const newPath = await moveFile(src, destFolder);
      await fetchTree();
      return newPath;
    } catch (e: any) {
      console.error("Failed to move file", e);
      onError?.(typeof e === "string" ? e : e?.message || "Failed to move item");
      return null;
    }
  };

  return {
    tree,
    refreshTree: fetchTree,
    createDrawing: handleCreateDrawing,
    createFolder: handleCreateFolder,
    deleteFile: handleDelete,
    renameFile: handleRename,
    moveFile: handleMove,
  };
};
