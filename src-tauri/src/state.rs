use crate::config::AppConfig;
use crate::vault::manager::Vault;
use notify_debouncer_full::Debouncer;
use notify::RecommendedWatcher;
use notify_debouncer_full::FileIdMap;

pub struct AppState {
    pub vault: Option<Vault>,
    pub config: AppConfig,
    pub watcher_handle: Option<Debouncer<RecommendedWatcher, FileIdMap>>,
}

impl AppState {
    pub fn new() -> Self {
        Self {
            vault: None,
            config: AppConfig::load(),
            watcher_handle: None,
        }
    }
}
