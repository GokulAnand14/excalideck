import React, { useState } from "react";
import { FileTreeNode } from "../../types/fileTree";
import { ContextMenu, ContextMenuItem } from "../common/ContextMenu";
import { useDialog } from "../../context/DialogContext";
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
  const { promptDialog, confirmDialog } = useDialog();
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
  const handleQuickNewFile = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = await promptDialog({
      title: "Create New Drawing",
      subtitle: `Inside folder: /${node.path}`,
      placeholder: "Untitled",
      defaultValue: "Untitled",
      confirmText: "Create",
      icon: "✏️",
    });
    if (name) {
      onCreateDrawing(name, node.path);
      if (!isExpanded) {
        onToggleExpand(node.path);
      }
    }
  };

  const handleQuickNewFolder = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const name = await promptDialog({
      title: "Create New Subfolder",
      subtitle: `Inside parent: /${node.path}`,
      placeholder: "Subfolder",
      defaultValue: "Subfolder",
      confirmText: "Create Subfolder",
      icon: "📁",
    });
    if (name) {
      onCreateFolder(`${node.path}/${name}`);
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
        onClick: async () => {
          const name = await promptDialog({
            title: "Create New Drawing",
            subtitle: `Inside folder: /${node.path}`,
            placeholder: "Untitled",
            defaultValue: "Untitled",
            confirmText: "Create",
            icon: "✏️",
          });
          if (name) {
            onCreateDrawing(name, node.path);
            if (!isExpanded) {
              onToggleExpand(node.path);
            }
          }
        },
      },
      {
        label: "New Subfolder",
        icon: "📁",
        onClick: async () => {
          const name = await promptDialog({
            title: "Create New Subfolder",
            subtitle: `Inside parent: /${node.path}`,
            placeholder: "Subfolder",
            defaultValue: "Subfolder",
            confirmText: "Create Subfolder",
            icon: "📁",
          });
          if (name) {
            onCreateFolder(`${node.path}/${name}`);
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
      onClick: async () => {
        const currentCleanName = node.name.replace(".excalidraw", "");
        const newName = await promptDialog({
          title: isFolder ? "Rename Folder" : "Rename Drawing",
          placeholder: currentCleanName,
          defaultValue: currentCleanName,
          confirmText: "Rename",
          icon: "🏷️",
        });
        if (newName && newName !== currentCleanName) {
          const finalName = isFolder ? newName : `${newName}.excalidraw`;
          onRenameFile(node.path, finalName);
        }
      },
    },
    {
      label: "Delete",
      icon: "🗑️",
      danger: true,
      onClick: async () => {
        const confirmed = await confirmDialog({
          title: isFolder ? "Delete Folder" : "Delete Drawing",
          message: `Are you sure you want to delete "${node.name}"? This action cannot be undone.`,
          danger: true,
          confirmText: "Delete",
          icon: "🗑️",
        });
        if (confirmed) {
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
