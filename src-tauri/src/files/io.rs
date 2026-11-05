use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

pub fn read_file(path: &Path) -> Result<String, String> {
    fs::read_to_string(path).map_err(|e| e.to_string())
}

pub fn write_file_atomic(path: &Path, content: &str) -> Result<(), String> {
    let parent = path.parent().ok_or("Path has no parent directory")?;
    if !parent.exists() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let file_leaf = path.file_name().unwrap_or_default().to_string_lossy();
    let tmp_name = format!(".tmp-{}-{}", Uuid::new_v4(), file_leaf);
    let tmp_path = parent.join(tmp_name);

    let write_res = (|| -> std::io::Result<()> {
        let mut file = File::create(&tmp_path)?;
        file.write_all(content.as_bytes())?;
        file.sync_all()?;
        fs::rename(&tmp_path, path)?;
        Ok(())
    })();

    if let Err(e) = write_res {
        let _ = fs::remove_file(&tmp_path);
        return Err(format!("Atomic write failed: {}", e));
    }

    Ok(())
}

pub fn backup_file_version(vault_root: &Path, file_path: &Path, max_backups: usize) -> Result<(), String> {
    if !file_path.exists() {
        return Ok(());
    }

    let rel_path = file_path
        .strip_prefix(vault_root)
        .map_err(|e| e.to_string())?;

    let backup_dir = vault_root
        .join(".excalideck")
        .join("backups")
        .join(rel_path);

    fs::create_dir_all(&backup_dir).map_err(|e| e.to_string())?;

    let now_ms = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis();

    let backup_filename = format!("{}.excalidraw", now_ms);
    let backup_path = backup_dir.join(backup_filename);

    fs::copy(file_path, backup_path).map_err(|e| e.to_string())?;

    if let Ok(entries) = fs::read_dir(&backup_dir) {
        let mut files: Vec<_> = entries
            .filter_map(|e| e.ok())
            .filter(|e| e.path().is_file())
            .collect();

        if files.len() > max_backups {
            files.sort_by_key(|e| e.file_name());
            let remove_count = files.len() - max_backups;
            for entry in files.iter().take(remove_count) {
                let _ = fs::remove_file(entry.path());
            }
        }
    }

    Ok(())
}

