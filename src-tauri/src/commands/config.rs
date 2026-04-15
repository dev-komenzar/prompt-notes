use std::sync::Mutex;
use tauri::State;

use crate::config::{self, AppConfig};
use crate::AppDataDir;

fn err(code: &str, msg: impl std::fmt::Display) -> String {
    serde_json::json!({"code": code, "message": msg.to_string()}).to_string()
}

#[tauri::command]
pub fn get_config(config: State<'_, Mutex<AppConfig>>) -> Result<AppConfig, String> {
    let cfg = config.lock().map_err(|e| err("INTERNAL", e))?;
    Ok(cfg.clone())
}

#[tauri::command]
pub fn set_config(
    notes_dir: String,
    config: State<'_, Mutex<AppConfig>>,
    app_data_dir: State<'_, AppDataDir>,
) -> Result<serde_json::Value, String> {
    let validated = config::validate_and_prepare_dir(&notes_dir)
        .map_err(|e| err("CONFIG_INVALID_DIR", e))?;
    let mut cfg = config.lock().map_err(|e| err("INTERNAL", e))?;
    cfg.notes_dir = validated;
    config::save(&app_data_dir.0, &cfg)
        .map_err(|e| err("CONFIG_WRITE_FAILED", e))?;
    Ok(serde_json::json!({"success": true}))
}
