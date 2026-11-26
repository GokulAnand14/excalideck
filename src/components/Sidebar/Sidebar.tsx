import React, { useState, useRef, useEffect, useMemo } from "react";
import { FileTree } from "./FileTree";
import { FileTreeNode } from "../../types/fileTree";
import { DragGhost } from "./DragGhost";
import { MoveModal } from "./MoveModal";
import { useDialog } from "../../context/DialogContext";
import { usePlatform } from "../../hooks/usePlatform";
import { APP_VERSION_FALLBACK, DEFAULT_SIDEBAR_WIDTH } from "../../lib/constants";
import {
  IconNewFile,
  IconNewFolder,
  IconSearch,
} from "../common/Icons";
import "./Sidebar.css";

interface SidebarProps {
  tree: FileTreeNode | null;
  activeFile: string | null;
  vaultName?: string | null;
  sidebarWidth?: number;
  collapsedFolders?: string[];
  onSidebarWidthChange?: (width: number, immediate?: boolean) => void;
  onCollapsedFoldersChange?: (folders: string[]) => void;
  onFileSelect: (path: string) => void;
  onCreateDrawing: (name: string, folder?: string) => void;
  onCreateFolder: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile: (oldPath: string, newName: string) => void;
  onMoveFile: (src: string, destFolder: string) => void;
  onOpenVaultPicker?: () => void;
  onOpenAbout?: () => void;
  currentVersion?: string;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  tree,
  activeFile,
  vaultName,
  sidebarWidth: persistedWidth = DEFAULT_SIDEBAR_WIDTH,
  collapsedFolders: persistedCollapsed = [],
  onSidebarWidthChange,
  onCollapsedFoldersChange,
  onFileSelect,
  onCreateDrawing,
  onCreateFolder,
  onDeleteFile,
  onRenameFile,
  onMoveFile,
  onOpenVaultPicker,
  onOpenAbout,
  currentVersion,
  onCloseMobile,
}) => {
  const { isDesktop, isMobile } = usePlatform();
  const { promptDialog } = useDialog();
  const [searchQuery, setSearchQuery] = useState("");
  const collapsedFolders = useMemo(
    () => new Set(persistedCollapsed),
    [persistedCollapsed]
  );

  const matchingPaths = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query || !tree) return null;

    const matches = new Set<string>();
    const visit = (node: FileTreeNode): boolean => {
      if (
        node.nodeType === "directory" &&
        (node.name === ".excalideck" || node.name === "assets" || node.name.startsWith("."))
      ) {
        return false;
      }
      const selfMatches = node.name.toLowerCase().includes(query);
      let childMatches = false;
      for (const child of node.children || []) childMatches = visit(child) || childMatches;
      if (selfMatches || childMatches) matches.add(node.path);
      return selfMatches || childMatches;
    };
    visit(tree);
    return matches;
  }, [searchQuery, tree]);

  const [moveModalItem, setMoveModalItem] = useState<{
    path: string;
    isFolder: boolean;
  } | null>(null);

  // Resize State
  const [sidebarWidth, setSidebarWidth] = useState(persistedWidth);
  const latestWidthRef = useRef(persistedWidth);
  const isResizingRef = useRef(false);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);
  const onSidebarWidthChangeRef = useRef(onSidebarWidthChange);
  onSidebarWidthChangeRef.current = onSidebarWidthChange;

  useEffect(() => {
    setSidebarWidth(persistedWidth);
    latestWidthRef.current = persistedWidth;
  }, [persistedWidth]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;
      const dx = e.clientX - startXRef.current;
      const newWidth = Math.max(200, Math.min(600, startWidthRef.current + dx));
      latestWidthRef.current = newWidth;
      setSidebarWidth(newWidth);
    };
    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = "default";
        document.body.style.userSelect = "auto";
        onSidebarWidthChangeRef.current?.(latestWidthRef.current, true);
      }
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  const handleResizeStart = (e: React.MouseEvent) => {
    isResizingRef.current = true;
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  };

  // --- Pointer-based Virtual Drag & Drop State ---
  const [draggedItem, setDraggedItem] = useState<{
    path: string;
    isFolder: boolean;
    name: string;
  } | null>(null);

  const [dropTargetFolder, setDropTargetFolder] = useState<string | null>(null);
  const dragGhostRef = useRef<HTMLDivElement | null>(null);

  const dragStartPosRef = useRef<{ x: number; y: number } | null>(null);
  const pendingDragItemRef = useRef<{ path: string; isFolder: boolean; name: string } | null>(null);
  const isDraggingRef = useRef<boolean>(false);
  const dropTargetRef = useRef<string | null>(null);
  const sidebarContentRef = useRef<HTMLDivElement | null>(null);

  const collapsedFoldersRef = useRef(collapsedFolders);
  collapsedFoldersRef.current = collapsedFolders;
  const onMoveFileRef = useRef(onMoveFile);
  onMoveFileRef.current = onMoveFile;
  const onCollapsedFoldersChangeRef = useRef(onCollapsedFoldersChange);
  onCollapsedFoldersChangeRef.current = onCollapsedFoldersChange;

  const handleItemPointerDown = (e: React.PointerEvent, node: FileTreeNode) => {
    if (e.button !== 0) return;
    if ((e.target as HTMLElement | null)?.closest("button")) return;
    dragStartPosRef.current = { x: e.clientX, y: e.clientY };
    pendingDragItemRef.current = {
      path: node.path,
      isFolder: node.nodeType === "directory",
      name: node.name,
    };
  };

  useEffect(() => {
    const clearDragState = () => {
      dragStartPosRef.current = null;
      pendingDragItemRef.current = null;
      isDraggingRef.current = false;
      dropTargetRef.current = null;
      setDraggedItem(null);
      setDropTargetFolder(null);
    };

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
        if (dragGhostRef.current) {
          dragGhostRef.current.style.transform = `translate3d(${e.clientX + 12}px, ${e.clientY + 12}px, 0)`;
        }

        const elemUnder = document.elementFromPoint(e.clientX, e.clientY);
        const itemRow = elemUnder?.closest("[data-node-path]");

        if (itemRow) {
          const targetPath = itemRow.getAttribute("data-node-path") || "";
          const targetType = itemRow.getAttribute("data-node-type");

          if (targetType === "directory") {
            dropTargetRef.current = targetPath;
            setDropTargetFolder(targetPath);
          } else {
            const parentFolder = targetPath.includes("/")
              ? targetPath.substring(0, targetPath.lastIndexOf("/"))
              : "";
            dropTargetRef.current = parentFolder;
            setDropTargetFolder(parentFolder);
          }
        } else if (sidebarContentRef.current?.contains(elemUnder)) {
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

        const isSelf = srcPath === destFolder;
        const isDescendant = isSrcFolder && destFolder.startsWith(srcPath + "/");

        if (!isSelf && !isDescendant) {
          onMoveFileRef.current(srcPath, destFolder);

          if (destFolder && collapsedFoldersRef.current.has(destFolder)) {
            const next = new Set(collapsedFoldersRef.current);
            next.delete(destFolder);
            onCollapsedFoldersChangeRef.current?.(Array.from(next));
          }
        }
      }
      clearDragState();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isDraggingRef.current) {
        clearDragState();
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", clearDragState);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", clearDragState);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleToggleExpand = (folderPath: string) => {
    const next = new Set(collapsedFolders);
    if (next.has(folderPath)) {
      next.delete(folderPath);
    } else {
      next.add(folderPath);
    }
    onCollapsedFoldersChange?.(Array.from(next));
  };

  const handleNewFile = async () => {
    const name = await promptDialog({
      title: "New Drawing",
      placeholder: "Drawing name",
      confirmText: "Create",
      icon: <IconNewFile size={16} />,
    });
    if (name) {
      onCreateDrawing(name);
    }
  };

  const handleNewFolder = async () => {
    const name = await promptDialog({
      title: "New Folder",
      placeholder: "Folder name",
      confirmText: "Create",
      icon: <IconNewFolder size={16} />,
    });
    if (name) {
      onCreateFolder(name);
    }
  };

  const countDrawings = (node: FileTreeNode): number => {
    if (node.nodeType === "file") return 1;
    if (!node.children) return 0;
    return node.children.reduce((acc, child) => acc + countDrawings(child), 0);
  };

  const totalDrawings = tree ? countDrawings(tree) : 0;

  const handleSelectFile = (path: string) => {
    onFileSelect(path);
    if (isMobile && onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <>
      {isMobile && (
        <div
          className="sidebar-backdrop"
          onClick={onCloseMobile}
          aria-label="Close sidebar"
        />
      )}
      <div className={`sidebar-layout ${isMobile ? "is-mobile" : ""}`}>
        <aside className="sidebar" style={{ width: isMobile ? undefined : sidebarWidth }}>
          <div className="sidebar-header">
            <div
              className={`sidebar-vault-info ${onOpenVaultPicker ? "clickable" : ""}`}
              onClick={onOpenVaultPicker}
              role={onOpenVaultPicker ? "button" : undefined}
              tabIndex={onOpenVaultPicker ? 0 : undefined}
              title={
                onOpenVaultPicker
                  ? `Vault: ${vaultName || "Vault"} • Click to switch`
                  : vaultName || "Vault"
              }
              onKeyDown={(e) => {
                if (onOpenVaultPicker && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onOpenVaultPicker();
                }
              }}
            >
              <img src="/logo.png" className="sidebar-vault-logo" alt="Vault" />
              <span className="sidebar-vault-name" title={vaultName || "Vault"}>
                {vaultName || "Vault"}
              </span>
              {onOpenVaultPicker && <span className="sidebar-vault-caret">▾</span>}
            </div>

            <div className="sidebar-actions">
              <button
                className="sidebar-action-btn"
                onClick={handleNewFile}
                title="New Drawing (in root)"
                aria-label="New Drawing"
              >
                <IconNewFile size={15} />
              </button>
              <button
                className="sidebar-action-btn"
                onClick={handleNewFolder}
                title="New Folder (in root)"
                aria-label="New Folder"
              >
                <IconNewFolder size={15} />
              </button>
              {isMobile && onCloseMobile && (
                <button
                  className="sidebar-action-btn mobile-drawer-close-btn"
                  onClick={onCloseMobile}
                  title="Close Sidebar"
                  aria-label="Close Sidebar"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          <div className="sidebar-search">
            <IconSearch size={13} className="sidebar-search-icon" />
            <input
              type="text"
              placeholder="Filter drawings..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape" && searchQuery) {
                  setSearchQuery("");
                }
              }}
              className="sidebar-search-input"
            />
            {searchQuery && (
              <button
                className="sidebar-search-clear"
                onClick={() => setSearchQuery("")}
                aria-label="Clear filter"
              >
                ×
              </button>
            )}
          </div>

          <div
            ref={sidebarContentRef}
            className={`sidebar-content ${dropTargetFolder === "" ? "is-root-drop-target" : ""}`}
          >
            {tree ? (
              <FileTree
                node={tree}
                activeFile={activeFile}
                searchQuery={searchQuery}
                matchingPaths={matchingPaths}
                collapsedFolders={collapsedFolders}
                onToggleExpand={handleToggleExpand}
                onFileSelect={handleSelectFile}
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

          <div className="sidebar-footer">
            <span className="sidebar-stats">
              {totalDrawings} {totalDrawings === 1 ? "drawing" : "drawings"}
            </span>
            <button
              type="button"
              className="sidebar-version"
              onClick={onOpenAbout}
              title={
                currentVersion
                  ? `Excalideck v${currentVersion} • About & Updates`
                  : "About & Updates"
              }
            >
              v{currentVersion || APP_VERSION_FALLBACK}
            </button>
          </div>

          {draggedItem && (
            <DragGhost
              ref={dragGhostRef}
              name={draggedItem.name}
              isFolder={draggedItem.isFolder}
              x={0}
              y={0}
            />
          )}

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
        {isDesktop && <div className="sidebar-resizer" onMouseDown={handleResizeStart} />}
      </div>
    </>
  );
};
