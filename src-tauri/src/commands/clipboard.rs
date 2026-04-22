use crate::error::{CommandResult, TauriCommandError};
use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

#[tauri::command]
pub fn copy_to_clipboard(app: AppHandle, text: String) -> CommandResult<()> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| TauriCommandError::clipboard_failed(e.to_string()))
}
