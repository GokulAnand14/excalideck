import React from "react";
import { FileTreeNode } from "../../types/fileTree";
import { FileTreeItem } from "./FileTreeItem";

interface FileTreeProps {
  node: FileTreeNode;
  activeFile: string | null;
  searchQuery?: string;
  collapsedFolders: Set<string>;
  onToggleExpand: (path: string) => void;
  onFileSelect: (path: string) => void;
  onCreateDrawing: (name: string, folder?: string) => void;
  onCreateFolder: (path: string) => void;
  onDeleteFile: (path: string) => void;
  onRenameFile: (oldPath: string, newName: string) => void;
  onOpenMoveModal: (path: string, isFolder: boolean) => void;
  draggedItem: { path: string; isFolder: boolean } | null;
  dropTargetFolder: string | null;
  onItemPointerDown: (e: React.PointerEvent, node: FileTreeNode) => void;
  level?: number;
}

export const FileTree: React.FC<FileTreeProps> = ({
  node,
  activeFile,
  searchQuery = "",
  collapsedFolders,
  onToggleExpand,
  onFileSelect,
  onCreateDrawing,
  onCreateFolder,
  onDeleteFile,
  onRenameFile,
  onOpenMoveModal,
  draggedItem,
  dropTargetFolder,
  onItemPointerDown,
  level = 0,
}) => {
  // Hide internal folders from tree
  if (
    node.nodeType === "directory" &&
    (node.name === ".excalideck" || node.name === "assets" || node.name.startsWith("."))
  ) {
    return null;
  }

  // If search query is active, filter node visibility
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    const matchesNode = node.name.toLowerCase().includes(q);

    const hasMatchingChild = (n: FileTreeNode): boolean => {
      if (n.name.toLowerCase().includes(q)) return true;
      return n.children?.some((c) => hasMatchingChild(c)) || false;
    };

    if (!matchesNode && !hasMatchingChild(node)) {
      return null;
    }
  }

  // For root level, render children directly
  if (level === 0 && node.nodeType === "directory") {
    return (
      <div className="file-tree-root">
        {node.children && node.children.length > 0 ? (
          node.children.map((child) => (
            <FileTree
              key={child.path}
              node={child}
              activeFile={activeFile}
              searchQuery={searchQuery}
              collapsedFolders={collapsedFolders}
              onToggleExpand={onToggleExpand}
              onFileSelect={onFileSelect}
              onCreateDrawing={onCreateDrawing}
              onCreateFolder={onCreateFolder}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
              onOpenMoveModal={onOpenMoveModal}
              draggedItem={draggedItem}
              dropTargetFolder={dropTargetFolder}
              onItemPointerDown={onItemPointerDown}
              level={level + 1}
            />
          ))
        ) : (
          <div className="file-tree-empty-hint">
            <span>No drawings in vault</span>
          </div>
        )}
      </div>
    );
  }

  const isFolder = node.nodeType === "directory";
  const isExpanded = isFolder && !collapsedFolders.has(node.path);
  const isDraggingThis = draggedItem?.path === node.path;
  const isDropTargetThis = dropTargetFolder === node.path;

  return (
    <div className="file-tree-branch">
      <FileTreeItem
        node={node}
        activeFile={activeFile}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        onFileSelect={onFileSelect}
        onCreateDrawing={onCreateDrawing}
        onCreateFolder={onCreateFolder}
        onDeleteFile={onDeleteFile}
        onRenameFile={onRenameFile}
        onOpenMoveModal={onOpenMoveModal}
        isDraggingThis={isDraggingThis}
        isDropTargetThis={isDropTargetThis}
        onItemPointerDown={onItemPointerDown}
        level={level}
      />
      {isFolder && isExpanded && node.children && (
        <div className="file-tree-children">
          {node.children.map((child) => (
            <FileTree
              key={child.path}
              node={child}
              activeFile={activeFile}
              searchQuery={searchQuery}
              collapsedFolders={collapsedFolders}
              onToggleExpand={onToggleExpand}
              onFileSelect={onFileSelect}
              onCreateDrawing={onCreateDrawing}
              onCreateFolder={onCreateFolder}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
              onOpenMoveModal={onOpenMoveModal}
              draggedItem={draggedItem}
              dropTargetFolder={dropTargetFolder}
              onItemPointerDown={onItemPointerDown}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
