pub mod commands;
pub mod config;
pub mod files;
pub mod state;
pub mod vault;

use state::AppState;
use std::sync::Mutex;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let _ = env_logger::try_init();

    let app_state = AppState::new();

    tauri::Builder::default()
        .setup(|app| {
            eprintln!("[Excalideck] Tauri application setup complete.");
            
            // Explicitly set runtime window and taskbar icon
            if let Some(window) = app.get_webview_window("main") {
                if let Ok(icon) = tauri::image::Image::from_bytes(include_bytes!("../icons/128x128.png")) {
                    let _ = window.set_icon(icon);
                }
            }
            
            Ok(())
        })
        .manage(Mutex::new(app_state))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            commands::vault_cmds::open_vault,
            commands::vault_cmds::create_vault,
            commands::vault_cmds::get_recent_vaults,
            commands::vault_cmds::close_vault,
            commands::file_cmds::read_drawing,
            commands::file_cmds::save_drawing,
            commands::file_cmds::create_drawing,
            commands::file_cmds::delete_file,
            commands::file_cmds::rename_file,
            commands::file_cmds::move_file,
            commands::tree_cmds::get_file_tree,
            commands::tree_cmds::create_folder,
            commands::asset_cmds::save_asset,
            commands::asset_cmds::get_asset_path,
            commands::library_cmds::list_libraries,
            commands::library_cmds::save_library,
            commands::library_cmds::load_library,
            commands::config_cmds::get_app_config,
            commands::config_cmds::set_app_config,
            commands::plugin_cmds::plugin_storage_get,
            commands::plugin_cmds::plugin_storage_set,
            commands::plugin_cmds::plugin_storage_delete,
            commands::plugin_cmds::plugin_storage_keys,
            commands::plugin_cmds::list_community_plugins,
            commands::plugin_cmds::read_plugin_file,
            commands::plugin_cmds::install_community_plugin,
            commands::plugin_cmds::uninstall_community_plugin,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
