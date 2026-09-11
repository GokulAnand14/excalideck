use crate::config::AppConfig;
use crate::vault::manager::Vault;
use notify_debouncer_full::{Debouncer, NoCache};
use notify::RecommendedWatcher;
use tauri::Manager;

use std::path::PathBuf;

pub struct AppState {
    pub vault: Option<Vault>,
    pub config: AppConfig,
    pub config_dir: Option<PathBuf>,
    pub watcher_handle: Option<Debouncer<RecommendedWatcher, NoCache>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self::new()
    }
}

impl AppState {
    pub fn new() -> Self {
        Self {
            vault: None,
            config: AppConfig::load(None),
            config_dir: None,
            watcher_handle: None,
        }
    }

    pub fn ensure_config_dir(&mut self, app: &tauri::AppHandle) {
        if self.config_dir.is_none() {
            let dir = app.path().app_config_dir()
                .or_else(|_| app.path().app_data_dir())
                .or_else(|_| app.path().app_local_data_dir())
                .ok();
            if let Some(d) = dir {
                self.set_config_dir(d);
            }
        }
    }

    pub fn set_config_dir(&mut self, dir: PathBuf) {
        self.config = AppConfig::load(Some(&dir));
        self.config_dir = Some(dir);
    }

    pub fn save_config(&self) {
        self.config.save(self.config_dir.as_deref());
    }
}
