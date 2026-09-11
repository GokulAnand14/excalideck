use tauri::State;
use std::sync::Mutex;
use crate::state::AppState;
use crate::config::AppConfig;

#[tauri::command]
pub fn get_app_config(state: State<'_, Mutex<AppState>>, app: tauri::AppHandle) -> Result<AppConfig, String> {
    let mut state_guard = state.lock().unwrap();
    state_guard.ensure_config_dir(&app);
    Ok(state_guard.config.clone())
}

#[tauri::command]
pub fn set_app_config(config: AppConfig, state: State<'_, Mutex<AppState>>, app: tauri::AppHandle) -> Result<(), String> {
    let mut state_guard = state.lock().unwrap();
    state_guard.ensure_config_dir(&app);
    state_guard.config = config;
    state_guard.save_config();
    Ok(())
}
