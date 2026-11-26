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
            .filter_entry(|e| {
                // Skip hidden/internal folders like .excalideck (which holds backups) and .git
                if e.depth() > 0 {
                    let name = e.file_name().to_string_lossy();
                    if name.starts_with('.') {
                        return false;
                    }
                }
                true
            })
            .filter_map(|e| e.ok())
            .filter(|e| {
                e.file_type().is_file()
                    && e.path()
                        .extension()
                        .is_some_and(|ext| ext == "excalidraw")
            })
            .count();

        VaultInfo {
            name,
            path,
            drawing_count,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_vault_info_excludes_hidden_backups() {
        let temp_dir = std::env::temp_dir().join("excalideck_test_vault_info");
        let _ = fs::remove_dir_all(&temp_dir);
        fs::create_dir_all(temp_dir.join(".excalideck").join("backups")).unwrap();
        fs::create_dir_all(temp_dir.join("sub")).unwrap();
        fs::write(temp_dir.join("one.excalidraw"), "{}").unwrap();
        fs::write(temp_dir.join("sub").join("two.excalidraw"), "{}").unwrap();
        fs::write(
            temp_dir.join(".excalideck").join("backups").join("123.excalidraw"),
            "{}",
        )
        .unwrap();

        let vault = Vault::new(temp_dir.clone());
        let info = vault.get_info();
        let _ = fs::remove_dir_all(&temp_dir);

        assert_eq!(info.drawing_count, 2);
    }
}
