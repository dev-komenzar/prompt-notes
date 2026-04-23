use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

use crate::error::TauriCommandError;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub notes_directory: String,
}

impl AppConfig {
    pub fn from_app_data_dir(app_data_dir: &Path) -> Result<Self, String> {
        let config_path = app_data_dir.join("config.json");
        match fs::read_to_string(&config_path) {
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => {
                let notes_directory = app_data_dir
                    .join("notes")
                    .to_string_lossy()
                    .to_string();
                let default_cfg = Self { notes_directory };
                let _ = default_cfg.save(app_data_dir);
                Ok(default_cfg)
            }
            Err(e) => Err(format!("CONFIG_READ_FAILED: {}", e)),
            Ok(content) => {
                serde_json::from_str::<AppConfig>(&content)
                    .map_err(|e| format!("CONFIG_PARSE_FAILED: {}", e))
            }
        }
    }

    pub fn save(&self, app_data_dir: &Path) -> Result<(), TauriCommandError> {
        let config_path = app_data_dir.join("config.json");
        let tmp_path = app_data_dir.join("config.json.tmp");
        let json = serde_json::to_string_pretty(self)
            .map_err(|e| TauriCommandError::config_write_failed(format!("serialize: {}", e)))?;
        fs::write(&tmp_path, json.as_bytes())
            .map_err(|e| TauriCommandError::config_write_failed(format!("write tmp: {}", e)))?;
        // fsync on tmp (best-effort on platforms lacking sync_data)
        if let Ok(file) = fs::OpenOptions::new().write(true).open(&tmp_path) {
            let _ = file.sync_all();
        }
        fs::rename(&tmp_path, &config_path)
            .map_err(|e| TauriCommandError::config_write_failed(format!("rename: {}", e)))?;
        Ok(())
    }
}

pub fn validate_notes_directory(path: &Path) -> Result<PathBuf, TauriCommandError> {
    // 1. canonical 化
    let canonical = match path.canonicalize() {
        Ok(p) => p,
        Err(_) => {
            // 存在しない場合は作成を試みる
            fs::create_dir_all(path)
                .map_err(|e| TauriCommandError::config_invalid_dir(format!("create: {}", e)))?;
            path.canonicalize()
                .map_err(|e| TauriCommandError::config_invalid_dir(format!("canonicalize: {}", e)))?
        }
    };

    // 2. is_dir 確認
    if !canonical.is_dir() {
        return Err(TauriCommandError::config_invalid_dir(format!(
            "not a directory: {}",
            canonical.display()
        )));
    }

    // 3. 書き込みプローブ (.write_probe ファイルを一瞬作る)
    let probe = canonical.join(".write_probe");
    fs::write(&probe, b"")
        .map_err(|e| TauriCommandError::config_invalid_dir(format!("write probe: {}", e)))?;
    let _ = fs::remove_file(&probe);

    Ok(canonical)
}
