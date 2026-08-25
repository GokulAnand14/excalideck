use tauri::State;
use std::sync::Mutex;
use std::path::PathBuf;
use crate::state::AppState;
use crate::vault::manager::{Vault, VaultInfo};
use crate::config::RecentVault;
use crate::files::watcher::start_watcher;
use std::time::{SystemTime, UNIX_EPOCH};

#[tauri::command]
pub fn open_vault(path: String, state: State<'_, Mutex<AppState>>, app: tauri::AppHandle) -> Result<VaultInfo, String> {
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() || !path_buf.is_dir() {
        return Err("Path is not a valid directory".to_string());
    }
    
    let vault = Vault::new(path_buf.clone());
    let info = vault.get_info();
    
    let mut state_guard = state.lock().unwrap();
    state_guard.vault = Some(vault);
    
    if let Ok(watcher) = start_watcher(&path_buf, app) {
        state_guard.watcher_handle = Some(watcher);
    }
    
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_secs();
    
    let rv = RecentVault {
        name: info.name.clone(),
        path: info.path.clone(),
        last_opened: now,
    };
    
    state_guard.config.recent_vaults.retain(|v| v.path != info.path);
    state_guard.config.recent_vaults.insert(0, rv);
    state_guard.config.save();
    
    Ok(info)
}

#[tauri::command]
pub fn create_vault(path: String, name: String, state: State<'_, Mutex<AppState>>, app: tauri::AppHandle) -> Result<VaultInfo, String> {
    let path_buf = PathBuf::from(&path).join(&name);
    std::fs::create_dir_all(&path_buf).map_err(|e| e.to_string())?;
    let excalideck_dir = path_buf.join(".excalideck");
    std::fs::create_dir_all(&excalideck_dir).map_err(|e| e.to_string())?;
    
    open_vault(path_buf.to_string_lossy().to_string(), state, app)
}

#[tauri::command]
pub fn get_recent_vaults(state: State<'_, Mutex<AppState>>) -> Result<Vec<RecentVault>, String> {
    Ok(state.lock().unwrap().config.recent_vaults.clone())
}

#[tauri::command]
pub fn close_vault(state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let mut state_guard = state.lock().unwrap();
    state_guard.watcher_handle = None;
    state_guard.vault = None;
    Ok(())
}
