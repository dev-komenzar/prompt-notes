use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct CommandError {
    pub code: String,
    pub message: String,
}

impl CommandError {
    pub fn new(code: &str, message: impl Into<String>) -> Self {
        Self {
            code: code.to_string(),
            message: message.into(),
        }
    }

    pub fn storage_not_found(filename: &str) -> Self {
        Self::new("STORAGE_NOT_FOUND", format!("Note not found: {}", filename))
    }

    pub fn storage_invalid_filename(filename: &str) -> Self {
        Self::new(
            "STORAGE_INVALID_FILENAME",
            format!("Invalid filename: {}", filename),
        )
    }

    pub fn storage_write_failed(err: impl std::fmt::Display) -> Self {
        Self::new("STORAGE_WRITE_FAILED", format!("Write failed: {}", err))
    }

    pub fn storage_read_failed(err: impl std::fmt::Display) -> Self {
        Self::new("STORAGE_READ_FAILED", format!("Read failed: {}", err))
    }

    pub fn storage_path_traversal() -> Self {
        Self::new("STORAGE_PATH_TRAVERSAL", "Path traversal detected")
    }

    pub fn storage_frontmatter_parse(err: impl std::fmt::Display) -> Self {
        Self::new(
            "STORAGE_FRONTMATTER_PARSE",
            format!("Frontmatter parse error: {}", err),
        )
    }

    pub fn config_invalid_dir(path: &str) -> Self {
        Self::new(
            "CONFIG_INVALID_DIR",
            format!("Invalid notes directory: {}", path),
        )
    }

    pub fn config_write_failed(err: impl std::fmt::Display) -> Self {
        Self::new("CONFIG_WRITE_FAILED", format!("Config write failed: {}", err))
    }

    pub fn clipboard_failed(err: impl std::fmt::Display) -> Self {
        Self::new("CLIPBOARD_FAILED", format!("Clipboard error: {}", err))
    }

    pub fn trash_failed(err: impl std::fmt::Display) -> Self {
        Self::new("TRASH_FAILED", format!("Trash failed: {}", err))
    }
}

impl std::fmt::Display for CommandError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "[{}] {}", self.code, self.message)
    }
}

impl std::error::Error for CommandError {}
