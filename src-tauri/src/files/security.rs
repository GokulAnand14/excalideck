use std::path::{Path, PathBuf, Component};

/// Strips Windows verbatim prefix (`\\?\` or `\\?\UNC\`) to prevent prefix mismatch during path operations
pub fn strip_verbatim_prefix(path: &Path) -> PathBuf {
    #[cfg(windows)]
    {
        let s = path.to_string_lossy();
        if let Some(stripped) = s.strip_prefix(r"\\?\UNC\") {
            return PathBuf::from(format!(r"\\{}", stripped));
        }
        if let Some(stripped) = s.strip_prefix(r"\\?\") {
            return PathBuf::from(stripped);
        }
    }
    path.to_path_buf()
}

/// Computes the relative path of `full_path` inside `vault_path`, normalized with forward slashes.
/// Robust against Windows verbatim `\\?\` prefixes and drive letter casing.
pub fn relative_to_vault(vault_path: &Path, full_path: &Path) -> Result<String, String> {
    let clean_vault = strip_verbatim_prefix(vault_path);
    let clean_full = strip_verbatim_prefix(full_path);

    if let Ok(rel) = clean_full.strip_prefix(&clean_vault) {
        let s = rel.to_string_lossy().to_string().replace('\\', "/");
        return Ok(s.trim_start_matches('/').to_string());
    }

    if let (Ok(can_vault), Ok(can_full)) = (vault_path.canonicalize(), full_path.canonicalize()) {
        let clean_can_vault = strip_verbatim_prefix(&can_vault);
        let clean_can_full = strip_verbatim_prefix(&can_full);
        if let Ok(rel) = clean_can_full.strip_prefix(&clean_can_vault) {
            let s = rel.to_string_lossy().to_string().replace('\\', "/");
            return Ok(s.trim_start_matches('/').to_string());
        }
    }

    #[cfg(windows)]
    {
        let v_str = clean_vault.to_string_lossy().replace('\\', "/");
        let f_str = clean_full.to_string_lossy().replace('\\', "/");
        if f_str.to_lowercase().starts_with(&v_str.to_lowercase()) {
            let rel = &f_str[v_str.len()..];
            return Ok(rel.trim_start_matches('/').to_string());
        }
    }

    Err(format!(
        "Path {:?} is not within vault {:?}",
        full_path, vault_path
    ))
}

/// Resolves and validates a relative path inside a vault.
/// Guarantees that the resulting path cannot escape `vault_path` via `..`, symlinks, or absolute components.
pub fn resolve_vault_path(vault_path: &Path, rel_path: &str) -> Result<PathBuf, String> {
    if rel_path.contains('\0') {
        return Err("Null bytes not allowed in path".to_string());
    }

    let clean = rel_path.trim_start_matches('/').trim_start_matches('\\').trim();
    if clean.is_empty() || clean == "." {
        return Ok(strip_verbatim_prefix(vault_path));
    }

    let rel_buf = Path::new(clean);
    for component in rel_buf.components() {
        match component {
            Component::ParentDir => {
                return Err("Path traversal (..) not allowed".to_string());
            }
            Component::RootDir | Component::Prefix(_) => {
                return Err("Absolute paths not allowed".to_string());
            }
            Component::Normal(seg) => {
                let seg_str = seg.to_string_lossy();
                if seg_str.contains("..") {
                    return Err("Invalid path segment".to_string());
                }
            }
            _ => {}
        }
    }

    let target = vault_path.join(rel_buf);

    let canonical_vault = vault_path
        .canonicalize()
        .map_err(|e| format!("Invalid vault path: {}", e))?;

    if target.exists() {
        let canonical_target = target
            .canonicalize()
            .map_err(|e| format!("Invalid target path: {}", e))?;
        if !canonical_target.starts_with(&canonical_vault) {
            return Err("Target path escapes vault boundary".to_string());
        }
        Ok(strip_verbatim_prefix(&canonical_target))
    } else {
        // For new files or directories, find the nearest existing parent and verify it is inside the vault
        let mut check_ancestor = target.as_path();
        while !check_ancestor.exists() {
            if let Some(parent) = check_ancestor.parent() {
                check_ancestor = parent;
            } else {
                break;
            }
        }

        if check_ancestor.exists() {
            let canonical_ancestor = check_ancestor
                .canonicalize()
                .map_err(|e| format!("Invalid ancestor path: {}", e))?;
            if !canonical_ancestor.starts_with(&canonical_vault) {
                return Err("Target path escapes vault boundary".to_string());
            }
        }

        Ok(strip_verbatim_prefix(&target))
    }
}

/// Validates that an asset ID contains only safe alphanumeric or hyphen/underscore characters.
pub fn validate_asset_id(id: &str) -> Result<(), String> {
    if id.is_empty() {
        return Err("Asset ID cannot be empty".to_string());
    }
    if !id.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_') {
        return Err("Asset ID contains invalid characters".to_string());
    }
    Ok(())
}

/// Validates that an asset path value (from JSON) does not traverse directories.
pub fn sanitize_asset_ref(path_val: &str) -> Result<String, String> {
    let clean = path_val.trim();
    if clean.is_empty() {
        return Err("Asset path reference cannot be empty".to_string());
    }
    if clean.contains('/') || clean.contains('\\') || clean.contains("..") || clean.contains('\0') {
        return Err("Asset reference contains illegal directory traversal characters".to_string());
    }
    Ok(clean.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    #[test]
    fn test_resolve_and_strip_prefix() {
        let temp_dir = std::env::temp_dir().join("excalideck_test_vault");
        let _ = fs::create_dir_all(&temp_dir);
        let test_file = temp_dir.join("test.excalidraw");
        let _ = fs::write(&test_file, "{}");

        let resolved = resolve_vault_path(&temp_dir, "test.excalidraw").unwrap();
        println!("temp_dir: {:?}", temp_dir);
        println!("resolved: {:?}", resolved);
        
        let rel = relative_to_vault(&temp_dir, &resolved).unwrap();
        println!("relative_to_vault: {:?}", rel);

        let _ = fs::remove_dir_all(&temp_dir);
        assert_eq!(rel, "test.excalidraw");
    }
}


