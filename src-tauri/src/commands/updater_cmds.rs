use std::path::Path;

#[tauri::command]
pub async fn launch_installer(file_path: String) -> Result<(), String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Err(format!("Installer file does not exist at: {}", file_path));
    }

    #[cfg(target_os = "windows")]
    {
        std::process::Command::new(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to launch installer: {}", e))?;
        
        // Give the spawned installer process a brief moment to initialize before terminating
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        std::process::exit(0);
    }

    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to open macOS package: {}", e))?;
        Ok(())
    }

    #[cfg(target_os = "linux")]
    {
        let _ = std::process::Command::new("chmod")
            .arg("+x")
            .arg(&file_path)
            .status();

        std::process::Command::new(&file_path)
            .spawn()
            .map_err(|e| format!("Failed to launch Linux package: {}", e))?;
        
        tokio::time::sleep(std::time::Duration::from_millis(500)).await;
        std::process::exit(0);
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        Err("Unsupported operating system for installer execution".to_string())
    }
}

#[tauri::command]
pub async fn save_and_launch_installer(file_name: String, data: Vec<u8>) -> Result<(), String> {
    let temp_dir = std::env::temp_dir().join("excalideck_updates");
    std::fs::create_dir_all(&temp_dir).map_err(|e| format!("Failed to create temp directory: {}", e))?;
    let target_path = temp_dir.join(&file_name);

    std::fs::write(&target_path, data).map_err(|e| format!("Failed to write installer file: {}", e))?;

    launch_installer(target_path.to_string_lossy().to_string()).await
}
