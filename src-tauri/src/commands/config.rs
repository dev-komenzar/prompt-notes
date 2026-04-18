use crate::config::AppConfig;
use tauri::State;
use std::sync::Mutex;

#[tauri::command]
pub fn get_config(
    config: State<'_, Mutex<AppConfig>>,
) -> Result<AppConfig, String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    Ok(cfg.clone())
}

#[tauri::command]
pub fn set_config(
    new_config: AppConfig,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<(), String> {
    let mut cfg = config.lock().map_err(|e| e.to_string())?;
    *cfg = new_config;
    Ok(())
}
