use serde::Serialize;

#[derive(Debug, Clone, Serialize)]
pub struct TauriCommandError {
    pub code: String,
    pub message: String,
}

impl TauriCommandError {
    pub fn new(code: impl Into<String>, message: impl Into<String>) -> Self {
        Self { code: code.into(), message: message.into() }
    }

    pub fn storage_not_found(detail: impl Into<String>) -> Self {
        Self::new("STORAGE_NOT_FOUND", detail)
    }
    pub fn storage_invalid_filename(detail: impl Into<String>) -> Self {
        Self::new("STORAGE_INVALID_FILENAME", detail)
    }
    pub fn storage_write_failed(detail: impl Into<String>) -> Self {
        Self::new("STORAGE_WRITE_FAILED", detail)
    }
    pub fn storage_read_failed(detail: impl Into<String>) -> Self {
        Self::new("STORAGE_READ_FAILED", detail)
    }
    pub fn storage_path_traversal(detail: impl Into<String>) -> Self {
        Self::new("STORAGE_PATH_TRAVERSAL", detail)
    }
    pub fn storage_frontmatter_parse(detail: impl Into<String>) -> Self {
        Self::new("STORAGE_FRONTMATTER_PARSE", detail)
    }
    pub fn config_invalid_dir(detail: impl Into<String>) -> Self {
        Self::new("CONFIG_INVALID_DIR", detail)
    }
    pub fn config_write_failed(detail: impl Into<String>) -> Self {
        Self::new("CONFIG_WRITE_FAILED", detail)
    }
    pub fn clipboard_failed(detail: impl Into<String>) -> Self {
        Self::new("CLIPBOARD_FAILED", detail)
    }
    pub fn trash_failed(detail: impl Into<String>) -> Self {
        Self::new("TRASH_FAILED", detail)
    }
    pub fn internal(detail: impl Into<String>) -> Self {
        Self::new("INTERNAL", detail)
    }
}

pub type CommandResult<T> = Result<T, TauriCommandError>;
