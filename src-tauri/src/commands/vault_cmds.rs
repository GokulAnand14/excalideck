use tauri::State;
use std::sync::Mutex;
use std::path::PathBuf;
use crate::state::AppState;
use crate::vault::manager::{Vault, VaultInfo};
use crate::config::RecentVault;
use crate::files::watcher::start_watcher;
use std::time::{SystemTime, UNIX_EPOCH};

pub fn get_vaults_root_dir(app: &tauri::AppHandle) -> Result<PathBuf, String> {
    use tauri::Manager;

    #[cfg(any(target_os = "android", target_os = "ios"))]
    {
        if let Ok(dir) = app.path().app_data_dir() {
            let vaults_dir = dir.join("vaults");
            let _ = std::fs::create_dir_all(&vaults_dir);
            return Ok(vaults_dir);
        }
        if let Ok(dir) = app.path().app_local_data_dir() {
            let vaults_dir = dir.join("vaults");
            let _ = std::fs::create_dir_all(&vaults_dir);
            return Ok(vaults_dir);
        }
        if let Ok(dir) = app.path().document_dir() {
            let vaults_dir = dir.join("vaults");
            let _ = std::fs::create_dir_all(&vaults_dir);
            return Ok(vaults_dir);
        }
        Err("Failed to resolve app data directory for mobile vault storage".to_string())
    }

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        if let Ok(doc_dir) = app.path().document_dir() {
            return Ok(doc_dir);
        }
        if let Ok(data_dir) = app.path().app_data_dir() {
            return Ok(data_dir);
        }
        Err("Could not find documents or app data directory".to_string())
    }
}

#[tauri::command]
pub fn open_vault(path: String, state: State<'_, Mutex<AppState>>, app: tauri::AppHandle) -> Result<VaultInfo, String> {
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() || !path_buf.is_dir() {
        return Err("Path is not a valid directory".to_string());
    }
    
    let vault = Vault::new(path_buf.clone());
    let info = vault.get_info();
    
    let mut state_guard = state.lock().unwrap();
    state_guard.ensure_config_dir(&app);
    // Cleanly unbind prior watcher before attaching new vault watcher
    state_guard.watcher_handle = None;
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
    state_guard.save_config();
    
    Ok(info)
}

#[tauri::command]
pub fn create_vault(path: String, name: String, state: State<'_, Mutex<AppState>>, app: tauri::AppHandle) -> Result<VaultInfo, String> {
    let trimmed_name = name.trim();
    if trimmed_name.is_empty() {
        return Err("Vault name cannot be empty".to_string());
    }

    let parent_dir = if path.trim().is_empty() || path == "__APP_DEFAULT__" {
        get_vaults_root_dir(&app)?
    } else {
        PathBuf::from(&path)
    };

    let path_buf = parent_dir.join(trimmed_name);
    std::fs::create_dir_all(&path_buf).map_err(|e| e.to_string())?;
    let excalideck_dir = path_buf.join(".excalideck");
    std::fs::create_dir_all(&excalideck_dir).map_err(|e| e.to_string())?;
    
    open_vault(path_buf.to_string_lossy().to_string(), state, app)
}

#[tauri::command]
pub fn get_default_vault_path(app: tauri::AppHandle) -> Result<String, String> {
    let base = get_vaults_root_dir(&app)?;
    #[cfg(any(target_os = "android", target_os = "ios"))]
    let vault_dir = base.join("Main Vault");
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let vault_dir = base.join("Excalideck Vault");
    Ok(vault_dir.to_string_lossy().to_string())
}

#[tauri::command]
pub fn init_default_vault(state: State<'_, Mutex<AppState>>, app: tauri::AppHandle) -> Result<VaultInfo, String> {
    let base = get_vaults_root_dir(&app)?;
    #[cfg(any(target_os = "android", target_os = "ios"))]
    let vault_dir = base.join("Main Vault");
    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    let vault_dir = base.join("Excalideck Vault");

    std::fs::create_dir_all(&vault_dir).map_err(|e| e.to_string())?;
    let excalideck_dir = vault_dir.join(".excalideck");
    std::fs::create_dir_all(&excalideck_dir).map_err(|e| e.to_string())?;

    let welcome_file = vault_dir.join("Welcome to Excalideck.excalidraw");
    if !welcome_file.exists() {
        let initial_content = r##"{"type":"excalidraw","version":2,"source":"excalideck","elements":[{"type":"rectangle","version":1,"versionNonce":1,"isDeleted":false,"id":"welcome-card","fillStyle":"solid","strokeWidth":2,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":120,"y":120,"strokeColor":"#6366f1","backgroundColor":"#1e1e2e","width":520,"height":260,"seed":1,"roundness":{"type":3}},{"type":"text","version":1,"versionNonce":1,"isDeleted":false,"id":"welcome-title","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":160,"y":160,"strokeColor":"#ffffff","backgroundColor":"transparent","width":440,"height":40,"seed":2,"text":"Welcome to Excalideck!","fontSize":26,"fontFamily":1,"textAlign":"left","verticalAlign":"top","baseline":26},{"type":"text","version":1,"versionNonce":1,"isDeleted":false,"id":"welcome-body","fillStyle":"solid","strokeWidth":1,"strokeStyle":"solid","roughness":1,"opacity":100,"angle":0,"x":160,"y":220,"strokeColor":"#cdd6f4","backgroundColor":"transparent","width":440,"height":120,"seed":3,"text":"- Obsidian-inspired local vaults\n- Full touch and Apple Pencil support\n- Isolated assets and zero cloud lock-in\n\nStart sketching anywhere on the canvas!","fontSize":16,"fontFamily":1,"textAlign":"left","verticalAlign":"top","baseline":16}],"appState":{"zoom":{"value":1},"scrollX":0,"scrollY":0},"files":{}}"##;
        let _ = std::fs::write(&welcome_file, initial_content);
    }

    open_vault(vault_dir.to_string_lossy().to_string(), state, app)
}

#[tauri::command]
pub fn list_app_vaults(app: tauri::AppHandle) -> Result<Vec<VaultInfo>, String> {
    let root = match get_vaults_root_dir(&app) {
        Ok(r) => r,
        Err(_) => return Ok(Vec::new()),
    };
    if !root.exists() || !root.is_dir() {
        return Ok(Vec::new());
    }

    let mut vaults = Vec::new();
    if let Ok(entries) = std::fs::read_dir(&root) {
        for entry in entries.flatten() {
            let p = entry.path();
            if p.is_dir() {
                let v = Vault::new(p);
                vaults.push(v.get_info());
            }
        }
    }
    vaults.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));
    Ok(vaults)
}

#[tauri::command]
pub fn delete_vault(path: String, state: State<'_, Mutex<AppState>>, app: tauri::AppHandle) -> Result<(), String> {
    let path_buf = PathBuf::from(&path);
    if !path_buf.exists() || !path_buf.is_dir() {
        return Err("Vault path does not exist".to_string());
    }
    {
        let mut state_guard = state.lock().unwrap();
        state_guard.ensure_config_dir(&app);
        if let Some(ref v) = state_guard.vault {
            if v.path == path_buf {
                state_guard.vault = None;
                state_guard.watcher_handle = None;
            }
        }
        state_guard.config.recent_vaults.retain(|v| v.path != path);
        state_guard.save_config();
    }
    std::fs::remove_dir_all(&path_buf).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub fn get_recent_vaults(state: State<'_, Mutex<AppState>>, app: tauri::AppHandle) -> Result<Vec<RecentVault>, String> {
    let mut state_guard = state.lock().unwrap();
    state_guard.ensure_config_dir(&app);
    Ok(state_guard.config.recent_vaults.clone())
}

#[tauri::command]
pub fn close_vault(state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let mut state_guard = state.lock().unwrap();
    state_guard.watcher_handle = None;
    state_guard.vault = None;
    Ok(())
}
