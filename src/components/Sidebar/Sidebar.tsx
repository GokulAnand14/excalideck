import React, { useState, useRef, useEffect } from "react";
import { FileTree } from "./FileTree";
import { FileTreeNode } from "../../types/fileTree";
import { DragGhost } from "./DragGhost";
import { MoveModal } from "./MoveModal";
import { useDialog } from "../../context/DialogContext";
import { usePluginUI, PluginSlot } from "../../plugins";
import { IconNewFile, IconNewFolder, IconSearch, IconPlugin } from "../common/Icons";
import "./Sidebar.css";

interface SidebarProps {
  tree: FileTreeNode | null;
  activeFile: string | null;
  vaultName?: string | null;
  onFileSelect: (path: string) => void;
  onCreateDrawing: (name: string, folder?: string) => void;
  onCreateFolder: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile: (oldPath: string, newName: string) => void;
  onMoveFile: (src: string, destFolder: string) => void;
  onOpenVaultPicker?: () => void;
  onOpenMarketplace?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tree,
  activeFile,
  vaultName,
  onFileSelect,
  onCreateDrawing,
  onCreateFolder,
  onDeleteFile,
  onRenameFile,
  onMoveFile,
  onOpenVaultPicker,
  onOpenMarketplace,
}) => {
  const { promptDialog } = useDialog();
  const { sidebarPanels } = usePluginUI();
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  // Move Modal state
  const [moveModalItem, setMoveModalItem] = useState<{
    path: string;
    isFolder: boolean;
  } | null>(null);

  // --- Pointer-based Virtual Drag & Drop State ---
  const [draggedItem, setDraggedItem] = useState<{
    path: string;
    isFolder: boolean;
    name: string;
  } | null>(null);

  const [ghostPos, setGhostPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dropTargetFolder, setDropTargetFolder] = useState<string | null>(null);

  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const pendingDragItemRef = useRef<{ path: string; isFolder: boolean; name: string } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dropTargetRef = useRef<string | null>(null);
  const sidebarContentRef = useRef<HTMLDivElement | null>(null);

  // Toggle folder open/closed state
  const handleToggleExpand = (folderPath: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath); // Expand
      } else {
        next.add(folderPath); // Collapse
      }
      return next;
    });
  };

  // --- Pointer Drag Listeners ---
  const handleItemPointerDown = (e: React.PointerEvent, node: FileTreeNode) => {
    // Only primary mouse button
    if (e.button !== 0) return;

    // Don't drag if clicking buttons
    const target = e.target as HTMLElement;
    if (target.closest("button") || target.closest(".folder-hover-actions")) {
      return;
    }

    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    pendingDragItemRef.current = {
      path: node.path,
      isFolder: node.nodeType === "directory",
      name: node.name,
    };
    isDraggingRef.current = false;
    dropTargetRef.current = null;
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragStartPosRef.current || !pendingDragItemRef.current) return;

      const dx = e.clientX - dragStartPosRef.current.x;
      const dy = e.clientY - dragStartPosRef.current.y;
      const dist = Math.hypot(dx, dy);

      if (!isDraggingRef.current && dist > 5) {
        isDraggingRef.current = true;
        setDraggedItem(pendingDragItemRef.current);
      }

      if (isDraggingRef.current) {
        setGhostPos({ x: e.clientX, y: e.clientY });

        // Hit-test element under cursor
        const elemUnder = document.elementFromPoint(e.clientX, e.clientY);
        const itemRow = elemUnder?.closest("[data-node-path]");

        if (itemRow) {
          const targetPath = itemRow.getAttribute("data-node-path") || "";
          const targetType = itemRow.getAttribute("data-node-type");

          if (targetType === "directory") {
            // Target is a folder
            dropTargetRef.current = targetPath;
            setDropTargetFolder(targetPath);
          } else {
            // Target is a file -> target its parent folder
            const parentFolder = targetPath.includes("/")
              ? targetPath.substring(0, targetPath.lastIndexOf("/"))
              : "";
            dropTargetRef.current = parentFolder;
            setDropTargetFolder(parentFolder);
          }
        } else if (sidebarContentRef.current?.contains(elemUnder)) {
          // Hovering empty space in sidebar -> vault root
          dropTargetRef.current = "";
          setDropTargetFolder("");
        } else {
          dropTargetRef.current = null;
          setDropTargetFolder(null);
        }
      }
    };

    const handlePointerUp = () => {
      if (isDraggingRef.current && pendingDragItemRef.current && dropTargetRef.current !== null) {
        const srcPath = pendingDragItemRef.current.path;
        const isSrcFolder = pendingDragItemRef.current.isFolder;
        const destFolder = dropTargetRef.current;

        // Prevent moving into itself or own subfolder
        const isSelf = srcPath === destFolder;
        const isDescendant = isSrcFolder && destFolder.startsWith(srcPath + "/");

        if (!isSelf && !isDescendant) {
          onMoveFile(srcPath, destFolder);

          // Auto-expand dest folder if collapsed
          if (destFolder && collapsedFolders.has(destFolder)) {
            setCollapsedFolders((prev) => {
              const next = new Set(prev);
              next.delete(destFolder);
              return next;
            });
          }
        }
      }

      // Reset drag state
      dragStartPosRef.current = null;
      pendingDragItemRef.current = null;
      isDraggingRef.current = false;
      dropTargetRef.current = null;
      setDraggedItem(null);
      setDropTargetFolder(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [collapsedFolders, onMoveFile]);

  const handleNewFile = async () => {
    const name = await promptDialog({
      title: "Create New Drawing",
      subtitle: "Inside vault root",
      placeholder: "Untitled",
      defaultValue: "Untitled",
      confirmText: "Create",
      icon: <IconNewFile size={16} />,
    });
    if (name) {
      onCreateDrawing(name);
    }
  };

  const handleNewFolder = async () => {
    const name = await promptDialog({
      title: "Create New Folder",
      subtitle: "Inside vault root",
      placeholder: "New Folder",
      defaultValue: "New Folder",
      confirmText: "Create Folder",
      icon: <IconNewFolder size={16} />,
    });
    if (name) {
      onCreateFolder(name);
    }
  };

  // Count total drawings in tree
  const countDrawings = (node: FileTreeNode | null): number => {
    if (!node) return 0;
    if (node.nodeType === "file") return 1;
    if (node.children) {
      return node.children.reduce((acc, child) => acc + countDrawings(child), 0);
    }
    return 0;
  };

  const totalDrawings = countDrawings(tree);

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-vault-info">
          <img src="/logo.png" className="sidebar-vault-logo" alt="Vault" />
          <span className="sidebar-vault-name" title={vaultName || "Vault"}>
            {vaultName || "Vault"}
          </span>
        </div>

        <div className="sidebar-actions">
          <button
            className="sidebar-action-btn"
            onClick={handleNewFile}
            title="New Drawing (in root)"
          >
            <IconNewFile size={15} />
          </button>
          <button
            className="sidebar-action-btn"
            onClick={handleNewFolder}
            title="New Folder (in root)"
          >
            <IconNewFolder size={15} />
          </button>
        </div>
      </div>

      {/* Search Input */}
      <div className="sidebar-search">
        <IconSearch size={13} className="sidebar-search-icon" />
        <input
          type="text"
          placeholder="Filter drawings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sidebar-search-input"
        />
        {searchQuery && (
          <button
            className="sidebar-search-clear"
            onClick={() => setSearchQuery("")}
          >
            ×
          </button>
        )}
      </div>

      {/* File Tree & Root Drop Zone */}
      <div
        ref={sidebarContentRef}
        className={`sidebar-content ${dropTargetFolder === "" ? "is-root-drop-target" : ""}`}
      >
        {tree ? (
          <FileTree
            node={tree}
            activeFile={activeFile}
            searchQuery={searchQuery}
            collapsedFolders={collapsedFolders}
            onToggleExpand={handleToggleExpand}
            onFileSelect={onFileSelect}
            onCreateDrawing={onCreateDrawing}
            onCreateFolder={onCreateFolder}
            onDeleteFile={onDeleteFile}
            onRenameFile={onRenameFile}
            onOpenMoveModal={(path, isFolder) => setMoveModalItem({ path, isFolder })}
            draggedItem={draggedItem}
            dropTargetFolder={dropTargetFolder}
            onItemPointerDown={handleItemPointerDown}
          />
        ) : (
          <div className="sidebar-empty">
            <p>No vault open</p>
            {onOpenVaultPicker && (
              <button className="sidebar-open-vault-btn" onClick={onOpenVaultPicker}>
                Open Vault
              </button>
            )}
          </div>
        )}
      </div>

      {/* Plugin Sidebar Panels */}
      {sidebarPanels.length > 0 && (
        <div className="sidebar-plugin-panels">
          {sidebarPanels.map((panel) => (
            <div key={panel.id} className="sidebar-plugin-panel">
              <div className="sidebar-plugin-panel-header">
                <span className="sidebar-plugin-panel-title">{panel.title}</span>
              </div>
              <div className="sidebar-plugin-panel-content">
                <PluginSlot render={panel.render} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="sidebar-footer">
        <span className="sidebar-stats">
          {totalDrawings} {totalDrawings === 1 ? "drawing" : "drawings"}
        </span>
        <div style={{ display: "flex", gap: "4px" }}>
          {onOpenMarketplace && (
            <button
              className="sidebar-switch-btn"
              onClick={onOpenMarketplace}
              title="Browse & Manage Plugins"
            >
              Plugins
            </button>
          )}
          {onOpenVaultPicker && (
            <button
              className="sidebar-switch-btn"
              onClick={onOpenVaultPicker}
              title="Switch or Open Another Vault"
            >
              Switch Vault
            </button>
          )}
        </div>
      </div>

      {/* Floating Drag Ghost Badge */}
      {draggedItem && (
        <DragGhost
          name={draggedItem.name}
          isFolder={draggedItem.isFolder}
          x={ghostPos.x}
          y={ghostPos.y}
        />
      )}

      {/* Move to Folder Modal */}
      {moveModalItem && (
        <MoveModal
          itemPath={moveModalItem.path}
          isFolder={moveModalItem.isFolder}
          tree={tree}
          onMove={onMoveFile}
          onClose={() => setMoveModalItem(null)}
        />
      )}
    </aside>
  );
};
