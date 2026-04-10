use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub notes_dir: String,
}

impl Default for Config {
    fn default() -> Self {
        let default_dir = dirs::home_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("promptnotes");
        Config {
            notes_dir: default_dir.to_string_lossy().to_string(),
        }
    }
}

impl Config {
    fn config_path() -> PathBuf {
        dirs::config_dir()
            .unwrap_or_else(|| PathBuf::from("."))
            .join("promptnotes")
            .join("config.json")
    }

    pub fn load() -> Self {
        let path = Self::config_path();
        if path.exists() {
            let content = fs::read_to_string(&path).unwrap_or_default();
            serde_json::from_str(&content).unwrap_or_default()
        } else {
            let config = Config::default();
            config.save().ok();
            config
        }
    }

    pub fn save(&self) -> Result<(), String> {
        let path = Self::config_path();
        if let Some(parent) = path.parent() {
            fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let json = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        fs::write(&path, json).map_err(|e| e.to_string())
    }

    pub fn notes_path(&self) -> PathBuf {
        let expanded = shellexpand_simple(&self.notes_dir);
        PathBuf::from(expanded)
    }
}

fn shellexpand_simple(path: &str) -> String {
    if path.starts_with("~/") {
        if let Some(home) = dirs::home_dir() {
            return format!("{}{}", home.display(), &path[1..]);
        }
    }
    path.to_string()
}
