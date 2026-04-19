use serde::{Deserialize, Serialize};
use std::path::Path;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppConfig {
    pub notes_directory: String,
}

impl AppConfig {
    pub fn from_app_data_dir(app_data_dir: &Path) -> Self {
        let notes_directory = app_data_dir
            .join("notes")
            .to_string_lossy()
            .to_string();
        Self { notes_directory }
    }
}
