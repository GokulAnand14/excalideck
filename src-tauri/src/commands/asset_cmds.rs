use tauri::State;
use std::sync::Mutex;
use crate::state::AppState;
use std::fs;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

#[tauri::command]
#[allow(non_snake_case)]
pub fn save_asset(id: String, data: String, mimeType: String, state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    let assets_dir = vault.path.join("assets");
    fs::create_dir_all(&assets_dir).map_err(|e| e.to_string())?;
    
    let ext = mimeType.split('/').last().unwrap_or("png");
    let file_name = format!("{}.{}", id, ext);
    let asset_path = assets_dir.join(&file_name);
    
    let decoded = BASE64.decode(data).map_err(|e| e.to_string())?;
    fs::write(&asset_path, decoded).map_err(|e| e.to_string())?;
    
    Ok(asset_path.to_string_lossy().to_string())
}

#[tauri::command]
pub fn get_asset_path(id: String, state: State<'_, Mutex<AppState>>) -> Result<Option<String>, String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    let assets_dir = vault.path.join("assets");
    let legacy_assets_dir = vault.path.join(".excalideck").join("assets");
    
    for dir in &[assets_dir, legacy_assets_dir] {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.filter_map(|e| e.ok()) {
                if entry.file_name().to_string_lossy().starts_with(&id) {
                    return Ok(Some(entry.path().to_string_lossy().to_string()));
                }
            }
        }
    }
    Ok(None)
}
