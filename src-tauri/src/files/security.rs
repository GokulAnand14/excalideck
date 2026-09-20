use std::path::{Path, PathBuf, Component};

/// Resolves and validates a relative path inside a vault.
/// Guarantees that the resulting path cannot escape `vault_path` via `..`, symlinks, or absolute components.
pub fn resolve_vault_path(vault_path: &Path, rel_path: &str) -> Result<PathBuf, String> {
    if rel_path.contains('\0') {
        return Err("Null bytes not allowed in path".to_string());
    }

    let clean = rel_path.trim_start_matches('/').trim_start_matches('\\').trim();
    if clean.is_empty() || clean == "." {
        return Ok(vault_path.to_path_buf());
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
        Ok(canonical_target)
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

        Ok(target)
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
