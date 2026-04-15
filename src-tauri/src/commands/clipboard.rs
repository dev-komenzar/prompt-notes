use tauri::AppHandle;
use tauri_plugin_clipboard_manager::ClipboardExt;

fn err(code: &str, msg: impl std::fmt::Display) -> String {
    serde_json::json!({"code": code, "message": msg.to_string()}).to_string()
}

#[tauri::command]
pub fn copy_to_clipboard(app: AppHandle, text: String) -> Result<serde_json::Value, String> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| err("CLIPBOARD_FAILED", e))?;
    Ok(serde_json::json!({"success": true}))
}
