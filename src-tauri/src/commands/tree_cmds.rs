use tauri::State;
use std::sync::Mutex;
use crate::state::AppState;
use crate::files::tree::{build_tree, FileTreeNode};
use crate::files::security::resolve_vault_path;

#[tauri::command]
pub fn get_file_tree(state: State<'_, Mutex<AppState>>) -> Result<FileTreeNode, String> {
    let state_guard = state.lock().map_err(|e| format!("State lock error: {}", e))?;
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    build_tree(&vault.path)
}

#[tauri::command]
pub fn create_folder(path: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let trimmed = path.trim();
    if trimmed.is_empty() || trimmed == "." {
        return Err("Folder name cannot be empty".to_string());
    }
    let state_guard = state.lock().map_err(|e| format!("State lock error: {}", e))?;
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    let target = resolve_vault_path(&vault.path, trimmed)?;
    if target.exists() {
        return Err("A folder with this name already exists".to_string());
    }
    std::fs::create_dir_all(&target).map_err(|e| e.to_string())?;
    Ok(())
}
