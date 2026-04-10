use crate::config::Config;
use crate::notes;
use std::fs;

#[tauri::command]
pub fn create_note(body: String, tags: Vec<String>) -> Result<notes::CreateNoteResult, String> {
    let config = Config::load();
    let dir = config.notes_path();
    notes::ensure_dir(&dir)?;

    let filename = notes::generate_filename();
    let raw = notes::build_raw(&body, &tags);
    let path = dir.join(&filename);

    fs::write(&path, &raw).map_err(|e| format!("Failed to write note: {}", e))?;

    Ok(notes::CreateNoteResult { filename })
}

#[tauri::command]
pub fn save_note(filename: String, body: String, tags: Vec<String>) -> Result<(), String> {
    let config = Config::load();
    let dir = config.notes_path();
    let path = dir.join(&filename);

    if !path.exists() {
        return Err(format!("Note not found: {}", filename));
    }

    let raw = notes::build_raw(&body, &tags);
    fs::write(&path, &raw).map_err(|e| format!("Failed to save note: {}", e))
}

#[tauri::command]
pub fn read_note(filename: String) -> Result<notes::ReadNoteResult, String> {
    let config = Config::load();
    let dir = config.notes_path();
    let path = dir.join(&filename);

    let raw =
        fs::read_to_string(&path).map_err(|e| format!("Failed to read note {}: {}", filename, e))?;
    let (tags, body) = notes::parse_raw(&raw);

    Ok(notes::ReadNoteResult { raw, tags, body })
}

#[tauri::command]
pub fn list_notes(
    date_from: Option<String>,
    date_to: Option<String>,
    tags: Option<Vec<String>>,
) -> Result<Vec<notes::NoteEntry>, String> {
    let config = Config::load();
    let dir = config.notes_path();
    notes::list_notes_in_dir(
        &dir,
        date_from.as_deref(),
        date_to.as_deref(),
        tags.as_deref(),
    )
}

#[tauri::command]
pub fn search_notes(
    query: String,
    date_from: Option<String>,
    date_to: Option<String>,
    tags: Option<Vec<String>>,
) -> Result<Vec<notes::NoteEntry>, String> {
    let config = Config::load();
    let dir = config.notes_path();
    notes::search_notes_in_dir(
        &dir,
        &query,
        date_from.as_deref(),
        date_to.as_deref(),
        tags.as_deref(),
    )
}

#[tauri::command]
pub fn delete_note(filename: String) -> Result<(), String> {
    let config = Config::load();
    let dir = config.notes_path();
    let path = dir.join(&filename);

    if !path.exists() {
        return Err(format!("Note not found: {}", filename));
    }

    fs::remove_file(&path).map_err(|e| format!("Failed to delete note: {}", e))
}

#[tauri::command]
pub fn get_settings() -> Result<Config, String> {
    Ok(Config::load())
}

#[tauri::command]
pub fn update_settings(config: Config) -> Result<(), String> {
    config.save()
}
