import React, { useEffect } from "react";
import { FileTreeNode } from "../../types/fileTree";
import { stripDrawingExtension } from "../../lib/constants";
import { IconFolder, IconVault } from "../common/Icons";

interface MoveModalProps {
  itemPath: string;
  isFolder: boolean;
  tree: FileTreeNode | null;
  onMove: (src: string, destFolder: string) => void;
  onClose: () => void;
}

export const MoveModal: React.FC<MoveModalProps> = ({
  itemPath,
  isFolder,
  tree,
  onMove,
  onClose,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const getFolders = (node: FileTreeNode | null, acc: string[] = []): string[] => {
    if (!node) return acc;
    if (node.nodeType === "directory") {
      if (node.path && !node.name.startsWith(".")) {
        acc.push(node.path);
      }
      if (node.children) {
        for (const child of node.children) {
          getFolders(child, acc);
        }
      }
    }
    return acc;
  };

  const allFolders = getFolders(tree);
  const validFolders = allFolders.filter((f) => {
    if (!isFolder) return true;
    return f !== itemPath && !f.startsWith(itemPath + "/");
  });

  const rawLeaf = itemPath.split("/").pop() || itemPath;
  const itemName = isFolder ? rawLeaf : stripDrawingExtension(rawLeaf);

  const handleSelectFolder = (destFolder: string) => {
    onMove(itemPath, destFolder);
    onClose();
  };

  return (
    <div className="move-modal-backdrop" onClick={onClose}>
      <div className="move-modal" onClick={(e) => e.stopPropagation()}>
        <div className="move-modal-header">
          <h3>Move "{itemName}" to...</h3>
          <button className="move-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="move-modal-list">
          <button
            className="move-modal-item root-item"
            onClick={() => handleSelectFolder("")}
          >
            <IconVault size={16} />
            <span>Vault Root (Top Level)</span>
          </button>

          {validFolders.map((folder) => (
            <button
              key={folder}
              className="move-modal-item"
              onClick={() => handleSelectFolder(folder)}
            >
              <IconFolder size={15} />
              <span>/{folder}</span>
            </button>
          ))}

          {validFolders.length === 0 && (
            <div className="move-modal-empty">
              <span>No subfolders found. Choose Vault Root above or create a new folder in the sidebar.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
