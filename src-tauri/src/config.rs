use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::PathBuf;
use std::fs;
use directories::ProjectDirs;

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct ViewportState {
    pub scroll_x: f64,
    pub scroll_y: f64,
    pub zoom: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct WorkspaceState {
    #[serde(default)]
    pub active_file: Option<String>,
    #[serde(default)]
    pub viewports: HashMap<String, ViewportState>,
    #[serde(default = "default_sidebar_open")]
    pub sidebar_open: bool,
    #[serde(default = "default_sidebar_width")]
    pub sidebar_width: u32,
    #[serde(default)]
    pub collapsed_folders: Vec<String>,
}

fn default_sidebar_open() -> bool {
    true
}

fn default_sidebar_width() -> u32 {
    260
}

impl Default for WorkspaceState {
    fn default() -> Self {
        Self {
            active_file: None,
            viewports: HashMap::new(),
            sidebar_open: default_sidebar_open(),
            sidebar_width: default_sidebar_width(),
            collapsed_folders: Vec::new(),
        }
    }
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct RecentVault {
    pub name: String,
    pub path: String,
    pub last_opened: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub recent_vaults: Vec<RecentVault>,
    #[serde(default = "default_theme")]
    pub theme: String,
}

fn default_theme() -> String {
    "dark".to_string()
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            recent_vaults: Vec::new(),
            theme: default_theme(),
        }
    }
}

impl AppConfig {
    pub fn load(base_dir: Option<&std::path::Path>) -> Self {
        let config_path = Self::get_config_path(base_dir);
        if let Some(path) = config_path {
            if path.exists() {
                if let Ok(content) = fs::read_to_string(&path) {
                    if let Ok(config) = serde_json::from_str(&content) {
                        return config;
                    }
                }
            }
        }
        AppConfig::default()
    }

    pub fn save(&self, base_dir: Option<&std::path::Path>) {
        if let Some(path) = Self::get_config_path(base_dir) {
            if let Some(parent) = path.parent() {
                let _ = fs::create_dir_all(parent);
            }
            if let Ok(content) = serde_json::to_string_pretty(self) {
                let tmp_path = path.with_extension("tmp");
                if fs::write(&tmp_path, &content).is_ok() {
                    let _ = fs::rename(tmp_path, path);
                }
            }
        }
    }

    fn get_config_path(base_dir: Option<&std::path::Path>) -> Option<PathBuf> {
        if let Some(dir) = base_dir {
            return Some(dir.join("config.json"));
        }
        ProjectDirs::from("com", "excalideck", "excalideck").map(|proj_dirs| {
            proj_dirs.config_dir().join("config.json")
        })
    }
}
