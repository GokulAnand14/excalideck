use tauri::State;
use std::sync::Mutex;
use crate::state::AppState;
use crate::config::AppConfig;

#[tauri::command]
pub fn get_app_config(state: State<'_, Mutex<AppState>>) -> Result<AppConfig, String> {
    let state_guard = state.lock().unwrap();
    Ok(state_guard.config.clone())
}

#[tauri::command]
pub fn set_app_config(config: AppConfig, state: State<'_, Mutex<AppState>>) -> Result<(), String> {
    let mut state_guard = state.lock().unwrap();
    state_guard.config = config;
    state_guard.config.save();
    Ok(())
}
