use tauri::State;
use std::sync::Mutex;
use std::path::PathBuf;
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use crate::files::io::{read_file, write_file_atomic};
use crate::files::assets::{extract_assets, inject_assets};
use crate::files::security::resolve_vault_path;
use std::fs;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct DrawingData {
    pub path: String,
    pub content: String,
    pub last_modified: u64,
}

#[tauri::command]
pub fn read_drawing(path: String, state: State<'_, Mutex<AppState>>) -> Result<DrawingData, String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let full_path = resolve_vault_path(&vault.path, &path)?;
    let raw_content = read_file(&full_path)?;
    let content = inject_assets(&vault.path, &raw_content)?;
    
    let metadata = fs::metadata(&full_path).map_err(|e| e.to_string())?;
    let last_modified = metadata.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH)
        .duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();

    let rel_path = full_path.strip_prefix(&vault.path)
        .map_err(|e| e.to_string())?
        .to_string_lossy()
        .to_string()
        .replace('\\', "/");

    Ok(DrawingData {
        path: rel_path,
        content,
        last_modified,
    })
}

#[tauri::command]
pub fn save_drawing(path: String, content: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let full_path = resolve_vault_path(&vault.path, &path)?;
    let processed_content = extract_assets(&vault.path, &content)?;
    write_file_atomic(&full_path, &processed_content)?;
    Ok(())
}

#[tauri::command]
pub fn create_drawing(name: String, folder: Option<String>, state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let raw_name = name.trim();
    if raw_name.is_empty() || raw_name.contains('/') || raw_name.contains('\\') || raw_name.contains("..") || raw_name.contains('\0') {
        return Err("Invalid drawing file name".to_string());
    }

    let file_name = if raw_name.ends_with(".excalidraw") { 
        raw_name.to_string() 
    } else { 
        format!("{}.excalidraw", raw_name) 
    };

    let folder_str = folder.unwrap_or_default();
    let full_dir = resolve_vault_path(&vault.path, &folder_str)?;
    
    fs::create_dir_all(&full_dir).map_err(|e| e.to_string())?;
    
    let rel_file = if folder_str.trim().is_empty() || folder_str == "." {
        file_name.clone()
    } else {
        PathBuf::from(folder_str.trim_start_matches('/').trim_start_matches('\\'))
            .join(&file_name)
            .to_string_lossy()
            .to_string()
    };

    let full_path = resolve_vault_path(&vault.path, &rel_file)?;
    
    let initial_content = r#"{"type":"excalidraw","version":2,"source":"excalideck","elements":[],"appState":{"zoom":{"value":1},"scrollX":0,"scrollY":0},"files":{}}"#;
    write_file_atomic(&full_path, initial_content)?;
    
    let rel_path = full_path.strip_prefix(&vault.path)
        .map_err(|e| e.to_string())?
        .to_string_lossy()
        .to_string()
        .replace('\\', "/");

    Ok(rel_path)
}

#[tauri::command]
pub fn delete_file(path: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let full_path = resolve_vault_path(&vault.path, &path)?;
    if full_path == vault.path {
        return Err("Cannot delete root vault directory via delete_file".to_string());
    }

    if full_path.is_dir() {
        fs::remove_dir_all(full_path).map_err(|e| e.to_string())?;
    } else {
        fs::remove_file(full_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn rename_file(oldPath: String, newName: String, state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    if newName.is_empty() || newName.contains('/') || newName.contains('\\') || newName.contains("..") || newName.contains('\0') {
        return Err("Invalid new file name".to_string());
    }

    let old_full = resolve_vault_path(&vault.path, &oldPath)?;
    if old_full == vault.path {
        return Err("Cannot rename root vault directory".to_string());
    }

    let new_full = old_full.with_file_name(&newName);
    let canonical_vault = vault.path.canonicalize().map_err(|e| e.to_string())?;
    if let Some(parent) = new_full.parent() {
        let canonical_parent = parent.canonicalize().map_err(|e| e.to_string())?;
        if !canonical_parent.starts_with(&canonical_vault) {
            return Err("Rename destination escapes vault boundary".to_string());
        }
    }

    fs::rename(&old_full, &new_full).map_err(|e| e.to_string())?;
    
    let rel_path = new_full.strip_prefix(&vault.path).map_err(|e| e.to_string())?;
    Ok(rel_path.to_string_lossy().to_string().replace('\\', "/"))
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn move_file(src: String, destFolder: String, state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let src_full = resolve_vault_path(&vault.path, &src)?;
    if !src_full.exists() {
        return Err(format!("Source file does not exist: {}", src));
    }
    if src_full == vault.path {
        return Err("Cannot move root vault directory".to_string());
    }

    let file_name = src_full
        .file_name()
        .ok_or_else(|| "Invalid source file name".to_string())?
        .to_string_lossy()
        .to_string();

    let dest_dir = resolve_vault_path(&vault.path, &destFolder)?;
    if !dest_dir.exists() {
        fs::create_dir_all(&dest_dir).map_err(|e| e.to_string())?;
    }

    let dest_full = dest_dir.join(&file_name);

    if src_full == dest_full {
        let rel_path = dest_full.strip_prefix(&vault.path).map_err(|e| e.to_string())?;
        return Ok(rel_path.to_string_lossy().to_string().replace('\\', "/"));
    }

    if src_full.is_dir() && dest_full.starts_with(&src_full) {
        return Err("Cannot move a folder into itself or its child directory".to_string());
    }

    fs::rename(&src_full, &dest_full).map_err(|e| format!("Failed to move file: {}", e))?;
    
    let rel_path = dest_full.strip_prefix(&vault.path).map_err(|e| e.to_string())?;
    Ok(rel_path.to_string_lossy().to_string().replace('\\', "/"))
}
