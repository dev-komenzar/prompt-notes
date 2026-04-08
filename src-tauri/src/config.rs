// Application configuration management
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::AppHandle;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub notes_directory: String,
    pub default_filter_days: u32,
}

impl Default for AppConfig {
    fn default() -> Self {
        // Default notes directory: ~/promptnotes
        let default_dir = dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("promptnotes");
        Self {
            notes_directory: default_dir.to_string_lossy().to_string(),
            default_filter_days: 7,
        }
    }
}

static CONFIG: once_cell::sync::Lazy<Mutex<AppConfig>> =
    once_cell::sync::Lazy::new(|| Mutex::new(AppConfig::default()));

fn config_path(app_handle: &AppHandle) -> PathBuf {
    let app_dir = app_handle
        .path()
        .app_config_dir()
        .unwrap_or_else(|_| PathBuf::from("."));
    app_dir.join("config.json")
}

pub fn init_config(app_handle: &AppHandle) -> Result<(), String> {
    let path = config_path(app_handle);
    if path.exists() {
        let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let cfg: AppConfig = serde_json::from_str(&data).unwrap_or_default();
        let mut config = CONFIG.lock().map_err(|e| e.to_string())?;
        *config = cfg;
    } else {
        // Ensure the config directory exists
        if let Some(parent) = path.parent() {
            let _ = fs::create_dir_all(parent);
        }
        save_config_to_disk(app_handle)?;
    }

    // Ensure notes directory exists
    let notes_dir = {
        let config = CONFIG.lock().map_err(|e| e.to_string())?;
        config.notes_directory.clone()
    };
    let notes_path = PathBuf::from(&notes_dir);
    if !notes_path.exists() {
        fs::create_dir_all(&notes_path).map_err(|e| e.to_string())?;
    }

    Ok(())
}

fn save_config_to_disk(app_handle: &AppHandle) -> Result<(), String> {
    let path = config_path(app_handle);
    let config = CONFIG.lock().map_err(|e| e.to_string())?;
    let data = serde_json::to_string_pretty(&*config).map_err(|e| e.to_string())?;
    if let Some(parent) = path.parent() {
        let _ = fs::create_dir_all(parent);
    }
    fs::write(&path, data).map_err(|e| e.to_string())?;
    Ok(())
}

pub fn get_current_config() -> Result<AppConfig, String> {
    let config = CONFIG.lock().map_err(|e| e.to_string())?;
    Ok(config.clone())
}

pub fn update_config(app_handle: &AppHandle, updates: serde_json::Value) -> Result<(), String> {
    {
        let mut config = CONFIG.lock().map_err(|e| e.to_string())?;
        if let Some(dir) = updates.get("notes_directory").and_then(|v| v.as_str()) {
            config.notes_directory = dir.to_string();
            // Ensure new directory exists
            let path = PathBuf::from(dir);
            if !path.exists() {
                fs::create_dir_all(&path).map_err(|e| e.to_string())?;
            }
        }
        if let Some(days) = updates.get("default_filter_days").and_then(|v| v.as_u64()) {
            config.default_filter_days = days as u32;
        }
    }
    save_config_to_disk(app_handle)?;
    Ok(())
}

pub fn get_notes_directory() -> Result<PathBuf, String> {
    let config = CONFIG.lock().map_err(|e| e.to_string())?;
    Ok(PathBuf::from(&config.notes_directory))
}
