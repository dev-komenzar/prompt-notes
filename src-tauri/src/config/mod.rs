use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub notes_dir: String,
}

pub fn load_or_create(app_data_dir: &Path) -> Result<AppConfig, String> {
    let config_path = app_data_dir.join("config.json");
    if config_path.exists() {
        let content = std::fs::read_to_string(&config_path)
            .map_err(|e| format!("Failed to read config: {}", e))?;
        let cfg: AppConfig = serde_json::from_str(&content)
            .map_err(|e| format!("Failed to parse config: {}", e))?;
        if !cfg.notes_dir.is_empty() {
            return Ok(cfg);
        }
    }
    let default_notes = app_data_dir.join("notes");
    let cfg = AppConfig {
        notes_dir: default_notes.to_string_lossy().into_owned(),
    };
    std::fs::create_dir_all(app_data_dir)
        .map_err(|e| format!("Failed to create app dir: {}", e))?;
    save(app_data_dir, &cfg)?;
    Ok(cfg)
}

pub fn save(app_data_dir: &Path, config: &AppConfig) -> Result<(), String> {
    std::fs::create_dir_all(app_data_dir)
        .map_err(|e| format!("Failed to create app dir: {}", e))?;
    let json = serde_json::to_string_pretty(config)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    std::fs::write(app_data_dir.join("config.json"), json)
        .map_err(|e| format!("CONFIG_WRITE_FAILED: {}", e))
}

pub fn validate_and_prepare_dir(dir: &str) -> Result<String, String> {
    let path = PathBuf::from(dir);
    if !path.exists() {
        std::fs::create_dir_all(&path)
            .map_err(|e| format!("Cannot create directory: {}", e))?;
    }
    let canonical = path
        .canonicalize()
        .map_err(|e| format!("Cannot resolve path: {}", e))?;
    if !canonical.is_dir() {
        return Err(format!("'{}' is not a directory", dir));
    }
    let test_file = canonical.join(".promptnotes_write_test");
    std::fs::write(&test_file, b"")
        .map_err(|e| format!("Directory not writable: {}", e))?;
    std::fs::remove_file(&test_file).ok();
    Ok(canonical.to_string_lossy().into_owned())
}
