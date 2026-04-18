use crate::config::AppConfig;
use crate::storage::file_manager::FileManager;
use crate::storage::frontmatter;
use crate::storage::search;
use serde::{Deserialize, Serialize};
use tauri::State;
use std::sync::Mutex;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NoteMetadata {
    pub filename: String,
    pub title: String,
    pub tags: Vec<String>,
    pub created_at: String,
    pub updated_at: String,
    pub body_preview: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ListNotesResult {
    pub notes: Vec<NoteMetadata>,
    pub total_count: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchResultEntry {
    pub metadata: NoteMetadata,
    pub matched_line: String,
    pub line_number: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SearchNotesResult {
    pub results: Vec<SearchResultEntry>,
    pub total_count: usize,
}

fn build_metadata(filename: &str, content: &str) -> NoteMetadata {
    let parsed = frontmatter::parse(content);
    let body = frontmatter::extract_body(content);
    let preview: String = body.chars().take(100).collect();

    let created_at = crate::storage::file_manager::filename_to_datetime(filename)
        .unwrap_or_default();

    NoteMetadata {
        filename: filename.to_string(),
        title: String::new(),
        tags: parsed.tags,
        created_at: created_at.clone(),
        updated_at: created_at,
        body_preview: preview,
    }
}

#[tauri::command]
pub fn create_note(
    tags: Vec<String>,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<NoteMetadata, String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    let filename = fm.generate_filename();
    let content = frontmatter::generate(&tags, "");
    fm.write(&filename, &content).map_err(|e| e.to_string())?;
    Ok(build_metadata(&filename, &content))
}

#[tauri::command]
pub fn save_note(
    filename: String,
    raw_content: String,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<NoteMetadata, String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    fm.write(&filename, &raw_content)
        .map_err(|e| e.to_string())?;
    Ok(build_metadata(&filename, &raw_content))
}

#[tauri::command]
pub fn read_note(
    filename: String,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<String, String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    fm.read(&filename).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn list_notes(
    offset: usize,
    limit: usize,
    tags: Option<Vec<String>>,
    from_date: Option<String>,
    to_date: Option<String>,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<ListNotesResult, String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    let all_files = fm.list_files().map_err(|e| e.to_string())?;

    let mut notes: Vec<NoteMetadata> = Vec::new();
    for filename in &all_files {
        let content = match fm.read(filename) {
            Ok(c) => c,
            Err(_) => continue,
        };
        let meta = build_metadata(filename, &content);

        // Filter by tags
        if let Some(ref filter_tags) = tags {
            if !filter_tags.iter().all(|t| meta.tags.contains(t)) {
                continue;
            }
        }

        // Filter by date range
        if let Some(ref from) = from_date {
            if meta.created_at < *from {
                continue;
            }
        }
        if let Some(ref to) = to_date {
            if meta.created_at > *to {
                continue;
            }
        }

        notes.push(meta);
    }

    // Sort by created_at descending
    notes.sort_by(|a, b| b.created_at.cmp(&a.created_at));

    let total_count = notes.len();
    let paginated: Vec<NoteMetadata> = notes.into_iter().skip(offset).take(limit).collect();

    Ok(ListNotesResult {
        notes: paginated,
        total_count,
    })
}

#[tauri::command]
pub fn search_notes(
    query: String,
    offset: usize,
    limit: usize,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<SearchNotesResult, String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    let results = search::full_scan(&fm, &query).map_err(|e| e.to_string())?;

    let total_count = results.len();
    let paginated: Vec<SearchResultEntry> = results.into_iter().skip(offset).take(limit).collect();

    Ok(SearchNotesResult {
        results: paginated,
        total_count,
    })
}

#[tauri::command]
pub fn trash_note(
    filename: String,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<(), String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    let path = fm.file_path(&filename);
    trash::delete(&path).map_err(|e| format!("TrashNotAvailable: {}", e))
}

#[tauri::command]
pub fn force_delete_note(
    filename: String,
    config: State<'_, Mutex<AppConfig>>,
) -> Result<(), String> {
    let cfg = config.lock().map_err(|e| e.to_string())?;
    let fm = FileManager::new(&cfg.notes_directory);
    fm.delete(&filename).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn move_notes(
    from_dir: String,
    to_dir: String,
) -> Result<usize, String> {
    let from_fm = FileManager::new(&from_dir);
    let to_fm = FileManager::new(&to_dir);

    to_fm.ensure_directory().map_err(|e| e.to_string())?;

    let files = from_fm.list_files().map_err(|e| e.to_string())?;
    let mut moved = 0;

    for filename in &files {
        let content = from_fm.read(filename).map_err(|e| e.to_string())?;
        to_fm.write(filename, &content).map_err(|e| e.to_string())?;
        from_fm.delete(filename).map_err(|e| e.to_string())?;
        moved += 1;
    }

    Ok(moved)
}
