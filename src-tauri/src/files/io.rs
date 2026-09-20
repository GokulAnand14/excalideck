use std::fs::{self, File};
use std::io::Write;
use std::path::Path;
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
