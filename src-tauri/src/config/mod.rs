use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub notes_directory: String,
}

impl Default for AppConfig {
    fn default() -> Self {
        let dir = default_notes_directory();
        Self {
            notes_directory: dir,
        }
    }
}

fn default_notes_directory() -> String {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("promptnotes")
        .join("notes")
        .to_string_lossy()
        .to_string()
}

impl AppConfig {
    pub fn load() -> Self {
        // For now, use defaults. Could load from a config file later.
        Self::default()
    }
}
