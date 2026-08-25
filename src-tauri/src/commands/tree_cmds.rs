use tauri::State;
use std::sync::Mutex;
use crate::state::AppState;
use crate::files::tree::{build_tree, FileTreeNode};

#[tauri::command]
pub fn get_file_tree(state: State<'_, Mutex<AppState>>) -> Result<FileTreeNode, String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    build_tree(&vault.path)
}

#[tauri::command]
pub fn create_folder(path: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    std::fs::create_dir_all(vault.path.join(path)).map_err(|e| e.to_string())?;
    Ok(())
}
