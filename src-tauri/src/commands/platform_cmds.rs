use serde::Serialize;

#[derive(Serialize, Clone, Debug)]
#[serde(rename_all = "camelCase")]
pub struct PlatformInfo {
    pub os: String,
    pub is_mobile: bool,
    pub is_desktop: bool,
    pub default_vault_path: Option<String>,
}

#[tauri::command]
pub fn get_platform_info(app: tauri::AppHandle) -> PlatformInfo {
    let os = if cfg!(target_os = "ios") {
        "ios"
    } else if cfg!(target_os = "android") {
        "android"
    } else if cfg!(target_os = "windows") {
        "windows"
    } else if cfg!(target_os = "macos") {
        "macos"
    } else if cfg!(target_os = "linux") {
        "linux"
    } else {
        "unknown"
    };

    let is_mobile = cfg!(any(target_os = "android", target_os = "ios"));
    let is_desktop = !is_mobile;

    let default_vault_path = crate::commands::vault_cmds::get_default_vault_path(app).ok();

    PlatformInfo {
        os: os.to_string(),
        is_mobile,
        is_desktop,
        default_vault_path,
    }
}
