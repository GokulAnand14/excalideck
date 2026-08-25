use std::path::Path;
use std::fs;
use serde_json::Value;
use base64::{Engine as _, engine::general_purpose::STANDARD as BASE64};

pub fn extract_assets(vault_path: &Path, content: &str) -> Result<String, String> {
    // Fast path: if no data URLs are present, return immediately without JSON parse overhead
    if !content.contains("data:") {
        return Ok(content.to_string());
    }

    let mut json: Value = serde_json::from_str(content).map_err(|e| e.to_string())?;
    let assets_dir = vault_path.join(".excalideck").join("assets");
    if !assets_dir.exists() {
        fs::create_dir_all(&assets_dir).map_err(|e| e.to_string())?;
    }
    
    if let Some(files) = json.get_mut("files").and_then(|f| f.as_object_mut()) {
        for (id, file_obj) in files.iter_mut() {
            if let Some(data_url) = file_obj.get("dataURL").and_then(|v| v.as_str()) {
                if data_url.starts_with("data:") {
                    let parts: Vec<&str> = data_url.split(',').collect();
                    if parts.len() == 2 {
                        let mime = parts[0].replace("data:", "").replace(";base64", "");
                        let ext = mime.split('/').last().unwrap_or("png");
                        if let Ok(decoded) = BASE64.decode(parts[1]) {
                            let asset_name = format!("{}.{}", id, ext);
                            let asset_path = assets_dir.join(&asset_name);
                            if fs::write(&asset_path, decoded).is_ok() {
                                file_obj.as_object_mut().unwrap().insert("assetPath".to_string(), Value::String(asset_name));
                                file_obj.as_object_mut().unwrap().insert("dataURL".to_string(), Value::String(String::new()));
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
    let assets_dir = vault_path.join(".excalideck").join("assets");
    
    if let Some(files) = json.get_mut("files").and_then(|f| f.as_object_mut()) {
        for (_id, file_obj) in files.iter_mut() {
            if let Some(asset_path_val) = file_obj.get("assetPath").and_then(|v| v.as_str()) {
                let asset_path = assets_dir.join(asset_path_val);
                if let Ok(data) = fs::read(&asset_path) {
                    let ext = asset_path.extension().and_then(|e| e.to_str()).unwrap_or("png");
                    let mime = format!("image/{}", ext);
                    let data_url = format!("data:{};base64,{}", mime, BASE64.encode(data));
                    file_obj.as_object_mut().unwrap().insert("dataURL".to_string(), Value::String(data_url));
                }
            }
        }
    }
    serde_json::to_string(&json).map_err(|e| e.to_string())
}
