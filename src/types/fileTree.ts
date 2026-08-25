export type FileNodeType = "file" | "directory";

export interface FileTreeNode {
  name: string;
  path: string;
  nodeType: FileNodeType;
  children?: FileTreeNode[];
}
