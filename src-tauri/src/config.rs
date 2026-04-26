use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::error::CommandError;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub notes_directory: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SetConfigParams {
    pub notes_dir: String,
    pub move_existing: bool,
}

#[derive(Debug, Serialize, Clone)]
pub struct SetConfigResult {
    pub moved_count: u32,
    pub remaining_in_old: u32,
}

/// Get the config file path: `<app_data_dir>/config.json`
pub fn config_path(app: &AppHandle) -> Result<PathBuf, CommandError> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| CommandError::config_write_failed(e))?;
    Ok(data_dir.join("config.json"))
}

/// Get the default notes directory
pub fn default_notes_dir(app: &AppHandle) -> Result<PathBuf, CommandError> {
    let data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| CommandError::config_write_failed(e))?;
    Ok(data_dir.join("notes"))
}

/// Load config from disk, or return default
pub fn load_config(app: &AppHandle) -> Result<AppConfig, CommandError> {
    let path = config_path(app)?;
    if path.exists() {
        let content =
            fs::read_to_string(&path).map_err(|e| CommandError::config_write_failed(e))?;
        let config: AppConfig =
            serde_json::from_str(&content).map_err(|e| CommandError::config_write_failed(e))?;
        Ok(config)
    } else {
        let default_dir = default_notes_dir(app)?;
        Ok(AppConfig {
            notes_directory: default_dir.to_string_lossy().to_string(),
        })
    }
}

/// Save config to disk (3-phase: write tmp → rename → cleanup)
pub fn save_config(app: &AppHandle, config: &AppConfig) -> Result<(), CommandError> {
    let path = config_path(app)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| CommandError::config_write_failed(e))?;
    }

    let content =
        serde_json::to_string_pretty(config).map_err(|e| CommandError::config_write_failed(e))?;

    // Write to temp file first
    let tmp_path = path.with_extension("json.tmp");
    fs::write(&tmp_path, &content).map_err(|e| CommandError::config_write_failed(e))?;

    // Atomic rename
    fs::rename(&tmp_path, &path).map_err(|e| CommandError::config_write_failed(e))?;

    Ok(())
}

/// Ensure the notes directory exists on startup
pub fn ensure_notes_dir(app: &AppHandle) -> Result<(), CommandError> {
    let config = load_config(app)?;
    let notes_dir = PathBuf::from(&config.notes_directory);
    fs::create_dir_all(&notes_dir).map_err(|e| {
        CommandError::config_invalid_dir(&format!(
            "{}: {}",
            notes_dir.display(),
            e
        ))
    })?;
    Ok(())
}

/// Apply a config change: optionally move existing notes to new directory
pub fn apply_config_change(
    app: &AppHandle,
    params: &SetConfigParams,
) -> Result<SetConfigResult, CommandError> {
    let old_config = load_config(app)?;
    let old_dir = PathBuf::from(&old_config.notes_directory);
    let new_dir = PathBuf::from(&params.notes_dir);

    // Validate new directory
    fs::create_dir_all(&new_dir)
        .map_err(|e| CommandError::config_invalid_dir(&format!("{}: {}", new_dir.display(), e)))?;

    let mut moved_count: u32 = 0;
    let mut remaining_in_old: u32 = 0;

    if params.move_existing && old_dir.exists() && old_dir != new_dir {
        // Move .md files from old to new
        if let Ok(entries) = fs::read_dir(&old_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map_or(false, |ext| ext == "md") {
                    let dest = new_dir.join(entry.file_name());
                    match fs::copy(&path, &dest) {
                        Ok(_) => {
                            let _ = fs::remove_file(&path);
                            moved_count += 1;
                        }
                        Err(_) => {
                            remaining_in_old += 1;
                        }
                    }
                }
            }
        }
    }

    // Save new config
    let new_config = AppConfig {
        notes_directory: params.notes_dir.clone(),
    };
    save_config(app, &new_config)?;

    Ok(SetConfigResult {
        moved_count,
        remaining_in_old,
    })
}
