use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "lowercase")]
pub enum FileNodeType {
    File,
    Directory,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileTreeNode {
    pub name: String,
    pub path: String,
    pub node_type: FileNodeType,
    pub children: Option<Vec<FileTreeNode>>,
}

pub fn build_tree(root: &Path) -> Result<FileTreeNode, String> {
    build_tree_recursive(root, root)
}

fn build_tree_recursive(root: &Path, current: &Path) -> Result<FileTreeNode, String> {
    let name = current
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();

    let rel_path = current
        .strip_prefix(root)
        .unwrap_or(current)
        .to_string_lossy()
        .to_string()
        .replace('\\', "/");

    if current.is_dir() {
        let mut children = Vec::new();

        let mut entries: Vec<_> = std::fs::read_dir(current)
            .map_err(|e| e.to_string())?
            .filter_map(|e| e.ok())
            .collect();

        // Sort: directories first, then alphabetically
        entries.sort_by(|a, b| {
            let a_is_dir = a.path().is_dir();
            let b_is_dir = b.path().is_dir();
            match (a_is_dir, b_is_dir) {
                (true, false) => std::cmp::Ordering::Less,
                (false, true) => std::cmp::Ordering::Greater,
                _ => a.file_name().cmp(&b.file_name()),
            }
        });

        for entry in entries {
            let entry_path = entry.path();
            let entry_name = entry.file_name().to_string_lossy().to_string();

            // Skip hidden dirs and internal folders
            if entry_name.starts_with('.') {
                continue;
            }

            if entry_path.is_dir() {
                if let Ok(child) = build_tree_recursive(root, &entry_path) {
                    children.push(child);
                }
            } else if entry_name.ends_with(".excalidraw") || entry_name.ends_with(".excalidrawlib") {
                let child_rel = entry_path
                    .strip_prefix(root)
                    .unwrap_or(&entry_path)
                    .to_string_lossy()
                    .to_string()
                    .replace('\\', "/");

                children.push(FileTreeNode {
                    name: entry_name,
                    path: child_rel,
                    node_type: FileNodeType::File,
                    children: None,
                });
            }
        }

        Ok(FileTreeNode {
            name,
            path: rel_path,
            node_type: FileNodeType::Directory,
            children: Some(children),
        })
    } else {
        Ok(FileTreeNode {
            name,
            path: rel_path,
            node_type: FileNodeType::File,
            children: None,
        })
    }
}
