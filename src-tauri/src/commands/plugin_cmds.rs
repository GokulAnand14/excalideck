use tauri::State;
use std::sync::Mutex;
use std::path::PathBuf;
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use std::fs;
use std::collections::HashMap;

// Using tmp+rename pattern for atomic writes if write_file_atomic isn't easily accessible,
// but we will try to use crate::files::io::write_file_atomic.
use crate::files::io::write_file_atomic;

fn validate_plugin_id(id: &str) -> Result<(), String> {
    if id.contains('/') || id.contains('\\') || id.contains("..") {
        return Err("Invalid plugin ID".to_string());
    }
    Ok(())
}

fn validate_path_safe(path: &str) -> Result<(), String> {
    if path.contains("..") {
        return Err("Path traversal not allowed".to_string());
    }
    Ok(())
}

fn get_storage_path(vault_path: &std::path::Path, plugin_id: &str) -> PathBuf {
    vault_path.join(".excalideck").join("plugin-data").join(plugin_id).join("storage.json")
}

fn read_storage(path: &std::path::Path) -> Result<HashMap<String, String>, String> {
    if !path.exists() {
        return Ok(HashMap::new());
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    if content.trim().is_empty() {
        return Ok(HashMap::new());
    }
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

fn write_storage(path: &std::path::Path, data: &HashMap<String, String>) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(data).map_err(|e| e.to_string())?;
    write_file_atomic(path, &content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn plugin_storage_get(plugin_id: String, key: String, state: State<'_, Mutex<AppState>>) -> Result<Option<String>, String> {
    validate_plugin_id(&plugin_id)?;
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let path = get_storage_path(&vault.path, &plugin_id);
    let storage = read_storage(&path)?;
    Ok(storage.get(&key).cloned())
}

#[tauri::command]
pub fn plugin_storage_set(plugin_id: String, key: String, value: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    validate_plugin_id(&plugin_id)?;
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let path = get_storage_path(&vault.path, &plugin_id);
    let mut storage = read_storage(&path)?;
    storage.insert(key, value);
    write_storage(&path, &storage)
}

#[tauri::command]
pub fn plugin_storage_delete(plugin_id: String, key: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    validate_plugin_id(&plugin_id)?;
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let path = get_storage_path(&vault.path, &plugin_id);
    let mut storage = read_storage(&path)?;
    if storage.remove(&key).is_some() {
        write_storage(&path, &storage)?;
    }
    Ok(())
}

#[tauri::command]
pub fn plugin_storage_keys(plugin_id: String, state: State<'_, Mutex<AppState>>) -> Result<Vec<String>, String> {
    validate_plugin_id(&plugin_id)?;
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let path = get_storage_path(&vault.path, &plugin_id);
    let storage = read_storage(&path)?;
    Ok(storage.into_keys().collect())
}

fn default_main() -> String {
    "index.js".to_string()
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct CommunityPluginInfo {
    pub id: String,
    pub name: String,
    pub version: String,
    #[serde(default)]
    pub description: String,
    #[serde(default)]
    pub author: String,
    #[serde(default = "default_main")]
    pub main: String,
    #[serde(default)]
    pub dir_path: String,
}

#[tauri::command]
pub fn list_community_plugins(state: State<'_, Mutex<AppState>>) -> Result<Vec<CommunityPluginInfo>, String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let plugins_dir = vault.path.join(".excalideck").join("plugins");
    if !plugins_dir.exists() {
        return Ok(Vec::new());
    }
    
    let plugins = fs::read_dir(plugins_dir)
        .map_err(|e| e.to_string())?
        .filter_map(Result::ok)
        .filter(|entry| entry.path().is_dir())
        .filter_map(|entry| {
            let path = entry.path();
            let content = fs::read_to_string(path.join("plugin.json")).ok()?;
            let mut info = serde_json::from_str::<CommunityPluginInfo>(&content).ok()?;
            info.dir_path = path.to_string_lossy().to_string();
            Some(info)
        })
        .collect();
    
    Ok(plugins)
}

#[tauri::command]
pub fn read_plugin_file(plugin_id: String, relative_path: String, state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    validate_plugin_id(&plugin_id)?;
    validate_path_safe(&relative_path)?;
    
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let plugin_dir = vault.path.join(".excalideck").join("plugins").join(&plugin_id);
    let file_path = plugin_dir.join(&relative_path);
    
    // Canonicalize to resolve symlinks and verify the path stays within the plugin dir
    let canonical_dir = plugin_dir.canonicalize().map_err(|e| format!("Plugin directory not found: {}", e))?;
    let canonical_file = file_path.canonicalize().map_err(|e| format!("Plugin file not found: {}", e))?;
    if !canonical_file.starts_with(&canonical_dir) {
        return Err("Path escapes plugin directory".to_string());
    }
    
    fs::read_to_string(canonical_file).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn install_community_plugin(
    plugin_id: String,
    manifest_json: String,
    main_filename: String,
    main_code: String,
    state: State<'_, Mutex<AppState>>,
) -> Result<(), String> {
    validate_plugin_id(&plugin_id)?;
    validate_path_safe(&main_filename)?;

    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;

    let plugin_dir = vault.path.join(".excalideck").join("plugins").join(&plugin_id);
    fs::create_dir_all(&plugin_dir).map_err(|e| e.to_string())?;

    let manifest_path = plugin_dir.join("plugin.json");
    write_file_atomic(&manifest_path, &manifest_json)?;

    let code_path = plugin_dir.join(&main_filename);
    write_file_atomic(&code_path, &main_code)?;

    Ok(())
}

#[tauri::command]
pub fn uninstall_community_plugin(
    plugin_id: String,
    state: State<'_, Mutex<AppState>>,
) -> Result<(), String> {
    validate_plugin_id(&plugin_id)?;

    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;

    let plugin_dir = vault.path.join(".excalideck").join("plugins").join(&plugin_id);
    if plugin_dir.exists() {
        fs::remove_dir_all(&plugin_dir).map_err(|e| e.to_string())?;
    }

    Ok(())
}

