import { useState, useEffect, useCallback } from "react";
import { FileTreeNode } from "../types/fileTree";
import { getFileTree, createDrawing, createFolder, deleteFile, renameFile, moveFile } from "../lib/tauri";
import { useFileWatcher } from "./useFileWatcher";

export const useFileTree = (vaultOpen: boolean) => {
  const [tree, setTree] = useState<FileTreeNode | null>(null);

  const fetchTree = useCallback(async () => {
    if (!vaultOpen) {
      setTree(null);
      return;
    }
    try {
      const fileTree = await getFileTree();
      setTree(fileTree);
    } catch (e) {
      console.error("Failed to fetch tree:", e);
    }
  }, [vaultOpen]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  // Hook into file watcher with stable callback
  useFileWatcher(fetchTree, vaultOpen);

  const handleCreateDrawing = async (name: string, folder?: string) => {
    try {
      const relPath = await createDrawing(name, folder);
      await fetchTree();
      return relPath;
    } catch (e) {
      console.error("Failed to create drawing", e);
      return null;
    }
  };

  const handleCreateFolder = async (path: string) => {
    try {
      await createFolder(path);
      await fetchTree();
    } catch (e) {
      console.error("Failed to create folder", e);
    }
  };

  const handleDelete = async (path: string) => {
    try {
      await deleteFile(path);
      await fetchTree();
    } catch (e) {
      console.error("Failed to delete file", e);
    }
  };

  const handleRename = async (oldPath: string, newName: string) => {
    try {
      const newPath = await renameFile(oldPath, newName);
      await fetchTree();
      return newPath;
    } catch (e) {
      console.error("Failed to rename file", e);
      return null;
    }
  };

  const handleMove = async (src: string, destFolder: string) => {
    try {
      const newPath = await moveFile(src, destFolder);
      await fetchTree();
      return newPath;
    } catch (e) {
      console.error("Failed to move file", e);
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
