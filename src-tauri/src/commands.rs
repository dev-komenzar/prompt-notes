// Tauri IPC command handlers – thin wrappers around notes module

use crate::config;
use crate::notes;

#[tauri::command]
pub fn create_note(
    content: Option<String>,
    tags: Option<Vec<String>>,
) -> Result<notes::CreateNoteResult, String> {
    notes::create_note(content, tags)
}

#[tauri::command]
pub fn save_note(filename: String, content: String) -> Result<(), String> {
    notes::save_note(&filename, &content)
}

#[tauri::command]
pub fn read_note(filename: String) -> Result<String, String> {
    notes::read_note(&filename)
}

#[tauri::command]
pub fn delete_note(filename: String) -> Result<(), String> {
    notes::delete_note(&filename)
}

#[tauri::command]
pub fn list_notes(params: notes::ListNotesParams) -> Result<Vec<notes::NoteEntry>, String> {
    notes::list_notes(params)
}

#[tauri::command]
pub fn search_notes(params: notes::SearchNotesParams) -> Result<Vec<notes::NoteEntry>, String> {
    notes::search_notes(params)
}

#[tauri::command]
pub fn get_config() -> Result<config::AppConfig, String> {
    config::get_current_config()
}

#[tauri::command]
pub fn set_config(
    app_handle: tauri::AppHandle,
    config: serde_json::Value,
) -> Result<(), String> {
    config::update_config(&app_handle, config)
}

#[tauri::command]
pub fn get_all_tags() -> Result<Vec<String>, String> {
    notes::get_all_tags()
}
