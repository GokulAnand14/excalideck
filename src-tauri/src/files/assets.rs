use std::path::Path;
use std::fs;
use serde_json::Value;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

fn get_extension_from_mime(mime: &str) -> &str {
    let lower = mime.to_lowercase();
    if lower.contains("jpeg") || lower.contains("jpg") {
        "jpg"
    } else if lower.contains("svg") {
        "svg"
    } else if lower.contains("webp") {
        "webp"
    } else if lower.contains("gif") {
        "gif"
    } else if lower.contains("bmp") {
        "bmp"
    } else if lower.contains("avif") {
        "avif"
    } else {
        "png"
    }
}

fn get_mime_from_ext(ext: &str) -> &str {
    match ext.to_lowercase().as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "svg" => "image/svg+xml",
        "webp" => "image/webp",
        "gif" => "image/gif",
        "bmp" => "image/bmp",
        "avif" => "image/avif",
        _ => "image/png",
    }
}

pub fn extract_assets(vault_path: &Path, content: &str) -> Result<String, String> {
    // Fast path: if no data URLs are present, return immediately without JSON parse overhead
    if !content.contains("data:") {
        return Ok(content.to_string());
    }

    let mut json: Value = serde_json::from_str(content).map_err(|e| e.to_string())?;
    let assets_dir = vault_path.join("assets");
    if !assets_dir.exists() {
        fs::create_dir_all(&assets_dir).map_err(|e| e.to_string())?;
    }
    
    if let Some(files) = json.get_mut("files").and_then(|f| f.as_object_mut()) {
        for (id, file_obj) in files.iter_mut() {
            if crate::files::security::validate_asset_id(id).is_err() {
                continue;
            }

            let maybe_data_url = file_obj
                .get("dataURL")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            if let Some(data_url) = maybe_data_url {
                if data_url.starts_with("data:") {
                    let parts: Vec<&str> = data_url.splitn(2, ',').collect();
                    if parts.len() == 2 {
                        let header = parts[0];
                        let base64_payload = parts[1];
                        let mime = header.trim_start_matches("data:").trim_end_matches(";base64");
                        let ext = get_extension_from_mime(mime);
                        
                        if let Ok(decoded) = BASE64.decode(base64_payload.trim()) {
                            let asset_name = format!("{}.{}", id, ext);
                            let asset_path = assets_dir.join(&asset_name);
                            if let Ok(canonical_assets) = assets_dir.canonicalize() {
                                if let Some(parent) = asset_path.parent() {
                                    if let Ok(canonical_parent) = parent.canonicalize() {
                                        if !canonical_parent.starts_with(&canonical_assets) {
                                            continue;
                                        }
                                    }
                                }
                            }
                            if fs::write(&asset_path, decoded).is_ok() {
                                let mime_str = get_mime_from_ext(ext).to_string();
                                if let Some(map) = file_obj.as_object_mut() {
                                    map.insert("assetPath".to_string(), Value::String(asset_name));
                                    map.insert("dataURL".to_string(), Value::String(String::new()));
                                    map.insert("mimeType".to_string(), Value::String(mime_str));
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    serde_json::to_string(&json).map_err(|e| e.to_string())
}

pub fn inject_assets(vault_path: &Path, content: &str) -> Result<String, String> {
    // Fast path: if no asset paths are present, return immediately without JSON parse overhead
    if !content.contains("assetPath") {
        return Ok(content.to_string());
    }

    let mut json: Value = serde_json::from_str(content).map_err(|e| e.to_string())?;
    let assets_dir = vault_path.join("assets");
    let legacy_assets_dir = vault_path.join(".excalideck").join("assets");
    
    if let Some(files) = json.get_mut("files").and_then(|f| f.as_object_mut()) {
        for (_id, file_obj) in files.iter_mut() {
            let maybe_asset_path = file_obj
                .get("assetPath")
                .and_then(|v| v.as_str())
                .map(|s| s.to_string());

            if let Some(asset_path_val) = maybe_asset_path {
                let sanitized_ref = match crate::files::security::sanitize_asset_ref(&asset_path_val) {
                    Ok(r) => r,
                    Err(_) => continue,
                };

                let asset_path = if assets_dir.join(&sanitized_ref).exists() {
                    assets_dir.join(&sanitized_ref)
                } else {
                    legacy_assets_dir.join(&sanitized_ref)
                };

                // Canonical boundary check to guarantee file is inside assets directory
                if let Ok(canonical_file) = asset_path.canonicalize() {
                    let in_primary = assets_dir.canonicalize().map(|p| canonical_file.starts_with(&p)).unwrap_or(false);
                    let in_legacy = legacy_assets_dir.canonicalize().map(|p| canonical_file.starts_with(&p)).unwrap_or(false);
                    if !in_primary && !in_legacy {
                        continue;
                    }

                    if let Ok(data) = fs::read(&canonical_file) {
                        let ext = canonical_file.extension().and_then(|e| e.to_str()).unwrap_or("png");
                        let mime = get_mime_from_ext(ext);
                        let data_url = format!("data:{};base64,{}", mime, BASE64.encode(data));
                        if let Some(map) = file_obj.as_object_mut() {
                            map.insert("dataURL".to_string(), Value::String(data_url));
                            map.insert("mimeType".to_string(), Value::String(mime.to_string()));
                        }
                    }
                }
            }
        }
    }
    serde_json::to_string(&json).map_err(|e| e.to_string())
}
