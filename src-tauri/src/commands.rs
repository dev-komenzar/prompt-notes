use tauri::State;
use tauri_plugin_clipboard_manager::ClipboardExt;

use crate::config;
use crate::error::CommandError;
use crate::notes;

pub struct StartupError(pub Option<String>);

#[tauri::command]
pub async fn create_note(
    app: tauri::AppHandle,
    tags: Vec<String>,
) -> Result<notes::NoteMetadata, CommandError> {
    let cfg = config::load_config(&app)?;
    let notes_dir = std::path::PathBuf::from(&cfg.notes_directory);
    notes::create_note(&notes_dir, &tags)
}

#[tauri::command]
pub async fn save_note(
    app: tauri::AppHandle,
    filename: String,
    raw_content: String,
) -> Result<notes::NoteMetadata, CommandError> {
    let cfg = config::load_config(&app)?;
    let notes_dir = std::path::PathBuf::from(&cfg.notes_directory);
    notes::save_note(&notes_dir, &filename, &raw_content)
}

#[tauri::command]
pub async fn read_note(
    app: tauri::AppHandle,
    filename: String,
) -> Result<String, CommandError> {
    let cfg = config::load_config(&app)?;
    let notes_dir = std::path::PathBuf::from(&cfg.notes_directory);
    notes::read_note(&notes_dir, &filename)
}

#[tauri::command]
pub async fn list_notes(
    app: tauri::AppHandle,
    offset: Option<usize>,
    limit: Option<usize>,
    tags: Option<Vec<String>>,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<notes::ListNotesResult, CommandError> {
    let cfg = config::load_config(&app)?;
    let notes_dir = std::path::PathBuf::from(&cfg.notes_directory);
    notes::list_notes(
        &notes_dir,
        offset.unwrap_or(0),
        limit.unwrap_or(100),
        &tags,
        &from_date,
        &to_date,
    )
}

#[tauri::command]
pub async fn search_notes(
    app: tauri::AppHandle,
    query: String,
    offset: Option<usize>,
    limit: Option<usize>,
    tags: Option<Vec<String>>,
    from_date: Option<String>,
    to_date: Option<String>,
) -> Result<notes::SearchNotesResult, CommandError> {
    let cfg = config::load_config(&app)?;
    let notes_dir = std::path::PathBuf::from(&cfg.notes_directory);
    notes::search_notes(
        &notes_dir,
        &query,
        offset.unwrap_or(0),
        limit.unwrap_or(100),
        &tags,
        &from_date,
        &to_date,
    )
}

#[tauri::command]
pub async fn get_config(app: tauri::AppHandle) -> Result<config::AppConfig, CommandError> {
    config::load_config(&app)
}

#[tauri::command]
pub async fn set_config(
    app: tauri::AppHandle,
    params: config::SetConfigParams,
) -> Result<config::SetConfigResult, CommandError> {
    config::apply_config_change(&app, &params)
}

#[tauri::command]
pub async fn pick_notes_directory(
    app: tauri::AppHandle,
) -> Result<Option<String>, CommandError> {
    use tauri_plugin_dialog::DialogExt;
    let result = app
        .dialog()
        .file()
        .blocking_pick_folder();
    Ok(result.map(|p| p.to_string()))
}

#[tauri::command]
pub async fn trash_note(
    app: tauri::AppHandle,
    filename: String,
) -> Result<(), CommandError> {
    let cfg = config::load_config(&app)?;
    let notes_dir = std::path::PathBuf::from(&cfg.notes_directory);
    notes::trash_note(&notes_dir, &filename)
}

#[tauri::command]
pub async fn force_delete_note(
    app: tauri::AppHandle,
    filename: String,
) -> Result<(), CommandError> {
    let cfg = config::load_config(&app)?;
    let notes_dir = std::path::PathBuf::from(&cfg.notes_directory);
    notes::force_delete_note(&notes_dir, &filename)
}

#[tauri::command]
pub async fn copy_to_clipboard(
    app: tauri::AppHandle,
    text: String,
) -> Result<(), CommandError> {
    app.clipboard()
        .write_text(text)
        .map_err(|e| CommandError::clipboard_failed(e))
}

#[tauri::command]
pub async fn read_from_clipboard(
    app: tauri::AppHandle,
) -> Result<String, CommandError> {
    app.clipboard()
        .read_text()
        .map_err(|e| CommandError::clipboard_failed(e))
}

#[tauri::command]
pub async fn list_all_tags(app: tauri::AppHandle) -> Result<Vec<String>, CommandError> {
    let cfg = config::load_config(&app)?;
    let notes_dir = std::path::PathBuf::from(&cfg.notes_directory);
    notes::list_all_tags(&notes_dir)
}

#[tauri::command]
pub async fn get_startup_error(
    state: State<'_, StartupError>,
) -> Result<Option<String>, CommandError> {
    Ok(state.0.clone())
}
