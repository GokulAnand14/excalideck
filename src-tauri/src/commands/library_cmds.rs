use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;
use crate::state::AppState;

#[derive(Serialize, Deserialize, Clone)]
pub struct LibraryInfo {
    pub name: String,
    pub path: String,
}

#[tauri::command]
pub fn list_libraries(state: State<'_, Mutex<AppState>>) -> Result<Vec<LibraryInfo>, String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let mut libs = Vec::new();
    for entry in walkdir::WalkDir::new(&vault.path).into_iter().filter_map(|e| e.ok()) {
        if entry.path().extension().map_or(false, |ext| ext == "excalidrawlib") {
            let rel_path = entry.path().strip_prefix(&vault.path).unwrap().to_string_lossy().to_string();
            libs.push(LibraryInfo {
                name: entry.file_name().to_string_lossy().to_string(),
                path: rel_path,
            });
        }
    }
    Ok(libs)
}

#[tauri::command]
pub fn save_library(name: String, content: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    let lib_name = if name.ends_with(".excalidrawlib") { name } else { format!("{}.excalidrawlib", name) };
    let full_path = vault.path.join(lib_name);
    
    crate::files::io::write_file_atomic(&full_path, &content)
}

#[tauri::command]
pub fn load_library(path: String, state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    let full_path = vault.path.join(path);
    crate::files::io::read_file(&full_path)
}
