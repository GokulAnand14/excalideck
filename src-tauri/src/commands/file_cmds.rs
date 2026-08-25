use tauri::State;
use std::sync::Mutex;
use std::path::PathBuf;
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use crate::files::io::{read_file, write_file_atomic};
use crate::files::assets::{extract_assets, inject_assets};
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
    
    let clean_path = path.trim_start_matches('/').trim_start_matches('\\');
    let full_path = vault.path.join(clean_path);
    let raw_content = read_file(&full_path)?;
    let content = inject_assets(&vault.path, &raw_content)?;
    
    let metadata = fs::metadata(&full_path).map_err(|e| e.to_string())?;
    let last_modified = metadata.modified().unwrap_or(std::time::SystemTime::UNIX_EPOCH)
        .duration_since(std::time::UNIX_EPOCH).unwrap().as_secs();

    Ok(DrawingData {
        path: clean_path.replace('\\', "/"),
        content,
        last_modified,
    })
}

#[tauri::command]
pub fn save_drawing(path: String, content: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let clean_path = path.trim_start_matches('/').trim_start_matches('\\');
    let processed_content = extract_assets(&vault.path, &content)?;
    let full_path = vault.path.join(clean_path);
    write_file_atomic(&full_path, &processed_content)?;
    Ok(())
}

#[tauri::command]
pub fn create_drawing(name: String, folder: Option<String>, state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    
    let rel_dir = folder.unwrap_or_default();
    let clean_dir = rel_dir.trim_start_matches('/').trim_start_matches('\\');
    let full_dir = if clean_dir.is_empty() || clean_dir == "." {
        vault.path.clone()
    } else {
        vault.path.join(clean_dir)
    };
    
    fs::create_dir_all(&full_dir).map_err(|e| e.to_string())?;
    
    let raw_name = name.trim();
    let file_name = if raw_name.ends_with(".excalidraw") { 
        raw_name.to_string() 
    } else { 
        format!("{}.excalidraw", raw_name) 
    };
    let full_path = full_dir.join(&file_name);
    
    let initial_content = r#"{"type":"excalidraw","version":2,"source":"excalideck","elements":[],"appState":{},"files":{}}"#;
    write_file_atomic(&full_path, initial_content)?;
    
    let rel_path = if clean_dir.is_empty() || clean_dir == "." {
        file_name
    } else {
        PathBuf::from(clean_dir).join(file_name).to_string_lossy().to_string().replace('\\', "/")
    };
    Ok(rel_path)
}

#[tauri::command]
pub fn delete_file(path: String, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    let clean_path = path.trim_start_matches('/').trim_start_matches('\\');
    let full_path = vault.path.join(clean_path);
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
    let clean_old = oldPath.trim_start_matches('/').trim_start_matches('\\');
    let old_full = vault.path.join(clean_old);
    let new_full = old_full.with_file_name(&newName);
    fs::rename(&old_full, &new_full).map_err(|e| e.to_string())?;
    
    let rel_path = new_full.strip_prefix(&vault.path).map_err(|e| e.to_string())?;
    Ok(rel_path.to_string_lossy().to_string().replace('\\', "/"))
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn move_file(src: String, destFolder: String, state: State<'_, Mutex<AppState>>) -> Result<String, String> {
    let state_guard = state.lock().unwrap();
    let vault = state_guard.vault.as_ref().ok_or("No vault open")?;
    let clean_src = src.trim_start_matches('/').trim_start_matches('\\').replace('\\', "/");
    let clean_dest = destFolder.trim_start_matches('/').trim_start_matches('\\').replace('\\', "/");
    
    let src_full = vault.path.join(&clean_src);
    if !src_full.exists() {
        return Err(format!("Source file does not exist: {}", clean_src));
    }

    let file_name = src_full
        .file_name()
        .ok_or_else(|| "Invalid source file name".to_string())?
        .to_string_lossy()
        .to_string();

    let dest_dir = if clean_dest.is_empty() || clean_dest == "." {
        vault.path.clone()
    } else {
        vault.path.join(&clean_dest)
    };

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
