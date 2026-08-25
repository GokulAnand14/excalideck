use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct VaultInfo {
    pub name: String,
    pub path: String,
    pub drawing_count: usize,
}

pub struct Vault {
    pub path: PathBuf,
}

impl Vault {
    pub fn new(path: PathBuf) -> Self {
        Self { path }
    }

    pub fn get_info(&self) -> VaultInfo {
        let name = self
            .path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();
        let path = self.path.to_string_lossy().to_string();
        let drawing_count = walkdir::WalkDir::new(&self.path)
            .into_iter()
            .filter_map(|e| e.ok())
            .filter(|e| {
                e.path()
                    .extension()
                    .map_or(false, |ext| ext == "excalidraw")
            })
            .count();

        VaultInfo {
            name,
            path,
            drawing_count,
        }
    }
}
