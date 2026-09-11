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

    #[allow(unused_mut)]
    let mut builder = tauri::Builder::default()
        .setup(|app| {
            eprintln!("[Excalideck] Tauri application setup complete.");

            // Initialize app config directory across desktop and mobile
            let config_dir = app.path().app_config_dir()
                .or_else(|_| app.path().app_data_dir())
                .or_else(|_| app.path().app_local_data_dir())
                .ok();
            if let Some(dir) = config_dir {
                let state_handle = app.state::<Mutex<AppState>>();
                let mut state = state_handle.lock().unwrap();
                state.set_config_dir(dir);
            }
            
            // Explicitly set runtime window and taskbar icon on desktop
            #[cfg(not(any(target_os = "android", target_os = "ios")))]
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
        .plugin(tauri_plugin_process::init());

    #[cfg(not(any(target_os = "android", target_os = "ios")))]
    {
        builder = builder.plugin(tauri_plugin_updater::Builder::new().build());
    }

    builder
        .invoke_handler(tauri::generate_handler![
            commands::platform_cmds::get_platform_info,
            commands::vault_cmds::open_vault,
            commands::vault_cmds::create_vault,
            commands::vault_cmds::list_app_vaults,
            commands::vault_cmds::delete_vault,
            commands::vault_cmds::get_default_vault_path,
            commands::vault_cmds::init_default_vault,
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
            commands::updater_cmds::save_and_launch_installer,
            commands::updater_cmds::launch_installer,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
