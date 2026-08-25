import React, { useState } from "react";
import { FileTreeNode } from "../../types/fileTree";
import { ContextMenu, ContextMenuItem } from "../common/ContextMenu";
import {
  IconChevronDown,
  IconChevronRight,
  IconFolder,
  IconFolderOpen,
  IconFileDrawing,
  IconNewFile,
  IconNewFolder,
} from "../common/Icons";

interface FileTreeItemProps {
  node: FileTreeNode;
  activeFile: string | null;
  isExpanded: boolean;
  onToggleExpand: (path: string) => void;
  onFileSelect: (path: string) => void;
  onCreateDrawing: (name: string, folder?: string) => void;
  onCreateFolder: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile: (oldPath: string, newName: string) => void;
  onOpenMoveModal: (path: string, isFolder: boolean) => void;
  isDraggingThis: boolean;
  isDropTargetThis: boolean;
  onItemPointerDown: (e: React.PointerEvent, node: FileTreeNode) => void;
  level: number;
}

export const FileTreeItem: React.FC<FileTreeItemProps> = ({
  node,
  activeFile,
  isExpanded,
  onToggleExpand,
  onFileSelect,
  onCreateDrawing,
  onCreateFolder,
  onDeleteFile,
  onRenameFile,
  onOpenMoveModal,
  isDraggingThis,
  isDropTargetThis,
  onItemPointerDown,
  level,
}) => {
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const isActive = activeFile === node.path;
  const isFolder = node.nodeType === "directory";

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      onToggleExpand(node.path);
    } else {
      onFileSelect(node.path);
    }
  };

  const handleChevronClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFolder) {
      onToggleExpand(node.path);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  // Quick Action Buttons on hover
  const handleQuickNewFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = prompt("Enter drawing name in this folder:", "Untitled");
    if (name && name.trim()) {
      onCreateDrawing(name.trim(), node.path);
      if (!isExpanded) {
        onToggleExpand(node.path);
      }
    }
  };

  const handleQuickNewFolder = (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = prompt("Enter subfolder name:", "Subfolder");
    if (name && name.trim()) {
      onCreateFolder(`${node.path}/${name.trim()}`);
      if (!isExpanded) {
        onToggleExpand(node.path);
      }
    }
  };

  // Context Menu Items
  const menuItems: ContextMenuItem[] = [];

  if (isFolder) {
    menuItems.push(
      {
        label: "New Drawing",
        icon: "✏️",
        onClick: () => {
          const name = prompt("Enter drawing name:", "Untitled");
          if (name && name.trim()) {
            onCreateDrawing(name.trim(), node.path);
            if (!isExpanded) {
              onToggleExpand(node.path);
            }
          }
        },
      },
      {
        label: "New Subfolder",
        icon: "📁",
        onClick: () => {
          const name = prompt("Enter subfolder name:", "Subfolder");
          if (name && name.trim()) {
            onCreateFolder(`${node.path}/${name.trim()}`);
            if (!isExpanded) {
              onToggleExpand(node.path);
            }
          }
        },
      }
    );
  }

  menuItems.push(
    {
      label: "Move to...",
      icon: "📦",
      onClick: () => {
        onOpenMoveModal(node.path, isFolder);
      },
    },
    {
      label: "Rename",
      icon: "🏷️",
      onClick: () => {
        const currentCleanName = node.name.replace(".excalidraw", "");
        const newName = prompt("Enter new name:", currentCleanName);
        if (newName && newName.trim() && newName.trim() !== currentCleanName) {
          const finalName = isFolder ? newName.trim() : `${newName.trim()}.excalidraw`;
          onRenameFile(node.path, finalName);
        }
      },
    },
    {
      label: "Delete",
      icon: "🗑️",
      danger: true,
      onClick: () => {
        if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
          onDeleteFile(node.path);
        }
      },
    }
  );

  const displayName = isFolder
    ? node.name
    : node.name.replace(".excalidraw", "");

  return (
    <>
      <div
        className={`file-tree-item ${isActive ? "active" : ""} ${
          isFolder ? "is-folder" : "is-file"
        } ${isDraggingThis ? "is-dragging" : ""} ${
          isDropTargetThis ? "is-drop-target" : ""
        }`}
        style={{ paddingLeft: `${(level - 1) * 14 + 10}px` }}
        data-node-path={node.path}
        data-node-type={node.nodeType}
        onPointerDown={(e) => onItemPointerDown(e, node)}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        title={node.path}
      >
        {isFolder ? (
          <>
            <button
              className="folder-chevron"
              onClick={handleChevronClick}
              title={isExpanded ? "Collapse Folder" : "Expand Folder"}
            >
              {isExpanded ? <IconChevronDown size={12} /> : <IconChevronRight size={12} />}
            </button>
            <span className="item-icon folder-icon">
              {isExpanded ? <IconFolderOpen size={14} /> : <IconFolder size={14} />}
            </span>
          </>
        ) : (
          <>
            <span className="file-indent-spacer" />
            <span className="item-icon file-icon">
              <IconFileDrawing size={14} />
            </span>
          </>
        )}

        <span className="item-name">{displayName}</span>

        {/* Action icons on hover for folders */}
        {isFolder && (
          <div className="folder-hover-actions">
            <button
              className="folder-action-btn"
              onClick={handleQuickNewFile}
              title="New Drawing in folder"
            >
              <IconNewFile size={12} />
            </button>
            <button
              className="folder-action-btn"
              onClick={handleQuickNewFolder}
              title="New Subfolder"
            >
              <IconNewFolder size={12} />
            </button>
          </div>
        )}

        {isActive && !isFolder && <span className="active-indicator" />}
      </div>

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          items={menuItems}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  );
};
